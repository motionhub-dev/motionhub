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

/**
 * A motion's names in languages other than the one the page shows, with their language tags. The site is in
 * English, so it shows the English name and keeps the others for the motion's own page and for search.
 */
export const aka = (localized) => Object.entries(localized ?? {}).filter(([k, v]) => k !== 'en' && v && v !== en(localized)).map(([lang, text]) => ({lang, text}));

/** What a tool directory lets a person use, by engine. A tool not named here shows as its own name. */
const TOOL_ENGINES = {react: ['Remotion', 'HyperFrames']};
export const toolEngines = (tool) => TOOL_ENGINES[tool] ?? [tool];
export const toolLabel = (tool) => (TOOL_ENGINES[tool] ? `Components for ${toolEngines(tool).join(' and ')}` : `Pieces for ${tool}`);

/** The prompt that works in any agent, and the skill that makes it shorter: installed for every agent by skills. */
export const TOPIC = '<your topic>';
export const agentPrompt = (id, topic = TOPIC) => `Read ${SITE}/llms.txt, then make a film about "${topic}" in the motion ${SITE}/m/${id}/`;
export const skillInstall = 'npx skills add motionhub-dev/motions -g';
export const skillShare = "/motionhub share this project's look as a motion";

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

/** A poster's smaller copies (site/thumbs.mjs) as a srcset, the poster itself the largest. */
export const posterSet = (poster) => `${poster.replace(/\.jpg$/, '-480.webp')} 480w, ${poster.replace(/\.jpg$/, '-960.webp')} 960w, ${poster} 1920w`;
export const CARD_SIZES = '(max-width: 520px) calc(100vw - 32px), (max-width: 900px) 45vw, 260px';
