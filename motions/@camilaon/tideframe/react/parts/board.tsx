export const meta = {
  name: {en: 'Board', 'zh-CN': '状态板'},
  purpose: 'data',
  line: 'A glass status board: column heads, rows that print downward, and one focused row in green.',
  fits: 'lanes, regions or models in a few columns; the numbers behind a schematic',
  params: {
    title: {type: 'text', doc: 'the board\'s kicker'},
    columns: {type: 'text[]', doc: 'three column heads'},
    rows: {type: '{label, value, note}[]', doc: 'each row: label, the figure, and a short note'},
    shown: {type: 'number', default: null, doc: 'how many rows are printed; all of them without one'},
    focus: {type: 'number', default: -1, doc: 'the row in green, counting from 0; none when negative'},
    width: {type: 'px', default: 760, doc: 'the board\'s width'},
  },
  preview: 9.2,
};

type Row = {label: string; value: string; note: string};

export function Board({title, columns, rows, shown = null, focus = -1, width = 760}: {title: string; columns: string[]; rows: Row[]; shown?: number | null; focus?: number; width?: number}) {
  const n = shown == null ? rows.length : Math.max(0, Math.min(rows.length, Math.floor(shown)));
  return (
    <div style={{width, boxSizing: 'border-box', borderRadius: 18, overflow: 'hidden', background: 'color-mix(in srgb, var(--color-panel) 92%, transparent)', border: '1px solid var(--color-border)', color: 'var(--color-text)'}}>
      <div style={{padding: '22px 28px 0', fontFamily: 'var(--font-mono)', fontSize: 16, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-grad)'}}>{title}</div>
      <div style={{display: 'grid', gridTemplateColumns: '1.35fr 0.7fr 1.15fr', gap: 12, padding: '16px 28px 12px', fontFamily: 'var(--font-mono)', fontSize: 15, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-muted)'}}>
        {columns.map((col) => <div key={col}>{col}</div>)}
      </div>
      {rows.slice(0, n).map((row, i) => {
        const on = i === focus;
        return (
          <div key={row.label} style={{display: 'grid', gridTemplateColumns: '1.35fr 0.7fr 1.15fr', gap: 12, alignItems: 'center', padding: '15px 28px', borderTop: '1px solid var(--color-border)', background: on ? 'color-mix(in srgb, var(--color-data) 12%, transparent)' : 'transparent', boxShadow: on ? 'inset 3px 0 0 var(--color-data)' : 'none'}}>
            <div style={{fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 600}}>{row.label}</div>
            <div style={{fontFamily: 'var(--font-mono)', fontSize: 28, fontVariantNumeric: 'tabular-nums', color: on ? 'var(--color-data)' : 'var(--color-text)'}}>{row.value}</div>
            <div style={{fontFamily: 'var(--font-sans)', fontSize: 22, color: 'var(--color-muted)'}}>{row.note}</div>
          </div>
        );
      })}
    </div>
  );
}
