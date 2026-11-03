import {C, CANVAS, clamp, stagger} from './night.ts';

export const meta = {
  name: {en: 'Pressure rings', 'zh-CN': '扩散波纹'},
  purpose: 'mark',
  line: "Thin rings that leave a point one after another and thin out as they spread, cut at the ground if there is one.",
  fits: "something spreading at a speed: thunder, a heartbeat, a signal",
  params: {
    at: {type: '[x, y]', doc: 'the source'},
    r: {type: 'number', default: 700, doc: 'how far the rings reach, in px'},
    n: {type: 'number', default: 5, doc: 'how many rings'},
    t: {type: 'progress', default: 1, doc: '0 to 1: they leave and spread; tween it linearly, the speed is the point'},
    color: {type: 'string', doc: 'their colour'},
    floor: {type: 'number', doc: 'y of the ground: only the part of each ring above it is drawn'},
  },
  preview: 26,
};

export function Pulse({at, r = 700, n = 5, t = 1, color = C.core, floor}: {at: [number, number]; r?: number; n?: number; t?: number; color?: string; floor?: number}) {
  const rings = Array.from({length: n}, (_, i) => stagger(t, i, n, 0.5));
  return (
    <svg {...CANVAS}>
      {rings.map((k, i) => {
        if (k <= 0 || k >= 1) return null;
        const R = r * k, paint = {fill: 'none', stroke: color, strokeWidth: Math.max(1.5, 7 * (1 - k)), opacity: clamp(1.1 - k)};
        if (floor == null) return <circle key={i} cx={at[0]} cy={at[1]} r={R} {...paint} />;
        const h = floor - at[1], half = Math.sqrt(Math.max(0, R * R - h * h));
        return R > Math.abs(h) && <path key={i} d={`M${at[0] - half} ${floor}A${R} ${R} 0 ${h > 0 ? 1 : 0} 1 ${at[0] + half} ${floor}`} {...paint} />;
      })}
    </svg>
  );
}
