import React from 'react';
import {ease, stroke} from './paint.ts';
import {Wash} from './wash.tsx';

export const meta = {
  name: {en: 'Storybook title', 'zh-CN': '绘本标题'},
  purpose: 'title',
  line: 'The title in a soft, round serif over a stroke of wash, printed letter by letter, a pencilled line beneath.',
  fits: 'the cover; a chapter\'s first spread; the moral at the end',
  params: {
    text: {type: 'text', doc: 'the title; \\n breaks a line'},
    by: {type: 'text', default: '', doc: 'a pencilled line under it: who it is by, or what it is about'},
    width: {type: 'px', default: 760, doc: 'the box\'s width'},
    size: {type: 'px', default: 104, doc: 'the letters\' size: 88 to 130'},
    pigment: {type: 'token or #hex', default: 'warn', doc: 'the colour of the stroke of wash behind it'},
    swash: {type: 'progress', default: 1, doc: '0 to 1: the stroke of wash brushed in from the left'},
    write: {type: 'progress', default: 1, doc: '0 to 1: the letters printed one by one, then the pencilled line'},
  },
  preview: 3.4,
};

export function Title({text, by = '', width = 760, size = 104, pigment = 'warn', swash = 1, write = 1}: {text: string; by?: string; width?: number; size?: number; pigment?: string; swash?: number; write?: number}) {
  const lines = text.split('\n'), letters = text.replace(/\n/g, '').length, h = lines.length * size * 1.02;
  let k = 0;
  const shown = ease(write, 0, 0.85) * letters;
  // the wash sits low behind the last line, as a painter lays a band of colour under a title
  const band = stroke([[-10, h - size * 0.36], [width * 0.45, h - size * 0.46], [width * 0.92, h - size * 0.38]], size * 0.62, size * 0.48);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width, height: h + 90}}>
      <Wash d={band} width={width} height={h + 40} pigment={pigment} strength={0.55} paint={swash} dry={ease(swash, 0.5, 1)} from="left" granulate={0.2} wobble={10} />
      <div style={{position: 'relative', fontFamily: 'var(--vt-sans)', fontSize: size, lineHeight: 1.02, fontWeight: 620, color: 'var(--vt-text)', letterSpacing: '-0.01em',
        fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144'}}>
        {lines.map((line, i) => (
          <div key={i} style={{whiteSpace: 'pre'}}>
            {/* each letter takes the ink a beat after the one before */}
            {[...line].map((ch, j) => {
              const o = ease(shown - k++, 0, 1);
              return <span key={j} style={{opacity: o, filter: o < 1 ? `blur(${((1 - o) * 4).toFixed(2)}px)` : undefined}}>{ch}</span>;
            })}
          </div>
        ))}
      </div>
      {by && <div style={{position: 'absolute', left: 6, top: h + 26, fontFamily: 'var(--vt-display)', fontSize: Math.round(size * 0.42), color: 'var(--vt-muted)', mixBlendMode: 'multiply',
        clipPath: `inset(-20% ${((1 - ease(write, 0.8, 1)) * 100).toFixed(1)}% -20% -2%)`}}>{by}</div>}
    </div>
  );
}
