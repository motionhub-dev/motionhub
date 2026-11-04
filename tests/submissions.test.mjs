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
import {untgz, PackageError} from '../site/tar.mjs';
import {appJwt, allowed, forgetToken, pkcs8} from '../site/github-app.mjs';
import {compareVersions as siteCompare, eligibility} from '../site/submissions.mjs';
import {compareVersions} from '../tools/check.mjs';
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

let env, realFetch, github, store;
const ctx = {waitUntil() {}};
beforeEach(() => {
  forgetToken();
  store = new Map();
  github = {calls: [], published: null, branch: null, open: null, users: {bo: {id: 8, type: 'User'}}};
  env = {
    DB: d1(),
    GITHUB_CLIENT_ID: 'c', GITHUB_CLIENT_SECRET: 's',
    GITHUB_APP_ID: '1234', GITHUB_APP_PRIVATE_KEY: privateKey, SUBMISSIONS: 'on',
    PACKAGES: {
      put: async (k, v) => { store.set(k, Buffer.from(v)); },
      get: async (k) => (store.has(k) ? {arrayBuffer: async () => store.get(k)} : null),
    },
    ASSETS: {fetch: async (r) => {
      const path = new URL(r.url).pathname;
      if (path === '/api/accounts.json') return Response.json({iamsuosi: 264293696});
      if (path === '/m/%40ana/ledger/motion.json' && github.published) return Response.json(github.published);
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
      return reply({id: 9});
    }
    if (u === `${API}/app/installations/9/access_tokens`) return reply({token: 'inst', expires_at: new Date(Date.now() + 3600e3).toISOString()});
    assert.equal(init.headers.authorization, 'Bearer inst', 'the repository is written with the installation token');
    if (u === `${REPO}/git/ref/heads/main`) return reply({object: {sha: 'main0'}});
    if (u.startsWith(`${REPO}/git/ref/heads/share/`)) return github.branch ? reply({object: {sha: github.branch}}) : reply({}, 404);
    if (u.startsWith(`${REPO}/pulls?state=open`)) return reply(github.open ? [github.open] : []);
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
  return `mh_session=${token}`;
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

  // one submitted already today (1.0.1): four more make five, and the sixth waits for tomorrow
  for (let n = 3; n < 8; n++) {
    share = await (await upload(pkg(manifest({version: `1.0.${n}`})))).json();
    assert.equal((await submit(share.id, ana, {code: share.code, mine: true, dco: true})).status, n < 7 ? 200 : 429, `share ${n}`);
  }
});

test('an upload that is not a motion is refused, and nothing is taken before the app is set up', async () => {
  assert.equal((await upload(rawTgz([{path: 'x/motion.json', data: Buffer.from('{}')}]))).status, 422);
  assert.equal((await upload(pkg(manifest({scope: 'bo'})).subarray(0, 10))).status, 422);
  const mismatched = tgz([['@ana/ledger/motion.json', Buffer.from(JSON.stringify(manifest({slug: 'other'})))], ['@ana/ledger/MOTION.md', Buffer.from('#')]]);
  assert.equal((await upload(mismatched)).status, 422);
  assert.equal((await call('POST', '/api/submissions', {body: Buffer.alloc(1024 * 1024 + 1), type: 'application/gzip'})).status, 413);
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
