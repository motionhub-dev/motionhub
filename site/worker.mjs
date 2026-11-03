// motionhub.dev's Worker. The pages and files come from the static build (dist/); packages come from the R2 bucket,
// where every version ever published stays (HUB.md), since the build only holds the newest ones, and so do the
// motions' sample videos (samples.json), with byte ranges for a player.
//
// It also counts, with no cookie and nothing that names a person (HUB.md, "Counts"): a download of a package and a
// view of a motion's page, each as one Analytics Engine data point [kind, id, version, country]. /api/stats.json
// gives each motion's downloads, in all and in the last 30 days. Analytics Engine keeps three months, so a daily
// cron adds each finished day to stats/totals.json in the bucket; the total is that plus what came since.

const PACKAGE = /^\/m\/((?:@[a-z0-9-]+\/)?[a-z0-9-]+)\/([0-9A-Za-z.+-]+)\.tgz$/;
const PAGE = /^\/m\/((?:@[a-z0-9-]+\/)?[a-z0-9-]+)\/$/;
const SAMPLE = /^\/m\/((?:@[a-z0-9-]+\/)?[a-z0-9-]+)\/sample-[0-9a-f]{12}\.mp4$/;
const DATASET = 'events.analyticsEngine.motionhub_events';
const TOTALS = 'stats/totals.json';
const DAY = 86400000;
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

/** The public counts: each motion's downloads in all and in the last 30 days. */
export async function stats(env, now = Date.now()) {
  const kept = await totals(env);
  const since = kept.through ? new Date(Date.parse(kept.through) + DAY) : new Date(dayStart(now) - 89 * DAY);
  const [recent, month] = await Promise.all([downloads(env, since), downloads(env, new Date(now - 30 * DAY))]);
  const ids = new Set([...Object.keys(kept.downloads), ...Object.keys(recent), ...Object.keys(month)]);
  const motions = {};
  for (const id of [...ids].sort()) motions[id] = {downloads: {total: (kept.downloads[id] ?? 0) + (recent[id] ?? 0), last30: month[id] ?? 0}};
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
    'cache-control': `public, max-age=${status === 200 ? 600 : 60}`,
    'access-control-allow-origin': '*',
  }});
  if (status === 200) ctx.waitUntil(cache.put(key, response.clone()));
  return response;
}

async function packageResponse(request, env, ctx, [, id, version], pathname) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', {status: 405, headers: {allow: 'GET, HEAD'}});
  const object = await env.PACKAGES.get(pathname.slice(1));
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

/** A sample video from R2, with byte ranges, so a player can seek and a browser can fetch only the start */
async function sampleResponse(request, env, pathname) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', {status: 405, headers: {allow: 'GET, HEAD'}});
  const object = await env.PACKAGES.get(pathname.slice(1), {range: request.headers});
  if (!object) return new Response('Not found', {status: 404});
  const headers = new Headers({'content-type': 'video/mp4', 'accept-ranges': 'bytes', 'cache-control': 'public, max-age=31536000, immutable', 'access-control-allow-origin': '*', etag: object.httpEtag});
  const range = object.range;
  if (range && request.headers.has('range')) {
    const start = range.offset ?? (range.suffix !== undefined ? object.size - range.suffix : 0);
    const length = range.length ?? (range.suffix ?? object.size - start);
    headers.set('content-range', `bytes ${start}-${start + length - 1}/${object.size}`);
    headers.set('content-length', String(length));
    return new Response(request.method === 'HEAD' ? null : object.body, {status: 206, headers});
  }
  headers.set('content-length', String(object.size));
  return new Response(request.method === 'HEAD' ? null : object.body, {headers});
}

export default {
  async fetch(request, env, ctx) {
    const {pathname} = new URL(request.url);
    if (pathname === '/api/stats.json') return statsResponse(request, env, ctx);
    const pkg = PACKAGE.exec(pathname);
    if (pkg) return packageResponse(request, env, ctx, pkg, pathname);
    if (SAMPLE.test(pathname)) return sampleResponse(request, env, pathname);
    const response = await env.ASSETS.fetch(request);
    // a person opening a motion's page: a document navigation that found the page
    const page = PAGE.exec(pathname);
    if (page && request.method === 'GET' && response.status === 200 && request.headers.get('sec-fetch-dest') === 'document') count(env, request, 'view', page[1]);
    return response;
  },
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(rollup(env));
  },
};
