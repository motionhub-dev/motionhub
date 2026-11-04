// The catalogue as the pages see it: the index tools/build.mjs wrote to ../dist, and each motion's own files in
// ../motions. Read once per build.
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {SPEC, readAccounts} from '../../../tools/check.mjs';
import {REPO, SITE, colours, creatorKeys, en, faces, markdown, other} from '../../../tools/site.mjs';

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

/** Each recorded login's GitHub account id (accounts/): one account may have had several logins. */
export const accounts = readAccounts(join(ROOT, 'accounts'));
/** Who a login is: its account's id when recorded, else the login itself in lowercase. */
const who = (login) => accounts.get(login.toLowerCase()) ?? login.toLowerCase();

/** The motions each GitHub account is an author of, by any login it has had. */
export const byAuthor = new Map();
{
  const byWho = new Map();
  for (const r of rows) for (const a of r.authors) byWho.set(who(a.github), [...(byWho.get(who(a.github)) ?? []), r]);
  for (const r of rows) for (const a of r.authors) byAuthor.set(a.github, byWho.get(who(a.github)));
}

/**
 * An account's login now, by its id, from GitHub when the build can ask (deploy passes GITHUB_TOKEN), else undefined:
 * a creator who renamed their account is shown by the new name, and the page stays where it was.
 */
async function loginNow(id) {
  if (typeof id !== 'number') return undefined;
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(`https://api.github.com/user/${id}`, {headers: {accept: 'application/vnd.github+json', 'user-agent': 'motionhub-site', ...(token ? {authorization: `Bearer ${token}`} : {})}, signal: AbortSignal.timeout(5000)}).catch(() => undefined);
  if (!res?.ok) return undefined;
  const user = await res.json().catch(() => undefined);
  return typeof user?.login === 'string' ? user.login : undefined;
}

/** The tags used by more than one motion, the most used first: the gallery's chips. */
export function chips(limit = 12) {
  const counts = new Map();
  for (const r of rows) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, limit).map(([t]) => t);
}

/** What a motion's fit.kind means to a person browsing (SPEC.md §3, What it is for), in the order the gallery offers them */
export const KINDS = {
  general: {label: 'General', note: 'Carries many subjects'},
  topic: {label: 'Topic', note: 'Made for one subject, deep in it'},
  overlay: {label: 'Over your footage', note: 'Drawn over video you bring'},
};
/** The kinds the catalogue's motions have, in that order */
export const kinds = Object.keys(KINDS).filter((k) => rows.some((r) => r.fit?.kind === k));

/**
 * The gallery's order (HUB.md, "The gallery's order"): the few motions FEATURED names first, in that order; then the rest by what they are for
 * (general, then over the maker's footage, then topic, then those that do not say) and, within a kind, by how many of the explanations' core
 * purposes their components cover; A to Z among equals. FEATURED is the only part kept by hand: a short pick for a cold start.
 */
export const FEATURED = ['@iamsuosi/stage-light', '@iamsuosi/screen-desk', '@iamsuosi/on-air'];
const KIND_RANK = {general: 0, overlay: 1, topic: 2};
/** What most explanations need from a motion's components (CONTRIBUTING.md, "What makes a good motion") */
export const CORE = ['title', 'data', 'compare', 'steps', 'term', 'link', 'transition'];
/** How many of CORE a motion's components cover, by their meta.purpose */
export function coverage(id) {
  const dir = join(ROOT, 'motions', id, 'react/parts');
  if (!existsSync(dir)) return 0;
  const have = new Set(readdirSync(dir).filter((n) => /\.(tsx|jsx)$/.test(n)).map((n) => /\bpurpose\s*:\s*['"]([a-z]+)['"]/.exec(readFileSync(join(dir, n), 'utf8'))?.[1]));
  return CORE.filter((p) => have.has(p)).length;
}
const featured = (r) => (FEATURED.includes(r.slug) ? FEATURED.indexOf(r.slug) : FEATURED.length);
const rank = (r) => KIND_RANK[r.fit?.kind] ?? 3;
const covered = new Map(rows.map((r) => [r.slug, coverage(r.slug)]));
/** The index's rows in the gallery's order */
export const recommended = [...rows].sort((a, b) => featured(a) - featured(b) || rank(a) - rank(b) || covered.get(b.slug) - covered.get(a.slug) || (a.slug < b.slug ? -1 : 1));

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
/** The engines a motion's components run in: their makers' own sites, repositories and agent skills, credited where they appear. */
export const ENGINE_LINKS = {
  Remotion: {site: 'https://www.remotion.dev', repo: 'https://github.com/remotion-dev/remotion', skills: 'https://www.remotion.dev/docs/ai/skills', guide: '/docs/remotion/'},
  HyperFrames: {site: 'https://hyperframes.heygen.com', repo: 'https://github.com/heygen-com/hyperframes', skills: 'https://github.com/heygen-com/hyperframes#readme', guide: '/docs/hyperframes/'},
};
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
 * The creators: every GitHub account that is an author of a motion, one per account however many logins it has had,
 * with the name it is credited by in its newest motion, its motions A to Z and the motions of others built on them.
 * Most motions first. `key` is its page's address (creatorKeys in tools/site.mjs: a scope it publishes under, else a
 * login, the same in every build); its other logins' pages send a visitor there. `login` is its login now (or, when
 * GitHub cannot be asked, the key), and `formerly` the others it has published under.
 */
const KEYS = creatorKeys(rows, accounts);
export const creators = await (async () => {
  const map = new Map();
  for (const r of rows) for (const a of r.authors) {
    const c = map.get(who(a.github)) ?? {key: KEYS.get(a.github.toLowerCase()), id: accounts.get(a.github.toLowerCase()), login: KEYS.get(a.github.toLowerCase()), logins: new Set(), name: a.name, motions: []};
    c.logins.add(a.github.toLowerCase());
    c.motions.push(r);
    map.set(who(a.github), c);
  }
  await Promise.all([...map.values()].map(async (c) => {
    const mine = new Set(c.motions.map((r) => r.slug));
    c.builtOnBy = rows.filter((r) => !mine.has(r.slug) && (r.basedOn ?? []).some((b) => mine.has(b.id)));
    c.login = (await loginNow(c.id)) ?? c.login;
    c.formerly = [...c.logins].filter((l) => l !== c.login.toLowerCase());
  }));
  return [...map.values()].sort((a, b) => b.motions.length - a.motions.length || (a.key < b.key ? -1 : 1));
})();
const creatorOf = new Map(creators.flatMap((c) => [...c.logins].map((l) => [l, c])));
/** The creator a login belongs to: the account it is recorded for, whatever it is called now. */
export const creator = (login) => creatorOf.get(login.toLowerCase());
/** A creator's page, by the creator or by any login they have published under. */
export const creatorPath = (c) => `/creators/${typeof c === 'string' ? (creatorOf.get(c.toLowerCase())?.key ?? c.toLowerCase()) : c.key}/`;
/** A creator's picture: by account id, which a rename does not change, from motionhub itself (site/avatars.mjs); else GitHub's, by login. */
export const avatar = (c, size = 64) => (typeof c?.id === 'number' ? `/avatar/${c.id}?s=${size}` : `https://github.com/${c.login}.png?size=${size}`);

/** A poster's smaller copies (site/thumbs.mjs) as a srcset, the poster itself the largest. */
export const posterSet = (poster) => `${poster.replace(/\.jpg$/, '-480.webp')} 480w, ${poster.replace(/\.jpg$/, '-960.webp')} 960w, ${poster} 1920w`;
export const CARD_SIZES = '(max-width: 520px) calc(100vw - 32px), (max-width: 900px) 45vw, 260px';
