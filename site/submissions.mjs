// Sharing a motion without git or gh (the command line's `share`, tools/hub.mjs): the package is uploaded with no
// account and kept a day; the person opens its link, signs in with GitHub, checks it, types the code their terminal
// shows and certifies the DCO; then motionhub's GitHub App opens the pull request for them (site/github-app.mjs).
// The Worker (worker.mjs) routes /api/submissions and /api/submissions/* here, and serves /share/<id> as the page
// that does it (site/src/pages/share.astro).
//
// What is judged here is a courtesy to the person: who may submit, by their account's id. What is binding is judged
// again, on the pull request, by main's checker (.github/workflows/ownership.yml), which reads who submitted it from
// the commit's Motionhub-Submitted-By line.
//
//   POST /api/submissions                   the package (a gzipped tar, tools/pack.mjs) → {id, url, code, poll, expires}
//   GET  /api/submissions/<id>?poll=<token> its state, for the command line → {status, pr, prUrl}
//   GET  /api/submissions/<id>              signed in: what the page shows, and whether this person may submit it
//   GET  /api/submissions/<id>/files/<path> signed in: one of its files, to look at, never to run
//   POST /api/submissions/<id>/submit       signed in, from this site: {code, mine, dco} → {pr, prUrl}

import {person, sameOrigin, sha256} from './people.mjs';
import {PackageError, untgz} from './tar.mjs';
import {commitSubmission} from './github-app.mjs';

const DAY = 86400;
/** Submissions a person may make in a day, and wrong codes a link takes before it stops. */
export const PER_DAY = 5, ATTEMPTS = 5;
const ID = /^@[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const WORDS = ['amber', 'birch', 'cedar', 'delta', 'ember', 'fjord', 'grove', 'harbor', 'indigo', 'juniper', 'kelp', 'lagoon', 'maple', 'nectar', 'orbit', 'pebble', 'quartz', 'raven', 'sable', 'tidal', 'umber', 'violet', 'willow', 'zephyr', 'cobalt', 'falcon', 'lumen', 'meadow', 'ochre', 'prism', 'saffron', 'tundra'];

const json = (body, status = 200) => new Response(JSON.stringify(body), {status, headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store'}});
const random = (n) => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(n)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const hex = async (data) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', data))].map((b) => b.toString(16).padStart(2, '0')).join('');

/** A code to type: a word and two digits, read off the terminal. It proves no secret (the link is the secret): it makes the person look at their own terminal. */
function makeCode() {
  const [w, n] = crypto.getRandomValues(new Uint32Array(2));
  return `${WORDS.at(w % WORDS.length).toUpperCase()}-${String(n % 100).padStart(2, '0')}`;
}
const sameCode = (a, b) => String(a ?? '').trim().toUpperCase().replace(/\s+/g, '-') === b;

/** `a` against `b`, two semantic versions: negative, zero or positive (tools/check.mjs compareVersions, which the Worker cannot import). */
export function compareVersions(a, b) {
  const parse = (v) => { const [core, pre] = String(v).split('+')[0].split(/-(.*)/s); return {core: core.split('.').map(Number), pre: pre?.split('.') ?? []}; };
  const x = parse(a), y = parse(b);
  for (let i = 0; i < 3; i++) if (x.core[i] !== y.core[i]) return x.core[i] - y.core[i];
  if (!x.pre.length || !y.pre.length) return y.pre.length - x.pre.length;
  for (let i = 0; i < Math.max(x.pre.length, y.pre.length); i++) {
    const p = x.pre[i], q = y.pre[i];
    if (p === undefined) return -1;
    if (q === undefined) return 1;
    if (p === q) continue;
    const pn = /^\d+$/.test(p), qn = /^\d+$/.test(q);
    if (pn && qn) return Number(p) - Number(q);
    if (pn !== qn) return pn ? -1 : 1;
    return p < q ? -1 : 1;
  }
  return 0;
}

/** Whether `login` is this person's: by the account id it is recorded with, else by the login itself. */
const isMe = (login, me, accounts) => {
  const l = String(login ?? '').toLowerCase();
  return accounts.has(l) ? accounts.get(l) === me.id : l === me.login.toLowerCase();
};

/**
 * Whether this person may submit this motion, and why not: a new one under their own scope, among its authors; a
 * published one only by one of its published authors, at a higher version.
 */
export function eligibility(me, manifest, published, accounts) {
  if (published) {
    if (!(published.authors ?? []).some((a) => isMe(a?.github, me, accounts))) return {may: false, why: `${manifest.scope ? `@${manifest.scope}/${manifest.slug}` : manifest.slug} is published by ${(published.authors ?? []).map((a) => `@${a.github}`).join(', ')}; only one of them may change it. To build on it, make your own under @${me.login.toLowerCase()} and name it in basedOn.`};
    if (compareVersions(manifest.version, published.version) <= 0) return {may: false, why: `${published.version} is published already: raise version in motion.json above it, then share again.`};
    return {may: true};
  }
  if (!isMe(manifest.scope, me, accounts)) return {may: false, why: `The scope @${manifest.scope} is another GitHub account's. Publish yours as @${me.login.toLowerCase()}/${manifest.slug}.`};
  if (!(manifest.authors ?? []).some((a) => isMe(a?.github, me, accounts))) return {may: false, why: `Add yourself (${me.login}) to authors in motion.json.`};
  return {may: true};
}

/** The motion.json of the published version of `id`, or null. */
async function publishedManifest(request, env, id) {
  const r = await env.ASSETS.fetch(new Request(new URL(`/m/${id.replace('@', '%40')}/motion.json`, request.url))).catch(() => undefined);
  return r?.ok ? r.json().catch(() => null) : null;
}

/** The recorded accounts, login → id (api/accounts.json, written by tools/build.mjs). */
async function recorded(request, env) {
  const r = await env.ASSETS.fetch(new Request(new URL('/api/accounts.json', request.url))).catch(() => undefined);
  const body = r?.ok ? await r.json().catch(() => ({})) : {};
  return new Map(Object.entries(body).map(([l, id]) => [l.toLowerCase(), id]));
}

/** A package's files and its motion.json, or an error to show: the files sit under one motion's id, which motion.json names. */
async function readPackage(bytes) {
  const entries = await untgz(bytes);
  const root = /^(@[^/]+\/[^/]+)\//.exec(entries[0].path)?.[1];
  if (!root || !ID.test(root)) throw new PackageError('the files are not under @<scope>/<slug>/: pack the motion with npx @motionhub/cli share');
  if (!entries.every((e) => e.path.startsWith(`${root}/`))) throw new PackageError(`every file is under ${root}/`);
  const files = entries.map((e) => ({path: e.path.slice(root.length + 1), data: e.data}));
  const raw = files.find((f) => f.path === 'motion.json');
  if (!raw) throw new PackageError('the motion has no motion.json');
  let manifest;
  try { manifest = JSON.parse(new TextDecoder().decode(raw.data)); } catch { throw new PackageError('motion.json is not JSON'); }
  if (typeof manifest?.scope !== 'string' || `@${manifest.scope}/${manifest.slug}` !== root) throw new PackageError(`motion.json names @${manifest?.scope}/${manifest?.slug}, but its files are under ${root}/`);
  if (typeof manifest.version !== 'string' || !/^\d+\.\d+\.\d+/.test(manifest.version)) throw new PackageError('motion.json has no version');
  if (!files.some((f) => f.path === 'MOTION.md')) throw new PackageError('the motion has no MOTION.md');
  return {id: root, manifest, files};
}

const ready = (env) => env.SUBMISSIONS !== 'off' && env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY && env.DB && env.PACKAGES;

async function upload(request, env, now) {
  if (!ready(env)) return json({error: 'sharing from motionhub.dev is not open yet: open the pull request yourself with npx @motionhub/cli share <dir> --pr'}, 503);
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (env.SUBMIT_LIMIT && !(await env.SUBMIT_LIMIT.limit({key: ip})).success) return json({error: 'too many shares from here: try again in a minute'}, 429);
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > 1024 * 1024) return json({error: 'a motion is at most 1 MB, its poster included'}, 413);
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length > 1024 * 1024) return json({error: 'a motion is at most 1 MB, its poster included'}, 413);
  let pkg;
  try { pkg = await readPackage(bytes); } catch (e) {
    if (e instanceof PackageError) return json({error: e.message}, 422);
    throw e;
  }
  const id = random(16), poll = random(32), code = makeCode(), at = Math.floor(now / 1000);
  const digest = await hex(bytes);
  await env.PACKAGES.put(`submissions/${id}.tgz`, bytes, {httpMetadata: {contentType: 'application/gzip'}});
  await env.DB.prepare('INSERT INTO submissions (id, poll_hash, code, motion, version, sha256, bytes, status, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, await sha256(poll), code, pkg.id, pkg.manifest.version, digest, bytes.length, 'uploaded', at, at + DAY).run();
  return json({id, url: `${new URL(request.url).origin}/share/${id}`, code, poll, motion: pkg.id, version: pkg.manifest.version, expires: new Date((at + DAY) * 1000).toISOString()}, 201);
}

const row = (env, id) => env.DB.prepare('SELECT * FROM submissions WHERE id = ?').bind(id).first();
const prUrl = (r) => (r.pr ? `https://github.com/motionhub-dev/motions/pull/${r.pr}` : null);

async function loadPackage(env, r) {
  const obj = await env.PACKAGES.get(`submissions/${r.id}.tgz`);
  if (!obj) return null;
  return readPackage(new Uint8Array(await obj.arrayBuffer()));
}

/** Kept but past its day, and never submitted: as good as gone. */
const expired = (r, now) => r.status !== 'submitted' && r.expires_at <= Math.floor(now / 1000);

async function state(request, env, id, poll, now) {
  const r = await row(env, id);
  if (!r || !poll || r.poll_hash !== (await sha256(poll))) return json({error: 'no such share'}, 404);
  return json({status: expired(r, now) ? 'expired' : r.status, motion: r.motion, version: r.version, pr: r.pr, prUrl: prUrl(r)});
}

async function preview(request, env, id, now) {
  const me = await person(request, env, now);
  if (!me) return json({error: 'sign in with GitHub to see this share'}, 401);
  const r = await row(env, id);
  if (!r || expired(r, now)) return json({error: 'this share link has expired or does not exist: share the motion again'}, 404);
  const pkg = r.status === 'submitted' ? null : await loadPackage(env, r);
  if (r.status !== 'submitted' && !pkg) return json({error: 'this share link has expired: share the motion again'}, 404);
  const published = pkg ? await publishedManifest(request, env, r.motion) : null;
  const verdict = pkg ? eligibility(me, pkg.manifest, published, await recorded(request, env)) : {may: false, why: 'This share is submitted already.'};
  // the first person who may submit it and opens it: their page lists it as waiting
  if (verdict.may && r.status === 'uploaded') await env.DB.prepare("UPDATE submissions SET status = 'viewed', person = ? WHERE id = ? AND status = 'uploaded'").bind(me.id, id).run();
  const doc = pkg?.files.find((f) => f.path === 'MOTION.md');
  return json({
    id, status: r.status, motion: r.motion, version: r.version, sha256: r.sha256, bytes: r.bytes,
    created: new Date(r.created_at * 1000).toISOString(), expires: new Date(r.expires_at * 1000).toISOString(),
    name: pkg?.manifest.name ?? null, line: pkg?.manifest.line ?? null, authors: pkg?.manifest.authors ?? [],
    published: published ? published.version : null,
    files: pkg ? pkg.files.map((f) => ({path: f.path, bytes: f.data.length})) : [],
    motionMd: doc ? new TextDecoder().decode(doc.data.subarray(0, 64 * 1024)) : '',
    me: {login: me.login}, ...verdict,
    pr: r.person === me.id ? r.pr : null, prUrl: r.person === me.id ? prUrl(r) : null,
  });
}

const IMAGES = {jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif'};

async function file(request, env, id, path, now) {
  const me = await person(request, env, now);
  if (!me) return json({error: 'sign in with GitHub'}, 401);
  const r = await row(env, id);
  if (!r || expired(r, now)) return json({error: 'no such share'}, 404);
  const pkg = await loadPackage(env, r);
  const f = pkg?.files.find((x) => x.path === path);
  if (!f) return json({error: 'no such file'}, 404);
  // a raster picture shows as one; anything else (SVG and HTML included) is plain text, in a sandbox, never run
  const type = IMAGES[path.split('.').pop().toLowerCase()] ?? 'text/plain; charset=utf-8';
  return new Response(f.data, {headers: {'content-type': type, 'content-security-policy': "sandbox; default-src 'none'", 'x-content-type-options': 'nosniff', 'cache-control': 'private, max-age=300'}});
}

async function submit(request, env, id, now) {
  if (!sameOrigin(request)) return json({error: 'a share is submitted from motionhub.dev'}, 403);
  if (!ready(env)) return json({error: 'sharing from motionhub.dev is not open yet'}, 503);
  const me = await person(request, env, now);
  if (!me) return json({error: 'sign in with GitHub'}, 401);
  const r = await row(env, id);
  if (!r || expired(r, now)) return json({error: 'this share link has expired: share the motion again'}, 404);
  if (r.status === 'submitted') return json({error: 'this share is submitted already', pr: r.pr, prUrl: prUrl(r)}, 409);
  if (r.attempts >= ATTEMPTS) return json({error: 'too many wrong codes: share the motion again for a new link'}, 429);
  const body = await request.json().catch(() => ({}));
  if (!sameCode(body.code, r.code)) {
    await env.DB.prepare('UPDATE submissions SET attempts = attempts + 1 WHERE id = ?').bind(id).run();
    return json({error: 'that is not the code your terminal shows for this share'}, 400);
  }
  if (body.mine !== true || body.dco !== true) return json({error: 'confirm that you started this share and certify the DCO'}, 400);
  const at = Math.floor(now / 1000);
  const today = await env.DB.prepare('SELECT COUNT(*) AS n FROM submissions WHERE person = ? AND dco_at > ?').bind(me.id, at - DAY).first();
  if ((today?.n ?? 0) >= PER_DAY) return json({error: `at most ${PER_DAY} shares a day: try again tomorrow`}, 429);
  const pkg = await loadPackage(env, r);
  if (!pkg) return json({error: 'this share link has expired: share the motion again'}, 404);
  const published = await publishedManifest(request, env, r.motion);
  const accounts = await recorded(request, env);
  const verdict = eligibility(me, pkg.manifest, published, accounts);
  if (!verdict.may) return json({error: verdict.why}, 403);
  // claimed before GitHub is asked, so two submits of one link never make two commits
  const claim = await env.DB.prepare("UPDATE submissions SET status = 'submitting', person = ?, dco_at = ? WHERE id = ? AND status IN ('uploaded', 'viewed')").bind(me.id, at, id).run();
  if (!(claim?.meta?.changes ?? claim?.changes)) return json({error: 'this share is being submitted already'}, 409);
  try {
    const done = await commitSubmission(env, {id: r.motion, manifest: pkg.manifest, published: Boolean(published), files: pkg.files, me, accounts, submission: id, sha256: r.sha256});
    await env.DB.prepare("UPDATE submissions SET status = 'submitted', pr = ?, branch = ? WHERE id = ?").bind(done.pr, done.branch, id).run();
    return json({pr: done.pr, prUrl: done.url, added: done.added});
  } catch (e) {
    await env.DB.prepare("UPDATE submissions SET status = 'viewed', dco_at = NULL WHERE id = ?").bind(id).run();
    return json({error: `GitHub could not take it just now (${e.message}); try again in a minute`}, 502);
  }
}

/** Handles the routes this file owns, or returns null. */
export async function submissions(request, env, now = Date.now()) {
  const {pathname, searchParams} = new URL(request.url);
  const m = request.method;
  if (pathname === '/api/submissions') return m === 'POST' ? upload(request, env, now) : json({error: 'method not allowed'}, 405);
  const one = /^\/api\/submissions\/([A-Za-z0-9_-]{22})(?:\/(submit|files\/(.+)))?$/.exec(pathname);
  if (!one) return pathname.startsWith('/api/submissions/') ? json({error: 'no such share'}, 404) : null;
  const [, id, action, path] = one;
  if (!action && m === 'GET') return searchParams.has('poll') ? state(request, env, id, searchParams.get('poll'), now) : preview(request, env, id, now);
  if (action === 'submit' && m === 'POST') return submit(request, env, id, now);
  if (path && m === 'GET') return file(request, env, id, path, now);
  return json({error: 'method not allowed'}, 405);
}
