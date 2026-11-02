// The drafting kit every part draws with: the line weights and their meanings, and a stroke that draws itself on a progress, dashed or not.
import {createElement as h, useRef} from 'react';

/** What a line is, which decides its weight, colour and dash: outlines are the object, detail its edges inside, thin the dimensions, leaders and hatching, centre and hidden the conventions */
export type Weight = 'outline' | 'detail' | 'thin' | 'centre' | 'hidden';
export const LINE: Record<Weight, {width: number; color: string; dash?: string}> = {
  outline: {width: 4, color: 'var(--vt-text)'},
  detail: {width: 2.5, color: 'var(--vt-text)'},
  thin: {width: 1.75, color: 'var(--vt-muted)'},
  centre: {width: 2, color: 'var(--vt-muted)', dash: '34 7 6 7'},
  hidden: {width: 2, color: 'var(--vt-muted)', dash: '12 8'},
};
/** The one warm colour: the size being said, the cut being made */
export const ACCENT = 'var(--vt-grad)';

/** 0 to 1, whatever is passed */
export const unit = (v: number) => Math.max(0, Math.min(1, v));
/** The part of a progress that falls between `a` and `b`, as 0 to 1 */
export const phase = (p: number, a: number, b: number) => unit((p - a) / (b - a));
/** Ease in and out, like a pen guided along a straightedge */
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** A part arriving at its place: fast, a small overshoot, then seated, as a fitted part clicks home */
export const settle = (t: number, over = 1.2) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + (over + 1) * Math.pow(t - 1, 3) + over * Math.pow(t - 1, 2));

/** The point at `p` (0 to 1) along a path written with absolute M, L, H, V and Z, by length; null for curves and arcs, which the nib does not follow */
export function pointAt(d: string, p: number): [number, number] | null {
  if (/[^MLHVZ\d\s.,-]/i.test(d) || /[a-z]/.test(d)) return null;
  const segs: number[][] = [];
  let x = 0, y = 0, sx = 0, sy = 0;
  for (const [, c, args] of d.matchAll(/([MLHVZ])([^MLHVZ]*)/g)) {
    const n = (args.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    if (c === 'M') { x = sx = n[0]; y = sy = n[1]; for (let i = 2; i + 1 < n.length; i += 2) { segs.push([x, y, n[i], n[i + 1]]); x = n[i]; y = n[i + 1]; } }
    else if (c === 'L') for (let i = 0; i + 1 < n.length; i += 2) { segs.push([x, y, n[i], n[i + 1]]); x = n[i]; y = n[i + 1]; }
    else if (c === 'H') n.forEach((v) => { segs.push([x, y, v, y]); x = v; });
    else if (c === 'V') n.forEach((v) => { segs.push([x, y, x, v]); y = v; });
    else { segs.push([x, y, sx, sy]); x = sx; y = sy; }
  }
  const total = segs.reduce((a, [x0, y0, x1, y1]) => a + Math.hypot(x1 - x0, y1 - y0), 0);
  let left = unit(p) * total;
  for (const [x0, y0, x1, y1] of segs) {
    const l = Math.hypot(x1 - x0, y1 - y0);
    if (left <= l) { const f = l ? left / l : 0; return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]; }
    left -= l;
  }
  return segs.length ? [segs[segs.length - 1][2], segs[segs.length - 1][3]] : null;
}

/** The plotter's pen at the head of a line being drawn: a fine cross and ring, there only while the line draws */
export function nib(at: [number, number] | null) {
  if (!at) return null;
  const [x, y] = at;
  return h('g', {opacity: 0.95},
    h('path', {d: `M${x - 14} ${y} H${x - 5} M${x + 5} ${y} H${x + 14} M${x} ${y - 14} V${y - 5} M${x} ${y + 5} V${y + 14}`, stroke: 'var(--vt-text)', strokeWidth: 1.5}),
    h('circle', {cx: x, cy: y, r: 3.5, fill: 'var(--vt-text)'}));
}

/** An id safe inside url(#…), unique in the page: every part is its own React root, so useId repeats across parts; a number taken once per mount does not */
let mounted = 0;
export const useSvgId = () => {
  const ref = useRef('');
  if (!ref.current) ref.current = `dt${++mounted}`;
  return ref.current;
};

/**
 * One SVG path drawn from its start as `draw` goes from 0 to 1. A dashed line is revealed through a mask, so its dashes stay put on the paper while it draws.
 * A pen's nib rides the head of a straight-sided line while it draws.
 * `solid` fills the closed shape with the sheet's colour first, so a part in front hides the lines behind it, as on a drawing.
 */
export function Stroke({d, draw = 1, weight = 'outline', accent = false, solid = false, width}: {d: string; draw?: number; weight?: Weight; accent?: boolean; solid?: boolean; width?: number}) {
  const id = useSvgId();
  const line = LINE[weight];
  const w = width ?? line.width;
  const color = accent ? ACCENT : line.color;
  const p = unit(draw);
  if (p <= 0) return null;
  const head = p < 1 ? nib(pointAt(d, p)) : null;
  const fill = solid ? h('path', {d, fill: 'var(--vt-panel)', stroke: 'none', fillRule: 'evenodd', opacity: unit((p - 0.6) / 0.4)}) : null;
  if (!line.dash) return h('g', null, fill, h('path', {d, fill: 'none', stroke: color, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round', pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - p}), head);
  return h('g', null, fill,
    h('mask', {id, maskUnits: 'userSpaceOnUse', x: -4000, y: -4000, width: 8000, height: 8000},
      h('path', {d, fill: 'none', stroke: '#fff', strokeWidth: w + 8, strokeLinecap: 'square', pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - p})),
    h('path', {d, fill: 'none', stroke: color, strokeWidth: w, strokeDasharray: line.dash, mask: `url(#${id})`}), head);
}

/** Lettering, typed left to right as `write` goes from 0 to 1: the drawing's labels are mono capitals, as a draughtsman letters them */
export const lettering = (size: number) => ({fontFamily: 'var(--vt-mono)', fontSize: size, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const, lineHeight: 1.25});
export const typed = (write: number) => ({clipPath: `inset(-30% ${((1 - unit(write)) * 100).toFixed(1)}% -30% -2%)`});

/** The box round a path written with absolute M, L, H, V and Z (as hatched regions are): [x0, y0, x1, y1] */
export function bounds(d: string): [number, number, number, number] {
  const xs: number[] = [], ys: number[] = [];
  let x = 0, y = 0;
  for (const [, cmd, args] of d.matchAll(/([MLHVZ])([^MLHVZ]*)/gi)) {
    const n = (args.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    const c = cmd.toUpperCase();
    if (c === 'H') n.forEach((v) => { x = v; xs.push(x); ys.push(y); });
    else if (c === 'V') n.forEach((v) => { y = v; xs.push(x); ys.push(y); });
    else if (c !== 'Z') for (let i = 0; i + 1 < n.length; i += 2) { x = n[i]; y = n[i + 1]; xs.push(x); ys.push(y); }
  }
  return xs.length ? [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] : [0, 0, 0, 0];
}

/** Parallel hatch lines at `angle` degrees, `spacing` apart, cut to the box [x0, y0, x1, y1], as one path */
export function hatchLines([x0, y0, x1, y1]: [number, number, number, number], angle = 45, spacing = 14): string {
  const a = (angle * Math.PI) / 180, dx = Math.cos(a), dy = -Math.sin(a); // up and to the right at 45°
  const nx = -dy, ny = dx, out: string[] = [];
  const corners = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([px, py]) => px * nx + py * ny);
  for (let c = Math.min(...corners); c <= Math.max(...corners); c += spacing) {
    // the line {p : p·n = c}, cut to the box (Liang–Barsky)
    const ox = nx * c, oy = ny * c;
    let lo = -1e6, hi = 1e6;
    const edge = (p: number, q: number) => { if (Math.abs(p) < 1e-9) return q >= 0; const r = q / p; if (p < 0) lo = Math.max(lo, r); else hi = Math.min(hi, r); return true; };
    if (!edge(-dx, ox - x0) || !edge(dx, x1 - ox) || !edge(-dy, oy - y0) || !edge(dy, y1 - oy) || lo >= hi) continue;
    out.push(`M${(ox + dx * lo).toFixed(1)} ${(oy + dy * lo).toFixed(1)} L${(ox + dx * hi).toFixed(1)} ${(oy + dy * hi).toFixed(1)}`);
  }
  return out.join(' ');
}
