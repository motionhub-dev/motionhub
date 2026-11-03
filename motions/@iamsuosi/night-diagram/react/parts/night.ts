// What every Night Diagram part shares: the light and the instruments' colours, and the motion they all use.
export const C = {
  deep: '#050A20', night: '#101C44', dusk: '#1E2E5E', land: '#0A1230', ink: '#FFFFFF', read: '#C6D6F2', dim: '#8CA2CC', line: '#4B6AA8',
  ember: '#FFB65C', ice: '#7FE9FF', core: '#E6FBFF',
};
export const SANS = 'var(--font-sans)';
export const MONO = 'var(--font-mono)';
export const CANVAS = {width: 1920, height: 1080, viewBox: '0 0 1920 1080', style: {position: 'absolute', inset: 0, overflow: 'hidden'} as const};

export type Pt = [number, number];
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
export const hash = (a: number) => { const s = Math.sin(a * 127.1) * 43758.5453; return s - Math.floor(s); };
/** How things settle here: quick, then a long soft arrival. Nothing bounces; this is an instrument. */
export const glide = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const smooth = (t: number) => { const k = clamp(t); return k * k * (3 - 2 * k); };
export const stagger = (t: number, i: number, n: number, span = 0.5) => clamp((t - (i / Math.max(1, n)) * (1 - span)) / span);
