// motionhub.dev's pages. `npm run build` writes the served files into ../dist with tools/build.mjs, builds these pages
// over them into ./dist, and merge.mjs adds the pages to ../dist, which the Worker serves (wrangler.jsonc).
import {defineConfig} from 'astro/config';

export default defineConfig({
  site: 'https://motionhub.dev',
  outDir: './dist',
  // in development the served files are the public directory; in a build they are already in ../dist
  publicDir: process.env.MOTIONHUB_DEV ? '../dist' : './public',
  trailingSlash: 'always',
  build: {format: 'directory', assets: '_astro', inlineStylesheets: 'never'},
  devToolbar: {enabled: false},
  vite: {server: {fs: {allow: ['..']}}},
});
