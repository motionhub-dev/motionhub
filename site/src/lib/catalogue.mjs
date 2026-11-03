// The catalogue as the pages see it: the index tools/build.mjs wrote to ../dist, and each motion's own files in
// ../motions. Read once per build.
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {SPEC} from '../../../tools/check.mjs';
import {REPO, SITE, colours, en, faces, markdown, other} from '../../../tools/site.mjs';

export {REPO, SITE, SPEC, colours, en, faces, markdown, other};

/** The repository's root: the build runs in site/. */
export const ROOT = resolve(process.cwd(), '..');
const index = join(ROOT, 'dist/api/motions.json');
if (!existsSync(index)) throw new Error('no dist/api/motions.json: run node tools/build.mjs first (npm run build does)');

/** The index's rows, ordered by id. */
export const rows = JSON.parse(readFileSync(index, 'utf8')).motions;

/** A motion's file, or '' when it has none. */
export function read(id, file) {
  const path = join(ROOT, 'motions', id, file);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

/** The languages a motion's MOTION.md is also in, from its MOTION.<lang>.md files. */
export function translations(id) {
  return readdirSync(join(ROOT, 'motions', id)).map((n) => /^MOTION\.([A-Za-z0-9-]+)\.md$/.exec(n)?.[1]).filter(Boolean).sort();
}

/** The motions each GitHub account is an author of. */
export const byAuthor = new Map();
for (const r of rows) for (const a of r.authors) byAuthor.set(a.github, [...(byAuthor.get(a.github) ?? []), r]);

/** The tags used by more than one motion, the most used first: the gallery's chips. */
export function chips(limit = 12) {
  const counts = new Map();
  for (const r of rows) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, limit).map(([t]) => t);
}

/** Every tool directory any motion has, A to Z. */
export const tools = [...new Set(rows.flatMap((r) => r.tools))].sort();

export const kb = (bytes) => `${Math.ceil(bytes / 1024)} KB`;

/** The motions a motion builds on that are in the catalogue, and the ones that build on it. */
const byId = new Map(rows.map((r) => [r.slug, r]));
export const builtOn = (row) => (row.basedOn ?? []).map((b) => ({...b, row: byId.get(b.id)})).filter((b) => b.row);
export const builtOnBy = (id) => rows.filter((r) => (r.basedOn ?? []).some((b) => b.id === id));

/**
 * The creators: every GitHub account that is an author of a motion, by login in lowercase, with the name it is
 * credited by in its newest motion, its motions A to Z and the motions of others built on them. Most motions first.
 */
export const creators = (() => {
  const map = new Map();
  for (const r of rows) for (const a of r.authors) {
    const key = a.github.toLowerCase();
    const c = map.get(key) ?? {key, login: a.github, name: a.name, motions: []};
    c.motions.push(r);
    map.set(key, c);
  }
  for (const c of map.values()) {
    const mine = new Set(c.motions.map((r) => r.slug));
    c.builtOnBy = rows.filter((r) => !mine.has(r.slug) && (r.basedOn ?? []).some((b) => mine.has(b.id)));
  }
  return [...map.values()].sort((a, b) => b.motions.length - a.motions.length || (a.key < b.key ? -1 : 1));
})();
export const creatorPath = (login) => `/creators/${login.toLowerCase()}/`;
export const avatar = (login, size = 64) => `https://github.com/${login}.png?size=${size}`;
