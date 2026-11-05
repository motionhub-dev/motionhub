import React from 'react';
import {type RelationKind, useMetrics, unit, ease, slant, TYPE, spaced} from './geometry.ts';
import {Line, Head} from './relation.tsx';
import {GlyphArt, type Act} from './pictogram.tsx';

export const meta = {
  name: {en: 'Two branches', 'zh-CN': '两支对照'},
  purpose: 'compare',
  line: 'Two terms side by side, points under each, joined by one relation; one side marked.',
  fits: 'two outcomes of one cause; before and after; two options',
  params: {
    left: {type: 'object', doc: '{term, gloss?, glyph?, act?, points?: [text], figure?}: glyph is a large pictogram over the term, act what it does (see Pictogram)'},
    right: {type: 'object', doc: '{term, gloss?, glyph?, act?, points?: [text], figure?}'},
    actAt: {type: 'progress', default: 0, doc: '0 to 1: how far both pictograms have acted (tween it on the word)'},
    kind: {type: 'text', default: 'opposes', doc: 'the relation between the two terms: opposes, contributes, leads, causes, part, prevents'},
    label: {type: 'text', doc: 'the verb set in the gap between them'},
    marked: {type: 'text', doc: 'left or right: the side the film argues for, its rule and term in the one red'},
    x: {type: 'px', default: 240, doc: 'where the left rule starts (in map pixels inside IdeaMap, frame pixels outside)'},
    y: {type: 'px', default: 420, doc: 'the height of both rules'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the left term, the line between, the right term, then the points in turn'},
  },
  preview: 45.5,
};

type Side = {term: string; gloss?: string; glyph?: string; act?: Act; points?: string[]; figure?: string};
const S = 64, PT = 38, PL = 54, PIC = 210;

export function Compare({left, right, kind = 'opposes', label, marked, actAt = 0, x = 240, y = 420, show = 1}: {left: Side; right: Side; kind?: RelationKind; label?: string; marked?: 'left' | 'right'; actAt?: number; x?: number; y?: number; show?: number}) {
  const M = useMetrics();
  if (show <= 0.001) return null;
  const colW = (c: Side) => Math.max(M.width(c.term, 'sans', S, 600, false, -0.64), ...(c.points ?? []).map((p) => M.width(p, 'sans', PT, 400) + 44), c.gloss ? M.width(c.gloss, 'display', TYPE.gloss, 400, slant(c.gloss) === 'italic') : 0, c.figure ? M.width(c.figure, 'mono', TYPE.figure, 700) : 0, c.glyph ? PIC * (c.act === 'multiply' ? 2 : 1) : 0) + 24;
  const lw = colW(left), rw = colW(right);
  const vw = label ? M.width(label, 'display', TYPE.label, 400, slant(label) === 'italic') + 28 : 0;
  const between = Math.max(200, vw + 120);
  const rx = x + lw + 2 * 18 + between;
  const n = Math.max(left.points?.length ?? 0, right.points?.length ?? 0);
  const steps = 3 + n;
  const at = (i: number) => ease(unit(show * steps - i));
  const col = (c: Side, cx: number, w: number, k: number, red: boolean) => {
    const a = at(k);
    if (a <= 0.001) return null;
    const ink = red ? 'var(--color-op)' : 'var(--color-text)';
    const gy = 14 + (c.gloss ? TYPE.glossLine : 0);
    return (
      <div style={{position: 'absolute', left: cx, top: y, width: 0, height: 0}}>
        <div style={{position: 'absolute', left: 0, top: -1.5, width: w * a, height: 3, background: ink}} />
        <div style={{position: 'absolute', left: -6.5, top: -6.5, width: 13, height: 13, background: ink}} />
        {c.glyph && <div style={{position: 'absolute', left: 0, top: -S * 1.3 - 18 - PIC}}><GlyphArt name={c.glyph} size={PIC} draw={a} act={c.act} actAt={actAt} color={ink} stroke={2.4} /></div>}
        <div style={{position: 'absolute', left: 0, top: -S * 1.3 - 8, lineHeight: `${S * 1.3}px`, whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)', fontSize: S, fontWeight: 600, letterSpacing: '-0.01em', color: ink, opacity: a, transform: `translateY(${((1 - a) * 20).toFixed(1)}px)`}}>{spaced(c.term)}</div>
        {c.gloss && <div style={{position: 'absolute', left: 0, top: 12, whiteSpace: 'nowrap', fontFamily: 'var(--font-display)', fontStyle: slant(c.gloss), fontSize: TYPE.gloss, lineHeight: `${TYPE.glossLine}px`, color: 'var(--color-muted)', opacity: a}}>{spaced(c.gloss)}</div>}
        {(c.points ?? []).map((p, i) => {
          const b = at(3 + i);
          return (
            <div key={i} style={{position: 'absolute', left: 0, top: gy + 22 + i * PL, display: 'flex', alignItems: 'center', gap: 18, whiteSpace: 'nowrap', opacity: b}}>
              <div style={{width: 26 * b, height: 3, background: ink}} />
              <div style={{fontFamily: 'var(--font-sans)', fontSize: PT, lineHeight: `${PL - 6}px`, color: 'var(--color-text)'}}>{spaced(p)}</div>
            </div>
          );
        })}
        {c.figure && <div style={{position: 'absolute', left: 0, top: gy + 30 + (c.points?.length ?? 0) * PL, whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: TYPE.figure, fontWeight: 700, color: 'var(--color-data)', opacity: at(steps - 1)}}>{c.figure}</div>}
      </div>
    );
  };
  // the line between the two rules: straight, its verb in a gap at the middle
  const x0 = x + lw + 18, x1 = rx - 18, d = at(1);
  const mid = (x0 + x1) / 2;
  return (
    <>
      {col(left, x, lw, 0, marked === 'left')}
      {d > 0.001 && (
        <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {label ? (
            <>
              <Line d={`M${x0} ${y}H${Math.min(x0 + (x1 - x0) * d, mid - vw / 2 - 6)}`} kind={kind} color="var(--color-text)" />
              {d > 0.5 && <Line d={`M${mid + vw / 2 + 6} ${y}H${x0 + (x1 - x0) * d}`} kind={kind} color="var(--color-text)" />}
            </>
          ) : <Line d={`M${x0} ${y}H${x0 + (x1 - x0) * d}`} kind={kind} color="var(--color-text)" />}
          {kind === 'opposes' && <g transform={`translate(${x0} ${y}) rotate(180)`}><Head kind="opposes" color="var(--color-text)" /></g>}
          {d > 0.98 && <g transform={`translate(${x1} ${y})`}><Head kind={kind} color="var(--color-text)" /></g>}
        </svg>
      )}
      {label && d > 0.45 && <div style={{position: 'absolute', left: mid - vw / 2, top: y - TYPE.labelLine / 2, width: vw, textAlign: 'center', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)', fontStyle: slant(label), fontSize: TYPE.label, lineHeight: `${TYPE.labelLine - 4}px`, color: 'var(--color-text)', opacity: unit((d - 0.45) / 0.3)}}>{spaced(label)}</div>}
      {col(right, rx, rw, 2, marked === 'right')}
    </>
  );
}
