#!/usr/bin/env node
// Builds a player for every motion with a reel (react/reel.tsx) into ../dist/play/<id>/: index.html, reel-<hash>.js (the
// reel and its components, and nothing else), reel.css (the motion's tokens as custom properties and its faces) and fonts/.
// What every reel shares is built once into ../dist/play/_shared/: the core (React, @motionhub/runtime and the player) and
// three.js, each named by its content; a reel's page loads the core, three.js if it draws in 3D, then its own script. A motion's page shows it in a sandboxed frame; _headers gives /play/* a policy that loads nothing
// from anywhere else (HUB.md, "Reels").
//
//   node player/build.mjs [id …]   from site/, after tools/build.mjs (npm run build does both); ids build only those
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, copyFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {resolveTokens, tokenVariables} from '../../packages/runtime/tokens.js';
import {listMotions} from '../../tools/check.mjs';

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

/**
 * Google Fonts' stylesheet for a family: it refuses (400) a weight range a face does not span, so the common ones are tried
 * in turn, and undefined when it has none of them. A failure to reach it throws: a reel (and a video, made once) must not
 * quietly draw in a fallback face
 */
async function googleCss(family) {
  const name = encodeURIComponent(family).replace(/%20/g, '+');
  for (const axes of [':ital,wght@0,100..900;1,100..900', ':wght@100..900', ':wght@200..900', ':wght@100..800', ':wght@200..800', ':wght@300..800', ':wght@300..700', ':wght@400..700', ':wght@400;700', '']) {
    const res = await fetch(`https://fonts.googleapis.com/css2?family=${name}${axes}&display=block`, {headers: {'user-agent': UA}});
    if (res.ok) return res.text();
    if (res.status !== 400) throw new Error(`Google Fonts answers ${res.status} for ${family}`);
  }
  return undefined;
}

/** @font-face rules for the latin files of `families`, the files copied into `dir/fonts`; a family Google Fonts lacks is named */
async function faces(families, dir, motion) {
  mkdirSync(join(dir, 'fonts'), {recursive: true});
  mkdirSync(CACHE, {recursive: true});
  const css = [], missing = [];
  // the faces the motion carries itself (react/fonts/fonts.json), before Google Fonts
  const ownDir = join(motion, 'react/fonts'), own = existsSync(join(ownDir, 'fonts.json')) ? JSON.parse(readFileSync(join(ownDir, 'fonts.json'), 'utf8')) : [];
  for (const f of own) {
    copyFileSync(join(ownDir, f.file), join(dir, 'fonts', f.file));
    css.push(`@font-face { font-family: ${JSON.stringify(f.family)}; font-style: ${f.style ?? 'normal'}; font-weight: ${f.weight ?? '400'}; font-display: block; src: url('fonts/${f.file}') format('woff2'); }`);
  }
  for (const family of families.filter((name) => !own.some((f) => f.family === name))) {
    const text = await googleCss(family);
    if (!text) { missing.push(family); continue; }
    const blocks = [...text.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)].filter(([, subset]) => subset === 'latin').map(([, , b]) => b);
    for (const block of blocks.length ? blocks : [text]) {
      const url = /url\(([^)]+)\)/.exec(block)?.[1];
      if (!url) continue;
      const file = `${family.replace(/\W+/g, '-')}-${/font-style:\s*(\w+)/.exec(block)?.[1] ?? 'normal'}-${(/font-weight:\s*([\d ]+)/.exec(block)?.[1] ?? '400').trim().replace(/\s+/g, '-')}.woff2`;
      if (!existsSync(join(CACHE, file))) {
        const res = await fetch(url, {headers: {'user-agent': UA}});
        if (!res.ok) throw new Error(`Google Fonts answers ${res.status} for ${url}`);
        writeFileSync(join(CACHE, file), Buffer.from(await res.arrayBuffer()));
      }
      copyFileSync(join(CACHE, file), join(dir, 'fonts', file));
      css.push(block.replace(/url\([^)]+\)/, `url('fonts/${file}')`));
    }
  }
  return {css, missing};
}

const page = (name, id, version, heavy, scripts) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${name}: reel</title>
<link rel="stylesheet" href="reel.css">
<style>
html, body { margin: 0; height: 100%; overflow: hidden; background: #000; }
#player, .shell { position: fixed; inset: 0; }
.shell.idle { cursor: none; }
.frame { position: absolute; left: 50%; top: 50%; transform-origin: 50% 50%; overflow: hidden; cursor: pointer; }
button { font: inherit; color: inherit; }
button:focus-visible, .scrub:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.bar { position: absolute; left: 0; right: 0; bottom: 0; padding: 36px 14px 8px; display: flex; flex-direction: column; gap: 4px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.62)); color: #fff; font: 500 13px/1 system-ui, -apple-system, 'Segoe UI', sans-serif;
  opacity: 1; transition: opacity 0.25s ease; }
.shell.idle .bar { opacity: 0; pointer-events: none; }
.row { display: flex; align-items: center; gap: 4px; }
.row .gap { flex: 1; }
.row button { display: grid; place-items: center; width: 36px; height: 36px; padding: 0; border: 0; border-radius: 8px; background: transparent; cursor: pointer; }
.row button:hover { background: rgba(255, 255, 255, 0.16); }
.time { margin-left: 6px; font-variant-numeric: tabular-nums; }
.time span { opacity: 0.7; }
.scrub { --p: 0%; width: 100%; height: 16px; margin: 0; background: transparent; cursor: pointer; -webkit-appearance: none; appearance: none; }
.scrub::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: linear-gradient(90deg, #fff var(--p), rgba(255, 255, 255, 0.32) var(--p)); transition: height 0.12s; }
.scrub:hover::-webkit-slider-runnable-track { height: 6px; }
.scrub::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; margin-top: -5px; border: 0; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4); }
.scrub:hover::-webkit-slider-thumb { margin-top: -4px; }
.scrub::-moz-range-track { height: 4px; border-radius: 2px; background: rgba(255, 255, 255, 0.32); }
.scrub::-moz-range-progress { height: 4px; border-radius: 2px; background: #fff; }
.scrub::-moz-range-thumb { width: 14px; height: 14px; border: 0; border-radius: 50%; background: #fff; }
.big { position: absolute; left: 50%; top: 50%; width: 76px; height: 76px; margin: -38px 0 0 -38px; display: grid; place-items: center; padding: 0 0 0 4px;
  border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 50%; background: rgba(0, 0, 0, 0.5); color: #fff; cursor: pointer;
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); transition: transform 0.15s ease, background 0.15s ease; }
.big:hover { transform: scale(1.06); background: rgba(0, 0, 0, 0.65); }
.big svg { width: 34px; height: 34px; }
.chip { position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px 0 10px; border: 0; border-radius: 17px;
  background: rgba(0, 0, 0, 0.6); color: #fff; font: 500 13px/1 system-ui, sans-serif; cursor: pointer; -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
.chip svg { width: 18px; height: 18px; }
</style>
</head>
<body>
<div id="player" data-motion="${id}" data-version="${version}"${heavy ? ' data-heavy="1"' : ''}></div>
${scripts.map((src) => `<script src="${src}"></script>`).join('\n')}
</body>
</html>
`;

/** esbuild's options for a script of the player: React, three.js and the runtime are site/'s, one copy of each */
const common = (plugins) => ({
  bundle: true, format: 'iife', minify: true, write: false, jsx: 'automatic', target: 'es2020', logLevel: 'error', metafile: true,
  nodePaths: [join(SITE, 'node_modules')], define: {'process.env.NODE_ENV': '"production"'}, alias: {'@motionhub/runtime': RUNTIME},
  plugins: [{name: 'site', setup(b) {
    // one React and one three.js, site/'s, whoever imports them: a second copy (packages/runtime's own, once its tests have
    // installed it) would give the reel hooks from a React that is not rendering it
    b.onResolve({filter: /^(react|react-dom|three)(\/.*)?$/}, (args) => (args.pluginData === 'site' ? undefined : b.resolve(args.path, {kind: args.kind, resolveDir: SITE, pluginData: 'site'})));
  }}, ...plugins],
});

/** Writes `bytes` into `dir` as <name>-<hash>.js, named by its content so a browser may keep it for good; returns the file's name */
function hashed(dir, name, bytes) {
  const file = `${name}-${createHash('sha256').update(bytes).digest('hex').slice(0, 12)}.js`;
  mkdirSync(dir, {recursive: true});
  writeFileSync(join(dir, file), bytes);
  return file;
}

/**
 * What every reel's page shares, in /play/_shared/: the core (React, the runtime and the player, player.jsx, offering the
 * interface v1) and three.js for the reels in 3D. Returns their paths
 */
async function shared() {
  const dir = join(OUT, '_shared');
  rmSync(dir, {recursive: true, force: true});
  const core = await build({...common([]), entryPoints: [join(HERE, 'player.jsx')]});
  const three = await build({...common([]), stdin: {contents: "import * as THREE from 'three';\nglobalThis.__motionhubPlayer = {...globalThis.__motionhubPlayer, three: THREE};", resolveDir: SITE, loader: 'js'}});
  return {core: `/play/_shared/${hashed(dir, 'core-v1', core.outputFiles[0].contents)}`, three: `/play/_shared/${hashed(dir, 'three', three.outputFiles[0].contents)}`};
}

/** The modules a motion's script takes from the shared scripts, and the expression each is found at there */
const FROM_CORE = {'react': 'v1.modules["react"]', 'react/jsx-runtime': 'v1.modules["react/jsx-runtime"]', '@motionhub/runtime': 'v1.modules["@motionhub/runtime"]', 'three': 'three'};

async function player(id, {core, three}) {
  const dir = join(ROOT, 'motions', id), out = join(OUT, id);
  const tokens = resolveTokens(JSON.parse(readFileSync(join(dir, 'tokens.json'), 'utf8')));
  const manifest = JSON.parse(readFileSync(join(dir, 'motion.json'), 'utf8')), name = manifest.name?.en ?? id;
  rmSync(out, {recursive: true, force: true});
  mkdirSync(out, {recursive: true});
  const {css, missing} = await faces(familiesOf(tokens), out, dir);
  writeFileSync(join(out, 'reel.css'), [...css, ':root {', ...Object.entries(tokenVariables(tokens)).map(([k, v]) => `  ${k}: ${v};`), '}', ''].join('\n'));
  // a reel that imports three.js draws in 3D: its page loads three.js, and the player holds it on a weak device until it is tapped
  let heavy = false;
  const result = await build({
    ...common([{name: 'motionhub', setup(b) {
      // the motion's script holds the motion's code alone: what the core offers it takes from there
      b.onResolve({filter: /^(react|react-dom|three|@motionhub\/runtime)(\/.*)?$/}, (args) => {
        if (args.path in FROM_CORE) {
          if (args.path === 'three') heavy = true;
          return {path: args.path, namespace: 'core'};
        }
        // three.js's addons are the motion's own, and import three.js from the shared script like the motion does
        if (args.path.startsWith('three/')) return undefined;
        return {errors: [{text: `${args.path} is not something a reel can import: a reel has react, @motionhub/runtime and three (with its addons)`}]};
      });
      b.onLoad({filter: /.*/, namespace: 'core'}, ({path}) => ({contents: `module.exports = globalThis.__motionhubPlayer.${FROM_CORE[path]};`, loader: 'js'}));
      b.onResolve({filter: /^motionhub:reel$/}, () => ({path: join(dir, 'react/reel.tsx')}));
      b.onResolve({filter: /^motionhub:(tokens|sound)$/}, (args) => ({path: args.path.slice(10), namespace: 'motionhub'}));
      // the motion's sound (react/sound.json), or none
      b.onLoad({filter: /.*/, namespace: 'motionhub'}, ({path}) => ({contents: `export default ${path === 'sound'
        ? (existsSync(join(dir, 'react/sound.json')) ? readFileSync(join(dir, 'react/sound.json'), 'utf8') : 'null')
        : JSON.stringify(tokens)};`, loader: 'js'}));
    }}]),
    stdin: {contents: "import * as module from 'motionhub:reel';\nimport sound from 'motionhub:sound';\nimport tokens from 'motionhub:tokens';\nglobalThis.__motionhubPlayer.v1.mount({module, sound, tokens});", resolveDir: dir, loader: 'js'},
  });
  const reel = hashed(out, 'reel', result.outputFiles[0].contents);
  writeFileSync(join(out, 'index.html'), page(name, id, manifest.version, heavy, [core, ...(heavy ? [three] : []), reel]));
  return missing;
}

const wanted = process.argv.slice(2);
const ids = listMotions(join(ROOT, 'motions')).filter((id) => existsSync(join(ROOT, 'motions', id, 'react/reel.tsx')))
  .filter((id) => !wanted.length || wanted.includes(id)).sort();
const scripts = await shared();
for (const id of ids) {
  const missing = await player(id, scripts);
  console.log(`play/${id}/${missing.length ? `  (no web font for ${missing.join(', ')}: the stack's next face draws it)` : ''}`);
}
console.log(`${ids.length} reel player(s) and ${Object.values(scripts).join(', ')} built into ${OUT}`);
