import {person, sameOrigin, sha256} from './people.mjs';

const token = () => crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
const valid = /^[a-f0-9]{64}$/;
const now = () => Math.floor(Date.now() / 1000);
const headers = {'cache-control': 'no-store', 'referrer-policy': 'no-referrer'};
const json = (data, status = 200) => Response.json(data, {status, headers});
const bearer = (request) => /^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('authorization') ?? '')?.[1];

export async function cliPerson(request, env) {
  const credential = bearer(request);
  if (!credential) return null;
  return env.DB.prepare(`SELECT p.id, p.login, p.name, d.motion_submit FROM cli_devices d JOIN people p ON p.id = d.person
    WHERE d.token_hash = ? AND d.expires_at > ?`).bind(await sha256(credential), now()).first();
}

export async function cliAuth(request, env) {
  const url = new URL(request.url), path = url.pathname;
  if (!path.startsWith('/api/cli/') && path !== '/cli/authorize') return null;
  if (!env.DB || !env.ARTIFACTS || !env.ARTIFACT_CONTENT_ORIGIN ||
      url.origin !== (env.ARTIFACT_SITE_ORIGIN ?? 'https://motionhub.dev')) return json({}, 404);
  if (path === '/api/cli/device' && request.method === 'POST') {
    if (env.SUBMIT_LIMIT && !(await env.SUBMIT_LIMIT.limit({key: 'cli:' + (request.headers.get('cf-connecting-ip') ?? 'local')})).success) return json({error: 'Try again later.'}, 429);
    const scope = url.searchParams.get('scope');
    if (scope && scope !== 'motion:submit') return json({error: 'Invalid scope.'}, 400);
    const code = token(), secret = token();
    await env.DB.prepare('INSERT INTO cli_devices (code_hash, secret_hash, expires_at, motion_submit) VALUES (?, ?, ?, ?)').bind(await sha256(code), await sha256(secret), now() + 600, scope === 'motion:submit' ? 1 : 0).run();
    return json({url: new URL('/cli/authorize?code=' + code, url.origin).href, secret});
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
    const result = await env.DB.prepare('UPDATE cli_devices SET person = ? WHERE code_hash = ? AND person IS NULL AND expires_at > ?').bind(me.id, hash, now()).run();
    return new Response(result.meta.changes ? 'Authorized. Return to your terminal.' : 'This authorization link has expired or was used.', {status: result.meta.changes ? 200 : 410, headers});
  }
  if (request.method !== 'GET') return json({}, 403);
  const pending = await env.DB.prepare('SELECT motion_submit FROM cli_devices WHERE code_hash = ? AND person IS NULL AND expires_at > ?').bind(hash, now()).first();
  if (!pending) return json({error: 'Authorization link expired or was used.'}, 410);
  const permission = pending.motion_submit ? 'Allow this terminal to upload private artifact drafts and submit Motion pull requests after DCO confirmation' : 'Allow this terminal to upload private artifact drafts';
  return new Response(`<!doctype html><meta charset="utf-8"><title>MotionHub CLI</title><h1>Authorize MotionHub CLI</h1><p>${permission} for 30 days. Continue only if you started this login.</p><form method="post"><button>Authorize this terminal</button></form>`, {headers: {...headers, 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'none'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'"}});
}
