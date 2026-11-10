// The Remotion binding's decisions that need no Remotion: a film's scenes in frames that meet end to end and add up to it, the scenes a
// composition places checked against the film's, and a film that cannot be drawn off the page said so.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {Film, Scene, useTokens} from '@motionhub/runtime';
import {filmMetadata, sceneFrames} from './film.js';

const filmOf = (scenes) => () => h(Film, null, ...scenes.map(([id, duration]) => h(Scene, {key: id, id, duration})));

test('scenes of fractional lengths become whole frames that meet end to end and add up to the composition', () => {
  const Main = filmOf([['a', 1.01], ['b', 0.52], ['c', 2.2]]);
  const frames = sceneFrames(Main, {fps: 30});
  assert.deepEqual(frames, {a: 30, b: 16, c: 66});
  assert.deepEqual(filmMetadata(Main, {fps: 30, width: 1280, height: 720}), {durationInFrames: 112, fps: 30, width: 1280, height: 720});
  assert.equal(Object.values(frames).reduce((s, n) => s + n, 0), Math.round(3.73 * 30));
  assert.deepEqual(sceneFrames(filmOf([['a', 1]])), {a: 30}, '30 fps unless the film says');
});

test('the scenes a composition places must be the film\'s, in order', () => {
  const Main = filmOf([['intro', 2], ['how', 3]]);
  assert.equal(filmMetadata(Main, {}, ['intro', 'how']).durationInFrames, 150);
  for (const [ids, listed] of [[['intro'], '"intro"'], [['intro', 'how', 'end'], '"intro", "how", "end"'], [['how', 'intro'], '"how", "intro"']]) {
    assert.throws(() => filmMetadata(Main, {}, ids), new RegExp(`the film's scenes are "intro", "how", the composition places ${listed}`));
  }
});

test('a scene shorter than a frame, a component that draws no Film, and one that fails off the page are said so', () => {
  assert.throws(() => sceneFrames(filmOf([['a', 1], ['blink', 0.01]])), /scene "blink" lasts 0.01 s, less than a frame at 30 fps/);
  assert.throws(() => filmMetadata(() => h('div')), /draws no <Film>/);
  const Inked = () => h('i', null, useTokens().color.ink);
  assert.throws(() => sceneFrames(() => h(Film, null, h(Scene, {id: 'a', duration: 1}, h(Inked)))), /off the page, at its start, to learn its scenes: .*<MotionScope>/);
});
