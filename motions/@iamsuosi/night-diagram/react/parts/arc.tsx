import {useId} from 'react';
import {C, CANVAS, clamp, type Pt} from './night.ts';

export const meta = {
  name: {en: 'Light path', 'zh-CN': '发光路径'},
  purpose: 'mark',
  line: "A line of real light, a white core in two blooms of colour, that runs along a path on the word and can fork.",
  fits: "a stroke of lightning, a nerve signal, a current",
  params: {
    path: {type: 'Array<[x, y]>', doc: 'the main path, from where it starts'},
    forks: {type: 'Array<Array<[x, y]>>', doc: 'side branches, each starting on the main path; they grow with it, thinner'},
    t: {type: 'progress', default: 1, doc: '0 to 1: it runs along the path'},
    power: {type: 'progress', default: 1, doc: 'how bright it is: spike and flicker this after the strike, then let it fade'},
    color: {type: 'string', doc: 'the colour of its bloom; ice by default'},
    width: {type: 'number', default: 6, doc: 'the width of the core'},
  },
  preview: 17.5,
};

const d = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('');

export function Arc({path, forks = [], t = 1, power = 1, color = '#49D8FF', width = 6}: {path: Pt[]; forks?: Pt[][]; t?: number; power?: number; color?: string; width?: number}) {
  const id = useId().replace(/:/g, '');
  const k = clamp(t), p = clamp(power);
  if (k <= 0 || p <= 0) return null;
  const line = {fill: 'none', strokeLinejoin: 'round', strokeLinecap: 'round', pathLength: 1, strokeDasharray: `${k} 1`} as const;
  const main = d(path), side = forks.map(d).join('');
  return (
    <svg {...CANVAS}>
      <defs>
        <filter id={`${id}a`} x="-60%" y="-30%" width="220%" height="160%"><feGaussianBlur stdDeviation={width * 2.4} /></filter>
        <filter id={`${id}b`} x="-60%" y="-30%" width="220%" height="160%"><feGaussianBlur stdDeviation={width * 0.9} /></filter>
      </defs>
      <g opacity={p}>
        <path d={main} {...line} stroke={color} strokeWidth={width * 4.5} filter={`url(#${id}a)`} />
        {side && <path d={side} {...line} stroke={color} strokeWidth={width * 2.2} filter={`url(#${id}a)`} />}
        <path d={main} {...line} stroke="#C9F5FF" strokeWidth={width * 2} filter={`url(#${id}b)`} />
        <path d={main} {...line} stroke={C.ink} strokeWidth={width} />
        {side && <path d={side} {...line} stroke={C.core} strokeWidth={width * 0.5} />}
      </g>
    </svg>
  );
}
