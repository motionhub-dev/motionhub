import {C, CANVAS, glide, mix, stagger, type Pt} from './night.ts';

export const meta = {
  name: {en: 'Glowing mass', 'zh-CN': '发光团块'},
  purpose: 'open',
  line: "A big body of soft overlapping rounds, lit on top, that swells from its base and can light from within.",
  fits: "a storm cloud, a nebula, a lung: the large subject whose inside the film explains",
  params: {
    puffs: {type: 'Array<[x, y, r, tone]>', doc: 'its rounds on the frame, back to front; tone 0 is darkest, 1 lightest'},
    from: {type: '[x, y]', doc: 'where it grows from'},
    grow: {type: 'progress', default: 1, doc: 'it swells out of `from`, round by round'},
    low: {type: 'string', doc: 'the colour of tone 0'},
    high: {type: 'string', doc: 'the colour of tone 1'},
    lit: {type: '[x, y, r] | null', doc: 'where a light inside shows through'},
    light: {type: 'progress', default: 0, doc: 'how strongly that light shows; spike it for a flash'},
    drift: {type: 'number', default: 0, doc: 'slow breathing with the clock: seconds, tween or pass doc time'},
  },
  preview: 2,
};

type RGB = number[];
const hex = (s: string): RGB => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const blend = (A: RGB, B: RGB, k: number): RGB => A.map((v, i) => mix(v, B[i], k));
const css = (c: RGB) => `rgb(${c.map(Math.round).join(',')})`;

export function Mass({puffs, from, grow = 1, low = C.night, high = '#5E74B8', lit, light = 0, drift = 0}: {puffs: Array<[number, number, number, number]>; from: Pt; grow?: number; low?: string; high?: string; lit?: [number, number, number] | null; light?: number; drift?: number}) {
  return (
    <svg {...CANVAS}>
      {puffs.map(([x, y, r, tone], i) => {
        const k = glide(stagger(grow, i, puffs.length, 0.55));
        if (k <= 0) return null;
        const wob = Math.sin(drift * 0.5 + i * 1.7) * 4;
        const lift = lit ? Math.max(0, 1 - Math.hypot(x - lit[0], y - lit[1]) / lit[2]) * light : 0;
        const L = hex(low), H = hex(high), W = hex(C.core);
        return (
          <g key={i} transform={`translate(${mix(from[0], x, k) + wob} ${mix(from[1], y, k)}) scale(${k})`}>
            <circle r={r} fill={css(blend(blend(L, H, tone), W, lift * 0.65))} />
            {/* the top of each round catches the light: a smaller, paler round pushed up inside it */}
            <circle cy={-r * 0.2} r={r * 0.82} fill={css(blend(blend(L, H, Math.min(1, tone + 0.14)), W, lift * 0.7))} />
          </g>
        );
      })}
    </svg>
  );
}
