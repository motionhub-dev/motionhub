import React from 'react';
import {ease, type Pt} from './paint.ts';
import {Pencil} from './pencil.tsx';

export const meta = {
  name: {en: 'Pencilled note', 'zh-CN': '铅笔批注'},
  purpose: 'term',
  line: 'A few words pencilled by hand beside the picture, with a small curved arrow to what they name.',
  fits: 'the name of a part; a word the lesson teaches; a quiet aside',
  params: {
    text: {type: 'text', doc: 'the note, a few words; \\n breaks a line'},
    write: {type: 'progress', default: 1, doc: '0 to 1: how much of it is written, left to right'},
    to: {type: '[x, y]', default: null, doc: 'where its arrow points, in px from the note\'s top left (negative to point left or up); none for no arrow'},
    size: {type: 'px', default: 46, doc: 'the letters\' size: 40 to 60'},
    align: {type: 'left | right', default: 'left', doc: 'which side the lines are set from'},
  },
  preview: 13.5,
};

export function Note({text, write = 1, to = null, size = 46, align = 'left'}: {text: string; write?: number; to?: Pt | null; size?: number; align?: 'left' | 'right'}) {
  const w = ease(write);
  if (w <= 0) return null;
  const lines = text.split('\n'), longest = Math.max(...lines.map((l) => l.length));
  const boxW = Math.ceil(longest * size * 0.5) + 20, boxH = Math.ceil(lines.length * size * 1.25) + 12;
  // the arrow leaves from the side of the words nearest its point, and is drawn once the words are written
  let arrow: Pt[] | null = null;
  if (to) {
    const sx = to[0] < 0 ? -6 : to[0] > boxW ? boxW + 6 : boxW / 2, sy = to[1] < 0 ? -4 : to[1] > boxH ? boxH + 2 : boxH / 2;
    const mx = (sx + to[0]) / 2 + (to[1] - sy) * 0.18, my = (sy + to[1]) / 2 - (to[0] - sx) * 0.18;
    arrow = [[sx, sy], [mx, my], to];
  }
  const span = arrow ? Math.max(boxW, Math.abs(arrow[2][0]) + 40) : boxW;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: boxW, height: boxH}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: boxW, fontFamily: 'var(--vt-display)', fontSize: size, lineHeight: 1.25, color: 'var(--vt-muted)',
        textAlign: align, whiteSpace: 'pre', paddingBottom: 8, mixBlendMode: 'multiply', clipPath: `inset(-20% ${((1 - ease(w, 0, 0.8)) * 100).toFixed(1)}% -20% -4%)`}}>{text}</div>
      {arrow && <Pencil points={arrow} width={span} height={boxH} draw={ease(w, 0.7, 1)} arrow weight={2.4} />}
    </div>
  );
}
