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
//   fonts/       the faces the motion carries (react/fonts/), and the latin files of the rest from Google Fonts or, for
//                a face it lacks (LXGW WenKai), from where it is; --han adds the Chinese, Japanese and Korean faces, every
//                file of them, since a face split by unicode-range is only complete with all its parts
import {createRequire} from 'node:module';
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {ELSEWHERE, HAN, blocks, localBlock} from './faces.js';

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

// ---- faces: made local, Google Fonts' latin files (with --han all of them), and faces it lacks from where they are ----
const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|math|emoji|ui-[a-z-]+)$/;
const han = args.includes('--han');
const families = [...new Set(Object.values(tokens.font ?? {}).flatMap((s) => String(s).split(',').map((f) => f.trim().replace(/^["']|["']$/g, ''))))]
  .filter((f) => f && !GENERIC.test(f) && (han || !HAN.test(f)));
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const get = (url) => fetch(url, {headers: {'user-agent': UA}}).catch(() => undefined);
/** A family's stylesheets as [{css, href}], [] when no source has it */
async function sheets(family) {
  if (ELSEWHERE[family]) {
    const got = await Promise.all(ELSEWHERE[family].map(async (href) => { const res = await get(href); return res?.ok ? {css: await res.text(), href} : undefined; }));
    return got.filter(Boolean);
  }
  const name = encodeURIComponent(family).replace(/%20/g, '+');
  // Google Fonts refuses a weight range a face does not span, so ask for the common ones in turn, then its default weight
  for (const axes of [':wght@100..900', ':wght@200..900', ':wght@100..800', ':wght@200..800', ':wght@300..800', ':wght@300..700', ':wght@400..700', ':wght@400;700', '']) {
    const href = `https://fonts.googleapis.com/css2?family=${name}${axes}&display=block`;
    const res = await get(href);
    if (res?.ok) return [{css: await res.text(), href}];
  }
  return [];
}
/** Fetches each URL into its file, a few at a time: a face split by unicode-range has a hundred files or more */
async function download(jobs) {
  const queue = [...jobs];
  await Promise.all(Array.from({length: 8}, async () => {
    for (let job; (job = queue.shift());) {
      if (existsSync(job.path)) continue;
      const res = await get(job.url);
      if (!res?.ok) throw new Error(`could not fetch ${job.url} (${res?.status ?? 'no response'})`);
      writeFileSync(job.path, Buffer.from(await res.arrayBuffer()));
    }
  }));
}
mkdirSync(join(out, 'fonts'), {recursive: true});
const faceCss = [], missing = [], jobs = [];
// the faces the motion carries itself (react/fonts/fonts.json) come first; the others are fetched
const ownDir = join(dir, 'react', 'fonts');
const own = existsSync(join(ownDir, 'fonts.json')) ? JSON.parse(readFileSync(join(ownDir, 'fonts.json'), 'utf8')) : [];
for (const f of own) {
  writeFileSync(join(out, 'fonts', f.file), readFileSync(join(ownDir, f.file)));
  faceCss.push(`@font-face { font-family: ${JSON.stringify(f.family)}; font-style: ${f.style ?? 'normal'}; font-weight: ${f.weight ?? '400'}; font-display: block; src: url('fonts/${f.file}') format('woff2'); }`);
}
for (const family of families.filter((name) => !own.some((f) => f.family === name))) {
  const all = (await sheets(family)).flatMap(({css, href}) => blocks(css, href));
  if (!all.length) { missing.push(family); continue; }
  // without --han, only the blocks for latin text, which Google's comments name; a face whose blocks name none keeps them all
  const latin = all.filter((f) => f.subset === 'latin');
  const kept = han || HAN.test(family) || !latin.length ? all : latin;
  for (const f of kept) {
    const local = localBlock(f, family);
    jobs.push({url: f.url, path: join(out, 'fonts', local.file)});
    faceCss.push(local.block);
  }
}
await download(jobs);

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
console.log(`${relative(process.cwd(), out)}/motion.js (${files.length} components: ${files.map((f) => f.replace(/\.tsx$/, '')).join(', ') || 'none'}), motion.css, fonts/ (${families.length - missing.length} faces)${missing.length ? `; no source has these, add @font-face for: ${missing.join(', ')}` : ''}
In index.html: <link rel="stylesheet" href="assets/motion/motion.css"> and <script src="assets/motion/motion.js"></script>, before the compositions' scripts.
In a composition: const {h, box, components: C} = Motion; const m = Motion.mount(el, () => [box(0, 0, 1920, 1080, h(C.Stage, {spotX: s.x}))]);
tl.eventCallback('onUpdate', () => m.render(tl.time())); m.render(0);`);
