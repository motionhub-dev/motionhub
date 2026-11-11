// search and get against a local hub serving packages the system's tar makes: the SHA-256, links, stray paths and an
// existing directory are refused; what is written is the motion, byte for byte.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {LOCK, getMotion, main, motionTokens, packedSha256, projectMotion, readLock, scaffold, search, share, unpack} from '../tools/hub.mjs';
import {tgz} from '../tools/pack.mjs';
import {SPEC, checkMotion} from '../tools/check.mjs';
import {resolveTokens, tokenVariables} from '../packages/runtime/tokens.js';

/** A package of a small motion named `slug`, `extra` run on its directory first, and its index row. */
function pkg(slug, extra = () => {}) {
  const dir = mkdtempSync(join(tmpdir(), 'pkg-')), root = join(dir, slug);
  mkdirSync(join(root, 'remotion'), {recursive: true});
  writeFileSync(join(root, 'MOTION.md'), '# A\n');
  writeFileSync(join(root, 'remotion', 'index.ts'), 'export const theme = {};\n');
  extra(root);
  const gz = execFileSync('tar', ['-czf', '-', '-C', dir, slug]);
  const row = {slug, version: '1.0.0', name: {en: 'Plain Paper'}, line: {en: 'Ink on plain paper.'}, tags: ['light', 'minimal'], authors: [{name: 'A', github: 'a'}],
    license: {text: 'CC-BY-4.0'}, poster: `/m/${slug}/poster.jpg`, tools: ['remotion'], package: {url: `/m/${slug}/1.0.0.tgz`, sha256: createHash('sha256').update(gz).digest('hex'), bytes: gz.length}};
  return {row, gz};
}

test('a package unpacks to its motion, and is refused when its SHA-256, paths or entries are wrong', () => {
  const {row, gz} = pkg('plain-paper');
  const files = unpack(row, gz);
  assert.deepEqual([...files.keys()].sort(), ['MOTION.md', 'remotion/index.ts']);
  assert.throws(() => unpack({...row, package: {...row.package, sha256: '0'.repeat(64)}}, gz), /SHA-256/);
  assert.throws(() => unpack({...row, slug: 'other'}, gz), /outside its motion/);
  const linked = pkg('plain-paper', (root) => symlinkSync('/etc/passwd', join(root, 'remotion', 'x.ts')));
  assert.throws(() => unpack(linked.row, linked.gz), /link/);
});

test('a scoped motion is got by its id, and a bare slug never picks it', async () => {
  const {row, gz} = pkg('@ana/plain-paper');
  const server = createServer((req, res) => {
    if (req.url === '/api/motions.json') res.end(JSON.stringify({spec: 'motion/0.1', motions: [row]}));
    else if (req.url === row.package.url) res.end(gz);
    else { res.statusCode = 404; res.end(); }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const base = `http://127.0.0.1:${server.address().port}`, root = mkdtempSync(join(tmpdir(), 'scoped-'));
  try {
    assert.equal((await getMotion('@ana/plain-paper', join(root, 'motion'), base)).slug, '@ana/plain-paper');
    assert.equal(readFileSync(join(root, 'motion', 'remotion', 'index.ts'), 'utf8'), 'export const theme = {};\n');
    await assert.rejects(getMotion('plain-paper', join(root, 'other'), base), /@<login>\/plain-paper/);
  } finally { server.close(); }
});

test('search needs every word', () => {
  const {row} = pkg('plain-paper');
  assert.equal(search([row], ['PLAIN', 'light']).length, 1);
  assert.equal(search([row], ['plain', 'dark']).length, 0);
});

test('get writes the newest version, and never over a directory that exists', async () => {
  const {row, gz} = pkg('plain-paper');
  const server = createServer((req, res) => {
    if (req.url === '/api/motions.json') res.end(JSON.stringify({spec: 'motion/0.1', motions: [row]}));
    else if (req.url === row.package.url) res.end(gz);
    else { res.statusCode = 404; res.end(); }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const base = `http://127.0.0.1:${server.address().port}`, out = join(mkdtempSync(join(tmpdir(), 'get-')), 'motion');
  try {
    assert.equal((await getMotion('plain-paper', out, base)).version, '1.0.0');
    assert.equal(readFileSync(join(out, 'remotion', 'index.ts'), 'utf8'), 'export const theme = {};\n');
    await assert.rejects(getMotion('plain-paper', out, base), /already exists/);
    await assert.rejects(getMotion('nothing-here', join(out, 'x'), base), /no motion/);
    assert.ok(!existsSync(join(out, 'x')));
  } finally { server.close(); }
});

/** A motion `id` at `version` packed as the hub packs it (tools/pack.mjs), and its index row. */
function hubPkg(id, version = '1.0.0', doc = '# A\n') {
  const gz = tgz([[`${id}/MOTION.md`, Buffer.from(doc)], [`${id}/react/parts/plate.tsx`, Buffer.from('export const Plate = () => null;\n')]]);
  return {row: {slug: id, version, name: {en: 'Plain Paper'}, line: {en: 'Ink on plain paper.'}, tags: [], authors: [{name: 'A', github: 'a'}],
    license: {text: 'CC-BY-4.0'}, poster: `/m/${id}/poster.jpg`, tools: ['react'], package: {url: `/m/${id}/${version}.tgz`, sha256: createHash('sha256').update(gz).digest('hex'), bytes: gz.length}}, gz};
}

/** A hub serving `packages` (each {row, gz}), every version at its URL and the newest of each id in the index; and its base URL. */
async function hub(packages) {
  const newest = new Map(packages.map((p) => [p.row.slug, p.row]));
  const server = createServer((req, res) => {
    const p = packages.find((x) => x.row.package.url === req.url);
    if (req.url === '/api/motions.json') res.end(JSON.stringify({spec: 'motion/0.1', motions: [...newest.values()]}));
    else if (p) res.end(p.gz);
    else { res.statusCode = 404; res.end(); }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  return {server, base: `http://127.0.0.1:${server.address().port}`};
}

/** The command line's `main` run in `dir`, with what it printed. */
async function inDir(dir, command, args, base) {
  const was = process.cwd(), log = console.log, error = console.error, out = [];
  process.chdir(dir);
  console.log = console.error = (line) => out.push(String(line));
  try { return {status: await main(command, args, base), out: out.join('\n')}; }
  finally { process.chdir(was); console.log = log; console.error = error; }
}

test('a project holds several motions, each at motions/<id>/, and records what it took in its lock', async () => {
  const a = hubPkg('@ana/plain-paper'), b = hubPkg('@bo/chalk-hall', '2.1.0');
  const {server, base} = await hub([a, b]);
  const project = mkdtempSync(join(tmpdir(), 'project-'));
  try {
    assert.equal((await inDir(project, 'get', ['@ana/plain-paper'], base)).status, 0);
    assert.equal((await inDir(project, 'get', ['@bo/chalk-hall'], base)).status, 0);
    assert.equal(readFileSync(join(project, 'motions/@ana/plain-paper/MOTION.md'), 'utf8'), '# A\n');
    assert.ok(existsSync(join(project, 'motions/@bo/chalk-hall/react/parts/plate.tsx')));
    assert.deepEqual(JSON.parse(readFileSync(join(project, LOCK), 'utf8')), {lockfileVersion: 1, motions: {
      '@ana/plain-paper': {version: '1.0.0', sha256: a.row.package.sha256},
      '@bo/chalk-hall': {version: '2.1.0', sha256: b.row.package.sha256},
    }});
    // the copy as published packs to its package's SHA-256, which is how a copy is checked later
    assert.equal(packedSha256(join(project, 'motions/@ana/plain-paper'), '@ana/plain-paper'), a.row.package.sha256);
    const again = await inDir(project, 'get', ['@ana/plain-paper'], base);
    assert.equal(again.status, 0);
    assert.match(again.out, /is in motions\/@ana\/plain-paper, the newest version/);
    // --out writes elsewhere and records nothing
    assert.equal((await inDir(project, 'get', ['@ana/plain-paper', '--out', 'elsewhere'], base)).status, 0);
    assert.ok(existsSync(join(project, 'elsewhere/MOTION.md')));
    assert.deepEqual(Object.keys(readLock(project).motions), ['@ana/plain-paper', '@bo/chalk-hall']);
  } finally { server.close(); }
});

test('get with no id takes the recorded versions back, and names a copy that was changed', async () => {
  const old = hubPkg('@ana/plain-paper', '1.0.0'), next = hubPkg('@ana/plain-paper', '1.1.0', '# A, again\n');
  const {server, base} = await hub([old, next]);
  const project = mkdtempSync(join(tmpdir(), 'project-'));
  try {
    writeFileSync(join(project, LOCK), JSON.stringify({lockfileVersion: 1, motions: {'@ana/plain-paper': {version: '1.0.0', sha256: old.row.package.sha256}}}));
    const taken = await inDir(project, 'get', [], base);
    assert.equal(taken.status, 0, taken.out);
    assert.equal(readFileSync(join(project, 'motions/@ana/plain-paper/MOTION.md'), 'utf8'), '# A\n', 'the recorded version, not the newest');
    assert.match((await inDir(project, 'get', [], base)).out, /@ana\/plain-paper 1\.0\.0  ok/);
    writeFileSync(join(project, 'motions/@ana/plain-paper/MOTION.md'), '# A, edited\n');
    const changed = await inDir(project, 'get', [], base);
    assert.equal(changed.status, 1);
    assert.match(changed.out, /changed: motions\/@ana\/plain-paper is not the copy as published/);
    // a newer version is only taken when asked, by removing the copy and getting it again
    const kept = await inDir(project, 'get', ['@ana/plain-paper'], base).catch((e) => e);
    assert.match(kept.message, /already exists at 1\.0\.0; the newest is 1\.1\.0/);
    rmSync(join(project, 'motions/@ana/plain-paper'), {recursive: true});
    assert.equal((await inDir(project, 'get', ['@ana/plain-paper'], base)).status, 0);
    assert.equal(readLock(project).motions['@ana/plain-paper'].version, '1.1.0');
  } finally { server.close(); }
});

test('a lock is refused when it names a place outside motions/ or a package without its SHA-256', () => {
  const project = mkdtempSync(join(tmpdir(), 'project-'));
  for (const motions of [{'../../etc': {version: '1.0.0', sha256: 'a'.repeat(64)}}, {'plain-paper': {version: '1.0.0', sha256: 'a'.repeat(64)}}, {'@ana/plain-paper': {version: '1.0.0', sha256: 'abc'}}, {'@ana/plain-paper': {version: '../1', sha256: 'a'.repeat(64)}}]) {
    writeFileSync(join(project, LOCK), JSON.stringify({lockfileVersion: 1, motions}));
    assert.throws(() => readLock(project), /is not a motion this file can record/, JSON.stringify(motions));
  }
  writeFileSync(join(project, LOCK), JSON.stringify({lockfileVersion: 2, motions: {}}));
  assert.throws(() => readLock(project), /format this version does not know/);
});

test('init starts a motion of the project\'s own in motions/<slug>/', async () => {
  const project = mkdtempSync(join(tmpdir(), 'project-'));
  const r = await inDir(project, 'init', ['my-look', '--github', 'ana']);
  assert.equal(r.status, 0);
  assert.ok(existsSync(join(project, 'motions/my-look/motion.json')));
  assert.match(r.out, /motionhub share motions\/my-look/);
});

/** The smallest JPEG the checker reads: its size, and nothing to decode. */
const jpeg = (w, h) => Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, h >> 8, h & 255, w >> 8, w & 255, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]), Buffer.from([0xff, 0xd9])]);

test('a new motion starts as every required file but the poster, and shares only as its own author and above what is published', async () => {
  // where init puts it (motions/<slug>/ in a project): judged by the hub's accounts, but not as if it were the catalogue
  const dir = join(mkdtempSync(join(tmpdir(), 'init-')), 'motions', 'plain-ink');
  for (const [path, data] of scaffold('plain-ink', {login: 'ana', name: 'Ana'})) { mkdirSync(join(dir, path, '..'), {recursive: true}); writeFileSync(join(dir, path), data); }
  writeFileSync(join(dir, 'poster.jpg'), jpeg(1920, 1080));
  let published;
  const server = createServer((req, res) => {
    if (req.url === '/api/motions.json') res.end(JSON.stringify({spec: 'motion/0.1', motions: published ? [published.row] : []}));
    else if (req.url === '/api/accounts.json') res.end(JSON.stringify({ana: 42}));
    else if (req.url === '/m/@ana/plain-ink/motion.json') res.end(JSON.stringify(published.manifest));
    else { res.statusCode = 404; res.end(); }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal(JSON.parse(readFileSync(join(dir, 'motion.json'), 'utf8')).scope, 'ana', 'a new motion is scoped to its author');
    assert.match(await share(dir, {github: 'ana'}, base), /@ana\/plain-ink 1\.0\.0 passes the hub's checks as ana\. Nothing is published yet/);
    await assert.rejects(share(dir, {github: 'bo'}, base), /hub\.author[\s\S]*hub\.scope/);
    const manifest = JSON.parse(readFileSync(join(dir, 'motion.json'), 'utf8'));
    published = {manifest, row: {...pkg('plain-ink').row, slug: '@ana/plain-ink', version: '1.0.0', authors: manifest.authors}};
    await assert.rejects(share(dir, {github: 'ana'}, base), /hub\.version/);
    writeFileSync(join(dir, 'motion.json'), JSON.stringify({...manifest, version: '1.0.1'}));
    assert.match(await share(dir, {github: 'ana'}, base), /after 1\.0\.0/);
    await assert.rejects(share(dir, {github: 'ana', pr: true}, base), /gh signed in|gh is signed in as/, 'a pull request is never opened for an account gh is not signed in as');
  } finally { server.close(); }
});

// a motion in one file: its tokens, for a binding or a theme
const ONE_FILE = '---\nspec: motion/0.5\nname: A look\ntokens:\n  color:\n    floor: "#E8D5B7"\n    title: "{color.floor}"\n  font:\n    display: ["Fredoka", "sans-serif"]\n  duration:\n    enter: 0.6s\n  easing:\n    arrive: [0.22, 1, 0.36, 1]\n---\n\n# A look\n\n## Essence\nE.\n\n## Colour\nC.\n\n## Type\nT.\n\n## Motion\nM.\n\n## Avoid\nA.\n';
const BIN = new URL('../bin/motionhub.mjs', import.meta.url).pathname;

test('tokens writes a motion in one file\'s values as tokens.json, which the format and the runtime read', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tokens-'));
  writeFileSync(join(dir, 'MOTION.md'), ONE_FILE);
  const tokens = JSON.parse(execFileSync(process.execPath, [BIN, 'tokens'], {cwd: dir, encoding: 'utf8'}));
  assert.deepEqual(tokens, motionTokens(join(dir, 'MOTION.md')));
  const values = resolveTokens(tokens);
  assert.equal(values.color.floor, '#E8D5B7');
  assert.equal(values.color.title, '#E8D5B7', 'an alias is resolved');
  assert.match(tokenVariables(values)['--font-display'], /Fredoka/);
  // the file it writes is one a motion in a directory could hold
  execFileSync(process.execPath, [BIN, 'tokens', 'MOTION.md', '--out', 'tokens.json'], {cwd: dir});
  assert.deepEqual(JSON.parse(readFileSync(join(dir, 'tokens.json'), 'utf8')), tokens);
  assert.deepEqual(checkMotion(join(dir, 'MOTION.md'), {hub: false}), []);
});

test('tokens finds the project\'s motion, and refuses a file that is not a valid one', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tokens-'));
  assert.equal(projectMotion(dir), undefined);
  mkdirSync(join(dir, 'motion'));
  writeFileSync(join(dir, 'motion/MOTION.md'), ONE_FILE);
  assert.equal(projectMotion(dir), join(dir, 'motion/MOTION.md'));
  writeFileSync(join(dir, 'MOTION.md'), ONE_FILE.replace('"#E8D5B7"', '"beige"'));
  assert.equal(projectMotion(dir), join(dir, 'MOTION.md'), 'the root comes first');
  assert.throws(() => motionTokens(join(dir, 'MOTION.md')), /tokens\.value/);
  const out = mkdtempSync(join(tmpdir(), 'tokens-'));
  writeFileSync(join(out, 'MOTION.md'), ONE_FILE);
  for (const args of [['--out'], ['--out', '--other']]) assert.throws(() => execFileSync(process.execPath, [BIN, 'tokens', ...args], {cwd: out, stdio: 'pipe'}), (e) => e.status === 2, args.join(' '));
  assert.ok(!existsSync(join(out, '--other')));
  const none = mkdtempSync(join(tmpdir(), 'tokens-'));
  assert.throws(() => execFileSync(process.execPath, [BIN, 'tokens'], {cwd: none, stdio: 'pipe'}), (e) => e.status === 2);
});

test('the skill names the format\'s version, and looks for a project\'s motion where the format says', () => {
  const skill = readFileSync(new URL('../skills/motionhub/SKILL.md', import.meta.url), 'utf8');
  assert.ok(skill.includes(`\`${SPEC}\``));
  assert.ok(skill.includes('`MOTION.md` at the project\'s root, or else `motion/MOTION.md`'));
  assert.ok(skill.includes('Never invent a number'));
});
