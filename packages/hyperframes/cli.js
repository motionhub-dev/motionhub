#!/usr/bin/env node
// @motionhub/hyperframes: make a motion usable in a HyperFrames project, with nothing fetched at render.
//
//   npx @motionhub/hyperframes [motion dir, default ./motion] [--out assets/motion] [--han]
//
// writes into --out:
//   motion.js    window.Motion: the motion's React components with React and their runtime (@motionhub/runtime),
//                mount() to draw them from a GSAP timeline, Caption, and the tokens with GSAP-ready eases
//   motion.css   the tokens as custom properties (--color-*, --font-*, --duration-*, --easing-*, --caption-*), and
//                @font-face for every face the motion names, from fonts/
//   fonts/       those faces' latin files from Google Fonts (--han also Chinese, Japanese and Korean ones)
import {createRequire} from 'node:module';
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const dir = resolve(args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--out') ?? 'motion');
const out = resolve(flag('--out') ?? 'assets/motion');
if (!existsSync(join(dir, 'tokens.json'))) { console.error(`${dir} is not a motion (no tokens.json): npx @motionhub/cli get <slug>`); process.exit(2); }

// ---- tokens ----
const {resolveTokens, tokenVariables} = await import(pathToFileURL(require.resolve('@motionhub/runtime')).href);
const tokens = resolveTokens(JSON.parse(readFileSync(join(dir, 'tokens.json'), 'utf8')));

// ---- faces: Google Fonts' latin files, made local ----
const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|math|emoji|ui-[a-z-]+)$/;
const HAN = /^(Noto (Sans|Serif) (SC|TC|JP|KR)|LXGW WenKai|Fusion Pixel.*)$/;
const families = [...new Set(Object.values(tokens.font ?? {}).flatMap((s) => String(s).split(',').map((f) => f.trim().replace(/^["']|["']$/g, ''))))]
  .filter((f) => f && !GENERIC.test(f) && (args.includes('--han') || !HAN.test(f)));
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
async function face(family) {
  const name = encodeURIComponent(family).replace(/%20/g, '+');
  for (const axes of [':wght@100..900', ':wght@200..900', ':wght@100..800', ':wght@200..800', ':wght@300..800', ':wght@300..700', ':wght@400..700', ':wght@400;700', '']) {
    const res = await fetch(`https://fonts.googleapis.com/css2?family=${name}${axes}&display=block`, {headers: {'user-agent': UA}}).catch(() => undefined);
    if (res?.ok) return res.text();
  }
  return undefined;
}
mkdirSync(join(out, 'fonts'), {recursive: true});
const faceCss = [], missing = [];
for (const family of families) {
  const text = await face(family);
  if (!text) { missing.push(family); continue; }
  // only the blocks for latin text: the comment before each block names its subset
  const blocks = [...text.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)].filter(([, subset]) => subset === 'latin' || args.includes('--han')).map(([, , b]) => b);
  for (const block of blocks.length ? blocks : [text]) {
    const url = /url\(([^)]+)\)/.exec(block)?.[1];
    if (!url) continue;
    const file = `${family.replace(/\W+/g, '-')}-${/font-style:\s*(\w+)/.exec(block)?.[1] ?? 'normal'}-${(/font-weight:\s*([\d ]+)/.exec(block)?.[1] ?? '400').trim().replace(/\s+/g, '-')}${/\.woff2/.test(url) ? '.woff2' : '.ttf'}`;
    if (!existsSync(join(out, 'fonts', file))) writeFileSync(join(out, 'fonts', file), Buffer.from(await (await fetch(url, {headers: {'user-agent': UA}})).arrayBuffer()));
    faceCss.push(block.replace(/url\([^)]+\)/, `url('fonts/${file}')`));
  }
}

// ---- the stylesheet ----
writeFileSync(join(out, 'motion.css'), [
  `/* Written by @motionhub/hyperframes from ${relative(process.cwd(), dir) || '.'}; run it again rather than editing. */`,
  ...faceCss,
  ':root {', ...Object.entries(tokenVariables(tokens)).map(([k, v]) => `  ${k}: ${v};`), '}', ''].join('\n'));

// ---- the script: the components, React and their runtime in one file ----
// the components: the motion's React components, wherever its tool directories keep them
const partsDir = join(dir, 'react', 'parts');
const files = existsSync(partsDir) ? readdirSync(partsDir).filter((f) => /\.tsx$/.test(f)).sort() : [];
const virtual = [
  ...files.map((f, i) => `import * as P${i} from ${JSON.stringify(join(partsDir, f))};`),
  `const all = [${files.map((_, i) => `P${i}`).join(', ')}];`,
  'export const components = Object.fromEntries(all.flatMap((m) => Object.entries(m).filter(([k, v]) => /^[A-Z]/.test(k) && typeof v === "function")));',
  `export const tokens = ${JSON.stringify(tokens)};`,
].join('\n');
const resolveFrom = (name) => dirname(require.resolve(name));
await build({
  entryPoints: [join(HERE, 'entry.js')], bundle: true, format: 'iife', platform: 'browser', target: 'es2020', minify: true, legalComments: 'none',
  outfile: join(out, 'motion.js'), jsx: 'automatic', define: {'process.env.NODE_ENV': '"production"'}, logLevel: 'warning',
  // one copy of React and of the runtime, whichever the components resolve them from
  alias: {'@motionhub/runtime': resolveFrom('@motionhub/runtime'), react: resolveFrom('react'), 'react-dom': resolveFrom('react-dom')},
  nodePaths: [join(process.cwd(), 'node_modules'), join(HERE, 'node_modules'), join(HERE, '..')],
  plugins: [{name: 'motion', setup(b) {
    b.onResolve({filter: /^motionhub:motion$/}, () => ({path: 'motion', namespace: 'motionhub'}));
    b.onLoad({filter: /.*/, namespace: 'motionhub'}, () => ({contents: virtual, loader: 'js', resolveDir: partsDir}));
  }}],
});
console.log(`${relative(process.cwd(), out)}/motion.js (${files.length} components: ${files.map((f) => f.replace(/\.tsx$/, '')).join(', ') || 'none'}), motion.css, fonts/ (${families.length - missing.length} faces)${missing.length ? `; not on Google Fonts, add @font-face for: ${missing.join(', ')}` : ''}
In index.html: <link rel="stylesheet" href="assets/motion/motion.css"> and <script src="assets/motion/motion.js"></script>, before the compositions' scripts.
In a composition: const {h, box, components: C} = Motion; const m = Motion.mount(el, () => [box(0, 0, 1920, 1080, h(C.Stage, {spotX: s.x}))]);
tl.eventCallback('onUpdate', () => m.render(tl.time())); m.render(0);`);
