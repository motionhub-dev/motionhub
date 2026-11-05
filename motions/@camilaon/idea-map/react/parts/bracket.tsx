import React from 'react';
import {useMap, useMetrics, useEdgeFade, viewBounds, unit, ease, slant, TYPE, spaced} from './geometry.ts';

export const meta = {
  name: {en: 'Bracket', 'zh-CN': '括注'},
  purpose: 'mark',
  line: 'A red square bracket along a group of terms, with a short note.',
  fits: 'the loop in a cycle; the root causes; the part a fix touches',
  params: {
    ids: {type: 'object', doc: 'the ids of the terms it holds (inside IdeaMap)'},
    note: {type: 'text', doc: 'what they are, in a few words'},
    index: {type: 'text', doc: 'a mono label over the note: a number, a date, a code'},
    side: {type: 'text', default: 'right', doc: 'right, left or below the terms'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the bracket draws from its middle out, then the note stands up'},
  },
  preview: 16.6,
};

export function Bracket({ids, note, index, side = 'right', show = 1}: {ids: string[]; note: string; index?: string; side?: 'right' | 'left' | 'below'; show?: number}) {
  const map = useMap();
  const M = useMetrics();
  const ns = map ? ids.map((id) => map.at(id)).filter((n): n is NonNullable<typeof n> => !!n) : [];
  // round the terms and the lines and verbs among them
  const v = map && ns.length ? viewBounds(map, ns.map((n) => n.id)) : {x0: 0, y0: 0, x1: 0, y1: 0};
  const x0 = v.x0 - 20, x1 = v.x1 + 20, y0 = v.y0, y1 = v.y1;
  const b = ease(unit(show / 0.6)), t = ease(unit((show - 0.45) / 0.55));
  const ink = 'var(--color-op)', arm = 30;
  const nw = M.width(note, 'display', 40, 400, slant(note) === 'italic');
  const nh = 48 + (index ? 38 : 0);
  let d: string, nx: number, ny: number, align: 'left' | 'right' = 'left';
  if (side === 'below') {
    const m = (x0 + x1) / 2, h = ((x1 - x0) / 2) * b, yy = y1 + 30;
    d = `M${m - h} ${yy - arm}V${yy}H${m + h}V${yy - arm}`;
    nx = m - nw / 2; ny = yy + 18;
  } else {
    const xx = side === 'right' ? x1 + 40 : x0 - 40, dir = side === 'right' ? -1 : 1;
    const m = (y0 + y1) / 2, h = ((y1 - y0) / 2) * b;
    d = `M${xx + dir * arm} ${m - h}H${xx}V${m + h}H${xx + dir * arm}`;
    nx = side === 'right' ? xx + 34 : xx - 34 - nw; ny = m - nh / 2;
    if (side === 'left') align = 'right';
  }
  const fade = useEdgeFade({x0: nx, y0: ny, x1: nx + nw, y1: ny + nh});
  if (!map || !ns.length || show <= 0.001) return null;
  return (
    <>
      <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <path d={d} fill="none" stroke={ink} strokeWidth={4} strokeLinejoin="miter" />
      </svg>
      <div style={{position: 'absolute', left: nx, top: ny, width: nw, opacity: t * fade, textAlign: align, whiteSpace: 'nowrap'}}>
        {index && <div style={{fontFamily: 'var(--font-mono)', fontSize: TYPE.index, lineHeight: '38px', fontWeight: 700, color: ink}}>{spaced(index)}</div>}
        <div style={{fontFamily: 'var(--font-display)', fontStyle: slant(note), fontSize: 40, lineHeight: '48px', color: ink}}>{spaced(note)}</div>
      </div>
    </>
  );
}
