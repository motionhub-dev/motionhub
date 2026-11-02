// The works' one projection, shared by every component so that they all stand on the same floor grid.
// World units are floor cells: x runs down-right, y down-left, z up; one cell is K pixels along its edge's screen length.
// Every component draws on the whole 1920 × 1080 canvas from these, so a building at [2, 3] and a belt at [2, 3] meet.

export const C = Math.cos(Math.PI / 6); // 0.866: the horizontal reach of one unit along x or y
export const K = 46;                     // pixels per world unit
export const ORIGIN: [number, number] = [960, 250]; // where world [0, 0, 0] lands on the canvas

export type Pt = [number, number];
export type View = {k?: number; origin?: Pt};

/** World [x, y, z] to canvas pixels */
export const project = (x: number, y: number, z = 0, v: View = {}): Pt => {
  const k = v.k ?? K, [ox, oy] = v.origin ?? ORIGIN;
  return [ox + (x - y) * C * k, oy + ((x + y) / 2 - z) * k];
};

export const pts = (list: Pt[]) => list.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');

export const unit = (v: number) => Math.max(0, Math.min(1, v));
export const easeOut = (t: number) => 1 - (1 - unit(t)) ** 3;
/** A damped spring from 0 to 1: it overshoots by about a tenth, swings back once and settles, as a thing set down hard does */
export const springOut = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.exp(-5.5 * t) * Math.cos(9.5 * t));

/** The outline of a floor plot, drawn from its back corner round to it again: `draw` 0 to 1 of the perimeter */
export const plotPath = (x: number, y: number, w: number, d: number, draw: number, v: View = {}) => {
  const corners: Array<[number, number]> = [[x, y], [x + w, y], [x + w, y + d], [x, y + d], [x, y]];
  let left = 2 * (w + d) * unit(draw), out = '';
  for (let i = 1; i < corners.length && left > 0; i++) {
    const [ax, ay] = corners[i - 1], [bx, by] = corners[i], len = Math.abs(bx - ax) + Math.abs(by - ay), f = Math.min(1, left / len);
    const [p, q] = [project(ax, ay, 0, v), project(ax + (bx - ax) * f, ay + (by - ay) * f, 0, v)];
    out += `${i === 1 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
    left -= len;
  }
  return out;
};

/** A diamond ring on the floor around a plot, `grow` cells out from it */
export const ringPoints = (x: number, y: number, w: number, d: number, grow: number, v: View = {}) =>
  pts([project(x - grow, y - grow, 0, v), project(x + w + grow, y - grow, 0, v), project(x + w + grow, y + d + grow, 0, v), project(x - grow, y + d + grow, 0, v)]);

// What each part of a system does is its colour, from the theme tokens. 'idle' is a part that is not the subject.
export type Role = 'intake' | 'process' | 'store' | 'output' | 'idle' | 'plain';
export const ROLE: Record<Role, string> = {
  intake: 'var(--vt-op)',
  process: 'var(--vt-data)',
  store: 'var(--vt-warn)',
  output: 'var(--vt-grad)',
  idle: 'var(--vt-faint)',
  plain: 'var(--vt-panel2)',
};

/** A role's colour, greyed toward idle by `dim` (0 itself, 1 idle): what is not the subject keeps its shape and loses its colour */
export const hue = (role: Role, dim = 0) => {
  const d = unit(dim);
  return d <= 0 ? ROLE[role] : `color-mix(in srgb, ${ROLE[role]} ${Math.round((1 - d) * 100)}%, var(--vt-faint))`;
};

/** The three tones of one colour: the top lifted toward the light, the +y face the colour, the +x face dropped toward a cool ink */
export const tones = (base: string) => ({
  top: `color-mix(in srgb, ${base} 64%, #ffffff)`,
  left: base,
  right: `color-mix(in srgb, ${base} 74%, #1c2133)`,
});

export type Box = {x: number; y: number; z?: number; w: number; d: number; h: number};

/** The three visible faces of a box, as polygon point lists: top, left (+y) and right (+x) */
export const boxFaces = ({x, y, z = 0, w, d, h}: Box, v: View = {}) => {
  const P = (a: number, b: number, c: number) => project(a, b, c, v);
  const x1 = x + w, y1 = y + d, zt = z + h;
  return {
    top: pts([P(x, y, zt), P(x1, y, zt), P(x1, y1, zt), P(x, y1, zt)]),
    left: pts([P(x, y1, z), P(x1, y1, z), P(x1, y1, zt), P(x, y1, zt)]),
    right: pts([P(x1, y, z), P(x1, y1, z), P(x1, y1, zt), P(x1, y, zt)]),
  };
};

/**
 * The SVG transform that lays text on a vertical face, reading left to right: 'left' is the +y face (the text runs down-right),
 * 'right' the +x face (it runs up-right). The text's baseline starts at world [x, y, z].
 */
export const faceText = (face: 'left' | 'right', x: number, y: number, z: number, v: View = {}) => {
  const [a, b] = project(x, y, z, v);
  return face === 'left' ? `matrix(${C} 0.5 0 1 ${a.toFixed(1)} ${b.toFixed(1)})` : `matrix(${C} -0.5 0 1 ${a.toFixed(1)} ${b.toFixed(1)})`;
};

/** The transform that lays text flat on the floor (or on a top face at height z), reading along +x */
export const floorText = (x: number, y: number, z: number, v: View = {}) => {
  const [a, b] = project(x, y, z, v);
  return `matrix(${C} 0.5 ${-C} 0.5 ${a.toFixed(1)} ${b.toFixed(1)})`;
};

/** The SVG that every component draws in: the whole canvas, so world coordinates line up across parts */
export const CANVAS = {width: 1920, height: 1080, viewBox: '0 0 1920 1080', style: {position: 'absolute' as const, left: 0, top: 0, overflow: 'visible' as const}};
