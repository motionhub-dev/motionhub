// The Worker: it serves packages from R2 and counts a download, counts a person's view of a motion's page and nothing
// else, and adds finished days to the totals once.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker, {count, rollup, stats} from '../site/worker.mjs';

const DAY = 86400000;
const NOW = Date.parse('2026-11-03T12:00:00Z');

function env({rows = [], totals = null} = {}) {
  const points = [], queries = [], store = new Map(totals ? [['stats/totals.json', JSON.stringify(totals)]] : []);
  store.set('m/@ana/red-pencil/1.0.2.tgz', 'tgz');
  return {
    points, queries, store,
    EVENTS: {writeDataPoint: (p) => points.push(p)},
    ANALYTICS_SQL: {query: async (q) => { queries.push(q); return {data: typeof rows === 'function' ? rows(q) : rows, rows: 0}; }},
    PACKAGES: {
      get: async (k) => (store.has(k) ? {body: store.get(k), httpEtag: '"e"', json: async () => JSON.parse(store.get(k))} : null),
      put: async (k, v) => store.set(k, v),
    },
    ASSETS: {fetch: async (r) => new Response(new URL(r.url).pathname === '/m/red-pencil/' ? 'page' : 'missing', {status: new URL(r.url).pathname === '/m/red-pencil/' ? 200 : 404})},
  };
}
const ctx = {waitUntil() {}};
const req = (path, headers = {}, method = 'GET') => new Request(`https://motionhub.dev${path}`, {method, headers});

test('a package is served from R2 and its download counted, a HEAD and a robot are not', async () => {
  const e = env();
  const r = await worker.fetch(req('/m/@ana/red-pencil/1.0.2.tgz', {'user-agent': 'node'}), e, ctx);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'application/gzip');
  assert.deepEqual(e.points, [{indexes: ['@ana/red-pencil'], blobs: ['download', '@ana/red-pencil', '1.0.2', '']}]);
  await worker.fetch(req('/m/@ana/red-pencil/1.0.2.tgz', {}, 'HEAD'), e, ctx);
  await worker.fetch(req('/m/@ana/red-pencil/1.0.2.tgz', {'user-agent': 'Googlebot/2.1'}), e, ctx);
  assert.equal(e.points.length, 1);
  assert.equal((await worker.fetch(req('/m/@ana/red-pencil/9.9.9.tgz'), e, ctx)).status, 404);
  assert.equal(e.points.length, 1);
  e.store.set('m/red-pencil/1.0.2.tgz', 'tgz');
  assert.equal((await worker.fetch(req('/m/red-pencil/1.0.2.tgz'), e, ctx)).status, 404, 'an unscoped id is no longer served');
});

test('a view is a document navigation to a motion page that exists', async () => {
  const e = env();
  await worker.fetch(req('/m/red-pencil/', {'sec-fetch-dest': 'document'}), e, ctx);
  await worker.fetch(req('/m/red-pencil/'), e, ctx);
  await worker.fetch(req('/m/nothing/', {'sec-fetch-dest': 'document'}), e, ctx);
  await worker.fetch(req('/m/red-pencil/poster.jpg', {'sec-fetch-dest': 'document'}), e, ctx);
  assert.deepEqual(e.points.map((p) => p.blobs.slice(0, 2)), [['view', 'red-pencil']]);
});

test('a scoped page is served at its @ address without a redirect, and counted under its id either way', async () => {
  const asked = [];
  const e = {...env(), ASSETS: {fetch: async (r) => { asked.push(new URL(r.url).pathname); return new Response('page', {status: new URL(r.url).pathname === '/m/%40ana/red-pencil/' ? 200 : 307}); }}};
  const r = await worker.fetch(req('/m/@ana/red-pencil/', {'sec-fetch-dest': 'document'}), e, ctx);
  assert.equal(r.status, 200);
  await worker.fetch(req('/m/%40ana/red-pencil/', {'sec-fetch-dest': 'document'}), e, ctx);
  assert.deepEqual(asked, ['/m/%40ana/red-pencil/', '/m/%40ana/red-pencil/']);
  assert.deepEqual(e.points.map((p) => p.blobs.slice(0, 2)), [['view', '@ana/red-pencil'], ['view', '@ana/red-pencil']]);
});

test('a docs page that left the site goes to its document on GitHub, and nothing else does', async () => {
  const e = env();
  for (const [path, to] of [
    ['/docs/hub/', 'HUB.md'], ['/docs/hub', 'HUB.md'], ['/docs/hub.md', 'HUB.md'],
    ['/docs/skill/', 'skills/motionhub/SKILL.md'], ['/docs/skill', 'skills/motionhub/SKILL.md'], ['/docs/skill.md', 'skills/motionhub/SKILL.md'],
  ]) {
    const r = await worker.fetch(req(path), e, ctx);
    assert.equal(r.status, 301, path);
    assert.equal(r.headers.get('location'), `https://github.com/motionhub-dev/motions/blob/main/${to}`);
  }
  assert.equal((await worker.fetch(req('/docs/hubs/'), e, ctx)).status, 404);
});

test('counting never fails a request', () => {
  assert.equal(count({EVENTS: {writeDataPoint() { throw new Error('down'); }}}, req('/'), 'view', 'x'), false);
  assert.equal(count({}, req('/'), 'view', 'x'), true);
});

test('rollup adds each finished day once', async () => {
  const e = env({rows: [{id: 'red-pencil', n: 3}], totals: {through: '2026-11-01', downloads: {'red-pencil': 10}}});
  const kept = await rollup(e, NOW);
  assert.deepEqual(kept, {through: '2026-11-02', downloads: {'red-pencil': 13}});
  assert.equal(e.queries[0].params.from, '2026-11-02T00:00:00.000Z');
  assert.equal(e.queries[0].params.to, '2026-11-03T00:00:00.000Z');
  assert.deepEqual(await rollup(e, NOW), kept);
  assert.equal(e.queries.length, 1);
});

test('the first rollup reaches back as far as Analytics Engine keeps', async () => {
  const e = env({rows: []});
  const kept = await rollup(e, NOW);
  assert.equal(kept.through, '2026-11-02');
  assert.equal(e.queries[0].params.from, new Date(Date.parse('2026-11-03T00:00:00Z') - 89 * DAY).toISOString());
});

test('stats: the totals plus what came since, and the last 30 days', async () => {
  const e = env({totals: {through: '2026-11-01', downloads: {'red-pencil': 10, 'ink-scroll': 2}}, rows: (q) => (q.params.from.startsWith('2026-11-02') ? [{id: 'red-pencil', n: 4}] : [{id: 'red-pencil', n: 9}, {id: '@ana/ledger', n: 1}])});
  const s = await stats(e, NOW);
  assert.deepEqual(s.motions, {
    '@ana/ledger': {downloads: {total: 0, last30: 1}, likes: 0},
    'ink-scroll': {downloads: {total: 2, last30: 0}, likes: 0},
    'red-pencil': {downloads: {total: 14, last30: 9}, likes: 0},
  });
  for (const q of e.queries) assert.match(q.query, /FROM events\.analyticsEngine\.motionhub_events WHERE timestamp >= \$from/);
});

test('avatars: only the accounts motionhub shows, from GitHub once a day, the last copy when GitHub fails', async () => {
  const {size} = await import('../site/avatars.mjs');
  assert.deepEqual([1, 32, 33, 56, 160, 161, 999, 'x'].map(size), [32, 32, 56, 56, 160, 192, 320, 32]);
  // the edge cache, as Cloudflare's Cache API: a copy is kept for its max-age
  let now = 0;
  const kept = new Map();
  globalThis.caches = {default: {
    match: async (r) => { const k = kept.get(r.url); return k && k.until > now ? k.response.clone() : undefined; },
    put: async (r, res) => { kept.set(r.url, {until: now + Number(/max-age=(\d+)/.exec(res.headers.get('cache-control'))[1]), response: res.clone()}); },
  }};
  const waits = [];
  const ctx = {waitUntil: (p) => waits.push(p)};
  const signedIn = new Set([42]);
  const e = {
    ASSETS: {fetch: async (r) => (new URL(r.url).pathname === '/api/accounts.json' ? Response.json({iamsuosi: 264293696}) : new Response('', {status: 404}))},
    DB: {prepare: () => ({bind: (id) => ({first: async () => (signedIn.has(id) ? {ok: 1} : null)})})},
  };
  const asked = [];
  let github = 'up';
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    asked.push(String(url));
    if (github === 'down') throw new Error('unreachable');
    if (github === 'svg') return new Response('<svg onload="alert(1)"/>', {headers: {'content-type': 'image/svg+xml'}});
    return new Response(new Uint8Array([0xff, 0xd8, github === 'new' ? 2 : 1]), {headers: {'content-type': 'image/jpeg', 'cache-control': 'max-age=300'}});
  };
  const get = async (path) => { const r = await worker.fetch(new Request(`https://motionhub.dev${path}`), e, ctx); await Promise.all(waits.splice(0)); return r; };
  try {
    assert.equal((await get('/avatar/7?s=64')).status, 404, 'an account motionhub does not show');
    assert.equal((await get('/avatar/abc')).status, 404);
    assert.equal(asked.length, 0, 'and GitHub is not asked for it');

    let r = await get('/avatar/264293696?s=150');
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('content-type'), 'image/jpeg');
    assert.match(r.headers.get('cache-control'), /^public, max-age=86400, stale-while-revalidate=604800$/);
    assert.deepEqual(asked, ['https://avatars.githubusercontent.com/u/264293696?s=160&v=4'], 'at a fixed size');
    await get('/avatar/264293696?s=160');
    assert.equal(asked.length, 1, 'then served from the edge');
    assert.equal((await get('/avatar/42?s=56')).status, 200, 'someone who signed in');

    now = 86400 + 1; github = 'down';
    r = await get('/avatar/264293696?s=160');
    assert.deepEqual([...new Uint8Array(await r.arrayBuffer())], [0xff, 0xd8, 1], 'GitHub down: the last copy');
    assert.equal(r.headers.get('cache-control'), 'public, max-age=300');
    const tries = asked.length;
    await get('/avatar/264293696?s=64');
    assert.equal(asked.length, tries, 'a failure is remembered for a minute: GitHub is not waited on again');
    now = 31 * 86400;
    r = await get('/avatar/264293696?s=160');
    assert.equal(r.headers.get('content-type'), 'image/svg+xml', 'no copy left: an empty picture, not a broken one');
    assert.equal(await r.text(), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>');
    now += 61; github = 'svg';
    r = await get('/avatar/264293696?s=96');
    assert.equal(await r.text(), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>', 'an SVG from GitHub is never served from this origin');
    assert.equal((await worker.fetch(new Request('https://motionhub.dev/avatar/264293696?s=96', {method: 'HEAD'}), e, ctx)).status, 200, 'HEAD too');
    signedIn.delete(42);
    assert.equal((await get('/avatar/42?s=128')).status, 404, 'someone forgotten (DELETE /api/me) is no longer served');
    github = 'new';
    r = await get('/avatar/264293696?s=160');
    assert.deepEqual([...new Uint8Array(await r.arrayBuffer())], [0xff, 0xd8, 2], 'back up: the new avatar');
  } finally { globalThis.fetch = realFetch; globalThis.caches = undefined; }
});
