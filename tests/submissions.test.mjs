// Sharing without gh (site/submissions.mjs, site/tar.mjs, site/github-app.mjs, tools/hub.mjs shareLink): the package
// read strictly, the share uploaded, opened and submitted by the account that may, and the pull request opened by the
// app with only the motion's own files and the commit naming its submitter. D1 is an in-memory SQLite with the real
// migrations; R2, the site's assets and GitHub's API are faked.
import {test, beforeEach, afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync, createVerify} from 'node:crypto';
import {gzipSync, gunzipSync} from 'node:zlib';
import {readFileSync, readdirSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import worker from '../site/worker.mjs';
import {sha256} from '../site/people.mjs';
import {untgz, PackageError, SEGMENT as SITE_SEGMENT} from '../site/tar.mjs';
import {appJwt, allowed, forgetToken, forgetClosed, pkcs8, oneLine, plain, BINARIES, isText} from '../site/github-app.mjs';
import {compareVersions as siteCompare, eligibility} from '../site/submissions.mjs';
import {compareVersions, SEGMENT, SHARED_BINARIES, isText as checkerText} from '../tools/check.mjs';
import {tgz} from '../tools/pack.mjs';
import {shareLink} from '../tools/hub.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const SITE = 'https://motionhub.dev';
const API = 'https://api.github.com';
const REPO = `${API}/repos/motionhub-dev/motions`;
const {privateKey, publicKey} = generateKeyPairSync('rsa', {modulusLength: 2048, privateKeyEncoding: {type: 'pkcs1', format: 'pem'}, publicKeyEncoding: {type: 'spki', format: 'pem'}});

function d1() {
  const db = new DatabaseSync(':memory:');
  const dir = join(ROOT, 'site/migrations');
  db.exec('PRAGMA foreign_keys = ON;' + readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => readFileSync(join(dir, f), 'utf8')).join('\n'));
  const statement = (sql, args = []) => ({
    bind: (...a) => statement(sql, a),
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({results: db.prepare(sql).all(...args)}),
    run: async () => { const r = db.prepare(sql).run(...args); return {meta: {changes: r.changes}}; },
  });
  return {raw: db, prepare: (sql) => statement(sql), batch: async (list) => { for (const s of list) await s.run(); }};
}

const manifest = (over = {}) => ({spec: 'motion/0.3', scope: 'ana', slug: 'ledger', version: '1.0.0', name: {en: 'Ledger'}, line: {en: 'A ruled ledger page.'}, authors: [{name: 'Ana', github: 'ana'}, {name: 'Bo', github: 'bo'}], license: {text: 'CC-BY-4.0'}, ...over});
const POSTER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0xff, 0xd9]);
const pkg = (m = manifest(), extra = []) => tgz([
  [`@${m.scope}/${m.slug}/MOTION.md`, Buffer.from('# Ledger\n\n<script>alert(1)</script>\n')],
  [`@${m.scope}/${m.slug}/motion.json`, Buffer.from(JSON.stringify(m))],
  [`@${m.scope}/${m.slug}/poster.jpg`, POSTER],
  ...extra,
]);

let env, realFetch, github, store, uploaded;
const ctx = {waitUntil() {}};
beforeEach(() => {
  forgetToken();
  forgetClosed();
  store = new Map();
  uploaded = new Map();
  github = {calls: [], published: null, branch: null, open: null, users: {bo: {id: 8, type: 'User'}}};
  env = {
    DB: d1(),
    GITHUB_CLIENT_ID: 'c', GITHUB_CLIENT_SECRET: 's',
    GITHUB_APP_ID: '1234', GITHUB_APP_PRIVATE_KEY: privateKey, SUBMISSIONS: 'on',
    PACKAGES: {
      put: async (k, v) => { store.set(k, Buffer.from(v)); },
      get: async (k) => (store.has(k) ? {size: store.get(k).length, arrayBuffer: async () => store.get(k)} : null),
      list: async ({prefix}) => ({objects: [...store.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({key, uploaded: uploaded.get(key) ?? new Date()})), truncated: false}),
      delete: async (keys) => { for (const k of [keys].flat()) store.delete(k); },
    },
    ASSETS: {fetch: async (r) => {
      const path = new URL(r.url).pathname;
      if (path === '/api/accounts.json') return Response.json({iamsuosi: 264293696});
      if (path === '/m/%40ana/ledger/motion.json' && github.published) return Response.json(github.published);
      if (path === '/api/motions.json') return Response.json({motions: github.published ? [{slug: '@ana/ledger', version: github.published.version, name: {en: 'Ledger'}, poster: '/m/@ana/ledger/poster.jpg'}] : []});
      return new Response('', {status: 404});
    }},
  };
  realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url), method = init.method ?? 'GET', body = init.body ? JSON.parse(init.body) : undefined;
    if (!u.startsWith(API)) throw new Error(`unexpected fetch ${u}`);
    github.calls.push({method, path: u.slice(API.length), body, auth: init.headers?.authorization});
    const reply = (b, status = 200) => Response.json(b, {status});
    if (u === `${REPO}/installation`) {
      const [h, c, s] = init.headers.authorization.slice(7).split('.');
      const v = createVerify('RSA-SHA256'); v.update(`${h}.${c}`);
      assert.ok(v.verify(publicKey, Buffer.from(s, 'base64url')), 'the app JWT is signed with the app\'s key');
      assert.equal(JSON.parse(Buffer.from(c, 'base64url')).iss, '1234');
      return reply({id: 9, app_slug: 'motionhub'});
    }
    if (u === `${API}/app/installations/9/access_tokens`) return reply({token: 'inst', expires_at: new Date(Date.now() + 3600e3).toISOString()});
    assert.equal(init.headers.authorization, 'Bearer inst', 'the repository is written with the installation token');
    if (u === `${REPO}/git/ref/heads/main`) return reply({object: {sha: 'main0'}});
    if (u.startsWith(`${REPO}/git/ref/heads/share/`)) return github.branch ? reply({object: {sha: github.branch}}) : reply({}, 404);
    if (u.startsWith(`${REPO}/pulls?state=open`)) return reply(github.open ? [github.open] : []);
    if (u.startsWith(`${REPO}/pulls?state=closed`)) return reply(github.closed ?? []);
    if (u === `${REPO}/git/matching-refs/heads/share/`) return reply(Object.entries(github.refs ?? {}).map(([r, sha]) => ({ref: `refs/heads/${r}`, object: {sha}})));
    const one = /\/pulls\/(\d+)$/.exec(u);
    if (one && method === 'GET') return github.pulls?.[one[1]] ? reply(github.pulls[one[1]]) : reply({}, 404);
    if (u.startsWith(`${REPO}/git/commits/`) && method === 'GET') return reply({tree: {sha: 'tree0'}});
    if (u === `${REPO}/git/trees/tree0?recursive=1`) return reply({truncated: false, tree: [{path: 'motions/@ana/ledger/old.txt', type: 'blob'}, {path: 'motions/@ana/ledgers/keep.txt', type: 'blob'}, {path: 'accounts/iamsuosi.json', type: 'blob'}]});
    if (u === `${REPO}/git/blobs`) return reply({sha: `blob${github.calls.length}`}, 201);
    if (u === `${REPO}/git/trees`) return reply({sha: 'tree1'}, 201);
    if (u === `${REPO}/git/commits`) return reply({sha: 'commit1'}, 201);
    if (u === `${REPO}/git/refs` || u.startsWith(`${REPO}/git/refs/heads/share/`)) return reply({}, 201);
    if (u === `${REPO}/pulls` && method === 'POST') return reply({number: 77, html_url: 'https://github.com/motionhub-dev/motions/pull/77'}, 201);
    if (/\/issues\/\d+\/(labels|comments)$/.test(u) || /\/pulls\/\d+$/.test(u)) return reply({}, 200);
    const user = /^https:\/\/api\.github\.com\/users\/([^/]+)$/.exec(u)?.[1];
    if (user) return github.users[user] ? reply(github.users[user]) : reply({}, 404);
    throw new Error(`unexpected GitHub call ${method} ${u}`);
  };
});
afterEach(() => { globalThis.fetch = realFetch; });

const call = (method, path, {cookie, origin, body, type} = {}) => worker.fetch(new Request(SITE + path, {method, headers: {...(cookie ? {cookie} : {}), ...(origin ? {origin} : {}), ...(type ? {'content-type': type} : {})}, body}), env, ctx);
async function session(id, login, name = login) {
  const token = `t-${id}-${login}`;
  env.DB.raw.prepare('INSERT OR REPLACE INTO people (id, login, name, avatar, created_at, seen_at) VALUES (?, ?, ?, NULL, 0, 0)').run(id, login, name);
  env.DB.raw.prepare('INSERT INTO sessions (token_hash, person, created_at, expires_at) VALUES (?, ?, 0, ?)').run(await sha256(token), id, Math.floor(Date.now() / 1000) + 3600);
  return `__Host-mh_session=${token}`;
}
const upload = async (bytes = pkg()) => call('POST', '/api/submissions', {body: bytes, type: 'application/gzip'});
const submit = (id, cookie, body) => call('POST', `/api/submissions/${id}/submit`, {cookie, origin: SITE, type: 'application/json', body: JSON.stringify(body)});

/** A gzipped tar with any entry type and path, for packages tools/pack.mjs would never write. */
function rawTgz(entries) {
  const blocks = [];
  for (const {path, data = Buffer.alloc(0), type = '0'} of entries) {
    const h = Buffer.alloc(512);
    h.write(path, 0, 100);
    h.write('0000644', 100); h.write('0000000', 108); h.write('0000000', 116);
    h.write(data.length.toString(8).padStart(11, '0'), 124); h.write('00000000000', 136);
    h.fill(' ', 148, 156); h.write(type, 156); h.write('ustar\u000000', 257, 8, 'latin1');
    let sum = 0; for (const b of h) sum += b;
    h.write(`${sum.toString(8).padStart(6, '0')}\u0000 `, 148, 8, 'latin1');
    blocks.push(h, data, Buffer.alloc((512 - (data.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocks));
}

test('a package is read strictly: regular files at safe paths, within the limits', async () => {
  const files = await untgz(pkg());
  assert.deepEqual(files.map((f) => f.path), ['@ana/ledger/MOTION.md', '@ana/ledger/motion.json', '@ana/ledger/poster.jpg']);
  assert.deepEqual(Buffer.from(files[2].data), POSTER);
  const refused = async (bytes, why, limits) => assert.rejects(untgz(bytes, limits), (e) => e instanceof PackageError, why);
  await refused(rawTgz([{path: '@ana/ledger/../../etc/x', data: Buffer.from('x')}]), 'a path that climbs out');
  await refused(rawTgz([{path: '/etc/passwd', data: Buffer.from('x')}]), 'an absolute path');
  await refused(rawTgz([{path: '@ana/ledger/link', type: '2'}]), 'a symbolic link');
  await refused(rawTgz([{path: '@ana/ledger/hard', type: '1'}]), 'a hard link');
  await refused(rawTgz([{path: 'PaxHeader', type: 'x', data: Buffer.from('30 path=@ana/ledger/../../x\n')}]), 'an extended header');
  await refused(rawTgz([{path: '@ana/ledger/a', data: Buffer.from('1')}, {path: '@ana/ledger/a', data: Buffer.from('2')}]), 'a name twice');
  await refused(rawTgz([{path: '@ana/ledger/A', data: Buffer.from('1')}, {path: '@ana/ledger/a', data: Buffer.from('2')}]), 'a name twice but for case');
  assert.equal(SITE_SEGMENT.source, SEGMENT.source, 'the Worker reads the names the checker allows');
  assert.equal(BINARIES, SHARED_BINARIES, 'and takes as many files that are not text');
  for (const b of [Buffer.from('a'), Buffer.from([0xef, 0xbb, 0xbf, 0x61]), Buffer.from([0]), Buffer.from([0xff])]) assert.equal(isText(b), checkerText(b));
  await refused(rawTgz([{path: '@ana/ledger/big', data: Buffer.alloc(3 * 1024 * 1024)}]), 'a small package that unpacks huge');
  await refused(rawTgz(Array.from({length: 4}, (_, i) => ({path: `@ana/ledger/f${i}`, data: Buffer.from('x')}))), 'too many files', {packed: 1e6, unpacked: 1e6, files: 3});
  await refused(Buffer.from('not gzip at all'), 'not gzip');
  const tampered = gunzipSync(pkg()); tampered[0] ^= 1;
  await refused(gzipSync(tampered), 'a header that fails its checksum');
});

test('the app signs its JWT with GitHub\'s PKCS#1 key, and writes only the motion\'s files and new account records', async () => {
  const jwt = await appJwt({GITHUB_APP_ID: '5', GITHUB_APP_PRIVATE_KEY: privateKey}, Date.parse('2026-11-04T00:00:00Z'));
  const [h, c, s] = jwt.split('.');
  const v = createVerify('RSA-SHA256'); v.update(`${h}.${c}`);
  assert.ok(v.verify(publicKey, Buffer.from(s, 'base64url')));
  assert.deepEqual(JSON.parse(Buffer.from(c, 'base64url')), {iat: 1793750340, exp: 1793750940, iss: '5'});
  assert.equal(pkcs8(privateKey)[0], 0x30);
  for (const ok of ['motions/@ana/ledger/MOTION.md', 'motions/@ana/ledger/react/parts/a.tsx', 'accounts/ana.json']) assert.ok(allowed(ok, '@ana/ledger'), ok);
  for (const no of ['motions/@ana/ledgers/x', 'motions/@bo/ledger/x', '.github/workflows/check.yml', 'tools/check.mjs', 'accounts/../tools/x.json', 'motions/@ana/ledger/../../tools/x', 'accounts/Ana.json']) assert.ok(!allowed(no, '@ana/ledger'), no);
});

test('text from a motion or a profile stays on its line, and shows in a pull request as it is', () => {
  assert.equal(oneLine('Ledger\nSigned-off-by: Eve <e@x>\r\nMotionhub-Submitted-By: 1 eve'), 'Ledger Signed-off-by: Eve <e@x> Motionhub-Submitted-By: 1 eve');
  assert.equal(plain('hi @org/team ![t](https://x/p.png) <img>'), 'hi @\u200borg/team \\!\\[t\\]\\(https://x/p.png\\) \\<img\\>');
});

test('the site\'s version order is the checker\'s', () => {
  for (const [a, b] of [['1.0.0', '1.0.1'], ['1.10.0', '1.9.9'], ['1.0.0-alpha', '1.0.0'], ['1.0.0-alpha.2', '1.0.0-alpha.10'], ['1.0.0-beta', '1.0.0-alpha.9'], ['2.0.0', '2.0.0+build']]) {
    assert.equal(Math.sign(siteCompare(a, b)), Math.sign(compareVersions(a, b)), `${a} ${b}`);
  }
});

test('who may submit: a new motion under their own scope, among its authors; a published one by its authors, at a higher version', () => {
  const ana = {id: 42, login: 'Ana'}, accounts = new Map([['iamsuosi', 264293696]]);
  assert.equal(eligibility(ana, manifest(), null, accounts).may, true);
  assert.equal(eligibility({id: 9, login: 'bo'}, manifest(), null, accounts).may, false, 'a co-author does not publish under another scope');
  assert.equal(eligibility(ana, manifest({authors: [{name: 'Bo', github: 'bo'}]}), null, accounts).may, false, 'not among its authors');
  assert.equal(eligibility({id: 99, login: 'iamsuosi'}, manifest({scope: 'iamsuosi'}), null, accounts).may, false, 'a recorded login is its account\'s, whoever holds it now');
  const was = {version: '1.0.0', authors: [{name: 'Ana', github: 'ana'}]};
  assert.match(eligibility(ana, manifest(), was, accounts).why, /raise version/);
  assert.equal(eligibility(ana, manifest({version: '1.0.1'}), was, accounts).may, true);
  assert.equal(eligibility({id: 9, login: 'bo'}, manifest({version: '1.0.1'}), was, accounts).may, false, 'adding yourself to authors does not make it yours');
});

test('a share: uploaded with no account, opened and submitted by its owner, the pull request opened by the app', async () => {
  const up = await upload();
  assert.equal(up.status, 201);
  const share = await up.json();
  assert.match(share.id, /^[A-Za-z0-9_-]{22}$/);
  assert.equal(share.url, `${SITE}/share/${share.id}`);
  assert.match(share.code, /^[A-Z]+-\d{2}$/);
  assert.equal(share.motion, '@ana/ledger');
  assert.ok(store.has(`submissions/${share.id}.tgz`));
  assert.equal(github.calls.length, 0, 'nothing reaches GitHub on upload');
  assert.ok(!JSON.stringify(env.DB.raw.prepare('SELECT * FROM submissions').all()).includes(share.poll), 'the poll token is kept only as its hash');

  const poll = async (token = share.poll) => (await call('GET', `/api/submissions/${share.id}?poll=${encodeURIComponent(token)}`)).json();
  assert.deepEqual(await poll(), {status: 'uploaded', motion: '@ana/ledger', version: '1.0.0', pr: null, prUrl: null});
  assert.deepEqual(await poll('wrong'), {error: 'no such share'});

  assert.equal((await call('GET', `/api/submissions/${share.id}`)).status, 401, 'signed out, nothing is shown');
  const page = await call('GET', `/share/${share.id}`);
  assert.equal(page.headers.get('cache-control'), 'private, no-store');

  const ana = await session(42, 'Ana', 'Ana Lee');
  const view = await (await call('GET', `/api/submissions/${share.id}`, {cookie: ana})).json();
  assert.equal(view.may, true);
  assert.equal(view.published, null);
  assert.deepEqual(view.files.map((f) => f.path), ['MOTION.md', 'motion.json', 'poster.jpg']);
  assert.match(view.motionMd, /<script>/, 'the page sets it as text');
  assert.equal(view.code, undefined, 'the code is never shown on the page: it is typed from the terminal');
  assert.equal((await poll()).status, 'viewed');

  const poster = await call('GET', `/api/submissions/${share.id}/files/poster.jpg`, {cookie: ana});
  assert.equal(poster.headers.get('content-type'), 'image/jpeg');
  const doc = await call('GET', `/api/submissions/${share.id}/files/MOTION.md`, {cookie: ana});
  assert.equal(doc.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.match(doc.headers.get('content-security-policy'), /^sandbox/);

  const bo = await session(8, 'bo');
  const other = await (await call('GET', `/api/submissions/${share.id}`, {cookie: bo})).json();
  assert.equal(other.may, false, 'a leaked link is no use to anyone else');
  assert.equal((await submit(share.id, bo, {code: share.code, mine: true, dco: true})).status, 403);

  assert.equal((await call('POST', `/api/submissions/${share.id}/submit`, {cookie: ana, origin: 'https://evil.example', type: 'application/json', body: '{}'})).status, 403, 'only from this site');
  assert.equal((await submit(share.id, ana, {code: 'WRONG-00', mine: true, dco: true})).status, 400);
  assert.equal((await submit(share.id, ana, {code: share.code, mine: true, dco: false})).status, 400, 'the DCO is certified');
  assert.equal((await submit(share.id, ana, {code: share.code, mine: false, dco: true})).status, 400);

  const done = await submit(share.id, ana, {code: share.code.toLowerCase(), mine: true, dco: true});
  assert.equal(done.status, 200, await done.clone().text());
  assert.deepEqual(await done.json(), {pr: 77, prUrl: 'https://github.com/motionhub-dev/motions/pull/77', added: true});

  const tree = github.calls.find((c) => c.method === 'POST' && c.path === '/repos/motionhub-dev/motions/git/trees').body;
  assert.equal(tree.base_tree, 'tree0');
  assert.deepEqual(tree.tree.map((e) => [e.path, e.sha === null ? 'deleted' : e.content !== undefined ? 'text' : 'blob']), [
    ['motions/@ana/ledger/old.txt', 'deleted'],
    ['motions/@ana/ledger/MOTION.md', 'text'],
    ['motions/@ana/ledger/motion.json', 'text'],
    ['motions/@ana/ledger/poster.jpg', 'blob'],
    ['accounts/ana.json', 'text'],
    ['accounts/bo.json', 'text'],
  ], 'its own directory replaced, a neighbour untouched, new records for its logins');
  assert.equal(tree.tree.find((e) => e.path === 'accounts/ana.json').content, '{"login":"ana","id":42}\n', 'the submitter by the id they signed in with');
  assert.equal(tree.tree.find((e) => e.path === 'accounts/bo.json').content, '{"login":"bo","id":8}\n', 'a co-author by the id GitHub gives');
  const commit = github.calls.find((c) => c.method === 'POST' && c.path === '/repos/motionhub-dev/motions/git/commits').body;
  assert.deepEqual(commit.parents, ['main0']);
  assert.deepEqual({name: commit.author.name, email: commit.author.email}, {name: 'Ana Lee', email: '42+Ana@users.noreply.github.com'});
  assert.match(commit.message, /^Add Ledger 1\.0\.0\n/);
  assert.match(commit.message, /\nSigned-off-by: Ana Lee <42\+Ana@users\.noreply\.github\.com>\nMotionhub-Submitted-By: 42 Ana\nMotionhub-Submission: [A-Za-z0-9_-]{22}\n$/);
  const ref = github.calls.find((c) => c.path === '/repos/motionhub-dev/motions/git/refs').body;
  assert.deepEqual(ref, {ref: 'refs/heads/share/ana/ledger/42', sha: 'commit1'});
  const pr = github.calls.find((c) => c.method === 'POST' && c.path === '/repos/motionhub-dev/motions/pulls').body;
  assert.deepEqual([pr.title, pr.head, pr.base], ['Add Ledger 1.0.0', 'share/ana/ledger/42', 'main']);
  assert.match(pr.body, /Submitted by @Ana through motionhub\.dev/);
  assert.ok(github.calls.some((c) => c.path === '/repos/motionhub-dev/motions/issues/77/labels'));

  assert.deepEqual(await poll(), {status: 'submitted', motion: '@ana/ledger', version: '1.0.0', pr: 77, prUrl: 'https://github.com/motionhub-dev/motions/pull/77'});
  const again = await submit(share.id, ana, {code: share.code, mine: true, dco: true});
  assert.equal(again.status, 409, 'a link opens one pull request');
});

test('a new version is added to the open pull request; wrong codes and too many shares stop', async () => {
  github.published = {version: '1.0.0', authors: [{name: 'Ana', github: 'ana'}]};
  const ana = await session(42, 'ana');
  let share = await (await upload()).json();
  const r = await submit(share.id, ana, {code: share.code, mine: true, dco: true});
  assert.equal(r.status, 403);
  assert.match((await r.json()).error, /raise version/);

  share = await (await upload(pkg(manifest({version: '1.0.1'})))).json();
  github.branch = 'branch1';
  github.open = {number: 77, title: 'Update Ledger 1.0.0', html_url: 'https://github.com/motionhub-dev/motions/pull/77'};
  const added = await (await submit(share.id, ana, {code: share.code, mine: true, dco: true})).json();
  assert.deepEqual(added, {pr: 77, prUrl: 'https://github.com/motionhub-dev/motions/pull/77', added: false});
  const commit = github.calls.find((c) => c.method === 'POST' && c.path.endsWith('/git/commits')).body;
  assert.deepEqual(commit.parents, ['branch1'], 'on top of the open pull request\'s branch');
  assert.match(commit.message, /^Update Ledger 1\.0\.1/);
  assert.deepEqual(github.calls.find((c) => c.method === 'PATCH' && c.path.includes('/git/refs/')).body, {sha: 'commit1', force: false});
  assert.deepEqual(github.calls.find((c) => c.method === 'PATCH' && c.path.endsWith('/pulls/77')).body, {title: 'Update Ledger 1.0.1'});
  assert.ok(!github.calls.some((c) => c.method === 'POST' && c.path.endsWith('/pulls')), 'no second pull request');

  share = await (await upload(pkg(manifest({version: '1.0.2'})))).json();
  for (let i = 0; i < 5; i++) assert.equal((await submit(share.id, ana, {code: 'NOPE-00', mine: true, dco: true})).status, 400);
  assert.equal((await submit(share.id, ana, {code: share.code, mine: true, dco: true})).status, 429, 'five wrong codes and the link stops');

  // many tries at once are counted as many: the code cannot be guessed by asking all at once
  share = await (await upload(pkg(manifest({version: '1.0.2'})))).json();
  const at = await Promise.all(Array.from({length: 20}, () => submit(share.id, ana, {code: 'NOPE-00', mine: true, dco: true})));
  assert.equal(at.filter((r) => r.status === 400).length, 5);
  assert.equal(env.DB.raw.prepare('SELECT attempts FROM submissions WHERE id = ?').get(share.id).attempts, 5);

  // one submitted already today (1.0.1): four more make five, and the sixth waits for tomorrow
  for (let n = 3; n < 8; n++) {
    share = await (await upload(pkg(manifest({version: `1.0.${n}`})))).json();
    assert.equal((await submit(share.id, ana, {code: share.code, mine: true, dco: true})).status, n < 7 ? 200 : 429, `share ${n}`);
  }
});

test('a submit the Worker never finished is taken again after a while; a label GitHub refuses stops nothing', async () => {
  const ana = await session(42, 'ana');
  const share = await (await upload()).json();
  const at = Math.floor(Date.now() / 1000);
  env.DB.raw.prepare("UPDATE submissions SET status = 'submitting', person = 42, dco_at = ? WHERE id = ?").run(at - 10, share.id);
  assert.equal((await submit(share.id, ana, {code: share.code, mine: true, dco: true})).status, 409, 'still being submitted');
  env.DB.raw.prepare('UPDATE submissions SET dco_at = ? WHERE id = ?').run(at - 600, share.id);
  const fetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => (String(url).endsWith('/labels') ? Response.json({}, {status: 422}) : fetch(url, init));
  const done = await submit(share.id, ana, {code: share.code, mine: true, dco: true});
  assert.equal(done.status, 200, await done.clone().text());
  assert.equal(env.DB.raw.prepare('SELECT status FROM submissions WHERE id = ?').get(share.id).status, 'submitted');
});

const botPull = (number, ref, over = {}) => ({number, state: 'open', user: {id: 9, login: 'motionhub[bot]', type: 'Bot'}, head: {ref, repo: {full_name: 'motionhub-dev/motions'}}, base: {repo: {full_name: 'motionhub-dev/motions'}}, ...over});

test('a person withdraws a pull request motionhub opened for them, and only that', async () => {
  const ana = await session(42, 'ana');
  const withdraw = (n, cookie = ana, origin = SITE) => call('POST', `/api/me/pulls/${n}/withdraw`, {cookie, origin});
  const share = await (await upload()).json();
  await call('GET', `/api/submissions/${share.id}`, {cookie: ana});
  assert.equal((await submit(share.id, ana, {code: share.code, mine: true, dco: true})).status, 200);
  github.calls = [];
  github.pulls = {
    77: botPull(77, 'share/ana/ledger/42'),
    78: botPull(78, 'share/bo/ledger/8'),
    79: botPull(79, 'share/ana/ledger/42', {user: {id: 5, login: 'other[bot]', type: 'Bot'}}),
    80: botPull(80, 'share/ana/ledger/42', {head: {ref: 'share/ana/ledger/42', repo: {full_name: 'eve/motions'}}}),
    81: botPull(81, 'share/ana/ledger/42', {state: 'closed'}),
  };
  assert.equal((await withdraw(77, ana, 'https://evil.example')).status, 403, 'only from this site');
  assert.equal((await withdraw(77, null)).status, 401);
  assert.equal((await withdraw(99)).status, 404, 'not in motionhub\'s record');
  assert.equal(github.calls.length, 0, 'nor is GitHub asked about it');
  // in the record, but GitHub says it is not the app's branch for them, not the app, or not this repository's
  for (const n of [78, 79, 80, 81]) env.DB.raw.prepare("INSERT INTO submissions (id, poll_hash, code, motion, version, sha256, bytes, status, person, pr, dco_at, created_at, expires_at) VALUES (?, '', '', '@ana/ledger', '1.0.0', '', 0, 'submitted', 42, ?, 0, 0, 0)").run(`s${n}`, n);
  for (const n of [78, 79, 80]) assert.equal((await withdraw(n)).status, 404, `#${n} is not one motionhub opened for them`);
  assert.equal((await withdraw(81)).status, 409);
  assert.ok(!github.calls.some((c) => c.method !== 'GET'), 'nothing changed on GitHub');
  const r = await withdraw(77);
  assert.equal(r.status, 200, await r.clone().text());
  assert.deepEqual(github.calls.filter((c) => c.method !== 'GET').map((c) => [c.method, c.path, c.body]), [
    ['PATCH', '/repos/motionhub-dev/motions/pulls/77', {state: 'closed'}],
    ['POST', '/repos/motionhub-dev/motions/issues/77/comments', {body: '@ana withdrew it on motionhub.dev.'}],
    ['DELETE', '/repos/motionhub-dev/motions/git/refs/heads/share/ana/ledger/42', undefined],
  ]);
  assert.equal(env.DB.raw.prepare('SELECT status FROM submissions WHERE id = ?').get(share.id).status, 'withdrawn');
  assert.match((await (await submit(share.id, ana, {code: share.code, mine: true, dco: true})).json()).error, /withdrawn/);
  const again = await (await call('GET', `/api/submissions/${share.id}`, {cookie: ana})).json();
  assert.deepEqual([again.status, again.may, again.pr], ['withdrawn', false, null], 'its page says it was withdrawn, not that it is open');
});

test('the daily sweep lets go of old packages, shares never submitted, and closed pull requests\' branches', async () => {
  const ana = await session(42, 'ana');
  const kept = await (await upload()).json();
  await call('GET', `/api/submissions/${kept.id}`, {cookie: ana});
  assert.equal((await submit(kept.id, ana, {code: kept.code, mine: true, dco: true})).status, 200);
  const old = await (await upload()).json();
  const fresh = await (await upload()).json();
  const day = 86400;
  env.DB.raw.prepare('UPDATE submissions SET expires_at = expires_at - ? WHERE id IN (?, ?)').run(2 * day, kept.id, old.id);
  uploaded.set(`submissions/${kept.id}.tgz`, new Date(Date.now() - 2 * day * 1000));
  uploaded.set(`submissions/${old.id}.tgz`, new Date(Date.now() - 2 * day * 1000));
  github.refs = {'share/ana/ledger/42': 'c77', 'share/ana/tide/42': 'c90', 'share/bo/x/8': 'c60', 'share/eve/y/5': 'c50'};
  const closed = (n, ref, sha, over = {}) => botPull(n, ref, {state: 'closed', ...over, head: {ref, sha, repo: {full_name: 'motionhub-dev/motions'}, ...over.head}});
  github.closed = [
    closed(77, 'share/ana/ledger/42', 'c77'),
    closed(88, 'share/ana/tide/42', 'c88'), // the branch moved on: a new share's commit
    closed(70, 'share/gone/x/1', 'c70'), // gone already
    closed(60, 'share/bo/x/8', 'c60', {user: {id: 3, login: 'bo', type: 'User'}}), // not the app's
    closed(50, 'share/eve/y/5', 'c50', {user: {id: 5, login: 'other[bot]', type: 'Bot'}}), // another app's
  ];
  // stopped while GitHub was asked: its DCO stays on record
  env.DB.raw.prepare("INSERT INTO submissions (id, poll_hash, code, motion, version, sha256, bytes, status, person, dco_at, created_at, expires_at) VALUES ('stuck', '', 'X-00', '@ana/ledger', '1.0.0', '', 0, 'submitting', 42, 1, 0, 1)").run();
  const {sweep} = await import('../site/submissions.mjs');
  github.calls = [];
  assert.deepEqual(await sweep(env), {packages: 2, shares: 1, branches: ['share/ana/ledger/42']}, 'a branch moved on, gone already, or not the app\'s stays');
  assert.deepEqual([...store.keys()], [`submissions/${fresh.id}.tgz`]);
  const rows = env.DB.raw.prepare('SELECT id, status, code FROM submissions ORDER BY created_at').all();
  assert.deepEqual(rows.map((r) => [r.id, r.status, r.code]).sort(), [[kept.id, 'submitted', ''], [fresh.id, 'uploaded', fresh.code], ['stuck', 'submitting', '']].sort(), 'the record of a submission stays, without its code');
  assert.deepEqual(github.calls.filter((c) => c.method === 'DELETE').map((c) => c.path), ['/repos/motionhub-dev/motions/git/refs/heads/share/ana/ledger/42']);
});

test('a person\'s shares: waiting ones, and submitted ones with their pull request and whether they are published', async () => {
  const ana = await session(42, 'ana');
  const mine = (cookie = ana) => call('GET', '/api/me/shares', {cookie});
  assert.equal((await mine(null)).status, 401);
  const share = await (await upload()).json();
  const unseen = await (await upload()).json();
  await call('GET', `/api/submissions/${share.id}`, {cookie: ana});
  let body = await (await mine()).json();
  assert.deepEqual(body.waiting.map((w) => [w.id, w.url, w.motion, w.version]), [[share.id, `/share/${share.id}`, '@ana/ledger', '1.0.0']], `${unseen.id}, never opened, is no one's yet`);
  assert.deepEqual(body.submitted, []);
  assert.equal((await submit(share.id, ana, {code: share.code, mine: true, dco: true})).status, 200);
  body = await (await mine()).json();
  assert.deepEqual(body.waiting, []);
  assert.deepEqual(body.submitted.map((s) => [s.id, s.status, s.pr, s.state]), [[share.id, 'submitted', 77, null]], 'open: the page tells it from its open pull requests');
  // merged, and the deploy not done yet: merged, not closed
  github.closed = [{number: 77, merged_at: '2026-11-05T03:00:00Z'}];
  forgetClosed();
  assert.equal((await (await mine()).json()).submitted[0].state, 'merged');
  // closed without merging
  github.closed = [{number: 77, merged_at: null}];
  forgetClosed();
  assert.equal((await (await mine()).json()).submitted[0].state, 'closed');
  github.closed = [{number: 77, merged_at: '2026-11-05T03:00:00Z'}];
  forgetClosed();
  github.published = {version: '1.0.0', authors: [{name: 'Ana', github: 'ana'}]};
  body = await (await mine()).json();
  assert.deepEqual(body.submitted.map((s) => [s.state, s.name?.en, s.poster]), [['published', 'Ledger', '/m/@ana/ledger/poster.jpg']], 'merged and on the site');
  // closed without merging, and a later version published by another pull request: still closed
  github.published = {version: '1.0.1', authors: [{name: 'Ana', github: 'ana'}]};
  github.closed = [{number: 77, merged_at: null}];
  forgetClosed();
  assert.equal((await (await mine()).json()).submitted[0].state, 'closed');
  // its own version on the site asks GitHub nothing
  github.published = {version: '1.0.0', authors: [{name: 'Ana', github: 'ana'}]};
  forgetClosed(); github.calls = [];
  assert.equal((await (await mine()).json()).submitted[0].state, 'published');
  assert.ok(!github.calls.some((c) => c.path.includes('state=closed')));
  assert.deepEqual(await (await mine(await session(8, 'bo'))).json(), {waiting: [], submitted: []}, 'no one else\'s');
  // one stopped while GitHub was asked still waits on the page
  const stuck = await (await upload()).json();
  await call('GET', `/api/submissions/${stuck.id}`, {cookie: ana});
  env.DB.raw.prepare("UPDATE submissions SET status = 'submitting', person = 42, dco_at = 1 WHERE id = ?").run(stuck.id);
  assert.deepEqual((await (await mine()).json()).waiting.map((w) => w.id), [stuck.id]);
});

test('a new version shows what it changes from the published one', async () => {
  github.published = {version: '1.0.0', authors: [{name: 'Ana', github: 'ana'}]};
  // the published package, as the build writes it to R2, its motion.json's members in another order
  const {authors, ...rest} = manifest();
  const old = {authors: authors.map(({github, name}) => ({github, name})), ...rest};
  store.set('m/@ana/ledger/1.0.0.tgz', tgz([
    ['@ana/ledger/MOTION.md', Buffer.from('# Ledger\n\n<script>alert(1)</script>\n')],
    ['@ana/ledger/gone.txt', Buffer.from('x')],
    ['@ana/ledger/motion.json', Buffer.from(JSON.stringify(old))],
    ['@ana/ledger/poster.jpg', Buffer.from([1, 2, 3])],
  ]));
  const ana = await session(42, 'ana');
  const share = await (await upload(pkg(manifest({version: '1.0.1'}), [['@ana/ledger/new.txt', Buffer.from('n')]]))).json();
  const view = await (await call('GET', `/api/submissions/${share.id}`, {cookie: ana})).json();
  assert.equal(view.changes.base, '1.0.0');
  assert.deepEqual(view.changes.members, ['version'], 'a member whose keys only moved is the same');
  assert.deepEqual(Object.fromEntries(view.changes.files.map((f) => [f.path, f.change])), {'MOTION.md': 'same', 'motion.json': 'changed', 'poster.jpg': 'changed', 'new.txt': 'added', 'gone.txt': 'removed'});
  // too big to be a package: not read
  const big = store.get('m/@ana/ledger/1.0.0.tgz');
  store.set('m/@ana/ledger/1.0.0.tgz', Buffer.alloc(1024 * 1024 + 1));
  assert.equal((await (await call('GET', `/api/submissions/${share.id}`, {cookie: ana})).json()).changes, null);
  store.set('m/@ana/ledger/1.0.0.tgz', big);
  github.published = null;
  const fresh = await (await upload()).json();
  assert.equal((await (await call('GET', `/api/submissions/${fresh.id}`, {cookie: ana})).json()).changes, null, 'a new motion changes nothing published');
});

test('a submitted share\'s page says where its pull request stands', async () => {
  const ana = await session(42, 'ana');
  const share = await (await upload()).json();
  assert.equal((await submit(share.id, ana, {code: share.code, mine: true, dco: true})).status, 200);
  const outcome = async (cookie = ana) => (await (await call('GET', `/api/submissions/${share.id}`, {cookie})).json()).outcome;
  github.pulls = {77: {number: 77, state: 'open', merged_at: null}};
  assert.equal(await outcome(), 'open');
  github.pulls[77] = {number: 77, state: 'closed', merged_at: '2026-11-05T03:00:00Z'};
  assert.equal(await outcome(), 'merged');
  github.pulls[77] = {number: 77, state: 'closed', merged_at: null};
  assert.equal(await outcome(), 'closed');
  github.published = {version: '1.0.0', authors: [{name: 'Ana', github: 'ana'}]};
  github.calls = [];
  assert.equal(await outcome(), 'published', 'on the site: GitHub need not be asked');
  assert.ok(!github.calls.some((c) => c.path.endsWith('/pulls/77')));
  assert.equal(await outcome(await session(8, 'bo')), null, 'only its person learns about it');
});

test('a text file goes to GitHub byte for byte, a byte-order mark included', async () => {
  const ana = await session(42, 'ana');
  const share = await (await upload(pkg(manifest(), [['@ana/ledger/react/a.css', Buffer.from('\ufeffa{}\n')]]))).json();
  assert.equal((await submit(share.id, ana, {code: share.code, mine: true, dco: true})).status, 200);
  const tree = github.calls.find((c) => c.method === 'POST' && c.path.endsWith('/git/trees')).body;
  assert.equal(tree.tree.find((e) => e.path === 'motions/@ana/ledger/react/a.css').content, '\ufeffa{}\n');
});

test('an upload that is not a motion is refused, and nothing is taken before the app is set up', async () => {
  assert.equal((await upload(rawTgz([{path: 'x/motion.json', data: Buffer.from('{}')}]))).status, 422);
  assert.equal((await upload(pkg(manifest({scope: 'bo'})).subarray(0, 10))).status, 422);
  const mismatched = tgz([['@ana/ledger/motion.json', Buffer.from(JSON.stringify(manifest({slug: 'other'})))], ['@ana/ledger/MOTION.md', Buffer.from('#')]]);
  assert.equal((await upload(mismatched)).status, 422);
  assert.equal((await call('POST', '/api/submissions', {body: Buffer.alloc(1024 * 1024 + 1), type: 'application/gzip'})).status, 413);
  // a body with no length is read no further than the limit
  const chunks = new ReadableStream({start(c) { for (let i = 0; i < 5; i++) c.enqueue(new Uint8Array(300 * 1024)); c.close(); }});
  assert.equal((await worker.fetch(new Request(`${SITE}/api/submissions`, {method: 'POST', body: chunks, duplex: 'half'}), env, ctx)).status, 413);
  assert.equal((await upload(pkg(manifest({version: '1.0'})))).status, 422, 'not a semantic version');
  assert.equal((await upload(pkg(manifest({version: '1.0.0\nSigned-off-by: x'})))).status, 422);
  const many = Array.from({length: 41}, (_, i) => [`@ana/ledger/img${i}.png`, POSTER]);
  assert.match((await (await upload(pkg(manifest(), many))).json()).error, /at most 40 files that are not text/);
  delete env.GITHUB_APP_PRIVATE_KEY;
  const off = await upload();
  assert.equal(off.status, 503);
  assert.match((await off.json()).error, /--pr/);
  env.GITHUB_APP_PRIVATE_KEY = privateKey;
  env.SUBMIT_LIMIT = {limit: async () => ({success: false})};
  assert.equal((await upload()).status, 429);
  assert.equal(store.size, 0);
});

test('the command line checks, packs and uploads, prints the link and the code, and with --wait the pull request', async () => {
  const {mkdtempSync, mkdirSync, writeFileSync, cpSync} = await import('node:fs');
  const {tmpdir} = await import('node:os');
  const dir = mkdtempSync(join(tmpdir(), 'share-'));
  cpSync(join(ROOT, 'motions/@iamsuosi/red-pencil'), join(dir, 'red-pencil'), {recursive: true});
  const m = JSON.parse(readFileSync(join(dir, 'red-pencil/motion.json'), 'utf8'));
  m.version = '99.0.0';
  writeFileSync(join(dir, 'red-pencil/motion.json'), JSON.stringify(m, null, 2));
  let uploaded, polls = 0;
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    if (u === 'https://hub.test/api/motions.json') return Response.json({spec: 'motion/0.1', motions: []});
    if (u === 'https://hub.test/api/submissions') { uploaded = await untgz(new Uint8Array(init.body)); return Response.json({id: 'x'.repeat(22), url: 'https://hub.test/share/xxx', code: 'MAPLE-07', poll: 'p', expires: '2026-11-05T00:00:00Z'}, {status: 201}); }
    if (u.startsWith('https://hub.test/api/submissions/')) return Response.json(++polls < 2 ? {status: 'viewed'} : {status: 'submitted', prUrl: 'https://github.com/motionhub-dev/motions/pull/9'});
    throw new Error(`unexpected ${u}`);
  };
  const out = await shareLink(join(dir, 'red-pencil'), {}, 'https://hub.test');
  assert.match(out, /Open https:\/\/hub\.test\/share\/xxx/);
  assert.match(out, /MAPLE-07/);
  assert.ok(uploaded.every((f) => f.path.startsWith('@iamsuosi/red-pencil/')));
  assert.ok(uploaded.some((f) => f.path === '@iamsuosi/red-pencil/motion.json'));
  const lines = [];
  assert.equal(await shareLink(join(dir, 'red-pencil'), {wait: true, ask: 1, log: (l) => lines.push(l)}, 'https://hub.test'), 'The pull request is open: https://github.com/motionhub-dev/motions/pull/9');
  assert.match(lines[0], /MAPLE-07/);
  mkdirSync(join(dir, 'empty'));
  await assert.rejects(shareLink(join(dir, 'empty'), {}, 'https://hub.test'), /no motion\.json/);
});
