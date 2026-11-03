import {C, CANVAS, clamp, hash, pathOf, project, type P3, type View} from './earth.ts';

export const meta = {
  name: {en: 'Seeping beads', 'zh-CN': '渗流水珠'},
  purpose: 'data',
  line: "Beads that creep along paths through the block at a steady rate, each at its own time, leaving a faint trail.",
  fits: "water sinking, roots drinking, heat or a signal passing through layers",
  params: {
    view: {type: 'View', doc: "the scene's camera"},
    paths: {type: '[x, y, z][][]', doc: "the routes, in the block's units; on the cut face, y is the cut"},
    n: {type: 'number', default: 7, doc: 'beads on each path'},
    clock: {type: 'number', default: 0, doc: 'seconds: tween it linearly so they keep moving'},
    reach: {type: 'progress', default: 1, doc: 'how far along the paths they have got so far'},
    color: {type: 'string', doc: 'their colour'},
    size: {type: 'number', default: 8, doc: 'bead radius in px'},
  },
  preview: 19.5,
};

export function Seep({view, paths, n = 7, clock = 0, reach = 1, color = C.deep, size = 8}: {view: View; paths: P3[][]; n?: number; clock?: number; reach?: number; color?: string; size?: number}) {
  if (reach <= 0) return null;
  const p = project(view);
  return (
    <svg {...CANVAS}>
      {paths.map((route, r) => {
        const pts = route.map(([x, y, z]) => p(x, y, z));
        const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
        const total = lens.reduce((a, b) => a + b, 0);
        const at = (u: number): [number, number] => {
          let d = clamp(u) * total, i = 0;
          while (i < lens.length - 1 && d > lens[i]) d -= lens[i++];
          const k = lens[i] ? d / lens[i] : 0;
          return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
        };
        const trail = Array.from({length: 25}, (_, i) => at((i / 24) * reach));
        return (
          <g key={r}>
            <path d={pathOf(trail, false)} fill="none" stroke={color} strokeWidth={size * 0.8} strokeLinecap="round" strokeLinejoin="round" opacity={0.3} />
            {Array.from({length: n}, (_, i) => {
              const u = ((clock * 0.14 + i / n + hash(r + 3) * 0.2) % 1) * reach, [x, y] = at(u);
              return <circle key={i} cx={x} cy={y} r={size * (0.8 + hash(i + r * 9) * 0.4)} fill={color} stroke={C.foam} strokeWidth={2} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}
