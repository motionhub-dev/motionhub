// The key to a fill, set as an atlas sets it: a short title in small capitals, a row of swatches on the ochre scale with what each means,
// and the source in small type. Each step arrives when it is first said. It sits in a corner of the frame, as an instrument, not on the land.
import React from 'react';
import {unit} from './geo.ts';
import {ochre} from './regions.tsx';

export const meta = {
  name: {en: 'Legend', 'zh-CN': '图例'},
  purpose: 'data',
  line: 'The key to a Regions fill: a small-capitals title, swatches on the same ochre scale with their meaning, and the source; each step arrives when it is said.',
  fits: 'beside every filled map; a count or a share in a few steps',
  params: {
    title: {type: 'text', doc: 'what is counted, in a few words'},
    steps: {type: '{value, label}[]', doc: 'the steps of the scale, lightest first, on the same `max` as the Regions'},
    max: {type: 'number', default: 1, doc: 'the Regions\' max'},
    shown: {type: 'number', default: 0, doc: 'how many steps are shown: tween it up by one on the word that names each'},
    paths: {type: '{label, told, show}[]', doc: 'optional: keys for Routes on the map, each a short line in red, or in ink once `told`'},
    source: {type: 'text', doc: 'where the values come from, in a few words'},
    x: {type: 'px', default: 1440, doc: 'its left edge'},
    y: {type: 'px', default: 96, doc: 'its top'},
    show: {type: 'progress', default: 0, doc: 'the whole key\'s entrance'},
  },
  preview: 20.4,
};

export function Legend({title, steps, max = 1, shown = 0, paths = [], source, x = 1440, y = 96, show = 0}: {title: string; steps: Array<{value: number; label: string}>; max?: number; shown?: number; paths?: Array<{label: string; told?: number; show?: number}>; source?: string; x?: number; y?: number; show?: number}) {
  const s = unit(show);
  if (s <= 0.01) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y + (1 - s) * 10, opacity: s, width: 384, boxSizing: 'border-box', padding: '22px 26px 20px', background: 'color-mix(in srgb, var(--vt-panel) 94%, transparent)', borderTop: '3px solid var(--vt-text)', boxShadow: '0 1px 2px rgba(34, 38, 43, 0.16)', fontFamily: 'var(--vt-sans)', color: 'var(--vt-text)'}}>
      <div style={{fontSize: 26, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1.3}}>{title}</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18}}>
        {steps.map((st, i) => {
          const a = unit(shown - i);
          if (a <= 0) return null;
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 16, opacity: a, transform: `translateX(${(1 - a) * -8}px)`}}>
              <div style={{width: 46, height: 30, background: ochre(st.value, max), border: '1.5px solid var(--vt-border)', boxSizing: 'border-box'}} />
              <div style={{fontSize: 28, fontWeight: 500}}>{st.label}</div>
            </div>
          );
        })}
      </div>
      {paths.filter((p) => (p.show ?? 1) > 0.01).map((p, i) => (
        <div key={`p${i}`} style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: i ? 10 : 16, opacity: unit(p.show ?? 1)}}>
          <svg width={46} height={30}><line x1={3} y1={15} x2={43} y2={15} stroke="var(--vt-panel)" strokeWidth={9} strokeLinecap="round" /><line x1={3} y1={15} x2={43} y2={15} stroke={`color-mix(in oklab, var(--vt-data), var(--vt-text) ${Math.round(unit(p.told ?? 0) * 100)}%)`} strokeWidth={4.2 - 1.4 * unit(p.told ?? 0)} strokeLinecap="round" /></svg>
          <div style={{fontSize: 28, fontWeight: 500}}>{p.label}</div>
        </div>
      ))}
      {source && <div style={{marginTop: 16, fontSize: 26, color: 'var(--vt-muted)', letterSpacing: '0.02em'}}>{source}</div>}
    </div>
  );
}
