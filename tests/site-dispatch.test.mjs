// What asks motionhubdev/motionhub-web to look at main (.github/scripts/site-dispatch.mjs): an Actions-write
// token for that repository alone, a dispatch with no commit, and a refusal before anything broader is sent.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createVerify, generateKeyPairSync, randomBytes} from 'node:crypto';
import {acceptedToken, actionsWriteOnly, appJwt, dispatchBody, notify, tokenBody} from '../.github/scripts/site-dispatch.mjs';

const SITE = 'motionhubdev/motionhub-web';
const pem = () => generateKeyPairSync('rsa', {modulusLength: 2048}).privateKey.export({type: 'pkcs1', format: 'pem'});
// Built at runtime so the source holds no token prefix.
const minted = () => `${String.fromCharCode(103, 104, 115)}_${randomBytes(24).toString('hex')}`;

test('the app JWT is RS256, issued a minute ago, and good for ten minutes', () => {
  const {publicKey, privateKey} = generateKeyPairSync('rsa', {modulusLength: 2048});
  const key = privateKey.export({type: 'pkcs1', format: 'pem'});
  const now = 1_700_000_000_000;
  const jwt = appJwt('418', key, now);
  const [head, claims, signature] = jwt.split('.');
  assert.equal(jwt.split('.').length, 3);
  assert.ok(head && claims && signature);
  assert.equal(createVerify('RSA-SHA256').update(`${head}.${claims}`).verify(publicKey, Buffer.from(signature, 'base64url')), true);
  const payload = JSON.parse(Buffer.from(claims, 'base64url').toString());
  assert.equal(payload.iss, '418');
  assert.equal(payload.exp - payload.iat, 600);
  assert.equal(payload.iat, Math.floor(now / 1000) - 60);
});

test('the token asks for Actions write on the site, and the dispatch names main and no commit', () => {
  const asked = tokenBody();
  assert.deepEqual(asked, {repositories: ['motionhub-web'], permissions: {actions: 'write'}});
  assert.deepEqual(Object.keys(asked).sort(), ['permissions', 'repositories']);
  const sent = dispatchBody();
  assert.deepEqual(sent, {ref: 'main'});
  assert.equal('inputs' in sent, false);
});

test('only Actions write, with the metadata read GitHub attaches, is accepted', () => {
  const cases = [
    [{actions: 'write', metadata: 'read'}, true],
    [{actions: 'write'}, true],
    [{metadata: 'read'}, false],
    [{}, false],
    [{actions: 'write', contents: 'write'}, false],
    [{actions: 'read'}, false],
    [{actions: 'write', metadata: 'write'}, false],
  ];
  for (const [permissions, ok] of cases) assert.equal(actionsWriteOnly(permissions), ok, JSON.stringify(permissions));
});

test('a token is sent only for the site with Actions write, and a refusal never quotes it', () => {
  const token = minted();
  const good = {
    token,
    repository_selection: 'selected',
    permissions: {actions: 'write', metadata: 'read'},
    repositories: [{full_name: SITE}],
  };
  assert.equal(acceptedToken(good), '');
  const bad = [
    {...good, token: ''},
    {...good, repository_selection: 'all'},
    {...good, repositories: [{full_name: SITE}, {full_name: 'motionhubdev/motionhub'}]},
    {...good, repositories: [{full_name: 'motionhubdev/motionhub'}]},
    {...good, permissions: {...good.permissions, contents: 'write'}},
  ];
  for (const body of bad) {
    const reason = acceptedToken(body);
    assert.equal(typeof reason, 'string');
    assert.ok(reason);
    assert.equal(reason.includes(token), false);
  }
});

test('notify dispatches upstream.yml with the minted token and prints neither it nor the key', async () => {
  const token = minted();
  const key = pem();
  const seen = [];
  const doFetch = async (url, init = {}) => {
    const authorization = init.headers?.authorization ?? '';
    const scheme = authorization.split(' ')[0];
    seen.push({
      method: init.method ?? 'GET',
      url,
      scheme,
      authorization,
      contentType: init.headers?.['content-type'],
      body: init.body ? JSON.parse(init.body) : undefined,
    });
    assert.equal(scheme, 'Bearer');
    if (String(url).endsWith('/installation')) return {ok: true, status: 200, json: async () => ({id: 9})};
    if (String(url).endsWith('/access_tokens')) return {
      ok: true, status: 201,
      json: async () => ({
        token, repository_selection: 'selected',
        permissions: {actions: 'write', metadata: 'read'},
        repositories: [{full_name: SITE}],
      }),
    };
    return {status: 204};
  };
  const printed = [];
  const log = console.log, error = console.error;
  console.log = (...args) => printed.push(args.map(String).join(' '));
  console.error = (...args) => printed.push(args.map(String).join(' '));
  try {
    await notify({SITE_APP_ID: '418', SITE_APP_PRIVATE_KEY: key}, doFetch);
  } finally {
    console.log = log;
    console.error = error;
  }
  assert.equal(seen.length, 3);
  assert.equal(seen[0].method, 'GET');
  assert.equal(seen[1].method, 'POST');
  assert.equal(seen[1].contentType, 'application/json');
  assert.deepEqual(seen[1].body, tokenBody());
  assert.equal(seen[2].method, 'POST');
  assert.equal(seen[2].contentType, 'application/json');
  assert.ok(seen[2].url.endsWith(`/repos/${SITE}/actions/workflows/upstream.yml/dispatches`));
  assert.deepEqual(seen[2].body, dispatchBody());
  assert.equal(seen[2].authorization, `Bearer ${token}`);
  assert.notEqual(seen[0].authorization, `Bearer ${token}`);
  const text = printed.join('\n');
  assert.equal(text.includes(token), false);
  assert.equal(text.includes('PRIVATE KEY'), false);
  assert.equal(text.includes(key), false);
});

test('notify does not dispatch a broader token, the catalogue, a redirect or a missing secret', async () => {
  const token = minted();
  const key = pem();
  const scripted = (handed) => {
    const urls = [];
    const doFetch = async (url) => {
      urls.push(String(url));
      if (String(url).endsWith('/installation')) return {ok: true, status: 200, json: async () => ({id: 9})};
      if (String(url).endsWith('/access_tokens')) return {ok: true, status: 201, json: async () => handed};
      return {status: 204};
    };
    return {urls, doFetch};
  };
  const env = {SITE_APP_ID: '418', SITE_APP_PRIVATE_KEY: key};
  const broad = scripted({
    token, repository_selection: 'selected',
    permissions: {actions: 'write', metadata: 'read', contents: 'write'},
    repositories: [{full_name: SITE}],
  });
  await assert.rejects(() => notify(env, broad.doFetch), /permissions other than Actions write/);
  assert.equal(broad.urls.some((url) => url.includes('/dispatches')), false);

  const catalogue = scripted({
    token, repository_selection: 'selected',
    permissions: {actions: 'write', metadata: 'read'},
    repositories: [{full_name: 'motionhubdev/motionhub'}],
  });
  await assert.rejects(() => notify(env, catalogue.doFetch), /some other repository/);
  assert.equal(catalogue.urls.some((url) => url.includes('/dispatches')), false);

  const redirected = [];
  await assert.rejects(() => notify(env, async (url) => { redirected.push(String(url)); return {status: 302, ok: false}; }), /redirected/);
  assert.equal(redirected.length, 1);
  assert.equal(redirected.some((url) => url.includes('/dispatches')), false);

  const calls = [];
  await assert.rejects(
    () => notify({SITE_APP_PRIVATE_KEY: key}, async (url) => { calls.push(url); return {status: 500}; }),
    (err) => {
      assert.equal(err.message, 'SITE_APP_ID and SITE_APP_PRIVATE_KEY are not set');
      assert.equal(err.message.includes(key), false);
      return true;
    },
  );
  assert.equal(calls.length, 0);
});
