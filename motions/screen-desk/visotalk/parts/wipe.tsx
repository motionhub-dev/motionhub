import React from 'react';
import {useZoom} from './desk.tsx';

export const meta = {
  name: {en: 'Before and after', 'zh-CN': '前后对比'},
  purpose: 'compare',
  line: 'A blue handle sweeps across a screen, wiping its old state into the new, each side named by a chip.',
  fits: 'a redesign, a setting before and after, an old plan against the new',
  params: {
    x: {type: 'px', doc: 'the region\'s left edge, in desk pixels'},
    y: {type: 'px', doc: 'the region\'s top edge'},
    w: {type: 'px', doc: 'the region\'s width'},
    h: {type: 'px', doc: 'the region\'s height'},
    wipe: {type: 'progress', default: 0, doc: '0 shows the old state (the children), 1 the new one drawn beneath; the handle sweeps left to right'},
    before: {type: 'text', default: 'Before', doc: 'the chip on the old side'},
    after: {type: 'text', default: 'Now', doc: 'the chip on the new side'},
  },
  preview: 42.6,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));

/** `children` is the old state, drawn in desk pixels over the new one, and cut away left of the handle */
export function Wipe({x, y, w, h, wipe = 0, before = 'Before', after = 'Now', children}: {x: number; y: number; w: number; h: number; wipe?: number; before?: string; after?: string; children?: React.ReactNode}) {
  const z = useZoom();
  const e = unit(wipe);
  const at = x + w * e;   // the handle, in desk pixels; the chips sit along the bottom edge, clear of the screen's headings
  const chip = (text: string, side: 'left' | 'right', on: boolean) => (
    <div style={{position: 'absolute', top: y + h - 66 / z, [side]: side === 'left' ? x + 16 / z : 1920 - (x + w) + 16 / z, transform: `scale(${(1 / z).toFixed(4)})`, transformOrigin: side === 'left' ? '0 0' : '100% 0', lineHeight: '34px',
      padding: '8px 18px', borderRadius: 20, fontFamily: 'var(--vt-sans)', fontSize: 26, fontWeight: 700, whiteSpace: 'nowrap',
      background: on ? 'var(--vt-data)' : 'var(--vt-text)', color: '#fff', boxShadow: '0 10px 22px -12px rgba(28, 29, 33, 0.6)'}}>{text}</div>
  );
  return (
    <>
      {e < 0.999 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: `inset(${y}px ${Math.max(0, 1920 - x - w)}px ${Math.max(0, 1080 - y - h)}px ${at}px)`}}>
          {children}
        </div>
      )}
      {e > 0.01 && e < 0.999 && (
        <div style={{position: 'absolute', left: at, top: y, width: 0, height: h}}>
          <div style={{position: 'absolute', left: -2 / z, top: 0, width: 4 / z, height: h, background: 'var(--vt-data)', boxShadow: `0 0 ${18 / z}px rgba(47, 91, 255, 0.55)`}} />
          <div style={{position: 'absolute', left: 0, top: h / 2, width: 0, height: 0, transform: `scale(${(1 / z).toFixed(4)})`}}>
            <div style={{position: 'absolute', left: -28, top: -28, width: 56, height: 56, borderRadius: 28, background: 'var(--vt-data)', boxShadow: '0 0 0 4px #fff, 0 12px 24px -10px rgba(47, 91, 255, 0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#fff', fontFamily: 'var(--vt-sans)', fontSize: 24, fontWeight: 700}}>‹ ›</div>
          </div>
        </div>
      )}
      {e < 0.92 && chip(before, 'right', false)}
      {e > 0.08 && chip(after, 'left', true)}
    </>
  );
}
