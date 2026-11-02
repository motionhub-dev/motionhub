export const meta = {
  name: {en: 'Ledger', 'zh-CN': '账目表'},
  purpose: 'compare',
  line: 'Printed rows with dotted leaders and figures in one column, a ruled total, and a highlighter pass over the row that matters.',
  fits: 'what a price is made of; fees that add up; two plans line by line',
  params: {
    rows: {type: '{label, value, note?}[]', doc: 'the rows, figures as printed text ($49)'},
    total: {type: '{label, value}', default: null, doc: 'the ruled total under the rows'},
    shown: {type: 'number', default: 99, doc: 'how many rows are printed so far (the total counts as one more); tween it to print row by row'},
    highlight: {type: 'number', default: -1, doc: 'the row the highlighter passes over'},
    swipe: {type: 'progress', default: 0, doc: '0 to 1: how far the highlighter has gone'},
    width: {type: 'px', default: 1100, doc: 'the width of the table'},
  },
  preview: 19.4,
};

type Row = {label: string; value: string; note?: string};

export function Ledger({rows, total = null, shown = 99, highlight = -1, swipe = 0, width = 1100}: {rows: Row[]; total?: {label: string; value: string} | null; shown?: number; highlight?: number; swipe?: number; width?: number}) {
  const visible = Math.floor(shown);
  const row = (r: Row, i: number, strong = false) => (
    <div key={i} style={{position: 'relative', display: 'flex', alignItems: 'baseline', gap: 16, padding: '14px 0', opacity: i < visible ? 1 : 0}}>
      {i === highlight && <div style={{position: 'absolute', left: -14, top: 8, bottom: 8, width: `calc(${(Math.max(0, Math.min(1, swipe)) * 100).toFixed(2)}% + 28px)`,
        background: 'var(--vt-warn)', opacity: 0.55, mixBlendMode: 'multiply', borderRadius: 3, transform: 'skewX(-6deg)'}} />}
      <span style={{position: 'relative', fontWeight: strong ? 600 : 400}}>{r.label}</span>
      {r.note && <span style={{position: 'relative', fontStyle: 'italic', fontSize: 30, color: 'var(--vt-muted)'}}>{r.note}</span>}
      <span style={{flex: 1, borderBottom: '3px dotted var(--vt-faint)', transform: 'translateY(-10px)'}} />
      <span style={{position: 'relative', fontVariantNumeric: 'tabular-nums lining-nums', fontWeight: strong ? 600 : 400, minWidth: 160, textAlign: 'right'}}>{r.value}</span>
    </div>
  );
  return (
    // the side padding is the room the highlighter's pass runs past the row
    <div style={{width, boxSizing: 'border-box', padding: '0 18px', fontFamily: 'var(--vt-sans)', fontSize: 44, color: 'var(--vt-text)'}}>
      {rows.map((r, i) => row(r, i))}
      {total && <div style={{borderTop: '3px double var(--vt-text)', marginTop: 8, opacity: rows.length < visible ? 1 : 0}}>{row(total, rows.length, true)}</div>}
    </div>
  );
}
