// motionhub.dev's pages. `npm run build` writes the served files into ../dist (prebuild.mjs), builds these pages over
// them into ./dist, and merge.mjs adds the pages to ../dist, which the Worker serves (wrangler.jsonc).
import {defineConfig} from 'astro/config';
import {DEV_PUBLIC, DIST, SITE, UPSTREAM} from './paths.mjs';

// what the pages are built over (paths.mjs), for src/lib/catalogue.mjs, which runs in this process but in Astro's bundle
process.env.MOTIONHUB_UPSTREAM = UPSTREAM;
process.env.MOTIONHUB_DIST = process.env.MOTIONHUB_DEV ? DEV_PUBLIC : DIST;

export default defineConfig({
  site: 'https://motionhub.dev',
  outDir: './dist',
  // in development the served files are the public directory, a copy of their own so that tools/build.mjs emptying
  // ../dist leaves a running server alone; in a build they are already in ../dist
  publicDir: process.env.MOTIONHUB_DEV ? './.cache/dev-public' : './public',
  trailingSlash: 'always',
  build: {format: 'directory', assets: '_astro', inlineStylesheets: 'never'},
  devToolbar: {enabled: false},
  // @upstream/<path> is a file of the public catalogue repository: its brand's stylesheet, its tools
  vite: {resolve: {alias: {'@upstream': UPSTREAM}}, server: {fs: {allow: [UPSTREAM, SITE, DIST]}}},
});
