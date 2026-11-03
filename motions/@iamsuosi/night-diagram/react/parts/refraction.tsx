import {useId, useMemo} from 'react';
import {C, CANVAS, clamp} from './night.ts';
import {WAVES, dirOf, prismCorners, trace, upTo, type Optic, type P2} from './optics.ts';

export const meta = {
  name: {en: 'Bent light', 'zh-CN': '折射光路'},
  purpose: 'mark',
  line: "A beam of real light traced through glass by Snell's law: it bends where it enters and leaves, and white light fans out from ember red to ice violet.",
  fits: 'a prism splitting white light, a lens bringing rays to a focus, a rainbow\'s drop, why a straw looks broken in water: light through glass, computed, not drawn',
  params: {
    from: {type: '[x, y]', doc: 'where the light starts, in px'},
    aim: {type: 'number', default: 0, doc: 'the way it points, in degrees: 0 is to the right, 90 is down'},
    glass: {type: 'Optic[]', doc: "what it passes through, in px: prism {at, rot, side, flip}, lens {at, rot, f, dia} (rot is the way its axis points), card {at, rot, w} that stops it; each takes in, 0 to 1, and acts once it is in"},
    white: {type: 'boolean', default: true, doc: 'all seven colours on one path, so glass that disperses fans them; false gives one colour (`color`)'},
    color: {type: 'number', default: 3, doc: 'with white false, which colour: 0 the red end, 6 the violet end'},
    rays: {type: 'number[]', doc: 'optional: offsets in px across the beam, for parallel rays (a lens\'s focus); one ray by default'},
    reach: {type: 'px', default: 4000, doc: 'how far the light has travelled from `from`: tween it to send the light out'},
    power: {type: 'progress', default: 1, doc: 'how bright it is'},
  },
  preview: 24.6,
};

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const EMBER = hex(C.ember), ICE = hex(C.ice);
/** A colour of the spectrum in Night Diagram's two accents: ember at the red end, ice at the violet end, the light between them */
const tone = (i: number) => {
  const k = i / (WAVES.length - 1);
  return `rgb(${EMBER.map((e, j) => Math.round(e + (ICE[j] - e) * k)).join(',')})`;
};
const d = (pts: P2[]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');

export function Refraction({from, aim = 0, glass, white = true, color = 3, rays = [0], reach = 4000, power = 1}: {
  from: P2; aim?: number; glass: Optic[]; white?: boolean; color?: number; rays?: number[]; reach?: number; power?: number;
}) {
  const id = useId().replace(/:/g, '');
  const dir = dirOf(aim), across = dirOf(aim + 90);
  const traced = useMemo(() => {
    const waves = white ? WAVES.map((w, i) => ({w, i})) : [{w: WAVES[clamp(Math.round(color), 0, 6)], i: clamp(Math.round(color), 0, 6)}];
    return rays.flatMap((off) => {
      const start: P2 = [from[0] + across[0] * off, from[1] + across[1] * off];
      return waves.map(({w, i}) => ({i, pts: trace(start, dir, w, glass).pts}));
    });
  }, [from[0], from[1], aim, glass, white, color, rays.join()]);
  const p = clamp(power);
  return (
    <svg {...CANVAS}>
      <defs>
        <filter id={`${id}a`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={12} /></filter>
        <filter id={`${id}b`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={3} /></filter>
      </defs>
      {/* the glass: clear, a faint body and a fine bright edge; nothing that is not light glows */}
      {glass.map((o, k) => {
        const s = clamp(o.in ?? 1), drop = (1 - s) * -60;
        if (s <= 0) return null;
        if (o.kind === 'prism') return <path key={k} d={d(prismCorners(o)) + 'Z'} transform={`translate(0 ${drop})`} fill={C.line} fillOpacity={0.14} stroke={C.read} strokeOpacity={0.55} strokeWidth={2} opacity={s} />;
        const [tx, ty] = dirOf(o.rot + 90), [ax, ay] = dirOf(o.rot);
        const half = (o.kind === 'lens' ? o.dia ?? 260 : o.w ?? 300) / 2, bulge = o.kind === 'lens' ? Math.min(half * 0.32, 4000 / Math.abs(o.f)) * Math.sign(o.f) : 6;
        const a: P2 = [o.at[0] - tx * half, o.at[1] - ty * half], b: P2 = [o.at[0] + tx * half, o.at[1] + ty * half];
        const shape = o.kind === 'lens'
          ? `M${a[0]} ${a[1]}Q${o.at[0] + ax * bulge * 2} ${o.at[1] + ay * bulge * 2} ${b[0]} ${b[1]}Q${o.at[0] - ax * bulge * 2} ${o.at[1] - ay * bulge * 2} ${a[0]} ${a[1]}Z`
          : `M${a[0] - ax * bulge} ${a[1] - ay * bulge}L${b[0] - ax * bulge} ${b[1] - ay * bulge}L${b[0]} ${b[1]}L${a[0]} ${a[1]}Z`;
        return <path key={k} d={shape} transform={`translate(0 ${drop})`} fill={o.kind === 'lens' ? C.line : C.dusk} fillOpacity={o.kind === 'lens' ? 0.14 : 0.9} stroke={C.read} strokeOpacity={0.5} strokeWidth={2} opacity={s} />;
      })}
      {reach > 0 && p > 0 && (
        <g opacity={p} style={{mixBlendMode: 'screen'}}>
          {/* each colour in its bloom, added to the others, so where they share a path they read as white */}
          {traced.map(({i, pts}, k) => <path key={`b${k}`} d={d(upTo(pts, reach))} fill="none" stroke={white ? tone(i) : tone(i)} strokeWidth={white ? 14 : 18} strokeLinecap="round" strokeLinejoin="round" opacity={white ? 0.5 : 0.8} filter={`url(#${id}a)`} />)}
          {traced.map(({i, pts}, k) => <path key={`m${k}`} d={d(upTo(pts, reach))} fill="none" stroke={tone(i)} strokeWidth={white ? 4 : 6} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} filter={`url(#${id}b)`} />)}
          {traced.map(({pts}, k) => <path key={`c${k}`} d={d(upTo(pts, reach))} fill="none" stroke={C.core} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" opacity={white ? 0.35 : 0.9} />)}
        </g>
      )}
    </svg>
  );
}
