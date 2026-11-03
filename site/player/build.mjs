#!/usr/bin/env node
// Builds a player for every motion with a reel (react/reel.tsx) into ../dist/play/<id>/: index.html, reel.js (the reel,
// its components, React and @motionhub/runtime in one file), reel.css (the motion's tokens as custom properties and its
// faces) and fonts/. A motion's page shows it in a sandboxed frame; _headers gives /play/* a policy that loads nothing
// from anywhere else (HUB.md, "Reels").
//
//   node player/build.mjs [id …]   from site/, after tools/build.mjs (npm run build does both); ids build only those
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, copyFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {resolveTokens, tokenVariables} from '../../packages/runtime/tokens.js';

const HERE = resolve(fileURLToPath(import.meta.url), '..');
const ROOT = resolve(HERE, '../..'), SITE = resolve(HERE, '..');
const OUT = join(ROOT, 'dist/play');
// fonts are fetched once per face and kept here between builds
const CACHE = join(SITE, '.cache/fonts');
const RUNTIME = join(ROOT, 'packages/runtime/index.js');

const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|math|emoji|ui-[a-z-]+)$/;
// faces for Chinese, Japanese and Korean are too large for a reel that shows Latin text
const HAN = /^(Noto (Sans|Serif) (SC|TC|JP|KR)|LXGW WenKai)$/;
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

/** The families a motion's font tokens name, generic ones and CJK faces left out */
const familiesOf = (tokens) => [...new Set(Object.values(tokens.font ?? {}).flatMap((s) => String(s).split(',').map((f) => f.trim().replace(/^["']|["']$/g, ''))))]
  .filter((f) => f && !GENERIC.test(f) && !HAN.test(f));

/** Google Fonts' stylesheet for a family: it refuses a weight range a face does not span, so the common ones are tried in turn */
async function googleCss(family) {
  const name = encodeURIComponent(family).replace(/%20/g, '+');
  for (const axes of [':ital,wght@0,100..900;1,100..900', ':wght@100..900', ':wght@200..900', ':wght@100..800', ':wght@200..800', ':wght@300..800', ':wght@300..700', ':wght@400..700', ':wght@400;700', '']) {
    const res = await fetch(`https://fonts.googleapis.com/css2?family=${name}${axes}&display=block`, {headers: {'user-agent': UA}}).catch(() => undefined);
    if (res?.ok) return res.text();
  }
  return undefined;
}

/** @font-face rules for the latin files of `families`, the files copied into `dir/fonts`; a family Google Fonts lacks is named */
async function faces(families, dir) {
  mkdirSync(join(dir, 'fonts'), {recursive: true});
  mkdirSync(CACHE, {recursive: true});
  const css = [], missing = [];
  for (const family of families) {
    const text = await googleCss(family);
    if (!text) { missing.push(family); continue; }
    const blocks = [...text.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)].filter(([, subset]) => subset === 'latin').map(([, , b]) => b);
    for (const block of blocks.length ? blocks : [text]) {
      const url = /url\(([^)]+)\)/.exec(block)?.[1];
      if (!url) continue;
      const file = `${family.replace(/\W+/g, '-')}-${/font-style:\s*(\w+)/.exec(block)?.[1] ?? 'normal'}-${(/font-weight:\s*([\d ]+)/.exec(block)?.[1] ?? '400').trim().replace(/\s+/g, '-')}.woff2`;
      if (!existsSync(join(CACHE, file))) writeFileSync(join(CACHE, file), Buffer.from(await (await fetch(url, {headers: {'user-agent': UA}})).arrayBuffer()));
      copyFileSync(join(CACHE, file), join(dir, 'fonts', file));
      css.push(block.replace(/url\([^)]+\)/, `url('fonts/${file}')`));
    }
  }
  return {css, missing};
}

const page = (name, id, heavy) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${name}: reel</title>
<link rel="stylesheet" href="reel.css">
<style>
html, body { margin: 0; height: 100%; overflow: hidden; background: #000; }
#player { position: fixed; inset: 0; }
.frame { position: absolute; left: 50%; top: 50%; transform-origin: 50% 50%; overflow: hidden; cursor: pointer; }
.bar { position: absolute; left: 0; right: 0; bottom: 0; display: flex; align-items: center; gap: 10px; padding: 18px 14px 10px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.55)); color: #fff; font: 12px/1 system-ui, sans-serif; opacity: 0; transition: opacity 0.2s; }
#player:hover .bar, .bar:focus-within { opacity: 1; }
@media (hover: none) { .bar { opacity: 1; } }
.bar button { display: grid; place-items: center; width: 30px; height: 30px; padding: 0; border: 0; border-radius: 50%; background: rgba(255, 255, 255, 0.16); color: inherit; cursor: pointer; }
.bar input { flex: 1; accent-color: #fff; }
.big { position: absolute; left: 50%; top: 50%; width: 72px; height: 72px; margin: -36px 0 0 -36px; display: grid; place-items: center; padding: 0 0 0 4px; border: 0; border-radius: 50%; background: rgba(0, 0, 0, 0.55); color: #fff; cursor: pointer; }
.time { font-variant-numeric: tabular-nums; opacity: 0.85; }
</style>
</head>
<body>
<div id="player" data-motion="${id}"${heavy ? ' data-heavy="1"' : ''}></div>
<script src="reel.js"></script>
</body>
</html>
`;

async function player(id) {
  const dir = join(ROOT, 'motions', id), out = join(OUT, id);
  const tokens = resolveTokens(JSON.parse(readFileSync(join(dir, 'tokens.json'), 'utf8')));
  const name = JSON.parse(readFileSync(join(dir, 'motion.json'), 'utf8')).name?.en ?? id;
  mkdirSync(out, {recursive: true});
  const {css, missing} = await faces(familiesOf(tokens), out);
  writeFileSync(join(out, 'reel.css'), [...css, ':root {', ...Object.entries(tokenVariables(tokens)).map(([k, v]) => `  ${k}: ${v};`), '}', ''].join('\n'));
  const {metafile} = await build({
    entryPoints: [join(HERE, 'player.jsx')],
    bundle: true, format: 'iife', minify: true, metafile: true, outfile: join(out, 'reel.js'), jsx: 'automatic', target: 'es2020', logLevel: 'error',
    nodePaths: [join(SITE, 'node_modules')],
    define: {'process.env.NODE_ENV': '"production"'},
    alias: {'@motionhub/runtime': RUNTIME},
    plugins: [{name: 'motionhub', setup(b) {
      b.onResolve({filter: /^motionhub:reel$/}, () => ({path: join(dir, 'react/reel.tsx')}));
      b.onResolve({filter: /^motionhub:tokens$/}, () => ({path: 'tokens', namespace: 'motionhub'}));
      b.onLoad({filter: /.*/, namespace: 'motionhub'}, () => ({contents: `export default ${JSON.stringify(tokens)};`, loader: 'js'}));
    }}],
  });
  // a reel that bundles three.js draws in 3D: the player holds it on a weak device until it is tapped
  const heavy = Object.keys(metafile.inputs).some((f) => /node_modules\/three\//.test(f));
  writeFileSync(join(out, 'index.html'), page(name, id, heavy));
  return missing;
}

const wanted = process.argv.slice(2);
const ids = readdirSync(join(ROOT, 'motions'), {withFileTypes: true}).filter((e) => e.isDirectory() && existsSync(join(ROOT, 'motions', e.name, 'react/reel.tsx'))).map((e) => e.name)
  .filter((id) => !wanted.length || wanted.includes(id)).sort();
for (const id of ids) {
  const missing = await player(id);
  console.log(`play/${id}/${missing.length ? `  (no web font for ${missing.join(', ')}: the stack's next face draws it)` : ''}`);
}
console.log(`${ids.length} reel player(s) built into ${OUT}`);
