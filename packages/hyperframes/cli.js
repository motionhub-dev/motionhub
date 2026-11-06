#!/usr/bin/env node
// @motionhub/hyperframes: make a project's motions usable in a HyperFrames project, with nothing fetched at render.
//
//   npx @motionhub/hyperframes [motion dir ...] [--out assets/motion] [--han]
//
// With no directory it takes every motion in ./motions/ (SPEC.md §13), else ./motion. It writes into --out:
//   motion.js    window.Motions, by each motion's id (@<scope>/<slug>, or for a motion of the project's own its name in
//                motions/): its React components with React and their runtime (@motionhub/runtime), mount() to draw them
//                from a GSAP timeline, Caption, and its tokens with GSAP-ready eases. With one motion, window.Motion is it
//   motion.css   each motion's tokens as custom properties (--color-*, --font-*, --duration-*, --easing-*, --caption-*)
//                on [data-motion="<id>"] (and, with one motion, on :root), and @font-face for every face they name
//   fonts/       the faces the motions carry (react/fonts/, under fonts/<id>/), and the latin files of the rest from
//                Google Fonts or, for a face it lacks (LXGW WenKai), from where it is; --han adds the Chinese, Japanese
//                and Korean faces, every file of them, since a face split by unicode-range is only complete with all its parts
import {createRequire} from 'node:module';
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {basename, dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {ELSEWHERE, HAN, blocks, localBlock} from './faces.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const out = resolve(flag('--out') ?? 'assets/motion');

// ---- the motions: those named, else the project's (motions/<name>/ and motions/@<scope>/<slug>/), else ./motion ----
const subdirs = (dir) => readdirSync(dir, {withFileTypes: true}).filter((e) => e.isDirectory()).map((e) => e.name).sort();
const named = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--out');
const project = resolve('motions');
const dirs = named.length ? named.map((d) => resolve(d))
  : existsSync(project) ? subdirs(project).flatMap((d) => (d.startsWith('@') ? subdirs(join(project, d)).map((s) => join(project, d, s)) : [join(project, d)]))
  : [resolve('motion')];
/** A motion's id: its motion.json's, else its place in motions/, else its directory's name */
const idOf = (dir) => {
  try {
    const m = JSON.parse(readFileSync(join(dir, 'motion.json'), 'utf8'));
    if (typeof m.slug === 'string') return m.scope ? `@${m.scope}/${m.slug}` : m.slug;
  } catch {}
  const at = relative(project, dir);
  return at && !at.startsWith('..') ? at.split(/[\\/]/).join('/') : basename(dir);
};
const {resolveTokens, tokenVariables} = await import(pathToFileURL(require.resolve('@motionhub/runtime')).href);
const motions = [];
for (const dir of dirs) {
  if (!existsSync(join(dir, 'tokens.json'))) {
    const oneFile = existsSync(join(dir, 'MOTION.md'));
    // one named is required; one found in motions/ without tokens.json is a motion in one file, whose tokens come first
    const why = oneFile ? `write its tokens first: npx @motionhub/cli tokens ${relative(process.cwd(), join(dir, 'MOTION.md'))} --out ${relative(process.cwd(), join(dir, 'tokens.json'))}` : 'npx @motionhub/cli get <id>';
    if (named.length || !oneFile) { console.error(`${relative(process.cwd(), dir) || '.'} is not a motion with tokens.json: ${why}`); process.exit(2); }
    console.warn(`left out ${relative(process.cwd(), dir)}, a motion in one file: ${why}`);
    continue;
  }
  motions.push({dir, id: idOf(dir), tokens: resolveTokens(JSON.parse(readFileSync(join(dir, 'tokens.json'), 'utf8')))});
}
if (!motions.length) { console.error('no motion here: npx @motionhub/cli get <id> takes one into ./motions/'); process.exit(2); }
const ids = motions.map((m) => m.id);
if (new Set(ids).size !== ids.length) { console.error(`two of these are the same motion: ${ids.join(', ')}`); process.exit(2); }
/** A motion's id as one safe directory name, for its own faces */
const fileId = (id) => id.replace(/^@/, '').replace(/[^A-Za-z0-9._-]+/g, '-');

// ---- faces: made local, Google Fonts' latin files (with --han all of them), and faces it lacks from where they are ----
const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|math|emoji|ui-[a-z-]+)$/;
const han = args.includes('--han');
const families = [...new Set(motions.flatMap(({tokens}) => Object.values(tokens.font ?? {}).flatMap((s) => String(s).split(',').map((f) => f.trim().replace(/^["']|["']$/g, '')))))]
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
// the faces the motions carry themselves (react/fonts/fonts.json) come first, each motion's in its own directory; the
// others are fetched
const own = [];
for (const {dir, id} of motions) {
  const ownDir = join(dir, 'react', 'fonts');
  if (!existsSync(join(ownDir, 'fonts.json'))) continue;
  mkdirSync(join(out, 'fonts', fileId(id)), {recursive: true});
  for (const f of JSON.parse(readFileSync(join(ownDir, 'fonts.json'), 'utf8'))) {
    own.push(f);
    writeFileSync(join(out, 'fonts', fileId(id), f.file), readFileSync(join(ownDir, f.file)));
    faceCss.push(`@font-face { font-family: ${JSON.stringify(f.family)}; font-style: ${f.style ?? 'normal'}; font-weight: ${f.weight ?? '400'}; font-display: block; src: url('fonts/${fileId(id)}/${f.file}') format('woff2'); }`);
  }
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

// ---- the stylesheet: each motion's tokens on its own scope, so two motions never set each other's ----
const declarations = (tokens) => Object.entries(tokenVariables(tokens)).map(([k, v]) => `  ${k}: ${v};`);
writeFileSync(join(out, 'motion.css'), [
  `/* Written by @motionhub/hyperframes from ${motions.map((m) => relative(process.cwd(), m.dir) || '.').join(', ')}; run it again rather than editing. */`,
  ...faceCss,
  ...(motions.length === 1 ? [':root {', ...declarations(motions[0].tokens), '}'] : []),
  ...motions.flatMap(({id, tokens}) => [`[data-motion=${JSON.stringify(id)}] {`, ...declarations(tokens), '}']),
  ''].join('\n'));

// ---- the script: every motion's components, React and their runtime in one file ----
// each motion's React components, from react/parts/; one copy of React and of the runtime serves them all
const parts = motions.map(({dir}) => {
  const partsDir = join(dir, 'react', 'parts');
  return {partsDir, files: existsSync(partsDir) ? readdirSync(partsDir).filter((f) => /\.tsx$/.test(f)).sort() : []};
});
const virtual = [
  ...parts.flatMap(({partsDir, files}, m) => files.map((f, i) => `import * as P${m}_${i} from ${JSON.stringify(join(partsDir, f))};`)),
  'const components = (all) => Object.fromEntries(all.flatMap((m) => Object.entries(m).filter(([k, v]) => /^[A-Z]/.test(k) && typeof v === "function")));',
  `export const motions = [${motions.map(({id, tokens}, m) => `{id: ${JSON.stringify(id)}, tokens: ${JSON.stringify(tokens)}, components: components([${parts[m].files.map((_, i) => `P${m}_${i}`).join(', ')}])}`).join(',\n')}];`,
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
    b.onLoad({filter: /.*/, namespace: 'motionhub'}, () => ({contents: virtual, loader: 'js', resolveDir: process.cwd()}));
  }}],
});
const listed = motions.map(({id}, m) => `${id} (${parts[m].files.length} components: ${parts[m].files.map((f) => f.replace(/\.tsx$/, '')).join(', ') || 'none'})`);
const first = JSON.stringify(motions[0].id);
console.log(`${relative(process.cwd(), out)}/motion.js with ${listed.join('; ')}, motion.css, fonts/ (${families.length - missing.length} faces)${missing.length ? `; no source has these, add @font-face for: ${missing.join(', ')}` : ''}
In index.html: <link rel="stylesheet" href="assets/motion/motion.css"> and <script src="assets/motion/motion.js"></script>, before the compositions' scripts.
In a composition${motions.length > 1 ? ` in ${motions[0].id}` : ''}: const M = ${motions.length > 1 ? `Motions[${first}]` : 'Motion'}, {h, box, components: C} = M; const m = M.mount(el, () => [box(0, 0, 1920, 1080, h(C.Stage, {spotX: s.x}))]);
tl.eventCallback('onUpdate', () => m.render(tl.time())); m.render(0);`);
