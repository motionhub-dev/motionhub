import {cliPerson} from './cli-auth.mjs';
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
//   POST /api/me/pulls/<n>/withdraw         signed in, from this site: closes a pull request the app opened for them
//   GET  /api/me/shares                     signed in: the shares they opened, waiting and submitted, for their page
//
// Once a day (worker.mjs, scheduled) sweep() lets go of what is past its day: the packages, the shares never
// submitted, and the branches of the app's pull requests that are closed.

import {person, sameOrigin, sha256} from './people.mjs';
import {LIMITS, PackageError, untgz} from './tar.mjs';
import {BINARIES, closedPulls, commitSubmission, isText, pullState, sweepBranches, withdrawPull} from './github-app.mjs';

const DAY = 86400;
/** Seconds after which a submit that never finished (the Worker stopped mid-way) may be tried again. */
const STUCK = 300;
/** The authors a motion names at most (each may cost the app a call to GitHub). */
const AUTHORS = 20;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
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
const sameCode = (a, b) => Boolean(b) && String(a ?? '').trim().toUpperCase().replace(/\s+/g, '-') === b;

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
  if (typeof manifest.version !== 'string' || !SEMVER.test(manifest.version)) throw new PackageError('motion.json has no version, or not a semantic one');
  if (Array.isArray(manifest.authors) && manifest.authors.length > AUTHORS) throw new PackageError(`a motion names at most ${AUTHORS} authors`);
  // each file that is not text goes to GitHub on its own call, and a Worker makes only so many
  if (files.filter((f) => !isText(f.data)).length > BINARIES) throw new PackageError(`a motion shared this way holds at most ${BINARIES} files that are not text (pictures, fonts, sounds): open its pull request with --pr`);
  if (!files.some((f) => f.path === 'MOTION.md')) throw new PackageError('the motion has no MOTION.md');
  return {id: root, manifest, files};
}

const ready = (env) => env.SUBMISSIONS !== 'off' && env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY && env.DB && env.PACKAGES;

/** A request's body, read no further than `most` bytes (with or without a content-length): its bytes, or null past it. */
async function body(request, most) {
  if (Number(request.headers.get('content-length') ?? 0) > most) return null;
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const {done, value} = await reader.read();
    if (done) break;
    total += value.length;
    if (total > most) { await reader.cancel().catch(() => {}); return null; }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.length; }
  return out;
}

async function upload(request, env, now) {
  if (!ready(env)) return json({error: 'sharing from motionhub.dev is not open yet: open the pull request yourself with npx @motionhub/cli share <dir> --pr'}, 503);
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (env.SUBMIT_LIMIT && !(await env.SUBMIT_LIMIT.limit({key: ip})).success) return json({error: 'too many shares from here: try again in a minute'}, 429);
  const bytes = await body(request, 1024 * 1024);
  if (!bytes) return json({error: 'a motion is at most 1 MB, its poster included'}, 413);
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

const changes = (result) => result?.meta?.changes ?? result?.changes ?? 0;
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
  // a submitted share's package may be gone already (the daily sweep): the page then shows what the record keeps
  const pkg = await loadPackage(env, r).catch(() => null);
  if (r.status !== 'submitted' && !pkg) return json({error: 'this share link has expired: share the motion again'}, 404);
  const published = pkg ? await publishedManifest(request, env, r.motion) : null;
  const verdict = r.status === 'submitted' ? {may: false, why: 'This share is submitted already.'}
    : r.status === 'withdrawn' ? {may: false, why: 'Its pull request was withdrawn. To submit the motion, share it again from your terminal.'}
    : eligibility(me, pkg.manifest, published, await recorded(request, env));
  // the first person who may submit it and opens it: their page lists it as waiting
  if (verdict.may && r.status === 'uploaded') await env.DB.prepare("UPDATE submissions SET status = 'viewed', person = ? WHERE id = ? AND status = 'uploaded'").bind(me.id, id).run();
  const doc = pkg?.files.find((f) => f.path === 'MOTION.md');
  // a submitted share's page says where its pull request stands: published once its version (or a later one) is on
  // the site, else as GitHub says (merged, closed, open)
  const mine = r.person === me.id && r.status === 'submitted' && r.pr;
  let outcome = null;
  if (mine) {
    const live = (await onSite(request, env)).get(r.motion)?.version;
    outcome = live && compareVersions(live, r.version) >= 0 ? 'published' : ready(env) ? await pullState(env, r.pr) : null;
  }
  return json({
    id, status: r.status, motion: r.motion, version: r.version, sha256: r.sha256, bytes: r.bytes,
    created: new Date(r.created_at * 1000).toISOString(), expires: new Date(r.expires_at * 1000).toISOString(),
    name: pkg?.manifest.name ?? null, line: pkg?.manifest.line ?? null, authors: pkg?.manifest.authors ?? [],
    published: published ? published.version : null,
    files: pkg ? pkg.files.map((f) => ({path: f.path, bytes: f.data.length})) : [],
    changes: pkg && r.status !== 'submitted' ? await changesFrom(env, pkg, published) : null,
    motionMd: doc ? new TextDecoder().decode(doc.data.subarray(0, 64 * 1024)) : '',
    me: {login: me.login}, ...verdict,
    pr: mine ? r.pr : null, prUrl: mine ? prUrl(r) : null, outcome,
  });
}

/** JSON with every object's keys in order, so a member whose keys only moved is the same. */
const canonical = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : x));
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * What a share changes from the version published now ({base, files, members}): each file changed, added, removed
 * or the same, and the members of motion.json that differ. Null for a new motion, or when the published package
 * cannot be read (the page then lists the files alone).
 */
export async function changesFrom(env, pkg, published) {
  if (!published?.version) return null;
  const object = await env.PACKAGES.get(`m/${pkg.id}/${published.version}.tgz`).catch(() => null);
  // a published package is at most what a share may be: anything bigger is not read
  if (!object || object.size > LIMITS.packed) return null;
  let entries;
  try { entries = await untgz(new Uint8Array(await object.arrayBuffer())); } catch { return null; }
  const was = new Map(entries.filter((e) => e.path.startsWith(`${pkg.id}/`)).map((e) => [e.path.slice(pkg.id.length + 1), e.data]));
  const files = pkg.files.map((f) => ({path: f.path, bytes: f.data.length, change: !was.has(f.path) ? 'added' : same(f.data, was.get(f.path)) ? 'same' : 'changed'}));
  for (const [path, data] of was) if (!pkg.files.some((f) => f.path === path)) files.push({path, bytes: data.length, change: 'removed'});
  let members = [];
  try {
    const before = JSON.parse(new TextDecoder().decode(was.get('motion.json')));
    members = [...new Set([...Object.keys(before), ...Object.keys(pkg.manifest)])].filter((k) => canonical(before[k]) !== canonical(pkg.manifest[k])).sort();
  } catch {}
  return {base: published.version, files, members};
}

/** The motions on the site, by id: {version, name, poster} (api/motions.json, written by tools/build.mjs). */
async function onSite(request, env) {
  const r = await env.ASSETS.fetch(new Request(new URL('/api/motions.json', request.url))).catch(() => undefined);
  const body = r?.ok ? await r.json().catch(() => ({})) : {};
  return new Map((body.motions ?? []).map((m) => [m.slug, {version: m.version, name: m.name, poster: m.poster}]));
}

/**
 * GET /api/me/shares: the shares this person opened, newest first. Waiting ones (opened, not submitted, the link still
 * good) and submitted ones, each with its pull request, whether it was withdrawn, and its `state`: published (its
 * version is on the site, or it was merged and a later one is), merged (merged, its version not live yet: the deploy
 * is on its way), closed (closed without merging), or null when it is neither on the site nor recently closed, which
 * leaves open for the page to tell from /api/me/pulls.
 */
/** Each submitted share with where it stands; GitHub is asked once, and only when a share is not settled on the site. */
async function submittedStates(env, rows, site, about) {
  const live = (r) => site.get(r.motion)?.version;
  // its own version on the site settles it; anything else may be merged and on its way, or closed without merging
  const unsettled = rows.some((r) => r.status === 'submitted' && r.pr && live(r) !== r.version);
  const merged = unsettled && ready(env) ? await closedPulls(env).catch(() => null) : null;
  return rows.map((r) => {
    const now = live(r), later = Boolean(now) && compareVersions(now, r.version) >= 0;
    let state = null;
    if (r.status === 'submitted') {
      if (now === r.version) state = 'published';
      else if (merged?.has(r.pr)) state = merged.get(r.pr) ? (later ? 'published' : 'merged') : 'closed';
      // not among the recently closed: open, or closed long ago (then a later version on the site is all there is to go on)
      else if (later) state = 'published';
    }
    return {...about(r), status: r.status, pr: r.pr, prUrl: prUrl(r), at: new Date((r.dco_at ?? r.created_at) * 1000).toISOString(), state};
  });
}

async function myShares(request, env, now) {
  const me = await person(request, env, now);
  if (!me) return json({error: 'sign in to see your shares'}, 401);
  if (!env.DB) return json({waiting: [], submitted: []});
  // one being submitted right now (or stopped while it was) waits with the rest: its page says where it stands
  const {results} = await env.DB.prepare("SELECT id, motion, version, status, pr, created_at, dco_at, expires_at FROM submissions WHERE person = ? AND status IN ('viewed', 'submitting', 'submitted', 'withdrawn') ORDER BY created_at DESC LIMIT 100").bind(me.id).all();
  const site = await onSite(request, env);
  const at = Math.floor(now / 1000);
  const about = (r) => ({id: r.id, motion: r.motion, version: r.version, name: site.get(r.motion)?.name ?? null, poster: site.get(r.motion)?.poster ?? null});
  return json({
    waiting: results.filter((r) => (r.status === 'viewed' || r.status === 'submitting') && r.expires_at > at).map((r) => ({...about(r), url: `/share/${r.id}`, created: new Date(r.created_at * 1000).toISOString(), expires: new Date(r.expires_at * 1000).toISOString()})),
    submitted: await submittedStates(env, results.filter((r) => r.status === 'submitted' || r.status === 'withdrawn'), site, about),
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
  const terminal = request.headers.has('authorization');
  if (!terminal && !sameOrigin(request)) return json({error: 'a share is submitted from motionhub.dev'}, 403);
  if (!ready(env)) return json({error: 'sharing from motionhub.dev is not open yet'}, 503);
  const me = await (terminal ? cliPerson(request, env) : person(request, env, now));
  if (!me) return json({error: 'sign in with GitHub'}, 401);
  if (terminal && !me.motion_submit) return json({error: 'Motion submission permission required'}, 403);
  const r = await row(env, id);
  const sent = (await request.json().catch(() => null)) ?? {};
  if (terminal && (!r || typeof sent.poll !== 'string' || await sha256(sent.poll) !== r.poll_hash ||
    sent.sha256 !== r.sha256 || sent.dcoVersion !== '1.1')) return json({error: 'Invalid terminal confirmation'}, 403);
  if (!r || expired(r, now)) return json({error: 'this share link has expired: share the motion again'}, 404);
  if (terminal && r.status === 'submitted' && r.person === me.id) return json({pr: r.pr, prUrl: prUrl(r)});
  if (r.status === 'submitted') return json({error: 'this share is submitted already', pr: r.pr, prUrl: prUrl(r)}, 409);
  if (r.status === 'withdrawn') return json({error: 'its pull request was withdrawn: share the motion again to submit it'}, 409);
  if (sent.mine !== true || sent.dco !== true) return json({error: 'confirm that you started this share and certify the DCO'}, 400);
  // a try is counted before the code is compared, in one step, so many tries at once never get past the limit; a
  // right code gives its try back
  if (!terminal) {
    const tried = await env.DB.prepare('UPDATE submissions SET attempts = attempts + 1 WHERE id = ? AND attempts < ?').bind(id, ATTEMPTS).run();
    if (!changes(tried)) return json({error: 'too many wrong codes: share the motion again for a new link'}, 429);
    if (!sameCode(sent.code, r.code)) return json({error: 'that is not the code your terminal shows for this share'}, 400);
    await env.DB.prepare('UPDATE submissions SET attempts = attempts - 1 WHERE id = ?').bind(id).run();
  }
  const at = Math.floor(now / 1000);
  const today = await env.DB.prepare('SELECT COUNT(*) AS n FROM submissions WHERE person = ? AND dco_at > ?').bind(me.id, at - DAY).first();
  if ((today?.n ?? 0) >= PER_DAY) return json({error: `at most ${PER_DAY} shares a day: try again tomorrow`}, 429);
  const pkg = await loadPackage(env, r);
  if (!pkg) return json({error: 'this share link has expired: share the motion again'}, 404);
  const published = await publishedManifest(request, env, r.motion);
  const accounts = await recorded(request, env);
  const verdict = eligibility(me, pkg.manifest, published, accounts);
  if (!verdict.may) return json({error: verdict.why}, 403);
  // claimed before GitHub is asked, in one step with the day's count, so two submits at once never make two commits
  // nor pass the limit; a claim whose Worker stopped before it finished is taken again after a while
  const claim = await env.DB.prepare(`UPDATE submissions SET status = 'submitting', person = ?1, dco_at = ?2, dco_version = '1.1' WHERE id = ?3
    AND (status IN ('uploaded', 'viewed') OR (status = 'submitting' AND dco_at < ?2 - ${STUCK}))
    AND (SELECT COUNT(*) FROM submissions WHERE person = ?1 AND dco_at > ?2 - ${DAY} AND id != ?3) < ${PER_DAY}`).bind(me.id, at, id).run();
  if (!changes(claim)) {
    const now = await row(env, id);
    if (now?.status === 'submitting') return json({error: 'this share is being submitted already'}, 409);
    if (now?.status === 'withdrawn') return json({error: 'its pull request was withdrawn: share the motion again to submit it'}, 409);
    return json({error: `at most ${PER_DAY} shares a day: try again tomorrow`}, 429);
  }
  let done;
  try {
    done = await commitSubmission(env, {id: r.motion, manifest: pkg.manifest, published: Boolean(published), files: pkg.files, me, accounts, submission: id, sha256: r.sha256});
  } catch (e) {
    await env.DB.prepare("UPDATE submissions SET status = 'viewed', dco_at = NULL WHERE id = ?").bind(id).run();
    return json({error: `GitHub could not take it just now (${e.message}); try again in a minute`}, 502);
  }
  // the pull request is open: from here nothing undoes the claim, so a retry never commits it twice
  await env.DB.prepare("UPDATE submissions SET status = 'submitted', pr = ?, branch = ? WHERE id = ?").bind(done.pr, done.branch, id).run();
  return json({pr: done.pr, prUrl: done.url, added: done.added});
}

/** The pull requests the app opened for this person, by number: motionhub's own record of them. */
export async function sharedPulls(env, me) {
  if (!env.DB) return new Set();
  const {results} = await env.DB.prepare("SELECT DISTINCT pr FROM submissions WHERE person = ? AND status = 'submitted' AND pr IS NOT NULL").bind(me.id).all();
  return new Set(results.map((r) => r.pr));
}

async function withdraw(request, env, number, now) {
  if (!sameOrigin(request)) return json({error: 'a pull request is withdrawn from motionhub.dev'}, 403);
  if (!ready(env)) return json({error: 'motionhub cannot do that just now: close it on GitHub'}, 503);
  const me = await person(request, env, now);
  if (!me) return json({error: 'sign in with GitHub'}, 401);
  // motionhub's own record first: GitHub is asked only about a pull request it opened for this person
  const mine = await env.DB.prepare("SELECT 1 FROM submissions WHERE pr = ? AND person = ? AND status = 'submitted' LIMIT 1").bind(number, me.id).first();
  if (!mine) return json({error: 'motionhub opened no such pull request for you'}, 404);
  if (env.SUBMIT_LIMIT && !(await env.SUBMIT_LIMIT.limit({key: `withdraw:${me.id}`})).success) return json({error: 'too many at once: try again in a minute'}, 429);
  let done;
  try { done = await withdrawPull(env, number, me); } catch (e) { return json({error: `GitHub could not take it just now (${e.message}); try again, or close it on GitHub`}, 502); }
  if (done.error) return json({error: done.error}, done.status);
  await env.DB.prepare("UPDATE submissions SET status = 'withdrawn' WHERE pr = ? AND person = ?").bind(number, me.id).run();
  // the page's list of pull requests is kept a minute (pulls.mjs): this one is gone from it now
  await globalThis.caches?.default?.delete(new Request(new URL(`/api/me/pulls?person=${me.id}`, request.url))).catch(() => {});
  return json({closed: number});
}

/** What is past its day, let go: packages kept over a day, shares never submitted, closed pull requests' branches. */
export async function sweep(env, now = Date.now()) {
  if (!env.DB || !env.PACKAGES) return {};
  const at = Math.floor(now / 1000);
  // each part on its own: one that fails leaves the others to do theirs, and tomorrow's sweep tries it again
  let packages = 0, shares = 0, branches = [];
  try {
    let cursor;
    do {
      const page = await env.PACKAGES.list({prefix: 'submissions/', cursor});
      const old = page.objects.filter((o) => new Date(o.uploaded).getTime() < now - DAY * 1000).map((o) => o.key);
      if (old.length) { await env.PACKAGES.delete(old); packages += old.length; }
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
  } catch {}
  try {
    // a share someone certified the DCO for stays (submitted, withdrawn, or stopped while GitHub was asked), as the
    // record of who certified what; its code goes
    shares = changes(await env.DB.prepare("DELETE FROM submissions WHERE status NOT IN ('submitted', 'withdrawn') AND dco_at IS NULL AND expires_at < ?").bind(at).run());
    await env.DB.prepare("UPDATE submissions SET code = '' WHERE expires_at < ? AND code != ''").bind(at).run();
  } catch {}
  if (ready(env)) branches = await sweepBranches(env).catch(() => []);
  return {packages, shares, branches};
}

/** Handles the routes this file owns, or returns null. */
export async function submissions(request, env, now = Date.now()) {
  const {pathname, searchParams} = new URL(request.url);
  const m = request.method;
  const out = /^\/api\/me\/pulls\/([1-9]\d{0,8})\/withdraw$/.exec(pathname);
  if (out) return m === 'POST' ? withdraw(request, env, Number(out[1]), now) : json({error: 'method not allowed'}, 405);
  if (pathname === '/api/me/shares') return m === 'GET' ? myShares(request, env, now) : json({error: 'method not allowed'}, 405);
  if (pathname === '/api/submissions') return m === 'POST' ? upload(request, env, now) : json({error: 'method not allowed'}, 405);
  const one = /^\/api\/submissions\/([A-Za-z0-9_-]{22})(?:\/(submit|files\/(.+)))?$/.exec(pathname);
  if (!one) return pathname.startsWith('/api/submissions/') ? json({error: 'no such share'}, 404) : null;
  const [, id, action, path] = one;
  if (!action && m === 'GET') return searchParams.has('poll') ? state(request, env, id, searchParams.get('poll'), now) : preview(request, env, id, now);
  if (action === 'submit' && m === 'POST') return submit(request, env, id, now);
  if (path && m === 'GET') return file(request, env, id, path, now);
  return json({error: 'method not allowed'}, 405);
}
