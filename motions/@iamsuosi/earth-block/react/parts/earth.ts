// What every Earth Block part shares: the paper's colours, the one projection, and the motion they all use.
export const C = {
  paper: '#EEF0E9', dot: '#C3CBC5', ink: '#1D2230', read: '#4E5866', line: '#7D878D',
  water: '#2F7FC1', deep: '#1D5C8C', foam: '#EAF6FF', ember: '#D9622B',
  grass: '#8CBF72', leaf: '#6FA05C', wall: '#F4E9D4', soil: '#7B5636', sand: '#C49A5E', clay: '#94695A', rock: '#6B6A73',
};
export const SANS = 'var(--font-sans)';
export const MONO = 'var(--font-mono)';
export const DISPLAY = 'var(--font-display)';
export const CANVAS = {width: 1920, height: 1080, viewBox: '0 0 1920 1080', style: {position: 'absolute', inset: 0, overflow: 'hidden'} as const};

export type Pt = [number, number];
export type P3 = [number, number, number];
/** The camera every part of a scene shares. `at` is where the middle of the ground lands on the frame, `k` is px per unit, `yaw` turns the ground in degrees (keep it under 40 either way). */
export type View = {at: Pt; k: number; yaw?: number; mid?: Pt};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
export const hash = (a: number) => { const s = Math.sin(a * 127.1) * 43758.5453; return s - Math.floor(s); };
export const smooth = (t: number) => { const k = clamp(t); return k * k * (3 - 2 * k); };
/** How solid things settle: a weight coming to rest, with no bounce. */
export const settle = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

export const project = ({at, k, yaw = 0, mid = [3, 3]}: View) => {
  const a = (yaw * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
  return (x: number, y: number, z: number): Pt => {
    const u = cos * (x - mid[0]) - sin * (y - mid[1]), v = sin * (x - mid[0]) + cos * (y - mid[1]);
    return [at[0] + (u - v) * k * 0.866, at[1] + (u + v) * k * 0.5 - z * k];
  };
};
export const pathOf = (pts: Pt[], close = true) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('') + (close ? 'Z' : '');

/** A colour lightened (f above 1) or darkened (f below 1); one material, three lit faces. */
export const tone = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16), part = (c: number) => Math.round(f <= 1 ? c * f : c + (255 - c) * (f - 1));
  return `rgb(${part(n >> 16)}, ${part((n >> 8) & 255)}, ${part(n & 255)})`;
};
