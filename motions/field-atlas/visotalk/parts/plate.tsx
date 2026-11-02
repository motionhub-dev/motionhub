// The film's title as an atlas plate prints it: a spaced small-capitals line naming the region and its dates between two hairlines, the
// title in the serif, and a line under it. It is set on a paper card in a corner of the map, never over the subject, and leaves with a fade.
import React from 'react';
import {unit} from './geo.ts';

export const meta = {
  name: {en: 'Plate title', 'zh-CN': '图版标题'},
  purpose: 'title',
  line: 'The title as an atlas plate: region and dates in spaced capitals between hairlines, the title in the serif, on a paper card in a corner.',
  fits: 'the opening over the globe; a new region; the closing card',
  params: {
    kicker: {type: 'text', doc: 'the region and the dates, short'},
    title: {type: 'text', doc: 'the title, a few words'},
    sub: {type: 'text', doc: 'optional: one line under the title'},
    x: {type: 'px', default: 96, doc: 'its left edge'},
    y: {type: 'px', default: 96, doc: 'its top'},
    size: {type: 'px', default: 92, doc: 'the title\'s size'},
    show: {type: 'progress', default: 0, doc: 'its entrance: the rules draw out, then the words'},
  },
  preview: 2.4,
};

export function Plate({kicker, title, sub, x = 96, y = 96, size = 92, show = 0}: {kicker: string; title: string; sub?: string; x?: number; y?: number; size?: number; show?: number}) {
  const s = unit(show);
  if (s <= 0.01) return null;
  const rule = unit(s / 0.5), words = unit((s - 0.15) / 0.6);
  return (
    <div style={{position: 'absolute', left: x, top: y, padding: '30px 40px 32px', background: 'color-mix(in srgb, var(--vt-panel) 93%, transparent)', boxShadow: '0 1px 2px rgba(34, 38, 43, 0.16)', opacity: unit(s / 0.4), fontFamily: 'var(--vt-sans)', color: 'var(--vt-text)'}}>
      <div style={{height: 1.5, background: 'var(--vt-text)', width: `${rule * 100}%`}} />
      <div style={{fontSize: 25, fontWeight: 600, letterSpacing: '0.24em', textTransform: 'uppercase', padding: '12px 0', opacity: words}}>{kicker}</div>
      <div style={{height: 1.5, background: 'var(--vt-text)', width: `${rule * 100}%`, marginLeft: 'auto'}} />
      <div style={{fontFamily: 'var(--vt-display)', fontSize: size, fontWeight: 500, lineHeight: 1.02, marginTop: 22, letterSpacing: '-0.01em', opacity: words, transform: `translateY(${(1 - words) * 8}px)`, whiteSpace: 'nowrap'}}>{title}</div>
      {sub && <div style={{fontSize: 30, marginTop: 16, color: 'var(--vt-muted)', opacity: words}}>{sub}</div>}
      <div style={{height: 4, width: 72, background: 'var(--vt-data)', marginTop: 24, transform: `scaleX(${words})`, transformOrigin: 'left'}} />
    </div>
  );
}
