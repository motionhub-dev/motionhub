// @motionhub/remotion: a motion in Remotion. <MotionProvider> gives a motion's React components the runtime they draw with
// (@motionhub/runtime) from Remotion's own frame, so they run unchanged; <MotionFonts> loads its faces; useMotion() turns its
// tokens into Remotion values (frames, Easing) for anything you draw yourself.
import {createElement, useEffect, useMemo, useState} from 'react';
import {Easing, OffthreadVideo, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {MotionRoot, MotionRuntimeProvider, resolveTokens, useTokens} from '@motionhub/runtime';

const sequenceSeconds = () => useCurrentFrame() / useVideoConfig().fps;

/** The runtime's <Video> on Remotion's: `src` (a URL, or a path in public/), shown from `startAt` s, its source from `trimBefore` s */
const RemotionVideo = ({src, startAt = 0, trimBefore = 0, playbackRate = 1, objectFit = 'cover', style}) => {
  const {fps} = useVideoConfig();
  const url = /^(https?:|\/|data:|blob:)/.test(src) ? src : staticFile(src);
  return createElement(Sequence, {from: Math.round(startAt * fps), layout: 'none'},
    createElement(OffthreadVideo, {src: url, trimBefore: Math.round(trimBefore * fps), playbackRate, style: {width: '100%', height: '100%', objectFit, ...style}}));
};

/**
 * Wrap the composition in it once, outside every <Sequence>, with the motion's tokens.json: `import tokens from '../motion/tokens.json'`. Its components
 * then draw by Remotion's frame: useTime() inside a <Sequence> counts from its start. `root={false}` leaves out the full-frame root that sets the
 * tokens' custom properties (--color-*, --font-*).
 */
export const MotionProvider = ({tokens, root = true, children}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const resolved = useMemo(() => resolveTokens(tokens), [tokens]);
  const value = {useTime: sequenceSeconds, useCompositionTime: () => frame / fps, fps, width, height, tokens: resolved, Video: RemotionVideo};
  return createElement(MotionRuntimeProvider, {value}, root ? createElement(MotionRoot, {tokens: resolved}, children) : children);
};

// ---- the motion's faces, from Google Fonts, before the first frame ----
const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|math|emoji|ui-[a-z-]+)$/;
const HAN = /^(Noto (Sans|Serif) (SC|TC|JP|KR)|LXGW WenKai|Fusion Pixel.*)$/;
/** The family names in the tokens' font stacks */
export const families = (resolved) => [...new Set(Object.values(resolved?.font ?? {}).flatMap((s) => String(s).split(',').map((f) => f.trim().replace(/^["']|["']$/g, ''))))].filter((f) => f && !GENERIC.test(f));
const css = async (family) => {
  const name = encodeURIComponent(family).replace(/%20/g, '+');
  // Google Fonts refuses a weight range a face does not span, so ask for the common ones in turn, then its default weight
  for (const axes of [':wght@100..900', ':wght@200..900', ':wght@100..800', ':wght@200..800', ':wght@300..800', ':wght@300..700', ':wght@400..700', ':wght@400;700', '']) {
    const res = await fetch(`https://fonts.googleapis.com/css2?family=${name}${axes}&display=block`).catch(() => undefined);
    if (res?.ok) return res.text();
  }
  return undefined;
};
/**
 * Loads the faces the tokens name, inside <MotionProvider>. Faces for Chinese, Japanese and Korean are large and load only with `han`; one Google Fonts
 * does not have is named in the console and left to the stack's next face (bundle it with @remotion/fonts).
 */
export const MotionFonts = ({han = false}) => {
  const tokens = useTokens();
  const [handle] = useState(() => delayRender('the motion\'s faces'));
  useEffect(() => {
    const wanted = families(tokens).filter((f) => han || !HAN.test(f));
    Promise.all(wanted.map(async (family) => {
      const text = await css(family);
      if (!text) { console.warn(`@motionhub/remotion: Google Fonts has no "${family}"; load it with @remotion/fonts`); return; }
      const el = document.createElement('style');
      el.textContent = text;
      document.head.appendChild(el);
      await Promise.all(['400', '700'].map((w) => document.fonts.load(`${w} 32px "${family}"`).catch(() => undefined)));
    })).finally(() => continueRender(handle));
  }, [handle]);
  return null;
};

/**
 * The tokens as Remotion values, inside <MotionProvider>: `tokens`, `frames('light')` (a duration token in frames), `ease('light')` (an easing token as
 * Easing.bezier), and `progress(frame, start, 'light', 'light')`: 0 to 1 over that duration with that curve, clamped.
 */
export function useMotion() {
  const tokens = useTokens();
  const {fps} = useVideoConfig();
  const need = (group, name) => {
    const v = tokens[group]?.[name];
    if (v === undefined) throw new Error(`the motion has no ${group} token "${name}": it has ${Object.keys(tokens[group] ?? {}).join(', ') || 'none'}`);
    return v;
  };
  const frames = (name) => Math.max(1, Math.round(need('duration', name) * fps));
  const ease = (name) => Easing.bezier(...need('easing', name));
  const progress = (frame, start, duration, easing) => interpolate(frame, [start, start + frames(duration)], [0, 1], {easing: easing ? ease(easing) : undefined, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return {tokens, fps, frames, ease, progress};
}
