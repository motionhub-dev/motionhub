import {PEN, drawn, unit} from './pens.ts';

export const meta = {
  name: {en: 'Figure frame', 'zh-CN': '图框'},
  purpose: 'title',
  line: 'A pencil box drawn round a drawing, with its figure label written underneath.',
  fits: 'setting one drawing apart as the thing to look at; naming a view (from above, in section, magnified)',
  params: {
    width: {type: 'px', doc: 'the box\'s width'},
    height: {type: 'px', doc: 'the box\'s height'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: how much of the box is drawn; the label is written after'},
    label: {type: 'text', default: '', doc: 'the figure label: Fig. 1 — ice, from above'},
  },
  preview: 16.6,
};

export function Frame({width, height, draw = 1, label = ''}: {width: number; height: number; draw?: number; label?: string}) {
  const box = unit(draw / 0.8), text = unit((draw - 0.8) / 0.2);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width, height}}>
      <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <path d={`M4 6 L${width - 3} 2 L${width - 5} ${height - 3} L2 ${height - 6} Z`} fill="none" stroke={PEN.pencil} strokeWidth={3} strokeLinejoin="round" {...drawn(box)} />
      </svg>
      {label && <div style={{position: 'absolute', left: 6, top: height + 12, fontFamily: 'var(--vt-display)', fontSize: 34, color: PEN.pencil, whiteSpace: 'nowrap',
        clipPath: `inset(-25% ${((1 - text) * 100).toFixed(1)}% -25% -4%)`}}>{label}</div>}
    </div>
  );
}
