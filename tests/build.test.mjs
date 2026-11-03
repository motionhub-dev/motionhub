// The hub's build against this repository's own motions: the index, the served files and the packages, which the
// system's tar must read back byte for byte.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build, pack, tgz} from '../tools/build.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const SLUGS = readdirSync(join(ROOT, 'motions'), {withFileTypes: true}).filter((e) => e.isDirectory()).map((e) => e.name).sort();
const out = mkdtempSync(join(tmpdir(), 'hub-'));
const rows = build(out);

/** Every file under `dir`, as relative paths. */
const walk = (dir, p = '') => readdirSync(dir, {withFileTypes: true}).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name), `${p}${e.name}/`) : [`${p}${e.name}`]));

test('the index lists every motion, ordered by slug, with its package', () => {
  const index = JSON.parse(readFileSync(join(out, 'api/motions.json'), 'utf8'));
  assert.equal(index.spec, 'motion/0.1');
  assert.deepEqual(index.motions.map((m) => m.slug), SLUGS);
  assert.deepEqual(index.motions, rows);
  for (const m of index.motions) {
    const archive = readFileSync(join(out, m.package.url));
    assert.equal(createHash('sha256').update(archive).digest('hex'), m.package.sha256, m.slug);
    assert.equal(archive.length, m.package.bytes, m.slug);
    assert.ok(existsSync(join(out, m.poster)), m.slug);
    assert.equal(m.version, JSON.parse(readFileSync(join(ROOT, 'motions', m.slug, 'motion.json'), 'utf8')).version);
  }
});

test('a package holds the whole motion, as tar reads it', () => {
  for (const slug of SLUGS) {
    const {row} = pack(join(ROOT, 'motions', slug));
    const into = mkdtempSync(join(tmpdir(), 'unpack-'));
    execFileSync('tar', ['-xzf', join(out, row.package.url), '-C', into]);
    const source = join(ROOT, 'motions', slug);
    assert.deepEqual(walk(join(into, slug)).sort(), walk(source).sort(), slug);
    for (const f of walk(source)) assert.ok(readFileSync(join(into, slug, f)).equals(readFileSync(join(source, f))), `${slug}/${f}`);
  }
});

test('the same files give the same package', () => {
  const dir = join(ROOT, 'motions', SLUGS[0]);
  assert.equal(pack(dir).row.package.sha256, pack(dir).row.package.sha256);
});

test('a path longer than 100 bytes is split into the tar prefix', () => {
  const path = `${'a'.repeat(60)}/${'b'.repeat(60)}/c.txt`;
  const into = mkdtempSync(join(tmpdir(), 'long-'));
  writeFileSync(join(into, 'x.tgz'), tgz([[path, Buffer.from('long')]]));
  execFileSync('tar', ['-xzf', 'x.tgz'], {cwd: into});
  assert.equal(readFileSync(join(into, path), 'utf8'), 'long');
});

test('the served files and llms.txt are written', () => {
  for (const slug of SLUGS) for (const f of ['motion.json', 'MOTION.md', 'tokens.json', 'CREDITS.md', 'poster.jpg']) assert.ok(existsSync(join(out, 'm', slug, f)), `${slug}/${f}`);
  const llms = readFileSync(join(out, 'llms.txt'), 'utf8');
  assert.ok(llms.startsWith('# '));
  assert.ok(!llms.includes('description:'));
});

test('a scoped motion is built at m/@<scope>/<slug>/, its package rooted there, after the unscoped ones', () => {
  const root = mkdtempSync(join(tmpdir(), 'scoped-'));
  mkdirSync(join(root, 'skills/motionhub'), {recursive: true});
  writeFileSync(join(root, 'skills/motionhub/SKILL.md'), '---\nname: motionhub\n---\n# Skill\n');
  cpSync(join(ROOT, 'motions', SLUGS[0]), join(root, 'motions', SLUGS[0]), {recursive: true});
  const dir = join(root, 'motions/@ana/plain-paper');
  cpSync(join(ROOT, 'motions', SLUGS[0]), dir, {recursive: true});
  const manifest = JSON.parse(readFileSync(join(dir, 'motion.json'), 'utf8'));
  writeFileSync(join(dir, 'motion.json'), JSON.stringify({...manifest, spec: 'motion/0.2', scope: 'ana', slug: 'plain-paper'}));
  const out = join(root, 'dist'), built = build(out, root);
  assert.deepEqual(built.map((r) => r.slug), ['@ana/plain-paper', SLUGS[0]]);
  const row = built[0];
  assert.equal(row.scope, 'ana');
  assert.equal(row.spec, 'motion/0.2');
  assert.equal(row.package.url, '/m/@ana/plain-paper/1.0.1.tgz'.replace('1.0.1', manifest.version));
  assert.ok(existsSync(join(out, 'm/@ana/plain-paper/MOTION.md')));
  const into = mkdtempSync(join(tmpdir(), 'unpack-'));
  execFileSync('tar', ['-xzf', join(out, row.package.url), '-C', into]);
  assert.ok(existsSync(join(into, '@ana/plain-paper/motion.json')));
  assert.equal(JSON.parse(readFileSync(join(out, 'api/motions.json'), 'utf8')).spec, 'motion/0.1', 'readers of the 0.1 index still read it');
});

test('nothing is built while a motion has an issue', () => {
  const root = mkdtempSync(join(tmpdir(), 'broken-'));
  mkdirSync(join(root, 'motions/broken-motion'), {recursive: true});
  writeFileSync(join(root, 'motions/broken-motion/motion.json'), '{}');
  assert.throws(() => build(join(root, 'dist'), root), /not built/);
  assert.ok(!existsSync(join(root, 'dist')));
});
