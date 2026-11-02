import {eyebrow, stage, tag} from './ink.ts';

export const meta = {
  name: {en: 'Bars', 'zh-CN': '数值条'},
  purpose: 'data',
  line: 'Two to four amounts as bars on one tag, each growing on its words; the one that matters in teal.',
  fits: 'prices or scores of a few products; a benchmark read out',
  params: {
    labels: {type: 'list', doc: 'what each bar is, a few words'},
    values: {type: 'list', doc: 'each bar\'s amount, as numbers in the same order'},
    unit: {type: 'text', default: '', doc: 'after each value: GB, fps, %'},
    title: {type: 'text', default: '', doc: 'what is measured, one short line above'},
    grown: {type: 'number', default: 0, doc: 'how many bars are out: tween it up by one on each amount\'s words'},
    focus: {type: 'number', default: -1, doc: 'the index of the bar that matters, or -1'},
    width: {type: 'px', default: 760, doc: 'the tag\'s width'},
  },
  preview: 30.6,
};

export function Bars({labels, values, unit = '', title = '', grown = 0, focus = -1, width = 760}: {labels: string[]; values: Array<number | string>; unit?: string; title?: string; grown?: number; focus?: number; width?: number}) {
  const amounts = values.map(Number), max = Math.max(...amounts, 1);
  return (
    <div style={{...tag, width, boxSizing: 'border-box', padding: '22px 30px 26px'}}>
      {title && <div style={{...eyebrow, marginBottom: 16}}>{title}</div>}
      <div style={{display: 'grid', gridTemplateColumns: 'auto 1fr auto', columnGap: 22, rowGap: 16, alignItems: 'center'}}>
        {labels.map((label, i) => {
          const g = stage(grown - i, 0, 1), on = Math.round(focus) === i;
          const shown = amounts[i] * g;
          return [
            <div key={`l${i}`} style={{fontFamily: 'var(--vt-sans)', fontSize: 38, fontWeight: 700, color: on || focus < 0 ? 'var(--vt-text)' : 'var(--vt-muted)', opacity: g > 0 ? 1 : 0.35, whiteSpace: 'nowrap'}}>{label}</div>,
            <div key={`b${i}`} style={{height: 22, background: 'color-mix(in srgb, var(--vt-faint) 45%, transparent)', borderRadius: 2}}>
              <div style={{height: '100%', width: `${((100 * shown) / max).toFixed(2)}%`, background: on ? 'var(--vt-data)' : 'var(--vt-muted)', borderRadius: 2}} />
            </div>,
            <div key={`v${i}`} style={{fontFamily: 'var(--vt-display)', fontSize: 40, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: on ? 'var(--vt-data)' : 'var(--vt-text)', opacity: g, minWidth: 64, textAlign: 'right', whiteSpace: 'nowrap'}}>
              {Number.isInteger(amounts[i]) ? Math.round(shown) : shown.toFixed(1)}{unit && <span style={{fontSize: 28, marginLeft: 4, color: 'var(--vt-muted)'}}>{unit}</span>}
            </div>,
          ];
        })}
      </div>
    </div>
  );
}
