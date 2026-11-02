import React from 'react';

export const meta = {
  name: {en: 'Figures from the source', 'zh-CN': '原文数据'},
  purpose: 'data',
  line: 'A source\'s figures as bars on a zero baseline, each drawn as it is said, the deciding one highlighted.',
  fits: 'rated against supplied; a claim against the count; a short series from a table',
  params: {
    rows: {type: 'list', doc: '[{label, value, note}]: `label` what it measures, `note` where the source states it, in the mono face'},
    unit: {type: 'text', default: '', doc: 'the unit every value shares, printed after each figure: "V dc"'},
    max: {type: 'number', default: 0, doc: 'the scale\'s top, a round number above the largest value; 0 takes the largest value'},
    ticks: {type: 'number', default: 0, doc: 'the step between gridlines on the scale; 0 for none'},
    show: {type: 'progress', default: 1, doc: '0 to the number of rows: each bar grows in turn as its figure is said (1 draws the first)'},
    accent: {type: 'number', default: -1, doc: 'the index of the row the case turns on, its figure highlighted; -1 for none'},
  },
  preview: 53.5,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => 1 - (1 - unit(v)) ** 3;

const LABEL = 300;   // the label column, in board pixels
const BAR = 46;      // a bar's height

export function Chart({rows, unit: u = '', max = 0, ticks = 0, show = 1, accent = -1}: {rows: Array<{label: string; value: number; note?: string}>; unit?: string; max?: number; ticks?: number; show?: number; accent?: number}) {
  const top = max || Math.max(...rows.map((r) => r.value));
  const W = 360;   // the scale's length, in board pixels: one honest scale for every bar, from zero
  const x = (v: number) => (v / top) * W;
  const grid = ticks > 0 ? Array.from({length: Math.floor(top / ticks) + 1}, (_, i) => i * ticks) : [];
  return (
    <div style={{padding: '40px 44px 64px', color: 'var(--vt-bg)'}}>
      <div style={{position: 'relative', display: 'grid', gridTemplateColumns: `${LABEL}px ${W}px 1fr`, rowGap: 34, alignItems: 'center'}}>
        {/* the scale's gridlines and their figures, under the bars */}
        {grid.map((g) => (
          <React.Fragment key={g}>
            <div style={{position: 'absolute', left: LABEL + x(g), top: -10, bottom: -14, width: 0, borderLeft: `${g === 0 ? 2 : 1}px ${g === 0 ? 'solid' : 'dashed'} var(--vt-bg)`, opacity: g === 0 ? 0.7 : 0.25}} />
            {/* the scale's figure, under the line's end, clear of it */}
            <span style={{position: 'absolute', left: LABEL + x(g) - 30, bottom: -44, width: 60, textAlign: 'center', fontFamily: 'var(--vt-mono)', fontSize: 19, opacity: 0.7}}>{g}</span>
          </React.Fragment>
        ))}
        {rows.map((r, i) => {
          const g = ease(show - i), on = unit((show - i) * 4);
          const mark = i === accent ? unit((show - i - 0.5) / 0.5) : 0;
          return [
            <div key={`l${i}`} style={{opacity: on}}>
              <div style={{fontFamily: 'var(--vt-sans)', fontSize: 22, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7}}>{r.label}</div>
              {r.note && <div style={{fontFamily: 'var(--vt-mono)', fontSize: 18, marginTop: 6, opacity: 0.6}}>{r.note}</div>}
            </div>,
            <div key={`b${i}`} style={{height: BAR, width: x(r.value) * g, background: 'var(--vt-bg)', opacity: 0.88}} />,
            <div key={`v${i}`} style={{position: 'relative', justifySelf: 'start', marginLeft: x(r.value) * g - W + 18, opacity: unit((show - i - 0.6) / 0.4), whiteSpace: 'nowrap'}}>
              {mark > 0.001 && <div style={{position: 'absolute', left: -8, bottom: 8, height: 30, width: `calc(${(mark * 100).toFixed(1)}% + 16px)`, background: 'var(--vt-data)', transform: 'rotate(-0.8deg)'}} />}
              <span style={{position: 'relative', fontFamily: 'var(--vt-display)', fontSize: 76, fontWeight: 600, lineHeight: 1}}>{r.value}</span>
              {u && <span style={{position: 'relative', fontFamily: 'var(--vt-display)', fontSize: 34, fontWeight: 500, marginLeft: 8}}>{u}</span>}
            </div>,
          ];
        })}
      </div>
    </div>
  );
}
