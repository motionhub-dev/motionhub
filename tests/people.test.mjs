// Signing in with GitHub and likes (site/people.mjs), against the real schema in an in-memory SQLite that stands in
// for D1, with GitHub's two endpoints faked.
import {test, beforeEach, afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import worker from '../site/worker.mjs';
import {safeNext, sha256} from '../site/people.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const SITE = 'https://motionhub.dev';

/** The part of D1's API the Worker uses, over node:sqlite. */
function d1() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;' + readFileSync(join(ROOT, 'site/migrations/0001_people_and_likes.sql'), 'utf8'));
  const statement = (sql, args = []) => ({
    sql, args,
    bind: (...a) => statement(sql, a),
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({results: db.prepare(sql).all(...args)}),
    run: async () => db.prepare(sql).run(...args),
  });
  return {raw: db, prepare: (sql) => statement(sql), batch: async (list) => { for (const s of list) await s.run(); }};
}

let env, realFetch;
const ctx = {waitUntil() {}};
beforeEach(() => {
  env = {
    DB: d1(),
    GITHUB_CLIENT_ID: 'client-id',
    GITHUB_CLIENT_SECRET: 'client-secret',
    ASSETS: {fetch: async (r) => (new URL(r.url).pathname === '/api/motions.json' ? Response.json({motions: [{slug: 'red-pencil'}, {slug: '@ana/ledger'}]}) : new Response('', {status: 404}))},
    PACKAGES: {get: async () => null},
    ANALYTICS_SQL: {query: async () => ({data: []})},
  };
  realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url) === 'https://github.com/login/oauth/access_token') {
      const body = JSON.parse(init.body);
      return Response.json(body.code === 'good' && body.client_secret === 'client-secret' ? {access_token: 'gh-token'} : {error: 'bad_verification_code'});
    }
    if (String(url) === 'https://api.github.com/user') return Response.json({id: 42, login: 'Ana', name: 'Ana Lee', avatar_url: 'https://avatars.githubusercontent.com/u/42'});
    throw new Error(`unexpected fetch ${url}`);
  };
});
afterEach(() => { globalThis.fetch = realFetch; });

const get = (path, headers = {}) => worker.fetch(new Request(SITE + path, {headers}), env, ctx);
const send = (method, path, headers = {}) => worker.fetch(new Request(SITE + path, {method, headers}), env, ctx);
const setCookies = (r) => r.headers.getSetCookie();

async function signIn(next = '/m/red-pencil/') {
  const start = await get(`/auth/login?next=${encodeURIComponent(next)}`);
  const state = new URL(start.headers.get('location')).searchParams.get('state');
  const stateCookie = setCookies(start)[0].split(';')[0];
  const done = await get(`/auth/callback?code=good&state=${state}`, {cookie: stateCookie});
  const session = setCookies(done).find((c) => c.startsWith('mh_session=')).split(';')[0];
  return {done, cookie: session};
}

test('login sends the person to GitHub with no scope and a state remembered in a cookie for /auth/', async () => {
  const r = await get('/auth/login?next=/m/red-pencil/');
  assert.equal(r.status, 302);
  const to = new URL(r.headers.get('location'));
  assert.equal(to.origin + to.pathname, 'https://github.com/login/oauth/authorize');
  assert.equal(to.searchParams.get('client_id'), 'client-id');
  assert.equal(to.searchParams.get('redirect_uri'), `${SITE}/auth/callback`);
  assert.equal(to.searchParams.get('scope'), null);
  const [c] = setCookies(r);
  assert.match(c, /^mh_state=[\w-]{43}%20%2Fm%2Fred-pencil%2F; Path=\/auth\/; Max-Age=600; Secure; SameSite=Lax; HttpOnly$/);
});

test('a callback whose state does not match is refused', async () => {
  const r = await get('/auth/callback?code=good&state=forged', {cookie: 'mh_state=real%20%2F'});
  assert.equal(r.status, 400);
  assert.equal(env.DB.raw.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 0);
});

test('a callback signs the person in, keeps only the hash of the session and never GitHub\'s token', async () => {
  const {done, cookie} = await signIn();
  assert.equal(done.status, 302);
  assert.equal(done.headers.get('location'), '/m/red-pencil/');
  const cs = setCookies(done);
  assert.ok(cs.some((c) => /^mh_session=[\w-]{43}; Path=\/; Max-Age=2592000; Secure; SameSite=Lax; HttpOnly$/.test(c)));
  assert.ok(cs.some((c) => /^mh_in=1; Path=\/; Max-Age=2592000; Secure; SameSite=Lax$/.test(c)));
  const token = cookie.slice('mh_session='.length);
  const rows = env.DB.raw.prepare('SELECT * FROM sessions').all();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].token_hash, await sha256(token));
  assert.deepEqual({...env.DB.raw.prepare('SELECT id, login, name FROM people').get()}, {id: 42, login: 'Ana', name: 'Ana Lee'});
  assert.ok(!JSON.stringify(env.DB.raw.prepare('SELECT * FROM people').all()).includes('gh-token'));
  const me = await (await get('/api/me', {cookie})).json();
  assert.deepEqual(me, {person: {login: 'Ana', name: 'Ana Lee', avatar: 'https://avatars.githubusercontent.com/u/42'}, likes: []});
});

test('after signing in, only a path on this site', () => {
  assert.equal(safeNext('/m/red-pencil/'), '/m/red-pencil/');
  for (const bad of ['//evil.example', '/\\evil.example', 'https://evil.example', 'javascript:alert(1)', '', null]) assert.equal(safeNext(bad), '/');
});

test('a like needs a session, this site as its origin and a motion that exists; it counts once and can be taken back', async () => {
  const {cookie} = await signIn();
  const origin = SITE;
  assert.equal((await send('POST', '/api/likes/red-pencil', {origin})).status, 401);
  assert.equal((await send('POST', '/api/likes/red-pencil', {cookie})).status, 403);
  assert.equal((await send('POST', '/api/likes/red-pencil', {cookie, origin: 'https://evil.example'})).status, 403);
  assert.equal((await send('POST', '/api/likes/nothing-here', {cookie, origin})).status, 404);
  let r = await (await send('POST', '/api/likes/red-pencil', {cookie, origin})).json();
  assert.deepEqual(r, {motion: 'red-pencil', liked: true, likes: 1});
  r = await (await send('POST', '/api/likes/red-pencil', {cookie, origin})).json();
  assert.equal(r.likes, 1);
  await send('POST', `/api/likes/${encodeURIComponent('@ana/ledger')}`, {cookie, origin});
  assert.deepEqual((await (await get('/api/me', {cookie})).json()).likes, ['@ana/ledger', 'red-pencil']);
  globalThis.caches = {default: {match: async () => undefined, put: async () => {}}};
  const stats = await (await get('/api/stats.json')).json();
  assert.equal(stats.motions['red-pencil'].likes, 1);
  r = await (await send('DELETE', '/api/likes/red-pencil', {cookie, origin})).json();
  assert.deepEqual(r, {motion: 'red-pencil', liked: false, likes: 0});
});

test('signing out ends the session; forgetting removes the person, their likes and sessions', async () => {
  const a = await signIn();
  const b = await signIn();
  await send('POST', '/api/likes/red-pencil', {cookie: a.cookie, origin: SITE});
  assert.equal((await send('POST', '/auth/logout', {cookie: a.cookie})).status, 403);
  const out = await send('POST', '/auth/logout', {cookie: a.cookie, origin: SITE});
  assert.ok(setCookies(out).some((c) => c.startsWith('mh_session=;') && c.includes('Max-Age=0')));
  assert.deepEqual(await (await get('/api/me', {cookie: a.cookie})).json(), {person: null});
  const gone = await (await send('DELETE', '/api/me', {cookie: b.cookie, origin: SITE})).json();
  assert.deepEqual(gone, {ok: true, forgotten: true});
  for (const t of ['people', 'sessions', 'likes']) assert.equal(env.DB.raw.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n, 0, t);
});
