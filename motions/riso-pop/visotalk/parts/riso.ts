/**
 * The press every Riso Pop component prints through. A frame is a sheet of paper printed with two plates: blue first, the key plate that carries
 * every silhouette and word, then pink. Each plate is one ink, multiplied onto the paper and onto the other plate, so where they overlap a third
 * colour, violet, appears that no plate holds. Tone is never a gradient: it is a halftone screen of dots on the plate's own angle, fixed to the
 * paper, whose size is the tone. The plates sit a few pixels out of register, and can be knocked out of register on an accent (`slip`) and snap
 * back. Every component draws on the full 1920 × 1080 canvas, so screens and offsets agree between parts.
 */
import {createElement as h, useRef, type ReactNode} from 'react';

export const W = 1920, H = 1080;
export type Ink = 'blue' | 'pink';
export type Pt = [number, number];

/** a full-canvas SVG; it multiplies onto everything beneath it, as ink does on a sheet that already carries the other plate */
export const CANVAS = {viewBox: `0 0 ${W} ${H}`, width: W, height: H, style: {position: 'absolute', left: 0, top: 0, overflow: 'visible', mixBlendMode: 'multiply'}} as const;

export const INK: Record<Ink, string> = {blue: 'var(--vt-data)', pink: 'var(--vt-grad)'};
/** paper: what a knocked-out word or a zero of ink shows */
export const PAPER = 'var(--vt-bg)';
/** each plate's screen: angles 60° apart so the two screens make a fine rosette, not moiré */
export const SCREEN: Record<Ink, {angle: number; period: number}> = {blue: {angle: 15, period: 14}, pink: {angle: 75, period: 14}};
/** where each plate lands when nothing knocks it: the pink a few pixels off, as every run of a duplicator is */
export const REG: Record<Ink, Pt> = {blue: [0, 0], pink: [4, -3]};
/** the tints a plate may carry besides solid: four stepped screens, never a ramp */
export const TINTS = [0.15, 0.3, 0.5, 0.7] as const;

export const unit = (v: number) => Math.max(0, Math.min(1, v));
export const easeOut = (t: number) => 1 - (1 - unit(t)) ** 3;
const easeOutBack = (t: number, s = 1.7) => { const u = unit(t) - 1; return 1 + (s + 1) * u ** 3 + s * u ** 2; };

/** An id safe inside url(#…) and unique in the page: every part is its own React root, so React's useId repeats across parts */
let mounted = 0;
export const useSvgId = () => {
  const ref = useRef('');
  if (!ref.current) ref.current = `rp${++mounted}`;
  return ref.current;
};

/**
 * The knock: `slip` tweened 0 to 1 linearly (about 1.4 s) throws the plates apart in a fifth of its run, holds them apart with a small dying
 * wobble, then snaps them back into register in one frame at 0.86. The snap is a cut, not a settle: a gradual return reads as nothing.
 */
export const slipAmount = (slip: number) => {
  if (slip <= 0 || slip >= 0.86) return 0;
  if (slip < 0.16) return easeOutBack(slip / 0.16, 2.2);
  const t = slip - 0.16;
  return 1 + 0.14 * Math.sin(t * 46) * Math.exp(-t * 5);
};
/** where a plate lands, given the knock: pink goes right and up, blue a little the other way, so the pair splits rather than slides */
export const offset = (ink: Ink, slip = 0): Pt => {
  const k = slipAmount(slip), [x, y] = REG[ink];
  return ink === 'pink' ? [x + 24 * k, y - 9 * k] : [x - 10 * k, y + 4 * k];
};

/** the tint step nearest a tone, so a plate never carries a tone the press could not screen */
export const step = (t: number) => (t >= 0.85 ? 1 : TINTS.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a)));
/** the fill of a plate at a tint: solid ink, or its stepped screen */
export const tint = (ink: Ink, t = 1) => { const s = step(t); return s >= 1 ? INK[ink] : `url(#rp-${ink}-${Math.round(s * 100)})`; };

/** The screens, as patterns anchored to the sheet. Every component's SVG carries them (the same ids, the same content, so whichever the page finds first is right). */
export function Screens() {
  return h('defs', null, ...(['blue', 'pink'] as Ink[]).flatMap((ink) => TINTS.map((t) => {
    const {angle, period: p} = SCREEN[ink], r = Math.min(p * 0.56, p * Math.sqrt(t / Math.PI));
    return h('pattern', {key: `${ink}${t}`, id: `rp-${ink}-${Math.round(t * 100)}`, patternUnits: 'userSpaceOnUse', width: p, height: p, patternTransform: `rotate(${angle})`},
      h('circle', {cx: p / 2, cy: p / 2, r, fill: INK[ink]}));
  })));
}

/**
 * Halftone of a tone that varies over the sheet: one dot per screen cell, its area the tone at that cell. `field(x, y)` is 0 to 1; the dots sit on
 * the plate's screen angle, anchored to the sheet, so a tone that grows grows its dots in place. One path for all the dots.
 */
export function dotsPath(ink: Ink, field: (x: number, y: number) => number, box: [number, number, number, number]): string {
  const {angle, period: p} = SCREEN[ink], a = (angle * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const [x0, y0, x1, y1] = box;
  // the box's corners in screen coordinates (u along the screen, v across it)
  const us = [x0 * c + y0 * s, x1 * c + y0 * s, x0 * c + y1 * s, x1 * c + y1 * s], vs = [-x0 * s + y0 * c, -x1 * s + y0 * c, -x0 * s + y1 * c, -x1 * s + y1 * c];
  const i0 = Math.floor(Math.min(...us) / p), i1 = Math.ceil(Math.max(...us) / p), j0 = Math.floor(Math.min(...vs) / p), j1 = Math.ceil(Math.max(...vs) / p);
  let d = '';
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    const u = (i + 0.5) * p, v = (j + 0.5) * p, x = u * c - v * s, y = u * s + v * c;
    if (x < x0 || x > x1 || y < y0 || y > y1) continue;
    const t = unit(field(x, y));
    if (t < 0.03) continue;
    const r = Math.min(p * 0.6, p * Math.sqrt(t / Math.PI));
    d += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0`;
  }
  return d;
}

/**
 * One plate: its ink multiplied onto the sheet, at its register (plus the knock). `print` 0 to 1 is the roller laying this plate down the sheet over
 * `box` (top to bottom, the way the paper feeds), with the heavier band of fresh ink at its edge; at 1 the plate is simply there.
 */
export function Plate({ink, slip = 0, print = 1, box = [0, 0, W, H], children}: {ink: Ink; slip?: number; print?: number; box?: [number, number, number, number]; children: ReactNode}) {
  const id = useSvgId();
  if (print <= 0) return null;
  const [dx, dy] = offset(ink, slip), [x0, y0, x1, y1] = box;
  const edge = y0 + (y1 - y0 + 40) * easeOut(print), rolling = print < 1;
  const body = h('g', {transform: dx || dy ? `translate(${dx} ${dy})` : undefined, fill: INK[ink]}, children);
  return h('g', {style: {mixBlendMode: 'multiply'}},
    rolling && h('clipPath', {id}, h('rect', {x: x0 - 60, y: y0 - 60, width: x1 - x0 + 120, height: Math.max(0, edge - y0 + 60)})),
    rolling && h('clipPath', {id: `${id}b`}, h('rect', {x: x0 - 60, y: edge - 26, width: x1 - x0 + 120, height: 26})),
    h('g', {clipPath: rolling ? `url(#${id})` : undefined}, body),
    rolling && h('g', {clipPath: `url(#${id}b)`, opacity: 0.35}, body));
}

/** A word printed on a plate: SVG text, so it misregisters and grains with its ink */
export function Print({x, y, size, children, face = 'display', weight, anchor = 'start', fill, spacing}: {x: number; y: number; size: number; children: ReactNode; face?: 'display' | 'sans'; weight?: number; anchor?: 'start' | 'middle' | 'end'; fill?: string; spacing?: string}) {
  const display = face === 'display';
  return h('text', {x, y, fontSize: size, textAnchor: anchor, fill, style: {fontFamily: display ? 'var(--vt-display)' : 'var(--vt-sans)', fontWeight: weight ?? (display ? 900 : 700),
    letterSpacing: spacing ?? (display ? '-0.01em' : '0.01em'), fontVariationSettings: display ? '"SOFT" 100, "WONK" 0' : undefined}}, children);
}

/** A closed blob: a circle whose edge wanders a little, the same every frame for one seed (no random numbers: sums of sines) */
export function blob(cx: number, cy: number, r: number, seed = 1, wobble = 0.07): string {
  const n = 48, pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + wobble * (Math.sin(a * 2 + seed * 1.7) * 0.6 + Math.sin(a * 3 + seed * 2.9) * 0.3 + Math.sin(a * 5 + seed * 0.7) * 0.15);
    pts.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]);
  }
  // a closed Catmull-Rom curve through the points, as cubic Béziers
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}
