import {useId, type ReactNode} from 'react';
import {C, CANVAS, SANS, glide, smooth, type Pt} from './night.ts';

export const meta = {
  name: {en: 'Magnifying lens', 'zh-CN': '放大镜头'},
  purpose: 'term',
  line: "A round window tied to one spot in the picture, showing the small process that explains the large one.",
  fits: "the invisible step inside a big picture: a collision, a cell, a wingtip",
  params: {
    at: {type: '[x, y]', doc: 'the middle of the lens'},
    r: {type: 'number', default: 214, doc: 'its radius'},
    from: {type: '[x, y]', doc: 'the spot in the picture it enlarges: it grows out of here and stays tied to it'},
    show: {type: 'progress', default: 1, doc: 'it opens'},
    label: {type: 'string', doc: 'the caption under it: what we are looking at'},
    children: {type: 'ReactNode', doc: 'what it shows, drawn as SVG with its origin at the middle of the lens'},
  },
  preview: 7,
};

export function Lens({at, r = 214, from, show = 1, label, children}: {at: Pt; r?: number; from: Pt; show?: number; label?: string; children?: ReactNode}) {
  const id = useId().replace(/:/g, '');
  const k = glide(show);
  if (k <= 0) return null;
  // the tie leaves the spot and meets the lens on the near side
  const dx = at[0] - from[0], dy = at[1] - from[1], len = Math.hypot(dx, dy) || 1;
  const ex = at[0] - (dx / len) * r * k, ey = at[1] - (dy / len) * r * k;
  return (
    <svg {...CANVAS}>
      <defs><clipPath id={id}><circle cx={0} cy={0} r={r} /></clipPath></defs>
      <path d={`M${from[0]} ${from[1]}L${ex} ${ey}`} stroke={C.core} strokeWidth={2.5} strokeDasharray="8 8" opacity={smooth(show * 2)} />
      <circle cx={from[0]} cy={from[1]} r={16} fill="none" stroke={C.core} strokeWidth={3} opacity={smooth(show * 2)} />
      <g transform={`translate(${at[0]} ${at[1]}) scale(${k})`}>
        <circle r={r} fill="#040819" />
        <g clipPath={`url(#${id})`}>{children}</g>
        <circle r={r} fill="none" stroke={C.core} strokeWidth={4} />
      </g>
      {label && <text x={at[0]} y={at[1] + r + 54} textAnchor="middle" fontFamily={SANS} fontSize={32} fontWeight={600} fill={C.ink} opacity={smooth((show - 0.5) * 2)}>{label}</text>}
    </svg>
  );
}
