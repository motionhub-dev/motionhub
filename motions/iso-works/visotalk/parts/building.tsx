import {useDocTime} from '@visotalk/runtime';
import {CANVAS, boxFaces, easeOut, faceText, hue, plotPath, project, ringPoints, springOut, tones, unit, type Box, type Role, type View} from './iso.ts';

export const meta = {
  name: {en: 'Building', 'zh-CN': '厂房'},
  purpose: 'term',
  line: 'A part of the system as a small building in the colour of its job, its name on its wall; it springs up from a plot marked on the floor, and its roof lifts aside to show the machine inside.',
  fits: 'a stage of a process; a service in a system; a department of a company',
  params: {
    at: {type: '[x, y]', doc: 'the floor cell of its back corner'},
    size: {type: '[w, d, h]', default: '[4, 3, 2.4]', doc: 'its footprint along x and y, and its height, in cells'},
    kind: {type: "'hall' | 'tank' | 'tower'", default: 'hall', doc: 'a hall (flat roof that lifts), a tank (a cylinder: stock, water, a store) or a tower (tall, rows of windows: offices, servers)'},
    role: {type: "'intake' | 'process' | 'store' | 'output' | 'idle'", default: 'process', doc: 'what it does, which is its colour'},
    name: {type: 'text', default: '', doc: 'painted on its front wall: one or two short words'},
    machine: {type: "'press' | 'arch' | 'racks'", default: 'press', doc: 'what the lifted roof shows: a press that stamps, an arch that scans, racks that hold'},
    goods: {type: '[role, role]', default: 'none', doc: 'cubes riding through the machine: their colour going in and coming out (a press or an arch)'},
    rise: {type: 'progress', default: 1, doc: '0 to 1, tweened linearly: its plot is marked out on the floor (to 0.3), then it springs up from it; back to 0, it sinks'},
    ping: {type: 'progress', default: 0, doc: '0 to 1: two rings in its colour run out across the floor from its plot, the cue for "this one"'},
    lift: {type: 'progress', default: 0, doc: '0 to 1: its roof lifts (to 0.4), then slides back while the near walls are cut down (to 1); a hall only'},
    dim: {type: 'progress', default: 0, doc: '0 to 1: greyed toward idle while it is not the subject'},
  },
  preview: 17.4,
};

type Props = {at: [number, number]; size?: [number, number, number]; kind?: 'hall' | 'tank' | 'tower'; role?: Role; name?: string; machine?: 'press' | 'arch' | 'racks'; goods?: [Role, Role]; rise?: number; ping?: number; lift?: number; dim?: number} & View;

const Faces = ({b, base, v, only}: {b: Box; base: string; v: View; only?: Array<'top' | 'left' | 'right'>}) => {
  const f = boxFaces(b, v), t = tones(base);
  return <>{(only ?? ['left', 'right', 'top']).map((s) => <polygon key={s} points={f[s]} style={{fill: t[s]}} />)}</>;
};

// Text painted on a wall stays light on a strong colour and turns ink on mustard and grey.
const paint = (role: Role, dim: number) => (role === 'store' || role === 'idle' || dim > 0.5 ? 'var(--vt-text)' : 'var(--vt-panel)');

// The goods inside a working machine ride a short belt along x and take the second colour as they pass its middle.
function Goods({x, w, cy, z, goods, dim, v, t, side}: {x: number; w: number; cy: number; z: number; goods: [Role, Role]; dim: number; v: View; t: number; side: 'near' | 'far'}) {
  const mid = x + w / 2, run = w - 0.8;
  return <>{Array.from({length: Math.ceil(run)}, (_, i) => x + 0.4 + ((i + t * 0.9) % run))
    .filter((gx) => (side === 'far' ? gx < mid - 0.6 : gx >= mid - 0.6))
    .sort((p, q) => p - q)
    .map((gx, i) => <Faces key={i} b={{x: gx - 0.22, y: cy - 0.22, z, w: 0.44, d: 0.44, h: 0.44}} base={hue(gx < mid ? goods[0] : goods[1], dim)} v={v} />)}</>;
}

function Machine({kind, x, y, w, d, role, goods, dim, v, t}: {kind: 'press' | 'arch' | 'racks'; x: number; y: number; w: number; d: number; role: Role; goods?: [Role, Role]; dim: number; v: View; t: number}) {
  const base = hue(role, dim), ink = 'var(--vt-muted)';
  const cx = x + w / 2, cy = y + d / 2;
  if (kind === 'racks') {
    // three rows of shelves, each holding cubes of the store's colour
    return <>{[0, 1, 2].map((r) => {
      const ry = y + 0.4 + r * (d - 0.8) / 3;
      return <g key={r}>
        <Faces b={{x: x + 0.4, y: ry, z: 0.2, w: w - 0.8, d: 0.5, h: 1.3}} base="var(--vt-panel2)" v={v} />
        {[0, 1, 2, 3].map((c) => <Faces key={c} b={{x: x + 0.55 + c * (w - 1.1) / 4, y: ry + 0.08, z: 1.5, w: 0.42, d: 0.36, h: 0.42}} base={base} v={v} />)}
      </g>;
    })}</>;
  }
  const belt = <Faces b={{x: x + 0.2, y: cy - 0.4, z: 0.15, w: w - 0.4, d: 0.8, h: 0.3}} base="var(--vt-panel2)" v={v} />;
  const far = goods && <Goods x={x} w={w} cy={cy} z={0.45} goods={goods} dim={dim} v={v} t={t} side="far" />;
  const near = goods && <Goods x={x} w={w} cy={cy} z={0.45} goods={goods} dim={dim} v={v} t={t} side="near" />;
  if (kind === 'arch') {
    // a scanning arch across the belt, its light pulsing on what passes under it
    const pulse = (Math.sin(t * 5) + 1) / 2, ax = cx - 0.45;
    const P = (a: number, b: number, c: number) => project(a, b, c, v).map((n) => n.toFixed(1)).join(',');
    return <>
      <Faces b={{x: ax, y: y + 0.25, z: 0.15, w: 0.5, d: 0.5, h: 2.1}} base={base} v={v} />
      {belt}{far}
      <polygon points={[P(ax + 0.25, y + 0.75, 0.5), P(ax + 0.25, y + d - 0.75, 0.5), P(ax + 0.25, y + d - 0.75, 2.2), P(ax + 0.25, y + 0.75, 2.2)].join(' ')} style={{fill: base}} opacity={0.12 + 0.18 * pulse} />
      <Faces b={{x: ax, y: y + d - 0.75, z: 0.15, w: 0.5, d: 0.5, h: 2.1}} base={base} v={v} />
      <Faces b={{x: ax, y: y + 0.25, z: 2.25, w: 0.5, d: d - 0.5, h: 0.4}} base={base} v={v} />
      {near}
    </>;
  }
  // a press over the belt: a block that stamps down, twice a second
  const ram = 0.15 + 0.55 * Math.abs(Math.sin(t * Math.PI));
  return <>
    {belt}{far}
    <Faces b={{x: cx - 0.7, y: cy - 1.2, z: 0.15, w: 1.2, d: 0.4, h: 2.6}} base={ink} v={v} />
    <Faces b={{x: cx - 0.6, y: cy - 0.5, z: 0.95 + ram, w: 1, d: 1, h: 0.6}} base={base} v={v} />
    {near}
  </>;
}

/** A flat roof slab carrying a row of sawtooth lights, each a slope rising toward +x and a glazed face dropping back */
function Roof({x, y, w, d, z, base, v}: {x: number; y: number; w: number; d: number; z: number; base: string; v: View}) {
  const slab = `color-mix(in srgb, ${base} 50%, var(--vt-panel2))`, ts = tones(slab);
  const teeth = Math.max(2, Math.round(w / 1.4)), p = (w - 0.4) / teeth, rise = 0.55, z0 = z + 0.28;
  const P = (a: number, b: number, c: number) => project(a, b, c, v);
  const poly = (list: Array<[number, number]>) => list.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
  return <>
    <Faces b={{x: x - 0.1, y: y - 0.1, z, w: w + 0.2, d: d + 0.2, h: 0.28}} base={slab} v={v} />
    {Array.from({length: teeth}, (_, i) => {
      const a = x + 0.2 + i * p, b = a + p, y0 = y + 0.3, y1 = y + d - 0.3;
      return <g key={i}>
        <polygon points={poly([P(a, y0, z0), P(b, y0, z0 + rise), P(b, y1, z0 + rise), P(a, y1, z0)])} style={{fill: ts.top}} />
        <polygon points={poly([P(a, y1, z0), P(b, y1, z0), P(b, y1, z0 + rise)])} style={{fill: ts.left}} />
        <polygon points={poly([P(b, y0, z0), P(b, y1, z0), P(b, y1, z0 + rise), P(b, y0, z0 + rise)])} style={{fill: 'var(--vt-panel)'}} opacity={0.92} />
      </g>;
    })}
  </>;
}

export function Building({at, size = [4, 3, 2.4], kind = 'hall', role = 'process', name = '', machine = 'press', goods, rise = 1, ping = 0, lift = 0, dim = 0, origin, k}: Props) {
  const v: View = {origin, k};
  const t = useDocTime();
  if (rise <= 0) return null;
  const r = springOut((rise - 0.3) / 0.7);
  const [x, y] = at, [w, d, H] = size, h = H * r, kk = k ?? 46;
  const base = hue(role, dim), tn = tones(base);
  // what lies on the floor under it: the plot marked out before it rises, and the rings that name it
  const under = <>
    <path d={plotPath(x, y, w, d, rise / 0.3, v)} fill="none" style={{stroke: base}} strokeWidth={3} strokeDasharray="10 7" strokeLinecap="round" opacity={1 - 0.6 * unit((rise - 0.3) / 0.3)} />
    {[0, 0.3].map((lag) => {
      const p = unit((ping - lag) / (1 - lag));
      return p > 0 && p < 1 ? <polygon key={lag} points={ringPoints(x, y, w, d, 0.3 + p * 2.6, v)} fill="none" style={{stroke: base}} strokeWidth={4 - 3 * p} opacity={(1 - p) * 0.9} /> : null;
    })}
  </>;
  if (r <= 0) return <svg {...CANVAS}>{under}</svg>;
  const textColor = paint(role, dim);
  const label = name && r > 0.6 && unit(lift) < 0.45 && (
    <text transform={faceText('left', x + 0.35, y + d, Math.min(h * 0.32, 0.9), v)} style={{fill: textColor, fontFamily: 'var(--vt-sans)', fontWeight: 700}}
      fontSize={Math.round(kk * Math.min(0.78, h * 0.34))} opacity={unit((r - 0.6) / 0.3)}>{name}</text>
  );

  if (kind === 'tank') {
    const R = Math.min(w, d) / 2, [cx, cy] = project(x + w / 2, y + d / 2, 0, v), [, ty] = project(x + w / 2, y + d / 2, h, v);
    const rx = 1.2247 * R * kk, ry = 0.7071 * R * kk;
    const bands = [0.33, 0.66].map((f) => cy - (cy - ty) * f);
    return (
      <svg {...CANVAS}>
        {under}
        <path d={`M${cx - rx} ${ty}L${cx - rx} ${cy}A${rx} ${ry} 0 0 0 ${cx} ${cy + ry}L${cx} ${ty}Z`} style={{fill: tn.left}} />
        <path d={`M${cx} ${ty}L${cx} ${cy + ry}A${rx} ${ry} 0 0 0 ${cx + rx} ${cy}L${cx + rx} ${ty}Z`} style={{fill: tn.right}} />
        {bands.map((b, i) => <path key={i} d={`M${cx - rx} ${b}A${rx} ${ry} 0 0 0 ${cx + rx} ${b}`} fill="none" style={{stroke: tn.right}} strokeWidth={2} />)}
        <ellipse cx={cx} cy={ty} rx={rx} ry={ry} style={{fill: tn.top}} />
        <ellipse cx={cx} cy={ty} rx={rx * 0.62} ry={ry * 0.62} fill="none" style={{stroke: tn.left}} strokeWidth={2} opacity={0.5} />
        {name && r > 0.6 && <text x={cx - rx * 0.7} y={cy - (cy - ty) * 0.18} style={{fill: textColor, fontFamily: 'var(--vt-sans)', fontWeight: 700}} fontSize={Math.round(kk * 0.7)}>{name}</text>}
      </svg>
    );
  }

  if (kind === 'tower') {
    const rows = Math.max(1, Math.floor(h / 0.7));
    const slot = (face: 'left' | 'right', i: number) => {
      const z = 0.45 + i * 0.7;
      if (z + 0.25 > h) return null;
      const P = face === 'left' ? (s: number, zz: number) => project(x + s, y + d, zz, v) : (s: number, zz: number) => project(x + w, y + d - s, zz, v);
      const len = face === 'left' ? w : d;
      const [a, b, c, e] = [P(0.35, z), P(len - 0.35, z), P(len - 0.35, z + 0.22), P(0.35, z + 0.22)];
      return <polygon key={`${face}${i}`} points={[a, b, c, e].map((p) => p.join(',')).join(' ')} style={{fill: face === 'left' ? tn.top : tn.left}} opacity={0.75} />;
    };
    return (
      <svg {...CANVAS}>
        {under}
        <Faces b={{x, y, w, d, h}} base={base} v={v} />
        {Array.from({length: rows}, (_, i) => [slot('left', i), slot('right', i)])}
      </svg>
    );
  }

  // a hall: four walls and a roof slab; lifting the roof opens it from above
  const wall = 0.2, L = unit(lift);
  // the roof is lifted, carried back and set down on the floor behind, like a lid put aside
  const down = easeOut((L - 0.7) / 0.3), roofZ = (h + 1.0 * easeOut(L / 0.35)) * (1 - down), aside = easeOut((L - 0.3) / 0.45) * (d + 0.8);
  // with the roof aside, the two near walls are cut down so the machine is seen whole
  const near = h - (h - 0.7) * easeOut((L - 0.45) / 0.55);
  const inner = 'var(--vt-panel2)';
  return (
    <svg {...CANVAS}>
      {under}
      {down >= 0.5 && <Roof x={x} y={y - aside} w={w} d={d} z={roofZ} base={base} v={v} />}
      {L > 0 && <>
        <Faces b={{x, y, w, d: wall, h}} base={`color-mix(in srgb, ${inner} 80%, #1c2133)`} v={v} only={['left']} />
        <Faces b={{x, y, w: wall, d, h}} base={`color-mix(in srgb, ${inner} 80%, #1c2133)`} v={v} only={['right']} />
        <Faces b={{x: x + wall, y: y + wall, w: w - 2 * wall, d: d - 2 * wall, h: 0.15}} base={inner} v={v} only={['top']} />
        <Machine kind={machine} x={x + wall} y={y + wall} w={w - 2 * wall} d={d - 2 * wall} role={role} goods={goods} dim={dim} v={v} t={t} />
        <Faces b={{x, y: y + d - wall, w, d: wall, h: near}} base={base} v={v} />
        <Faces b={{x: x + w - wall, y, w: wall, d, h: near}} base={base} v={v} />
        <Faces b={{x, y, w, d: wall, h}} base={base} v={v} only={['top']} />
        <Faces b={{x, y, w: wall, d, h}} base={base} v={v} only={['top']} />
      </>}
      {L <= 0 && <Faces b={{x, y, w, d, h}} base={base} v={v} />}
      {label}
      {/* the roof: a slab a little wider than the walls, with a sawtooth of north lights, the tell of a works */}
      {down < 0.5 && <Roof x={x} y={y - aside} w={w} d={d} z={roofZ} base={base} v={v} />}
    </svg>
  );
}
