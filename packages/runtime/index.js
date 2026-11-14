// @motionhub/runtime: what a motion's React components draw with, in any engine. A component reads its time and its
// frame size from the engine and its values from the motion's tokens, never from a clock or a page of its own, so the same
// moment always draws the same picture. The names follow Remotion's where it has one (useCurrentFrame, useVideoConfig),
// the motion's tokens follow the W3C design tokens format, and their CSS custom properties follow Style Dictionary's
// naming (--color-ink, --font-display). An engine binding (@motionhub/remotion, @motionhub/hyperframes, or an engine's own) supplies
// the runtime through <MotionRuntimeProvider>; this package holds no engine.
import {Children, Fragment, createContext, createElement, isValidElement, useContext, useMemo} from 'react';

// ---- seeded randomness: the same seed gives the same stream on every machine and in every engine ----
/** mulberry32 */
const prng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
/** FNV-1a: a string seed to 32 bits */
const hash = (key) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};
/** A stream of numbers in [0, 1) for `seed` (a string or a number): call it for each next number */
export const seededRandom = (seed) => prng(typeof seed === 'number' ? seed : hash(String(seed)));

export {resolveTokens, tokenVariables} from './tokens.js';
import {resolveTokens, tokenVariables} from './tokens.js';

// ---- the runtime an engine provides ----
const Runtime = createContext(null);
/**
 * The engine's side: `value` has `useTime()` (seconds since the component's sequence began, a hook), `useCompositionTime()` (seconds since the film
 * began, a hook), `fps`, `width`, `height`, `tokens` (resolved, as resolveTokens gives them), if the engine plays video `Video`, if it wants a
 * <Film>'s structure, `onFilm(outline)`.
 */
export const MotionRuntimeProvider = ({value, children}) => createElement(Runtime.Provider, {value}, children);
const runtime = () => {
  const r = useContext(Runtime);
  if (!r) throw new Error('a motion component was drawn outside its engine: wrap the film in the binding\'s provider (@motionhub/remotion <MotionProvider>, @motionhub/hyperframes Motion.mount)');
  return r;
};

/** Seconds since this component's sequence began (Remotion: a <Sequence>; HyperFrames: a composition; another engine: its scene) */
export const useTime = () => runtime().useTime();
/** Seconds since the whole film began */
export const useCompositionTime = () => runtime().useCompositionTime();
/** This sequence's frame, as Remotion's useCurrentFrame() */
export const useCurrentFrame = () => Math.round(useTime() * runtime().fps);
/** The film's frame size and rate, as Remotion's useVideoConfig() */
export const useVideoConfig = () => { const r = runtime(); return {width: r.width, height: r.height, fps: r.fps}; };
/** The motion's tokens, resolved: `useTokens().color.ink` */
export const useTokens = () => runtime().tokens ?? {};

/** A video, timed by its sequence: shown from `startAt` seconds, playing its source from `trimBefore` seconds at `playbackRate`, fitted by `objectFit` */
export const Video = (props) => {
  const V = runtime().Video;
  if (!V) throw new Error(`<Video src="${props.src}">: this engine's binding plays no video`);
  return createElement(V, props);
};

// ---- timing, for a composition of components: Remotion's names, in seconds ----
const bezier = (x1, y1, x2, y2) => {
  const at = (a, b, t) => 3 * a * t * (1 - t) * (1 - t) + 3 * b * t * t * (1 - t) + t * t * t;
  return (x) => {
    if (x <= 0 || x >= 1) return Math.min(1, Math.max(0, x));
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 30; i++) { t = (lo + hi) / 2; if (at(x1, x2, t) < x) lo = t; else hi = t; }
    return at(y1, y2, t);
  };
};
/** Easing curves, each from [0, 1] to [0, 1]; `Easing.bezier(x1, y1, x2, y2)` takes a motion's cubicBezier token */
export const Easing = {
  linear: (x) => x,
  bezier,
  inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  outCubic: (x) => 1 - (1 - x) ** 3,
  outQuart: (x) => 1 - (1 - x) ** 4,
  inOutCubic: (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),
  outBack: (x) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2,
};

/**
 * `input` mapped from the range `inputRange` onto `outputRange` (as many points in each), through `easing`, held at the ends: as Remotion's interpolate,
 * with time in seconds. `interpolate(useTime(), [1, 2.2], [0, 2300], {easing: Easing.outQuart})`
 */
export function interpolate(input, inputRange, outputRange, {easing = Easing.linear, clamp = true} = {}) {
  let i = 1;
  while (i < inputRange.length - 1 && input > inputRange[i]) i++;
  const [a, b] = [inputRange[i - 1], inputRange[i]], [x, y] = [outputRange[i - 1], outputRange[i]];
  let p = b === a ? 1 : (input - a) / (b - a);
  if (clamp) p = Math.min(1, Math.max(0, p));
  return x + (y - x) * easing(p);
}

/**
 * Its children from `from` seconds for `duration` seconds (to the end without one), their useTime() counting from its start: as Remotion's
 * <Sequence>, in seconds. Outside that span it draws nothing.
 */
export const Sequence = ({from = 0, duration = Infinity, children}) => {
  const parent = runtime();
  const t = parent.useTime();
  if (t < from || t >= from + duration) return null;
  const value = {...parent, useTime: () => parent.useTime() - from};
  return createElement(Runtime.Provider, {value}, children);
};

// ---- a film's structure: scenes laid end to end, each with its layers (boxes of React) and its lines (what it says) ----
const InFilm = createContext(false);

/** The elements among `children`, fragments opened */
const elements = (children) => Children.toArray(children).flatMap((c) => (isValidElement(c) && c.type === Fragment ? elements(c.props.children) : [c]));
/** The words of a node's text, its markup left out */
const words = (node) => (typeof node === 'string' || typeof node === 'number' ? String(node) : isValidElement(node) ? words(node.props.children) : Array.isArray(node) ? node.map(words).join('') : '');
const named = (what, id) => {
  if (typeof id !== 'string' || !id) throw new Error(`a <${what}> needs an id`);
  return id;
};

/** Seconds as an error says them */
const round = (value) => Math.round(value * 1000) / 1000;

/** A finite number of seconds from `min` (above it when `above`), or `fallback` when left out */
const seconds = (where, name, value, fallback, {min = 0, above = false} = {}) => {
  if (value === undefined) return fallback;
  if (!(Number.isFinite(value) && (above ? value > min : value >= min))) throw new Error(`${where}: ${name} is a number of seconds ${above ? 'above' : 'from'} ${min}`);
  return value;
};

/**
 * A <Sound> as an engine plays it, in the film's time: from `at` (its parent's start, a scene's or the film's, plus its own `at`), for
 * `dur` seconds of its file (null: the whole file, or with `loop` until `until`), never past `until` (the end of its scene, or of the film).
 */
const sound = (e, start, until) => {
  const {src, at, dur, trim, loop = false, volume = 0, fadeIn, fadeOut, duck} = e.props;
  if (typeof src !== 'string' || !src) throw new Error('a <Sound> needs a src: the file it plays');
  const where = `<Sound src="${src}">`;
  if (!Number.isFinite(volume)) throw new Error(`${where}: volume is in dB, 0 for the file as it is`);
  if (duck !== undefined && !(Number.isFinite(duck) && duck >= 0)) throw new Error(`${where}: duck is how many dB it drops under a narration, 0 or more`);
  return {
    src,
    at: start + seconds(where, 'at', at, 0),
    dur: seconds(where, 'dur', dur, null, {above: true}),
    until,
    trim: seconds(where, 'trim', trim, 0),
    loop: loop === true,
    volume,
    fadeIn: seconds(where, 'fadeIn', fadeIn, 0),
    fadeOut: seconds(where, 'fadeOut', fadeOut, 0),
    ...(duck !== undefined ? {duck} : {}),
  };
};

/**
 * When each of a scene's lines is said, `start` and `end` in the film's seconds. A line's `at` is seconds into its scene,
 * and without one it starts where the line before it ends (the first, at the scene's start); a line without `dur` takes an
 * equal share of the time to the next line that gives its `at`, or to the scene's end. So lines that give no time share
 * their scene evenly.
 */
const timeLines = (lines, start, duration) => {
  const given = lines.map((e) => {
    const where = `<Line id="${e.props.id}">`;
    const at = seconds(where, 'at', e.props.at, undefined);
    if (at !== undefined && at >= duration) throw new Error(`${where}: at is ${at} s, past the end of its scene (${duration} s)`);
    return {where, at, dur: seconds(where, 'dur', e.props.dur, undefined, {above: true})};
  });
  // Lines are said in the order they are written.
  let last = -Infinity;
  for (const g of given) {
    if (g.at === undefined) continue;
    if (g.at < last) throw new Error(`${g.where}: at is ${g.at} s, before the line before it ends (${round(last)} s into the scene)`);
    last = g.at;
  }
  const times = [];
  let cursor = 0;
  for (let i = 0; i < given.length;) {
    // The run of lines from here to the next that gives its at: what they do not give, they share.
    let next = i + 1;
    while (next < given.length && given[next].at === undefined) next++;
    const from = given[i].at ?? cursor;
    // Lines are said one after another: one that starts before the one before it ends would be hidden under it.
    if (from < cursor - 1e-9) throw new Error(`${given[i].where}: at is ${from} s, before the line before it ends (${round(cursor)} s into the scene)`);
    const to = next < given.length ? given[next].at : duration;
    const run = given.slice(i, next);
    const fixed = run.reduce((sum, g) => sum + (g.dur ?? 0), 0);
    const free = run.filter((g) => g.dur === undefined);
    const left = to - from - fixed;
    // Lines that give no time would be said in none, and never shown.
    if (free.length && left <= 1e-9) {
      throw new Error(`${free[0].where}: no time is left for it before ${next < given.length ? `${given[next].where} at ${to} s` : `the end of its scene (${to} s)`}; give it an at, or shorten the lines before it`);
    }
    const share = free.length ? left / free.length : 0;
    cursor = from;
    for (const g of run) {
      const end = Math.min(duration, cursor + (g.dur ?? share));
      times.push({start: start + cursor, end: start + end});
      cursor = end;
    }
    i = next;
  }
  return times;
};

/**
 * The structure of a <Film>'s children, read from the elements themselves without drawing them, so it is known before the first frame:
 * `{seconds, scenes: [{id, start, duration, layers, lines, sounds}], layers, sounds, captions}`, a layer `{id, x, y, w, h, z}` in the frame's
 * pixels (a box left out fills the frame), a line `{id, text, start, end}` (when it is said, in the film's seconds), a sound `{src, at, dur, until, trim, loop, volume, fadeIn, fadeOut, duck?}` in the
 * film's seconds. `layers` and `sounds` are the film's own, across every scene. A scene without an id or a positive duration, an id used
 * twice where it must be unique, and a sound with no file or a time that is no number of seconds, are errors.
 */
export function filmOutline(children, {width = 1920, height = 1080, captions = false} = {}) {
  const box = (e) => ({id: named('Layer', e.props.id), x: e.props.x ?? 0, y: e.props.y ?? 0, w: e.props.w ?? width, h: e.props.h ?? height, z: e.props.z ?? 0});
  const unique = (what, items) => {
    const seen = new Set();
    for (const {id} of items) {
      if (seen.has(id)) throw new Error(`two ${what} are called "${id}"`);
      seen.add(id);
    }
    return items;
  };
  const scenes = [];
  const layers = [];
  // The film's own sounds wait for its length, which is known once every scene is read.
  const own = [];
  let start = 0;
  for (const e of elements(children)) {
    if (!isValidElement(e)) continue;
    if (e.type === Scene) {
      const id = named('Scene', e.props.id);
      const {duration} = e.props;
      if (!(Number.isFinite(duration) && duration > 0)) throw new Error(`<Scene id="${id}"> needs its duration in seconds: duration={4}`);
      const inner = elements(e.props.children).filter(isValidElement);
      const said = inner.filter((c) => c.type === Line);
      const times = timeLines(said, start, duration);
      const lines = said.map((c, i) => ({id: named('Line', c.props.id), text: c.props.text ?? words(c.props.children), ...times[i]}));
      const sounds = inner.filter((c) => c.type === Sound).map((c) => sound(c, start, start + duration));
      scenes.push({id, start, duration, layers: unique(`layers in scene "${id}"`, inner.filter((c) => c.type === Layer).map(box)), lines, sounds});
      start += duration;
    } else if (e.type === Layer) {
      layers.push(box(e));
    } else if (e.type === Sound) {
      own.push(e);
    }
  }
  if (!scenes.length) throw new Error('a <Film> needs at least one <Scene>');
  unique('scenes', scenes);
  unique('lines', scenes.flatMap((scene) => scene.lines));
  unique('of the film\'s own layers', layers);
  // A picked element is told by its layer's id, so a scene's layer may not take the name of one drawn across the film.
  for (const scene of scenes) {
    const taken = scene.layers.find((layer) => layers.some((own) => own.id === layer.id));
    if (taken) throw new Error(`scene "${scene.id}" has a layer called "${taken.id}", the name of one of the film's own layers`);
  }
  return {seconds: start, scenes, layers, sounds: own.map((e) => sound(e, 0, start)), captions: captions === true};
}

/**
 * A film made of scenes: its <Scene>s laid end to end, each drawn only in its span with useTime() counting from its start (the last one holds
 * at the film's end), and anything else among its children (a <Layer>, a background) drawn across them all. It reports its structure
 * (filmOutline) to the engine's `onFilm`, if the engine has one, while it is drawn: the engine learns the length from the scenes.
 */
export const Film = ({captions = false, children}) => {
  const r = runtime();
  // Read on every frame (it is cheap: a film's children are new elements each frame), and reported while drawing, once for each
  // structure, whether or not the engine's onFilm is the same function each time: an engine that renders the film once, off the
  // page, learns it before the first frame is shown.
  const outline = filmOutline(children, {...r, captions});
  const reported = JSON.stringify(outline);
  const onFilm = r.onFilm;
  useMemo(() => onFilm?.(JSON.parse(reported)), [reported]); // eslint-disable-line react-hooks/exhaustive-deps
  const t = r.useTime();
  const only = useContext(OnlyScene);
  if (only !== null && !outline.scenes.some((scene) => scene.id === only)) {
    throw new Error(`<FilmScene id="${only}">: the film has no scene "${only}", only ${outline.scenes.map((scene) => `"${scene.id}"`).join(', ')}`);
  }
  // Drawn one scene at a time (an engine that places each scene itself, as Remotion does in a <Series>), the scene keeps the engine's clock
  // and the rest of the film, its own layers, is drawn on the film's.
  const engine = only === null ? r : {...r, useTime: r.useCompositionTime};
  // The film's time, for its lines: the engine's, or, drawn as one scene, that scene's start on from the engine's.
  const now = only === null ? t : (outline.scenes.find((scene) => scene.id === only)?.start ?? 0) + t;
  const lines = outline.scenes.flatMap((scene) => scene.lines);
  const spoken = lines.find((line) => now >= line.start && now < line.end);
  let index = 0;
  return createElement(Runtime.Provider, {value: engine}, createElement(InFilm.Provider, {value: true}, createElement(Said.Provider, {value: {lines, now}}, elements(children).map((e) => {
    if (!isValidElement(e) || e.type !== Scene) return e;
    const scene = outline.scenes[index++];
    const key = e.key ?? scene.id;
    if (only !== null) return scene.id === only ? createElement(Runtime.Provider, {key, value: r}, e) : null;
    const last = index === outline.scenes.length;
    if (t < scene.start || (t >= scene.start + scene.duration && !(last && t <= outline.seconds))) return null;
    const value = {...r, useTime: () => r.useTime() - scene.start};
    return createElement(Runtime.Provider, {key, value}, e);
  }), captions && spoken ? createElement('div', {key: 'captions', style: {position: 'absolute', inset: 0, zIndex: 2147483647, pointerEvents: 'none'}},
    createElement(Caption, {line: spoken.id})) : null)));
};

/** The film's lines and its time, for a <Caption line> anywhere in it */
const Said = createContext(null);
/** How long a line's caption takes to come and go, in seconds */
const CAPTION_FADE = 0.15;

const OnlyScene = createContext(null);
/**
 * The <Film> under it drawn as its scene `id` alone, on the engine's clock, with the film's own layers on the film's: for an engine that places
 * each scene itself (Remotion: one in each Series.Sequence)
 */
export const FilmScene = ({id, children}) => createElement(OnlyScene.Provider, {value: id}, children);

/** One scene of a <Film>: `duration` seconds of it, `id` naming it. Its children (<Layer>s, <Line>s) belong to it and end with it */
export const Scene = ({id, children}) => {
  if (!useContext(InFilm)) throw new Error(`<Scene id="${id}"> is drawn only inside a <Film>`);
  return createElement('div', {'data-scene': id, style: {position: 'absolute', inset: 0}}, children);
};

/**
 * A box of the frame, `x`, `y`, `w`, `h` in its pixels (the whole frame when left out), stacked by `z`: what it draws is its children, on the
 * clock of the scene it is in (of the film, for one of the film's own). It is shown for the whole of its scene; how its content moves is the
 * content's own, from useTime().
 */
export const Layer = ({id, x = 0, y = 0, w, h, z = 0, style, children}) => {
  const {width, height} = runtime();
  return createElement('div', {
    'data-layer': id,
    style: {position: 'absolute', left: x, top: y, width: w ?? width, height: h ?? height, zIndex: z, ...style},
  }, children);
};

/** What a scene says: its words (the children, or `text` where the caption differs). It draws nothing; an engine may speak or caption it */
export const Line = () => null;

/**
 * A sound the film plays: the file `src`, from `at` seconds of its scene (of the film, for one of the film's own), `dur` seconds of it from
 * `trim` seconds into the file (the whole file without `dur`; with `loop`, again and again to the end of its scene or the film), at `volume`
 * dB (0: as the file is), faded in and out over `fadeIn` and `fadeOut` seconds, and `duck` dB lower while a narration speaks. It draws
 * nothing: the engine plays it, from the film's structure.
 */
export const Sound = () => null;

/** The ground a motion's components expect: the tokens as custom properties, filling the frame */
export const MotionRoot = ({tokens, style, children}) => createElement('div', {
  style: {position: 'absolute', inset: 0, overflow: 'hidden', ...tokenVariables(tokens), ...style},
}, children);

/** Whether `tokens` are a tokens.json (W3C design tokens, with `$value`s) rather than tokens already resolved */
const isDtcg = (tokens) => {
  const walk = (node) => node && typeof node === 'object' && ('$value' in node || Object.values(node).some(walk));
  return walk(tokens);
};

/**
 * Its children drawn in another motion: every component under it reads `tokens` (that motion's tokens.json, or tokens already resolved) from
 * useTokens(), and they are set as custom properties on a full-frame root (`root={false}` leaves it out), while time, frame and size stay the
 * engine's. So one film uses several motions (SPEC.md §13): a <MotionScope> for each scene, or for each part of a frame, in its motion.
 */
export const MotionScope = ({tokens, root = true, children}) => {
  const parent = runtime();
  const resolved = useMemo(() => (isDtcg(tokens) ? resolveTokens(tokens) : tokens ?? {}), [tokens]);
  return createElement(Runtime.Provider, {value: {...parent, tokens: resolved}}, root ? createElement(MotionRoot, {tokens: resolved}, children) : children);
};

/**
 * The motion's caption: one spoken line on the frame, drawn from the caption group of its tokens: font, size, weight, color, background, radius,
 * padding-y, padding-x, bottom, max-width, shadow (a text shadow), and a rule: rule-left (a bar down its left side) or rule-top (a short bar above it).
 * `opacity` fades it; it stays a function of what you pass. With `line`, the id of one of its <Film>'s lines, it draws that line's words while
 * it is said, fading in and out, and nothing at other times.
 */
export const Caption = ({line, children, opacity = 1, style}) => {
  // Both read before anything branches, so a caption calls the same hooks with a line or without.
  const said = useContext(Said);
  const c = useTokens().caption ?? {};
  if (line !== undefined) {
    const spoken = said?.lines.find((l) => l.id === line);
    if (!spoken) throw new Error(`<Caption line="${line}">: ${said ? 'the film has no line by that id' : 'a caption of a line is drawn inside a <Film>'}`);
    const fade = Math.min(1, (said.now - spoken.start) / CAPTION_FADE, (spoken.end - said.now) / CAPTION_FADE);
    if (fade <= 0) return null;
    return createElement(Caption, {opacity: opacity * fade, style}, children ?? spoken.text);
  }
  const py = c['padding-y'] ?? 10, pad = `${py}px ${c['padding-x'] ?? 26}px`;
  const rule = c['rule-left']
    ? createElement('div', {style: {position: 'absolute', left: 0, top: py * 0.6, bottom: py * 0.6, width: 4, borderRadius: 2, background: c['rule-left']}})
    : c['rule-top'] ? createElement('div', {style: {width: 56, height: 3, background: c['rule-top'], margin: '0 auto 8px'}}) : null;
  return createElement('div', {style: {position: 'absolute', left: 0, right: 0, bottom: c.bottom ?? 54, display: 'flex', justifyContent: 'center', opacity, pointerEvents: 'none'}},
    createElement('div', {style: {
      position: 'relative', maxWidth: c['max-width'] ?? 1500, textAlign: 'center', fontFamily: c.font, fontSize: c.size ?? 34, fontWeight: c.weight ?? 400, lineHeight: 1.35,
      color: c.color, background: c.background ?? 'transparent', padding: pad, borderRadius: c.radius ?? 10, textShadow: c.shadow, ...style,
    }}, rule, children));
};
