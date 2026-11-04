import {PEN, drawn, fit, unit, written} from './pens.ts';

export const meta = {
  name: {en: 'Numbered steps', 'zh-CN': '编号步骤'},
  purpose: 'steps',
  line: 'A list down the page, each step\'s number ringed by hand and its words written after, the step being said in red.',
  fits: 'a process in order; how to do something; reasons one by one; what happened first, then next',
  params: {
    items: {type: 'text[]', doc: 'two to six steps, a short phrase each'},
    shown: {type: 'number', default: 99, doc: 'how many are written so far, with fractions mid-step; tween it on each step\'s words'},
    current: {type: 'number', default: -1, doc: 'the index of the step in red, the scene\'s one red thing; -1 for none'},
    width: {type: 'px', default: 1000, doc: 'the list\'s width'},
    height: {type: 'px', default: 560, doc: 'the list\'s height: the steps share it'},
  },
  preview: 'list.jpg',
};

export function Steps({items, shown = 99, current = -1, width = 1000, height = 560}: {items: string[]; shown?: number; current?: number; width?: number; height?: number}) {
  const row = Math.min(150, height / (items.length || 1)), r = Math.min(30, row * 0.3), room = width - 2 * r - 36;
  // one size for the whole list, so a long step does not stand apart
  const size = Math.min(56, row * 0.52, ...items.map((text) => fit(text, room, 56)));
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width, height, fontFamily: 'var(--font-display)', fontWeight: 500}}>
      {items.map((text, i) => {
        const p = unit(shown - i), ring = unit(p / 0.3), words = unit((p - 0.25) / 0.75), pen = i === current ? PEN.red : PEN.ink, y = row * i + row / 2, cx = r + 6;
        return (
          <div key={i}>
            <svg width={2 * r + 12} height={row} style={{position: 'absolute', left: 0, top: row * i, overflow: 'visible'}}>
              <path d={`M${cx + r} ${row / 2 - 3} C ${cx + r - 2} ${row / 2 - r * 1.3}, ${cx - r * 1.2} ${row / 2 - r * 1.2}, ${cx - r} ${row / 2} C ${cx - r} ${row / 2 + r * 1.3}, ${cx + r * 1.2} ${row / 2 + r * 1.2}, ${cx + r} ${row / 2 - 5}`} fill="none" stroke={pen} strokeWidth={4} strokeLinecap="round" {...drawn(ring)} />
            </svg>
            <div style={{position: 'absolute', left: 0, width: 2 * r + 12, top: y - r, height: 2 * r, lineHeight: `${2 * r}px`, textAlign: 'center', fontSize: r * 1.1, fontWeight: 600, color: pen, opacity: ring >= 1 ? 1 : 0}}>{i + 1}</div>
            <div style={{position: 'absolute', left: 2 * r + 36, top: row * i, lineHeight: `${row}px`, fontSize: size, color: pen, whiteSpace: 'nowrap', ...written(words)}}>{text}</div>
          </div>
        );
      })}
    </div>
  );
}
