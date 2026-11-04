#!/usr/bin/env node
// The motions whose video is not made yet: every motion with a reel, at the version in its motion.json, whose
// /m/<id>/<version>.mp4 the site does not have (HUB.md, "Reels"). .github/workflows/render.yml renders these, and only
// these: a version's video is made once and never replaced.
//
//   node player/missing.mjs [base]   prints the ids as a JSON array; base is https://motionhub.dev
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

/** The ids whose video `base` does not have; anything but a 404 other than a 200 is an error, never taken for "missing" */
export async function missing(base, rows = reelVersions(), fetcher = fetch) {
  const out = [];
  for (const [id, version] of rows) {
    const res = await fetcher(`${base}/m/${id}/${version}.mp4`, {method: 'HEAD'});
    if (res.status === 404) out.push(id);
    else if (res.status !== 200) throw new Error(`${id} ${version}: the site answers ${res.status}`);
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  console.log(JSON.stringify(await missing(process.argv[2] ?? 'https://motionhub.dev')));
}
