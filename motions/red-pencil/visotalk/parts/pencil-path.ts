// The red pencil's hand: points along a mark, pushed off their line by a slow deterministic wobble, written as an SVG path with its length.
import {random} from '@visotalk/runtime';

export type Pt = [number, number];

/** Each point nudged along the line's normal by a smooth wave whose phases come from `key`, so the same mark is the same every frame */
export function wobble(points: Pt[], key: string, amount = 3): Pt[] {
  const r = random(key);
  const a = r() * Math.PI * 2, b = r() * Math.PI * 2;
  return points.map(([x, y], i) => {
    const prev = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)];
    const dx = next[0] - prev[0], dy = next[1] - prev[1], n = Math.hypot(dx, dy) || 1;
    const t = i / Math.max(1, points.length - 1);
    const off = amount * (Math.sin(t * 5.1 + a) * 0.7 + Math.sin(t * 13.7 + b) * 0.3);
    return [x - (dy / n) * off, y + (dx / n) * off];
  });
}

/** An oval that starts at an angle and runs past where it began, as a pencil circling a figure does */
export function oval(cx: number, cy: number, rx: number, ry: number, key: string): Pt[] {
  const r = random(`${key}:oval`);
  const start = -2.4 + r() * 0.6, run = Math.PI * 2 + 0.35 + r() * 0.25, steps = 72;
  return Array.from({length: steps + 1}, (_, i) => {
    const t = start + (run * i) / steps;
    const grow = 1 + 0.06 * (i / steps); // the second pass lands a little outside the first
    return [cx + rx * grow * Math.cos(t), cy + ry * grow * Math.sin(t)] as Pt;
  });
}

/** A stroke from a to b with a slight bow */
export function stroke(a: Pt, b: Pt, key: string, bow = 0.03): Pt[] {
  const bend = (random(`${key}:bow`)() - 0.5) * 2 * bow;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  return Array.from({length: 25}, (_, i) => {
    const t = i / 24, lift = Math.sin(Math.PI * t) * bend;
    return [a[0] + dx * t - dy * lift, a[1] + dy * t + dx * lift] as Pt;
  });
}

export const pathOf = (points: Pt[]) => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
export const lengthOf = (points: Pt[]) => points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - points[i][0], p[1] - points[i][1]), 0);
