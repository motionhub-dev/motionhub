import React from 'react';
import {closed, ease, rng, type Pt} from './paint.ts';
import {Wash} from './wash.tsx';

export const meta = {
  name: {en: 'Swatch card', 'zh-CN': '色卡'},
  purpose: 'steps',
  line: 'A swatch card on the book, a brushed patch named in pencil per stage; it stays through the page turns.',
  fits: 'the stages of a change; the ingredients of a thing; a summing-up',
  params: {
    items: {type: '{pigment, label, strength?}[]', doc: 'the swatches in order: a token or #hex, a word or two, and how strong (0 to 1, default 0.75)'},
    shown: {type: 'number', default: 0, doc: 'how many are painted: tween it one swatch at a time on the word that names each (1.6 is the second half-painted)'},
    columns: {type: 'number', default: 2, doc: 'swatches in a row'},
    cell: {type: 'px', default: 300, doc: 'each swatch\'s width; its height is 0.62 of it, with its label beneath'},
    card: {type: 'boolean', default: false, doc: 'paint on a loose card with its own shadow, as a global part above the book, so the board survives the page turns'},
  },
  preview: 41.8,
};

/** A swatch's outline: a rectangle of brushed colour, a little ragged where the brush started and lifted */
const patch = (w: number, h: number, seed: number) => {
  const r = rng(seed), pts: Pt[] = [];
  for (let i = 0; i <= 8; i++) pts.push([w * (i / 8), (r() - 0.5) * 8]);
  for (let i = 0; i <= 4; i++) pts.push([w + (r() - 0.3) * 14, h * (i / 4)]);
  for (let i = 8; i >= 0; i--) pts.push([w * (i / 8), h + (r() - 0.5) * 10]);
  for (let i = 4; i >= 0; i--) pts.push([(r() - 0.6) * 8, h * (i / 4)]);
  return closed(pts);
};

export function Swatches({items, shown = 0, columns = 2, cell = 300, card = false}: {items: {pigment: string; label: string; strength?: number}[]; shown?: number; columns?: number; cell?: number; card?: boolean}) {
  const h = Math.round(cell * 0.62), gapX = Math.round(cell * 0.16), label = Math.max(40, Math.round(cell * 0.15)), rowH = h + label * 1.25 + 28;
  const rows = Math.ceil(items.length / columns), pad = card ? Math.round(cell * 0.18) : 0;
  return (
    <div style={{position: 'absolute', left: 0, top: 0}}>
      {card && <div style={{position: 'absolute', left: 0, top: 0, width: columns * cell + (columns - 1) * gapX + pad * 2, height: rows * rowH + pad * 1.4, background: 'var(--vt-panel)',
        borderRadius: 3, boxShadow: '0 1px 2px rgba(60,45,30,0.25), 0 10px 22px -8px rgba(60,45,30,0.4)'}} />}
      {items.map((it, i) => {
        const p = ease(shown - i, 0, 1);
        if (p <= 0) return null;
        const x = pad + (i % columns) * (cell + gapX), y = pad + Math.floor(i / columns) * rowH;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: cell, height: rowH}}>
            <Wash d={patch(cell, h, 11 + i * 7)} width={cell} height={h} pigment={it.pigment} strength={it.strength ?? 0.75} paint={ease(p, 0, 0.6)} dry={ease(p, 0.4, 1)} from="left" granulate={0.6} wobble={6} />
            <div style={{position: 'absolute', left: 4, top: h + 12, fontFamily: 'var(--vt-display)', fontSize: label, lineHeight: 1.25, color: 'var(--vt-muted)', mixBlendMode: 'multiply',
              clipPath: `inset(-20% ${((1 - ease(p, 0.45, 1)) * 100).toFixed(1)}% -20% -2%)`}}>{it.label}</div>
          </div>
        );
      })}
    </div>
  );
}
