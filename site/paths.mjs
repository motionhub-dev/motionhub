// Where the site's build reads and writes, for the scripts that run in Node (astro.config.mjs, prebuild.mjs, thumbs.mjs,
// merge.mjs). The site is built over the public catalogue repository: its motions/, accounts/, catalogs.json, brand/,
// documents, tools/ and player/. That is the repository site/ is in (..) unless MOTIONHUB_UPSTREAM names a checkout of it
// elsewhere. What the site serves is written to dist/ beside site/, which wrangler.jsonc deploys.
//
// The pages cannot import this module: Astro bundles them, and a path taken from import.meta.url would then be the
// bundle's. astro.config.mjs passes UPSTREAM and the build directory to them as MOTIONHUB_UPSTREAM and MOTIONHUB_DIST.
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

/** site/ itself */
export const SITE = resolve(fileURLToPath(import.meta.url), '..');
/** The public catalogue repository the site is built over */
export const UPSTREAM = resolve(process.env.MOTIONHUB_UPSTREAM ?? join(SITE, '..'));
/** What the site serves: the hub's files (tools/build.mjs), the reels' players (player/build.mjs) and the pages */
export const DIST = join(SITE, '..', 'dist');
/** In development, the hub's files are Astro's public directory, a copy of their own so that a build leaves a running server alone */
export const DEV_PUBLIC = join(SITE, '.cache/dev-public');
