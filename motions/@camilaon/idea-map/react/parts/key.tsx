import React from 'react';
import {type RelationKind, unit, spaced} from './geometry.ts';
import {Line, Head} from './relation.tsx';

export const meta = {
  name: {en: 'Key of relations', 'zh-CN': '关系图例'},
  purpose: 'link',
  line: 'A sample of each kind of line the map uses, and what it means.',
  fits: 'the first time two kinds of relation meet',
  params: {
    items: {type: 'object', doc: '[{kind, label}]: only the kinds this map uses, in the order they appear'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the samples draw in turn'},
  },
  preview: 27.4,
};

export function Key({items, show = 1}: {items: {kind: RelationKind; label: string}[]; show?: number}) {
  if (show <= 0.001) return null;
  return (
    // more than three kinds go in two columns, so the key stays in the band above the map
    <div style={{position: 'absolute', right: 80, top: 52, padding: '12px 16px', background: 'var(--color-bg)', display: 'grid', gridAutoFlow: 'column', gridTemplateRows: `repeat(${Math.min(3, items.length)}, auto)`, columnGap: 40, rowGap: 6, alignItems: 'center'}}>
      {items.map((it, i) => {
        const s = unit(show * items.length - i);
        const len = 88 * s;
        return (
          <div key={it.kind} style={{display: 'flex', alignItems: 'center', gap: 18, opacity: s > 0.01 ? 1 : 0}}>
            <svg width={100} height={40} style={{overflow: 'visible'}}>
              <Line d={`M6 20H${(6 + len).toFixed(1)}`} kind={it.kind} color="var(--color-text)" />
              {it.kind === 'opposes' && <g transform="translate(6 20) rotate(180)"><Head kind="opposes" color="var(--color-text)" /></g>}
              {s > 0.98 && <g transform={`translate(${6 + len} 20)`}><Head kind={it.kind} color="var(--color-text)" /></g>}
            </svg>
            <div style={{fontFamily: 'var(--font-sans)', fontSize: 34, lineHeight: '40px', fontWeight: 500, color: 'var(--color-text)', whiteSpace: 'nowrap', opacity: unit(s * 2 - 1)}}>{spaced(it.label)}</div>
          </div>
        );
      })}
    </div>
  );
}
