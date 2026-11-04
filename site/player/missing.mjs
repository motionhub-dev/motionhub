#!/usr/bin/env node
// The motions whose video is not made yet: every motion with a reel, at the version in its motion.json, whose package the
// site has published and whose /m/<id>/<version>.mp4 it does not have (HUB.md, "Reels"). A version not published (a branch,
// a deploy that refused it) is never rendered, since its video could not be replaced once its package is. .github/workflows/render.yml renders these, and only
// these: a version's video is made once and never replaced.
//
//   node player/missing.mjs [base]             prints the ids as a JSON array; base is https://motionhub.dev
//   node player/missing.mjs --has <url>          exits 0 when the site has the file at url, 1 when not, 2 when it cannot tell
import {existsSync, readFileSync, realpathSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {listMotions} from '../../tools/check.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');

/** Every motion with a reel, as [id, version]; only a scoped motion is served, so only one has a video */
export function reelVersions(root = ROOT) {
  return listMotions(join(root, 'motions')).filter((id) => id.startsWith('@') && existsSync(join(root, 'motions', id, 'react/reel.tsx')))
    .map((id) => [id, JSON.parse(readFileSync(join(root, 'motions', id, 'motion.json'), 'utf8')).version]);
}

/** Whether `base` has `path`: a 200 is yes, a 404 no, anything else an error, never taken for either */
async function has(base, path, fetcher) {
  const res = await fetcher(`${base}${path}`, {method: 'HEAD', signal: AbortSignal.timeout(30_000)});
  if (res.status === 200) return true;
  if (res.status === 404) return false;
  throw new Error(`${path}: the site answers ${res.status}`);
}

/** The ids whose published version `base` has no video of */
export async function missing(base, rows = reelVersions(), fetcher = fetch) {
  const out = [];
  for (const [id, version] of rows) {
    if (await has(base, `/m/${id}/${version}.tgz`, fetcher) && !(await has(base, `/m/${id}/${version}.mp4`, fetcher))) out.push(id);
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  if (process.argv[2] === '--has') {
    const url = new URL(process.argv[3]);
    process.exit(await has(url.origin, url.pathname, fetch).then((yes) => (yes ? 0 : 1), (e) => (console.error(e.message), 2)));
  }
  console.log(JSON.stringify(await missing(process.argv[2] ?? 'https://motionhub.dev')));
}
