// The Remotion binding shares one @motionhub/runtime with the project (it holds a React context, so two copies break the provider):
// the runtime is a peer dependency there, never a dependency. Both bindings take a face Google Fonts lacks from one place, and
// load a face split by unicode-range whole. And a stroke that is non-scaling is not dashed by pathLength.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const json = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

test('the Remotion binding takes the runtime as a peer dependency', () => {
  const pkg = json('packages/remotion/package.json');
  assert.equal(pkg.dependencies?.['@motionhub/runtime'], undefined);
  assert.ok(pkg.peerDependencies['@motionhub/runtime']);
});

test('both bindings take LXGW WenKai from one source, at an exact version', async () => {
  const {ELSEWHERE} = await import('../packages/hyperframes/faces.js');
  const remotion = readFileSync(new URL('../packages/remotion/index.js', import.meta.url), 'utf8');
  const hyperframes = readFileSync(new URL('../packages/hyperframes/faces.js', import.meta.url), 'utf8');
  const table = (source) => /const ELSEWHERE = \{[\s\S]*?\n\};/.exec(source)?.[0];
  assert.ok(table(remotion));
  assert.equal(table(remotion), table(hyperframes));
  for (const href of ELSEWHERE['LXGW WenKai']) assert.match(href, /@\d+\.\d+\.\d+\//);
});

test('the Remotion binding loads a Chinese, Japanese or Korean face whole before the first frame', () => {
  const source = readFileSync(new URL('../packages/remotion/index.js', import.meta.url), 'utf8');
  assert.match(source, /if \(HAN\.test\(family\)\) await Promise\.all\(\[\.\.\.document\.fonts\]/);
});

test('HyperFrames reads the blocks of Google\'s and a package\'s stylesheets, each to its own local file', async () => {
  const {blocks, localBlock} = await import('../packages/hyperframes/faces.js');
  const google = `/* cyrillic */
@font-face {
  font-family: 'Fraunces';
  font-style: normal;
  font-weight: 100 900;
  font-display: block;
  src: url(https://fonts.gstatic.com/s/fraunces/v1/a.woff2) format('woff2');
  unicode-range: U+0400-045F;
}
/* latin */
@font-face {
  font-family: 'Fraunces';
  font-style: normal;
  font-weight: 100 900;
  font-display: block;
  src: url(https://fonts.gstatic.com/s/fraunces/v1/b.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}`;
  const g = blocks(google, 'https://fonts.googleapis.com/css2?family=Fraunces');
  assert.deepEqual(g.map((f) => [f.subset, f.weight, f.url]), [
    ['cyrillic', '100-900', 'https://fonts.gstatic.com/s/fraunces/v1/a.woff2'],
    ['latin', '100-900', 'https://fonts.gstatic.com/s/fraunces/v1/b.woff2'],
  ]);
  const wenkai = `/* LXGW WenKai [4] */
@font-face {
  font-family: 'LXGW WenKai';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('./files/lxgwwenkai-regular-subset-4.woff2') format('woff2');
  unicode-range: U+1f1e9-1f1f5;
}
/* LXGW WenKai [5] */
@font-face {
  font-family: 'LXGW WenKai';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('./files/lxgwwenkai-regular-subset-5.woff2') format('woff2');
  unicode-range: U+4e00-4e2d;
}`;
  const href = 'https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-regular.css';
  const w = blocks(wenkai, href);
  assert.deepEqual(w.map((f) => f.url), [
    'https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/files/lxgwwenkai-regular-subset-4.woff2',
    'https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/files/lxgwwenkai-regular-subset-5.woff2',
  ]);
  const local = w.map((f, i) => localBlock(f, 'LXGW WenKai', i));
  assert.equal(new Set(local.map((l) => l.file)).size, 2);
  for (const l of local) {
    assert.match(l.block, /src: url\('fonts\/LXGW-WenKai-normal-400-\d\.woff2'\) format\('woff2'\)/);
    assert.match(l.block, /font-display: block/);
    assert.match(l.block, /unicode-range:/);
  }
});

test('lab-notebook\'s hand label draws its underline by a clip, not a dash, on a non-scaling stroke', () => {
  const source = readFileSync(new URL('../motions/@iamsuosi/lab-notebook/react/parts/label.tsx', import.meta.url), 'utf8');
  assert.ok(!/\.\.\.drawn\(/.test(source));
});
