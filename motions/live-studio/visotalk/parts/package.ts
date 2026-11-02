// The material of Live Studio: a broadcast graphics package over someone else's picture. Every piece is built from the same three strips (a channel-red
// block, a white plate with ink type, an ink strip with white type), cut square, and pushed on in layers: the red first, the plate out of it, the type
// up into its plate. Nothing is rounded, glassy or glowing.
import type React from 'react';
import {createElement as h} from 'react';

export const unit = (v: number) => Math.max(0, Math.min(1, v));
/** The part of a 0–1 progress that falls between `a` and `b`, with a broadcast push: fast off the mark, settling hard (quartic out) */
export const stage = (p: number, a: number, b: number) => {
  const t = unit((p - a) / (b - a));
  return 1 - (1 - t) ** 4;
};
/** How fast a stage is moving at progress p (0 at rest, 4 at its start): what a piece leans and blurs by while it travels */
export const speedOf = (p: number, a: number, b: number) => {
  const t = (p - a) / (b - a);
  return t <= 0 || t >= 1 ? 0 : 4 * (1 - t) ** 3;
};
/**
 * A piece slid out from behind the edge it hangs on (the red bar, a tab), fast off the mark and braking hard: it leans into its travel and blurs while it
 * moves, sharp the moment it lands. Put it inside a slot that masks it (`slot`), so it appears out of the edge rather than over the footage.
 */
export const slide = (p: number, a: number, b: number, from: 'left' | 'right' | 'top' | 'bottom' = 'left'): React.CSSProperties => {
  const e = stage(p, a, b), v = speedOf(p, a, b);
  const off = ((1 - e) * 104).toFixed(2), lean = (v * 3).toFixed(2);
  const move = {left: `translateX(-${off}%) skewX(-${lean}deg)`, right: `translateX(${off}%) skewX(${lean}deg)`, top: `translateY(-${off}%)`, bottom: `translateY(${off}%)`}[from];
  return {transform: move, transformOrigin: from === 'right' ? 'right' : 'left', filter: v > 0.15 ? `blur(${Math.min(5, v * 1.6).toFixed(2)}px)` : undefined, visibility: p <= a ? 'hidden' : undefined};
};
/** The slot a piece slides through: it masks what has not come out yet, and is marked as a frame the piece moves through so a check reads no overflow */
export const slot: React.CSSProperties = {overflow: 'hidden', position: 'relative'};
/** A single glint across a red block once it has landed: a narrow band of light swept corner to corner. One a piece, never on every piece at once. */
export function Sheen({p}: {p: number}) {
  const t = unit(p);
  if (t <= 0 || t >= 1) return null;
  const x = (-60 + t * 220).toFixed(1);
  return h('div', {'data-vt-camera': '', style: {position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'}},
    h('div', {style: {position: 'absolute', top: '-20%', bottom: '-20%', left: `${x}%`, width: '34%', transform: 'skewX(-24deg)',
      background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%)'}}));
}
/** The channel colour, the one accent of the package */
export const RED = 'var(--vt-data)';
/** The ink strip: nearly opaque, so white type reads on any shot */
export const ink: React.CSSProperties = {background: 'color-mix(in srgb, var(--vt-panel) 94%, transparent)', color: 'var(--vt-text)'};
/** The white plate: ink type on it, the strip a name or a headline is set on */
export const plate: React.CSSProperties = {background: 'var(--vt-text)', color: 'var(--vt-bg)'};
/** The shadow every piece casts on the footage: short and soft, so it sits on the picture rather than in it */
export const shade = '0 16px 34px -16px rgba(0, 0, 0, 0.9)';
/** A tab or label: condensed capitals in the display face */
export const label: React.CSSProperties = {fontFamily: 'var(--vt-display)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1};
/** A wipe that uncovers its content from one side as `p` goes from 0 to 1 */
export const wipe = (p: number, from: 'left' | 'right' | 'top' | 'bottom' = 'left'): React.CSSProperties => {
  const rest = (100 * (1 - unit(p))).toFixed(2);
  const sides = {left: `0 ${rest}% 0 0`, right: `0 0 0 ${rest}%`, top: `0 0 ${rest}% 0`, bottom: `${rest}% 0 0 0`}[from];
  return {clipPath: `inset(${sides})`};
};
/** Type pushed up into its strip from below the strip's edge: it moves down by a share of its height and is cut at the line where the strip ends */
export const rise = (p: number, by = 1.1): React.CSSProperties => ({transform: `translateY(${((1 - unit(p)) * by * 100).toFixed(2)}%)`});
/** The strip that type rises into: it masks what has not risen yet. Marked as a frame the type moves through, so a check does not read the mask as text cut off. */
export const mask = {'data-vt-camera': '', style: {overflow: 'hidden'} as React.CSSProperties};
/**
 * A word that changes by rolling: the old one goes up and out, the new one comes up from below, inside a box that clips them. `p` 0 shows `from`, 1 shows `to`.
 */
export function Roll({from, to, p, style}: {from: React.ReactNode; to: React.ReactNode; p: number; style?: React.CSSProperties}) {
  const t = unit(p);
  if (t <= 0) return h('div', {style}, from);
  if (t >= 1) return h('div', {style}, to);
  const e = t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;
  const up = (e * 100).toFixed(2), down = ((1 - e) * 100).toFixed(2);
  return h('div', {'data-vt-camera': '', style: {...style, position: 'relative', overflow: 'hidden'}},
    h('div', {style: {visibility: 'hidden'}}, to),
    h('div', {style: {position: 'absolute', inset: 0, transform: `translateY(-${up}%)`}}, from),
    h('div', {style: {position: 'absolute', inset: 0, transform: `translateY(${down}%)`}}, to));
}
/**
 * Digits that roll into place like a stadium board: each place is a column of 0–9 moved to its digit; a higher place turns over only while the place
 * below it passes from 9 to 0, as an odometer does. `value` may be fractional while it is tweened.
 */
export function Digits({value, places, style}: {value: number; places: number; style?: React.CSSProperties}) {
  const v = Math.max(0, value);
  const cols = Array.from({length: places}, (_, i) => {
    const pow = 10 ** (places - 1 - i);
    const whole = Math.floor(v / pow);
    const frac = v / pow - whole;
    const turning = pow > 1 ? unit(((v % pow) / pow - 0.9) / 0.1) : frac;
    return (whole % 10) + turning;
  });
  const cell: React.CSSProperties = {display: 'block', height: '1em', lineHeight: '1em'};
  return h('span', {style: {display: 'inline-flex', ...style}}, cols.map((d, i) =>
    h('span', {key: i, 'data-vt-camera': '', style: {display: 'inline-block', position: 'relative', overflow: 'hidden', height: '1em', width: '0.56em', textAlign: 'center'}},
      h('span', {style: {position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${(-d).toFixed(3)}em)`,
        filter: d % 1 > 0.02 && d % 1 < 0.98 ? `blur(${(Math.sin(Math.PI * (d % 1)) * 4).toFixed(2)}px)` : undefined}},
        Array.from({length: 11}, (_, n) => h('span', {key: n, style: cell}, String(n % 10)))))));
}
