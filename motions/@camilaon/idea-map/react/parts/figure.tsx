import React from 'react';
import {useMap, useMetrics, useEdgeFade, unit, ease, slant, spaced} from './geometry.ts';

export const meta = {
  name: {en: 'Figure on a rule', 'zh-CN': '线上的数字'},
  purpose: 'data',
  line: 'A large figure on its rule beside a term, counted up, its source under it; a share as a heavy run.',
  fits: 'what a cause cost; a share of a whole',
  params: {
    value: {type: 'text', doc: 'the figure as said, decimals and all: "1.14", "38%", "47"'},
    unit: {type: 'text', doc: 'what follows it, smaller: "million deaths", "min"'},
    label: {type: 'text', doc: 'what it counts, a short gloss'},
    source: {type: 'text', doc: 'where it comes from, in mono: publisher, year'},
    share: {type: 'number', doc: '0 to 1: draws the rule as a share, the heavy run that much of it (leave out for a plain figure)'},
    at: {type: 'text', doc: 'inside IdeaMap: the id of the term it stands beside (to its right on the same line, or under it with place below)'},
    place: {type: 'text', default: 'right', doc: 'right or below the term named by at'},
    x: {type: 'px', default: 0, doc: 'without at: where its rule starts, in map pixels'},
    y: {type: 'px', default: 0, doc: 'without at: the rule\'s height'},
    count: {type: 'progress', default: 1, doc: '0 to 1: the figure counts up from zero (tween it on the word)'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the rule runs out, then the figure stands up'},
  },
  preview: 23.8,
};

const SIZE = 116, W_MIN = 420;

export function Figure({value, unit: u, label, source, share, at, place = 'right', x = 0, y = 0, count = 1, show = 1}: {
  value: string; unit?: string; label?: string; source?: string; share?: number; at?: string; place?: 'right' | 'below'; x?: number; y?: number; count?: number; show?: number;
}) {
  const map = useMap();
  const M = useMetrics();
  const n = at ? map?.at(at) : undefined;
  let X = x, Y = y;
  if (n) {
    if (place === 'below') { X = n.x; Y = n.y + n.box.depth + 40 + SIZE * 1.1; } else { X = n.x + n.box.w + 110; Y = n.y; }
  }
  // the count keeps the decimals the figure is given, and its sign and suffix
  const m = value.match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/);
  let shown = value;
  if (m && count < 1) {
    const dec = (m[2].split('.')[1] ?? '').length;
    const num = parseFloat(m[2].replace(/,/g, '')) * ease(count);
    const grouped = m[2].includes(',');
    shown = m[1] + (grouped ? num.toLocaleString('en-US', {minimumFractionDigits: dec, maximumFractionDigits: dec}) : num.toFixed(dec)) + m[3];
  }
  const valueW = M.width(value, 'sans', SIZE, 600, false, -SIZE * 0.02);
  const unitW = u ? M.width(u, 'sans', 44, 500) + 18 : 0;
  const w = Math.max(W_MIN, valueW + unitW + 24, label ? M.width(label, 'display', 40, 400, slant(label) === 'italic') + 24 : 0);
  const fade = useEdgeFade({x0: X, y0: Y - SIZE * 1.12, x1: X + w, y1: Y + (source ? 110 : 70)});
  if (show <= 0.001) return null;
  const r = ease(unit(show / 0.5)), t = ease(unit((show - 0.3) / 0.5)), g = ease(unit((show - 0.6) / 0.4));
  const s = share === undefined ? undefined : Math.max(0, Math.min(1, share));
  return (
    <div style={{position: 'absolute', left: X, top: Y, width: 0, height: 0, opacity: fade}}>
      {s === undefined ? (
        <div style={{position: 'absolute', left: 0, top: -2, width: w * r, height: 4, background: 'var(--color-data)'}} />
      ) : (
        <>
          <div style={{position: 'absolute', left: 0, top: -1, width: w * r, height: 2, background: 'var(--color-text)'}} />
          <div style={{position: 'absolute', left: 0, top: -7, width: w * s * r * ease(count), height: 14, background: 'var(--color-op)'}} />
          <div style={{position: 'absolute', left: w * r - 2, top: -12, width: 2, height: 24, background: 'var(--color-text)', opacity: r > 0.98 ? 1 : 0}} />
        </>
      )}
      <div style={{position: 'absolute', left: 0, top: -SIZE * 1.12 - 10, display: 'flex', alignItems: 'baseline', gap: 18, whiteSpace: 'nowrap', opacity: t, transform: `translateY(${((1 - t) * 20).toFixed(1)}px)`}}>
        <span style={{fontFamily: 'var(--font-sans)', fontSize: SIZE, lineHeight: `${Math.round(SIZE * 1.12)}px`, fontWeight: 600, letterSpacing: `${-SIZE * 0.02}px`, fontVariantNumeric: 'tabular-nums', color: 'var(--color-data)'}}>{shown}</span>
        {u && <span style={{fontFamily: 'var(--font-sans)', fontSize: 44, fontWeight: 500, color: 'var(--color-text)'}}>{spaced(u)}</span>}
      </div>
      {label && <div style={{position: 'absolute', left: 0, top: 14, whiteSpace: 'nowrap', opacity: g, fontFamily: 'var(--font-display)', fontStyle: slant(label), fontSize: 40, lineHeight: '50px', color: 'var(--color-muted)'}}>{spaced(label)}</div>}
      {source && <div style={{position: 'absolute', left: 0, top: label ? 70 : 18, whiteSpace: 'nowrap', opacity: g, fontFamily: 'var(--font-mono)', fontSize: 32, lineHeight: '40px', color: 'var(--color-muted)'}}>{spaced(source)}</div>}
    </div>
  );
}
