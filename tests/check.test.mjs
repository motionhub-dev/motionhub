// The checker against motions built in a temporary directory: one valid motion, then one change at a time.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {checkMotion, compareVersions, spdx, jpegSize} from '../tools/check.mjs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

/** The smallest JPEG the checker reads: a start-of-frame marker with its size, and nothing to decode. */
function jpeg(width, height) {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 255, width >> 8, width & 255, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]);
}

const color = (hex) => ({colorSpace: 'srgb', components: [0.5, 0.5, 0.5], hex});
// every motion on the hub has a scope (its author's GitHub login); UNSCOPED is the format's plainest motion
const MANIFEST = {
  spec: 'motion/0.2', scope: 'tester', slug: 'test-motion', version: '1.0.0',
  name: {en: 'Test Motion', 'zh-CN': '测试风格'}, line: {en: 'A plain motion for the checker\'s tests.'},
  authors: [{name: 'Tester', github: 'tester'}], license: {text: 'CC-BY-4.0'}, tags: ['light'],
};
const {scope: _scope, ...UNSCOPED} = {...MANIFEST, spec: 'motion/0.1'};
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
  assert.ok(bad({spec: 'motion/0.4'}).includes('manifest.spec'));
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
  const scoped = {...MANIFEST, spec: 'motion/0.2', scope: 'tester'};
  assert.deepEqual(codes(motion({manifest: scoped}), {hub: false}), []);
  assert.deepEqual(codes(motion({manifest: {...UNSCOPED, spec: 'motion/0.2'}}), {hub: false}), [], 'the format lets a 0.2 motion be unscoped');
  assert.ok(codes(motion({manifest: {...scoped, spec: 'motion/0.1'}}), {hub: false}).includes('manifest.member'), 'scope is not a 0.1 member');
  assert.ok(codes(motion({manifest: {...scoped, scope: 'Tester'}}), {hub: false}).includes('manifest.scope'));
  assert.ok(codes(motion({manifest: {...scoped, scope: '-x'}}), {hub: false}).includes('manifest.scope'));
  assert.deepEqual(codes(motion({dir: 'motions/@tester/test-motion', manifest: scoped})), []);
  assert.ok(codes(motion({dir: 'motions/@other/test-motion', manifest: scoped})).includes('hub.slug'));
  assert.ok(codes(motion({dir: 'motions/@tester/test-motion', manifest: UNSCOPED})).includes('hub.slug'), 'an unscoped motion is not kept under a scope');
  assert.ok(codes(motion({dir: 'motions/test-motion', manifest: scoped})).includes('hub.slug'), 'a scoped motion is not kept at the top');
  assert.deepEqual(codes(motion({dir: 'project/motion', manifest: scoped}), {hub: false}), [], 'a copy in a project may be named otherwise');
});

test('basedOn names the motions this one builds on, since motion/0.3, and in the catalogue they are there', () => {
  const based = {...MANIFEST, spec: 'motion/0.3', scope: 'tester', basedOn: [{id: 'red-pencil', version: '1.0.2'}, {id: '@ana/ledger'}]};
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
