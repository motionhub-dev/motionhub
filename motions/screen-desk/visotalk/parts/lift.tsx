import React from 'react';

export const meta = {
  name: {en: 'Lift', 'zh-CN': '浮起'},
  purpose: 'term',
  line: 'The one control rises off the screen on a white tile, tips towards the viewer, settles level, then sets back down.',
  fits: 'the setting a step changes: a toggle, a picker, a row; once a scene',
  params: {
    lift: {type: 'progress', default: 0, doc: '0 in place, 1 raised; tween it back to 0 to set it down'},
  },
  preview: 22.8,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));

/** How far a raised tile comes towards the camera: it reads 7% larger, so marks drawn round it are scaled by LIFT_SCALE */
const DEPTH = 1200;
export const LIFT_SCALE = 1.07;
const Z = DEPTH * (1 - 1 / LIFT_SCALE);

export function Lift({lift = 0, children}: {lift?: number; children?: React.ReactNode}) {
  const l = unit(lift);
  const e = l * l * (3 - 2 * l);
  const tip = Math.sin(Math.PI * e);   // tipped on the way, level when raised and when down
  // the highlight crosses once, on the way up only
  const sheen = l < 0.999 && e > 0.15 ? -40 + 180 * unit((e - 0.15) / 0.85) : null;
  return (
    <div style={{position: 'relative'}}>
      {/* the slot it left: a faint well in the screen */}
      <div style={{position: 'absolute', inset: 0, borderRadius: 14, background: 'var(--vt-panel2)', boxShadow: 'inset 0 2px 6px rgba(38, 36, 30, 0.10)', opacity: e}} />
      <div style={{position: 'relative', borderRadius: 14,
        background: e > 0.001 ? `${sheen !== null ? `linear-gradient(105deg, transparent ${sheen - 14}%, rgba(220, 228, 255, 0.9) ${sheen}%, transparent ${sheen + 14}%), ` : ''}var(--vt-panel)` : 'transparent',
        transform: e > 0.001 ? `perspective(${DEPTH}px) translateY(${(-14 * e).toFixed(2)}px) translateZ(${(Z * e).toFixed(2)}px) rotateX(${(-14 * tip).toFixed(2)}deg)` : undefined,
        boxShadow: e > 0.001 ? `0 ${(34 * e).toFixed(1)}px ${(60 * e).toFixed(1)}px -${(22 * e).toFixed(1)}px rgba(38, 36, 30, ${(0.45 * e).toFixed(3)}), 0 0 0 1px rgba(38, 36, 30, ${(0.07 * e).toFixed(3)})` : 'none'}}>
        {children}
      </div>
    </div>
  );
}
