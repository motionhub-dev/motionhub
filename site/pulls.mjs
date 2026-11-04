// The signed-in person's open pull requests on the catalogue's repository, for their page (/you/): GET /api/me/pulls.
// The Worker (worker.mjs, through people.mjs) routes it here.
//
// Read from GitHub's public REST API, with no token of the person's: motionhub's sign-in asks GitHub for no scope, so
// this shows what anyone could see on github.com, gathered in one place. A pull request is the person's when GitHub's
// numeric id for its author is theirs, so a renamed account still finds its own. Each answer is kept for a minute,
// per person; GITHUB_TOKEN, a secret on the Worker, raises GitHub's rate limit when it is set and is never required.
// A pull request motionhub's GitHub App opened for the person (sharing from motionhub.dev) is theirs too, with the
// shares they opened and have not submitted yet (submissions.mjs), which are motionhub's and never kept.

import {REPO} from './repo.mjs';
import {waiting} from './submissions.mjs';
import {sharedFor} from './github-app.mjs';

export {REPO};
const API = `https://api.github.com/repos/${REPO}`;
const SECONDS = 60;
/** At most this many of a person's pull requests are looked into: each costs three requests to GitHub. */
const MOST = 10;
/** At most this many pages of open pull requests (100 each), and of a pull request's comments, are read. */
const PAGES = 3;
/** The check workflow's job (.github/workflows/check.yml), whose result says whether a pull request can be merged. */
const CHECK = 'check';
/** The account the reviewer agent comments as (claude-review.yml). */
const REVIEWER = 'claude[bot]';

const json = (body, status = 200) => new Response(JSON.stringify(body), {status, headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store'}});

async function github(env, path, {all = false} = {}) {
  const headers = {accept: 'application/vnd.github+json', 'user-agent': 'motionhub.dev', 'x-github-api-version': '2022-11-28', ...(env.GITHUB_TOKEN ? {authorization: `Bearer ${env.GITHUB_TOKEN}`} : {})};
  let url = `${API}${path}`, out = [];
  // with all, every page GitHub links to (rel="next"), up to PAGES of them
  for (let page = 0; page < (all ? PAGES : 1); page++) {
    const res = await fetch(url, {headers});
    if (!res.ok) throw new Error(`GitHub answered ${res.status} for ${path}`);
    const body = await res.json();
    if (!all) return body;
    out = out.concat(body);
    const next = /<([^>]+)>;\s*rel="next"/.exec(res.headers.get('link') ?? '')?.[1];
    if (!next) break;
    url = next;
  }
  return out;
}

/** The motions a pull request's files are in: motions/@<scope>/<slug>/…, as ids. */
export function motionsIn(files) {
  const ids = new Set();
  for (const f of files) {
    const m = /^motions\/((?:@[^/]+\/)?[^/@][^/]*)\//.exec(f.filename ?? '');
    if (m) ids.add(m[1]);
  }
  return [...ids].sort();
}

/** Where a pull request stands, from its check run and the reviewer's comments: what the page shows and what comes next. */
export function standing(pr, run, comments) {
  const checks = !run ? 'none' : run.status !== 'completed' ? 'running' : run.conclusion === 'success' ? 'passed' : 'failed';
  const reviewed = comments.some((c) => c.user?.login === REVIEWER && !/^Claude Code is working/.test(c.body ?? ''));
  const next = pr.draft ? 'draft' : checks === 'failed' ? 'change' : checks === 'running' || checks === 'none' ? 'checks' : 'maintainer';
  return {checks, reviewed, next};
}

async function gather(env, me) {
  const open = await github(env, '/pulls?state=open&per_page=100&sort=updated&direction=desc', {all: true});
  // theirs, and the ones motionhub's GitHub App opened for them when they shared from motionhub.dev (submissions.mjs)
  const mine = open.filter((pr) => pr.user?.id === me.id || sharedFor(pr, me.id)).slice(0, MOST);
  return Promise.all(mine.map(async (pr) => {
    const [runs, files, comments] = await Promise.all([
      github(env, `/commits/${pr.head.sha}/check-runs?check_name=${CHECK}&per_page=1`),
      github(env, `/pulls/${pr.number}/files?per_page=100`),
      github(env, `/issues/${pr.number}/comments?per_page=100`, {all: true}),
    ]);
    return {number: pr.number, title: pr.title, url: pr.html_url, updated: pr.updated_at, motions: motionsIn(files), shared: pr.user?.id !== me.id, ...standing(pr, runs.check_runs?.[0], comments)};
  }));
}

/** GET /api/me/pulls for the person `me` (people.mjs), or 401 when no one is signed in. */
export async function pulls(request, env, ctx, me) {
  if (!me) return json({error: 'sign in to see your pull requests'}, 401);
  const cache = globalThis.caches?.default;
  const key = new Request(new URL(`/api/me/pulls?person=${me.id}`, request.url));
  // the shares waiting for them are motionhub's own, and asked for fresh
  const shares = await waiting(env, me).catch(() => []);
  const hit = await cache?.match(key);
  if (hit) return json({...(await hit.json()), shares});
  try {
    const body = {pulls: await gather(env, me), all: `https://github.com/${REPO}/pulls?q=${encodeURIComponent(`is:pr is:open author:${me.login}`)}`};
    const keep = new Response(JSON.stringify(body), {headers: {'content-type': 'application/json', 'cache-control': `max-age=${SECONDS}`}});
    if (cache) ctx?.waitUntil?.(cache.put(key, keep));
    return json({...body, shares});
  } catch {
    // GitHub could not be asked: the page says so and links to the same list on github.com
    return json({pulls: null, shares, all: `https://github.com/${REPO}/pulls?q=${encodeURIComponent(`is:pr is:open author:${me.login}`)}`}, 502);
  }
}
