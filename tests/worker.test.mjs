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
