import {C, CANVAS, clamp, hash, pathOf, project, smooth, settle, tone, type Pt, type View} from './earth.ts';

export type Layer = {h: number; color: string};
export type Solid = {x: number; y: number; w: number; d: number; h: number; color: string};
export type Ribbon = {pts: Array<[number, number]>; color: string};
export type Level = {z: number; on: number; dip?: {x: number; depth: number; width: number}};

export const meta = {
  name: {en: 'Cut block', 'zh-CN': '剖面块'},
  purpose: 'open',
  line: "One block of the world in isometric: a lit top with what stands on it, and layers of material down its sides, which can be stacked, sliced open and filled.",
  fits: "ground, a body, a wall, a city street, a chip: anything whose inside is in layers",
  params: {
    view: {type: 'View', doc: 'the camera: {at, k, yaw}; tween yaw and at to turn and move it'},
    size: {type: '[w, d]', default: '[6, 6]', doc: 'its width and depth in units'},
    top: {type: 'string', doc: 'the colour of the top'},
    layers: {type: '{h, color}[]', doc: "from the top down: each layer's thickness and material"},
    ribbons: {type: '{pts, color}[]', doc: 'flat shapes painted on the top: a river, a road'},
    solids: {type: '{x, y, w, d, h, color}[]', doc: 'boxes standing on the top: houses, trees, machines'},
    lift: {type: 'number', default: 0, doc: 'the gap between layers, in units: tween it to 0 to stack them'},
    cut: {type: 'number', doc: 'the depth at which it is sliced'},
    slide: {type: 'progress', default: 0, doc: 'the slice in front of the cut slides away, showing the cut face'},
    level: {type: '{z, on, dip?}', doc: 'a water line at height z, resting on the top of layer `on`; dip draws it down at x'},
  },
  preview: 28.5,
};

// the line between two layers is the same wherever it is seen from, so faces meet at the corners and a cut shows what the sides promised
const seam = (i: number, x: number, y: number) => i === 0 ? 0 : (Math.sin(x * 1.5 + i * 2.1) + Math.sin(y * 1.3 + i * 4.3) + Math.sin((x + y) * 3.1 + i)) * 0.028;
const sample = (from: Pt, to: Pt, n = 24) => Array.from({length: n + 1}, (_, i): Pt => [from[0] + ((to[0] - from[0]) * i) / n, from[1] + ((to[1] - from[1]) * i) / n]);

export function Block({view, size = [6, 6], top = C.grass, layers, ribbons = [], solids = [], lift = 0, cut, slide = 0, level}: {view: View; size?: Pt; top?: string; layers: Layer[]; ribbons?: Ribbon[]; solids?: Solid[]; lift?: number; cut?: number; slide?: number; level?: Level}) {
  const [W, D] = size, n = layers.length;
  const base = layers.reduce<number[]>((a, l) => [...a, a[a.length - 1] - l.h], [0]);
  const up = (i: number) => (n - 1 - i) * lift;
  const line = (i: number, x: number, y: number) => base[i] + seam(i, x, y);

  const piece = (y0: number, y1: number, shift: number, id: string) => {
    const p = (x: number, y: number, z: number) => project(view)(x, y + shift, z);
    const face = (i: number, from: Pt, to: Pt, f: number) => {
      const l = layers[i], edge = sample(from, to), low = i + 1, off = up(i);
      const pts: Pt[] = [...edge.map(([x, y]) => p(x, y, line(i, x, y) + off)), ...[...edge].reverse().map(([x, y]) => p(x, y, line(low, x, y) + off))];
      const specks = Array.from({length: Math.round(l.h * 46)}, (_, s) => {
        const u = hash(s * 3.1 + i * 7 + from[0] + to[1]), x = from[0] + (to[0] - from[0]) * u, y = from[1] + (to[1] - from[1]) * u;
        const a = line(i, x, y), b = line(low, x, y), z = a + (b - a) * (0.08 + 0.84 * hash(s * 5.7 + i + from[1]));
        const [sx, sy] = p(x, y, z + off);
        return <circle key={s} cx={sx} cy={sy} r={1.4 + hash(s) * 2.2} fill={tone(l.color, s % 3 ? f * 0.82 : Math.min(1.3, f + 0.28))} />;
      });
      return <><path d={pathOf(pts)} fill={tone(l.color, f)} />{specks}</>;
    };
    const water = (from: Pt, to: Pt, f: number) => {
      if (!level) return null;
      const edge = sample(from, to, 48);
      const surface = ([x, y]: Pt) => {
        const r = level.dip ? Math.hypot(x - level.dip.x, y - y1) : 0;
        const dip = level.dip ? level.dip.depth * Math.exp(-(r * r) / (2 * level.dip.width * level.dip.width)) : 0;
        return Math.max(line(level.on, x, y), level.z - dip);
      };
      const off = up(level.on - 1), rule = edge.map((e) => p(e[0], e[1], surface(e) + off));
      return <>
        <path d={pathOf([...rule, ...[...edge].reverse().map(([x, y]) => p(x, y, line(level.on, x, y) + off))])} fill={tone(C.water, f)} opacity={0.72} />
        <path d={pathOf(rule, false)} fill="none" stroke={C.foam} strokeWidth={3.5} />
      </>;
    };
    const raise = up(0);
    const onTop = (x: number, y: number, z = 0) => p(x, y, z + raise);
    const corners: Pt[] = [onTop(0, y0), onTop(W, y0), onTop(W, y1), onTop(0, y1)];
    const ranged = solids.filter((s) => s.y + s.d / 2 >= y0 && s.y + s.d / 2 < y1).sort((a, b) => a.x + a.y - b.x - b.y);
    return (
      <g key={id}>
        {[...layers.keys()].reverse().map((i) => <g key={i}>
          {lift > 0.02 && i > 0 && <path d={pathOf([p(0, y0, line(i, 0, y0) + up(i)), p(W, y0, line(i, W, y0) + up(i)), p(W, y1, line(i, W, y1) + up(i)), p(0, y1, line(i, 0, y1) + up(i))])} fill={tone(layers[i].color, 1.2)} />}
          {face(i, [W, y0], [W, y1], 0.8)}
          {level && level.on - 1 === i && water([W, y0], [W, y1], 0.8)}
          {face(i, [0, y1], [W, y1], 1)}
          {level && level.on - 1 === i && water([0, y1], [W, y1], 1)}
        </g>)}
        <clipPath id={`top-${id}`}><path d={pathOf(corners)} /></clipPath>
        <path d={pathOf(corners)} fill={top} />
        <g clipPath={`url(#top-${id})`}>{ribbons.map((r, i) => <path key={i} d={pathOf(r.pts.map(([x, y]) => onTop(x, y)))} fill={r.color} />)}</g>
        {ranged.map((s, i) => {
          const h = s.h, q = (x: number, y: number, z: number) => onTop(s.x + x, s.y + y, z);
          return <g key={i}>
            <path d={pathOf([q(s.w, 0, 0), q(s.w, s.d, 0), q(s.w, s.d, h), q(s.w, 0, h)])} fill={tone(s.color, 0.68)} />
            <path d={pathOf([q(0, s.d, 0), q(s.w, s.d, 0), q(s.w, s.d, h), q(0, s.d, h)])} fill={tone(s.color, 0.84)} />
            <path d={pathOf([q(0, 0, h), q(s.w, 0, h), q(s.w, s.d, h), q(0, s.d, h)])} fill={s.color} />
          </g>;
        })}
      </g>
    );
  };

  const gone = clamp(slide);
  return (
    <svg {...CANVAS}>
      {cut == null || gone === 0 ? piece(0, D, 0, 'whole') : <>
        {piece(0, cut, 0, 'rest')}
        {gone < 1 && <g opacity={1 - smooth((gone - 0.6) / 0.4)}>{piece(cut, D, settle(gone) * 2, 'slice')}</g>}
      </>}
    </svg>
  );
}
