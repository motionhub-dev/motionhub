// Pixel Quest's drawing kit: the game screen is 480 × 270 game pixels shown at exactly 4 × 4 screen pixels each (1920 × 1080), so every shape
// is drawn in game pixels inside an svg scaled by 4 with crisp edges, and every position is a whole game pixel. Motion steps on twos: a drawing
// holds for two frames of 24, twelve drawings a second, and a moving thing jumps from one whole pixel to the next.
import {createElement as h, type ReactNode, type CSSProperties} from 'react';

export const P = 4;
export const W = 480;
export const H = 270;
/** the top of the floor, in game pixels: everything stands here; below it the earth darkens towards the captions */
export const FLOOR = 190;

/** The world's sixteen-odd colours. UI colours also exist as theme tokens; these are the art's, fixed like a cartridge's palette. */
export const C = {
  ink: '#0B0E14',
  bone: '#F4ECD6', fog: '#9AA9B5', slate: '#4A5670',
  sky: ['#111925', '#172436', '#1F3348', '#2A465A'],
  far: '#1C3540', farLit: '#24444C', near: '#21483C', nearLit: '#2D6048',
  grass: '#4FAE5C', grassLit: '#9BDD66', grassDark: '#327A45',
  dirt: '#6B3F2E', dirtLit: '#8E5636', dirtDark: '#3E2320', deep: '#22141A',
  wood: '#8E5636', woodDark: '#5A3422',
  gold: '#FFC83D', goldDark: '#C77B12', coral: '#F2564B', coralDark: '#8E2633', mint: '#5BE3B0',
  blue: '#3E8FE0', blueDark: '#285A9C', skin: '#F1B38A', skinDark: '#C7805A', hair: '#5A3422', boot: '#6B3F2E', bootDark: '#3F2420',
};

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const unit = (v: number) => clamp(v);
/** a progress held in whole steps: n drawings from 0 to 1, never a blend between them */
export const steps = (p: number, n: number) => Math.floor(clamp(p) * n + 1e-6) / n;
/** the drawing a cycle is on, twelve a second (on twos at 24 frames a second) */
export const twos = (t: number) => Math.floor(t * 12 + 1e-6);
/** a whole game pixel */
export const px = (v: number) => Math.round(v);

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** ordered dither: is the pixel at (x, y) still drawn when `p` of the shape has dissolved (0 none, 1 all)? */
export const kept = (x: number, y: number, p: number) => BAYER[(((y % 4) + 4) % 4) * 4 + (((x % 4) + 4) % 4)] >= Math.round(clamp(p) * 16);

export type Art = string[];
export type Pal = Record<string, string>;
type Run = {x: number; y: number; w: number; c: string};
const cache = new Map<string, Run[]>();
/** a sprite's rows as horizontal runs of one colour, so a 16 × 24 figure is a few dozen rects, not hundreds */
export function runs(art: Art, pal: Pal, flip = false): Run[] {
  const key = `${art.join('/')}|${Object.entries(pal).join(';')}|${flip}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const out: Run[] = [];
  const w = Math.max(...art.map((r) => r.length));
  art.forEach((row0, y) => {
    const row = flip ? [...row0.padEnd(w, '.')].reverse().join('') : row0;
    let x = 0;
    while (x < row.length) {
      const c = pal[row[x]];
      if (!c) { x++; continue; }
      let e = x + 1;
      while (e < row.length && pal[row[e]] === c) e++;
      out.push({x, y, w: e - x, c});
      x = e;
    }
  });
  cache.set(key, out);
  return out;
}

/** a sprite at a whole game pixel; `dissolve` 0 to 1 takes it away pixel by pixel in an ordered dither (never an alpha fade) */
export function Sprite({art, pal, x, y, flip = false, dissolve = 0, fill}: {art: Art; pal: Pal; x: number; y: number; flip?: boolean; dissolve?: number; fill?: string}) {
  const X = px(x), Y = px(y);
  if (dissolve <= 0) {
    return h('g', {transform: `translate(${X} ${Y})`}, runs(art, pal, flip).map((r, i) => h('rect', {key: i, x: r.x, y: r.y, width: r.w, height: 1, fill: fill ?? r.c})));
  }
  const cells: ReactNode[] = [];
  for (const r of runs(art, pal, flip)) for (let i = 0; i < r.w; i++) if (kept(X + r.x + i, Y + r.y, dissolve)) cells.push(h('rect', {key: `${r.x + i}-${r.y}`, x: r.x + i, y: r.y, width: 1, height: 1, fill: fill ?? r.c}));
  return h('g', {transform: `translate(${X} ${Y})`}, cells);
}

/** the whole screen in game pixels; every component draws inside one of these */
export function Screen({children, style}: {children?: ReactNode; style?: CSSProperties}) {
  const tall = typeof style?.height === 'number' ? style.height / P : H;
  return h('svg', {width: W * P, height: tall * P, viewBox: `0 0 ${W} ${tall}`, shapeRendering: 'crispEdges', style: {position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style}}, children);
}

/** the label face (Silkscreen, a pixel every 8 units: size 8 is one game pixel per font pixel) and the text face (Fusion Pixel, every 12) */
export const LABEL = 'var(--vt-display)';
export const TEXT = 'var(--vt-sans)';

/**
 * Pixel words: SVG text in game pixels, with an ink outline drawn as eight copies one pixel away and an optional drop one pixel down, so a
 * word reads on any part of the world. `size` 8 or 16 for labels, 12 for text.
 */
export function Words({x, y, children, size = 8, font = LABEL, color = C.bone, outline = C.ink, drop, anchor = 'start', weight = 400, chars}: {
  x: number; y: number; children: string; size?: number; font?: string; color?: string; outline?: string | null; drop?: string; anchor?: 'start' | 'middle' | 'end'; weight?: number; chars?: number;
}) {
  const shown = chars === undefined ? children : children.slice(0, Math.max(0, Math.floor(chars)));
  const t = (dx: number, dy: number, fill: string, k: string) => h('text', {key: k, x: px(x) + dx, y: px(y) + dy, fontFamily: font, fontSize: size, fontWeight: weight, fill, textAnchor: anchor, style: {whiteSpace: 'pre'}}, shown);
  const n = Math.max(1, Math.round(size / (font === LABEL ? 8 : 12)));
  const ring: ReactNode[] = [];
  if (outline) for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) ring.push(t(dx * n, dy * n, outline, `o${dx}${dy}`));
  return h('g', null, ring, drop ? t(0, n * 2, drop, 'drop') : null, t(0, 0, color, 'face'));
}

/**
 * A game window: a dark fill, a bone frame one pixel wide with its corners cut, an ink line round that, and an optional tab on its top edge.
 * The corners are cut, never rounded: a radius is not a pixel shape.
 */
export function Window({x, y, w, h: hh, fill = 'var(--vt-panel)', frame = 'var(--vt-border)', children}: {x: number; y: number; w: number; h: number; fill?: string; frame?: string; children?: ReactNode}) {
  const X = px(x), Y = px(y), Wd = px(w), Hd = px(hh);
  const r = (k: string, a: number, b: number, c: number, d: number, f: string) => h('rect', {key: k, x: a, y: b, width: c, height: d, fill: f});
  return h('g', null,
    r('o1', X - 1, Y + 1, Wd + 2, Hd - 2, C.ink),
    r('o2', X + 1, Y - 1, Wd - 2, Hd + 2, C.ink),
    r('o3', X, Y, Wd, Hd, C.ink),
    r('fr', X + 1, Y + 1, Wd - 2, Hd - 2, frame),
    r('in', X + 2, Y + 2, Wd - 4, Hd - 4, C.ink),
    r('fi', X + 3, Y + 3, Wd - 6, Hd - 6, fill),
    children);
}

/** the pixels of a circle of radius r (midpoint algorithm): a ring that is drawn in pixels, not stroked */
export function ringPixels(r: number): [number, number][] {
  const pts = new Set<string>();
  let x = r, y = 0, e = 1 - r;
  while (x >= y) {
    for (const [a, b] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) pts.add(`${a},${b}`);
    y++;
    if (e < 0) e += 2 * y + 1; else { x--; e += 2 * (y - x) + 1; }
  }
  return [...pts].map((s) => s.split(',').map(Number) as [number, number]);
}

/** small icons, 9 × 9, for loot and the item slots */
export const ICONS: Record<string, {art: Art; pal: Pal}> = {
  ball: {art: ['..kkkkk..', '.kwwbbbk.', 'kwbbbbbbk', 'kbbbbbbbk', 'kbbbbbbBk', 'kbbbbbbBk', 'kbbbbbBBk', '.kBBBBBk.', '..kkkkk..'], pal: {k: C.ink, w: C.bone, b: C.blue, B: C.blueDark}},
  arc: {art: ['...kkk...', '..kgggk..', '..kgGgk..', '.w.kkk.w.', 'w.......w', '.........', 'w.......w', '.........', 'w.......w'], pal: {k: C.ink, g: C.gold, G: C.goldDark, w: C.bone}},
  clock: {art: ['..kkkkk..', '.kwwwwwk.', 'kwwwkwwwk', 'kwwwkwwwk', 'kwwwkkwwk', 'kwwwwwwwk', 'kwwwwwwwk', '.kwwwwwk.', '..kkkkk..'], pal: {k: C.ink, w: C.gold}},
  star: {art: ['....k....', '...kgk...', '...kgk...', 'kkkkggkkk', 'kggggggk.', '.kggggk..', '.kgkkgk..', 'kgk..kgk.', 'kk....kk.'], pal: {k: C.ink, g: C.gold}},
  key: {art: ['.kkk.....', 'kgggk....', 'kg.gkkkkk', 'kgggggggk', '.kkk.kgk.', '.....kgk.', '......k..', '.........', '.........'], pal: {k: C.ink, g: C.gold}},
  gem: {art: ['..kkkkk..', '.kmwmmmk.', 'kmwmmmmmk', 'kmmmmmmMk', '.kmmmmMk.', '..kmmMk..', '...kMk...', '....k....', '.........'], pal: {k: C.ink, w: C.bone, m: C.mint, M: '#2F9E7A'}},
};
