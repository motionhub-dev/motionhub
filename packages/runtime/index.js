// @motionhub/runtime: what a motion's React components draw with, in any engine. A component reads its time and its
// frame size from the engine and its values from the motion's tokens, never from a clock or a page of its own, so the same
// moment always draws the same picture. The names follow Remotion's where it has one (useCurrentFrame, useVideoConfig),
// the motion's tokens follow the W3C design tokens format, and their CSS custom properties follow Style Dictionary's
// naming (--color-ink, --font-display). An engine binding (@motionhub/remotion, @motionhub/hyperframes, or an engine's own) supplies
// the runtime through <MotionRuntimeProvider>; this package holds no engine.
import {createContext, createElement, useContext} from 'react';

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
import {tokenVariables} from './tokens.js';

// ---- the runtime an engine provides ----
const Runtime = createContext(null);
/**
 * The engine's side: `value` has `useTime()` (seconds since the component's sequence began, a hook), `useCompositionTime()` (seconds since the film
 * began, a hook), `fps`, `width`, `height`, `tokens` (resolved, as resolveTokens gives them) and, if the engine plays video, `Video`.
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

/** The ground a motion's components expect: the tokens as custom properties, filling the frame */
export const MotionRoot = ({tokens, style, children}) => createElement('div', {
  style: {position: 'absolute', inset: 0, overflow: 'hidden', ...tokenVariables(tokens), ...style},
}, children);

/**
 * The motion's caption: one spoken line on the frame, drawn from the caption group of its tokens: font, size, weight, color, background, radius,
 * padding-y, padding-x, bottom, max-width, shadow (a text shadow), and a rule: rule-left (a bar down its left side) or rule-top (a short bar above it).
 * `opacity` fades it; it stays a function of what you pass.
 */
export const Caption = ({children, opacity = 1, style}) => {
  const c = useTokens().caption ?? {};
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
