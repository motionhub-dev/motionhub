import {litStyle} from './light.ts';

export const meta = {
  name: {en: 'Ranking', 'zh-CN': '排行'},
  purpose: 'steps',
  line: 'Rows of named things with a year and a figure, revealed one by one, the row the narration is on in the light and the rest in shadow.',
  fits: 'milestones over time; the top five of something; steps of a process, each with its number',
  params: {
    rows: {type: '{label, note?, value}[]', doc: 'the rows, top to bottom; note is a year or a maker, value the figure as written'},
    shown: {type: 'number', default: 99, doc: 'how many rows are on the stage so far; set it on each row\'s word'},
    focus: {type: 'number', default: -1, doc: 'the row in the light; -1 lights them all'},
    width: {type: 'px', default: 1200, doc: 'the list\'s width'},
  },
  preview: 22.8,
};

type Row = {label: string; note?: string; value: string};

export function Ranking({rows, shown = 99, focus = -1, width = 1200}: {rows: Row[]; shown?: number; focus?: number; width?: number}) {
  return (
    <div style={{width}}>
      {rows.map((r, i) => {
        const on = focus < 0 || focus === i;
        return (
          <div key={i} style={{...litStyle(on ? 1 : 0.2), visibility: i < Math.floor(shown) ? 'visible' : 'hidden', display: 'flex', alignItems: 'baseline', gap: 28,
            padding: '16px 0', borderBottom: '1px solid var(--vt-border)'}}>
            <div style={{width: 110, fontFamily: 'var(--vt-sans)', fontSize: 30, color: 'var(--vt-muted)', fontVariantNumeric: 'tabular-nums'}}>{r.note ?? ''}</div>
            <div style={{flex: 1, minWidth: 0, fontFamily: 'var(--vt-display)', fontSize: 58, fontWeight: 800, textTransform: 'uppercase', color: 'var(--vt-text)', lineHeight: 1}}>{r.label}</div>
            <div style={{fontFamily: 'var(--vt-display)', fontSize: 64, fontWeight: 800, lineHeight: 1, color: on && focus >= 0 ? 'var(--vt-data)' : 'var(--vt-text)', whiteSpace: 'nowrap'}}>{r.value}</div>
          </div>
        );
      })}
    </div>
  );
}
