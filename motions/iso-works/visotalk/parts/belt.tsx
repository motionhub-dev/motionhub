import {CANVAS, boxFaces, hue, project, tones, type Box, type Role, type View} from './iso.ts';

export const meta = {
  name: {en: 'Belt', 'zh-CN': '传送带'},
  purpose: 'link',
  line: 'A conveyor on the floor, or a rail on posts, laid from door to door; cubes ride it and can change colour on the way.',
  fits: 'goods, data or money moving between parts of a system; a step that changes what passes (sorted, paid, cleaned)',
  params: {
    path: {type: '[x, y][]', doc: 'the corners it runs through, in floor cells; each leg runs along x or along y'},
    kind: {type: "'belt' | 'rail'", default: 'belt', doc: 'a belt on the floor, or a rail raised on posts (data, power, anything that travels above the floor)'},
    z: {type: 'cells', default: 0, doc: 'its height: 0 for a belt, about 2.6 for a rail'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: how much of it is laid, from its first corner'},
    travel: {type: 'cells', default: 0, doc: 'how far the first cube has gone: tween it linearly over the scene and the cubes stream along'},
    gap: {type: 'cells', default: 1.3, doc: 'the spacing between cubes'},
    count: {type: 'number', default: 999, doc: 'how many cubes are sent; the rest of the belt stays empty'},
    from: {type: 'role', default: 'idle', doc: 'the cubes\' colour as they set out'},
    to: {type: 'role', default: 'idle', doc: 'their colour after `turn`'},
    turn: {type: 'progress', default: 1, doc: 'where along the belt, 0 to 1, the cubes take the `to` colour (where the machine is)'},
    dim: {type: 'progress', default: 0, doc: '0 to 1: greyed while it is not the subject'},
  },
  preview: 21.8,
};

type Props = {path: [number, number][]; kind?: 'belt' | 'rail'; z?: number; draw?: number; travel?: number; gap?: number; count?: number; from?: Role; to?: Role; turn?: number; dim?: number} & View;

const HALF = 0.42, THICK = 0.3, CUBE = 0.52, SLAT = 0.45;

/** The point at distance s along a path of axis-aligned legs */
const along = (path: [number, number][], s: number): [number, number] => {
  let left = s;
  for (let i = 1; i < path.length; i++) {
    const [ax, ay] = path[i - 1], [bx, by] = path[i], len = Math.abs(bx - ax) + Math.abs(by - ay);
    if (left <= len) return [ax + Math.sign(bx - ax) * left, ay + Math.sign(by - ay) * left];
    left -= len;
  }
  return path[path.length - 1];
};

export function Belt({path, kind = 'belt', z, draw = 1, travel = 0, gap = 1.3, count = 999, from = 'idle', to = 'idle', turn = 1, dim = 0, origin, k}: Props) {
  const v: View = {origin, k};
  const zz = z ?? (kind === 'rail' ? 2.6 : 0);
  const legs = path.slice(1).map((b, i) => ({a: path[i], b, len: Math.abs(b[0] - path[i][0]) + Math.abs(b[1] - path[i][1])}));
  const total = legs.reduce((s, l) => s + l.len, 0), laid = total * Math.max(0, Math.min(1, draw));
  if (laid <= 0) return null;

  // each leg is a long low box, padded at its ends so the corners close
  const boxes: Box[] = [];
  let done = 0;
  for (const {a, b, len} of legs) {
    const part = Math.min(len, laid - done);
    if (part <= 0) break;
    const end = along([a, b], part);
    const x0 = Math.min(a[0], end[0]), x1 = Math.max(a[0], end[0]), y0 = Math.min(a[1], end[1]), y1 = Math.max(a[1], end[1]);
    boxes.push({x: x0 - HALF, y: y0 - HALF, z: zz, w: x1 - x0 + 2 * HALF, d: y1 - y0 + 2 * HALF, h: THICK});
    done += part;
  }
  boxes.sort((p, q) => p.x + p.w + p.y + p.d - (q.x + q.w + q.y + q.d));

  // posts under a rail, every three cells
  const posts = kind === 'rail' ? Array.from({length: Math.floor(laid / 3) + 1}, (_, i) => along(path, Math.min(laid, i * 3))) : [];

  // the cubes: the first has gone `travel`, the others follow at `gap`; only on what is laid
  const cubes = Array.from({length: Math.min(count, Math.ceil(travel / gap) + 1)}, (_, i) => travel - i * gap)
    .filter((s) => s >= 0 && s <= laid)
    .map((s) => ({s, at: along(path, s)}))
    .sort((p, q) => p.at[0] + p.at[1] - (q.at[0] + q.at[1]));

  // a belt is a dark rubber band on a light frame; a rail is the idle grey
  const surface = kind === 'rail' ? hue('idle', 0) : 'color-mix(in srgb, var(--vt-muted) 70%, var(--vt-panel2))';
  return (
    <svg {...CANVAS}>
      {posts.map(([px, py], i) => {
        const f = boxFaces({x: px - 0.12, y: py - 0.12, z: 0, w: 0.24, d: 0.24, h: zz}, v), t = tones('var(--vt-muted)');
        return <g key={i}><polygon points={f.left} style={{fill: t.left}} /><polygon points={f.right} style={{fill: t.right}} /></g>;
      })}
      {boxes.map((b, i) => {
        const f = boxFaces(b, v), t = tones(surface);
        return <g key={i}><polygon points={f.left} style={{fill: t.left}} /><polygon points={f.right} style={{fill: t.right}} /><polygon points={f.top} style={{fill: t.top}} /></g>;
      })}
      {/* the slats run with the cubes, so a belt that carries something is seen to move */}
      {kind === 'belt' && Array.from({length: Math.floor(laid / SLAT) + 1}, (_, j) => j * SLAT + (travel % SLAT)).filter((s) => s > 0.05 && s < laid - 0.05).map((s, j) => {
        const [px, py] = along(path, s), [qx, qy] = along(path, Math.min(laid, s + 0.01));
        const across = Math.abs(qx - px) > Math.abs(qy - py); // the leg runs along x, so the slat runs along y
        const [a, b] = across ? [project(px, py - HALF * 0.8, zz + THICK, v), project(px, py + HALF * 0.8, zz + THICK, v)] : [project(px - HALF * 0.8, py, zz + THICK, v), project(px + HALF * 0.8, py, zz + THICK, v)];
        return <line key={`s${j}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} style={{stroke: tones(surface).right}} strokeWidth={2} />;
      })}
      {cubes.map(({s, at: [cx, cy]}, i) => {
        const role = s / total < turn ? from : to;
        const f = boxFaces({x: cx - CUBE / 2, y: cy - CUBE / 2, z: zz + THICK, w: CUBE, d: CUBE, h: CUBE}, v), t = tones(hue(role, dim));
        return <g key={i}><polygon points={f.left} style={{fill: t.left}} /><polygon points={f.right} style={{fill: t.right}} /><polygon points={f.top} style={{fill: t.top}} /></g>;
      })}
    </svg>
  );
}
