// Ink Scroll's brush: the five tones of ink, a seeded random, and the outline of a brush stroke whose width breathes along its length.
// Everything here is a function of its arguments, so a frame is the same every time it is drawn.

/** The five tones of ink, as the opacity of one ink on paper: clear for far hills and mist, burnt for the sharpest lines */
export const TONE = {clear: 0.16, light: 0.34, heavy: 0.58, thick: 0.8, burnt: 0.95} as const;
export type Tone = keyof typeof TONE;

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
/** An id for an SVG filter or mask, the same for the same drawing */
export const fid = (kind: string, key: string) => `ink-${kind}-${hash(key).toString(36)}`;

/** Smooth 1-D value noise in [-1, 1], for a width that breathes and ink that runs dry */
export const noise1 = (seed: number) => {
  const r = rng(seed), knots = Array.from({length: 64}, () => r() * 2 - 1);
  return (x: number) => {
    const i = Math.floor(x), f = x - i, a = knots[((i % 64) + 64) % 64], b = knots[(((i + 1) % 64) + 64) % 64];
    return a + (b - a) * f * f * (3 - 2 * f);
  };
};

export type Pt = [number, number];

/** A centreline through the given points (Catmull-Rom), resampled every `step` px, with each point's distance along it */
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

/**
 * The outline of one stroke of a loaded brush: the tip pressed in (the hidden entry), full through the body, lifted and tapered at the end.
 * `draw` (0 to 1) is how far the brush has travelled; `press` scales the width; `seed` makes the width breathe the same way every frame.
 */
export function strokeOutline(points: Pt[], width: number, draw = 1, seed = 1, press = 1) {
  const {pts, at, length} = centreline(points);
  const end = length * unit(draw);
  if (end < 1) return '';
  const breathe = noise1(seed);
  const left: Pt[] = [], right: Pt[] = [];
  for (let i = 0; i < pts.length && at[i] <= end; i++) {
    const s = at[i] / Math.max(1, length);
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    // pressed in over the first tenth, eased off over the last third, and the wet tip rounds wherever the brush is now
    const profile = ease(s, 0, 0.1) * (1 - 0.75 * ease(s, 0.68, 1)) * (0.88 + 0.12 * breathe(at[i] / 90)) * (at[i] > end - width * 0.5 ? Math.sqrt(unit((end - at[i]) / (width * 0.5))) * 0.6 + 0.4 : 1);
    const w = (width * press * Math.max(0.12, profile)) / 2;
    left.push([pts[i][0] - (dy / d) * w, pts[i][1] + (dx / d) * w]);
    right.push([pts[i][0] + (dy / d) * w, pts[i][1] - (dx / d) * w]);
  }
  if (left.length < 2) return '';
  const f = (q: Pt) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
  return `M${left.map(f).join(' L')} L${right.reverse().map(f).join(' L')} Z`;
}

/**
 * Flying white: the bristle tracks of a brush running dry. Each bristle is a thin line beside the centreline that breaks where its ink runs out,
 * more often towards the end of the stroke. `dry` 0 is none, 1 is a stroke made only of tracks.
 */
export function bristles(points: Pt[], width: number, draw = 1, dry = 0.5, seed = 1) {
  const {pts, at, length} = centreline(points, 3);
  const end = length * unit(draw);
  const r = rng(seed), count = Math.max(4, Math.round(width / 4));
  const out: {d: string; ink: number}[] = [];
  // the tracks start where the body runs dry, each bristle at its own place across the brush and with its own load
  const from = 1 - dry * 0.62;
  for (let k = 0; k < count; k++) {
    const off = (r() - 0.5) * width * 0.9, load = noise1(seed + k * 31), jitter = r() * 200, start = from - 0.08 - r() * 0.12;
    let run: string[] = [];
    const flush = () => {
      if (run.length > 2) out.push({d: `M${run.join(' L')}`, ink: 0.55 + r() * 0.45});
      run = [];
    };
    for (let i = 0; i < pts.length && at[i] <= end; i++) {
      const s = at[i] / Math.max(1, length);
      if (s < start) continue;
      // ink left in this bristle: falls along the stroke and breaks on long-scale noise, so gaps are long, never a dash pattern
      const ink = load((at[i] + jitter) / 240) * 0.8 + 0.75 - (s - start) * (1.2 + dry) - Math.abs(off / width) * 0.5;
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      const taper = 1 - 0.7 * ease(s, 0.7, 1);
      const x = pts[i][0] - (dy / d) * off * taper, y = pts[i][1] + (dx / d) * off * taper;
      if (ink > 0) run.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
      else flush();
    }
    flush();
  }
  return {tracks: out, weight: Math.max(1.6, (width / count) * 0.9), body: from};
}

/**
 * A ridge line of hills, left to right across `width`, as a closed shape that runs down to `height` (where mist takes it):
 * `peaks` summits, the tallest reaching the top of the box. Seeded, so a range is drawn the same every time.
 */
export function ridge(width: number, height: number, peaks = 3, seed = 1, rough = 0.5) {
  const r = rng(seed), n = noise1(seed * 7 + 3), pts: Pt[] = [[0, height]];
  const tops = Array.from({length: peaks}, (_, i) => ({x: ((i + 0.3 + r() * 0.4) / peaks) * width, h: i === Math.floor(peaks / 2) ? 1 : 0.55 + r() * 0.35}));
  for (let x = 12; x < width; x += 12) {
    // the range rises from the ground and returns to it at both ends, so no edge of the box shows
    const hill = Math.max(...tops.map((t) => t.h * Math.exp(-(((x - t.x) / (width / peaks / 2.1)) ** 2)))) * Math.min(1, x / (width * 0.12), (width - x) / (width * 0.12));
    pts.push([x, height * (1 - 0.92 * hill) + n(x / 38) * height * 0.05 * rough + n(x / 9) * height * 0.012 * rough]);
  }
  pts.push([width, height]);
  return `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L')} Z`;
}
