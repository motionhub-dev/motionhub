import {C, CANVAS, MONO, clamp, glide, mix} from './night.ts';

export const meta = {
  name: {en: 'Instrument ruler', 'zh-CN': '仪器标尺'},
  purpose: 'mark',
  line: "A thin vertical scale with real units beside the subject, with a level line that can cross the picture.",
  fits: "height, depth, time, temperature: any picture whose size is the point",
  params: {
    x: {type: 'number', doc: 'where it stands on the frame'},
    y0: {type: 'number', doc: 'y of its lowest tick'},
    y1: {type: 'number', doc: 'y of its highest tick'},
    from: {type: 'number', default: 0, doc: 'the value at y0'},
    to: {type: 'number', default: 10, doc: 'the value at y1'},
    ticks: {type: 'number[]', doc: 'the values labelled'},
    unit: {type: 'string', default: "''", doc: 'the unit, once, at the top'},
    t: {type: 'progress', default: 1, doc: 'it draws up from its base'},
    level: {type: 'number', doc: 'a value marked by a dashed line across the picture'},
    levelLabel: {type: 'string', doc: 'the name of that level'},
    levelTo: {type: 'number', default: 1600, doc: 'how far right the line runs'},
    levelShow: {type: 'progress', default: 1, doc: 'the level line draws across'},
  },
  preview: 6,
};

export function Ruler({x, y0, y1, from = 0, to = 10, ticks, unit = '', t = 1, level, levelLabel, levelTo = 1600, levelShow = 1}: {x: number; y0: number; y1: number; from?: number; to?: number; ticks: number[]; unit?: string; t?: number; level?: number; levelLabel?: string; levelTo?: number; levelShow?: number}) {
  const k = glide(t);
  if (k <= 0) return null;
  const at = (v: number) => mix(y0, y1, (v - from) / (to - from));
  const top = mix(y0, y1, k);
  const ls = clamp(levelShow);
  return (
    <svg {...CANVAS}>
      <g fontFamily={MONO} fontSize={26} fill={C.read}>
        <path d={`M${x} ${y0}V${top}`} stroke={C.read} strokeWidth={2.5} fill="none" />
        {ticks.map((v) => at(v) >= top - 0.5 && <g key={v}><path d={`M${x} ${at(v)}h-16`} stroke={C.read} strokeWidth={2.5} /><text x={x - 28} y={at(v) + 9} textAnchor="end">{v}</text></g>)}
        {unit && k > 0.98 && <text x={x - 28} y={y1 - 34} textAnchor="end" fill={C.dim}>{unit}</text>}
        {level != null && ls > 0 && <>
          <path d={`M${x} ${at(level)}H${mix(x, levelTo, ls)}`} stroke={C.read} strokeWidth={2} strokeDasharray="8 10" opacity={0.7} />
          {levelLabel && <text x={x + 18} y={at(level) - 14} opacity={ls}>{levelLabel}</text>}
        </>}
      </g>
    </svg>
  );
}
