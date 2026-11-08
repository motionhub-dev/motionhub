// motionhub.dev's Worker. The pages and files come from the static build (dist/); packages and the videos of reels come
// from the R2 bucket, where every version ever published stays (HUB.md), since the build only holds the newest ones.
//
// It also counts, with no cookie and nothing that names a person (HUB.md, "Counts"): a download of a package and a
// view of a motion's page, each as one Analytics Engine data point [kind, id, version, country]. /api/stats.json
// gives each motion's downloads, in all and in the last 30 days, and its likes (people.mjs, with signing in). Analytics Engine keeps three months, so a daily
// cron adds each finished day to stats/totals.json in the bucket; the total is that plus what came since.

import {likeCounts, people} from './people.mjs';
import {avatar} from './avatars.mjs';
import {submissions, sweep} from './submissions.mjs';

const PACKAGE = /^\/m\/((?:@[a-z0-9-]+\/)?[a-z0-9-]+)\/([0-9A-Za-z.+-]+)\.tgz$/;
// the video of a motion at a version (site/player/render.mjs), beside its package: the default player on its page
const VIDEO = /^\/m\/@[a-z0-9-]+\/[a-z0-9-]+\/[0-9A-Za-z.+-]+\.mp4$/;
const PAGE = /^\/m\/((?:@[a-z0-9-]+\/)?[a-z0-9-]+)\/$/;
const DATASET = 'events.analyticsEngine.motionhub_events';
const TOTALS = 'stats/totals.json';
const DAY = 86400000;
/** Docs pages that are no longer on the site (tools/docs.mjs), at the documents they were, on GitHub. */
const BLOB = 'https://github.com/motionhub-dev/motions/blob/main/';
const LEFT_THE_DOCS = {hub: 'HUB.md', skill: 'skills/motionhub/SKILL.md'};
const LEFT_PAGE = /^\/docs\/(hub|skill)(?:\/|\.md)?$/;
/** Clients that are not people: crawlers and link previews. A command line or an agent fetching a package is counted. */
const ROBOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|monitor/i;

/** The start of a UTC day, as an ISO string, and the day as YYYY-MM-DD. */
const dayStart = (t) => new Date(Math.floor(t / DAY) * DAY);
const ymd = (d) => d.toISOString().slice(0, 10);

/** Counts one event; never fails the request. */
export function count(env, request, kind, id, version = '') {
  try {
    if (ROBOT.test(request.headers.get('user-agent') ?? '')) return false;
    env.EVENTS?.writeDataPoint({indexes: [id.slice(0, 96)], blobs: [kind, id, version, request.cf?.country ?? '']});
    return true;
  } catch {
    return false;
  }
}

/** Downloads per motion since `from` (and before `to`), as {id: n}. */
async function downloads(env, from, to) {
  const query = `SELECT blob2 AS id, COUNT(*) AS n FROM ${DATASET} WHERE timestamp >= $from${to ? ' AND timestamp < $to' : ''} AND blob1 = 'download' GROUP BY blob2`;
  const result = await env.ANALYTICS_SQL.query({query, params: to ? {from: from.toISOString(), to: to.toISOString()} : {from: from.toISOString()}});
  return Object.fromEntries(result.data.map((r) => [r.id, Number(r.n)]));
}

async function totals(env) {
  const object = await env.PACKAGES.get(TOTALS);
  return object ? await object.json() : {through: null, downloads: {}};
}

/** Adds every finished day since the last one added to stats/totals.json. Run daily; running it twice adds nothing. */
export async function rollup(env, now = Date.now()) {
  const kept = await totals(env);
  const today = dayStart(now);
  const from = kept.through ? new Date(Date.parse(kept.through) + DAY) : new Date(today - 89 * DAY);
  if (from >= today) return kept;
  const added = await downloads(env, from, today);
  for (const [id, n] of Object.entries(added)) kept.downloads[id] = (kept.downloads[id] ?? 0) + n;
  kept.through = ymd(new Date(today - DAY));
  await env.PACKAGES.put(TOTALS, JSON.stringify(kept), {httpMetadata: {contentType: 'application/json'}});
  return kept;
}

/** The public counts: each motion's downloads in all and in the last 30 days, and its likes. */
export async function stats(env, now = Date.now()) {
  const kept = await totals(env);
  const since = kept.through ? new Date(Date.parse(kept.through) + DAY) : new Date(dayStart(now) - 89 * DAY);
  const [recent, month, likes] = await Promise.all([
    downloads(env, since),
    downloads(env, new Date(now - 30 * DAY)),
    likeCounts(env).catch((e) => (console.error('likes', e?.message), {})),
  ]);
  const ids = new Set([...Object.keys(kept.downloads), ...Object.keys(recent), ...Object.keys(month), ...Object.keys(likes)]);
  const motions = {};
  for (const id of [...ids].sort()) motions[id] = {downloads: {total: (kept.downloads[id] ?? 0) + (recent[id] ?? 0), last30: month[id] ?? 0}, likes: likes[id] ?? 0};
  return {generated: new Date(now).toISOString(), motions};
}

async function statsResponse(request, env, ctx) {
  const cache = caches.default, key = new Request(new URL('/api/stats.json', request.url));
  const hit = await cache.match(key);
  if (hit) return hit;
  let body, status = 200;
  try {
    body = await stats(env);
  } catch (e) {
    console.error('stats', e?.message);
    body = {generated: new Date().toISOString(), motions: {}, error: 'counts are not available right now'};
    status = 503;
  }
  const response = new Response(JSON.stringify(body), {status, headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': `public, max-age=${status === 200 ? 300 : 60}`,
    'access-control-allow-origin': '*',
  }});
  if (status === 200) ctx.waitUntil(cache.put(key, response.clone()));
  return response;
}

async function packageResponse(request, env, ctx, [, id, version], pathname) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', {status: 405, headers: {allow: 'GET, HEAD'}});
  // every motion on the hub has a scope (HUB.md): the packages of the unscoped ids it once had are no longer served
  const object = id.startsWith('@') ? await env.PACKAGES.get(pathname.slice(1)) : null;
  if (!object) {
    const page = await env.ASSETS.fetch(new Request(new URL('/404.html', request.url)));
    return new Response(page.body, {status: 404, headers: page.headers});
  }
  if (request.method === 'GET') count(env, request, 'download', id, version);
  const headers = new Headers({
    'content-type': 'application/gzip',
    'content-disposition': `attachment; filename="${id.replace('@', '').replace('/', '-')}-${version}.tgz"`,
    'cache-control': 'public, max-age=31536000, immutable',
    'access-control-allow-origin': '*',
    etag: object.httpEtag,
  });
  return new Response(request.method === 'HEAD' ? null : object.body, {headers});
}

/**
 * The bytes a Range header asks of an object of `size` bytes, as {offset, length}: undefined for the whole object (no
 * header, one that is not a single byte range, or one the client may ignore), null for a range that lies outside it
 */
export function byteRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec((header ?? '').trim());
  if (!m || (!m[1] && !m[2])) return undefined;
  if (!m[1]) {
    // the last n bytes
    const n = Math.min(Number(m[2]), size);
    return n > 0 ? {offset: size - n, length: n} : null;
  }
  const start = Number(m[1]), end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  return start < size && start <= end ? {offset: start, length: end - start + 1} : null;
}

/** Whether an If-None-Match header names `etag`: any of its list, compared weakly (RFC 9110 §13.1.2), or `*` */
const matchesNone = (header, etag) => !!header && header.split(',').some((t) => { t = t.trim(); return t === '*' || t.replace(/^W\//, '') === etag.replace(/^W\//, ''); });

/**
 * A motion's video from R2, as a phone's player asks for it: a HEAD for its size, then ranges of it (Safari plays nothing
 * that does not answer a Range with 206). The video of a version never changes (deploy refuses to replace one), so a
 * browser keeps it a year and revalidates by its etag; the bytes are read from the object the size came from. Not
 * counted: the page that plays it already was
 */
async function videoResponse(request, env, pathname) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', {status: 405, headers: {allow: 'GET, HEAD'}});
  const key = pathname.slice(1);
  const meta = await env.PACKAGES.head(key);
  if (!meta) return new Response('Not found', {status: 404, headers: {'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=60', 'access-control-allow-origin': '*'}});
  const headers = new Headers({'accept-ranges': 'bytes', 'access-control-allow-origin': '*', etag: meta.httpEtag});
  // If-Range: a range of the copy the client holds, or the whole video when that copy is not this one
  const ifRange = request.headers.get('if-range');
  const range = ifRange && ifRange !== meta.httpEtag ? undefined : byteRange(request.headers.get('range'), meta.size);
  if (range === null) {
    headers.set('content-range', `bytes */${meta.size}`);
    headers.set('cache-control', 'no-store');
    return new Response(null, {status: 416, headers});
  }
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  if (matchesNone(request.headers.get('if-none-match'), meta.httpEtag)) return new Response(null, {status: 304, headers});
  headers.set('content-type', 'video/mp4');
  if (range) headers.set('content-range', `bytes ${range.offset}-${range.offset + range.length - 1}/${meta.size}`);
  headers.set('content-length', String(range ? range.length : meta.size));
  if (request.method === 'HEAD') return new Response(null, {status: range ? 206 : 200, headers});
  const object = await env.PACKAGES.get(key, {...(range ? {range} : {}), onlyIf: {etagMatches: meta.etag}});
  // replaced between the two reads: the size and the bytes would be of different videos, so the client asks again
  if (!object?.body) return new Response('The video changed while it was read: try again', {status: 503, headers: {'retry-after': '1', 'cache-control': 'no-store'}});
  return new Response(object.body, {status: range ? 206 : 200, headers});
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // a motion's id starts with its scope's @, which a link keeps as it is and a browser may send as %40: the routes
    // below read the id, so they see one spelling
    let pathname = url.pathname;
    try { pathname = decodeURIComponent(pathname); } catch {}
    const left = LEFT_PAGE.exec(pathname);
    if (left) return Response.redirect(BLOB + LEFT_THE_DOCS[left[1]], 301);
    if (pathname === '/api/stats.json') return statsResponse(request, env, ctx);
    const face = /^\/avatar\/([^/]+)$/.exec(pathname);
    if (face && (request.method === 'GET' || request.method === 'HEAD')) return avatar(request, env, ctx, face[1]);
    const own = await people(request, env, ctx);
    if (own) return own;
    const shared = await submissions(request, env);
    if (shared) return shared;
    // a share's page is one static page for every share: its script reads the id from the address
    if (/^\/share\/[A-Za-z0-9_-]{22}\/?$/.test(pathname) && request.method === 'GET') {
      const page = await env.ASSETS.fetch(new Request(new URL('/share/', request.url), request));
      return new Response(page.body, {status: page.status, headers: new Headers({...Object.fromEntries(page.headers), 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex'})});
    }
    if (VIDEO.test(pathname)) return videoResponse(request, env, pathname);
    const pkg = PACKAGE.exec(pathname);
    if (pkg) return packageResponse(request, env, ctx, pkg, pathname);
    // the static files under m/@<scope>/ and play/@<scope>/ (wrangler.jsonc runs the Worker first for both) are found
    // at the %40 spelling; asked for with @, the
    // assets would answer with a redirect to it, so the Worker asks for it directly and the address keeps its @
    let response;
    if (url.pathname.includes('@')) {
      const at = new URL(url);
      at.pathname = url.pathname.replaceAll('@', '%40');
      response = await env.ASSETS.fetch(new Request(at, request));
    } else response = await env.ASSETS.fetch(request);
    // a person opening a motion's page: a document navigation that found the page
    const page = PAGE.exec(pathname);
    if (page && request.method === 'GET' && response.status === 200 && request.headers.get('sec-fetch-dest') === 'document') count(env, request, 'view', page[1]);
    return response;
  },
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(rollup(env));
    ctx.waitUntil(sweep(env).then((result) => console.log(JSON.stringify({event: 'submission_sweep', ...result}))).catch(() => console.error('submission_sweep_failed')));
  },
};
