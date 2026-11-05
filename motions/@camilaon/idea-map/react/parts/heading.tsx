import React from 'react';
import {unit, ease, spaced} from './geometry.ts';

export const meta = {
  name: {en: 'Running head', 'zh-CN': '图题'},
  purpose: 'title',
  line: 'The map\'s question at the head of the sheet: a mono kicker by a red square, the title, a short rule.',
  fits: 'the question a lesson answers; the incident under review',
  params: {
    kicker: {type: 'text', doc: 'a few words, as written: the subject, the map\'s number, a date'},
    title: {type: 'text', doc: 'the question or the subject, in one line (it wraps past 1040 px, clear of the key)'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the words stand up, then the rule runs out'},
  },
  preview: 1.8,
};

export function Heading({kicker, title, show = 1}: {kicker: string; title: string; show?: number}) {
  if (show <= 0.001) return null;
  const t = ease(unit(show / 0.6)), r = ease(unit((show - 0.35) / 0.65));
  return (
    <div style={{position: 'absolute', left: 80, top: 44, padding: '14px 16px 12px', background: 'var(--color-bg)'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, opacity: t}}>
        <div style={{width: 16, height: 16, background: 'var(--color-op)'}} />
        <div style={{fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 500, letterSpacing: /[㐀-鿿]/.test(kicker) ? '0.04em' : '0.02em', color: 'var(--color-muted)', whiteSpace: 'nowrap'}}>{spaced(kicker)}</div>
      </div>
      <div style={{marginTop: 10, fontFamily: 'var(--font-sans)', fontSize: 54, fontWeight: 600, letterSpacing: '-0.015em', lineHeight: '64px', color: 'var(--color-text)', maxWidth: 1040,
        opacity: t, transform: `translateY(${((1 - t) * 18).toFixed(1)}px)`}}>{spaced(title)}</div>
      <div style={{marginTop: 12, width: 120 * r, height: 3, background: 'var(--color-text)'}} />
    </div>
  );
}
