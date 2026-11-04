// The checker against motions built in a temporary directory: one valid motion, then one change at a time.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PURPOSES, SPEC, listMotions, checkMotion, checkAccounts, expandTokens, parseFrontMatter, readAccounts, compareVersions, spdx, jpegSize} from '../tools/check.mjs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

/** The smallest JPEG the checker reads: a start-of-frame marker with its size, and nothing to decode. */
function jpeg(width, height) {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 255, width >> 8, width & 255, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]);
}

const color = (hex) => ({colorSpace: 'srgb', components: [0.5, 0.5, 0.5], hex});
// every motion on the hub has a scope (its author's GitHub login); UNSCOPED is the format's plainest motion
// every motion on the hub says what it is for (fit, since motion/0.4); BASE is a motion of an earlier version, without it
const BASE = {
  spec: 'motion/0.2', scope: 'tester', slug: 'test-motion', version: '1.0.0',
  name: {en: 'Test Motion', 'zh-CN': '测试风格'}, line: {en: 'A plain motion for the checker\'s tests.'},
  authors: [{name: 'Tester', github: 'tester'}], license: {text: 'CC-BY-4.0'}, tags: ['light'],
};
const FIT = {kind: 'general', for: {en: 'Any plain explainer.', 'zh-CN': '任何朴素的讲解。'}, not: {en: 'Anything loud.'}};
const MANIFEST = {...BASE, spec: 'motion/0.4', fit: FIT};
const {scope: _scope, ...UNSCOPED} = {...BASE, spec: 'motion/0.1'};
const TOKENS = {
  color: {$type: 'color', ground: {$value: color('#FFFFFF')}, ink: {$value: color('#000000')}, accent: {$value: '{color.ink}'}},
  font: {$type: 'fontFamily', sans: {$value: ['Inter', 'sans-serif']}},
  duration: {$type: 'duration', enter: {$value: {value: 0.6, unit: 's'}}},
  easing: {$type: 'cubicBezier', arrive: {$value: [0.22, 1, 0.36, 1]}},
};
const DOC = '# Test Motion\n\n## Essence\nPlain.\n\n## Colour roles\nInk on white.\n\n## Type\nOne face.\n\n## Motion 动法\nFade.\n\n## Avoid\nClutter.\n';

let root;
/** A file's content: the change's when it names one (null leaves the file out), else the default. */
const pick = (change, key, fallback, encode = (v) => v) => key in change ? (change[key] === null ? null : encode(change[key])) : encode(fallback);
function motion(change = {}) {
  root ??= mkdtempSync(join(tmpdir(), 'motions-'));
  const dir = join(root, change.dir ?? 'test-motion');
  rmSync(dir, {recursive: true, force: true});
  mkdirSync(dir, {recursive: true});
  const files = {
    'motion.json': pick(change, 'manifest', MANIFEST, JSON.stringify),
    'MOTION.md': pick(change, 'doc', DOC),
    'tokens.json': pick(change, 'tokens', TOKENS, JSON.stringify),
    'poster.jpg': pick(change, 'poster', jpeg(1920, 1080)),
    'CREDITS.md': pick(change, 'credits', 'No assets.\n'),
    ...change.extra,
  };
  for (const [name, content] of Object.entries(files)) {
    if (content === null) continue;
    mkdirSync(join(dir, name, '..'), {recursive: true});
    writeFileSync(join(dir, name), content);
  }
  return dir;
}
const codes = (dir, options) => checkMotion(dir, options).map((i) => i.code);

test('a complete motion has no issues', () => {
  assert.deepEqual(checkMotion(motion()), []);
});

test('each required file is reported when missing', () => {
  for (const file of ['motion.json', 'MOTION.md', 'tokens.json', 'poster.jpg', 'CREDITS.md']) {
    assert.ok(codes(motion({[{'motion.json': 'manifest', 'MOTION.md': 'doc', 'tokens.json': 'tokens', 'poster.jpg': 'poster', 'CREDITS.md': 'credits'}[file]]: null})).includes('format.missing'), file);
  }
});

test('only the format\'s files, translations and tool directories sit at the top', () => {
  assert.deepEqual(codes(motion({extra: {'MOTION.zh-CN.md': DOC, 'react/parts/frame.tsx': 'export const Frame = () => null;\n'}, manifest: {...MANIFEST, license: {text: 'CC-BY-4.0', code: 'MIT'}}})), []);
  assert.ok(codes(motion({extra: {'notes.txt': 'hi'}})).includes('format.extra'));
  assert.ok(codes(motion({extra: {'React/a.txt': 'hi'}})).includes('format.extra'));
});

test('in the catalogue the directory is the id; a project\'s copy may be named otherwise', () => {
  assert.ok(codes(motion({dir: 'motions/@tester/other-name'})).includes('hub.slug'));
  assert.deepEqual(codes(motion({dir: 'motions/@tester/test-motion'})).filter((c) => c.endsWith('slug')), []);
  assert.deepEqual(codes(motion({dir: 'project/motion'})).filter((c) => c.endsWith('slug')), []);
});

test('the manifest\'s members, slug, version, localized strings and licence', () => {
  const bad = (manifest) => codes(motion({manifest: {...MANIFEST, ...manifest}}), {hub: false});
  assert.ok(bad({spec: 'motion/9.9'}).includes('manifest.spec'));
  assert.ok(bad({slug: 'Other'}).includes('manifest.slug'));
  assert.ok(bad({version: '1.0'}).includes('manifest.version'));
  assert.ok(bad({name: {'zh-CN': '只有中文'}}).includes('manifest.name'));
  assert.ok(bad({line: {en: 'x'.repeat(161)}}).includes('manifest.line'));
  assert.ok(bad({authors: [{name: 'A', github: '-bad-'}]}).includes('manifest.authors'));
  assert.ok(bad({license: {text: 'CC BY'}}).includes('manifest.license'));
  assert.ok(bad({lang: 'chinese simplified'}).includes('manifest.lang'));
  assert.ok(bad({tags: ['Hand Drawn']}).includes('manifest.tags'));
  assert.ok(bad({official: true}).includes('manifest.member'));
  assert.deepEqual(bad({'x-remotion': {pacing: {lead: 0.4}}, lang: 'zh-CN'}), []);
});

test('a scope is a lowercase GitHub username, since motion/0.2, and a catalogue keeps a motion at motions/<id>/', () => {
  const scoped = {...BASE, spec: 'motion/0.2', scope: 'tester'};
  const listed = {...MANIFEST, scope: 'tester'};
  assert.deepEqual(codes(motion({manifest: scoped}), {hub: false}), []);
  assert.deepEqual(codes(motion({manifest: {...UNSCOPED, spec: 'motion/0.2'}}), {hub: false}), [], 'the format lets a 0.2 motion be unscoped');
  assert.ok(codes(motion({manifest: {...scoped, spec: 'motion/0.1'}}), {hub: false}).includes('manifest.member'), 'scope is not a 0.1 member');
  assert.ok(codes(motion({manifest: {...scoped, scope: 'Tester'}}), {hub: false}).includes('manifest.scope'));
  assert.ok(codes(motion({manifest: {...scoped, scope: '-x'}}), {hub: false}).includes('manifest.scope'));
  assert.deepEqual(codes(motion({dir: 'motions/@tester/test-motion', manifest: listed})), []);
  assert.ok(codes(motion({dir: 'motions/@other/test-motion', manifest: listed})).includes('hub.slug'));
  assert.ok(codes(motion({dir: 'motions/@tester/test-motion', manifest: UNSCOPED})).includes('hub.slug'), 'an unscoped motion is not kept under a scope');
  assert.ok(codes(motion({dir: 'motions/test-motion', manifest: listed})).includes('hub.slug'), 'a scoped motion is not kept at the top');
  assert.deepEqual(codes(motion({dir: 'project/motion', manifest: scoped}), {hub: false}), [], 'a copy in a project may be named otherwise');
});

test('basedOn names the motions this one builds on, since motion/0.3, and in the catalogue they are there', () => {
  const based = {...MANIFEST, scope: 'tester', basedOn: [{id: 'red-pencil', version: '1.0.2'}, {id: '@ana/ledger'}]};
  const fmt = (m) => codes(motion({manifest: m}), {hub: false});
  assert.deepEqual(fmt(based), []);
  assert.ok(fmt({...based, spec: 'motion/0.2'}).includes('manifest.member'), 'basedOn is not a 0.2 member');
  assert.ok(fmt({...based, basedOn: []}).includes('manifest.basedOn'));
  assert.ok(fmt({...based, basedOn: ['red-pencil']}).includes('manifest.basedOn'), 'an entry is {id, version}');
  assert.ok(fmt({...based, basedOn: [{id: 'Red Pencil'}]}).includes('manifest.basedOn'));
  assert.ok(fmt({...based, basedOn: [{id: 'red-pencil', version: 'one'}]}).includes('manifest.basedOn'));
  assert.ok(fmt({...based, basedOn: [{id: 'red-pencil', why: 'x'}]}).includes('manifest.basedOn'));
  assert.ok(fmt({...based, basedOn: [{id: 'red-pencil'}, {id: 'red-pencil'}]}).includes('manifest.basedOn'));
  assert.ok(fmt({...based, basedOn: [{id: '@tester/test-motion'}]}).includes('manifest.basedOn'), 'not based on itself');
  // in the catalogue, each must be a motion there
  motion({dir: 'motions/red-pencil', manifest: {...MANIFEST, slug: 'red-pencil'}});
  const inCatalogue = (m) => codes(motion({dir: 'motions/@tester/test-motion', manifest: m}));
  assert.deepEqual(inCatalogue({...based, basedOn: [{id: 'red-pencil'}]}), []);
  assert.ok(inCatalogue(based).includes('hub.basedOn'), '@ana/ledger is not in the catalogue');
  assert.deepEqual(codes(motion({dir: 'project/motion', manifest: based})), [], 'outside a catalogue there is nothing to look up');
});

test('every motion on the hub has a scope, and only its owner publishes a new one', () => {
  assert.ok(codes(motion({manifest: UNSCOPED})).includes('hub.scope'), 'an unscoped motion is not accepted, whoever opens it');
  assert.ok(codes(motion({manifest: UNSCOPED}), {author: 'Tester'}).includes('hub.scope'));
  assert.deepEqual(codes(motion({manifest: UNSCOPED}), {hub: false}), [], 'the format itself allows it');
  assert.deepEqual(codes(motion(), {author: 'Tester'}), [], 'the scope compares without regard to case');
  const other = {...MANIFEST, authors: [...MANIFEST.authors, {name: 'Bo', github: 'bo'}]};
  assert.ok(codes(motion({manifest: other}), {author: 'bo'}).includes('hub.scope'), 'a co-author does not publish under another scope');
  assert.deepEqual(codes(motion(), {hub: true}), [], 'with no pull request author there is nothing to compare');
  assert.deepEqual(codes(motion({manifest: {...MANIFEST, version: '1.0.1'}}), {author: 'Tester', was: MANIFEST}), [], 'a change is the published authors\' (checkUpdate)');
});

test('fit says what a motion is for, since motion/0.4, and every motion on the hub has it', () => {
  const fmt = (m) => codes(motion({manifest: m}), {hub: false});
  assert.deepEqual(fmt(MANIFEST), []);
  assert.deepEqual(fmt({...MANIFEST, fit: {kind: 'overlay', for: {en: 'Labels over your own footage.'}}}), [], 'not is optional');
  assert.ok(fmt({...MANIFEST, spec: 'motion/0.3'}).includes('manifest.member'), 'fit is not a 0.3 member');
  assert.ok(fmt({...MANIFEST, fit: 'general'}).includes('manifest.fit'));
  assert.ok(fmt({...MANIFEST, fit: {...FIT, kind: 'niche'}}).includes('manifest.fit'));
  assert.ok(fmt({...MANIFEST, fit: {kind: 'topic'}}).includes('manifest.fit'), 'for is required');
  assert.ok(fmt({...MANIFEST, fit: {...FIT, for: {'zh-CN': '只有中文'}}}).includes('manifest.fit'), 'for has en');
  assert.ok(fmt({...MANIFEST, fit: {...FIT, not: {en: 'x'.repeat(201)}}}).includes('manifest.fit'));
  assert.ok(fmt({...MANIFEST, fit: {...FIT, needs: {en: 'footage'}}}).includes('manifest.fit'));
  assert.ok(codes(motion({manifest: {...BASE, spec: 'motion/0.3'}})).includes('hub.fit'), 'the hub asks for it');
  assert.deepEqual(fmt({...BASE, spec: 'motion/0.3'}), [], 'the format does not');
});

test('a component\'s meta names its purpose in the hub\'s words', () => {
  const part = (src) => codes(motion({extra: {'react/parts/a.tsx': src}, manifest: {...MANIFEST, license: {text: 'CC-BY-4.0', code: 'MIT'}}}));
  assert.deepEqual(part("export const meta = {name: {en: 'A'}, purpose: 'compare', line: 'x'};\nexport const A = () => null;\n"), []);
  assert.ok(part("export const meta = {name: {en: 'A'}, purpose: 'comparison'};\n").includes('hub.purpose'));
  assert.ok(part("export const meta = {name: {en: 'A'}};\n").includes('hub.purpose'));
  assert.deepEqual(part('export const helper = 1;\n'), [], 'a file without meta is a helper');
});

test('code in a tool directory needs license.code', () => {
  assert.ok(codes(motion({extra: {'react/parts/frame.tsx': 'export const Frame = () => null;\n'}})).includes('format.license.code'));
});

test('tokens follow DTCG: required groups, types, values, aliases and no URLs', () => {
  const bad = (tokens) => codes(motion({tokens}), {hub: false});
  assert.ok(bad({...TOKENS, font: undefined}).includes('tokens.required'));
  assert.ok(bad({...TOKENS, color: {$type: 'color', ink: {$value: '#000000'}}}).includes('tokens.value'));
  assert.ok(bad({...TOKENS, color: {...TOKENS.color, link: {$value: '{color.missing}'}}}).includes('tokens.alias'));
  assert.ok(bad({...TOKENS, easing: {$type: 'cubicBezier', arrive: {$value: [1.5, 0, 0, 1]}}}).includes('tokens.value'));
  assert.ok(bad({...TOKENS, duration: {$type: 'duration', enter: {$value: 600}}}).includes('tokens.value'));
  assert.ok(bad({...TOKENS, font: {$type: 'fontFamily', sans: {$value: 'https://example.com/font.woff2'}}}).includes('tokens.url'));
  assert.ok(bad({...TOKENS, 'brand.colour': {$type: 'color', a: {$value: color('#000000')}}}).includes('tokens.name'));
});

test('MOTION.md needs its five headings, in any language after the English word', () => {
  assert.ok(codes(motion({doc: '## Essence\n## Colour\n## Type\n## Motion\n'}), {hub: false}).includes('doc.heading'));
  assert.deepEqual(codes(motion({doc: '## Essence 本质\n## Color\n## Type 字体\n## Motion\n## Avoid 避免\n'}), {hub: false}), []);
  assert.ok(codes(motion({doc: '```\n## Avoid\n```\n## Essence\n## Colour\n## Type\n## Motion\n'}), {hub: false}).includes('doc.heading'));
  assert.ok(codes(motion({doc: DOC + 'x'.repeat(17000)}), {hub: false}).includes('doc.size'));
  assert.ok(codes(motion({extra: {'MOTION.zh-CN.md': '## 本质\n'}}), {hub: false}).includes('doc.heading'));
});

test('the poster is a JPEG of a sensible width and size', () => {
  assert.deepEqual(jpegSize(jpeg(1920, 1080)), {width: 1920, height: 1080});
  assert.ok(codes(motion({poster: Buffer.from('not a jpeg')}), {hub: false}).includes('poster.format'));
  assert.ok(codes(motion({poster: jpeg(640, 360)}), {hub: false}).includes('poster.size'));
});

test('an empty CREDITS.md is reported', () => {
  assert.ok(codes(motion({credits: '  \n'}), {hub: false}).includes('format.credits'));
});

test('SPDX expressions', () => {
  for (const ok of ['MIT', 'CC-BY-4.0', 'MIT OR Apache-2.0', '(MIT AND CC-BY-4.0)', 'GPL-2.0+ WITH Classpath-exception-2.0', 'LicenseRef-Own']) assert.ok(spdx(ok), ok);
  for (const bad of ['', 'MIT OR', 'MIT AND (CC0-1.0', 'CC BY', 'AND']) assert.ok(!spdx(bad), bad);
});

test('the hub\'s rules: licences, author, size, media and unsafe code', () => {
  const hub = (change, options) => codes(motion(change), options);
  assert.ok(hub({manifest: {...MANIFEST, license: {text: 'CC-BY-NC-4.0'}}}).includes('hub.license'));
  assert.ok(hub({}, {author: 'someone-else'}).includes('hub.author'));
  assert.deepEqual(hub({}, {author: 'Tester'}), []);
  assert.ok(hub({extra: {'react/demo/clip.mp4': 'x'}}).includes('hub.video'));
  assert.ok(hub({extra: {'react/node_modules/a.js': ''}, manifest: {...MANIFEST, license: {text: 'CC-BY-4.0', code: 'MIT'}}}).includes('hub.build'));
  assert.ok(hub({extra: {'react/big.bin': Buffer.alloc(1024 * 1024 + 1)}}).includes('hub.size'));
  // names a package and a git tree carry the same everywhere
  assert.ok(hub({extra: {'react/my file.tsx': ''}}).includes('hub.path'));
  assert.ok(hub({extra: {'react/图.png': ''}}).includes('hub.path'));
  assert.ok(hub({extra: {'react/A.js': '', 'react/a.js': ''}}).includes('hub.path'));
  assert.ok(!hub({extra: {'react/a_b-1.@x.js': ''}}).includes('hub.path'));
  const code = (src) => hub({extra: {'react/parts/a.tsx': src}, manifest: {...MANIFEST, license: {text: 'CC-BY-4.0', code: 'MIT'}}});
  for (const src of ['fetch("/x")', 'new WebSocket(u)', 'eval(s)', 'new Function("a")', 'setTimeout("go()", 1)', 'await import("./x")', 'document.cookie', 'localStorage.setItem(a, b)']) {
    assert.ok(code(src).includes('hub.code'), src);
  }
  assert.deepEqual(code('import {useMemo} from "react";\nexport const A = () => null;\n'), []);
  assert.ok(hub({extra: {'react/icon.svg': '<svg><script>alert(1)</script></svg>'}}).includes('hub.code'));
  assert.deepEqual(codes(motion({manifest: {...MANIFEST, license: {text: 'CC-BY-NC-4.0'}}}), {hub: false}), []);
});

test('a change to a published motion comes from one of its authors, with a higher version', () => {
  const was = {...MANIFEST, version: '1.2.0', authors: [{name: 'Tester', github: 'tester'}]};
  const update = (version, author) => codes(motion({manifest: {...MANIFEST, version, authors: [{name: 'Tester', github: 'tester'}, {name: 'New', github: 'newcomer'}]}}), {author, was});
  assert.deepEqual(update('1.2.1', 'Tester'), []);
  assert.ok(update('1.2.1', 'newcomer').includes('hub.owner'), 'adding yourself to the authors does not make the motion yours');
  assert.ok(update('1.2.0', 'tester').includes('hub.version'));
  assert.ok(update('1.1.9', 'tester').includes('hub.version'));
  assert.deepEqual(codes(motion({manifest: {...MANIFEST, version: '1.0.0'}}), {hub: false, was}), [], 'the format alone knows nothing of what is published');
});

test('who owns a scope and a motion is decided by the GitHub account\'s id, not its login', () => {
  // tester (id 7) published @tester/test-motion, then renamed the account to tess; someone else (id 99) took "tester"
  const accounts = new Map([['tester', 7], ['tess', 7]]);
  const was = {...MANIFEST, version: '1.0.0'};
  const next = {...MANIFEST, version: '1.0.1'};
  assert.deepEqual(codes(motion({manifest: next}), {author: 'tess', authorId: 7, was, accounts}), [], 'renamed, the author still changes their motion');
  assert.deepEqual(codes(motion({manifest: {...next, authors: [{name: 'Tess', github: 'tess'}]}}), {author: 'tess', authorId: 7, was, accounts}), [], 'and may credit it to the new login');
  assert.deepEqual(codes(motion({manifest: {...MANIFEST, slug: 'second', dir: undefined}, dir: 'second'}), {author: 'tess', authorId: 7, accounts}), [], 'and publish a new one under the old scope');
  const taken = codes(motion({manifest: next}), {author: 'tester', authorId: 99, was, accounts});
  assert.ok(taken.includes('hub.owner'), 'whoever takes the old login does not get the motion');
  assert.ok(taken.includes('hub.author'));
  assert.ok(codes(motion({manifest: {...MANIFEST, slug: 'second'}, dir: 'second'}), {author: 'tester', authorId: 99, accounts}).includes('hub.scope'), 'nor the scope');
  assert.deepEqual(codes(motion({manifest: next}), {author: 'tester', was}), [], 'with no accounts to look up (a motion checked outside this repository) the login decides');
});

test('in this repository every login a motion names is recorded', () => {
  const unrecorded = checkMotion(motion(), {author: 'tester', authorId: 7, accounts: new Map()});
  assert.deepEqual(unrecorded.map((i) => i.code), ['hub.account']);
  assert.match(unrecorded[0].message, /accounts\/tester\.json with \{"login": "tester", "id": 7\}/, 'it says what to add, with the opener\'s own id');
  const coauthor = {...MANIFEST, authors: [...MANIFEST.authors, {name: 'Bo', github: 'Bo'}]};
  assert.deepEqual(codes(motion({manifest: coauthor}), {author: 'tester', authorId: 7, accounts: new Map([['tester', 7]])}), ['hub.account'], 'a co-author too, in lowercase');
  assert.deepEqual(codes(motion({manifest: coauthor}), {author: 'tester', authorId: 7, accounts: new Map([['tester', 7], ['bo', 8]])}), []);
});

test('an account is recorded once and never changes, and an added one is what GitHub says', async () => {
  const dir = (records) => {
    const d = mkdtempSync(join(tmpdir(), 'accounts-'));
    for (const [name, content] of Object.entries(records)) writeFileSync(join(d, name), typeof content === 'string' ? content : JSON.stringify(content));
    return d;
  };
  const before = dir({'tester.json': {login: 'tester', id: 7}});
  const lookup = async (login) => ({tester: 99, tess: 7, ana: 12})[login];
  const at = async (records) => (await checkAccounts(dir(records), {was: before, lookup})).map((i) => `${i.at} ${i.code}`);
  assert.deepEqual(await at({'tester.json': {login: 'tester', id: 7}, 'tess.json': {login: 'tess', id: 7}}), [], 'a rename is a new record with the same id');
  assert.deepEqual(await at({'tester.json': {login: 'tester', id: 99}}), ['tester.json hub.accounts'], 'a record is never changed, even to what GitHub says now');
  assert.deepEqual(await at({}), ['tester.json hub.accounts'], 'nor removed');
  assert.deepEqual(await at({'tester.json': {login: 'tester', id: 7}, 'ana.json': {login: 'ana', id: 13}}), ['ana.json hub.accounts'], 'an added record names the id GitHub gives that login');
  assert.deepEqual(await at({'tester.json': {login: 'tester', id: 7}, 'nobody.json': {login: 'nobody', id: 5}}), ['nobody.json hub.accounts'], 'one GitHub cannot confirm is not taken');
  for (const bad of [{'Ana.json': {login: 'Ana', id: 12}}, {'ana.json': {login: 'ana', id: '12'}}, {'ana.json': {login: 'bo', id: 12}}, {'ana.json': {login: 'ana', id: 12, name: 'Ana'}}, {'ana.json': '{'}, {'ana.txt': 'x'}]) {
    assert.ok((await checkAccounts(dir(bad))).some((i) => i.code === 'hub.accounts'), JSON.stringify(bad));
  }
  assert.deepEqual([...readAccounts(dir({'tess.json': {login: 'tess', id: 7}, 'ana.json': '{'}))], [['tess', 7]]);
  assert.deepEqual(await checkAccounts(join(tmpdir(), 'no-such-accounts')), []);
});

test('this repository records every account its motions name', async () => {
  const repo = fileURLToPath(new URL('..', import.meta.url));
  assert.deepEqual(await checkAccounts(join(repo, 'accounts')), []);
  assert.equal(readAccounts(join(repo, 'accounts')).get('iamsuosi'), 264293696);
});

test('semantic versions compare by precedence', () => {
  const order = ['1.0.0-alpha', '1.0.0-alpha.1', '1.0.0-alpha.beta', '1.0.0-beta', '1.0.0-beta.2', '1.0.0-beta.11', '1.0.0-rc.1', '1.0.0', '1.0.1', '1.1.0', '2.0.0'];
  for (let i = 1; i < order.length; i++) assert.ok(compareVersions(order[i], order[i - 1]) > 0, `${order[i]} > ${order[i - 1]}`);
  assert.equal(compareVersions('1.0.0+build.1', '1.0.0'), 0);
});

test('the motionhub command checks the current motion, and says how it is used', () => {
  const bin = fileURLToPath(new URL('../bin/motionhub.mjs', import.meta.url));
  const dir = motion();
  assert.match(execFileSync(process.execPath, [bin, 'check'], {cwd: dir, encoding: 'utf8'}), /1 motion\(s\), 0 issue\(s\)/);
  assert.match(execFileSync(process.execPath, [bin, '--help'], {encoding: 'utf8'}), /usage: motionhub check/);
  assert.throws(() => execFileSync(process.execPath, [bin, 'check', '--author', 'someone-else'], {cwd: dir, stdio: 'pipe'}));
});

test('a reel has a default export and runs at most 30 seconds', () => {
  const reel = (src) => codes(motion({extra: {'react/reel.tsx': src}, manifest: {...MANIFEST, license: {text: 'CC-BY-4.0', code: 'MIT'}}}));
  assert.deepEqual(reel('export const reel = {seconds: 20};\nexport default function Reel() { return null; }\n').filter((c) => c === 'hub.reel'), []);
  assert.ok(reel('export const reel = {seconds: 45};\nexport default function Reel() { return null; }\n').includes('hub.reel'));
  assert.ok(reel('export function Reel() { return null; }\n').includes('hub.reel'));
});

test('a motion\'s own faces are WOFF2, named in fonts.json and credited', () => {
  const WOFF2 = Buffer.concat([Buffer.from('wOF2', 'latin1'), Buffer.alloc(60)]);
  const faces = (extra, credits = 'Pixel Face: SIL Open Font License 1.1\n') => codes(motion({credits, extra: {'react/fonts/pixel.woff2': WOFF2, ...extra}}));
  const list = JSON.stringify([{family: 'Pixel Face', file: 'pixel.woff2', weight: '400', style: 'normal'}]);
  assert.deepEqual(faces({'react/fonts/fonts.json': list}).filter((c) => c === 'hub.font'), []);
  assert.ok(faces({}).includes('hub.font'));
  assert.ok(faces({'react/fonts/fonts.json': list}, 'No assets.\n').includes('hub.font'));
  assert.ok(faces({'react/fonts/fonts.json': list, 'react/fonts/other.ttf': 'x'}).includes('hub.font'));
});

test('a motion\'s sound names only roles, voices and instruments the synthesiser has', () => {
  const sound = (json) => codes(motion({extra: {'react/sound.json': JSON.stringify(json)}}));
  assert.deepEqual(sound({bpm: 90, kit: ['kick'], roles: {land: {voice: 'click'}}}).filter((c) => c === 'hub.sound'), []);
  assert.ok(sound({kit: ['banjo']}).includes('hub.sound'));
  assert.ok(sound({roles: {land: {voice: 'violin'}}}).includes('hub.sound'));
  assert.ok(sound({roles: {jump: {voice: 'click'}}}).includes('hub.sound'));
});

// motion/0.5: a motion in one file (SPEC.md §11)
const SECTIONS = '# A look\n\n## Essence\nE.\n\n## Colour\nC.\n\n## Type\nT.\n\n## Motion\nM.\n\n## Avoid\nA.\n';
const FRONT = 'spec: motion/0.5\nname: A look\ntokens:\n  color:\n    ground: "#FFFFFF"\n    ink: "#000000"\n    title: "{color.ink}"\n  font:\n    sans: ["Inter", "sans-serif"]\n';
function oneFile(text) {
  const dir = mkdtempSync(join(tmpdir(), 'motion-one-'));
  writeFileSync(join(dir, 'MOTION.md'), text);
  return dir;
}

test('a MOTION.md with front matter is a motion on its own, as a file or in a project', () => {
  const dir = oneFile(`---\n${FRONT}---\n\n${SECTIONS}`);
  writeFileSync(join(dir, 'package.json'), '{}');
  assert.deepEqual(checkMotion(join(dir, 'MOTION.md'), {hub: false}), []);
  assert.deepEqual(checkMotion(dir, {hub: false}), [], 'other files in a project are not its business');
  assert.deepEqual(codes(dir), ['hub.directory'], 'the hub still wants a directory');
  rmSync(dir, {recursive: true});
});

test('a motion in one file needs its members, its sections and its values', () => {
  const check = (front, body = SECTIONS) => {
    const dir = oneFile(`---\n${front}---\n\n${body}`);
    const found = codes(join(dir, 'MOTION.md'), {hub: false});
    rmSync(dir, {recursive: true});
    return found;
  };
  assert.ok(check(FRONT.replace('spec: motion/0.5', 'spec: motion/0.4')).includes('doc.spec'));
  assert.ok(check(FRONT.replace('name: A look\n', '')).includes('doc.name'));
  assert.ok(check(FRONT.replace('name: A look', `name: ${'x'.repeat(61)}`)).includes('doc.name'));
  assert.ok(check('spec: motion/0.5\nname: A look\n').includes('tokens.required'));
  assert.ok(check(FRONT.replace('  font:\n    sans: ["Inter", "sans-serif"]\n', '')).includes('tokens.required'));
  assert.ok(check(FRONT.replace('"#FFFFFF"', '"white"')).includes('tokens.value'));
  assert.ok(check(FRONT.replace('{color.ink}', '{color.none}')).includes('tokens.alias'));
  assert.ok(check(`${FRONT}other: x\n`).includes('doc.frontmatter'));
  assert.deepEqual(check(`${FRONT}x-remotion: y\nlang: zh-CN\n`), []);
  assert.ok(check(FRONT, SECTIONS.replace('## Motion\nM.\n\n', '')).includes('doc.heading'), 'motion is never optional');
  assert.ok(check(`${FRONT}  sizes:\n    a: 1\n`).includes('tokens.group'));
  const none = oneFile(SECTIONS);
  assert.ok(codes(join(none, 'MOTION.md'), {hub: false}).includes('doc.frontmatter'));
  rmSync(none, {recursive: true});
});

test('front matter is a small part of YAML, and anything else in it is refused', () => {
  assert.deepEqual(parseFrontMatter('---\n# a note\na: b\nc:\n  d: "#FFF"\n  e: [1, "f"]\ng: h # why\n---\nbody').data, {a: 'b', c: {d: '#FFF', e: [1, 'f']}, g: 'h'});
  assert.equal(parseFrontMatter('---\na: b\n---\nbody').body, 'body');
  assert.equal(parseFrontMatter('# no front matter\n'), null);
  assert.deepEqual(parseFrontMatter('\uFEFF---\na: b\n---\n').data, {a: 'b'}, 'a byte-order mark is not front matter');
  for (const text of ['a: &x y', 'a: *x', 'a: |', 'a: >', 'a: {b: c}', "a: 'b'", 'a: #FFF', '- a', 'a: [b]', 'a: b\na: c', ' a: b', '\ta: b', 'a:\n    b: c'])
    assert.throws(() => parseFrontMatter(`---\n${text}\n---\n`), undefined, text);
});

test('the short form of tokens stands for the same tokens as tokens.json', () => {
  const issues = [];
  const long = expandTokens({color: {ink: '#1B2A47', title: '{color.ink}'}, font: {sans: ['Inter', 'sans-serif']}, duration: {enter: '0.6s', fast: '200ms'}, easing: {arrive: [0.22, 1, 0.36, 1]}}, (code, at, message) => issues.push(message));
  assert.deepEqual(issues, []);
  assert.deepEqual(long.color.ink.$value, {colorSpace: 'srgb', components: [0.1059, 0.1647, 0.2784], hex: '#1B2A47'});
  assert.equal(long.color.$type, 'color');
  assert.equal(long.color.title.$value, '{color.ink}');
  assert.deepEqual(long.font, {$type: 'fontFamily', sans: {$value: ['Inter', 'sans-serif']}});
  assert.deepEqual(long.duration.enter.$value, {value: 0.6, unit: 's'});
  assert.deepEqual(long.duration.fast.$value, {value: 200, unit: 'ms'});
  assert.deepEqual(long.easing, {$type: 'cubicBezier', arrive: {$value: [0.22, 1, 0.36, 1]}});
});

// the specification and the checker say the same thing
const SPEC_TEXT = readFileSync(fileURLToPath(new URL('../SPEC.md', import.meta.url)), 'utf8');

test('the specification names the version the checker knows, and its example passes', () => {
  assert.ok(SPEC_TEXT.includes(`**Version:** \`${SPEC}\``));
  const example = /```markdown\n(---[\s\S]*?\n---)\n/.exec(SPEC_TEXT)[1];
  const dir = oneFile(`${example}\n\n${SECTIONS}`);
  assert.deepEqual(checkMotion(join(dir, 'MOTION.md'), {hub: false}), []);
  rmSync(dir, {recursive: true});
  for (const purpose of PURPOSES) assert.ok(SPEC_TEXT.split('## 12.')[1].includes(`\`${purpose}\``), purpose);
});

test('the guide\'s one-file example is a valid motion', () => {
  const guide = readFileSync(fileURLToPath(new URL('../docs/motion-md.md', import.meta.url)), 'utf8');
  const dir = oneFile(`${/```markdown\n(---[\s\S]*?)\n```/.exec(guide)[1]}\n`);
  assert.deepEqual(checkMotion(join(dir, 'MOTION.md'), {hub: false}), []);
  rmSync(dir, {recursive: true});
});

// motion/0.5: a motion in a directory, held to §12
const PART = (extra = '', meta = "export const meta = {name: 'Title', purpose: 'title', line: 'A title.', fits: 'A title.', params: {}, preview: 'title.jpg'};") => `import React from 'react';\nimport {useTime} from '@motionhub/runtime';\nimport * as THREE from 'three';\nimport {helper} from './helper';\n${extra}\n${meta}\nexport default function Title() { return null; }\n`;
function raised(extra, part = PART(), doc) {
  const dir = mkdtempSync(join(tmpdir(), 'motion-05-'));
  cpSync(fileURLToPath(new URL('../motions/@iamsuosi/lab-notebook', import.meta.url)), dir, {recursive: true});
  const manifest = JSON.parse(readFileSync(join(dir, 'motion.json'), 'utf8'));
  writeFileSync(join(dir, 'motion.json'), JSON.stringify({...manifest, spec: 'motion/0.5', ...extra}));
  rmSync(join(dir, 'react/parts'), {recursive: true});
  mkdirSync(join(dir, 'react/parts'));
  writeFileSync(join(dir, 'react/parts/title.tsx'), part);
  if (doc) writeFileSync(join(dir, 'MOTION.md'), doc(readFileSync(join(dir, 'MOTION.md'), 'utf8')));
  const found = codes(dir, {hub: false});
  rmSync(dir, {recursive: true});
  return found;
}

test('a motion/0.5 directory is held to the rules for components; an earlier one is not', () => {
  assert.deepEqual(raised(), []);
  assert.ok(raised({}, PART("import x from 'lodash';")).includes('react.import'));
  assert.ok(raised({}, PART("import 'left-pad';")).includes('react.import'));
  assert.ok(raised({}, PART("export {y} from 'lodash';")).includes('react.import'));
  assert.ok(raised({}, `import React from 'react'; import x from 'lodash';\n${PART()}`).includes('react.import'), 'a second import on one line');
  assert.ok(raised({}, `const a = 1; export {b} from 'lodash';\n${PART()}`).includes('react.import'));
  assert.ok(raised({}, PART('', '')).includes('react.meta'));
  const below = "export const meta = {name: 'T', purpose: 'title', line: 'l'};\nconst other = {fits: 1, params: {}, preview: 2};";
  assert.ok(raised({}, PART('', below)).includes('react.meta'), 'a key below the literal is not in it');
  const nested = "export const meta = {name: 'T', purpose: 'title', line: 'l', fits: 'f', params: {preview: {type: 'string', doc: 'd'}}};";
  assert.ok(raised({}, PART('', nested)).includes('react.meta'), 'a key inside params is not one of its own');
  assert.ok(raised({}, PART('', "export const meta = {name: 'T}', purpose: 'title', line: 'a: {b', fits: 'f', params: {}, preview: 'p'};")).length === 0, 'braces in a string are text');
  assert.ok(raised({}, PART('', 'export const meta = makeMeta();')).includes('react.meta'), 'it is a literal');
  assert.ok(raised({}, PART('', "export const meta = {name: 'Title', purpose: 'title'};")).includes('react.meta'));
  assert.ok(raised({}, PART('', "export const meta = {name: 'T', purpose: 'nope', line: 'l', fits: 'f', params: {}, preview: 'p'};")).includes('react.meta'));
  assert.ok(raised({}, PART(), (t) => t.replace(/^## Components.*$/m, '## Parts')).includes('doc.heading'));
  assert.deepEqual(raised({spec: 'motion/0.4'}, PART("import x from 'lodash';"), (t) => t.replace(/^## Components.*$/m, '## Parts')), [], 'a published version keeps its meaning');
});

test('every motion in the catalogue holds when raised to motion/0.5', () => {
  const root = fileURLToPath(new URL('../motions', import.meta.url));
  const dirs = listMotions(root);
  assert.ok(dirs.length > 0);
  for (const d of dirs) {
    const dir = mkdtempSync(join(tmpdir(), 'motion-raised-'));
    cpSync(join(root, d), dir, {recursive: true});
    const manifest = JSON.parse(readFileSync(join(dir, 'motion.json'), 'utf8'));
    writeFileSync(join(dir, 'motion.json'), JSON.stringify({...manifest, spec: 'motion/0.5'}));
    assert.deepEqual(checkMotion(dir, {hub: false}), [], d);
    rmSync(dir, {recursive: true});
  }
});

test('a motion in a directory keeps its values in tokens.json alone', () => {
  assert.ok(raised({}, PART(), (t) => `---\nname: A look\ntokens:\n  color:\n    a: "#000000"\n---\n\n${t}`).includes('doc.tokens'));
  assert.deepEqual(raised({}, PART(), (t) => `---\nname: A look\n---\n\n${t}`), []);
  assert.ok(raised({}, PART(), (t) => `---\na: &x y\n---\n\n${t}`).includes('doc.frontmatter'));
});

test('main\'s checker judges a pull request\'s files: its accounts by --accounts, its commits by --signoff', async () => {
  const {main, unsigned} = await import('../tools/check.mjs');
  const commit = (sha, message, parents = 1) => ({sha, commit: {message}, parents: Array.from({length: parents}, () => ({}))});
  assert.deepEqual(unsigned([
    commit('a', 'Add a motion\n\nSigned-off-by: Ana <ana@example.com>'),
    commit('b', 'Fix a typo'),
    commit('c', 'Merge main', 2),
    commit('d', 'Mentions Signed-off-by: in passing'),
    commit('e', 'Signed-off-by: Ana <ana@example.com>'),
  ]), ['b', 'd', 'e'], 'a sign-off is its own line under the subject; a merge commit is left out');

  const dir = mkdtempSync(join(tmpdir(), 'ownership-'));
  const pr = join(dir, 'pr');
  cpSync(motion(), join(pr, 'motions', '@tester', 'test-motion'), {recursive: true});
  mkdirSync(join(pr, 'accounts'), {recursive: true});
  const log = console.log, lines = [];
  console.log = (l) => lines.push(l);
  try {
    const run = (...args) => { lines.length = 0; return main([join(pr, 'motions', '@tester', 'test-motion'), '--author', 'tester', '--author-id', '7', ...args]); };
    assert.equal(await run('--accounts', join(pr, 'accounts')), 1, 'judged by the pull request\'s accounts: tester is not recorded there');
    assert.ok(lines.some((l) => l.includes('hub.account')));
    writeFileSync(join(pr, 'accounts', 'tester.json'), JSON.stringify({login: 'tester', id: 7}));
    assert.equal(await run('--accounts', join(pr, 'accounts')), 0, 'recorded with the opener\'s id');
    writeFileSync(join(pr, 'accounts', 'tester.json'), JSON.stringify({login: 'tester', id: 99}));
    assert.equal(await run('--accounts', join(pr, 'accounts')), 1, 'the scope belongs to another account');
    assert.ok(lines.some((l) => l.includes('hub.scope')));
    const commits = join(dir, 'commits.json');
    writeFileSync(commits, JSON.stringify([commit('b', 'Fix a typo')]));
    assert.equal(await main(['--signoff', commits]), 1);
    writeFileSync(commits, JSON.stringify([commit('a', 'x\n\nSigned-off-by: T <t@example.com>')]));
    assert.equal(await main(['--signoff', commits]), 0);
  } finally { console.log = log; }
});

test('main\'s checker on a pull request: its new accounts, links refused, motions taken out only by an author', async () => {
  const {main, checkRemoval, links} = await import('../tools/check.mjs');
  const {symlinkSync} = await import('node:fs');
  const dir = mkdtempSync(join(tmpdir(), 'ownership-'));
  const was = join(dir, 'was'), now = join(dir, 'now');
  mkdirSync(was); mkdirSync(now);
  writeFileSync(join(was, 'tester.json'), JSON.stringify({login: 'tester', id: 7}));
  writeFileSync(join(now, 'tester.json'), JSON.stringify({login: 'tester', id: 7}));
  const log = console.log;
  console.log = () => {};
  try {
    assert.equal(await main(['--accounts-was', was, '--accounts', now]), 0, 'nothing added, nothing to ask GitHub');
    writeFileSync(join(now, 'tester.json'), JSON.stringify({login: 'tester', id: 8}));
    assert.equal(await main(['--accounts-was', was, '--accounts', now]), 1, 'the pull request\'s records are the ones judged');
    writeFileSync(join(now, 'tester.json'), JSON.stringify({login: 'tester', id: 7}));
    symlinkSync('/etc/hostname', join(now, 'bo.json'));
    assert.equal(await main(['--accounts-was', was, '--accounts', now]), 1, 'a record that is a link is refused, never read');

    const m = motion();
    symlinkSync('/etc/hostname', join(m, 'CREDITS.link'));
    assert.deepEqual(links(m), ['CREDITS.link']);
    assert.deepEqual(checkMotion(m).map((i) => i.code), ['format.symlink'], 'a motion with a link is refused before anything is read');

    const published = {authors: [{name: 'Tester', github: 'tester'}]};
    const accounts = new Map([['tester', 7]]);
    assert.deepEqual(checkRemoval(published, {author: 'tess', authorId: 7, accounts}), [], 'an author, renamed, may take it out');
    assert.deepEqual(checkRemoval(published, {author: 'tester', authorId: 99, accounts}).map((i) => i.code), ['hub.owner'], 'whoever took the old login may not');
    assert.deepEqual(checkRemoval(published, {}).map((i) => i.code), ['hub.owner']);
    const wasFile = join(dir, 'motion.json');
    writeFileSync(wasFile, JSON.stringify(published));
    assert.equal(await main(['--removed', '--was', wasFile, '--author', 'bo', '--author-id', '8']), 1);
    assert.equal(await main(['--removed', '--was', wasFile, '--author', 'tester', '--author-id', '7']), 0);
  } finally { console.log = log; }
});

test('a pull request motionhub opened for someone is theirs: every commit that names a submitter names the same one', async () => {
  const {submitter} = await import('../tools/check.mjs');
  const c = (message) => ({commit: {message}});
  const by = 'Add X 1.0.0\n\nSigned-off-by: Ana <7+ana@users.noreply.github.com>\nMotionhub-Submitted-By: 7 ana\nMotionhub-Submission: abc\n';
  assert.deepEqual(submitter([c(by), c('Fix a typo\n\nSigned-off-by: Maintainer <m@example.com>'), c(by.replace('Add X 1.0.0', 'Update X 1.0.1'))]), {id: 7, login: 'ana'}, 'a maintainer\'s commit names no one and changes nothing');
  assert.ok(submitter([c('x')]).error, 'no line');
  assert.ok(submitter([c(by), c(by.replace('7 ana', '8 bo'))]).error, 'two submitters');
  assert.ok(submitter([c(by.replace('7 ana', '7 ana\nAUTHOR=evil'))]).id === 7, 'a line ends where it ends');
  assert.ok(submitter([c(by.replace('7 ana', '0x7 ana'))]).error, 'an id is digits');
  assert.ok(submitter([c(by.replace('7 ana', '7 an$a'))]).error, 'a login is a GitHub login');
});
