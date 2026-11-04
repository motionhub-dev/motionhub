// motionhub's GitHub App, acting on the catalogue's repository: it commits a submitted motion to a branch of its own
// and opens (or adds to) the pull request, for the person who submitted it (site/submissions.mjs). It is installed on
// that one repository, with contents and pull requests to write and nothing else; the ruleset keeps it off main.
//
// GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY are secrets on the Worker. The key may be the PKCS#1 PEM GitHub gives
// ("BEGIN RSA PRIVATE KEY") or PKCS#8. No dependencies: WebCrypto signs the app's JWT.

import {REPO} from './repo.mjs';

const API = 'https://api.github.com';
const [OWNER] = REPO.split('/');

const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const utf8 = (s) => new TextEncoder().encode(s);

/** DER bytes of a PEM private key, as PKCS#8: a PKCS#1 RSA key is wrapped in the PrivateKeyInfo WebCrypto reads. */
export function pkcs8(pem) {
  const body = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  if (!/BEGIN RSA PRIVATE KEY/.test(pem)) return der;
  // SEQUENCE { INTEGER 0, SEQUENCE { rsaEncryption OID, NULL }, OCTET STRING { the PKCS#1 key } }
  const len = (n) => (n < 128 ? [n] : n < 256 ? [0x81, n] : n < 65536 ? [0x82, n >> 8, n & 255] : [0x83, n >> 16, (n >> 8) & 255, n & 255]);
  const algorithm = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
  const octets = [0x04, ...len(der.length), ...der];
  const inner = [0x02, 0x01, 0x00, ...algorithm, ...octets];
  return new Uint8Array([0x30, ...len(inner.length), ...inner]);
}

/** The app's JWT: RS256, issued a minute in the past for clock drift, good for nine minutes (GitHub allows ten). */
export async function appJwt(env, now = Date.now()) {
  const key = await crypto.subtle.importKey('pkcs8', pkcs8(env.GITHUB_APP_PRIVATE_KEY), {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}, false, ['sign']);
  const at = Math.floor(now / 1000);
  const head = b64url(utf8(JSON.stringify({alg: 'RS256', typ: 'JWT'})));
  const claims = b64url(utf8(JSON.stringify({iat: at - 60, exp: at + 540, iss: String(env.GITHUB_APP_ID)})));
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, utf8(`${head}.${claims}`));
  return `${head}.${claims}.${b64url(signature)}`;
}

let cached = {token: '', until: 0, app: ''};

/** An installation token for the catalogue's repository, kept until ten minutes before it expires. */
async function installationToken(env, now = Date.now()) {
  if (cached.token && cached.until > now) return cached.token;
  const jwt = await appJwt(env, now);
  const headers = {authorization: `Bearer ${jwt}`, accept: 'application/vnd.github+json', 'user-agent': 'motionhub.dev', 'x-github-api-version': '2022-11-28'};
  const inst = await fetch(`${API}/repos/${REPO}/installation`, {headers});
  if (!inst.ok) throw new Error(`the GitHub App is not installed on ${REPO} (${inst.status})`);
  const {id, app_slug: slug} = await inst.json();
  const res = await fetch(`${API}/app/installations/${id}/access_tokens`, {method: 'POST', headers, body: JSON.stringify({repositories: [REPO.split('/')[1]], permissions: {contents: 'write', pull_requests: 'write'}})});
  if (!res.ok) throw new Error(`GitHub gave no installation token (${res.status})`);
  const body = await res.json();
  cached = {token: body.token, until: Date.parse(body.expires_at) - 10 * 60 * 1000, app: slug ? `${slug}[bot]` : ''};
  return body.token;
}

/** Forgets the cached token: for tests, and after a 401. */
export const forgetToken = () => { cached = {token: '', until: 0, app: ''}; };

/** A call to GitHub's REST API as the app's installation: the JSON answer, or null for a 404 when `missing` is allowed. */
async function api(env, method, path, body, {missing = false} = {}) {
  const token = await installationToken(env);
  const res = await fetch(`${API}${path}`, {method, headers: {authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'user-agent': 'motionhub.dev', 'x-github-api-version': '2022-11-28', ...(body ? {'content-type': 'application/json'} : {})}, body: body ? JSON.stringify(body) : undefined});
  if (missing && res.status === 404) return null;
  if (res.status === 401) forgetToken();
  if (!res.ok) throw new Error(`GitHub answered ${res.status} to ${method} ${path.split('?')[0]}`);
  return res.status === 204 ? null : res.json();
}

/** Files a submission may hold that are not text: each is a call to GitHub of its own, and a Worker makes only so many. */
export const BINARIES = 40;

/** Whether bytes read as UTF-8 text with no NUL: such a file goes into the tree as text, anything else as a blob. */
export function isText(data) {
  if (data.includes(0)) return false;
  try { new TextDecoder('utf-8', {fatal: true}).decode(data); return true; } catch { return false; }
}
const base64 = (data) => { let s = ''; for (let i = 0; i < data.length; i += 0x8000) s += String.fromCharCode(...data.subarray(i, i + 0x8000)); return btoa(s); };

/** Text from a motion or a profile on one line, for a title, a commit or a trailer: no line breaks or other controls. */
export const oneLine = (s, most = 120) => String(s ?? '').replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, ' ').trim().slice(0, most);

/** Text from a motion for a pull request's body, shown as it is: no mention, link, picture or other markdown of its own. */
export const plain = (s) => oneLine(s, 300).replace(/[\\`*_{}[\]()<>#+!|~]/g, '\\$&').replace(/@/g, '@\u200b');

/** The only paths a submission may write: its own motion's directory, and new account records. */
export function allowed(path, id) {
  const inMotion = path.startsWith(`motions/${id}/`) && !path.split('/').some((s) => s === '' || s === '.' || s === '..');
  return inMotion || /^accounts\/[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}\.json$/.test(path);
}

/** A login's GitHub account id, as GitHub gives it now, or undefined. */
async function accountId(env, login) {
  const user = await api(env, 'GET', `/users/${encodeURIComponent(login)}`, undefined, {missing: true});
  return Number.isSafeInteger(user?.id) && ['User', 'Organization'].includes(user?.type) ? user.id : undefined;
}

/**
 * Commits a submission and opens its pull request, or adds to the one already open for the same person and motion.
 * `files` are [{path, data}] relative to the motion's directory; `me` is {id, login, name}; `accounts` the recorded
 * ones (login → id); `published` whether a version is published already. Returns {pr, url, branch, added}.
 */
export async function commitSubmission(env, {id, manifest, published, files, me, accounts, submission, sha256}) {
  const branch = `share/${id.slice(1)}/${me.id}`;
  const ref = `heads/${branch}`;
  const main = await api(env, 'GET', '/repos/' + REPO + '/git/ref/heads/main');
  // a branch name is made of the motion's id and an account id: letters, digits, hyphens and slashes only
  const existing = await api(env, 'GET', `/repos/${REPO}/git/ref/${ref}`, undefined, {missing: true});
  const open = existing ? (await api(env, 'GET', `/repos/${REPO}/pulls?state=open&head=${encodeURIComponent(`${OWNER}:${branch}`)}`))[0] : undefined;
  // on an open pull request the new commit goes on top, so its history shows each round; else it starts from main
  const parent = open ? existing.object.sha : main.object.sha;
  const baseTree = (await api(env, 'GET', `/repos/${REPO}/git/commits/${parent}`)).tree.sha;
  const tree = await api(env, 'GET', `/repos/${REPO}/git/trees/${baseTree}?recursive=1`);
  if (tree.truncated) throw new Error('the repository tree is too large to read whole');
  const have = new Set(tree.tree.filter((e) => e.type === 'blob').map((e) => e.path));

  const entries = [];
  const now = new Set(files.map((f) => `motions/${id}/${f.path}`));
  // the motion is the files submitted: what the previous version had and this one has not goes
  for (const path of have) if (path.startsWith(`motions/${id}/`) && !now.has(path)) entries.push({path, mode: '100644', type: 'blob', sha: null});
  for (const f of files) {
    const path = `motions/${id}/${f.path}`;
    if (isText(f.data)) entries.push({path, mode: '100644', type: 'blob', content: new TextDecoder().decode(f.data)});
    else entries.push({path, mode: '100644', type: 'blob', sha: (await api(env, 'POST', `/repos/${REPO}/git/blobs`, {content: base64(f.data), encoding: 'base64'})).sha});
  }
  // every login the motion names, recorded once with its account's id (accounts/, CONTRIBUTING.md)
  const logins = new Set([manifest.scope, ...(manifest.authors ?? []).map((a) => a?.github)].filter((l) => typeof l === 'string').map((l) => l.toLowerCase()));
  for (const login of logins) {
    const path = `accounts/${login}.json`;
    if (accounts.has(login) || have.has(path)) continue;
    const found = login === me.login.toLowerCase() ? me.id : await accountId(env, login);
    if (!found) throw new Error(`GitHub has no account ${login}: check the scope and authors in motion.json`);
    entries.push({path, mode: '100644', type: 'blob', content: `${JSON.stringify({login, id: found})}\n`});
  }
  for (const e of entries) if (!allowed(e.path, id)) throw new Error(`a submission may not write ${e.path}`);

  const newTree = await api(env, 'POST', `/repos/${REPO}/git/trees`, {base_tree: baseTree, tree: entries});
  const name = oneLine(me.name, 80) || me.login;
  const email = `${me.id}+${me.login}@users.noreply.github.com`;
  const added = !open;
  const what = `${published ? 'Update' : 'Add'} ${oneLine(manifest.name?.en) || id} ${oneLine(manifest.version, 40)}`;
  const message = `${what}\n\nSubmitted through motionhub.dev (package SHA-256 ${sha256}).\n\nSigned-off-by: ${name} <${email}>\nMotionhub-Submitted-By: ${me.id} ${me.login}\nMotionhub-Submission: ${submission}\n`;
  const commit = await api(env, 'POST', `/repos/${REPO}/git/commits`, {message, tree: newTree.sha, parents: [parent], author: {name, email, date: new Date().toISOString()}});
  if (existing) await api(env, 'PATCH', `/repos/${REPO}/git/refs/${ref}`, {sha: commit.sha, force: !open});
  else await api(env, 'POST', `/repos/${REPO}/git/refs`, {ref: `refs/${ref}`, sha: commit.sha});

  const body = [manifest.line?.en ? `> ${plain(manifest.line.en)}` : '', '', `Submitted by @${me.login} through motionhub.dev. They certified the [Developer Certificate of Origin](https://developercertificate.org) for this package (SHA-256 \`${sha256}\`).`, '', `To change it, @${me.login} shares it again: the new version is added to this pull request.`].join('\n');
  if (open) {
    if (open.title !== what) await api(env, 'PATCH', `/repos/${REPO}/pulls/${open.number}`, {title: what});
    await api(env, 'POST', `/repos/${REPO}/issues/${open.number}/comments`, {body: `@${me.login} shared it again: ${oneLine(manifest.version, 40)}, package SHA-256 \`${sha256}\`.`});
    return {pr: open.number, url: open.html_url, branch, added};
  }
  const pr = await api(env, 'POST', `/repos/${REPO}/pulls`, {title: what, head: branch, base: 'main', body});
  // a label helps the maintainers find it; the pull request is open without one
  await api(env, 'POST', `/repos/${REPO}/issues/${pr.number}/labels`, {labels: ['submission']}).catch(() => {});
  return {pr: pr.number, url: pr.html_url, branch, added};
}

/**
 * Whether a pull request is one the app opened for the person `me` (an account id, and login): its branch is the
 * app's for them (share/<scope>/<slug>/<id>, in this repository) and the app opened it. `app` is the app's account
 * (<slug>[bot]); without it, any app's.
 */
export function sharedFor(pr, id, app = '') {
  const ref = pr?.head?.ref;
  return pr?.user?.type === 'Bot' && (!app || pr.user.login === app) && pr.head?.repo?.full_name === REPO && pr.base?.repo?.full_name === REPO &&
    typeof ref === 'string' && new RegExp(`^share/[a-z0-9-]+/[a-z0-9-]+/${Number(id)}$`).test(ref);
}

/** Closes the pull request `number` the app opened for `me`, and deletes its branch: {closed, branch} or {error, status}. */
export async function withdrawPull(env, number, me) {
  const pr = await api(env, 'GET', `/repos/${REPO}/pulls/${number}`, undefined, {missing: true});
  if (!pr || !sharedFor(pr, me.id, cached.app)) return {error: 'motionhub opened no such pull request for you', status: 404};
  if (pr.state !== 'open') return {error: 'that pull request is closed already', status: 409};
  await api(env, 'POST', `/repos/${REPO}/issues/${number}/comments`, {body: `@${me.login} withdrew it on motionhub.dev.`});
  await api(env, 'PATCH', `/repos/${REPO}/pulls/${number}`, {state: 'closed'});
  // the branch only held it; gone already, or refused, it is the daily sweep's to try again
  await api(env, 'DELETE', `/repos/${REPO}/git/refs/heads/${pr.head.ref}`, undefined, {missing: true}).catch(() => {});
  return {closed: number, branch: pr.head.ref};
}

/** At most this many branches are deleted in one sweep: each is a call to GitHub. */
const SWEEP = 20;

/**
 * Deletes the branches of the app's pull requests that are closed (merged, closed by a maintainer, withdrawn), unless
 * one is open on the same branch again. Returns the branches deleted.
 */
export async function sweepBranches(env) {
  const refs = await api(env, 'GET', `/repos/${REPO}/git/matching-refs/heads/share/`);
  const have = new Set(refs.map((r) => r.ref.replace(/^refs\/heads\//, '')));
  if (!have.size) return [];
  const pulls = async (state) => api(env, 'GET', `/repos/${REPO}/pulls?state=${state}&sort=updated&direction=desc&per_page=100`);
  const open = new Set((await pulls('open')).map((pr) => pr.head?.ref));
  const gone = [];
  for (const pr of await pulls('closed')) {
    const ref = pr.head?.ref;
    if (gone.length >= SWEEP) break;
    if (!have.has(ref) || open.has(ref) || gone.includes(ref) || pr.user?.type !== 'Bot' || pr.head?.repo?.full_name !== REPO || !/^share\//.test(ref)) continue;
    await api(env, 'DELETE', `/repos/${REPO}/git/refs/heads/${ref}`, undefined, {missing: true});
    gone.push(ref);
  }
  return gone;
}
