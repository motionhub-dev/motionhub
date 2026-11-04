// The folding engine every Origami component draws from. No React, no drawing: a model is written as steps
// ("fold along this line, this side up toward you"), the steps are played on a flat sheet to find every crease and
// which step folds it (through as many layers as lie under the line), and a bar-and-hinge solve folds the sheet in
// 3D, step by step. Deterministic: no randomness, so every render tab gets the same states (engines may differ in the last bits of
// Math.sin and the like; a baked solve, from bake.ts, is the same everywhere).
// Method: bar-and-hinge origami simulation (Schenk & Guest; Liu & Paulino; Ghassaei et al. 2018); dihedral gradient
// after Bridson et al. 2003. Written anew for this motion.

export type Pt = [number, number];

/** One fold: a line through the paper as it lies now, the side that moves, and which way it goes */
export type Fold = {
  /** two points on the fold line, where the paper lies now (sheet units; x right, y up; you look at the paper from the front) */
  line: [Pt, Pt];
  /** any point on the side that moves, where the paper lies now */
  moving: Pt;
  /** valley: the moving part comes up, toward you (the default); mountain: it goes down, behind */
  as?: 'valley' | 'mountain';
  /** only the layers that pass this test move, tested on a point of each layer in the unfolded sheet's coordinates */
  layers?: (p: Pt) => boolean;
};

export type Step = {
  /** a short name for the step list, three or four words */
  title: string;
  /** what the narration says for this step, one sentence */
  say?: string;
  /** the folds this step makes, all at once */
  folds?: Fold[];
  /** fold, then open again: the crease stays as a mark */
  precrease?: boolean;
  /** how far this step's folds go, in degrees; 180 folds flat (the default) */
  angle?: number;
  /** turn the paper over, left to right, before this step's folds */
  turnOver?: boolean;
  /** set earlier steps' creases to a new angle (open wings, shape a model): {step, angle} with step counted from 1 */
  reopen?: {step: number; angle: number}[];
  /** let both sides of the fold move, as when a model is lifted off the table and folded in half to stand on its keel;
   *  by default the side that does not move stays where it lies on the table */
  free?: boolean;
};

export type ModelDef = {
  name: string;
  /** the sheet's width and height; it lies from (0, 0) to (w, h), front up */
  sheet: Pt;
  steps: Step[];
};

// ---------- 2D: affine maps, lines, faces ----------

type Aff = [number, number, number, number, number, number]; // x' = a x + b y + c, y' = d x + e y + f
const ID: Aff = [1, 0, 0, 0, 1, 0];
const apply = (T: Aff, [x, y]: Pt): Pt => [T[0] * x + T[1] * y + T[2], T[3] * x + T[4] * y + T[5]];
const compose = (A: Aff, B: Aff): Aff => [
  A[0] * B[0] + A[1] * B[3], A[0] * B[1] + A[1] * B[4], A[0] * B[2] + A[1] * B[5] + A[2],
  A[3] * B[0] + A[4] * B[3], A[3] * B[1] + A[4] * B[4], A[3] * B[2] + A[4] * B[5] + A[5],
];
const det = (T: Aff) => T[0] * T[4] - T[1] * T[3];
function reflection(p: Pt, d: Pt): Aff {
  const l = Math.hypot(d[0], d[1]), ux = d[0] / l, uy = d[1] / l;
  const a = 2 * ux * ux - 1, b = 2 * ux * uy, e = 2 * uy * uy - 1;
  return [a, b, p[0] - a * p[0] - b * p[1], b, e, p[1] - b * p[0] - e * p[1]];
}
const side = (p: Pt, d: Pt, q: Pt) => d[0] * (q[1] - p[1]) - d[1] * (q[0] - p[0]);
const areaOf = (q: Pt[]) => q.reduce((acc, v, i) => { const w = q[(i + 1) % q.length]; return acc + v[0] * w[1] - w[0] * v[1]; }, 0) / 2;
const centroid = (q: Pt[]): Pt => q.reduce((a, v) => [a[0] + v[0] / q.length, a[1] + v[1] / q.length], [0, 0] as Pt);

type Face = {poly: Pt[]; T: Aff; moved: number[]};
/** A crease made at a step: its ends in sheet coords, its kind on that layer, and how the fold reads to the viewer */
/** `line` names the fold line where the paper lay when it was folded: every layer one fold line passes through shares it */
export type Chord = {a: Pt; b: Pt; step: number; kind: 'M' | 'V'; seen: 'M' | 'V'; line: string};

const EPS = 1e-9;

function split(poly: Pt[], T: Aff, p: Pt, d: Pt, sgn: number) {
  const s = poly.map((v) => side(p, d, apply(T, v)) * sgn / Math.hypot(d[0], d[1]));
  if (s.every((x) => x <= EPS)) return {stay: poly, move: null, chord: null};
  if (s.every((x) => x >= -EPS)) return {stay: null, move: poly, chord: null};
  const stay: Pt[] = [], move: Pt[] = [], cut: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], sa = s[i], sb = s[(i + 1) % poly.length];
    if (sa <= EPS) stay.push(a);
    if (sa >= -EPS) move.push(a);
    if (Math.abs(sa) <= EPS) cut.push(a);
    if ((sa > EPS && sb < -EPS) || (sa < -EPS && sb > EPS)) {
      const t = sa / (sa - sb), x: Pt = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
      stay.push(x); move.push(x); cut.push(x);
    }
  }
  if (stay.length < 3 || move.length < 3 || Math.abs(areaOf(stay)) < 1e-10 || Math.abs(areaOf(move)) < 1e-10) {
    return s.reduce((a, b) => a + b, 0) > 0 ? {stay: null, move: poly, chord: null} : {stay: poly, move: null, chord: null};
  }
  return {stay, move, chord: cut.length >= 2 ? [cut[0], cut[cut.length - 1]] as [Pt, Pt] : null};
}

/** Play the model's steps on a flat sheet: the creases, each with its step; the faces as they lie at the end */
export function sequence(def: ModelDef) {
  const [w, h] = def.sheet;
  let faces: Face[] = [{poly: [[0, 0], [w, 0], [w, h], [0, h]], T: ID, moved: []}];
  const chords: Chord[] = [];
  const turned: number[] = [];
  def.steps.forEach((step, si) => {
    const n = si + 1;
    if (step.turnOver) {
      // turn left to right about the middle of where the paper now lies
      let lo = Infinity, hi = -Infinity;
      for (const f of faces) for (const v of f.poly) { const x = apply(f.T, v)[0]; lo = Math.min(lo, x); hi = Math.max(hi, x); }
      const R = reflection([(lo + hi) / 2, 0], [0, 1]);
      faces = faces.map((f) => ({...f, T: compose(R, f.T)}));
      turned.push(n);
    }
    for (const fd of step.folds ?? []) {
      const p = fd.line[0], d: Pt = [fd.line[1][0] - p[0], fd.line[1][1] - p[1]];
      const sgn = Math.sign(side(p, d, fd.moving)) || 1;
      const toFront = (fd.as ?? 'valley') === 'valley';
      // toward the viewer is a valley on a layer showing its front, a mountain on one showing its back
      const kindOf = (T: Aff): 'M' | 'V' => (toFront === (det(T) > 0) ? 'V' : 'M');
      const seen: 'M' | 'V' = toFront ? 'V' : 'M';
      // the fold line, as the diagram draws it once: its direction (mod 180°) and offset, rounded
      const dl = Math.hypot(d[0], d[1]), nx = -d[1] / dl, ny = d[0] / dl, flip = nx < -1e-9 || (Math.abs(nx) <= 1e-9 && ny < 0) ? -1 : 1;
      const line = `${n}:${(flip * nx).toFixed(4)},${(flip * ny).toFixed(4)},${(flip * (nx * p[0] + ny * p[1])).toFixed(4)}`;
      const onLine = (T: Aff, v: Pt) => Math.abs(side(p, d, apply(T, v))) / Math.hypot(d[0], d[1]) < 1e-7;
      const out: Face[] = [], stayEdges: {a: Pt; b: Pt; T: Aff}[] = [], moveEdges: {a: Pt; b: Pt; T: Aff}[] = [];
      for (const f of faces) {
        if (fd.layers && !fd.layers(centroid(f.poly))) { out.push(f); continue; }
        const {stay, move, chord} = split(f.poly, f.T, p, d, sgn);
        if (stay) out.push({...f, poly: stay});
        if (move) out.push({...f, poly: move, T: step.precrease ? f.T : compose(reflection(p, d), f.T), moved: step.precrease ? f.moved : [...f.moved, n]});
        if (chord) chords.push({a: chord[0], b: chord[1], step: n, kind: kindOf(f.T), seen, line});
        else {
          // a face wholly on one side can still meet the line along an edge: an earlier crease on the same line
          const poly = (stay || move)!;
          for (let i = 0; i < poly.length; i++) {
            const a = poly[i], b = poly[(i + 1) % poly.length];
            if (onLine(f.T, a) && onLine(f.T, b)) (stay ? stayEdges : moveEdges).push({a, b, T: f.T});
          }
        }
      }
      const same = (u: Pt, v: Pt) => Math.hypot(u[0] - v[0], u[1] - v[1]) < 1e-9;
      for (const m of moveEdges) {
        if (stayEdges.some((st) => (same(st.a, m.a) && same(st.b, m.b)) || (same(st.a, m.b) && same(st.b, m.a)))) chords.push({a: m.a, b: m.b, step: n, kind: kindOf(m.T), seen, line});
      }
      faces = out;
    }
  });
  return {faces, chords, turned};
}

/** Where a point of the unfolded sheet lies after the steps so far: for placing the next fold line */
export function whereIs(def: ModelDef, afterStep: number, q: Pt): Pt | null {
  const {faces} = sequence({...def, steps: def.steps.slice(0, afterStep)});
  for (const f of faces) {
    const n = f.poly.length; let inside = true;
    for (let i = 0; i < n; i++) { const a = f.poly[i], b = f.poly[(i + 1) % n]; if ((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]) < -1e-9) { inside = false; break; } }
    if (inside) return apply(f.T, q);
  }
  return null;
}

// ---------- the sheet as triangles ----------

function earClip(poly: number[], V: Pt[]) {
  const out: [number, number, number][] = [], p = poly.slice();
  const cross = (o: number, a: number, b: number) => (V[a][0] - V[o][0]) * (V[b][1] - V[o][1]) - (V[a][1] - V[o][1]) * (V[b][0] - V[o][0]);
  const sideOf = (a: number, b: number, q: number) => cross(a, b, q) / (Math.hypot(V[b][0] - V[a][0], V[b][1] - V[a][1]) || 1);
  const H = 1e-4; // no slivers: a triangle this thin would make its hinge stiffer than any step can follow
  const height = (a: number, b: number, c: number) => Math.min(sideOf(a, b, c), sideOf(b, c, a), sideOf(c, a, b));
  const inside = (q: number, a: number, b: number, c: number) => sideOf(a, b, q) >= -H && sideOf(b, c, q) >= -H && sideOf(c, a, q) >= -H;
  const ang = (o: number, x: number, y: number) => {
    const u = [V[x][0] - V[o][0], V[x][1] - V[o][1]], v = [V[y][0] - V[o][0], V[y][1] - V[o][1]];
    return Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / Math.hypot(u[0], u[1]) / Math.hypot(v[0], v[1]))));
  };
  for (let guard = 0; p.length > 3 && guard < 10000; guard++) {
    let best = -1, bestScore = -Infinity;
    for (let i = 0; i < p.length; i++) {
      const a = p[(i + p.length - 1) % p.length], b = p[i], c = p[(i + 1) % p.length];
      if (height(a, b, c) < H) continue;
      if (p.some((q) => q !== a && q !== b && q !== c && inside(q, a, b, c))) continue;
      const score = Math.min(ang(a, b, c), ang(b, c, a), ang(c, a, b));
      if (score > bestScore) { bestScore = score; best = i; }
    }
    if (best < 0) {
      // only straight runs are left: drop a vertex that lies on the line between its neighbours
      const i = p.findIndex((b, k) => Math.abs(cross(p[(k + p.length - 1) % p.length], b, p[(k + 1) % p.length])) < 1e-12);
      if (i < 0) break; p.splice(i, 1); continue;
    }
    const a = p[(best + p.length - 1) % p.length], b = p[best], c = p[(best + 1) % p.length];
    out.push([a, b, c]); p.splice(best, 1);
  }
  if (p.length === 3 && height(p[0], p[1], p[2]) >= H) out.push([p[0], p[1], p[2]]);
  return out;
}

export type Hinge = {a: number; b: number; c: number; d: number; l0: number; driven: boolean; events: {step: number; kind: 'M' | 'V'; seen: 'M' | 'V'; line: string}[]};
export type Mesh = {flat: Pt[]; tris: [number, number, number][]; triMoved: number[][]; bars: {i: number; j: number; l0: number}[]; hinges: Hinge[]; boundary: [number, number][]};

/** The sequenced sheet as a mesh: shared vertices, triangles, bars on every edge, hinges on every interior edge */
export function mesh(def: ModelDef): Mesh & {chords: Chord[]; turned: number[]} {
  const {faces, chords, turned} = sequence(def);
  const V: Pt[] = [];
  const vid = (q: Pt) => {
    for (let i = 0; i < V.length; i++) if (Math.hypot(V[i][0] - q[0], V[i][1] - q[1]) < 1e-7) return i;
    return V.push([q[0], q[1]]) - 1;
  };
  const polys = faces.map((f) => f.poly.map(vid));
  // T-junctions: a vertex lying inside another face's edge splits that edge, so neighbours share it
  const withJunctions = polys.map((poly) => {
    const out: number[] = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      out.push(a);
      const dx = V[b][0] - V[a][0], dy = V[b][1] - V[a][1], L2 = dx * dx + dy * dy;
      const mids = V.map((q, k) => ({k, t: ((q[0] - V[a][0]) * dx + (q[1] - V[a][1]) * dy) / L2, off: Math.abs((q[0] - V[a][0]) * dy - (q[1] - V[a][1]) * dx) / Math.sqrt(L2)}))
        .filter(({k, t, off}) => k !== a && k !== b && t > 1e-7 && t < 1 - 1e-7 && off < 1e-7).sort((u, v) => u.t - v.t);
      for (const m of mids) out.push(m.k);
    }
    return out;
  });
  const triMoved: number[][] = [];
  const tris = withJunctions.flatMap((poly, fi) => {
    const ts = earClip(areaOf(poly.map((i) => V[i])) > 0 ? poly : poly.slice().reverse(), V);
    for (let k = 0; k < ts.length; k++) triMoved.push(faces[fi].moved);
    return ts;
  });

  const key = (i: number, j: number) => (i < j ? `${i},${j}` : `${j},${i}`);
  const edgeTris = new Map<string, number[]>();
  tris.forEach((t, ti) => { for (let k = 0; k < 3; k++) { const kk = key(t[k], t[(k + 1) % 3]); if (!edgeTris.has(kk)) edgeTris.set(kk, []); edgeTris.get(kk)!.push(ti); } });
  const onChord = (q: Pt, c: Chord) => {
    const dx = c.b[0] - c.a[0], dy = c.b[1] - c.a[1], l2 = dx * dx + dy * dy;
    const t = ((q[0] - c.a[0]) * dx + (q[1] - c.a[1]) * dy) / l2;
    return Math.abs((q[0] - c.a[0]) * dy - (q[1] - c.a[1]) * dx) / Math.sqrt(l2) < 1e-6 && t > -1e-6 && t < 1 + 1e-6;
  };
  const bars: Mesh['bars'] = [], hinges: Hinge[] = [], boundary: [number, number][] = [];
  for (const [kk, ts] of edgeTris) {
    const [i, j] = kk.split(',').map(Number);
    const l0 = Math.hypot(V[i][0] - V[j][0], V[i][1] - V[j][1]);
    bars.push({i, j, l0});
    if (ts.length !== 2) { boundary.push([i, j]); continue; }
    const w1 = tris[ts[0]].find((v) => v !== i && v !== j)!, w2 = tris[ts[1]].find((v) => v !== i && v !== j)!;
    const left = (V[j][0] - V[i][0]) * (V[w1][1] - V[i][1]) - (V[j][1] - V[i][1]) * (V[w1][0] - V[i][0]) > 0;
    const [a, b] = left ? [i, j] : [j, i];
    const evs = chords.filter((c) => onChord(V[i], c) && onChord(V[j], c)).map(({step, kind, seen, line}) => ({step, kind, seen, line}));
    const events = evs.filter((e, k) => evs.findIndex((f) => f.step === e.step) === k).sort((x, y) => x.step - y.step);
    hinges.push({a, b, c: w1, d: w2, l0, driven: events.length > 0, events});
  }
  return {flat: V, tris, triMoved, bars, hinges, boundary, chords, turned};
}

// ---------- 3D: dihedral angle and its gradient ----------

type V3 = [number, number, number];
const sub = (p: V3, q: V3): V3 => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const dot = (p: V3, q: V3) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const crs = (p: V3, q: V3): V3 => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
const len = (p: V3) => Math.hypot(p[0], p[1], p[2]);

/** Signed dihedral of hinge a→b, wing c on the left, d on the right: 0 flat, + valley (wings rise toward the viewer) */
function dihedral(X: V3[], a: number, b: number, c: number, d: number) {
  const e = sub(X[b], X[a]), el = len(e);
  const n1 = crs(e, sub(X[c], X[a])), n2 = crs(sub(X[d], X[a]), e);
  const l1 = len(n1), l2 = len(n2);
  const u1: V3 = [n1[0] / l1, n1[1] / l1, n1[2] / l1], u2: V3 = [n2[0] / l2, n2[1] / l2, n2[2] / l2];
  return -Math.atan2(dot(crs(u1, u2), [e[0] / el, e[1] / el, e[2] / el]), dot(u1, u2));
}
function dihedralGrad(X: V3[], a: number, b: number, c: number, d: number): V3[] {
  const e = sub(X[b], X[a]), el = len(e);
  const n1 = crs(e, sub(X[c], X[a])), n2 = crs(sub(X[d], X[a]), e);
  const s1 = dot(n1, n1), s2 = dot(n2, n2);
  const gc = n1.map((v) => el * v / s1) as V3, gd = n2.map((v) => el * v / s2) as V3;
  const tc = dot(sub(X[c], X[a]), e) / (el * el), td = dot(sub(X[d], X[a]), e) / (el * el);
  const ga = [0, 1, 2].map((k) => -(1 - tc) * gc[k] - (1 - td) * gd[k]) as V3;
  const gb = [0, 1, 2].map((k) => -tc * gc[k] - td * gd[k]) as V3;
  return [ga, gb, gc, gd];
}

// ---------- the solve ----------

const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

export type Folded = Mesh & {
  def: ModelDef; chords: Chord[]; turned: number[];
  /** one Float32Array of xyz per vertex for each sample; z points toward the viewer */
  states: Float32Array[];
  /** for step n (from 1), the states it spans: [first, last] */
  spans: [number, number][];
  /** for a step that turns the paper over, the share of the step the turn takes (it comes before the step's folds) */
  turnShare: Record<number, number>;
};

const cache = new Map<ModelDef, Folded>();

/**
 * Fold a model: every step in turn, eased, with `samples` states per fold. Cached per model object, so every
 * component that draws the same model shares one solve. A flat fold stops at 172.8° so layers keep a hair apart.
 */
export function foldModel(def: ModelDef, {samples = 48, iterations = 220, baked}: {samples?: number; iterations?: number; baked?: Baked} = {}): Folded {
  const hit = cache.get(def);
  if (hit) return hit;
  const m = mesh(def);
  const FLAT = 0.96;
  const sign = (k: 'M' | 'V') => (k === 'V' ? 1 : -1);
  // the plan: per step one or two phases of hinge targets (radians)
  let cur = m.hinges.map(() => 0);
  const plan: number[][] = [], spans: [number, number][] = [], turnShare: Record<number, number> = {};
  const phase = (to: number[], n: number) => {
    const from = cur.slice();
    for (let k = 1; k <= n; k++) { const u = easeInOut(k / n); plan.push(from.map((f, i) => f + (to[i] - f) * u)); }
    cur = to.slice();
  };
  // what holds each sample still: a triangle (the step's still side, on the table), a crease (a free fold: its line
  // stays put and its two sides rise alike), or nothing (the paper keeps its pose)
  type Anchor = {tri: number} | {hinge: number} | null;
  const anchors: Anchor[] = [];
  const longestHinge = (step: number) => {
    let best = -1, bl = 0;
    m.hinges.forEach((h, hi) => { if (h.events.some((e) => e.step === step) && h.l0 > bl) { bl = h.l0; best = hi; } });
    return best;
  };
  const area = (t: [number, number, number]) => Math.abs((m.flat[t[1]][0] - m.flat[t[0]][0]) * (m.flat[t[2]][1] - m.flat[t[0]][1]) - (m.flat[t[1]][1] - m.flat[t[0]][1]) * (m.flat[t[2]][0] - m.flat[t[0]][0])) / 2;
  def.steps.forEach((st, si) => {
    const n = si + 1, start = plan.length;
    // the step's anchor: the largest triangle this step does not move stays put, as the paper on the table does;
    // a free step, or one with no folds, keeps whatever pose the paper has
    let anchor: Anchor = null;
    if (st.folds?.length && !st.free) {
      let best = 0, ti = -1;
      m.tris.forEach((t, k) => { if (!m.triMoved[k].includes(n) && area(t) > best) { best = area(t); ti = k; } });
      if (ti >= 0) anchor = {tri: ti};
    } else if (st.folds?.length) {
      const hi = longestHinge(n); if (hi >= 0) anchor = {hinge: hi};
    } else if (st.reopen?.length) {
      // reopening holds the innermost crease it opens: the first of its steps
      const hi = longestHinge(Math.min(...st.reopen.map((r) => r.step))); if (hi >= 0) anchor = {hinge: hi};
    }
    // turning over comes first, with the folds held still
    if (st.turnOver) phase(cur.slice(), Math.round(samples * 0.8));
    const turnEnd = plan.length;
    const deg = Math.min(st.angle ?? 180, 180), angle = deg >= 180 ? Math.PI * FLAT : (deg / 180) * Math.PI;
    const ev = (h: Hinge, step: number) => h.events.find((e) => e.step === step);
    let to = cur.map((v, i) => {
      const h = m.hinges[i];
      for (const r of st.reopen ?? []) { const e = ev(h, r.step); if (e) v = sign(e.kind) * Math.min(r.angle, 180 * FLAT) / 180 * Math.PI; }
      const e = ev(h, n); return e ? sign(e.kind) * angle : v;
    });
    phase(to, samples);
    if (st.precrease) { to = to.map((v, i) => (m.hinges[i].events.some((e) => e.step === n) ? 0 : v)); phase(to, Math.round(samples * 0.8)); }
    // let the paper settle where the step leaves it, so a step ends at rest
    phase(to, Math.round(samples * 0.75));
    while (anchors.length < plan.length) anchors.push(anchor);
    spans.push([start, plan.length]);
    if (st.turnOver) turnShare[n] = (turnEnd - start) / Math.max(1, plan.length - start);
  });
  const fresh = baked ? unbake(baked, fingerprint(def, samples, iterations), m.flat.length) : null;
  if (baked && !fresh) console.warn(`origami: the baked solve of "${def.name}" is for an older version of the model; solving it again. Bake it again.`);
  const states = fresh ?? pose(m, run(m, plan, iterations), anchors);
  const out: Folded = {...m, def, states, spans, turnShare};
  cache.set(def, out);
  return out;
}

/**
 * The solve has no table: a fold in half lifts both halves alike. Re-pose each state rigidly so that its step's anchor
 * triangle keeps the pose it had when the step began, as if the still side lay on the table; a free step keeps the pose
 * the paper had when it began, moving only as the solve moves it.
 */
function pose(m: Mesh, raw: Float32Array[], anchors: ({tri: number} | {hinge: number} | null)[]) {
  const frame = (S: Float32Array | V3[], t: [number, number, number]) => {
    const P = (v: number): V3 => (S instanceof Float32Array ? [S[v * 3], S[v * 3 + 1], S[v * 3 + 2]] : S[v]);
    const o = P(t[0]), u = sub(P(t[1]), o), w = sub(P(t[2]), o);
    const e1 = u.map((x) => x / len(u)) as V3, nn = crs(u, w), n = nn.map((x) => x / len(nn)) as V3, e2 = crs(n, e1);
    return {o, R: [e1, e2, n]}; // rows: the frame's axes
  };
  // a crease's frame: along it, and up the bisector of its two sides, so both sides rise alike about the vertical
  const hingeFrame = (S: Float32Array | V3[], hi: number) => {
    const h = m.hinges[hi];
    const P = (v: number): V3 => (S instanceof Float32Array ? [S[v * 3], S[v * 3 + 1], S[v * 3 + 2]] : S[v]);
    const o = P(h.a), e = sub(P(h.b), o), e1 = e.map((x) => x / len(e)) as V3;
    const n1 = crs(e, sub(P(h.c), o)), n2 = crs(sub(P(h.d), o), e);
    const u = [0, 1, 2].map((k) => n1[k] / len(n1) + n2[k] / len(n2)) as V3;
    // project the bisector off the crease and normalise
    const along = dot(u, e1), up0 = [0, 1, 2].map((k) => u[k] - along * e1[k]) as V3, n = up0.map((x) => x / len(up0)) as V3;
    return {o, R: [e1, crs(n, e1), n]};
  };
  const frameOf = (S: Float32Array | V3[], a: {tri: number} | {hinge: number}) => ('tri' in a ? frame(S, m.tris[a.tri]) : hingeFrame(S, a.hinge));
  const keyOf = (a: {tri: number} | {hinge: number} | null) => (a === null ? 'none' : 'tri' in a ? `t${a.tri}` : `h${a.hinge}`);
  // a rigid map x -> Rt^T Rs (x - os) + ot, carrying the source frame onto the target frame
  const mapper = (src: {o: V3; R: V3[]}, dst: {o: V3; R: V3[]}) => (x: V3): V3 => {
    const d = sub(x, src.o), l = [dot(src.R[0], d), dot(src.R[1], d), dot(src.R[2], d)];
    return [0, 1, 2].map((k) => dst.o[k] + dst.R[0][k] * l[0] + dst.R[1][k] * l[1] + dst.R[2][k] * l[2]) as V3;
  };
  const n = m.flat.length, out: Float32Array[] = [raw[0]];
  // the current map from solve space to shown space, as the frames that define it
  let map: ((x: V3) => V3) | null = null;
  let startKey = '', target: {o: V3; R: V3[]} | null = null, freeRef: {src: {o: V3; R: V3[]}; dst: {o: V3; R: V3[]}} | null = null;
  for (let k = 1; k < raw.length; k++) {
    const a = anchors[k - 1], S = raw[k], prevShown = out[k - 1], prevRaw = raw[k - 1];
    if (keyOf(a) !== startKey) {
      // a new step begins: hold its anchor where it is shown now
      startKey = keyOf(a);
      if (a) target = frameOf(prevShown, a);
      else {
        // a free step: carry on with the map that held at the end of the last step, fixed from then on
        const t = m.tris[0];
        freeRef = {src: frame(prevRaw, t), dst: frame(prevShown, t)};
      }
    }
    if (a) map = mapper(frameOf(S, a), target!);
    else map = mapper(freeRef!.src, freeRef!.dst);
    const f = new Float32Array(n * 3);
    for (let v = 0; v < n; v++) { const q = map([S[v * 3], S[v * 3 + 1], S[v * 3 + 2]]); f[v * 3] = q[0]; f[v * 3 + 1] = q[1]; f[v * 3 + 2] = q[2]; }
    out.push(f);
  }
  return out;
}

function run(m: Mesh, plan: number[][], iterations: number, {axial = 20, fold = 0.7, facet = 0.7, damping = 0.45} = {}) {
  const n = m.flat.length;
  // flat typed arrays and inlined vector maths: the loop below runs millions of times and must not allocate
  const X = new Float64Array(n * 3), V = new Float64Array(n * 3), F = new Float64Array(n * 3);
  // a whisper of out-of-plane noise breaks the flat sheet's perfect symmetry, deterministically
  let s = 1; const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  m.flat.forEach(([x, y], i) => { X[i * 3] = x; X[i * 3 + 1] = y; X[i * 3 + 2] = (rnd() - 0.5) * 1e-5; });
  const nb = m.bars.length, bi = new Int32Array(nb), bj = new Int32Array(nb), bl = new Float64Array(nb), bk = new Float64Array(nb);
  m.bars.forEach(({i, j, l0}, k) => { bi[k] = i * 3; bj[k] = j * 3; bl[k] = l0; bk[k] = axial / l0; });
  const nh = m.hinges.length, ha = new Int32Array(nh), hb = new Int32Array(nh), hc = new Int32Array(nh), hd = new Int32Array(nh);
  const hk = new Float64Array(nh), drv = new Uint8Array(nh), prev = new Float64Array(nh);
  let kMax = 0;
  for (let k = 0; k < nb; k++) kMax = Math.max(kMax, bk[k]);
  m.hinges.forEach((h, k) => {
    ha[k] = h.a * 3; hb[k] = h.b * 3; hc[k] = h.c * 3; hd[k] = h.d * 3;
    hk[k] = (h.driven ? fold : facet) * h.l0; drv[k] = h.driven ? 1 : 0;
    const P = (v: number): V3 => [m.flat[v][0], m.flat[v][1], 0];
    const e = sub(P(h.b), P(h.a)), el = len(e);
    const wc = len(crs(e, sub(P(h.c), P(h.a)))) / el, wd = len(crs(e, sub(P(h.d), P(h.a)))) / el;
    kMax = Math.max(kMax, hk[k] * (1 / (wc * wc) + 1 / (wd * wd)));
  });
  const dt = 0.9 / (2 * Math.PI * Math.sqrt(kMax)), cDamp = damping * Math.sqrt(kMax);
  // each sample covers the same span of time, however fine the mesh: a sliver or a short edge shortens the step, so it
  // gets more iterations (up to eight times), and a thick fold reaches its target in its own step
  const iters = Math.min(iterations * 8, Math.max(iterations, Math.ceil(iterations * 0.0097 / dt)));
  const states: Float32Array[] = [Float32Array.from(X)];
  for (const targets of plan) {
    for (let it = 0; it < iters; it++) {
      F.fill(0);
      for (let k = 0; k < nb; k++) {
        const i = bi[k], j = bj[k], dx = X[j] - X[i], dy = X[j + 1] - X[i + 1], dz = X[j + 2] - X[i + 2];
        const l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-12, f = bk[k] * (l - bl[k]) / l;
        F[i] += f * dx; F[i + 1] += f * dy; F[i + 2] += f * dz; F[j] -= f * dx; F[j + 1] -= f * dy; F[j + 2] -= f * dz;
      }
      for (let k = 0; k < nh; k++) {
        const a = ha[k], b = hb[k], c = hc[k], d = hd[k];
        const ex = X[b] - X[a], ey = X[b + 1] - X[a + 1], ez = X[b + 2] - X[a + 2];
        const cx = X[c] - X[a], cy = X[c + 1] - X[a + 1], cz = X[c + 2] - X[a + 2];
        const qx = X[d] - X[a], qy = X[d + 1] - X[a + 1], qz = X[d + 2] - X[a + 2];
        // n1 = e × (c − a), n2 = (d − a) × e
        const n1x = ey * cz - ez * cy, n1y = ez * cx - ex * cz, n1z = ex * cy - ey * cx;
        const n2x = qy * ez - qz * ey, n2y = qz * ex - qx * ez, n2z = qx * ey - qy * ex;
        const ee = ex * ex + ey * ey + ez * ez, el = Math.sqrt(ee);
        // the signed dihedral: 0 flat, + valley; followed continuously past ±180°
        const mx = n1y * n2z - n1z * n2y, my = n1z * n2x - n1x * n2z, mz = n1x * n2y - n1y * n2x;
        const raw = -Math.atan2((mx * ex + my * ey + mz * ez) / el, n1x * n2x + n1y * n2y + n1z * n2z);
        const theta = prev[k] + Math.atan2(Math.sin(raw - prev[k]), Math.cos(raw - prev[k]));
        prev[k] = theta;
        const w = hk[k] * (theta - (drv[k] ? targets[k] : 0));
        // its gradient (Bridson et al. 2003), scaled by the hinge's torque
        const s1 = n1x * n1x + n1y * n1y + n1z * n1z, s2 = n2x * n2x + n2y * n2y + n2z * n2z;
        const gc = w * el / s1, gd = w * el / s2;
        const tc = (cx * ex + cy * ey + cz * ez) / ee, td = (qx * ex + qy * ey + qz * ez) / ee;
        const gcx = gc * n1x, gcy = gc * n1y, gcz = gc * n1z, gdx = gd * n2x, gdy = gd * n2y, gdz = gd * n2z;
        F[c] -= gcx; F[c + 1] -= gcy; F[c + 2] -= gcz;
        F[d] -= gdx; F[d + 1] -= gdy; F[d + 2] -= gdz;
        F[a] += (1 - tc) * gcx + (1 - td) * gdx; F[a + 1] += (1 - tc) * gcy + (1 - td) * gdy; F[a + 2] += (1 - tc) * gcz + (1 - td) * gdz;
        F[b] += tc * gcx + td * gdx; F[b + 1] += tc * gcy + td * gdy; F[b + 2] += tc * gcz + td * gdz;
      }
      for (let i = 0; i < n * 3; i++) { V[i] += dt * (F[i] - cDamp * V[i]); X[i] += dt * V[i]; }
    }
    states.push(Float32Array.from(X));
  }
  return states;
}

/**
 * A solve written out by bake.ts, so a film can skip solving: the states as they are, bit for bit, with a key that
 * names the model, the options and the solver they came from. A key that no longer fits is solved again.
 */
export type Baked = {key: string; states: number; data: string};
const SOLVER = 'fold/1';

/**
 * A short hash of everything a solve depends on: the model's sheet and folds (its `layers` tests as their source, its
 * words left out, so a caption can change without a new bake), the options and the solver
 */
export function fingerprint(def: ModelDef, samples = 48, iterations = 220): string {
  const words = new Set(['name', 'title', 'say']);
  const text = SOLVER + JSON.stringify(def, (k, v) => (words.has(k) ? undefined : typeof v === 'function' ? String(v) : v)) + `|${samples}|${iterations}`;
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) { const c = text.charCodeAt(i); h1 = Math.imul(h1 ^ c, 0x01000193); h2 = Math.imul(h2 + c, 0x5bd1e995) ^ (h2 >>> 13); }
  return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36);
}

export function bake(def: ModelDef, {samples = 48, iterations = 220}: {samples?: number; iterations?: number} = {}): Baked {
  const f = foldModel(def, {samples, iterations}), n = f.states[0].length;
  const all = new Float32Array(f.states.length * n);
  f.states.forEach((s, k) => all.set(s, k * n));
  const bytes = new Uint8Array(all.buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return {key: fingerprint(def, samples, iterations), states: f.states.length, data: btoa(bin)};
}

function unbake(b: Baked, key: string, verts: number): Float32Array[] | null {
  if (b.key !== key) return null;
  const bin = atob(b.data), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const all = new Float32Array(bytes.buffer), n = verts * 3;
  if (all.length !== b.states * n) return null;
  return Array.from({length: b.states}, (_, k) => all.slice(k * n, (k + 1) * n));
}

/** The state index for `at` (steps done, fractional: 2.5 is halfway through step 3) */
export function stateAt(f: Folded, at: number) {
  const n = f.def.steps.length;
  if (at <= 0) return 0;
  if (at >= n) return f.states.length - 1;
  const k = Math.floor(at), u = at - k, [a, b] = f.spans[k];
  return a + (b - a) * u;
}

/** Vertex positions at a fractional state index (sheet frame: x, y in the sheet, z toward the viewer) */
export function positionsAt(f: Folded, idx: number): Float32Array {
  const i = Math.min(Math.floor(idx), f.states.length - 2), u = Math.max(0, Math.min(1, idx - i));
  const A = f.states[Math.max(0, i)], B = f.states[Math.max(0, i) + 1] ?? A, out = new Float32Array(A.length);
  for (let k = 0; k < A.length; k++) out[k] = A[k] + (B[k] - A[k]) * u;
  return out;
}

/** The creases a step folds, as vertex pairs with how they read to the viewer */
export function stepEdges(f: Folded, step: number): [number, number, 'M' | 'V', string][] {
  return f.hinges.flatMap((h) => { const e = h.events.find((x) => x.step === step); return e ? [[h.a, h.b, e.seen, e.line] as [number, number, 'M' | 'V', string]] : []; });
}
