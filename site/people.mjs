// Signing in with GitHub, and likes. The Worker (worker.mjs) routes /auth/*, /api/me, /api/me/pulls (pulls.mjs) and
// /api/likes/<id> here.
//
// Sign-in is GitHub's OAuth web flow with no scope: motionhub learns the account's public id, login, name and avatar,
// and never keeps GitHub's token. A session is a random token in an HttpOnly cookie; the database (D1, binding DB)
// keeps only its SHA-256. A second cookie, mh_in, readable by the page, says only that someone is signed in, so a
// page asks /api/me only then. A like is one row (motion, person); /api/stats.json counts them.

import {pulls} from './pulls.mjs';

const SESSION = 'mh_session', SIGNED_IN = 'mh_in', STATE = 'mh_state';
const DAYS_30 = 30 * 86400;
const ID = /^(?:@[a-z0-9-]+\/)?[a-z0-9-]+$/;
const UA = 'motionhub.dev';

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {status, headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', ...headers}});

function cookies(request) {
  const out = {};
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const at = part.indexOf('=');
    if (at > 0) out[part.slice(0, at).trim()] = decodeURIComponent(part.slice(at + 1).trim());
  }
  return out;
}

const cookie = (name, value, maxAge, {httpOnly = true, path = '/'} = {}) =>
  `${name}=${encodeURIComponent(value)}; Path=${path}; Max-Age=${maxAge}; Secure; SameSite=Lax${httpOnly ? '; HttpOnly' : ''}`;

function token() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Where to go after signing in: a path on this site, never another site. */
export function safeNext(next) {
  return typeof next === 'string' && /^\/(?![/\\])[^\s]*$/.test(next) ? next : '/';
}

/** The person a request's session belongs to, or null. */
export async function person(request, env, now = Date.now()) {
  const t = cookies(request)[SESSION];
  if (!t || !env.DB) return null;
  return await env.DB.prepare('SELECT p.id, p.login, p.name, p.avatar FROM sessions s JOIN people p ON p.id = s.person WHERE s.token_hash = ? AND s.expires_at > ?')
    .bind(await sha256(t), Math.floor(now / 1000)).first();
}

/** A request that changes something must come from a page of this site. */
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  return origin !== null && origin === new URL(request.url).origin;
}

function login(request, env) {
  const url = new URL(request.url);
  const state = token();
  const next = safeNext(url.searchParams.get('next'));
  const github = new URL('https://github.com/login/oauth/authorize');
  github.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  github.searchParams.set('redirect_uri', `${url.origin}/auth/callback`);
  github.searchParams.set('state', state);
  github.searchParams.set('allow_signup', 'true');
  return new Response(null, {status: 302, headers: {location: github.toString(), 'set-cookie': cookie(STATE, `${state} ${next}`, 600, {path: '/auth/'}), 'cache-control': 'no-store'}});
}

async function callback(request, env, now = Date.now()) {
  const url = new URL(request.url);
  const [state, next] = (cookies(request)[STATE] ?? '').split(' ');
  const fail = (why) => new Response(`Signing in did not work: ${why}. Go back and try again.`, {status: 400, headers: {'content-type': 'text/plain; charset=utf-8', 'set-cookie': cookie(STATE, '', 0, {path: '/auth/'})}});
  if (!state || url.searchParams.get('state') !== state) return fail('the sign-in expired or came from somewhere else');
  const code = url.searchParams.get('code');
  if (!code) return fail('GitHub did not sign you in');

  const exchange = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {accept: 'application/json', 'content-type': 'application/json', 'user-agent': UA},
    body: JSON.stringify({client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: `${url.origin}/auth/callback`}),
  }).then((r) => r.json()).catch(() => ({}));
  if (!exchange.access_token) return fail('GitHub did not confirm it');
  const user = await fetch('https://api.github.com/user', {headers: {authorization: `Bearer ${exchange.access_token}`, accept: 'application/vnd.github+json', 'user-agent': UA}})
    .then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (!user?.id) return fail('GitHub did not say who you are');

  const at = Math.floor(now / 1000), t = token();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO people (id, login, name, avatar, created_at, seen_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5) ON CONFLICT(id) DO UPDATE SET login = ?2, name = ?3, avatar = ?4, seen_at = ?5')
      .bind(user.id, user.login, user.name ?? null, user.avatar_url ?? null, at),
    env.DB.prepare('INSERT INTO sessions (token_hash, person, created_at, expires_at) VALUES (?, ?, ?, ?)').bind(await sha256(t), user.id, at, at + DAYS_30),
    env.DB.prepare('DELETE FROM sessions WHERE person = ? AND expires_at <= ?').bind(user.id, at),
  ]);
  const headers = new Headers({location: safeNext(next), 'cache-control': 'no-store'});
  headers.append('set-cookie', cookie(SESSION, t, DAYS_30));
  headers.append('set-cookie', cookie(SIGNED_IN, '1', DAYS_30, {httpOnly: false}));
  headers.append('set-cookie', cookie(STATE, '', 0, {path: '/auth/'}));
  return new Response(null, {status: 302, headers});
}

function signedOut(body = {ok: true}) {
  const headers = new Headers({'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'});
  headers.append('set-cookie', cookie(SESSION, '', 0));
  headers.append('set-cookie', cookie(SIGNED_IN, '', 0, {httpOnly: false}));
  return new Response(JSON.stringify(body), {headers});
}

async function logout(request, env) {
  const t = cookies(request)[SESSION];
  if (t && env.DB) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(t)).run();
  return signedOut();
}

/** Everything motionhub keeps about the signed-in person, gone: their likes, sessions and record. */
async function forget(request, env) {
  const me = await person(request, env);
  // their shares too (site/submissions.mjs): the pull requests already opened are GitHub's, public, and stay
  if (me) await env.DB.batch(['likes', 'sessions', 'submissions'].map((t) => env.DB.prepare(`DELETE FROM ${t} WHERE person = ?`).bind(me.id)).concat(env.DB.prepare('DELETE FROM people WHERE id = ?').bind(me.id)));
  return signedOut({ok: true, forgotten: Boolean(me)});
}

async function me(request, env) {
  const p = await person(request, env);
  if (!p) return json({person: null}, 200, {'set-cookie': cookie(SIGNED_IN, '', 0, {httpOnly: false})});
  const {results} = await env.DB.prepare('SELECT motion FROM likes WHERE person = ? ORDER BY motion').bind(p.id).all();
  // id is GitHub's numeric id for the account: the page matches it with the motions' accounts (accounts/), which a rename does not change
  return json({person: {id: p.id, login: p.login, name: p.name, avatar: p.avatar}, likes: results.map((r) => r.motion)});
}

/** The ids of the motions on the site, from the index the build wrote. */
async function motionIds(request, env) {
  const r = await env.ASSETS.fetch(new Request(new URL('/api/motions.json', request.url)));
  return new Set((await r.json()).motions.map((m) => m.slug));
}

async function like(request, env, id, now = Date.now()) {
  if (!ID.test(id)) return json({error: 'no such motion'}, 404);
  if (!sameOrigin(request)) return json({error: 'a like is given from motionhub.dev'}, 403);
  const p = await person(request, env, now);
  if (!p) return json({error: 'sign in to like a motion'}, 401);
  if (!(await motionIds(request, env)).has(id)) return json({error: 'no such motion'}, 404);
  if (request.method === 'POST') await env.DB.prepare('INSERT OR IGNORE INTO likes (motion, person, created_at) VALUES (?, ?, ?)').bind(id, p.id, Math.floor(now / 1000)).run();
  else await env.DB.prepare('DELETE FROM likes WHERE motion = ? AND person = ?').bind(id, p.id).run();
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM likes WHERE motion = ?').bind(id).first();
  return json({motion: id, liked: request.method === 'POST', likes: row?.n ?? 0});
}

/** Each motion's likes, as {id: n}. */
export async function likeCounts(env) {
  if (!env.DB) return {};
  const {results} = await env.DB.prepare('SELECT motion, COUNT(*) AS n FROM likes GROUP BY motion').all();
  return Object.fromEntries(results.map((r) => [r.motion, r.n]));
}

/** Handles the routes this file owns, or returns null. */
export async function people(request, env, ctx) {
  const {pathname} = new URL(request.url);
  const m = request.method;
  if (pathname === '/auth/login' && m === 'GET') return login(request, env);
  if (pathname === '/auth/callback' && m === 'GET') return callback(request, env);
  if (pathname === '/auth/logout' && m === 'POST') return sameOrigin(request) ? logout(request, env) : json({error: 'forbidden'}, 403);
  if (pathname === '/api/me' && m === 'GET') return me(request, env);
  if (pathname === '/api/me' && m === 'DELETE') return sameOrigin(request) ? forget(request, env) : json({error: 'forbidden'}, 403);
  if (pathname === '/api/me/pulls' && m === 'GET') return pulls(request, env, ctx, await person(request, env));
  const l = /^\/api\/likes\/(.+)$/.exec(pathname);
  if (l && (m === 'POST' || m === 'DELETE')) return like(request, env, decodeURIComponent(l[1]));
  if (pathname.startsWith('/auth/') || pathname === '/api/me' || pathname === '/api/me/pulls' || l) return json({error: 'method not allowed'}, 405);
  return null;
}
