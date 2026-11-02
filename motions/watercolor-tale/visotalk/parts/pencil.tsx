import React from 'react';
import {centreline, ease, fid, hash, type Pt} from './paint.ts';

export const meta = {
  name: {en: 'Pencil line', 'zh-CN': '铅笔线'},
  purpose: 'link',
  line: 'A soft graphite line drawn as it is named: the underdrawing a wash is laid over, or an arrow between two things.',
  fits: 'an outline before the paint; the sun\'s path; light falling on a leaf',
  params: {
    points: {type: '[x, y][]', doc: 'the line, smoothed through these points, in px inside the box'},
    width: {type: 'px', doc: 'the box\'s width'},
    height: {type: 'px', doc: 'the box\'s height'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: how much of the line the pencil has drawn'},
    arrow: {type: 'boolean', default: false, doc: 'a small open arrowhead where the line ends'},
    closed: {type: 'boolean', default: false, doc: 'join the end back to the start (an outline)'},
    weight: {type: 'px', default: 2.6, doc: 'how thick the lead is'},
  },
  preview: 12.8,
};

export function Pencil({points, width, height, draw = 1, arrow = false, closed = false, weight = 2.6}: {points: Pt[]; width: number; height: number; draw?: number; arrow?: boolean; closed?: boolean; weight?: number}) {
  const pts = closed ? [...points, points[0]] : points;
  const key = JSON.stringify(pts).slice(0, 80), id = fid('pencil', key), seed = hash(key) % 997;
  const {pts: line, length} = centreline(pts, 6);
  const dr = ease(draw, 0, 1);
  if (dr <= 0 || length < 1) return null;
  const d = `M${line.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L')}`;
  // the arrowhead appears once the line reaches it
  const end = line[line.length - 1], back = line[Math.max(0, line.length - 4)];
  const a = Math.atan2(end[1] - back[1], end[0] - back[0]), h = 10 + weight * 4;
  const head = `M${(end[0] - Math.cos(a - 0.45) * h).toFixed(1)} ${(end[1] - Math.sin(a - 0.45) * h).toFixed(1)} L${end[0].toFixed(1)} ${end[1].toFixed(1)} L${(end[0] - Math.cos(a + 0.45) * h).toFixed(1)} ${(end[1] - Math.sin(a + 0.45) * h).toFixed(1)}`;
  const pass = (shift: number, o: number, w: number) => (
    <path d={d} transform={`translate(${shift} ${shift * -0.6})`} fill="none" stroke="var(--vt-muted)" strokeOpacity={o} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"
      pathLength={1} strokeDasharray={`${dr} 2`} />
  );
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', mixBlendMode: 'multiply'}}>
      <defs>
        {/* graphite catches on the tops of the paper's tooth and skips the hollows */}
        <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed={seed} result="t" />
          <feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.2 0 0 0 -0.55" result="tooth" />
          <feComposite in="SourceGraphic" in2="tooth" operator="in" result="g" />
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed={seed + 5} result="w" />
          <feDisplacementMap in="g" in2="w" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>
        {pass(0, 0.85, weight)}
        {pass(1.4, 0.45, weight * 0.7)}
        {arrow && dr > 0.97 && <path d={head} fill="none" stroke="var(--vt-muted)" strokeOpacity={0.85 * ease(dr, 0.97, 1)} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" />}
      </g>
    </svg>
  );
}
