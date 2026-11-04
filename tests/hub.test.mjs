// search and get against a local hub serving packages the system's tar makes: the SHA-256, links, stray paths and an
// existing directory are refused; what is written is the motion, byte for byte.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {getMotion, motionTokens, projectMotion, scaffold, search, share, unpack} from '../tools/hub.mjs';
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

/** The smallest JPEG the checker reads: its size, and nothing to decode. */
const jpeg = (w, h) => Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, h >> 8, h & 255, w >> 8, w & 255, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]), Buffer.from([0xff, 0xd9])]);

test('a new motion starts as every required file but the poster, and shares only as its own author and above what is published', async () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'init-')), 'plain-ink');
  for (const [path, data] of scaffold('plain-ink', {login: 'ana', name: 'Ana'})) { mkdirSync(join(dir, path, '..'), {recursive: true}); writeFileSync(join(dir, path), data); }
  writeFileSync(join(dir, 'poster.jpg'), jpeg(1920, 1080));
  let published;
  const server = createServer((req, res) => {
    if (req.url === '/api/motions.json') res.end(JSON.stringify({spec: 'motion/0.1', motions: published ? [published.row] : []}));
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
  const none = mkdtempSync(join(tmpdir(), 'tokens-'));
  assert.throws(() => execFileSync(process.execPath, [BIN, 'tokens'], {cwd: none, stdio: 'pipe'}), (e) => e.status === 2);
});

test('the skill names the format\'s version, and looks for a project\'s motion where the format says', () => {
  const skill = readFileSync(new URL('../skills/motionhub/SKILL.md', import.meta.url), 'utf8');
  assert.ok(skill.includes(`\`${SPEC}\``));
  assert.ok(skill.includes('`MOTION.md` at the project\'s root, or else `motion/MOTION.md`'));
  assert.ok(skill.includes('Never invent a number'));
});
