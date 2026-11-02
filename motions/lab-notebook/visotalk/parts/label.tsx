import {PEN, drawn, unit, type Pen} from './pens.ts';

export const meta = {
  name: {en: 'Hand label', 'zh-CN': '手写标注'},
  purpose: 'term',
  line: 'A word or a short phrase written by hand on the word that names it, underlined when it matters.',
  fits: 'naming a part of the drawing; a term the narration introduces; a quantity next to what it measures',
  params: {
    text: {type: 'text', doc: 'a few words'},
    write: {type: 'progress', default: 1, doc: '0 to 1: how much is written, left to right'},
    size: {type: 'px', default: 52, doc: 'the hand\'s size'},
    pen: {type: 'ink | red | pencil', default: 'ink', doc: 'which pen'},
    underline: {type: 'boolean', default: false, doc: 'a line under it, drawn after the words'},
    tilt: {type: 'degrees', default: -2, doc: 'how far it leans'},
  },
  preview: 4.3,
};

export function HandLabel({text, write = 1, size = 52, pen = 'ink', underline = false, tilt = -2}: {text: string; write?: number; size?: number; pen?: Pen; underline?: boolean; tilt?: number}) {
  const shown = unit(write * 1.15); // the words finish first, the underline after
  const line = unit((write - 0.85) / 0.15);
  return (
    <div style={{position: 'relative', display: 'inline-block', transform: `rotate(${tilt}deg)`, transformOrigin: 'left center'}}>
      <div style={{fontFamily: 'var(--vt-display)', fontSize: size, lineHeight: 1.25, fontWeight: 500, color: PEN[pen], whiteSpace: 'nowrap',
        clipPath: `inset(-25% ${((1 - shown) * 100).toFixed(1)}% -25% -4%)`}}>{text}</div>
      {underline && line > 0 && (
        <svg width="100%" height={16} style={{position: 'absolute', left: 0, bottom: -6, overflow: 'visible'}} viewBox="0 0 100 16" preserveAspectRatio="none">
          <path d="M1 9 C 30 5, 60 13, 99 6" fill="none" stroke={PEN[pen]} strokeWidth={4} strokeLinecap="round" vectorEffect="non-scaling-stroke" {...drawn(line)} />
        </svg>
      )}
    </div>
  );
}
