import {PEN, drawn, ems, fit, handBox, unit, written} from './pens.ts';

export const meta = {
  name: {en: 'Hand-drawn bars', 'zh-CN': '手绘条形图'},
  purpose: 'data',
  line: 'A bar chart ruled by hand: each bar outlined and washed in turn, its name and value written beside it, the one that matters in red.',
  fits: 'how much each thing is; a ranking; the same measure across a few things (for a total cut into parts, Breakdown)',
  params: {
    items: {type: '{label, value, display?}[]', doc: 'two to seven bars: a value of zero or more, and `display` for how it is written (default: the value)'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: bars arrive one after another; tween it across the words that name them'},
    focus: {type: 'number', default: -1, doc: 'the index of the bar drawn in red, the scene\'s one red thing; -1 for none'},
    width: {type: 'px', default: 1100, doc: 'the chart\'s width'},
    height: {type: 'px', default: 480, doc: 'the chart\'s height'},
    max: {type: 'number', doc: 'the value a full bar stands for (default: the largest); several charts that share it can be compared'},
  },
  preview: 21.6,
};

type Item = {label: string; value: number; display?: string};

export function Bars({items, draw = 1, focus = -1, width = 1100, height = 480, max}: {items: Item[]; draw?: number; focus?: number; width?: number; height?: number; max?: number}) {
  const n = items.length || 1, row = height / n, bar = Math.min(row * 0.62, 84);
  const shownValue = (it: Item) => it.display ?? String(it.value);
  // room for the longest name and value, each at most a third of the chart
  const size = Math.min(50, row * 0.5), labels = Math.min(width / 3, Math.max(...items.map((it) => ems(it.label))) * size + 24);
  const values = Math.min(width / 4, Math.max(...items.map((it) => ems(shownValue(it)))) * size + 24);
  const full = width - labels - values, top = max ?? Math.max(...items.map((it) => it.value), 0);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width, height, fontFamily: 'var(--font-display)', fontWeight: 500}}>
      {items.map((it, i) => {
        const p = unit(draw * n - i), line = unit(p / 0.7), words = unit((p - 0.55) / 0.45);
        const w = top > 0 ? Math.max(0, it.value / top) * full : 0, h = i === focus, y = row * i + (row - bar) / 2, pen = h ? PEN.red : PEN.ink;
        return (
          <div key={i}>
            <div style={{position: 'absolute', left: 0, top: row * i, width: labels - 16, height: row, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: fit(it.label, labels - 16, size), color: PEN.ink, whiteSpace: 'nowrap'}}><span style={written(line * 2)}>{it.label}</span></div>
            {w > 0 && (
              <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
                <path d={handBox(labels, y, w, bar, it.label + i)} fill={h ? 'var(--color-grad)' : 'var(--color-data)'} fillOpacity={unit((line - 0.85) / 0.15) * 0.3} stroke={pen} strokeWidth={h ? 5 : 4} strokeLinejoin="round" strokeLinecap="round" {...drawn(line)} />
              </svg>
            )}
            <div style={{position: 'absolute', left: labels + w + 14, top: row * i, height: row, display: 'flex', alignItems: 'center', fontSize: fit(shownValue(it), values - 14, size), color: pen, whiteSpace: 'nowrap'}}><span style={written(words)}>{shownValue(it)}</span></div>
          </div>
        );
      })}
    </div>
  );
}
