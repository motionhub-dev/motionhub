import {C, CANVAS, hash, project, smooth, type View} from './earth.ts';

export const meta = {
  name: {en: 'Falling marks', 'zh-CN': '落下的线'},
  purpose: 'mark',
  line: "Short slanted strokes that fall on the block and land with a small ring, at a rate you can see.",
  fits: "rain, snow, ash, anything arriving from above",
  params: {
    view: {type: 'View', doc: "the scene's camera"},
    area: {type: '[x0, y0, x1, y1]', doc: 'where they land, on the top'},
    n: {type: 'number', default: 44, doc: 'how many'},
    clock: {type: 'number', default: 0, doc: 'seconds: tween it linearly so they keep falling'},
    show: {type: 'progress', default: 1, doc: 'how many of them are falling; tween it to 0 to stop the rain'},
    color: {type: 'string', doc: 'their colour'},
    clear: {type: '[x0, y0, x1, y1]', doc: 'a box in px they keep out of, such as the title'},
  },
  preview: 6,
};

export function Fall({view, area, n = 44, clock = 0, show = 1, color = C.deep, clear}: {view: View; area: [number, number, number, number]; n?: number; clock?: number; show?: number; color?: string; clear?: [number, number, number, number]}) {
  const p = project(view), H = 2.6;
  return (
    <svg {...CANVAS}>
      {Array.from({length: n}, (_, i) => {
        if (hash(i + 400) > smooth(show)) return null;
        const x = area[0] + hash(i) * (area[2] - area[0]), y = area[1] + hash(i + 70) * (area[3] - area[1]);
        const u = (clock * (0.62 + hash(i + 20) * 0.2) + hash(i + 33)) % 1;
        const [gx, gy] = p(x, y, 0);
        if (u > 0.9) return <ellipse key={i} cx={gx} cy={gy} rx={4 + (u - 0.9) * 110} ry={2 + (u - 0.9) * 55} fill="none" stroke={C.foam} strokeWidth={2.5} opacity={(1 - u) * 10} />;
        const [sx, sy] = p(x, y, H * (1 - u / 0.9));
        if (sy < 40 || (clear && sx > clear[0] && sx < clear[2] && sy > clear[1] && sy < clear[3])) return null;
        return <path key={i} d={`M${sx + 5} ${sy - 26}L${sx} ${sy}`} stroke={color} strokeWidth={4} strokeLinecap="round" />;
      })}
    </svg>
  );
}
