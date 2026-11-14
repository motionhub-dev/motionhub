// The runtime's decisions: the same seed draws the same stream everywhere, tokens.json resolves to the values and custom properties the
// components read, and a component reads its time, frame and tokens from the engine's provider.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Fragment} from 'react';
import {Caption, Easing, Film, FilmScene, Layer, Line, MotionRuntimeProvider, MotionScope, Scene, Sequence, Sound, filmOutline, interpolate, useTime, resolveTokens, seededRandom, tokenVariables, useCompositionTime, useCurrentFrame, useTokens, useVideoConfig} from './index.js';

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

test('a MotionScope draws its children in another motion, on the same clock', () => {
  const other = {color: {$type: 'color', ink: {$value: {colorSpace: 'srgb', components: [1, 0, 0], hex: '#FF0000'}}}};
  const Ink = () => h('i', null, `${useTokens().color.ink} ${useTime()} ${useCompositionTime()}`);
  const value = {useTime: () => 2, useCompositionTime: () => 12, fps: 30, width: 1920, height: 1080, tokens: resolveTokens(DTCG)};
  const html = renderToStaticMarkup(h(MotionRuntimeProvider, {value}, h(Ink), h(MotionScope, {tokens: other}, h(Ink)), h(MotionScope, {tokens: resolveTokens(other), root: false}, h(Ink))));
  assert.equal(html.match(/<i>[^<]*<\/i>/g).join(' '), '<i>#1A334D 2 12</i> <i>#FF0000 2 12</i> <i>#FF0000 2 12</i>');
  assert.match(html, /<div style="[^"]*--color-ink:#FF0000[^"]*"><i>#FF0000/, 'its root carries its own custom properties, so they never reach the other motion');
  assert.throws(() => renderToStaticMarkup(h(MotionScope, {tokens: other}, h(Ink))), /outside its engine/);
});

test('a Film reads its structure from its elements: scenes end to end, their layers in pixels, their lines, and its own layers', () => {
  const children = [
    h(Layer, {key: 'logo', id: 'logo', x: 40, y: 40, w: 200, h: 80, z: 2}),
    h(Scene, {key: 'a', id: 'intro', duration: 2.5}, h(Line, {id: 'l1'}, 'Heat moves ', h('b', null, 'uphill')), h(Layer, {id: 'title', y: 300, h: 400})),
    h(Fragment, {key: 'f'}, h(Scene, {id: 'how', duration: 4}, h(Line, {id: 'l2', text: 'Shown words'}, 'Spoken words'))),
  ];
  assert.deepEqual(filmOutline(children, {width: 1280, height: 720}), {
    seconds: 6.5,
    scenes: [
      {id: 'intro', start: 0, duration: 2.5, layers: [{id: 'title', x: 0, y: 300, w: 1280, h: 400, z: 0}], lines: [{id: 'l1', text: 'Heat moves uphill', start: 0, end: 2.5}], sounds: []},
      {id: 'how', start: 2.5, duration: 4, layers: [], lines: [{id: 'l2', text: 'Shown words', start: 2.5, end: 6.5}], sounds: []},
    ],
    layers: [{id: 'logo', x: 40, y: 40, w: 200, h: 80, z: 2}],
    sounds: [],
    captions: false,
  });
  for (const [bad, message] of [
    [[], /at least one <Scene>/],
    [[h(Scene, {key: 1, id: 'a'})], /needs its duration/],
    [[h(Scene, {key: 1, id: 'a', duration: Infinity})], /needs its duration/],
    [[h(Layer, {key: 0, id: 'logo'}), h(Scene, {key: 1, id: 'a', duration: 1}, h(Layer, {id: 'logo'}))], /the name of one of the film's own layers/],
    [[h(Scene, {key: 1, duration: 1})], /needs an id/],
    [[h(Scene, {key: 1, id: 'a', duration: 1}), h(Scene, {key: 2, id: 'a', duration: 1})], /two scenes are called "a"/],
    [[h(Scene, {key: 1, id: 'a', duration: 1}, h(Line, {id: 'x'}), h(Line, {id: 'x'}))], /two lines are called "x"/],
  ]) assert.throws(() => filmOutline(bad), message);
});

test('a Film reads its sounds in the film\'s seconds: a scene\'s from its start and to its end, the film\'s own across it all', () => {
  const outline = filmOutline([
    h(Sound, {key: 'bed', src: 'media/bed.mp3', loop: true, volume: -12, fadeIn: 1, fadeOut: 2, duck: 6}),
    h(Scene, {key: 'a', id: 'a', duration: 2}),
    h(Scene, {key: 'b', id: 'b', duration: 3}, h(Sound, {src: 'media/whoosh.wav', at: 0.4, dur: 1.5, trim: 0.2, volume: -6})),
  ]);
  assert.deepEqual(outline.sounds, [{src: 'media/bed.mp3', at: 0, dur: null, until: 5, trim: 0, loop: true, volume: -12, fadeIn: 1, fadeOut: 2, duck: 6}]);
  assert.deepEqual(outline.scenes[0].sounds, []);
  assert.deepEqual(outline.scenes[1].sounds, [{src: 'media/whoosh.wav', at: 2.4, dur: 1.5, until: 5, trim: 0.2, loop: false, volume: -6, fadeIn: 0, fadeOut: 0}]);
  const scene = (props) => [h(Scene, {key: 'a', id: 'a', duration: 2}, h(Sound, props))];
  for (const [props, message] of [
    [{}, /needs a src/],
    [{src: 'a.mp3', at: -1}, /at is a number of seconds from 0/],
    [{src: 'a.mp3', dur: 0}, /dur is a number of seconds above 0/],
    [{src: 'a.mp3', fadeIn: Number.NaN}, /fadeIn is a number of seconds/],
    [{src: 'a.mp3', volume: '-6'}, /volume is in dB/],
    [{src: 'a.mp3', duck: -3}, /duck is how many dB/],
  ]) assert.throws(() => filmOutline(scene(props)), message);
  assert.doesNotMatch(renderToStaticMarkup(h(MotionRuntimeProvider, {value: {useTime: () => 0, useCompositionTime: () => 0, fps: 30, width: 1, height: 1}},
    h(Film, null, h(Scene, {id: 'a', duration: 1}, h(Sound, {src: 'media/x.mp3'}))))), /x\.mp3/, 'a sound draws nothing');
});

test('a scene\'s lines are said when they say, sharing what they leave out evenly', () => {
  const times = (lines, duration = 6) =>
    filmOutline([h(Scene, {key: 'a', id: 'a', duration: 1}), h(Scene, {key: 'b', id: 'b', duration}, ...lines.map((props, i) => h(Line, {key: i, id: `l${i}`, ...props}, 'Words')))])
      .scenes[1].lines.map(({start, end}) => [start, end]);
  // In the film's seconds: the scene starts at 1.
  assert.deepEqual(times([{}, {}, {}]), [[1, 3], [3, 5], [5, 7]]);
  assert.deepEqual(times([{at: 1}, {}]), [[2, 4.5], [4.5, 7]]);
  assert.deepEqual(times([{dur: 1}, {}, {at: 4, dur: 0.5}, {}]), [[1, 2], [2, 5], [5, 5.5], [5.5, 7]]);
  assert.deepEqual(times([{dur: 10}]), [[1, 7]], 'a line never runs past its scene');
  assert.throws(() => times([{at: 6}]), /past the end of its scene/);
  assert.throws(() => times([{dur: 0}]), /dur is a number of seconds above 0/);
  // A line hidden under the one before it, or left no time, would never show: both are said.
  assert.throws(() => times([{dur: 5}, {at: 2}]), /<Line id="l1">: at is 2 s, before the line before it ends \(5 s into the scene\)/);
  assert.throws(() => times([{at: 3}, {at: 1}]), /<Line id="l1">: at is 1 s, before the line before it ends/);
  assert.throws(() => times([{dur: 4}, {}, {at: 4}]), /<Line id="l1">: no time is left for it before <Line id="l2"> at 4 s/);
  assert.throws(() => times([{dur: 6}, {}]), /<Line id="l1">: no time is left for it before the end of its scene \(6 s\)/);
});

test('a Film with captions draws the line being said over everything, and a Caption draws one line while it is said', () => {
  const at = (t, film) => renderToStaticMarkup(h(MotionRuntimeProvider, {value: {useTime: () => t, useCompositionTime: () => t, fps: 30, width: 1920, height: 1080}}, film));
  const film = (props, ...extra) => h(Film, props,
    h(Scene, {id: 'a', duration: 4}, h(Line, {id: 'l1'}, 'Heat moves'), h(Line, {id: 'l2', text: 'uphill.'}, 'up the hill'), ...extra),
    h(Scene, {id: 'b', duration: 2}));
  assert.match(at(1, film({captions: true})), /z-index:2147483647.*>Heat moves</);
  assert.match(at(3, film({captions: true})), />uphill\.</, 'its text where the caption differs');
  assert.doesNotMatch(at(5, film({captions: true})), /Heat moves|uphill/, 'no line is said in the second scene');
  assert.doesNotMatch(at(1, film({})), /Heat moves/, 'no captions unless the film asks');
  assert.match(at(1, film({captions: true})), /opacity:1/);
  assert.match(at(0.075, film({captions: true})), /opacity:0\.5/, 'it fades in');
  const own = (t) => at(t, film({}, h(Layer, {id: 'own'}, h(Caption, {line: 'l2'}))));
  assert.match(own(3), />uphill\.</);
  assert.doesNotMatch(own(1), /uphill/);
  assert.throws(() => at(1, film({}, h(Caption, {line: 'nope'}))), /the film has no line by that id/);
  assert.throws(() => renderToStaticMarkup(h(MotionRuntimeProvider, {value: {useTime: () => 0, useCompositionTime: () => 0, fps: 30, width: 1, height: 1}}, h(Caption, {line: 'l1'}))), /drawn inside a <Film>/);
});

test('a Film draws the scene whose span holds the time, on its own clock, holds the last at the end', () => {
  const Clock = () => h('i', null, String(useTime()));
  const at = (t) => renderToStaticMarkup(h(MotionRuntimeProvider, {value: {useTime: () => t, useCompositionTime: () => t, fps: 30, width: 1920, height: 1080}},
    h(Film, null,
      h(Layer, {id: 'logo', w: 10, h: 10}, h(Clock)),
      h(Scene, {id: 'a', duration: 2}, h(Line, {id: 'l'}, 'Said'), h(Layer, {id: 'x', x: 5}, h(Clock))),
      h(Scene, {id: 'b', duration: 3}, h(Layer, {id: 'y'}, h(Clock))))));
  assert.match(at(1), /data-layer="logo"[^>]*><i>1<\/i>.*data-scene="a".*data-layer="x"[^>]*left:5px[^>]*><i>1<\/i>/);
  assert.doesNotMatch(at(1), /data-scene="b"/);
  assert.match(at(2.5), /data-scene="b".*<i>0.5<\/i>/);
  assert.doesNotMatch(at(2.5), /data-scene="a"/);
  assert.match(at(5), /data-scene="b".*<i>3<\/i>/, 'the last scene holds at the end');
  assert.doesNotMatch(at(1), /Said/, 'a line draws nothing');
  assert.throws(() => renderToStaticMarkup(h(MotionRuntimeProvider, {value: {useTime: () => 0, useCompositionTime: () => 0, fps: 30, width: 1, height: 1}}, h(Scene, {id: 'a', duration: 1}))), /only inside a <Film>/);
});

test('a FilmScene draws one scene of its film on the engine\'s clock, the film\'s own layers on the film\'s', () => {
  const Clock = ({id}) => h('i', null, `${id} ${useTime()}`);
  const film = h(Film, null, h(Layer, {id: 'logo'}, h(Clock, {id: 'own'})), h(Scene, {id: 'a', duration: 2}, h(Clock, {id: 'a'})), h(Scene, {id: 'b', duration: 3}, h(Clock, {id: 'b'})));
  const value = {useTime: () => 0.25, useCompositionTime: () => 2.25, fps: 30, width: 1920, height: 1080};
  const html = renderToStaticMarkup(h(MotionRuntimeProvider, {value}, h(FilmScene, {id: 'b'}, film)));
  assert.match(html, /<i>own 2.25<\/i>.*data-scene="b".*<i>b 0.25<\/i>/);
  assert.doesNotMatch(html, /data-scene="a"/);
  assert.throws(() => renderToStaticMarkup(h(MotionRuntimeProvider, {value}, h(FilmScene, {id: 'c'}, film))), /has no scene "c", only "a", "b"/);
});

test('a Film reports its structure to the engine while it is drawn, once for each structure', () => {
  const reports = [];
  const onFilm = (outline) => reports.push(outline.scenes.map((scene) => scene.id).join(' '));
  const film = (ids) => h(Film, null, ...ids.map((id) => h(Scene, {key: id, id, duration: 1})));
  const value = {useTime: () => 0, useCompositionTime: () => 0, fps: 30, width: 1920, height: 1080, onFilm};
  renderToStaticMarkup(h(MotionRuntimeProvider, {value}, film(['a', 'b'])));
  assert.deepEqual(reports, ['a b']);
  renderToStaticMarkup(h(MotionRuntimeProvider, {value: {...value, onFilm: undefined}}, film(['a'])));
  assert.deepEqual(reports, ['a b'], 'an engine with no onFilm hears nothing');
  const Twice = () => h(Fragment, null, film(['a', 'b']), film(['c']));
  renderToStaticMarkup(h(MotionRuntimeProvider, {value: {...value, onFilm: (o) => onFilm(o)}}, h(Twice)));
  assert.deepEqual(reports, ['a b', 'a b', 'c'], 'each Film reports its own structure');
});
