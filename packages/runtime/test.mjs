// The runtime's decisions: the same seed draws the same stream everywhere, tokens.json resolves to the values and custom properties the
// components read, and a component reads its time, frame and tokens from the engine's provider.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Caption, Easing, MotionRuntimeProvider, Sequence, interpolate, useTime, resolveTokens, seededRandom, tokenVariables, useCompositionTime, useCurrentFrame, useTokens, useVideoConfig} from './index.js';

test('a seed draws the same stream every time, and another seed another one', () => {
  const take = (seed) => { const r = seededRandom(seed); return [r(), r(), r()]; };
  assert.deepEqual(take('stars'), take('stars'));
  assert.notDeepEqual(take('stars'), take('dust'));
  assert.ok(take(7).every((n) => n >= 0 && n < 1));
});

const DTCG = {
  color: {$type: 'color', ink: {$value: {colorSpace: 'srgb', components: [0.1, 0.2, 0.3], hex: '#1A334D'}}, veil: {$value: {colorSpace: 'srgb', components: [0, 0, 0], hex: '#000000', alpha: 0.5}}},
  font: {$type: 'fontFamily', sans: {$value: ['Hanken Grotesk', 'sans-serif']}},
  duration: {light: {$type: 'duration', $value: {value: 400, unit: 'ms'}}},
  easing: {light: {$type: 'cubicBezier', $value: [0.2, 0, 0, 1]}},
  caption: {
    font: {$type: 'fontFamily', $value: '{font.sans}'},
    size: {$type: 'dimension', $value: {value: 36, unit: 'px'}},
    shadow: {$type: 'shadow', $value: [{color: {colorSpace: 'srgb', components: [0, 0, 0], hex: '#000000'}, offsetX: {value: 0, unit: 'px'}, offsetY: {value: 2, unit: 'px'}, blur: {value: 12, unit: 'px'}, spread: {value: 0, unit: 'px'}}]},
    'rule-left': {$type: 'color', $value: '{color.ink}'},
  },
};

test('tokens resolve by type, aliases included, and become custom properties', () => {
  const t = resolveTokens(DTCG);
  assert.deepEqual(t.color, {ink: '#1A334D', veil: 'color-mix(in srgb, #000000 50%, transparent)'});
  assert.equal(t.font.sans, '"Hanken Grotesk", sans-serif');
  assert.equal(t.duration.light, 0.4);
  assert.deepEqual(t.easing.light, [0.2, 0, 0, 1]);
  assert.deepEqual(t.caption, {font: '"Hanken Grotesk", sans-serif', size: 36, shadow: '0px 2px 12px #000000', 'rule-left': '#1A334D'});
  const vars = tokenVariables(t);
  assert.equal(vars['--color-ink'], '#1A334D');
  assert.equal(vars['--duration-light'], '0.4s');
  assert.equal(vars['--easing-light'], 'cubic-bezier(0.2, 0, 0, 1)');
  assert.equal(vars['--caption-size'], '36px');
});

test('a component reads its time, frame, size and tokens from the engine', () => {
  const Probe = () => {
    const {width, fps} = useVideoConfig();
    return h('i', null, `${useCurrentFrame()} ${useCompositionTime()} ${width} ${fps} ${useTokens().color.ink}`);
  };
  const value = {useTime: () => 1.5, useCompositionTime: () => 9.5, fps: 30, width: 1920, height: 1080, tokens: resolveTokens(DTCG)};
  assert.equal(renderToStaticMarkup(h(MotionRuntimeProvider, {value}, h(Probe))), '<i>45 9.5 1920 30 #1A334D</i>');
  assert.match(renderToStaticMarkup(h(MotionRuntimeProvider, {value}, h(Caption, null, 'Said'))), /font-size:36px.*Said/);
  assert.throws(() => renderToStaticMarkup(h(Probe)), /outside its engine/);
});

test('interpolate maps time through a curve and holds at the ends; a Sequence counts from its start and draws only in its span', () => {
  assert.equal(interpolate(1.5, [1, 2], [0, 100]), 50);
  assert.equal(interpolate(3, [1, 2], [0, 100]), 100);
  assert.equal(interpolate(0, [1, 2], [0, 100]), 0);
  assert.equal(interpolate(1.5, [1, 2, 3], [0, 10, 0]), 5);
  assert.ok(Math.abs(interpolate(1.5, [1, 2], [0, 1], {easing: Easing.bezier(0.42, 0, 0.58, 1)}) - 0.5) < 1e-3);
  const Clock = () => h('i', null, String(useTime()));
  const at = (t) => renderToStaticMarkup(h(MotionRuntimeProvider, {value: {useTime: () => t, useCompositionTime: () => t, fps: 30, width: 1920, height: 1080}}, h(Sequence, {from: 2, duration: 3}, h(Clock))));
  assert.equal(at(1), '');
  assert.equal(at(2.5), '<i>0.5</i>');
  assert.equal(at(5), '');
});
