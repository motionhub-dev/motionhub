import {limitedBytes} from './artifact-files.mjs';
import {person, sameOrigin, sha256} from './people.mjs';
import {escapeHtml, shellPage} from './shell.mjs';

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
  if (!valid.test(code)) return gone(request, env, 400);
  const me = await person(request, env);
  if (!me) return Response.redirect(new URL('/auth/login?next=' + encodeURIComponent(path + url.search), url), 303);
  const hash = await sha256(code);
  if (request.method === 'POST' && sameOrigin(request)) {
    let action;
    try {
      action = new URLSearchParams(new TextDecoder().decode(await limitedBytes(request.body, 1024))).get('action');
    } catch { action = null; }
    if (action !== 'allow' && action !== 'deny') return gone(request, env, 400);
    // denied, the link expires at once: the terminal's next poll is told so and stops waiting
    const result = await env.DB.prepare(action === 'allow'
      ? 'UPDATE cli_devices SET person = ? WHERE code_hash = ? AND person IS NULL AND expires_at > ? RETURNING code_hash'
      : 'UPDATE cli_devices SET expires_at = 0 WHERE code_hash = ? AND person IS NULL AND expires_at > ? RETURNING code_hash')
      .bind(...(action === 'allow' ? [me.id] : []), hash, now()).first();
    if (!result) return gone(request, env);
    return action === 'allow' ? done(request, env, me) : denied(request, env);
  }
  if (request.method !== 'GET') return json({}, 403);
  const pending = await env.DB.prepare('SELECT 1 FROM cli_devices WHERE code_hash = ? AND person IS NULL AND expires_at > ?').bind(hash, now()).first();
  return pending ? authorizationPage(request, env, me) : gone(request, env);
}

// the pages a person sees, in the site's layout (site/shell.mjs)
const tick = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const alert = '<span class="share-mark" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 4v5M8 11.6v.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>';
const gate = (request, env, title, card, status = 200) => shellPage(request, env, {
  title: `${title}: motionhub`, description: 'Sign the motionhub command line in.', path: '/cli/authorize',
  head: '<meta name="robots" content="noindex">', status, headers: {'cache-control': 'no-store'},
  body: `<div class="gate"><section class="gate-card">${card}</section></div>`,
});

function authorizationPage(request, env, me) {
  const name = me.name || me.login;
  return gate(request, env, 'Sign in the command line', `<h1>Is this you signing in?</h1>
<p>A terminal is asking to act as you on motionhub.</p>
<div class="gate-who"><img src="/avatar/${me.id}?s=80" alt="" width="40" height="40"><div><b>${escapeHtml(name)}</b><small>@${escapeHtml(me.login)}</small></div></div>
<ul class="gate-grants"><li>Upload private Artifact drafts as @${escapeHtml(me.login)}</li><li>For 30 days, or until you run <code>motionhub logout</code></li></ul>
<div class="gate-warn">${alert}<div><p><strong>Only allow this if you just ran <code>motionhub login</code> yourself.</strong></p><p>If someone sent you this link, or you don't recognise it, deny it: allowing it would let their terminal upload as you.</p></div></div>
<form method="post" class="gate-acts"><button class="btn accent" name="action" value="allow">Yes, it's me: allow</button><button class="btn" name="action" value="deny">No, deny</button></form>`);
}

const done = (request, env, me) => gate(request, env, 'Signed in', `<span class="share-big-tick">${tick}</span>
<h1>Your terminal is signed in</h1>
<p>Return to your terminal: it is signed in as <strong>@${escapeHtml(me.login)}</strong>. You can close this page.</p>
<p class="note">Upload a page or a site with <code>motionhub artifact upload &lt;dir&gt;</code>. Your drafts are on <a href="/artifacts/">your Artifacts</a>.</p>`);

const denied = (request, env) => gate(request, env, 'Denied', `<h1>Sign-in denied</h1>
<p>The terminal was not signed in, and this link no longer works. If it was you after all, run <code>motionhub login</code> again.</p>`);

const gone = (request, env, status = 410) => gate(request, env, 'Link expired', `<h1>This sign-in link no longer works</h1>
<p>A link works once, for 10 minutes. Run <code>motionhub login</code> again for a new one.</p>
<pre data-copy>npx @motionhub/cli login</pre>`, status);
