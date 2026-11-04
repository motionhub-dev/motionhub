import {PEN, drawn, fit, unit, written} from './pens.ts';

export const meta = {
  name: {en: 'Sketched graph', 'zh-CN': '手绘曲线图'},
  purpose: 'data',
  line: 'Two axes ruled by hand and a curve drawn through the points, an optional second curve in pencil, the point that matters ringed in red.',
  fits: 'how something changes over time or with something else; growth and decline; a peak or a crossing; before and after a date',
  params: {
    points: {type: '[x, y][]', doc: 'the curve\'s points, in the data\'s own units, x increasing'},
    other: {type: '[x, y][]', default: [], doc: 'a second curve in pencil, to compare against'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: the axes, then the curve, then the mark; tween it across the words'},
    mark: {type: 'number', default: -1, doc: 'the index of the point to ring in red, the scene\'s one red thing; -1 for none'},
    markLabel: {type: 'text', default: '', doc: 'a few words written beside the ring'},
    markSide: {type: 'above | below', doc: 'which side of the ring the words go; by default the side the curve is leaving, so it does not run through them'},
    notes: {type: '{at: [x, y], text, side?, dot?}[]', default: [], doc: 'words in pencil placed by the data\'s units, above, below, left or right of the point (default above), with a dot there unless dot is false: name a curve, a date, a threshold'},
    drawOther: {type: 'progress', doc: '0 to 1: the second curve on its own timing, to bring it in after the first (default: with the first)'},
    xLabel: {type: 'text', default: '', doc: 'what the bottom axis measures'},
    yLabel: {type: 'text', default: '', doc: 'what the left axis measures'},
    xTicks: {type: '[x, text][]', default: [], doc: 'marks along the bottom, in the data\'s units'},
    yTicks: {type: '[y, text][]', default: [], doc: 'marks up the side, in the data\'s units'},
    zero: {type: 'boolean', default: true, doc: 'keep zero on the left axis, with a pencil line at zero when the data crosses it; turn it off only to show a small change, and say so'},
    width: {type: 'px', default: 900, doc: 'the graph\'s width, labels included'},
    height: {type: 'px', default: 560, doc: 'the graph\'s height, labels included'},
  },
  preview: 27.5,
};

type P = [number, number];
const curve = (pts: P[]) => {
  // a hand's line through every point: each span's handles follow its neighbours
  if (pts.length < 3) return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], e = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)} ${(b[1] + (c[1] - a[1]) / 6).toFixed(1)}, ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)} ${(c[1] - (e[1] - b[1]) / 6).toFixed(1)}, ${c[0].toFixed(1)} ${c[1].toFixed(1)}`;
  }
  return d;
};

export function Graph({points, other = [], draw = 1, mark = -1, markLabel = '', xLabel = '', yLabel = '', xTicks = [], yTicks = [], zero = true, width = 900, height = 560, notes = [], drawOther, markSide}: {markSide?: 'above' | 'below'; notes?: {at: P; text: string; side?: 'above' | 'below' | 'left' | 'right'; dot?: boolean}[]; drawOther?: number; points: P[]; other?: P[]; draw?: number; mark?: number; markLabel?: string; xLabel?: string; yLabel?: string; xTicks?: [number, string][]; yTicks?: [number, string][]; zero?: boolean; width?: number; height?: number}) {
  const left = yTicks.length ? 120 : 30, right = 30, top = yLabel ? 58 : 14, bottom = (xTicks.length ? 50 : 10) + (xLabel ? 54 : 0);
  const w = width - left - right, h = height - top - bottom;
  const all = [...points, ...other], xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), lo = zero ? Math.min(0, ...ys) : Math.min(...ys), hi = Math.max(...ys);
  const pad = zero ? 0 : (hi - lo) * 0.12, y0 = lo - pad, y1 = hi + (hi - lo) * 0.12;
  const X = (x: number) => left + (x1 > x0 ? (x - x0) / (x1 - x0) : 0.5) * w;
  const Y = (y: number) => top + h - (y1 > y0 ? (y - y0) / (y1 - y0) : 0.5) * h;
  const at = (p: P): P => [X(p[0]), Y(p[1])];
  const axes = unit(draw / 0.25), line = unit((draw - 0.25) / 0.6), end = unit((draw - 0.85) / 0.15);
  const second = drawOther ?? line, crossing = zero && lo < 0 && y1 > 0;
  const m = points[mark], ring = m && at(m), toRight = ring && ring[0] < width * 0.62;
  const after = points[mark + 1] && at(points[mark + 1]), rising = after && ring && after[1] < ring[1];
  const labelBelow = ring && (markSide ? markSide === 'below' : rising || ring[1] - 74 < top + 30);
  const small = {position: 'absolute' as const, fontFamily: 'var(--font-display)', color: PEN.pencil, whiteSpace: 'nowrap' as const};
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width, height}}>
      <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <path d={`M${left} ${top} L${left - 1} ${top + h} L${left + w} ${top + h + 1}`} fill="none" stroke={PEN.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" {...drawn(axes)} />
        {xTicks.map(([x], i) => <path key={i} d={`M${X(x)} ${top + h - 7} L${X(x)} ${top + h + 7}`} stroke={PEN.ink} strokeWidth={3} strokeLinecap="round" opacity={axes >= 1 ? 1 : 0} />)}
        {yTicks.map(([y], i) => <path key={i} d={`M${left - 7} ${Y(y)} L${left + 7} ${Y(y)}`} stroke={PEN.ink} strokeWidth={3} strokeLinecap="round" opacity={axes >= 1 ? 1 : 0} />)}
        {other.length > 0 && <path d={curve(other.map(at))} fill="none" stroke={PEN.pencil} strokeWidth={3} strokeLinecap="round" {...drawn(second)} />}
        {crossing && <path d={`M${left} ${Y(0)} L${left + w} ${Y(0)}`} fill="none" stroke={PEN.pencil} strokeWidth={3} strokeLinecap="round" {...drawn(axes)} />}
        {notes.filter((n) => n.dot !== false).map((n, i) => <circle key={i} cx={X(n.at[0])} cy={Y(n.at[1])} r={8} fill={PEN.ink} opacity={end > 0 ? 1 : 0} />)}
        {points.length > 0 && <path d={curve(points.map(at))} fill="none" stroke={PEN.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" {...drawn(line)} />}
        {ring && <path d={`M${ring[0] + 24} ${ring[1] - 4} C ${ring[0] + 22} ${ring[1] - 30}, ${ring[0] - 26} ${ring[1] - 28}, ${ring[0] - 25} ${ring[1] + 2} C ${ring[0] - 24} ${ring[1] + 30}, ${ring[0] + 26} ${ring[1] + 28}, ${ring[0] + 24} ${ring[1] - 6}`} fill="none" stroke={PEN.red} strokeWidth={5} strokeLinecap="round" {...drawn(end)} />}
      </svg>
      {xTicks.map(([x, text], i) => <div key={i} style={{...small, left: X(x), top: top + h + 12, fontSize: 30, transform: 'translateX(-50%)', opacity: axes >= 1 ? 1 : 0}}>{text}</div>)}
      {yTicks.map(([y, text], i) => <div key={i} style={{...small, right: width - left + 14, top: Y(y), fontSize: 30, transform: 'translateY(-50%)', opacity: axes >= 1 ? 1 : 0}}>{text}</div>)}
      {xLabel && <div style={{...small, left, width: w, top: height - 46, textAlign: 'center', fontSize: fit(xLabel, w, 36)}}><span style={{display: 'inline-block', ...written(axes)}}>{xLabel}</span></div>}
      {yLabel && <div style={{...small, left: left - 16, top: 4, fontSize: fit(yLabel, w, 36), ...written(axes)}}>{yLabel}</div>}
      {notes.map((n, i) => {
        const x = X(n.at[0]), y = Y(n.at[1]), side = n.side ?? 'above';
        const place = {above: {left: x, top: y - 18, transform: 'translate(-50%, -100%)'}, below: {left: x, top: y + 18, transform: 'translateX(-50%)'}, left: {left: x - 18, top: y, transform: 'translate(-100%, -50%)'}, right: {left: x + 18, top: y, transform: 'translateY(-50%)'}}[side];
        return <div key={i} style={{...small, ...place, fontSize: 34}}><span style={{display: 'block', ...written(end)}}>{n.text}</span></div>;
      })}
      {ring && markLabel && <div style={{position: 'absolute', top: labelBelow ? ring[1] + 32 : ring[1] - 74, ...(toRight ? {left: ring[0] + 34} : {right: width - ring[0] + 34}), fontFamily: 'var(--font-display)', fontSize: fit(markLabel, toRight ? width - ring[0] - 40 : ring[0] - 40, 42), fontWeight: 500, color: PEN.red, whiteSpace: 'nowrap', ...written(end)}}>{markLabel}</div>}
    </div>
  );
}
