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

// ---- the motion's faces, from Google Fonts (or where it has none), before the first frame ----
const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|math|emoji|ui-[a-z-]+)$/;
const HAN = /^(Noto (Sans|Serif) (SC|TC|JP|KR)|LXGW WenKai|Fusion Pixel.*)$/;
/** The family names in the tokens' font stacks */
export const families = (resolved) => [...new Set(Object.values(resolved?.font ?? {}).flatMap((s) => String(s).split(',').map((f) => f.trim().replace(/^["']|["']$/g, ''))))].filter((f) => f && !GENERIC.test(f));
/** Faces Google Fonts does not have (it only has "LXGW WenKai TC"), by family: stylesheets of the OFL-1.1 npm package, split by unicode-range */
const ELSEWHERE = {
  'LXGW WenKai': ['regular', 'bold'].map((w) => `https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1/lxgwwenkai-${w}.css`),
};
/** A stylesheet from a URL, its relative `url()`s made absolute: it is set in a <style>, where they would not resolve */
const sheet = async (href) => {
  const res = await fetch(href).catch(() => undefined);
  if (!res?.ok) return undefined;
  return (await res.text()).replace(/url\((["']?)(?![a-z]+:|\/\/|data:)([^)"']+)\1\)/gi, (_, q, path) => `url(${q}${new URL(path, href).href}${q})`);
};
/** The stylesheet texts for a family, [] when no source has it */
const css = async (family) => {
  if (ELSEWHERE[family]) return (await Promise.all(ELSEWHERE[family].map(sheet))).filter(Boolean);
  const text = await google(family);
  return text ? [text] : [];
};
const google = async (family) => {
  const name = encodeURIComponent(family).replace(/%20/g, '+');
  // Google Fonts refuses a weight range a face does not span, so ask for the common ones in turn, then its default weight
  for (const axes of [':wght@100..900', ':wght@200..900', ':wght@100..800', ':wght@200..800', ':wght@300..800', ':wght@300..700', ':wght@400..700', ':wght@400;700', '']) {
    const res = await fetch(`https://fonts.googleapis.com/css2?family=${name}${axes}&display=block`).catch(() => undefined);
    if (res?.ok) return res.text();
  }
  return undefined;
};
/**
 * Loads the faces the tokens name, inside <MotionProvider>. Faces for Chinese, Japanese and Korean are large and load only with `han`; one no source
 * has is named in the console and left to the stack's next face (bundle it with @remotion/fonts).
 */
export const MotionFonts = ({han = false}) => {
  const tokens = useTokens();
  const [handle] = useState(() => delayRender('the motion\'s faces'));
  useEffect(() => {
    const wanted = families(tokens).filter((f) => han || !HAN.test(f));
    Promise.all(wanted.map(async (family) => {
      const texts = await css(family);
      if (!texts.length) {
        // a face a Chinese, Japanese or Korean motion is written for must not fall back unseen
        const message = `@motionhub/remotion: no source has "${family}"; load it with @remotion/fonts`;
        if (HAN.test(family)) console.error(message); else console.warn(message);
        return;
      }
      for (const text of texts) {
        const el = document.createElement('style');
        el.textContent = text;
        document.head.appendChild(el);
      }
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
