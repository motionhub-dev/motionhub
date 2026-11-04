// The catalogue as the pages see it: the index tools/build.mjs wrote to ../dist (.cache/dev-public in development),
// and each motion's own files in ../motions. Read once per build.
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {SPEC, readAccounts} from '../../../tools/check.mjs';
import {REPO, SITE, colours, creatorKeys, en, faces, markdown, other} from '../../../tools/site.mjs';

export {REPO, SITE, SPEC, colours, en, faces, markdown, other};

/** The repository's root: the build runs in site/. */
export const ROOT = resolve(process.cwd(), '..');
const index = join(ROOT, process.env.MOTIONHUB_DEV ? 'site/.cache/dev-public' : 'dist', 'api/motions.json');
if (!existsSync(index)) throw new Error(`no ${index}: npm run dev or npm run build in site/ writes it`);

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

/** What a search matches: the id, every name and line in every language, the tags, the engines and the authors. */
export const searchText = (r) => [r.slug, ...Object.values(r.name), ...Object.values(r.line), ...r.tags, ...r.tools, ...r.tools.flatMap(toolEngines), ...r.authors.flatMap((a) => [a.name, a.github])].join(' ').toLowerCase();

const GROUNDS = ['light', 'dark'];
const TYPES = {serif: 'Serif', 'sans-serif': 'Sans', monospace: 'Mono', cursive: 'Hand'};
const SIZES = [['small', 'Under 150 KB', 150], ['medium', '150 to 300 KB', 300], ['large', 'Over 300 KB', Infinity]];
const HUES = [['red', 15], ['orange', 45], ['yellow', 70], ['green', 170], ['blue', 260], ['purple', 335], ['red', 360]];
const title = (s) => s[0].toUpperCase() + s.slice(1);

/** A colour's family by its hue, or null when it is too grey to have one. */
function family(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), chroma = max - Math.min(r, g, b);
  if (chroma < 0.3) return null;
  const h = (max === r ? ((g - b) / chroma + 6) % 6 : max === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4) * 60;
  return HUES.find(([, end]) => h < end)[0];
}

const palette = (r) => { try { return colours(JSON.parse(read(r.slug, 'tokens.json'))); } catch { return []; } };

/** What the gallery filters a motion by, each a list of values. Colour and type are read from its tokens. */
export function motionFacets(r) {
  const kb = r.package.bytes / 1024;
  let fonts = [];
  try { fonts = faces(JSON.parse(read(r.slug, 'tokens.json'))); } catch {}
  return {
    tag: r.tags,
    colour: [...new Set(palette(r).map((c) => family(c.hex)).filter(Boolean))],
    type: [...new Set(fonts.flatMap((f) => f.faces).filter((f) => TYPES[f]))],
    size: [SIZES.find(([, , under]) => kb < under)[0]],
    engine: [...new Set(r.tools.flatMap(toolEngines))],
    by: r.authors.map((a) => a.github),
  };
}

/** The gallery's filters. A value every motion has tells them apart from nothing, so it is left out, and so is a filter left with one value. */
export function galleryFacets() {
  const all = rows.map((r) => ({r, f: motionFacets(r)}));
  const options = (key, text, swatch) => {
    const counts = new Map();
    for (const {f} of all) for (const v of f[key]) counts.set(v, (counts.get(v) ?? 0) + 1);
    return [...counts].map(([value, count]) => ({value, count, text: text(value), swatch: swatch?.(value)}));
  };
  const byCount = (a, b) => b.count - a.count || (a.text < b.text ? -1 : 1);
  // a colour family's swatch is a colour a motion in it really uses, so the page decides no colour of its own
  const swatch = (value) => all.flatMap(({r}) => palette(r)).find((c) => family(c.hex) === value)?.hex;
  const authors = new Map(rows.flatMap((r) => r.authors.map((a) => [a.github, a.name])));
  const tags = options('tag', (v) => v).sort(byCount);
  const facets = [
    {key: 'tag', label: 'Ground', options: tags.filter((o) => GROUNDS.includes(o.value)).map((o) => ({...o, text: title(o.value)}))},
    {key: 'tag', label: 'Style', options: tags.filter((o) => !GROUNDS.includes(o.value))},
    {key: 'colour', label: 'Colour', options: options('colour', title, swatch).sort(byCount)},
    {key: 'type', label: 'Type', options: options('type', (v) => TYPES[v]).sort(byCount)},
    {key: 'size', label: 'Package', options: SIZES.map(([value, text]) => options('size', () => text).find((o) => o.value === value)).filter(Boolean)},
    {key: 'engine', label: 'Engine', options: options('engine', (v) => v).sort(byCount)},
    {key: 'by', label: 'Creator', options: options('by', (v) => authors.get(v) ?? v).sort(byCount)},
  ];
  return facets.map((f) => ({...f, options: f.options.filter((o) => o.count < rows.length)})).filter((f) => f.options.length > 1);
}

/** The prompt that works in any agent, and the skill that makes it shorter: installed for every agent by skills. */
export const TOPIC = '<your topic>';
export const agentPrompt = (id, topic = TOPIC) => `Read ${SITE}/llms.txt, then make a film about "${topic}" in the motion ${id}`;
export const skillInstall = 'npx skills add motionhub-dev/motions -g';

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
