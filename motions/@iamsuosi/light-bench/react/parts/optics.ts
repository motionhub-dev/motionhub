// The light on the bench is computed, never drawn by eye: each colour is traced through the elements by Snell's law, in the plane of the beam.
// Glass is the dense flint SF11, by Schott's Sellmeier formula, which gives its published nd of 1.78472 at 587.6 nm.
export type P2 = [number, number];
export type Wave = {nm: number; color: [number, number, number]; css: string};
/** Seven colours whose light adds up to white where they overlap, so a white beam is simply all of them on one path. */
export const WAVES: Wave[] = [
  {nm: 690, color: [1, 0.02, 0.02], css: '#FF4A3D'}, {nm: 620, color: [1, 0.42, 0], css: '#FF8A2A'}, {nm: 580, color: [1, 0.95, 0.05], css: '#FFE23D'},
  {nm: 530, color: [0.1, 1, 0.12], css: '#4CE05A'}, {nm: 490, color: [0, 0.85, 0.8], css: '#2FD4D0'}, {nm: 450, color: [0.02, 0.2, 1], css: '#4A73FF'}, {nm: 410, color: [0.55, 0, 1], css: '#A65CFF'},
];
export const indexOf = (nm: number) => {
  const l = Math.pow(nm / 1000, 2);
  return Math.sqrt(1 + (1.73759695 * l) / (l - 0.013188707) + (0.313747346 * l) / (l - 0.0623068142) + (1.89878101 * l) / (l - 155.23629));
};

export type Optic =
  | {kind: 'prism'; at: P2; rot?: number; side?: number; flip?: boolean; in?: number}
  | {kind: 'lens'; at: P2; rot: number; f: number; dia?: number; in?: number}
  | {kind: 'jaws'; at: P2; rot: number; slit: number; close?: number; width?: number; in?: number}
  | {kind: 'card'; at: P2; rot: number; w?: number; in?: number};

const rad = (d: number) => (d * Math.PI) / 180;
const norm = ([x, z]: P2): P2 => { const l = Math.hypot(x, z) || 1; return [x / l, z / l]; };
export const dirOf = (deg: number): P2 => [Math.cos(rad(deg)), Math.sin(rad(deg))];
/** The three corners of a prism: apex towards -z before it is turned; `flip` puts the apex the other way. */
export const prismCorners = ({at, rot = 0, side = 2.4, flip}: {at: P2; rot?: number; side?: number; flip?: boolean}): P2[] => {
  const h = (side * Math.sqrt(3)) / 2, s = flip ? -1 : 1, c = Math.cos(rad(rot)), n = Math.sin(rad(rot));
  return ([[0, (-h * 2 * s) / 3], [side / 2, (h * s) / 3], [-side / 2, (h * s) / 3]] as P2[]).map(([x, z]) => [at[0] + x * c - z * n, at[1] + x * n + z * c]);
};
/** The two ends of something flat that stands across the beam: `rot` is the way it faces. */
const across = (at: P2, rot: number, half: number): [P2, P2] => { const [dx, dz] = dirOf(rot + 90); return [[at[0] - dx * half, at[1] - dz * half], [at[0] + dx * half, at[1] + dz * half]]; };

const hitLine = (o: P2, d: P2, a: P2, b: P2) => {
  const ex = b[0] - a[0], ez = b[1] - a[1], den = d[0] * ez - d[1] * ex;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((a[0] - o[0]) * ez - (a[1] - o[1]) * ex) / den, u = ((a[0] - o[0]) * d[1] - (a[1] - o[1]) * d[0]) / den;
  return t > 1e-6 && u >= 0 && u <= 1 ? {t, u, normal: norm([ez, -ex])} : null;
};
const refract = (d: P2, normal: P2, n1: number, n2: number): {dir: P2; reflected: boolean} => {
  const facing = d[0] * normal[0] + d[1] * normal[1] < 0, m: P2 = facing ? normal : [-normal[0], -normal[1]], cos = -(d[0] * m[0] + d[1] * m[1]), r = n1 / n2, k = 1 - r * r * (1 - cos * cos);
  if (k < 0) return {dir: norm([d[0] + 2 * cos * m[0], d[1] + 2 * cos * m[1]]), reflected: true}; // total internal reflection
  const c = r * cos - Math.sqrt(k);
  return {dir: norm([r * d[0] + c * m[0], r * d[1] + c * m[1]]), reflected: false};
};
/** Whether something has landed: the light changes the moment it touches down. */
export const landed = (o: Optic) => (o.in ?? 1) >= 0.985;
/** How long each blade of a pair of jaws is: past it, light goes by. */
export const BLADE = 1.2;
/** How far either side of the slit a pair of jaws stands open. */
export const jawOpen = (o: {close?: number; width?: number}) => 1.2 * (1 - (o.close ?? 1)) + (o.width ?? 0.12) / 2;

export type Traced = {pts: P2[]; ended: 'free' | 'card' | 'jaws'; wave: Wave};
/** One colour's path from `from` along `dir`, through every element that is fully in place, out to `far`. */
export function trace(from: P2, dir: P2, wave: Wave, optics: Optic[], far = 30): Traced {
  const pts: P2[] = [from], live = optics.filter(landed), n = indexOf(wave.nm);
  let o = from, d = norm(dir), inside: Optic | null = null;
  for (let bounce = 0; bounce < 12; bounce++) {
    let best: {t: number; normal: P2; optic: Optic; u: number} | null = null;
    for (const optic of live) {
      const segs: Array<[P2, P2]> = optic.kind === 'prism' ? prismCorners(optic).map((c, i, all) => [c, all[(i + 1) % 3]] as [P2, P2]) : [across(optic.at, optic.rot, optic.kind === 'lens' ? (optic.dia ?? 1.4) / 2 : optic.kind === 'card' ? (optic.w ?? 3) / 2 : 12)];
      for (const [a, b] of segs) { const h = hitLine(o, d, a, b); if (h && (!best || h.t < best.t)) best = {...h, optic}; }
    }
    if (!best) { pts.push([o[0] + d[0] * far, o[1] + d[1] * far]); return {pts, ended: 'free', wave}; }
    const hit: P2 = [o[0] + d[0] * best.t, o[1] + d[1] * best.t];
    pts.push(hit);
    const e = best.optic;
    if (e.kind === 'card') return {pts, ended: 'card', wave};
    if (e.kind === 'jaws') {
      const half = 12, along = (best.u - 0.5) * 2 * half;
      const off = Math.abs(along - e.slit);
      if (off > jawOpen(e) && off < jawOpen(e) + BLADE) return {pts, ended: 'jaws', wave};
    } else if (e.kind === 'lens') {
      const axis = dirOf(e.rot), tan = dirOf(e.rot + 90), h = (hit[0] - e.at[0]) * tan[0] + (hit[1] - e.at[1]) * tan[1];
      const a = d[0] * axis[0] + d[1] * axis[1], b = d[0] * tan[0] + d[1] * tan[1], slope = b / Math.abs(a) - h / e.f, way = Math.sign(a) || 1;
      d = norm([way * axis[0] + tan[0] * slope, way * axis[1] + tan[1] * slope]);
    } else {
      const next = inside === e ? refract(d, best.normal, n, 1) : refract(d, best.normal, 1, n);
      d = next.dir;
      if (!next.reflected) inside = inside === e ? null : e;
    }
    o = hit;
  }
  return {pts, ended: 'free', wave};
}

/** Where along each path a beam `reach` units long has got. */
export function upTo(pts: P2[], reach: number): P2[] {
  const out: P2[] = [pts[0]]; let left = reach;
  for (let i = 1; i < pts.length && left > 0; i++) {
    const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.min(1, left / l);
    out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); left -= l;
  }
  return out;
}
