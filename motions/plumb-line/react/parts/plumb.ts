// What every Plumb Line part shares: the card's colours, the camera along the depth axis, and the motion they all use.
export const C = {
  card: '#F7EFDD', ink: '#1A2A44', read: '#4C5A70', brass: '#C8892E', sun: '#FFF3C4', lure: '#FFF3A8', amber: '#F2B33D', pale: '#9AD5E0', shade: '#0C3A5E',
};
export const SANS = 'var(--font-sans)';
export const MONO = 'var(--font-mono)';
export const DISPLAY = 'var(--font-display)';
export const CANVAS = {width: 1920, height: 1080, viewBox: '0 0 1920 1080', style: {position: 'absolute', inset: 0, overflow: 'hidden'} as const};
/** Where the depth axis sits on the frame: the card takes what is right of it. */
export const EDGE = 1570;
export const CUT_SHADOW = 'drop-shadow(0 7px 9px rgba(4, 12, 30, 0.45))';

/** The camera: `at` is the depth (or height) held at the middle of the frame, `scale` is px per unit of it. Everything is placed by depth through this one mapping, so a move never breaks the scale. */
export type Cam = {at: number; scale: number};
export const yOf = (cam: Cam, depth: number) => 440 + (depth - cam.at) * cam.scale;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const hash = (a: number) => { const s = Math.sin(a * 127.1) * 43758.5453; return s - Math.floor(s); };
export const smooth = (t: number) => { const k = clamp(t); return k * k * (3 - 2 * k); };
export const glide = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const group = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
