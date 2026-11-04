import {PEN, drawn, fit, unit, written} from './pens.ts';

export const meta = {
  name: {en: 'Tally', 'zh-CN': '计数记号'},
  purpose: 'data',
  line: 'A number of small circles drawn one by one in rows, so an amount can be seen and counted; some pencilled in pale, struck through, or one group in red.',
  fits: 'one in three; how many out of a hundred; what is lost or left of a group; a count too small for a bar chart',
  params: {
    groups: {type: '{count, as?, label?}[]', doc: 'the groups in order; as is ink, pencil, struck or red (default ink), red the scene\'s one red thing; label is written under the tally with its count'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: the circles one after another, then the labels'},
    columns: {type: 'number', default: 10, doc: 'how many to a row'},
    width: {type: 'px', default: 900, doc: 'the widest a row may be: height may keep the circles smaller'},
    height: {type: 'px', default: 500, doc: 'the height, labels included; the circles size to fit both'},
    fill: {type: 'boolean', default: true, doc: 'wash inside each circle; false for empty rings'},
  },
  preview: 'tally.jpg',
};

type As = 'ink' | 'pencil' | 'struck' | 'red';

export function Tally({groups, draw = 1, columns = 10, width = 900, height = 500, fill = true}: {groups: {count: number; as?: As; label?: string}[]; draw?: number; columns?: number; width?: number; height?: number; fill?: boolean}) {
  const marks = groups.flatMap((g) => Array.from({length: Math.max(0, Math.round(g.count))}, () => g.as ?? 'ink'));
  const n = marks.length, labels = groups.filter((g) => g.label), foot = labels.length ? 72 : 0;
  const rows = Math.max(1, Math.ceil(n / columns)), cell = Math.min(width / columns, (height - foot) / rows), r = cell * 0.36;
  const color = {ink: PEN.ink, pencil: PEN.pencil, struck: PEN.pencil, red: PEN.red}, wash = {ink: 'var(--color-data)', pencil: 'none', struck: 'none', red: 'var(--color-grad)'};
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width, height, fontFamily: 'var(--font-display)'}}>
      <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {marks.map((as, i) => {
          const p = unit((draw / 0.8) * n - i), cx = (i % columns) * cell + cell / 2, cy = Math.floor(i / columns) * cell + cell / 2;
          return (
            <g key={i}>
              <path d={`M${cx + r} ${cy} a${r} ${r} 0 1 0 ${-2 * r} 0 a${r} ${r} 0 1 0 ${2 * r} 0`} fill={fill && wash[as] !== 'none' ? wash[as] : 'none'} fillOpacity={p >= 1 ? 0.3 : 0} stroke={color[as]} strokeWidth={Math.max(2.5, r * 0.14)} strokeLinecap="round" {...drawn(p)} />
              {as === 'struck' && <path d={`M${cx - r * 1.1} ${cy + r * 1.1} L${cx + r * 1.1} ${cy - r * 1.1}`} stroke={PEN.ink} strokeWidth={Math.max(3, r * 0.16)} strokeLinecap="round" {...drawn(unit(p * 2 - 1))} />}
            </g>
          );
        })}
      </svg>
      {labels.length > 0 && (
        <div style={{position: 'absolute', left: 0, top: rows * cell + 12, display: 'flex', gap: 44, whiteSpace: 'nowrap', fontWeight: 500}}>
          {labels.map((g, i) => (
            <div key={i} style={{fontSize: fit(`${g.count} ${g.label}`, width / labels.length - 44, 40), color: color[g.as ?? 'ink'], ...written((draw - 0.8) / 0.2)}}>{g.count} {g.label}</div>
          ))}
        </div>
      )}
    </div>
  );
}
