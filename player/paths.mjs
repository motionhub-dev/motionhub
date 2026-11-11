// Where the player's scripts read and write: this repository's motions and runtime, beside player/, and the built hub they
// add /play/ to, dist/ at the repository's root. MOTIONHUB_DIST names another build directory, for a site built over this
// repository from elsewhere; a relative one is taken from the directory the script is run in.
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

/** player/ itself: its own dependencies (React, three.js, esbuild, Chrome's driver) are in player/node_modules */
export const HERE = resolve(fileURLToPath(import.meta.url), '..');
/** The repository's root: motions/, packages/runtime/, tools/ */
export const ROOT = resolve(HERE, '..');
/** The hub's build, which tools/build.mjs writes and the players are added to under play/ */
export const DIST = resolve(process.env.MOTIONHUB_DIST ?? join(ROOT, 'dist'));
/** Kept between runs and never deployed: fonts/ (faces fetched once) and render/ (videos made by render.mjs) */
export const CACHE = join(HERE, '.cache');
