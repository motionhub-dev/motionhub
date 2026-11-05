import {useMap, useMetrics, useEdgeFade, unit, ease, slant, TYPE, spaced} from './geometry.ts';

export const meta = {
  name: {en: 'Ruled chart', 'zh-CN': '刻线图表'},
  purpose: 'data',
  line: 'Bars ruled from zero, or one line on a valued scale with a reference mark; an estimate drawn open.',
  fits: 'a value and its forecast; a few groups; a series against a target',
  params: {
    kind: {type: 'text', default: 'bars', doc: 'bars (one row each) or line (one series over its labels)'},
    rows: {type: 'object', doc: 'bars: [{label, value, shown?, estimate?, marked?}]; line: [{label, value}] in order. shown is the value as written, decimals kept'},
    title: {type: 'text', doc: 'what is counted, with its unit'},
    source: {type: 'text', doc: 'where the figures come from'},
    max: {type: 'number', doc: 'the top of the scale (by default the largest value); bars start at zero, a line\'s scale goes below zero when its values do'},
    reference: {type: 'object', doc: 'line: {value, label}, a ruled mark across the scale (a target, a limit)'},
    at: {type: 'text', doc: 'inside IdeaMap: the term it stands under'},
    x: {type: 'px', default: 0, doc: 'without at: its left edge'},
    y: {type: 'px', default: 0, doc: 'without at: its top'},
    width: {type: 'px', default: 760, doc: 'how long the scale is'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the title, then each bar ruled out (or the line drawn) in turn'},
  },
  preview: 57.5,
};

type Row = {label: string; value: number; shown?: string; estimate?: boolean; marked?: boolean};
/** a scale value as written: whole numbers whole, others to the precision they need */
const nice = (v: number) => (Number.isInteger(v) ? String(v) : String(Number(v.toPrecision(3))));
const ROW = 66, LINE_H = 300;

export function Chart({kind = 'bars', rows, title, source, max, reference, at, x = 0, y = 0, width = 760, show = 1}: {
  kind?: 'bars' | 'line'; rows: Row[]; title?: string; source?: string; max?: number; reference?: {value: number; label: string}; at?: string; x?: number; y?: number; width?: number; show?: number;
}) {
  const map = useMap();
  const M = useMetrics();
  const n = at ? map?.at(at) : undefined;
  const X = n ? n.x : x, Y = n ? n.y + n.box.depth + 40 : y;
  const labelW = Math.max(0, ...rows.map((r) => M.width(r.label, 'mono', 30, 500))) + 24;
  const top = Math.max(1e-9, max ?? Math.max(...rows.map((r) => r.value), reference?.value ?? 0));
  // a line's scale reaches below zero when its values do; bars always start at zero
  const low = kind === 'line' ? Math.min(0, ...rows.map((r) => r.value), reference?.value ?? 0) : 0;
  const valueW = Math.max(0, ...rows.map((r) => M.width(r.shown ?? String(r.value), 'sans', 40, 600))) + 30;
  const scaleW = kind === 'line' ? Math.max(M.width(nice(top), 'mono', 28, 500), M.width(nice(low), 'mono', 28, 500)) + 20 : 0;
  const bodyH = kind === 'bars' ? rows.length * ROW : LINE_H + 50;
  const H = (title ? 56 : 0) + bodyH + (source ? 50 : 0);
    const fade = useEdgeFade({x0: X, y0: Y, x1: X + (kind === 'bars' ? labelW : scaleW) + width + valueW, y1: Y + H});
  if (show <= 0.001) return null;
  const head = ease(unit(show / 0.25));
  const step = (i: number, of: number) => ease(unit((show - 0.2) * 1.25 * of - i));
  const fmt = (r: Row) => r.shown ?? String(r.value);
  const y0 = title ? 56 : 0;
  return (
    <div style={{position: 'absolute', left: X, top: Y, width: 0, height: 0, opacity: fade}}>
      {title && <div style={{position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap', opacity: head, fontFamily: 'var(--font-display)', fontStyle: slant(title), fontSize: TYPE.gloss, lineHeight: '46px', color: 'var(--color-muted)'}}>{spaced(title)}</div>}
      {kind === 'bars' ? rows.map((r, i) => {
        const p = step(i, rows.length);
        const len = (r.value / top) * width * p;
        const ink = r.marked ? 'var(--color-op)' : 'var(--color-text)';
        const cy = y0 + i * ROW + ROW / 2;
        return (
          <div key={i} style={{position: 'absolute', left: 0, top: cy, width: 0, height: 0, opacity: p > 0.001 ? 1 : 0}}>
            <div style={{position: 'absolute', left: 0, top: -19, whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: 30, lineHeight: '38px', color: 'var(--color-muted)'}}>{spaced(r.label)}</div>
            {/* the bar is a heavy rule from zero; an estimate is an open one */}
            <div style={{position: 'absolute', left: labelW, top: -9, width: len, height: 18, boxSizing: 'border-box', background: r.estimate ? 'transparent' : ink, border: r.estimate ? `3px dashed ${ink}` : undefined}} />
            <div style={{position: 'absolute', left: labelW + len + 16, top: -22, whiteSpace: 'nowrap', opacity: unit(p * 3 - 2), fontFamily: 'var(--font-sans)', fontSize: 40, fontWeight: 600, lineHeight: '44px', color: ink}}>{fmt(r)}</div>
          </div>
        );
      }) : (() => {
        const p = ease(unit((show - 0.2) / 0.8));
        const x0 = scaleW;
        const px = (i: number) => x0 + (rows.length < 2 ? 0 : (i / (rows.length - 1)) * width);
        const py = (v: number) => y0 + LINE_H - ((v - low) / (top - low)) * LINE_H;
        const pts = rows.map((r, i) => [px(i), py(r.value)] as const);
        const upto = p * (rows.length - 1);
        const k = Math.floor(upto), f = upto - k;
        const drawn = pts.slice(0, k + 1).concat(k < pts.length - 1 ? [[pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f] as const] : []);
        const last = rows[Math.min(rows.length - 1, Math.round(upto))];
        // the scale: its ends and zero, ruled faintly across, valued in mono at the left
        const ticks = [...new Set([low, 0, top])];
        const xl = [0, Math.floor((rows.length - 1) / 2), rows.length - 1].filter((i, j, a) => a.indexOf(i) === j);
        return (
          <>
            <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
              {ticks.map((v) => <path key={v} d={`M${x0} ${py(v)}H${x0 + width * head}`} stroke={v === 0 ? 'var(--color-text)' : 'var(--color-border)'} strokeWidth={v === 0 ? 3 : 1.5} fill="none" />)}
              {reference && <path d={`M${x0} ${py(reference.value)}H${x0 + width * head}`} stroke="var(--color-op)" strokeWidth={2} strokeDasharray="12 9" fill="none" />}
              {drawn.length > 1 && <path d={'M' + drawn.map(([a, b]) => `${a.toFixed(1)} ${b.toFixed(1)}`).join('L')} stroke="var(--color-text)" strokeWidth={4} fill="none" strokeLinejoin="round" />}
              {drawn.length > 0 && <rect x={drawn[drawn.length - 1][0] - 7} y={drawn[drawn.length - 1][1] - 7} width={14} height={14} fill="var(--color-op)" />}
            </svg>
            {ticks.map((v) => <div key={v} style={{position: 'absolute', left: 0, width: x0 - 14, top: py(v) - 18, textAlign: 'right', whiteSpace: 'nowrap', opacity: head, fontFamily: 'var(--font-mono)', fontSize: 28, lineHeight: '36px', color: 'var(--color-muted)'}}>{nice(v)}</div>)}
            {reference && <div style={{position: 'absolute', left: x0 + 12, top: py(reference.value) - 50, whiteSpace: 'nowrap', opacity: head, fontFamily: 'var(--font-display)', fontStyle: slant(reference.label), fontSize: TYPE.gloss, color: 'var(--color-op)'}}>{reference.label}</div>}
            {xl.map((i) => (
              <div key={i} style={{position: 'absolute', left: px(i), top: y0 + LINE_H + 16, transform: 'translateX(-50%)', whiteSpace: 'nowrap', opacity: head, fontFamily: 'var(--font-mono)', fontSize: 30, color: 'var(--color-muted)'}}>{rows[i].label}</div>
            ))}
            {last && <div style={{position: 'absolute', left: drawn[drawn.length - 1][0] + 16, top: drawn[drawn.length - 1][1] - 50, whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)', fontSize: 40, fontWeight: 600, color: 'var(--color-text)'}}>{fmt(last)}</div>}
          </>
        );
      })()}
      {source && <div style={{position: 'absolute', left: 0, top: y0 + bodyH + 10, whiteSpace: 'nowrap', opacity: head, fontFamily: 'var(--font-mono)', fontSize: 30, lineHeight: '38px', color: 'var(--color-muted)'}}>{spaced(source)}</div>}
    </div>
  );
}
