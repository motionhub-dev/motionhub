#!/usr/bin/env node
// Builds the files motionhub.dev serves (HUB.md, "What motionhub.dev serves") from motions/ and skills/, with no
// dependencies. The site's pages are built from the same output.
//
//   node tools/build.mjs [out]      default out: dist/
//
// It writes:
//   api/motions.json                 the index, one row per motion, ordered by slug
//   m/<slug>/<file>                  the newest version's motion.json, MOTION*.md, tokens.json, CREDITS.md, poster.jpg
//   m/<slug>/<version>.tgz           the whole motion, its paths under <slug>/; the same files always give the same bytes
//   llms.txt                         the generic skill, for agents (skills/motionhub/SKILL.md without its front matter)
// It refuses to build while any motion has an issue (tools/check.mjs). Publishing must never replace a package that is
// already at its URL (HUB.md): that is the deploy's rule, since this build only knows the newest versions.

import {createHash} from 'node:crypto';
import {copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {SPEC, checkMotion} from './check.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const SERVED = /^(motion\.json|MOTION(\.[A-Za-z0-9-]+)?\.md|tokens\.json|CREDITS\.md|poster\.jpg)$/;

function files(dir, prefix = '') {
  return readdirSync(dir, {withFileTypes: true})
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .flatMap((e) => (e.isDirectory() ? files(join(dir, e.name), `${prefix}${e.name}/`) : [`${prefix}${e.name}`]));
}

/** A ustar header field: text or an octal number, NUL-padded to its width. */
function field(buf, at, width, value) {
  buf.write(typeof value === 'number' ? value.toString(8).padStart(width - 1, '0') : value, at, width, 'utf8');
}

/** A gzipped tar of `entries` ([path, bytes] in order), with fixed owner, mode and time so it is reproducible. */
export function tgz(entries) {
  const blocks = [];
  for (const [path, data] of entries) {
    const header = Buffer.alloc(512);
    const bytes = Buffer.byteLength(path);
    let name = path;
    let prefix = '';
    if (bytes > 100) {
      const cut = path.lastIndexOf('/', path.length - 1);
      [prefix, name] = [path.slice(0, cut), path.slice(cut + 1)];
      if (Buffer.byteLength(prefix) > 155 || Buffer.byteLength(name) > 100 || cut < 0) throw new Error(`path too long for a tar: ${path}`);
    }
    field(header, 0, 100, name);
    field(header, 100, 8, 0o644);
    field(header, 108, 8, 0);
    field(header, 116, 8, 0);
    field(header, 124, 12, data.length);
    field(header, 136, 12, 0);
    header.fill(' ', 148, 156);
    header.write('0', 156);
    header.write('ustar\u000000', 257, 8, 'latin1');
    field(header, 345, 155, prefix);
    let sum = 0;
    for (const b of header) sum += b;
    header.write(`${sum.toString(8).padStart(6, '0')}\u0000 `, 148, 8, 'latin1');
    blocks.push(header, data, Buffer.alloc((512 - (data.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocks), {level: 9});
}

/** The index row for one motion, and its package. */
export function pack(dir) {
  const manifest = JSON.parse(readFileSync(join(dir, 'motion.json'), 'utf8'));
  const {slug, version} = manifest;
  const names = files(dir);
  const archive = tgz(names.map((n) => [`${slug}/${n}`, readFileSync(join(dir, n))]));
  const tools = readdirSync(dir, {withFileTypes: true}).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  const row = {
    slug, version, name: manifest.name, line: manifest.line, lang: manifest.lang ?? 'en', tags: manifest.tags ?? [],
    authors: manifest.authors, license: manifest.license, poster: `/m/${slug}/poster.jpg`, tools,
    package: {url: `/m/${slug}/${version}.tgz`, sha256: createHash('sha256').update(archive).digest('hex'), bytes: archive.length},
  };
  return {row, archive, served: names.filter((n) => SERVED.test(n))};
}

export function build(out, root = ROOT) {
  const motions = join(root, 'motions');
  const dirs = existsSync(motions) ? readdirSync(motions, {withFileTypes: true}).filter((e) => e.isDirectory()).map((e) => e.name).sort() : [];
  const issues = dirs.flatMap((d) => checkMotion(join(motions, d)).map((i) => `motions/${d}/${i.at}  ${i.code}  ${i.message}`));
  if (issues.length) throw new Error(`not built, the motions have issues:\n${issues.join('\n')}`);

  rmSync(out, {recursive: true, force: true});
  const rows = [];
  for (const d of dirs) {
    const {row, archive, served} = pack(join(motions, d));
    const at = join(out, 'm', row.slug);
    mkdirSync(at, {recursive: true});
    for (const n of served) copyFileSync(join(motions, d, n), join(at, n));
    writeFileSync(join(at, `${row.version}.tgz`), archive);
    rows.push(row);
  }
  mkdirSync(join(out, 'api'), {recursive: true});
  writeFileSync(join(out, 'api/motions.json'), JSON.stringify({spec: SPEC, motions: rows}, null, 2) + '\n');
  const skill = readFileSync(join(root, 'skills/motionhub/SKILL.md'), 'utf8');
  writeFileSync(join(out, 'llms.txt'), skill.replace(/^---\n[\s\S]*?\n---\n+/, ''));
  return rows;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = resolve(process.argv[2] ?? join(ROOT, 'dist'));
  try {
    const rows = build(out);
    const bytes = files(out).reduce((n, f) => n + statSync(join(out, f)).size, 0);
    console.log(`${rows.length} motion(s) built into ${relative(process.cwd(), out) || '.'} (${Math.round(bytes / 1024)} KB)`);
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
