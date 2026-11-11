// Signing in with GitHub and likes (site/people.mjs), against the real schema in an in-memory SQLite that stands in
// for D1, with GitHub's two endpoints faked.
import {test, beforeEach, afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import worker from '../worker.mjs';
import {safeNext, sha256} from '../people.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const SITE = 'https://motionhub.dev';

/** The part of D1's API the Worker uses, over node:sqlite. */
function d1() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;' + readdirSync(join(ROOT, 'site/migrations')).filter((f) => f.endsWith('.sql')).sort().map((f) => readFileSync(join(ROOT, 'site/migrations', f), 'utf8')).join('\n'));
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
  const session = setCookies(done).find((c) => c.startsWith('__Host-mh_session=')).split(';')[0];
  return {done, cookie: session};
}

test('login sends the person to GitHub with no scope and a state remembered in a host-only cookie', async () => {
  const r = await get('/auth/login?next=/m/red-pencil/');
  assert.equal(r.status, 302);
  const to = new URL(r.headers.get('location'));
  assert.equal(to.origin + to.pathname, 'https://github.com/login/oauth/authorize');
  assert.equal(to.searchParams.get('client_id'), 'client-id');
  assert.equal(to.searchParams.get('redirect_uri'), `${SITE}/auth/callback`);
  assert.equal(to.searchParams.get('scope'), null);
  const [c] = setCookies(r);
  assert.match(c, /^__Host-mh_state=[\w-]{43}%20%2Fm%2Fred-pencil%2F; Path=\/; Max-Age=600; Secure; SameSite=Lax; HttpOnly$/);
});

test('a callback whose state does not match is refused', async () => {
  const r = await get('/auth/callback?code=good&state=forged', {cookie: '__Host-mh_state=real%20%2F'});
  assert.equal(r.status, 400);
  assert.equal(env.DB.raw.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 0);
});

test('a callback signs the person in, keeps only the hash of the session and never GitHub\'s token', async () => {
  const {done, cookie} = await signIn();
  assert.equal(done.status, 302);
  assert.equal(done.headers.get('location'), '/m/red-pencil/');
  const cs = setCookies(done);
  assert.ok(cs.some((c) => /^__Host-mh_session=[\w-]{43}; Path=\/; Max-Age=2592000; Secure; SameSite=Lax; HttpOnly$/.test(c)));
  assert.ok(cs.some((c) => /^mh_in=1; Path=\/; Max-Age=2592000; Secure; SameSite=Lax$/.test(c)));
  const token = cookie.slice('__Host-mh_session='.length);
  const rows = env.DB.raw.prepare('SELECT * FROM sessions').all();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].token_hash, await sha256(token));
  assert.deepEqual({...env.DB.raw.prepare('SELECT id, login, name FROM people').get()}, {id: 42, login: 'Ana', name: 'Ana Lee'});
  assert.ok(!JSON.stringify(env.DB.raw.prepare('SELECT * FROM people').all()).includes('gh-token'));
  const me = await (await get('/api/me', {cookie})).json();
  assert.deepEqual(me, {person: {id: 42, login: 'Ana', name: 'Ana Lee', avatar: 'https://avatars.githubusercontent.com/u/42'}, likes: []});
});

test('signing in from the header\'s Share button comes back to the share guide', async () => {
  const {done} = await signIn('/you/#share');
  assert.equal(done.headers.get('location'), '/you/#share');
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
  assert.ok(setCookies(out).some((c) => c.startsWith('__Host-mh_session=;') && c.includes('Max-Age=0')));
  assert.deepEqual(await (await get('/api/me', {cookie: a.cookie})).json(), {person: null});
  const gone = await (await send('DELETE', '/api/me', {cookie: b.cookie, origin: SITE})).json();
  assert.deepEqual(gone, {ok: true, forgotten: true});
  for (const t of ['people', 'sessions', 'likes']) assert.equal(env.DB.raw.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n, 0, t);
});

test('your pull requests: only yours by account id, with their checks, review and motions, read from GitHub', async () => {
  const {cookie} = await signIn();
  assert.equal((await get('/api/me/pulls')).status, 401, 'signed out, there is no one to look for');
  const API = 'https://api.github.com/repos/motionhub-dev/motions';
  const asked = [];
  const github = {
    '/pulls?state=open&per_page=100&sort=updated&direction=desc': [
      {number: 41, title: 'Update Field Atlas 1.1.1', html_url: 'https://github.com/motionhub-dev/motions/pull/41', updated_at: '2026-11-03T20:00:00Z', draft: false, user: {id: 42, login: 'ana-renamed'}, head: {sha: 'aaa'}},
      {number: 42, title: 'Someone else', html_url: 'x', draft: false, user: {id: 7, login: 'Ana'}, head: {sha: 'bbb'}},
      {number: 43, title: 'Add Tide Table 1.0.0', html_url: 'y', updated_at: '2026-11-03T19:00:00Z', draft: false, user: {id: 42, login: 'Ana'}, head: {sha: 'ccc'}},
      {number: 44, title: 'Add Ledger 1.0.0', html_url: 'z', updated_at: '2026-11-03T18:00:00Z', draft: false, user: {id: 9, login: 'motionhub[bot]', type: 'Bot'}, head: {sha: 'ddd', ref: 'share/ana/ledger/42', repo: {full_name: 'motionhub-dev/motions'}}, base: {repo: {full_name: 'motionhub-dev/motions'}}},
      {number: 45, title: 'Someone else\'s share', html_url: 'w', draft: false, user: {id: 9, login: 'motionhub[bot]', type: 'Bot'}, head: {sha: 'eee', ref: 'share/bo/x/8', repo: {full_name: 'motionhub-dev/motions'}}, base: {repo: {full_name: 'motionhub-dev/motions'}}},
      {number: 46, title: 'A fork\'s branch named like one', html_url: 'v', draft: false, user: {id: 10, login: 'other[bot]', type: 'Bot'}, head: {sha: 'fff', ref: 'share/ana/ledger/42', repo: {full_name: 'eve/motions'}}, base: {repo: {full_name: 'motionhub-dev/motions'}}},
    ],
    '/commits/aaa/check-runs?check_name=check&per_page=1': {check_runs: [{status: 'completed', conclusion: 'success'}]},
    '/commits/ccc/check-runs?check_name=check&per_page=1': {check_runs: [{status: 'completed', conclusion: 'failure'}]},
    '/commits/ddd/check-runs?check_name=check&per_page=1': {check_runs: []},
    '/pulls/44/files?per_page=100': [{filename: 'motions/@ana/ledger/motion.json'}],
    '/issues/44/comments?per_page=100': [],
    '/pulls/41/files?per_page=100': [{filename: 'motions/@ana/field-atlas/motion.json'}, {filename: 'motions/@ana/field-atlas/react/reel.tsx'}],
    '/pulls/43/files?per_page=100': [{filename: 'motions/@ana/tide-table/motion.json'}, {filename: 'accounts/ana.json'}, {filename: 'motions/red-pencil/MOTION.md'}],
    '/issues/41/comments?per_page=100': [{user: {login: 'claude[bot]'}, body: '**Summary.** Fine.'}],
    '/issues/43/comments?per_page=100': [{user: {login: 'claude[bot]'}, body: 'Claude Code is working…'}],
  };
  const signInFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (!u.startsWith(API)) return signInFetch(url, init);
    asked.push(u.slice(API.length));
    assert.equal(init.headers['user-agent'], 'motionhub.dev');
    const body = github[u.slice(API.length)];
    return body ? Response.json(body) : new Response('', {status: 404});
  };
  globalThis.caches = {default: {match: async () => undefined, put: async () => {}}};
  // motionhub's record of the pull requests its app opened for Ana: #44 is; #46, from a fork, is not
  const ins = env.DB.raw.prepare("INSERT INTO submissions (id, poll_hash, code, motion, version, sha256, bytes, status, person, pr, dco_at, created_at, expires_at) VALUES (?, '', '', '@ana/ledger', '1.0.0', '', 0, 'submitted', 42, ?, 0, 0, 0)");
  ins.run('s44', 44); ins.run('s46', 46);
  const r = await get('/api/me/pulls', {cookie});
  assert.equal(r.status, 200);
  const {pulls, all} = await r.json();
  assert.deepEqual(pulls, [
    {number: 41, title: 'Update Field Atlas 1.1.1', url: 'https://github.com/motionhub-dev/motions/pull/41', updated: '2026-11-03T20:00:00Z', motions: ['@ana/field-atlas'], checks: 'passed', reviewed: true, next: 'maintainer', shared: false},
    {number: 43, title: 'Add Tide Table 1.0.0', url: 'y', updated: '2026-11-03T19:00:00Z', motions: ['@ana/tide-table', 'red-pencil'], checks: 'failed', reviewed: false, next: 'change', shared: false},
    {number: 44, title: 'Add Ledger 1.0.0', url: 'z', updated: '2026-11-03T18:00:00Z', motions: ['@ana/ledger'], checks: 'none', reviewed: false, next: 'checks', shared: true},
  ], 'a renamed login is still theirs, another account with their old login is not, the reviewer\'s working note is no review, and what motionhub opened for them on its own branch is theirs too');
  assert.ok(!asked.some((p) => /\/(42|45|46)\b/.test(p)) && !asked.includes('/commits/bbb/check-runs?check_name=check&per_page=1'), 'someone else\'s pull request is not looked into');
  assert.match(all, /^https:\/\/github\.com\/motionhub-dev\/motions\/pulls\?q=/);

  github['/pulls?state=open&per_page=100&sort=updated&direction=desc'] = undefined;
  const down = await get('/api/me/pulls', {cookie});
  assert.equal(down.status, 502, 'GitHub unreachable');
  assert.equal((await down.json()).pulls, null);
  assert.equal((await send('POST', '/api/me/pulls', {cookie, origin: SITE})).status, 405);
});

test('your pull requests are found past GitHub\'s first page', async () => {
  const {pulls, motionsIn} = await import('../pulls.mjs');
  assert.deepEqual(motionsIn([{filename: 'motions/red-pencil/a'}, {filename: 'motions/@ana/x/b'}, {filename: 'motions/@ana/'}, {filename: 'tools/check.mjs'}]), ['@ana/x', 'red-pencil']);
  const API = 'https://api.github.com/repos/motionhub-dev/motions';
  const others = Array.from({length: 100}, (_, i) => ({number: 1000 + i, user: {id: 1}, head: {sha: 'x'}}));
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u === `${API}/pulls?state=open&per_page=100&sort=updated&direction=desc`) return Response.json(others, {headers: {link: `<${API}/pulls?page=2>; rel="next", <${API}/pulls?page=2>; rel="last"`}});
    if (u === `${API}/pulls?page=2`) return Response.json([{number: 7, title: 'Old', html_url: 'u', updated_at: 't', draft: true, user: {id: 42}, head: {sha: 's'}}]);
    if (u.startsWith(`${API}/commits/s/`)) return Response.json({check_runs: []});
    if (u.startsWith(`${API}/pulls/7/files`)) return Response.json([]);
    if (u.startsWith(`${API}/issues/7/comments`)) return Response.json([]);
    throw new Error(`unexpected ${u}`);
  };
  globalThis.caches = undefined;
  const body = await (await pulls(new Request(`${SITE}/api/me/pulls`), {}, ctx, {id: 42, login: 'Ana'})).json();
  assert.deepEqual(body.pulls.map((p) => [p.number, p.checks, p.next]), [[7, 'none', 'draft']]);
});
