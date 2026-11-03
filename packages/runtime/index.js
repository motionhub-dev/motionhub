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

// ---- the motion's tokens (W3C design tokens) as values ----
const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|math|emoji|ui-[a-z-]+)$/;
const hex = (v) => (typeof v === 'string' ? v : v?.hex ?? `#${(v?.components ?? [0, 0, 0]).map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`);
const color = (v) => (typeof v === 'string' ? v : v?.alpha !== undefined && v.alpha < 1 ? `color-mix(in srgb, ${hex(v)} ${+(v.alpha * 100).toFixed(2)}%, transparent)` : hex(v));
const px = (v) => (typeof v === 'number' ? v : v?.unit === 'rem' ? v.value * 16 : v?.value);
// a spread of 0 is left out, so a shadow works as a text-shadow too
const shadow = (v) => [].concat(v).map((s) => (typeof s === 'string' ? s : `${s.inset ? 'inset ' : ''}${px(s.offsetX) ?? 0}px ${px(s.offsetY) ?? 0}px ${px(s.blur) ?? 0}px${px(s.spread) ? ` ${px(s.spread)}px` : ''} ${color(s.color)}`)).join(', ');
const VALUE = {
  color,
  fontFamily: (v) => [].concat(v).map((f) => (GENERIC.test(f) ? f : `"${f}"`)).join(', '),
  duration: (v) => (v?.unit === 'ms' ? v.value / 1000 : v?.value),
  cubicBezier: (v) => v,
  dimension: px,
  fontWeight: (v) => v,
  number: (v) => v,
  shadow,
};

/**
 * A motion's tokens.json as values, group by group: a color as a CSS colour, a fontFamily as a CSS font stack, a duration in seconds, a cubicBezier as
 * [x1, y1, x2, y2], a dimension in pixels, a shadow as a CSS box-shadow; aliases (`{color.ink}`) resolved. `tokens.color.ink`, `tokens.duration.light`.
 */
export function resolveTokens(dtcg) {
  if (!dtcg) return {};
  const lookup = (path) => path.split('.').reduce((o, k) => o?.[k], dtcg);
  const out = {};
  const walk = (node, path, inherited) => {
    const type = node.$type ?? inherited;
    if ('$value' in node) {
      let value = node.$value, t = type, seen = 0;
      while (typeof value === 'string' && /^\{[^{}]+\}$/.test(value) && seen++ < 8) {
        const target = lookup(value.slice(1, -1));
        value = target?.$value;
        t = t ?? target?.$type;
      }
      const [group, ...rest] = path;
      (out[group] ??= {})[rest.join('-')] = (VALUE[t] ?? ((x) => x))(value);
      return;
    }
    for (const [k, child] of Object.entries(node)) if (!k.startsWith('$') && child && typeof child === 'object') walk(child, [...path, k], type);
  };
  for (const [group, node] of Object.entries(dtcg)) if (!group.startsWith('$') && node && typeof node === 'object') walk(node, [group], node.$type);
  return out;
}

/** Resolved tokens as CSS custom properties, Style Dictionary's way: --color-ink, --font-display, --duration-light (s), --easing-light, --caption-size (px) */
export function tokenVariables(tokens) {
  const vars = {};
  for (const [group, values] of Object.entries(tokens ?? {})) {
    for (const [name, v] of Object.entries(values)) {
      const key = `--${group}-${name}`;
      vars[key] = group === 'duration' && typeof v === 'number' ? `${v}s` : Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === 'number') ? `cubic-bezier(${v.join(', ')})` : typeof v === 'number' && /^(caption|size|space|radius)/.test(group) && !/weight/.test(name) ? `${v}px` : String(v);
    }
  }
  return vars;
}

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
