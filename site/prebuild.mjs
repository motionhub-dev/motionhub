#!/usr/bin/env node
// Before astro build (npm run build) or astro dev (npm run dev): the hub's served files, written by the public catalogue
// repository's own build over its motions (paths.mjs, UPSTREAM), the posters' thumbnails, and for a build the reels'
// players, which need player/'s dependencies (npm ci in player/).
//
//   node prebuild.mjs         into ../dist: tools/build.mjs, thumbs.mjs, player/build.mjs
//   node prebuild.mjs --dev   into .cache/dev-public: tools/build.mjs, thumbs.mjs
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {DEV_PUBLIC, DIST, SITE, UPSTREAM} from './paths.mjs';

const dev = process.argv.includes('--dev');
const out = dev ? DEV_PUBLIC : DIST;
const run = (file, args = [], env = {}) => execFileSync(process.execPath, [file, ...args], {stdio: 'inherit', env: {...process.env, ...env}});

try {
  run(join(UPSTREAM, 'tools/build.mjs'), [out]);
  run(join(SITE, 'thumbs.mjs'), [out]);
  if (!dev) run(join(UPSTREAM, 'player/build.mjs'), [], {MOTIONHUB_DIST: out});
} catch {
  // the step that failed has said why
  process.exitCode = 1;
}
