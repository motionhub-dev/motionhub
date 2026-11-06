#!/usr/bin/env node
// Builds the files motionhub.dev serves (HUB.md, "What motionhub.dev serves") from motions/ and skills/, with no
// dependencies. The site's pages are built from this output by site/ (npm run build there).
//
//   node tools/build.mjs [out]      default out: dist/
//
// It writes:
//   api/accounts.json                each recorded login and its GitHub account id (accounts/), for the avatars
//   api/motions.json                 the index, one row per motion, ordered by id (`slug` in a row is the motion's id:
//                                    `<slug>` or `@<scope>/<slug>`, so clients that only know motion/0.1 never confuse two),
//                                    each row with the ids of the catalogs it is in (catalogs.json)
//   api/catalogs.json                the catalogs, in the home page's order (catalogs.json, HUB.md "Catalogs")
//   m/<id>/<file>                    the newest version's motion.json, MOTION*.md, tokens.json, CREDITS.md, poster.jpg
//   m/<id>/<version>.tgz             the whole motion, its paths under <id>/; the same files always give the same bytes
//   llms.txt                         the generic skill, for agents (skills/motionhub/SKILL.md without its front matter),
//                                    ending with the index of the docs' Markdown twins
//   docs/<page>.md, llms-full.txt    each docs page as Markdown, and all of them in one file (tools/docs.mjs)
//   _headers, _redirects, robots.txt, sitemap.xml  beside the pages (tools/site.mjs); the pages themselves, index.html,
//                                    m/<id>/index.html and 404.html, are site/'s Astro build over these files
//   favicon.svg, favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png, site.webmanifest, og-default.png
//                                    the brand's icons and default share card, copied from brand/
//   brand/<logo file>, brand/brand.tokens.json, brand/tokens.css   the logo files and tokens, for anyone who shows motionhub
//   .assetsignore                    keeps the packages out of the deployed assets: the Worker serves them from R2
// It refuses to build while any motion has an issue (tools/check.mjs). Publishing must never replace a package that is
// already at its URL (HUB.md): that is the deploy's rule, since this build only knows the newest versions.

import {createHash} from 'node:crypto';
import {copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkCatalogs, checkMotion, listMotions, motionId, readAccounts} from './check.mjs';
import {files, tgz} from './pack.mjs';

export {tgz};

/** The index's own format. A row adds members over time and says its motion's `spec`; readers of motion/0.1 still read it. */
export const INDEX_SPEC = 'motion/0.1';
import {writeSiteFiles} from './site.mjs';
import {llmsIndex, writeDocs} from './docs.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const SERVED = /^(motion\.json|MOTION(\.[A-Za-z0-9-]+)?\.md|tokens\.json|CREDITS\.md|poster\.jpg)$/;

/** The index row for one motion, and its package. */
export function pack(dir) {
  const manifest = JSON.parse(readFileSync(join(dir, 'motion.json'), 'utf8'));
  const {version} = manifest, slug = motionId(manifest);
  const names = files(dir);
  const archive = tgz(names.map((n) => [`${slug}/${n}`, readFileSync(join(dir, n))]));
  const tools = readdirSync(dir, {withFileTypes: true}).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  const row = {
    slug, ...(manifest.scope ? {scope: manifest.scope} : {}), spec: manifest.spec, version, name: manifest.name, line: manifest.line, lang: manifest.lang ?? 'en', tags: manifest.tags ?? [],
    authors: manifest.authors, ...(manifest.basedOn ? {basedOn: manifest.basedOn} : {}), ...(manifest.fit ? {fit: manifest.fit} : {}), license: manifest.license, poster: `/m/${slug}/poster.jpg`, tools,
    package: {url: `/m/${slug}/${version}.tgz`, sha256: createHash('sha256').update(archive).digest('hex'), bytes: archive.length},
    // the player of its reel (react/reel.tsx), which site/player/build.mjs writes
    ...(existsSync(join(dir, 'react/reel.tsx')) ? {reel: `/play/${slug}/`} : {}),
  };
  return {row, archive, served: names.filter((n) => SERVED.test(n))};
}

export function build(out, root = ROOT) {
  const motions = join(root, 'motions');
  const dirs = listMotions(motions);
  const catalogsFile = join(root, 'catalogs.json');
  const issues = [
    ...dirs.flatMap((d) => checkMotion(join(motions, d)).map((i) => `motions/${d}/${i.at}  ${i.code}  ${i.message}`)),
    ...checkCatalogs(catalogsFile, new Set(dirs)).map((i) => `${i.at}  ${i.code}  ${i.message}`),
  ];
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
  const catalogs = existsSync(catalogsFile) ? JSON.parse(readFileSync(catalogsFile, 'utf8')).catalogs : [];
  for (const row of rows) row.catalogs = catalogs.filter((c) => c.motions.includes(row.slug)).map((c) => c.id);
  mkdirSync(join(out, 'api'), {recursive: true});
  writeFileSync(join(out, 'api/motions.json'), JSON.stringify({spec: INDEX_SPEC, motions: rows}, null, 2) + '\n');
  writeFileSync(join(out, 'api/catalogs.json'), JSON.stringify({catalogs}, null, 2) + '\n');
  // the recorded accounts, login → GitHub id: whose avatars the site serves (site/avatars.mjs)
  writeFileSync(join(out, 'api/accounts.json'), JSON.stringify(Object.fromEntries([...readAccounts(join(ROOT, 'accounts'))].sort()), null, 2) + '\n');
  const skill = readFileSync(join(root, 'skills/motionhub/SKILL.md'), 'utf8');
  writeFileSync(join(out, 'llms.txt'), skill.replace(/^---\n[\s\S]*?\n---\n+/, '').trimEnd() + '\n' + llmsIndex(ROOT));
  const docs = writeDocs(ROOT, out);
  writeSiteFiles(out, rows, docs, readAccounts(join(ROOT, 'accounts')));
  // the brand's favicons, web manifest and default share card, from brand/ (BRAND.md)
  for (const [dir, names] of [['favicon', ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest']], ['social', ['og-default.png']]]) {
    for (const name of names) copyFileSync(join(ROOT, 'brand', dir, name), join(out, name));
  }
  // the logo files and tokens, for anyone who shows motionhub (brand/BRAND.md)
  mkdirSync(join(out, 'brand'), {recursive: true});
  for (const name of readdirSync(join(ROOT, 'brand/logo'))) copyFileSync(join(ROOT, 'brand/logo', name), join(out, 'brand', name));
  for (const name of ['brand.tokens.json', 'tokens.css']) copyFileSync(join(ROOT, 'brand', name), join(out, 'brand', name));
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
