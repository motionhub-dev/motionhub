import React from 'react';
import {useTime} from '@motionhub/runtime';
import {type MapNode, type Placed, nodeBox, useMetrics, useEdgeFade, useDetail, TYPE, GLYPH, PICTURE, IMAGE, ITEM, unit, ease, slant, spaced, isHan, termSpacing} from './geometry.ts';
import {GlyphArt} from './pictogram.tsx';

export const meta = {
  name: {en: 'Term on its rule', 'zh-CN': '线上的概念'},
  purpose: 'term',
  line: 'A term typeset on its rule: with a gloss, index, pictogram (acting), picture or points; a large pictogram, a figure, a quote, or struck out.',
  fits: 'a stage; a cause; a person or a place; a count; a failure; a fix',
  params: {
    node: {type: 'object', doc: '{id, term, gloss?, index?, figure?, glyph?, image?, items?, strike?, size?, kind: concept | event | action | figure | quote | picture, act?, actAt?, state: normal | active | dim | root | struck, tag?, show?, x, y}: x, y is where the rule starts, in map pixels (IdeaMap places it for you)'},
  },
  preview: 4.5,
};

const STROKE = {normal: 'var(--color-text)', active: 'var(--color-op)', root: 'var(--color-op)', dim: 'var(--color-border)', struck: 'var(--color-muted)'};

/** a figure as it counts up: the decimals, sign and suffix it is given, the digits growing to it */
function counted(value: string, p: number) {
  const m = value.match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/);
  if (!m || p >= 1) return value;
  const dec = (m[2].split('.')[1] ?? '').length;
  const num = parseFloat(m[2].replace(/,/g, '')) * p;
  return m[1] + (m[2].includes(',') ? num.toLocaleString('en-US', {minimumFractionDigits: dec, maximumFractionDigits: dec}) : num.toFixed(dec)) + m[3];
}

export function Term({node}: {node: MapNode & {box?: Placed['box']}}) {
  const M = useMetrics();
  const t = useTime();
  const n = node;
  const b = n.box ?? nodeBox(n, M);
  const {s, w, indent, lead} = b;
  const state = n.state ?? 'normal', kind = n.kind ?? 'concept';
  const show = unit(n.show ?? 1);
  const x = n.x ?? 0, y = n.y ?? 0;
  const fade = useEdgeFade({x0: x, y0: y - b.above, x1: x + w, y1: y + b.depth});
  const detail = useDetail();
  if (show <= 0.001) return null;
  const rule = ease(show / 0.45), pic = ease((show - 0.15) / 0.5), word = ease((show - 0.3) / 0.45), gloss = ease((show - 0.6) / 0.4);
  const c = STROKE[state];
  const textColor = state === 'dim' ? 'var(--color-muted)' : state === 'struck' ? 'var(--color-muted)' : state === 'normal' ? 'var(--color-text)' : 'var(--color-op)';
  const heavy = kind === 'event' ? 6 : state === 'root' ? 4 : 3;
  const m = kind === 'event' ? 20 : kind === 'action' ? 22 : 13;
  const termTop = Math.round(-s - 12 - s * 0.15);
  const term = spaced(n.term);
  const shown = kind === 'figure' ? counted(term, ease(unit((show - 0.3) / 0.6))) : kind === 'quote' ? (isHan(term) ? `“${term}”` : `“${term}”`) : term;
  const han = isHan(term);
  // the struck line runs across the term once it stands; the active term's marker sends out a slow ring
  const strike = state === 'struck' ? ease(n.strike ?? unit((show - 0.8) / 0.2)) : 0;
  const pulse = state === 'active' || state === 'root' ? (t * 0.7) % 1 : -1;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0}}>
      {/* the rule, drawn from its start; a node marker on its first end: a square, a larger one for an event, an open box for an action */}
      <div style={{position: 'absolute', left: 0, top: -heavy / 2, width: w * rule, height: heavy, background: c}} />
      {state === 'root' && <div style={{position: 'absolute', left: 0, top: heavy / 2 + 5, width: w * rule, height: 2, background: c}} />}
      {pulse >= 0 && <div style={{position: 'absolute', left: -m / 2 - 30 * pulse, top: -m / 2 - 30 * pulse, width: m + 60 * pulse, height: m + 60 * pulse, boxSizing: 'border-box', border: '2px solid var(--color-op)', opacity: (1 - pulse) * 0.6 * rule}} />}
      <div style={{position: 'absolute', left: -m / 2, top: -m / 2, width: m, height: m, boxSizing: 'border-box', opacity: rule > 0.02 ? 1 : 0,
        background: kind === 'action' ? 'var(--color-bg)' : c, border: kind === 'action' ? `3px solid ${c}` : undefined}} />
      {n.glyph && kind !== 'picture' && (
        // the pictogram stands on the rule before the words, drawn stroke by stroke
        <div style={{position: 'absolute', left: 4, top: -GLYPH - 14, opacity: fade}}>
          <GlyphArt name={n.glyph} size={GLYPH} draw={pic} act={n.act} actAt={n.actAt} color={state === 'normal' ? 'var(--color-text)' : c} stroke={3.6} />
        </div>
      )}
      {n.glyph && kind === 'picture' && (
        // a picture term: its pictogram large above a word or two
        <div style={{position: 'absolute', left: 0, top: termTop - PICTURE - 10 - (n.index || n.tag ? TYPE.index + 18 : 0), opacity: fade}}>
          <GlyphArt name={n.glyph} size={PICTURE} draw={pic} act={n.act} actAt={n.actAt} color={state === 'normal' ? 'var(--color-text)' : c} stroke={2.6} />
        </div>
      )}
      {n.image && (
        // a picture standing on the rule, framed in a hairline, uncovered upwards from the rule
        <div style={{position: 'absolute', left: 6, top: -IMAGE.h - 8, width: IMAGE.w, height: IMAGE.h, boxSizing: 'border-box', border: '2px solid var(--color-text)', overflow: 'hidden', opacity: fade,
          clipPath: `inset(${((1 - pic) * 100).toFixed(1)}% 0 0 0)`}}>
          <img src={n.image} alt="" style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: state === 'dim' ? 'grayscale(1) opacity(0.5)' : 'grayscale(0.15)'}} />
        </div>
      )}
      {(n.index || n.tag) && (
        <div style={{position: 'absolute', left: indent, top: termTop - TYPE.index - 14, opacity: word * fade * (n.tag ? 1 : detail), whiteSpace: 'nowrap', lineHeight: `${TYPE.index + 6}px`,
          fontFamily: 'var(--font-mono)', fontSize: TYPE.index, fontWeight: 700, letterSpacing: `${TYPE.index * 0.08}px`,
          color: n.tag ? 'var(--color-panel)' : state === 'dim' ? 'var(--color-border)' : 'var(--color-muted)', background: n.tag ? 'var(--color-op)' : undefined, padding: n.tag ? '0 12px' : 0}}>
          {spaced((n.tag ?? n.index)!)}
        </div>
      )}
      {/* the term stands up on the rule */}
      <div style={{position: 'absolute', left: indent, top: termTop, height: Math.round(s * 1.3), lineHeight: `${Math.round(s * 1.3)}px`, whiteSpace: 'nowrap',
        fontFamily: b.face === 'display' ? 'var(--font-display)' : 'var(--font-sans)', fontStyle: b.italic ? 'italic' : 'normal', fontSize: s, fontWeight: b.weight,
        fontVariantNumeric: kind === 'figure' ? 'tabular-nums' : undefined,
        letterSpacing: b.face === 'sans' ? `${termSpacing(term, s)}px` : undefined, color: kind === 'figure' && state === 'normal' ? 'var(--color-data)' : textColor,
        opacity: word * fade, transform: `translateY(${((1 - word) * s * 0.35).toFixed(1)}px)`}}>
        {shown}
        {strike > 0 && <div style={{position: 'absolute', left: -6, top: '54%', width: `calc(${(strike * 100).toFixed(1)}% + 12px)`, height: 5, background: 'var(--color-op)'}} />}
      </div>
      {b.gloss.length > 0 && (
        <div style={{position: 'absolute', left: indent, top: 12, opacity: gloss * fade * detail, whiteSpace: 'nowrap',
          fontFamily: 'var(--font-display)', fontStyle: slant(n.gloss!), fontWeight: han || isHan(n.gloss!) ? 500 : 400, fontSize: TYPE.gloss, lineHeight: `${TYPE.glossLine}px`,
          color: state === 'dim' ? 'var(--color-border)' : 'var(--color-muted)'}}>
          {b.gloss.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
      {n.figure && (
        <div style={{position: 'absolute', left: indent, top: 22 + b.gloss.length * TYPE.glossLine, opacity: gloss * fade * detail, whiteSpace: 'nowrap', lineHeight: `${TYPE.figure + 8}px`,
          fontFamily: 'var(--font-mono)', fontSize: TYPE.figure, fontWeight: 700, color: 'var(--color-data)'}}>
          {spaced(n.figure)}
        </div>
      )}
      {(n.items ?? []).map((it, i) => {
        // ruled points under the gloss, each ruled in turn
        const p = ease(unit((show - 0.7) * 3.3 * Math.max(1, (n.items ?? []).length) / 2 - i));
        const top = 22 + b.gloss.length * TYPE.glossLine + (n.figure ? TYPE.figure + 18 : 0) + i * ITEM.line;
        return (
          <div key={i} style={{position: 'absolute', left: indent, top, display: 'flex', alignItems: 'center', gap: 16, whiteSpace: 'nowrap', opacity: (p > 0 ? 1 : 0) * fade * detail}}>
            <div style={{width: 24 * p, height: 3, background: state === 'normal' ? 'var(--color-text)' : c}} />
            <div style={{fontFamily: 'var(--font-sans)', fontSize: ITEM.size, lineHeight: `${ITEM.line - 6}px`, color: 'var(--color-text)', opacity: p}}>{spaced(it)}</div>
          </div>
        );
      })}
    </div>
  );
}
