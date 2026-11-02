import {litStyle, unit} from './light.ts';

export const meta = {
  name: {en: 'Meter', 'zh-CN': '量条'},
  purpose: 'compare',
  line: 'Horizontal bars on one scale, each labelled at its end, growing on the words; the one in focus in the light\'s colour.',
  fits: 'two to five quantities of one kind; a then-and-now; sizes that differ by orders of magnitude (on a labelled log scale)',
  params: {
    items: {type: '{label, value, text?}[]', doc: 'the bars; text is how the value is written (19 billion)'},
    grow: {type: 'progress', default: 1, doc: '0 to 1: how far the bars have grown'},
    focus: {type: 'number', default: -1, doc: 'the bar in the light; the others dim'},
    log: {type: 'boolean', default: false, doc: 'a log scale, written under the bars, for values that differ by orders of magnitude'},
    width: {type: 'px', default: 1500, doc: 'the meter\'s width'},
  },
  preview: 27,
};

type Item = {label: string; value: number; text?: string};

export function Meter({items, grow = 1, focus = -1, log = false, width = 1500}: {items: Item[]; grow?: number; focus?: number; log?: boolean; width?: number}) {
  const scale = (v: number) => (log ? Math.log10(Math.max(1, v)) : v);
  const top = Math.max(...items.map((i) => scale(i.value)));
  const g = unit(grow), track = width - 360;
  return (
    <div style={{width, fontFamily: 'var(--vt-sans)', color: 'var(--vt-text)'}}>
      {items.map((it, i) => {
        const on = focus < 0 || focus === i;
        return (
          <div key={i} style={{...litStyle(on ? 1 : 0.25), display: 'flex', alignItems: 'center', gap: 24, margin: '22px 0'}}>
            <div style={{width: 300, fontSize: 32, fontWeight: 600, textAlign: 'right'}}>{it.label}</div>
            <div style={{position: 'relative', width: track, height: 44}}>
              <div style={{position: 'absolute', left: 0, top: 0, height: 44, width: Math.max(4, Math.round((track - 220) * (scale(it.value) / top) * g)), borderRadius: 3,
                background: on && focus >= 0 ? 'var(--vt-data)' : 'var(--vt-muted)'}} />
              <div style={{position: 'absolute', top: 2, left: Math.max(4, Math.round((track - 220) * (scale(it.value) / top) * g)) + 16, fontFamily: 'var(--vt-display)', fontSize: 40, fontWeight: 800,
                whiteSpace: 'nowrap', opacity: g}}>{it.text ?? it.value.toLocaleString('en-US')}</div>
            </div>
          </div>
        );
      })}
      {log && <div style={{marginLeft: 324, fontSize: 24, color: 'var(--vt-muted)', letterSpacing: '0.06em'}}>log scale · each equal step is ten times more</div>}
    </div>
  );
}
