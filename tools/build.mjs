#!/usr/bin/env node
// Builds the files motionhub.dev serves (HUB.md, "What motionhub.dev serves") from motions/ and skills/, with no
// dependencies. The site's pages are built from the same output.
//
//   node tools/build.mjs [out]      default out: dist/
//
// It writes:
//   api/motions.json                 the index, one row per motion, ordered by id (`slug` in a row is the motion's id:
//                                    `<slug>` or `@<scope>/<slug>`, so clients that only know motion/0.1 never confuse two)
//   m/<id>/<file>                    the newest version's motion.json, MOTION*.md, tokens.json, CREDITS.md, poster.jpg
//   m/<id>/<version>.tgz             the whole motion, its paths under <id>/; the same files always give the same bytes
//   llms.txt                         the generic skill, for agents (skills/motionhub/SKILL.md without its front matter)
//   index.html, m/<slug>/index.html  the gallery and a page per motion, with 404.html, site.css, _headers,
//                                    robots.txt and sitemap.xml (tools/site.mjs)
//   favicon.svg, favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png, site.webmanifest, og-default.png
//                                    the brand's icons and default share card, copied from brand/
//   .assetsignore                    keeps the packages out of the deployed assets: the Worker serves them from R2
// It refuses to build while any motion has an issue (tools/check.mjs). Publishing must never replace a package that is
// already at its URL (HUB.md): that is the deploy's rule, since this build only knows the newest versions.

import {createHash} from 'node:crypto';
import {copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {checkMotion, listMotions, motionId} from './check.mjs';

/** The index's own format. A row adds members over time and says its motion's `spec`; readers of motion/0.1 still read it. */
export const INDEX_SPEC = 'motion/0.1';
import {writeSite} from './site.mjs';

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
  const {version} = manifest, slug = motionId(manifest);
  const names = files(dir);
  const archive = tgz(names.map((n) => [`${slug}/${n}`, readFileSync(join(dir, n))]));
  const tools = readdirSync(dir, {withFileTypes: true}).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  const row = {
    slug, ...(manifest.scope ? {scope: manifest.scope} : {}), spec: manifest.spec, version, name: manifest.name, line: manifest.line, lang: manifest.lang ?? 'en', tags: manifest.tags ?? [],
    authors: manifest.authors, license: manifest.license, poster: `/m/${slug}/poster.jpg`, tools,
    package: {url: `/m/${slug}/${version}.tgz`, sha256: createHash('sha256').update(archive).digest('hex'), bytes: archive.length},
  };
  return {row, archive, served: names.filter((n) => SERVED.test(n))};
}

export function build(out, root = ROOT) {
  const motions = join(root, 'motions');
  const dirs = listMotions(motions);
  const issues = dirs.flatMap((d) => checkMotion(join(motions, d)).map((i) => `motions/${d}/${i.at}  ${i.code}  ${i.message}`));
  if (issues.length) throw new Error(`not built, the motions have issues:\n${issues.join('\n')}`);

  rmSync(out, {recursive: true, force: true});
  const rows = [];
  for (const d of dirs) {
    const {row, archive, served} = pack(join(motions, d));
    if (row.slug !== d) throw new Error(`motions/${d} holds the motion ${row.slug}: a motion sits at motions/<its id>/`);
    const at = join(out, 'm', row.slug);
    mkdirSync(at, {recursive: true});
    for (const n of served) copyFileSync(join(motions, d, n), join(at, n));
    writeFileSync(join(at, `${row.version}.tgz`), archive);
    rows.push(row);
  }
  mkdirSync(join(out, 'api'), {recursive: true});
  writeFileSync(join(out, 'api/motions.json'), JSON.stringify({spec: INDEX_SPEC, motions: rows}, null, 2) + '\n');
  const skill = readFileSync(join(root, 'skills/motionhub/SKILL.md'), 'utf8');
  writeFileSync(join(out, 'llms.txt'), skill.replace(/^---\n[\s\S]*?\n---\n+/, ''));
  writeSite(out, rows, motions, readFileSync(join(ROOT, 'tools/site.css'), 'utf8'));
  // the brand's favicons, web manifest and default share card, from brand/ (BRAND.md)
  for (const [dir, names] of [['favicon', ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest']], ['social', ['og-default.png']]]) {
    for (const name of names) copyFileSync(join(ROOT, 'brand', dir, name), join(out, name));
  }
  writeFileSync(join(out, '.assetsignore'), '*.tgz\n');
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
