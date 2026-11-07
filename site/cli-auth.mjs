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
    // no terminal code to type: the authorization page asks the person to confirm they started this login themselves
    // (user_code_hash and attempts, from 0004_cli_devices.sql, are no longer used)
    await env.DB.prepare("INSERT INTO cli_devices (code_hash, secret_hash, user_code_hash, expires_at) VALUES (?, ?, '', ?)")
      .bind(await sha256(code), await sha256(secret), now() + 600).run();
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
    let action;
    try {
      action = new URLSearchParams(new TextDecoder().decode(await limitedBytes(request.body, 1024))).get('action');
    } catch { return json({error: 'Invalid authorization form.'}, 400); }
    if (action !== 'allow' && action !== 'deny') return json({error: 'Invalid authorization form.'}, 400);
    // denied, the link expires at once: the terminal's next poll is told so and stops waiting
    const result = await env.DB.prepare(action === 'allow'
      ? 'UPDATE cli_devices SET person = ? WHERE code_hash = ? AND person IS NULL AND expires_at > ? RETURNING code_hash'
      : 'UPDATE cli_devices SET expires_at = 0 WHERE code_hash = ? AND person IS NULL AND expires_at > ? RETURNING code_hash')
      .bind(...(action === 'allow' ? [me.id] : []), hash, now()).first();
    if (!result) return json({error: 'Authorization link expired or was used.'}, 410);
    return message(action === 'allow' ? 'Authorized. Return to your terminal.' : 'Denied. The terminal was not signed in.');
  }
  if (request.method !== 'GET') return json({}, 403);
  const pending = await env.DB.prepare('SELECT 1 FROM cli_devices WHERE code_hash = ? AND person IS NULL AND expires_at > ?').bind(hash, now()).first();
  return pending ? authorizationPage(me.login) : json({error: 'Authorization link expired or was used.'}, 410);
}

const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
const html = (body, status = 200) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>MotionHub CLI</title>
<style>body{font:1rem system-ui;margin:2rem auto;padding:0 1rem;max-width:36rem}form{display:flex;gap:1rem}</style>${body}`, {status, headers: {...headers,
  'content-type': 'text/html; charset=utf-8',
  'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'"}});
const message = (text) => html(`<h1>MotionHub CLI</h1><p>${escape(text)}</p>`);

function authorizationPage(login) {
  return html(`<h1>Is this you signing in?</h1>
<p>A terminal is asking to upload private Artifact drafts as <strong>@${escape(login)}</strong> for 30 days.</p>
<p><strong>Only allow it if you just ran <code>motionhub login</code> yourself.</strong> If someone sent you this link, or you don't recognise it, deny it.</p>
<form method="post"><button name="action" value="allow">Yes, it's me: allow</button><button name="action" value="deny">No, deny</button></form>`);
}
