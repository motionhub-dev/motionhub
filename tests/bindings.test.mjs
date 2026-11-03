// The Remotion binding shares one @motionhub/runtime with the project (it holds a React context, so two copies break the provider):
// the runtime is a peer dependency there, never a dependency; and a stroke that is non-scaling is not dashed by pathLength.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const json = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

test('the Remotion binding takes the runtime as a peer dependency', () => {
  const pkg = json('packages/remotion/package.json');
  assert.equal(pkg.dependencies?.['@motionhub/runtime'], undefined);
  assert.ok(pkg.peerDependencies['@motionhub/runtime']);
});

test('the Remotion binding loads LXGW WenKai from where it exists', () => {
  const source = readFileSync(new URL('../packages/remotion/index.js', import.meta.url), 'utf8');
  assert.match(source, /'LXGW WenKai': \[/);
});

test('lab-notebook\'s hand label draws its underline by a clip, not a dash, on a non-scaling stroke', () => {
  const source = readFileSync(new URL('../motions/@iamsuosi/lab-notebook/react/parts/label.tsx', import.meta.url), 'utf8');
  assert.ok(!/\.\.\.drawn\(/.test(source));
});
