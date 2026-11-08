// motionhub's GitHub App, acting on the catalogue's repository: it commits a submitted motion to a branch of its own
// and opens (or adds to) the pull request, for the person who submitted it (site/submissions.mjs). It is installed on
// that one repository, with contents and pull requests to write and nothing else; the ruleset keeps it off main.
//
// GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY are secrets on the Worker. The key may be the PKCS#1 PEM GitHub gives
// ("BEGIN RSA PRIVATE KEY") or PKCS#8. No dependencies: WebCrypto signs the app's JWT.

import {REPO} from './repo.mjs';
import {accountId as recordedId, ownerId, singleAuthor} from '../tools/security/ownership.mjs';

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

/**
 * An installation token for the catalogue's repository, kept until ten minutes before it expires, with the app's own
 * account (<slug>[bot]) it acts as: {token, app}. Each caller keeps its own copy, so a token forgotten meanwhile by
 * another request never leaves it without the app.
 */
async function installation(env, now = Date.now()) {
  if (cached.token && cached.until > now) return {token: cached.token, app: cached.app};
  const jwt = await appJwt(env, now);
  const headers = {authorization: `Bearer ${jwt}`, accept: 'application/vnd.github+json', 'user-agent': 'motionhub.dev', 'x-github-api-version': '2022-11-28'};
  const inst = await fetch(`${API}/repos/${REPO}/installation`, {headers, redirect: 'error', signal: AbortSignal.timeout(30000)});
  if (!inst.ok) throw new Error(`the GitHub App is not installed on ${REPO} (${inst.status})`);
  const {id, app_slug: slug} = await inst.json();
  const res = await fetch(`${API}/app/installations/${id}/access_tokens`, {method: 'POST', headers, redirect: 'error', signal: AbortSignal.timeout(30000), body: JSON.stringify({repositories: [REPO.split('/')[1]], permissions: {contents: 'write', pull_requests: 'write'}})});
  if (!res.ok) throw new Error(`GitHub gave no installation token (${res.status})`);
  const body = await res.json();
  cached = {token: body.token, until: Date.parse(body.expires_at) - 10 * 60 * 1000, app: slug ? `${slug}[bot]` : ''};
  return {token: cached.token, app: cached.app};
}

/** The app's own account, which its pull requests are opened by: <slug>[bot]. Without it nothing is judged the app's. */
async function appLogin(env) {
  const {app} = await installation(env);
  if (!app) throw new Error('GitHub did not say which app this is');
  return app;
}

/** Forgets the cached token: for tests, and after a 401. */
export const forgetToken = () => { cached = {token: '', until: 0, app: ''}; };

/** A call to GitHub's REST API as the app's installation: the JSON answer, or null for a 404 when `missing` is allowed. */
async function api(env, method, path, body, {missing = false} = {}) {
  const {token} = await installation(env);
  const res = await fetch(`${API}${path}`, {method, redirect: 'error', signal: AbortSignal.timeout(30000), headers: {authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'user-agent': 'motionhub.dev', 'x-github-api-version': '2022-11-28', ...(body ? {'content-type': 'application/json'} : {})}, body: body ? JSON.stringify(body) : undefined});
  if (missing && res.status === 404) return null;
  if (res.status === 401) forgetToken();
  if (!res.ok) throw new Error(`GitHub answered ${res.status} to ${method} ${path.split('?')[0]}`);
  return res.status === 204 ? null : res.json();
}

/** Conservative shared-package binary limit, kept consistent with the CLI (hub.share). */
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

/** A JSON file from one immutable GitHub revision. Only an explicit 404 is absence. */
async function jsonAt(env, path, sha) {
  const file = await api(env, 'GET', `/repos/${REPO}/contents/${path}?ref=${sha}`, undefined, {missing: true});
  if (!file) return null;
  if (file.type !== 'file' || file.encoding !== 'base64') throw new Error('GitHub returned no regular JSON file');
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g, '')), (c) => c.charCodeAt(0))));
}

/** The current main revision and the identities it records, supplemented only by verified new GitHub logins. */
export async function submissionBase(env, id, manifest) {
  if (!singleAuthor(manifest)) throw new Error('a motion has exactly one author');
  const main = await api(env, 'GET', `/repos/${REPO}/git/ref/heads/main`);
  const sha = main.object.sha;
  const published = await jsonAt(env, `motions/${id}/motion.json`, sha);
  if (published && !singleAuthor(published)) throw new Error('the published author needs a maintainer to resolve ownership');
  const accounts = new Map();
  const logins = new Set([manifest.scope, manifest.authors[0].github, ...(published?.authors ?? []).map((a) => a.github)].map((l) => l.toLowerCase()));
  for (const login of logins) {
    if (!/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/.test(login)) throw new Error('invalid GitHub login');
    const record = await jsonAt(env, `accounts/${login}.json`, sha);
    if (record) {
      if (record.login !== login || !Number.isSafeInteger(record.id) || record.id <= 0) throw new Error('invalid recorded account');
      accounts.set(login, record.id);
    } else {
      const user = await api(env, 'GET', `/users/${encodeURIComponent(login)}`);
      if (!Number.isSafeInteger(user?.id) || user.id <= 0 || user.type !== 'User') throw new Error('the author must be a GitHub user account');
      accounts.set(login, user.id);
    }
  }
  const owner = ownerId(published ?? manifest, accounts);
  if (!owner || ownerId(manifest, accounts) !== owner || (!published && recordedId(manifest.scope, accounts) !== owner)) throw new Error('the author account cannot change and must own a new scope');
  return {sha, published, accounts, owner};
}

/** Commit verification from GitHub's API, not the forgeable author/committer text inside a git object. */
function trustedCommit(commit, app) {
  return commit?.committer?.login === app && commit.commit?.verification?.verified === true && commit.commit.verification.reason === 'valid';
}

/**
 * A unique branch for a first submission; subsequent shares use the owner's open PR recorded in D1.
 * The expected head makes concurrent writes fail rather than replace someone else's changes. A retry reuses its commit.
 */
export async function commitSubmission(env, {id, manifest, published, files, me, accounts, submission, sha256, baseSha, initialBaseSha, previousPull}) {
  const {app, token} = await installation(env);
  if (!app) throw new Error('GitHub did not identify the submission app');
  let open = previousPull ? await api(env, 'GET', `/repos/${REPO}/pulls/${previousPull}`, undefined, {missing: true}) : null;
  if (open && (!sharedFor(open, me.id, app) || !open.head.ref.startsWith(`share/${id.slice(1)}/`))) throw new Error('the previous pull request is not this owner and motion');
  if (open?.state !== 'open') open = null;
  const branch = open?.head.ref ?? `share/${id.slice(1)}/${me.id}/${submission}`;
  const ref = `heads/${branch}`;
  let existing = await api(env, 'GET', `/repos/${REPO}/git/ref/${ref}`, undefined, {missing: true});
  if (!existing) {
    await api(env, 'POST', `/repos/${REPO}/git/refs`, {ref: `refs/${ref}`, sha: baseSha});
    existing = {object: {sha: baseSha}};
  }
  const parent = existing.object.sha;
  const head = (parent === baseSha || (!open && parent === initialBaseSha)) ? null : await api(env, 'GET', `/repos/${REPO}/commits/${parent}`);
  if (head && !trustedCommit(head, app)) throw new Error('the submission branch contains an unverified app commit; close it and share again');
  const marker = `Motionhub-Submission: ${submission}`;
  const repeated = head?.commit.message.split('\n').includes(marker);
  const name = oneLine(me.name, 80) || me.login;
  const email = `${me.id}+${me.login}@users.noreply.github.com`;
  const what = `${published ? 'Update' : 'Add'} ${oneLine(manifest.name?.en) || id} ${oneLine(manifest.version, 40)}`;
  const message = `Submitted through motionhub.dev (package SHA-256 ${sha256}).\n\nSigned-off-by: ${name} <${email}>\nMotionhub-Submitted-By: ${me.id} ${me.login}\n${marker}\n`;
  let commitSha = parent;
  if (repeated) {
    if (!head.commit.message.includes(`package SHA-256 ${sha256}`)) throw new Error('a submission id was reused for different bytes');
  } else {
    const baseTree = (await api(env, 'GET', `/repos/${REPO}/git/commits/${parent}`)).tree.sha;
    const tree = await api(env, 'GET', `/repos/${REPO}/git/trees/${baseTree}?recursive=1`);
    if (tree.truncated) throw new Error('the repository tree is too large to read whole');
    const have = new Set(tree.tree.filter((e) => e.type === 'blob').map((e) => e.path));
    const additions = files.map((f) => ({path: `motions/${id}/${f.path}`, contents: base64(f.data)}));
    const now = new Set(additions.map((f) => f.path));
    const deletions = [...have].filter((p) => p.startsWith(`motions/${id}/`) && !now.has(p)).map((path) => ({path}));
    for (const login of new Set([manifest.scope, manifest.authors[0].github].map((l) => l.toLowerCase()))) {
      const path = `accounts/${login}.json`;
      if (have.has(path)) continue;
      const id = recordedId(login, accounts);
      if (!id) throw new Error('the author login was not verified');
      additions.push({path, contents: base64(utf8(`${JSON.stringify({login, id})}\n`))});
    }
    for (const f of [...additions, ...deletions]) if (!allowed(f.path, id)) throw new Error('a submission attempted to write outside its motion');
    const result = await fetch(`${API}/graphql`, {method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000), headers: {authorization: `Bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'motionhub.dev'}, body: JSON.stringify({
      query: 'mutation($input: CreateCommitOnBranchInput!) { createCommitOnBranch(input: $input) { commit { oid } } }',
      variables: {input: {branch: {repositoryNameWithOwner: REPO, branchName: branch}, expectedHeadOid: parent, message: {headline: what, body: message}, fileChanges: {additions, deletions}}},
    })});
    const body = await result.json();
    commitSha = body.data?.createCommitOnBranch?.commit?.oid;
    if (!result.ok || body.errors?.length || !commitSha) throw new Error('GitHub did not accept the expected branch head; retry to reconcile');
    const committed = await api(env, 'GET', `/repos/${REPO}/commits/${commitSha}`);
    if (!trustedCommit(committed, app)) throw new Error('GitHub did not verify the app commit');
  }
  if (!open) open = (await api(env, 'GET', `/repos/${REPO}/pulls?state=open&head=${encodeURIComponent(`${OWNER}:${branch}`)}`))[0];
  const added = !open;
  if (!open) {
    const body = [manifest.line?.en ? `> ${plain(manifest.line.en)}` : '', '', `Submitted by @${me.login} through motionhub.dev. They certified the [Developer Certificate of Origin](https://developercertificate.org) for package SHA-256 \`${sha256}\`.`, '', 'To update it, its author shares it again.'].join('\n');
    open = await api(env, 'POST', `/repos/${REPO}/pulls`, {title: what, head: branch, base: 'main', body});
    await api(env, 'POST', `/repos/${REPO}/issues/${open.number}/labels`, {labels: ['submission']}).catch(() => {});
  } else if (open.title !== what) await api(env, 'PATCH', `/repos/${REPO}/pulls/${open.number}`, {title: what});
  return {pr: open.number, url: open.html_url, branch, added, commitSha};
}

/** A branch the app keeps for one person: share/<scope>/<slug>/<their account id>. */
const SHARE_BRANCH = /^share\/[a-z0-9-]+\/[a-z0-9-]+\/([1-9]\d*)(?:\/[A-Za-z0-9_-]{22})?$/;

/**
 * Whether a pull request is one the app (its account `app`, <slug>[bot]) opened for the person with the account id
 * `id`: opened by the app, in this repository, from the app's branch for them. Without `id`, for anyone.
 */
export function sharedFor(pr, id, app) {
  const branch = SHARE_BRANCH.exec(pr?.head?.ref ?? '');
  return Boolean(app) && pr?.user?.type === 'Bot' && pr.user.login === app && pr.head?.repo?.full_name === REPO && pr.base?.repo?.full_name === REPO &&
    Boolean(branch) && (id === undefined || branch[1] === String(Number(id)));
}

/** Closes the pull request `number` the app opened for `me`, and deletes its branch: {closed, branch} or {error, status}. */
export async function withdrawPull(env, number, me) {
  const app = await appLogin(env);
  const pr = await api(env, 'GET', `/repos/${REPO}/pulls/${number}`, undefined, {missing: true});
  if (!pr || !sharedFor(pr, me.id, app)) return {error: 'motionhub opened no such pull request for you', status: 404};
  if (pr.state !== 'open') return {error: 'that pull request is closed already', status: 409};
  await api(env, 'PATCH', `/repos/${REPO}/pulls/${number}`, {state: 'closed'});
  await api(env, 'POST', `/repos/${REPO}/issues/${number}/comments`, {body: `@${me.login} withdrew it on motionhub.dev.`}).catch(() => {});
  // the branch only held it; gone already, or refused, it is the daily sweep's to try again
  await api(env, 'DELETE', `/repos/${REPO}/git/refs/heads/${pr.head.ref}`, undefined, {missing: true}).catch(() => {});
  return {closed: number, branch: pr.head.ref};
}

/** At most this many branches are deleted in one sweep: each is a call to GitHub. */
const SWEEP = 20;

/**
 * Deletes the branches of the app's pull requests that are closed (merged, closed by a maintainer, withdrawn), each
 * only while it still points at the closed pull request's last commit: a branch a new share has moved on (its pull
 * request opening, or reopened) stays. Returns the branches deleted.
 */
export async function sweepBranches(env) {
  const app = await appLogin(env);
  const refs = await api(env, 'GET', `/repos/${REPO}/git/matching-refs/heads/share/`);
  const at = new Map(refs.map((r) => [r.ref.replace(/^refs\/heads\//, ''), r.object?.sha]));
  if (!at.size) return [];
  const gone = [];
  for (const pr of await api(env, 'GET', `/repos/${REPO}/pulls?state=closed&sort=updated&direction=desc&per_page=100`)) {
    if (gone.length >= SWEEP) break;
    const ref = pr.head?.ref;
    if (!sharedFor(pr, undefined, app) || !pr.head?.sha || at.get(ref) !== pr.head.sha) continue;
    await api(env, 'DELETE', `/repos/${REPO}/git/refs/heads/${ref}`, undefined, {missing: true});
    at.delete(ref);
    gone.push(ref);
  }
  return gone;
}

/** Where pull request `n` stands on GitHub: 'open', 'merged' or 'closed' (closed without merging), or null. */
export async function pullState(env, n) {
  const pr = await api(env, 'GET', `/repos/${REPO}/pulls/${n}`, undefined, {missing: true}).catch(() => null);
  if (!pr) return null;
  return pr.merged_at ? 'merged' : pr.state === 'open' ? 'open' : 'closed';
}

let closed = {until: 0, merged: new Map()};

/**
 * The app's repository's recently closed pull requests (the last hundred updated), by number: whether each was merged.
 * One call, kept a minute in this isolate: a person's page asks it only for shares that are not settled on the site.
 */
export async function closedPulls(env, now = Date.now()) {
  if (closed.until > now) return closed.merged;
  const list = await api(env, 'GET', `/repos/${REPO}/pulls?state=closed&sort=updated&direction=desc&per_page=100`);
  closed = {until: now + 60 * 1000, merged: new Map(list.map((pr) => [pr.number, Boolean(pr.merged_at)]))};
  return closed.merged;
}

/** Forgets the closed pull requests kept: for tests. */
export const forgetClosed = () => { closed = {until: 0, merged: new Map()}; };
