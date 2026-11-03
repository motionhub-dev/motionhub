import {C, CANVAS, DISPLAY, hash, pathOf, smooth, tone, type Pt} from './earth.ts';

export const meta = {
  name: {en: 'Sample window', 'zh-CN': '取样窗'},
  purpose: 'term',
  line: "A square of the material far above life size, tied to the spot it came from, with what fills its gaps rising through it.",
  fits: "water between sand grains, cells in a tissue, air in a foam: the small truth inside one layer",
  params: {
    at: {type: '[x, y]', doc: 'its middle, in px'},
    size: {type: 'number', default: 320, doc: 'its side, in px'},
    from: {type: '[x, y]', doc: 'the spot it shows, in px'},
    grain: {type: 'string', doc: 'the colour of the grains'},
    fill: {type: 'string', doc: 'the colour of what is between them'},
    show: {type: 'progress', default: 1, doc: 'it opens from its middle'},
    level: {type: 'progress', default: 1, doc: 'how far what is between them has risen'},
    label: {type: 'string', doc: 'what the window shows, set under it'},
    gone: {type: 'progress', default: 0, doc: 'it fades away'},
  },
  preview: 35.5,
};

export function Grains({at, size = 320, from, grain = C.sand, fill = C.water, show = 1, level = 1, label, gone = 0}: {at: Pt; size?: number; from?: Pt; grain?: string; fill?: string; show?: number; level?: number; label?: string; gone?: number}) {
  const k = smooth(show), s = size * k, x = at[0] - s / 2, y = at[1] - s / 2;
  if (k <= 0 || gone >= 1) return null;
  const cells = 6, step = size / cells, top = y + s * (1 - level);
  return (
    <svg {...CANVAS} opacity={1 - gone}>
      {from && <path d={`M${from[0]} ${from[1]}L${x} ${y}M${from[0]} ${from[1]}L${x} ${y + s}`} stroke={C.ink} strokeWidth={2} opacity={k * 0.7} />}
      {from && <circle cx={from[0]} cy={from[1]} r={7} fill={C.ink} opacity={k} />}
      <clipPath id="sample-window"><rect x={x} y={y} width={s} height={s} rx={8} /></clipPath>
      <g clipPath="url(#sample-window)">
        <rect x={x} y={y} width={s} height={s} fill={tone(grain, 1.62)} />
        <rect x={x} y={top} width={s} height={s * level} fill={fill} />
        {Array.from({length: (cells + 1) * (cells + 1)}, (_, i) => {
          const c = i % (cells + 1), r = Math.floor(i / (cells + 1));
          const gx = x + (c + (r % 2) * 0.5 + (hash(i) - 0.5) * 0.24) * step * k, gy = y + (r + 0.2 + (hash(i + 40) - 0.5) * 0.24) * step * k;
          const rad = step * 0.47 * (0.84 + hash(i + 9) * 0.26) * k;
          const pts = Array.from({length: 9}, (_, q): Pt => { const a = (q / 9) * Math.PI * 2 + hash(i); const w = rad * (0.86 + hash(i * 3 + q) * 0.22); return [gx + Math.cos(a) * w, gy + Math.sin(a) * w]; });
          return <path key={i} d={pathOf(pts)} fill={tone(grain, 0.86 + hash(i + 80) * 0.28)} stroke={tone(grain, 0.66)} strokeWidth={1.5} />;
        })}
      </g>
      <rect x={x} y={y} width={s} height={s} rx={8} fill="none" stroke={C.ink} strokeWidth={3} />
      {label && <text x={at[0]} y={at[1] + size / 2 + 48} textAnchor="middle" fontFamily={DISPLAY} fontSize={36} fontWeight={700} fill={C.ink} opacity={k}>{label}</text>}
    </svg>
  );
}
