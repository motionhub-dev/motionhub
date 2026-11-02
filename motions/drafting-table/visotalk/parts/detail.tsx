import type {ReactNode} from 'react';
import {LINE, Stroke, ease, lettering, phase, typed, useSvgId} from './draft.ts';

export const meta = {
  name: {en: 'Detail view', 'zh-CN': '局部放大'},
  purpose: 'link',
  line: 'A small circle on the drawing lifts out and grows into a magnified view, named DETAIL A with its scale.',
  fits: 'where two parts meet; a thread, a seal, a tolerance',
  params: {
    at: {type: '[x, y]', doc: 'the centre of the small circle, in px inside the box (the drawing\'s own coordinates)'},
    r: {type: 'px', default: 50, doc: 'the small circle\'s radius'},
    to: {type: '[x, y]', doc: 'the centre of the magnified view'},
    radius: {type: 'px', default: 200, doc: 'the magnified view\'s radius; the scale is radius ÷ r'},
    letter: {type: 'text', default: 'A', doc: 'the detail\'s name'},
    open: {type: 'progress', default: 1, doc: '0 to 1: the small circle, its letter, the lift, then the label'},
    children: {type: 'drawing', doc: 'what is magnified, as SVG in the box\'s coordinates, drawn only inside the small circle\'s square (every line is measured where it runs, even where the circle hides it), with vector-effect non-scaling-stroke'},
  },
  preview: 35.9,
};

type P = [number, number];

export function Detail({at, r = 50, to, radius = 200, letter = 'A', open = 1, children}: {at: P; r?: number; to: P; radius?: number; letter?: string; open?: number; children?: ReactNode}) {
  const id = useSvgId();
  const ring = phase(open, 0, 0.25), lift = ease(phase(open, 0.3, 0.8)), label = phase(open, 0.78, 1);
  const k = radius / r, s = 1 + (k - 1) * lift;
  const c: P = [at[0] + (to[0] - at[0]) * lift, at[1] + (to[1] - at[1]) * lift], R = r * s;
  const circle = (p: P, q: number) => `M${p[0] - q} ${p[1]} a${q} ${q} 0 1 0 ${2 * q} 0 a${q} ${q} 0 1 0 ${-2 * q} 0`;
  const scale = Number.isInteger(k) ? `${k} : 1` : `${k.toFixed(1)} : 1`;
  return (
    <>
      <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <Stroke d={circle(at, r)} weight="detail" width={3} draw={ring} />
        {lift > 0 && <>
          <defs><clipPath id={id}><circle cx={c[0]} cy={c[1]} r={R} /></clipPath></defs>
          <circle cx={c[0]} cy={c[1]} r={R} fill="var(--vt-panel)" />
          {/* a nested svg clips what it holds, so the magnified drawing ends at the circle's square, and the circle cuts it round */}
          <svg x={c[0] - R} y={c[1] - R} width={2 * R} height={2 * R} viewBox={`${c[0] - R} ${c[1] - R} ${2 * R} ${2 * R}`} overflow="hidden">
            <g clipPath={`url(#${id})`}>
              <g transform={`translate(${c[0]} ${c[1]}) scale(${s}) translate(${-at[0]} ${-at[1]})`}>{children}</g>
            </g>
          </svg>
          <circle cx={c[0]} cy={c[1]} r={R} fill="none" stroke="var(--vt-text)" strokeWidth={LINE.outline.width} />
        </>}
      </svg>
      {ring > 0.6 && (
        <div style={{position: 'absolute', left: at[0] + r * 0.78, top: at[1] - r * 0.78, transform: 'translate(0, -100%)', ...lettering(32), fontWeight: 700, color: 'var(--vt-text)', opacity: phase(ring, 0.6, 1)}}>{letter}</div>
      )}
      {label > 0 && (
        <div style={{position: 'absolute', left: to[0], top: to[1] + radius + 22, transform: 'translate(-50%, 0)', ...lettering(30), color: 'var(--vt-text)', ...typed(label)}}>
          detail {letter} <span style={{color: 'var(--vt-muted)'}}>{scale}</span>
        </div>
      )}
    </>
  );
}
