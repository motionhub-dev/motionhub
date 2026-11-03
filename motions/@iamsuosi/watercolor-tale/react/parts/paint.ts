// Watercolor Tale's paint box: seeded randomness, the pigments as colours, and the outlines a picture book is painted from
// (blobs, leaves, tapered strokes). Everything here is a function of its arguments, so a frame is the same every time it is drawn.

/** 0 to 1, whatever is passed */
export const unit = (v: number) => Math.max(0, Math.min(1, v));
/** Smoothstep over [a, b] */
export const ease = (v: number, a = 0, b = 1) => {
  const x = unit((v - a) / (b - a || 1));
  return x * x * (3 - 2 * x);
};

/** A stable number for a string (FNV-1a): seeds and filter ids come from what is drawn */
export const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
/** A seeded random in [0, 1) (mulberry32) */
export const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
/** An id for an SVG filter, mask or gradient, the same for the same drawing */
export const fid = (kind: string, key: string) => `wt-${kind}-${hash(key).toString(36)}`;

/** Smooth periodic 1-D value noise in [-1, 1] over `period` knots */
export const noise1 = (seed: number, period = 48) => {
  const r = rng(seed), knots = Array.from({length: period}, () => r() * 2 - 1);
  return (x: number) => {
    const i = Math.floor(x), f = x - i, a = knots[((i % period) + period) % period], b = knots[(((i + 1) % period) + period) % period];
    return a + (b - a) * f * f * (3 - 2 * f);
  };
};

export type Pt = [number, number];
export type Rgb = [number, number, number];

/** '#RRGGBB' (or '#RGB') as 0 to 1 channels */
export const rgb = (hex: string): Rgb => {
  const h = hex.replace('#', ''), full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as Rgb;
};
/** A pigment let down with water: `t` 0 is the pigment, 1 is the paper */
export const dilute = (c: Rgb, paper: Rgb, t: number): Rgb => c.map((v, i) => v + (paper[i] - v) * t) as Rgb;
export const hex = (c: Rgb) => `#${c.map((v) => Math.round(unit(v) * 255).toString(16).padStart(2, '0')).join('')}`;

const f = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
/** A closed smooth path through points (Catmull-Rom as cubic Béziers) */
export function closed(pts: Pt[]) {
  const n = pts.length, at = (i: number) => pts[((i % n) + n) % n];
  let d = `M${f(at(0))}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d += ` C${f([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${f([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${f(p2)}`;
  }
  return `${d} Z`;
}

/** A round, lumpy blob: a crown of leaves, a cloud, a puddle. `lumps` bulges round its edge, `rough` how uneven they are; `squash` flattens it */
export function blob(cx: number, cy: number, r: number, seed = 1, lumps = 7, rough = 0.18, squash = 1) {
  const n = noise1(seed), pts: Pt[] = [];
  const k = Math.max(24, lumps * 6);
  for (let i = 0; i < k; i++) {
    const a = (i / k) * Math.PI * 2, bump = Math.abs(Math.sin((a * lumps) / 2 + seed)) ** 0.7;
    const rr = r * (1 - rough + rough * 1.4 * bump + 0.06 * n(i * 0.7));
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * squash]);
  }
  return closed(pts);
}

/** A maple leaf of `size` px from stem to tip, pointing up and turned by `turn` degrees, its stem at (x, y) */
export function maple(x: number, y: number, size: number, turn = 0, seed = 1) {
  const r = rng(seed), a0 = (turn * Math.PI) / 180, pts: Pt[] = [];
  // five lobes round a centre a little above the stem: the top one longest, two wide ones, two small ones low down
  const c: Pt = [0, -size * 0.36];
  const lobes = [{a: 112, l: 0.42}, {a: 48, l: 0.62}, {a: 0, l: 0.66}, {a: -48, l: 0.62}, {a: -112, l: 0.42}];
  const at = (deg: number, len: number): Pt => [c[0] + Math.sin((deg * Math.PI) / 180) * len * size, c[1] - Math.cos((deg * Math.PI) / 180) * len * size];
  pts.push([-size * 0.03, -size * 0.02], at(-150, 0.2));
  lobes.slice().reverse().forEach((lb, i) => {
    const L = lb.l * (0.94 + r() * 0.1), w = 17 + lb.l * 8;
    // up one side of the lobe with two teeth, to its point, and down the other
    pts.push(at(lb.a - w, L * 0.55), at(lb.a - w * 0.9, L * 0.72), at(lb.a - w * 0.55, L * 0.7), at(lb.a - w * 0.5, L * 0.86), at(lb.a - 4, L * 0.84), at(lb.a, L));
    pts.push(at(lb.a + 4, L * 0.84), at(lb.a + w * 0.5, L * 0.86), at(lb.a + w * 0.55, L * 0.7), at(lb.a + w * 0.9, L * 0.72), at(lb.a + w, L * 0.55));
    if (i < 4) pts.push(at((lb.a + lobes[3 - i].a) / 2, 0.24 + r() * 0.04));
  });
  pts.push(at(150, 0.2), [size * 0.03, -size * 0.02]);
  // the stem
  pts.push([size * 0.012, size * 0.16], [-size * 0.012, size * 0.16]);
  const rot = (p: Pt): Pt => [x + p[0] * Math.cos(a0) - p[1] * Math.sin(a0), y + p[0] * Math.sin(a0) + p[1] * Math.cos(a0)];
  return `M${pts.map((p) => f(rot(p))).join(' L')} Z`;
}

/** A Catmull-Rom centreline through the points, resampled every `step` px, with each point's distance along it */
export function centreline(points: Pt[], step = 4) {
  const dense: Pt[] = [];
  const p = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))];
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, c2: number, d: number) => 0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 + (-a + 3 * b - 3 * c2 + d) * t3);
      dense.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  dense.push(points[points.length - 1]);
  const at = [0];
  for (let i = 1; i < dense.length; i++) at.push(at[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  return {pts: dense, at, length: at[at.length - 1]};
}

/** A brush stroke as a closed shape: `from` px wide where it starts, `to` px where it ends (a trunk, a branch, a stem, a road) */
export function stroke(points: Pt[], from: number, to = from * 0.3) {
  const {pts, at, length} = centreline(points);
  const left: Pt[] = [], right: Pt[] = [];
  pts.forEach((q, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, w = (from + (to - from) * (at[i] / (length || 1))) / 2;
    left.push([q[0] - (dy / d) * w, q[1] + (dx / d) * w]);
    right.push([q[0] + (dy / d) * w, q[1] - (dx / d) * w]);
  });
  return `M${left.map(f).join(' L')} L${right.reverse().map(f).join(' L')} Z`;
}
