// The material of Marker Margin: a felt-tip marker on the glass in front of someone's footage. Every mark is a stroke with a wet core, a faint streak where
// the felt drags, a slightly ragged edge and a thin dark keyline that keeps it readable on any shot. The same hand writes the words, in white.
import {random} from '@visotalk/runtime';

export type Pt = [number, number];

export const unit = (v: number) => Math.max(0, Math.min(1, v));
/** The part of a 0–1 progress between `a` and `b`, eased out: a hand starts a stroke fast and slows into its end */
export const stage = (p: number, a: number, b: number) => 1 - (1 - unit((p - a) / (b - a))) ** 2.2;

/** The two pens: the marker for every mark, white for every word */
export const INK = {marker: 'var(--vt-data)', white: 'var(--vt-text)'} as const;
export type Ink = keyof typeof INK;
/** The keyline under a stroke or a word: the footage's own darkest tone, half opaque */
export const KEY = 'color-mix(in srgb, var(--vt-bg) 62%, transparent)';

/** Each point pushed off its line by a slow wave whose phases come from `key`, so a mark is the same on every frame */
export function wobble(points: Pt[], key: string, amount = 3): Pt[] {
  const r = random(`${key}:wobble`);
  const a = r() * Math.PI * 2, b = r() * Math.PI * 2;
  return points.map(([x, y], i) => {
    const prev = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)];
    const dx = next[0] - prev[0], dy = next[1] - prev[1], n = Math.hypot(dx, dy) || 1;
    const t = i / Math.max(1, points.length - 1);
    const off = amount * (Math.sin(t * 4.3 + a) * 0.7 + Math.sin(t * 11.9 + b) * 0.3);
    return [x - (dy / n) * off, y + (dx / n) * off];
  });
}

/** A loop scribbled round a point: it starts high on the left, runs once round and on past its start, the second pass wider, as a hand circles a thing in a hurry */
export function loop(cx: number, cy: number, rx: number, ry: number, key: string, turns = 1.2, tilt = 0): Pt[] {
  const r = random(`${key}:loop`);
  const start = -2.5 + r() * 0.5, run = Math.PI * 2 * turns + r() * 0.3, steps = Math.round(64 * turns);
  const c = Math.cos(tilt), s = Math.sin(tilt);
  return Array.from({length: steps + 1}, (_, i) => {
    const t = start + (run * i) / steps, grow = 1 + 0.09 * (i / steps);
    const x = rx * grow * Math.cos(t), y = ry * grow * Math.sin(t);
    return [cx + x * c - y * s, cy + x * s + y * c] as Pt;
  });
}

/** A stroke from a to b, bowed by `bow` (a share of its length, signed) */
export function curve(a: Pt, b: Pt, bow = 0.12, steps = 32): Pt[] {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  return Array.from({length: steps + 1}, (_, i) => {
    const t = i / steps, lift = Math.sin(Math.PI * t) * bow;
    return [a[0] + dx * t - dy * lift, a[1] + dy * t + dx * lift] as Pt;
  });
}

export const pathOf = (points: Pt[]) => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
export const lengthOf = (points: Pt[]) => points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - points[i][0], p[1] - points[i][1]), 0);

/** The filter that frays a stroke's edge, one per seed so two marks are never frayed the same */
export const fray = (key: string) => {
  const seed = Math.floor(random(`${key}:fray`)() * 900) + 1;
  return {id: `mm-fray-${seed}`, seed};
};

/** The handwriting: Shantell Sans with its informal and bouncing axes turned up, so letters sit unevenly, as a quick hand writes */
export const hand = {
  fontFamily: 'var(--vt-display)',
  fontVariationSettings: '"INFM" 100, "BNCE" 45',
  fontWeight: 700,
  lineHeight: 1.05,
  whiteSpace: 'pre',
  textShadow: `0 0 1px ${KEY}, 0 0 3px ${KEY}, 0 0 6px ${KEY}, 0 2px 0 ${KEY}, 0 0 16px color-mix(in srgb, var(--vt-bg) 55%, transparent)`,
} as const;
