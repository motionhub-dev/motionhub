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
import {listMotions} from '../tools/check.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
// every motion's id, as its directory under motions/ names it: @<scope>/<slug>
const SLUGS = listMotions(join(ROOT, 'motions'));
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

test('a motion is built at m/@<scope>/<slug>/, its package rooted there, in the order of its id', () => {
  const root = mkdtempSync(join(tmpdir(), 'scoped-'));
  mkdirSync(join(root, 'skills/motionhub'), {recursive: true});
  writeFileSync(join(root, 'skills/motionhub/SKILL.md'), '---\nname: motionhub\n---\n# Skill\n');
  const manifest = JSON.parse(readFileSync(join(ROOT, 'motions', SLUGS[0], 'motion.json'), 'utf8'));
  for (const [scope, slug] of [['bo', 'ink-line'], ['ana', 'plain-paper']]) {
    const dir = join(root, 'motions', `@${scope}`, slug);
    cpSync(join(ROOT, 'motions', SLUGS[0]), dir, {recursive: true});
    writeFileSync(join(dir, 'motion.json'), JSON.stringify({...manifest, scope, slug, authors: [{name: scope, github: scope}]}));
  }
  const out = join(root, 'dist'), built = build(out, root);
  assert.deepEqual(built.map((r) => r.slug), ['@ana/plain-paper', '@bo/ink-line']);
  const row = built[0];
  assert.equal(row.scope, 'ana');
  assert.equal(row.package.url, `/m/@ana/plain-paper/${manifest.version}.tgz`);
  assert.ok(existsSync(join(out, 'm/@ana/plain-paper/MOTION.md')));
  const into = mkdtempSync(join(tmpdir(), 'unpack-'));
  execFileSync('tar', ['-xzf', join(out, row.package.url), '-C', into]);
  assert.ok(existsSync(join(into, '@ana/plain-paper/motion.json')));
  assert.equal(JSON.parse(readFileSync(join(out, 'api/motions.json'), 'utf8')).spec, 'motion/0.1', 'readers of the 0.1 index still read it');
});

test('nothing is built while a motion has an issue', () => {
  const root = mkdtempSync(join(tmpdir(), 'broken-'));
  mkdirSync(join(root, 'motions/@ana/broken-motion'), {recursive: true});
  writeFileSync(join(root, 'motions/@ana/broken-motion/motion.json'), '{}');
  assert.throws(() => build(join(root, 'dist'), root), /not built/);
  assert.ok(!existsSync(join(root, 'dist')));
});

test('a creator has one page, at a key every build agrees on; their other logins are sent there, and the sitemap lists only keys', async () => {
  const {creatorKeys, writeSiteFiles} = await import('../tools/site.mjs');
  // tess (id 7) published @tester/a as tester, renamed, and published @tess/b and co-authored @bo/c as tess; bo is someone else
  const row = (slug, scope, logins) => ({slug: `@${scope}/${slug}`, scope, authors: logins.map((github) => ({name: github, github}))});
  const rows = [row('c', 'bo', ['bo', 'Tess']), row('b', 'tess', ['tess']), row('a', 'tester', ['tester'])];
  const accounts = new Map([['tester', 7], ['tess', 7], ['bo', 8]]);
  const keys = creatorKeys(rows, accounts);
  assert.deepEqual([...keys].sort(), [['bo', 'bo'], ['tess', 'tess'], ['tester', 'tess']], 'a scope they publish under, the first A to Z');
  assert.deepEqual(creatorKeys([...rows].reverse(), accounts), keys, 'whatever the order of the motions');
  assert.deepEqual([...creatorKeys(rows)].sort(), [['bo', 'bo'], ['tess', 'tess'], ['tester', 'tester']], 'unrecorded logins are each their own');
  const out = mkdtempSync(join(tmpdir(), 'site-'));
  writeSiteFiles(out, rows, [], accounts);
  assert.equal(readFileSync(join(out, '_redirects'), 'utf8'), '/creators/tester/ /creators/tess/ 301\n/creators/tester /creators/tess/ 301\n');
  const sitemap = readFileSync(join(out, 'sitemap.xml'), 'utf8');
  assert.ok(sitemap.includes('/creators/tess/') && sitemap.includes('/creators/bo/') && !sitemap.includes('/creators/tester/'));
});
