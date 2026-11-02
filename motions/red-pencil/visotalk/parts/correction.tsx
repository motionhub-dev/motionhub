import {lengthOf, pathOf, stroke, wobble} from './pencil-path.ts';

export const meta = {
  name: {en: 'Correction', 'zh-CN': '改正'},
  purpose: 'mark',
  line: 'A printed figure struck through in red, and the right one written by hand above it.',
  fits: 'a total that was added wrong; the price as advertised against the price as paid; an estimate the evidence revises',
  params: {
    wrong: {type: 'text', doc: 'the printed figure that is struck'},
    right: {type: 'text', doc: 'the figure written above it'},
    strike: {type: 'progress', default: 0, doc: '0 to 1: how much of the strike is drawn'},
    write: {type: 'progress', default: 0, doc: '0 to 1: how much of the correction is written'},
    size: {type: 'px', default: 120, doc: 'the printed figure\'s size'},
    label: {type: 'text', default: '', doc: 'what the figure counts, in small capitals under it'},
  },
  preview: 24.4,
};

export function Correction({wrong, right, strike = 0, write = 0, size = 120, label = ''}: {wrong: string; right: string; strike?: number; write?: number; size?: number; label?: string}) {
  // the strike runs a little past the printed figure, rising slightly, as a quick hand does
  const w = Math.round(size * 0.58 * wrong.length);
  const line = wobble(stroke([-size * 0.12, size * 0.62], [w + size * 0.14, size * 0.48], `strike:${wrong}`, 0.02), `strike:${wrong}`, 2);
  const len = lengthOf(line);
  return (
    <div style={{position: 'relative', display: 'inline-block', paddingTop: Math.round(size * 0.95)}}>
      <div style={{position: 'absolute', left: Math.round(size * 0.35), top: Math.round(size * 0.1), fontFamily: 'var(--vt-display)', fontSize: Math.round(size * 0.82), fontWeight: 700,
        color: 'var(--vt-grad)', transform: 'rotate(-4deg)', whiteSpace: 'nowrap', clipPath: `inset(-20% ${((1 - Math.max(0, Math.min(1, write))) * 100).toFixed(1)}% -20% -4%)`}}>{right}</div>
      <div style={{position: 'relative', fontFamily: 'var(--vt-sans)', fontSize: size, fontWeight: 600, lineHeight: 1, color: 'var(--vt-text)', fontVariantNumeric: 'tabular-nums lining-nums', whiteSpace: 'nowrap'}}>
        {wrong}
        {strike > 0 && (
          <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
            <path d={pathOf(line)} fill="none" stroke="var(--vt-grad)" strokeWidth={Math.max(5, size * 0.06)} strokeLinecap="round" strokeOpacity={0.92}
              strokeDasharray={len} strokeDashoffset={len * (1 - Math.min(1, strike))} />
          </svg>
        )}
      </div>
      {label && <div style={{fontFamily: 'var(--vt-sans)', fontSize: 24, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--vt-muted)', marginTop: 22}}>{label}</div>}
    </div>
  );
}
