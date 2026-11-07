import {limitedBytes} from './artifact-files.mjs';
import {person, sameOrigin, sha256} from './people.mjs';

const token = () => crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
const valid = /^[a-f0-9]{64}$/;
const now = () => Math.floor(Date.now() / 1000);
// same-origin, not no-referrer: a browser sends Origin: null on a form post from a no-referrer page, and the
// authorization form is checked by its Origin (sameOrigin)
const headers = {'cache-control': 'no-store', 'referrer-policy': 'same-origin'};
const json = (data, status = 200) => Response.json(data, {status, headers});
const bearer = (request) => /^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('authorization') ?? '')?.[1];

export async function cliPerson(request, env) {
  const credential = bearer(request);
  if (!credential) return null;
  return env.DB.prepare(`SELECT p.id, p.login, p.name FROM cli_devices d JOIN people p ON p.id = d.person
    WHERE d.token_hash = ? AND d.expires_at > ?`).bind(await sha256(credential), now()).first();
}

export async function cliAuth(request, env) {
  const url = new URL(request.url), path = url.pathname;
  if (!path.startsWith('/api/cli/') && path !== '/cli/authorize') return null;
  if (!env.DB || !env.ARTIFACTS || !env.ARTIFACT_CONTENT_ORIGIN ||
      url.origin !== (env.ARTIFACT_SITE_ORIGIN ?? 'https://motionhub.dev')) return json({}, 404);
  if (path === '/api/cli/device' && request.method === 'POST') {
    if (env.SUBMIT_LIMIT && !(await env.SUBMIT_LIMIT.limit({key: 'cli:' + (request.headers.get('cf-connecting-ip') ?? 'local')})).success) return json({error: 'Try again later.'}, 429);
    const code = token(), secret = token();
    const userCode = crypto.randomUUID().slice(0, 8).toUpperCase();
    await env.DB.prepare('INSERT INTO cli_devices (code_hash, secret_hash, user_code_hash, expires_at) VALUES (?, ?, ?, ?)')
      .bind(await sha256(code), await sha256(secret), await sha256(code + userCode), now() + 600).run();
    return json({url: new URL('/cli/authorize?code=' + code, url.origin).href, secret, userCode});
  }
  if (path === '/api/cli/token' && request.method === 'POST') {
    const secret = bearer(request);
    if (!secret) return json({error: 'Invalid device secret.'}, 400);
    const credential = token(), hash = await sha256(secret);
    const row = await env.DB.prepare(`UPDATE cli_devices SET token_hash = ?, expires_at = ?
      WHERE secret_hash = ? AND person IS NOT NULL AND token_hash IS NULL AND expires_at > ?
      RETURNING person`).bind(await sha256(credential), now() + 30 * 86400, hash, now()).first();
    if (row) return json({token: credential});
    const pending = await env.DB.prepare('SELECT 1 FROM cli_devices WHERE secret_hash = ? AND token_hash IS NULL AND expires_at > ?').bind(hash, now()).first();
    return pending ? json({pending: true}, 202) : json({error: 'Device authorization expired or was used.'}, 410);
  }
  if (path === '/api/cli/me' && request.method === 'GET') {
    const me = await cliPerson(request, env);
    return me ? json(me) : json({error: 'Sign in with motionhub login.'}, 401);
  }
  if (path === '/api/cli/logout' && request.method === 'POST') {
    const credential = bearer(request);
    if (credential) await env.DB.prepare('DELETE FROM cli_devices WHERE token_hash = ?').bind(await sha256(credential)).run();
    return json({ok: true});
  }
  if (path !== '/cli/authorize') return json({}, 404);
  const code = url.searchParams.get('code') ?? '';
  if (!valid.test(code)) return json({error: 'Invalid authorization link.'}, 400);
  const me = await person(request, env);
  if (!me) return Response.redirect(new URL('/auth/login?next=' + encodeURIComponent(path + url.search), url), 303);
  const hash = await sha256(code);
  if (request.method === 'POST' && sameOrigin(request)) {
    let input;
    try {
      const form = new URLSearchParams(new TextDecoder().decode(await limitedBytes(request.body, 1024)));
      input = (form.get('userCode') ?? '').trim().toUpperCase();
    } catch { return json({error: 'Invalid authorization form.'}, 400); }
    const result = await env.DB.prepare(`UPDATE cli_devices SET attempts = attempts + 1,
      person = CASE WHEN user_code_hash = ? THEN ? ELSE NULL END
      WHERE code_hash = ? AND person IS NULL AND expires_at > ? AND attempts < 5
      RETURNING person`).bind(await sha256(code + input), me.id, hash, now()).first();
    if (!result) return json({error: 'Authorization link expired, was used, or reached its attempt limit.'}, 410);
    if (result.person === me.id) return new Response('Authorized. Return to your terminal.', {headers});
    return authorizationPage('Incorrect code. Enter the code from your own terminal.');
  }
  if (request.method !== 'GET') return json({}, 403);
  const pending = await env.DB.prepare('SELECT 1 FROM cli_devices WHERE code_hash = ? AND person IS NULL AND expires_at > ? AND attempts < 5').bind(hash, now()).first();
  return pending ? authorizationPage() : json({error: 'Authorization link expired, was used, or reached its attempt limit.'}, 410);
}

function authorizationPage(error = '') {
  return new Response(`<!doctype html><meta charset="utf-8"><title>MotionHub CLI</title>
<h1>Authorize MotionHub CLI</h1><p>Allow your terminal to upload private artifact drafts for 30 days.</p>
<p>Enter only the code shown in a terminal where you started this login.</p>
${error ? `<p role="alert">${error}</p>` : ''}
<form method="post"><label>Terminal code <input name="userCode" required pattern="[A-Fa-f0-9]{8}" maxlength="8" autocomplete="off"></label>
<button>Authorize draft uploads</button></form>`, {status: error ? 400 : 200, headers: {...headers, 'content-type': 'text/html; charset=utf-8',
    'content-security-policy': "default-src 'none'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'"}});
}
