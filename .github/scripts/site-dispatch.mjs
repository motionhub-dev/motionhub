// Tell motionhub-dev/motionhub-web that this repository's main moved. A GitHub App installed only
// on that repository, with Actions write and nothing else, mints a token that asks for Actions
// write again. The token is used only to dispatch .github/workflows/upstream.yml on main, with no
// inputs: the site looks up main itself and pins a commit only after it has built, tested and
// played over it. This repository holds no production credential. Nothing here prints the key,
// the JWT or the token.
//
//   SITE_APP_ID=... SITE_APP_PRIVATE_KEY=... node .github/scripts/site-dispatch.mjs
import {createPrivateKey, createSign} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const API = 'https://api.github.com';
export const SITE = 'motionhub-dev/motionhub-web';
export const WORKFLOW = 'upstream.yml';

const b64url = (bytes) => Buffer.from(bytes).toString('base64url');

/** The app's JWT: RS256, issued a minute in the past for clock drift, good for nine minutes (GitHub allows ten). */
export function appJwt(id, pem, now = Date.now()) {
  const key = createPrivateKey(pem);
  const at = Math.floor(now / 1000);
  const head = b64url(JSON.stringify({alg: 'RS256', typ: 'JWT'}));
  const claims = b64url(JSON.stringify({iat: at - 60, exp: at + 540, iss: String(id)}));
  const data = `${head}.${claims}`;
  const signature = createSign('RSA-SHA256').update(data).sign(key);
  return `${data}.${b64url(signature)}`;
}

/** What the installation token is asked for: Actions write on the site repository, and nothing else. */
export const tokenBody = () => ({repositories: ['motionhub-web'], permissions: {actions: 'write'}});

/** workflow_dispatch of upstream.yml on main, with no inputs. The site chooses the commit. */
export const dispatchBody = () => ({ref: 'main'});

/** Actions write, and the metadata read GitHub attaches to every token. Anything else is refused. */
export function actionsWriteOnly(permissions) {
  const entries = Object.entries(permissions ?? {});
  let write = false;
  for (const [key, value] of entries) {
    if (key === 'actions' && value === 'write') write = true;
    else if (key === 'metadata' && value === 'read') continue;
    else return false;
  }
  return write;
}

/** '' when `body` is a token this script may send, otherwise the reason it is not. The token itself is never in the reason. */
export function acceptedToken(body) {
  if (!body || typeof body.token !== 'string' || !body.token) return 'GitHub gave no token';
  if (body.repository_selection && body.repository_selection !== 'selected') return 'GitHub gave a token for every repository';
  const repos = body.repositories ?? [];
  if (repos.length !== 1 || repos[0].full_name !== SITE) return 'GitHub gave a token for some other repository than the site';
  if (!actionsWriteOnly(body.permissions)) return 'GitHub gave a token with permissions other than Actions write';
  return '';
}

const headers = (bearer) => ({
  authorization: `Bearer ${bearer}`,
  accept: 'application/vnd.github+json',
  'user-agent': 'motionhub',
  'x-github-api-version': '2022-11-28',
});

async function call(doFetch, url, init) {
  const res = await doFetch(url, {...init, redirect: 'manual'});
  if (res.status >= 300 && res.status < 400) throw new Error(`GitHub redirected ${init.method ?? 'GET'} ${new URL(url).pathname}`);
  return res;
}

/** Mint the token and dispatch upstream.yml. `doFetch` is fetch, so a test can stand in for GitHub. */
export async function notify(env, doFetch = globalThis.fetch, now = Date.now()) {
  const id = env.SITE_APP_ID ?? '';
  const pem = env.SITE_APP_PRIVATE_KEY ?? '';
  if (!/^[0-9]+$/.test(id) || !String(pem).includes('PRIVATE KEY')) throw new Error('SITE_APP_ID and SITE_APP_PRIVATE_KEY are not set');
  const jwt = appJwt(id, pem, now);
  const app = headers(jwt);
  const inst = await call(doFetch, `${API}/repos/${SITE}/installation`, {headers: app});
  if (!inst.ok) throw new Error(`the GitHub App is not installed on ${SITE} (${inst.status})`);
  const {id: installation} = await inst.json();
  if (!Number.isInteger(installation)) throw new Error('GitHub gave no installation');
  const tokenRes = await call(doFetch, `${API}/app/installations/${installation}/access_tokens`, {
    method: 'POST', headers: {...app, 'content-type': 'application/json'}, body: JSON.stringify(tokenBody()),
  });
  if (!tokenRes.ok) throw new Error(`GitHub gave no installation token (${tokenRes.status})`);
  const tokenJson = await tokenRes.json();
  const refused = acceptedToken(tokenJson);
  if (refused) throw new Error(refused);
  const dispatched = await call(doFetch, `${API}/repos/${SITE}/actions/workflows/${WORKFLOW}/dispatches`, {
    method: 'POST', headers: {...headers(tokenJson.token), 'content-type': 'application/json'}, body: JSON.stringify(dispatchBody()),
  });
  if (dispatched.status !== 204) throw new Error(`the site did not accept the dispatch (${dispatched.status})`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  notify({SITE_APP_ID: process.env.SITE_APP_ID, SITE_APP_PRIVATE_KEY: process.env.SITE_APP_PRIVATE_KEY})
    .then(() => console.log(`dispatched ${WORKFLOW} on ${SITE}`))
    .catch((e) => { console.error(e instanceof Error ? e.message : 'the site was not told'); process.exitCode = 1; });
}
