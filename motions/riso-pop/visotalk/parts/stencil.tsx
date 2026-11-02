import {CANVAS, INK, Plate, SCREEN, step, useSvgId, type Ink, type Pt} from './riso.ts';

export type Shape = {d?: string; circle?: [number, number, number]; ink: Ink; tint?: number; evenodd?: boolean};

export const meta = {
  name: {en: 'Stencil', 'zh-CN': '孔版图形'},
  purpose: 'term',
  line: 'The subject as flat shapes on the blue or pink plate, solid or in a stepped tint; pink over blue prints violet. No outlines: a form is its silhouette.',
  fits: 'the thing a film is about (a product, an organ, a fruit) drawn as a print',
  params: {
    shapes: {type: '{d?, circle?: [cx, cy, r], ink, tint?, evenodd?}[]', doc: 'the shapes in drawing order, in the picture\'s own units; tint is 0.15, 0.3, 0.5 or 0.7 (else solid); evenodd cuts holes'},
    at: {type: '[x, y]', default: '[0, 0]', doc: 'where the picture\'s origin lands on the canvas'},
    scale: {type: 'number', default: 1, doc: 'the picture\'s size'},
    blue: {type: 'progress', default: 1, doc: 'the blue plate rolled on, 0 to 1'},
    pink: {type: 'progress', default: 1, doc: 'the pink plate rolled on, 0 to 1'},
    slip: {type: 'progress', default: 0, doc: 'tweened 0 to 1 linearly over about 1.4 s: the plates knock apart and snap back'},
  },
  preview: 31.2,
};

type Props = {shapes: Shape[]; at?: Pt; scale?: number; blue?: number; pink?: number; slip?: number};

export function Stencil({shapes, at = [0, 0], scale = 1, blue = 1, pink = 1, slip = 0}: Props) {
  // the roller runs over the picture's own extent, read from its circles and from the numbers in its paths
  const xs: number[] = [], ys: number[] = [];
  for (const s of shapes) {
    if (s.circle) { const [cx, cy, r] = s.circle; xs.push(cx - r, cx + r); ys.push(cy - r, cy + r); }
    if (s.d) { const n = s.d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []; for (let i = 0; i + 1 < n.length; i += 2) { xs.push(n[i]); ys.push(n[i + 1]); } }
  }
  const box: [number, number, number, number] = xs.length
    ? [at[0] + Math.min(...xs) * scale, at[1] + Math.min(...ys) * scale, at[0] + Math.max(...xs) * scale, at[1] + Math.max(...ys) * scale]
    : [0, 0, 1920, 1080];
  // a tint is a screen fixed to the sheet: each tint used gets a pattern carrying the inverse of the picture's placement, so its dots keep the sheet's size and grid
  const id = useSvgId(), place = `translate(${at[0]} ${at[1]}) scale(${scale})`;
  const used = [...new Set(shapes.filter((s) => step(s.tint ?? 1) < 1).map((s) => `${s.ink}:${step(s.tint ?? 1)}`))];
  const fill = (ink: Ink, t = 1) => (step(t) >= 1 ? INK[ink] : `url(#${id}-${ink}-${Math.round(step(t) * 100)})`);
  const plate = (ink: Ink, print: number) => (
    <Plate ink={ink} print={print} slip={slip} box={box}>
      <g transform={place}>
        {shapes.filter((s) => s.ink === ink).map((s, i) => s.circle
          ? <circle key={i} cx={s.circle[0]} cy={s.circle[1]} r={s.circle[2]} fill={fill(ink, s.tint)} />
          : <path key={i} d={s.d} fill={fill(ink, s.tint)} fillRule={s.evenodd ? 'evenodd' : undefined} />)}
      </g>
    </Plate>
  );
  const defs = (
    <defs>
      {used.map((u) => {
        const [ink, t] = u.split(':') as [Ink, string], {angle, period: p} = SCREEN[ink], r = Math.min(p * 0.56, p * Math.sqrt(Number(t) / Math.PI));
        return (
          <pattern key={u} id={`${id}-${ink}-${Math.round(Number(t) * 100)}`} patternUnits="userSpaceOnUse" width={p} height={p}
            patternTransform={`scale(${1 / scale}) translate(${-at[0]} ${-at[1]}) rotate(${angle})`}>
            <circle cx={p / 2} cy={p / 2} r={r} fill={INK[ink]} />
          </pattern>
        );
      })}
    </defs>
  );
  return (
    <svg {...CANVAS}>
      {defs}
      {plate('blue', blue)}
      {plate('pink', pink)}
    </svg>
  );
}
