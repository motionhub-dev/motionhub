import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {deflateRawSync} from 'node:zlib';
import worker from '../site/worker.mjs';
import {sweepArtifacts} from '../site/artifacts.mjs';
import {artifactFiles} from '../site/artifact-files.mjs';
import {sha256} from '../site/people.mjs';

function zip(entries) {
  const locals = [], directory = [];
  let offset = 0;
  for (const [filename, data] of entries) {
    const name = Buffer.from(filename), compressed = deflateRawSync(data);
    const local = Buffer.alloc(30), entry = Buffer.alloc(46);
    local.writeUInt32LE(0x04034b50);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    entry.writeUInt32LE(0x02014b50);
    entry.writeUInt16LE(8, 10);
    entry.writeUInt32LE(compressed.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(name.length, 28);
    entry.writeUInt32LE(offset, 42);
    locals.push(local, name, compressed);
    directory.push(entry, name);
    offset += local.length + name.length + compressed.length;
  }
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(Buffer.concat(directory).length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...directory, end]);
}

test('the Worker runs first for every request, so the content origin never serves the site\'s pages', () => {
  const config = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  const {assets, vars} = JSON.parse(config.replace(/^\s*\/\/.*$/gm, ''));
  if (vars.ARTIFACT_CONTENT_ORIGIN) assert.equal(assets.run_worker_first, true);
});

test('ZIP intake validates root entry, paths, duplicate names and file types', async () => {
  const root = ['index.html', '<h1>Demo</h1>'];
  const files = await artifactFiles(zip([root, ['assets/main.js', 'export {};']]), 'application/zip');
  assert.equal(Buffer.from(files.get('assets/main.js')).toString(), 'export {};');
  for (const name of ['../outside.js', 'INDEX.HTML', 'assets/program.exe']) {
    await assert.rejects(artifactFiles(zip([root, [name, 'x']]), 'application/zip'));
  }
  await assert.rejects(artifactFiles(zip([['dist/index.html', 'x']]), 'application/zip'), /at its root/);
});

test('owner can upload HTML and ZIP, update the fixed draft, and keep it after a failed upload', async () => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  for (const migration of ['0001_people_and_likes', '0003_artifacts', '0004_cli_devices', '0005_artifact_publication', '0002_submissions']) {
    db.exec(readFileSync(new URL(`../site/migrations/${migration}.sql`, import.meta.url), 'utf8'));
  }
  const site = 'https://motionhub.dev', origin = 'https://artifacts.motionhub.dev';
  for (const [id, login] of [[1, 'alice'], [2, 'bob']]) {
    db.prepare('INSERT INTO people (id, login, created_at, seen_at) VALUES (?, ?, 0, 0)').run(id, login);
    db.prepare('INSERT INTO sessions VALUES (?, ?, 0, ?)').run(await sha256(login), id, Math.floor(Date.now() / 1000) + 300);
  }
  const statement = (sql, args = []) => ({
    bind: (...params) => statement(sql, params),
    first: async () => db.prepare(sql).get(...args),
    all: async () => ({results: db.prepare(sql).all(...args)}),
    run: async () => ({meta: db.prepare(sql).run(...args)}),
  });
  const objects = new Map();
  let fail = false;
  const env = {
    ARTIFACT_CONTENT_ORIGIN: origin,
    DB: {prepare: statement, batch: (list) => Promise.all(list.map((query) => query.run()))},
    ARTIFACTS: {
      put: async (key, bytes) => {
        if (fail && key.endsWith('/index.html')) throw new Error('Unavailable');
        objects.set(key, bytes);
      },
      get: async (key) => objects.has(key) ? {body: objects.get(key)} : null,
      list: async ({prefix}) => ({objects: [...objects.keys()].filter((key) => key.startsWith(prefix)).map((key) => ({key})), truncated: false}),
      delete: async (keys) => keys.forEach((key) => objects.delete(key)),
    },
  };
  const fetch = (url, options) => worker.fetch(new Request(url, options), env);
  assert.equal((await fetch(origin + '/auth/login')).status, 404);
  assert.equal((await fetch(origin + '/api/cli/me')).status, 404);
  // the content origin answers its content routes only, never the site's pages (env has no ASSETS to fall back on)
  for (const path of ['/', '/docs/', '/m/@alice/example/', '/artifacts/']) assert.equal((await fetch(origin + path)).status, 404);
  const cookie = {cookie: '__Host-mh_session=alice'};
  const upload = (path, body, type, owner = cookie) => fetch(site + path, {
    method: 'POST', body, headers: {...owner, origin: site, 'content-type': type},
  });
  assert.equal((await upload('/api/artifacts', 'anonymous', 'text/html', {})).status, 401);
  const created = await upload('/api/artifacts', 'first draft', 'text/html', {...cookie, 'x-artifact-title': encodeURIComponent('账目桥 Demo')});
  assert.equal(created.status, 201);
  const result = await created.json();
  const {id, preview} = result;
  const title = () => db.prepare('SELECT title FROM artifacts WHERE id = ?').get(id).title;
  assert.equal(title(), '账目桥 Demo');
  assert.equal(preview, `/artifact/${id}/preview`);
  const legacy = await fetch(site + '/artifacts/' + id, {headers: cookie});
  assert.equal(legacy.status, 302);
  assert.equal(legacy.headers.get('location'), site + preview);
  assert.equal(result.directPreview, undefined);
  const previewHtml = await (await fetch(site + preview, {headers: cookie})).text();
  assert.match(previewHtml, /preview-header/);
  assert.match(previewHtml, /<summary>Manage<\/summary>/);
  const directPreview = previewHtml.match(/src="([^"]+\/index\.html)"/)[1];
  assert.equal(new URL(directPreview).origin, origin);
  assert.equal(await (await fetch(directPreview)).text(), 'first draft');
  assert.equal((await fetch(site + preview, {headers: {cookie: '__Host-mh_session=bob'}})).status, 404);
  assert.equal((await upload('/api/artifacts/' + id, 'intruder', 'text/html', {cookie: '__Host-mh_session=bob'})).status, 404);
  const frame = async () => (await (await fetch(site + preview, {headers: cookie})).text()).match(/src="([^"]+\/index\.html)"/)[1];
  const firstFrame = await frame();
  assert.equal(await (await fetch(firstFrame)).text(), 'first draft');
  const manage = async (data, owner = cookie) => {
    const response = await fetch(site + preview, {
    method: 'POST', body: new URLSearchParams(data), headers: {...owner, origin: site},
  });
    if (response.status === 303) assert.equal(response.headers.get('location'), site + preview);
    return response;
  };
  const original = db.prepare('SELECT draft_version FROM artifacts WHERE id = ?').get(id).draft_version;
  assert.equal((await manage({action: 'publish', version: original}, {cookie: '__Host-mh_session=bob'})).status, 404);
  assert.equal((await manage({action: 'publish', version: original, main_motion: '@alice/example'})).status, 303);
  assert.equal((await manage({action: 'share', version: original})).status, 303);
  const share = db.prepare('SELECT id FROM artifact_shares').get().id;

  const archive = zip([['assets/main.js', 'export {};'], ['index.html', 'second draft']]);
  const updated = await upload('/api/artifacts/' + id, archive, 'application/zip');
  assert.equal(updated.status, 201);
  assert.equal(title(), '账目桥 Demo');
  assert.equal((await updated.json()).preview, preview);
  const latestDirect = await frame();
  assert.equal(await (await fetch(latestDirect)).text(), 'second draft');
  assert.equal(await (await fetch(directPreview)).text(), 'first draft');
  fail = true;
  assert.equal((await upload('/api/artifacts/' + id, archive, 'application/zip', {...cookie, 'x-artifact-title': 'Failed rename'})).status, 500);
  assert.equal(title(), '账目桥 Demo');
  const latestFrame = await frame();
  const document = await fetch(latestFrame);
  assert.equal(await document.text(), 'second draft');
  const work = site + '/works/' + id;
  assert.match(await (await fetch(work)).text(), /@alice\/example/);
  assert.match(await (await fetch(site + '/portfolio/alice')).text(), new RegExp(id));
  assert.equal((await manage({action: 'delete-version', version: original})).status, 409);
  const published = origin + '/published/' + original + '/index.html';
  assert.equal(await (await fetch(published)).text(), 'first draft');
  const shared = origin + '/shared/' + share + '/index.html';
  assert.equal(await (await fetch(shared)).text(), 'first draft');
  assert.equal((await manage({action: 'revoke', share})).status, 303);
  assert.equal((await fetch(shared)).status, 404);
  assert.equal((await manage({action: 'unpublish'})).status, 303);
  assert.equal((await fetch(work)).status, 404);
  assert.equal((await fetch(published)).status, 404);
  assert.equal((await manage({action: 'delete-version', version: original})).status, 303);
  assert.doesNotMatch(await (await fetch(site + '/portfolio/alice')).text(), new RegExp(id));

  assert.match(document.headers.get('content-security-policy'), /sandbox allow-scripts/);
  const script = new URL('assets/main.js', latestFrame);
  assert.equal(await (await fetch(script)).text(), 'export {};');
  assert.equal((await fetch(script, {headers: {origin: 'null'}})).headers.get('access-control-allow-origin'), 'null');
  assert.equal((await fetch(script, {headers: {origin: 'https://unrelated.example'}})).headers.get('access-control-allow-origin'), null);
  script.pathname = script.pathname.replace(/preview\/[^/]+/, 'preview/' + 'a'.repeat(64));
  assert.equal((await fetch(script)).status, 404);
  db.exec('UPDATE artifact_preview_grants SET expires_at = 0');
  assert.equal((await fetch(latestDirect)).status, 404);
  assert.equal((await fetch(latestFrame)).status, 404);
  assert.equal(objects.size, 3);
  fail = false;
  for (const badTitle of ['', ' ', 'a'.repeat(101), '%invalid']) {
    assert.equal((await upload('/api/artifacts/' + id, 'bad', 'text/html', {...cookie, 'x-artifact-title': badTitle})).status, 400);
  }
  const cli = (path, secret, method = 'POST') => fetch(site + '/api/cli/' + path, {method, headers: secret ? {authorization: 'Bearer ' + secret} : {}});
  const device = await (await cli('device')).json();
  assert.equal((await cli('token', device.secret)).status, 202);
  const authorize = (action, owner = cookie, url = device.url) => fetch(url, {
    method: 'POST', headers: {...owner, origin: site}, body: new URLSearchParams({action}),
  });
  assert.equal(device.userCode, undefined);
  assert.equal((await authorize('allow', {})).status, 303);
  // a browser posts a form with Origin: null from a no-referrer page, so the pages with forms checked by Origin keep it
  const formPage = await fetch(device.url, {headers: cookie});
  const formText = await formPage.text();
  assert.match(formText, /<form method="post"/);
  assert.match(formText, /@alice/);
  assert.doesNotMatch(formText, /<input/);
  assert.equal(formPage.headers.get('referrer-policy'), 'same-origin');
  assert.equal((await fetch(site + preview, {headers: cookie})).headers.get('referrer-policy'), 'same-origin');
  assert.equal((await authorize('')).status, 400);
  assert.equal((await authorize('maybe')).status, 400);
  assert.equal((await fetch(device.url, {method: 'POST', headers: cookie, body: new URLSearchParams({action: 'allow'})})).status, 403);
  assert.equal((await cli('token', device.secret)).status, 202);
  assert.equal((await authorize('allow')).status, 200);
  assert.equal((await authorize('allow')).status, 410);
  const {token} = await (await cli('token', device.secret)).json();
  assert.equal((await cli('token', device.secret)).status, 410);
  assert.equal((await (await cli('me', token, 'GET')).json()).login, 'alice');
  assert.equal((await fetch(site + '/api/artifacts/' + id, {method: 'POST', body: 'CLI draft',
    headers: {authorization: 'Bearer ' + token, 'content-type': 'text/html', 'x-artifact-title': encodeURIComponent('新账目桥')}})).status, 201);
  // denied, the link is spent and the waiting terminal is told so
  const denied = await (await cli('device')).json();
  assert.equal((await authorize('deny', cookie, denied.url)).status, 200);
  assert.equal((await cli('token', denied.secret)).status, 410);
  assert.equal((await authorize('allow', cookie, denied.url)).status, 410);
  assert.equal((await fetch(denied.url, {headers: cookie})).status, 410);
  assert.equal(title(), '新账目桥');
  await cli('logout', token);
  assert.equal((await cli('me', token, 'GET')).status, 401);
  db.exec('DELETE FROM people WHERE id = 1');
  await sweepArtifacts(env);
  assert.equal(objects.size, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM artifact_storage_deletions').get().count, 0);
  db.close();
});
