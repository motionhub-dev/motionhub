import React from 'react';
import {useTheme} from '@visotalk/runtime';
import {dilute, ease, fid, hash, hex, noise1, rgb, type Rgb} from './paint.ts';

export const meta = {
  name: {en: 'Wash', 'zh-CN': '水彩晕染'},
  purpose: 'mark',
  line: 'A shape in transparent watercolour: wet colour spreads from the brush, pools at the bottom and dries with a hard, darker edge.',
  fits: 'anything painted: a tree, a hill, the sun, a house; a pale sky behind them',
  params: {
    d: {type: 'SVG path data', doc: 'the shape, closed, in px inside the box; paint.ts draws blobs, leaves and tapered strokes'},
    width: {type: 'px', doc: 'the box\'s width'},
    height: {type: 'px', doc: 'the box\'s height'},
    pigment: {type: 'token or #hex', default: 'data', doc: 'the colour: a token (data, good, warn, op, grad, bad, muted) or a hex'},
    strength: {type: '0 to 1', default: 0.7, doc: 'how much pigment: 0.3 a pale sky, 0.7 a thing, 0.95 a dark accent'},
    paint: {type: 'progress', default: 1, doc: '0 to 1: how far the wet colour has spread from `from`; tween it on the word that names the thing'},
    dry: {type: 'progress', default: 1, doc: '0 to 1: the wet edge dries into a hard, darker line and the colour pales a little; tween it after `paint`'},
    from: {type: '[x, y] | "left" | "top"', default: [0.5, 0.5], doc: 'where the brush touched, as fractions of the box, or a sweep from that side'},
    granulate: {type: '0 to 1', default: 0.5, doc: 'how much the pigment settles into the paper\'s tooth (high for blues and earths, low for yellows)'},
    blooms: {type: '[x, y, r][]', default: [], doc: 'backruns: where water crept back into the drying wash, in px; each a paler pool with a frilled dark edge, shown as it dries'},
    lift: {type: 'progress', default: 0, doc: '0 to 1: the colour lifted off with a damp brush from `liftFrom`, leaving a faint stain and its edge'},
    liftFrom: {type: '[x, y]', default: [0.5, 0.5], doc: 'where the lifting starts, as fractions of the box'},
    wobble: {type: 'px', default: 12, doc: 'how far the painted edge strays from `d`'},
    name: {type: 'text', default: '', doc: 'a stable name for a shape whose `d` changes as it is drawn (drops landing, a puddle growing), so its edge and grain hold still'},
  },
  preview: 9.6,
};

const PAPER = '#F7F1E4';
/** A pigment named by a theme token or written as a hex */
export function usePigment(pigment: string): Rgb {
  const {colors} = useTheme() as {colors: Record<string, string>};
  return rgb(pigment.startsWith('#') ? pigment : colors[pigment] ?? colors.data ?? '#3E5FA8');
}

type From = [number, number] | 'left' | 'top';

export function Wash({d, width, height, pigment = 'data', strength = 0.7, paint = 1, dry = 1, from = [0.5, 0.5], granulate = 0.5, blooms = [], lift = 0, liftFrom = [0.5, 0.5], wobble = 12, name = ''}: {
  d: string; width: number; height: number; pigment?: string; strength?: number; paint?: number; dry?: number; from?: From;
  granulate?: number; blooms?: [number, number, number][]; lift?: number; liftFrom?: [number, number]; wobble?: number; name?: string;
}) {
  const c = usePigment(pigment), paper = rgb(PAPER);
  const shapeKey = name || `${d.length}:${d.slice(0, 48)}`, key = `${shapeKey}:${width}x${height}:${pigment}`, id = fid('wash', key), seed = hash(key) % 997, edgeSeed = hash(shapeKey) % 997;
  const p = ease(paint), dr = ease(dry), lf = ease(lift);
  if (p <= 0) return null;
  // the colour, let down with water at the top of the shape and pooled at the bottom, where the bead of wet paint ran and dried
  const s = Math.max(0.05, Math.min(1, strength));
  const top = hex(dilute(c, paper, 1 - s * 0.55)), mid = hex(dilute(c, paper, 1 - s * 0.8)), low = hex(dilute(c, paper, 1 - s)), pool = hex(c.map((v) => v * (1 - 0.3 * s)) as Rgb);
  // wet paint looks darker and its edge is soft; dried, it pales and the edge hardens into a line of pigment
  const body = 0.8 + 0.16 * (1 - dr), rim = dr, hard = 2 + 5 * dr, soften = 0.6 + 7 * (1 - dr);
  const reach = Math.hypot(width, height) * 1.05;
  // the wet front: it advances unevenly, further where the water ran, never as a straight wipe or a perfect circle
  const front = noise1(seed + 41), n = 48, pad = wobble * 3;
  let edge: string;
  if (from === 'left' || from === 'top') {
    const along = from === 'left' ? height + pad * 2 : width + pad * 2, across = (from === 'left' ? width : height) + pad * 2;
    const at = (i: number) => -pad + (across + 80) * p - 40 + front(i * 0.35) * 46 * Math.min(1, p * 4) * (1 - p * 0.6);
    const pts = Array.from({length: n + 1}, (_, i) => [at(i), -pad + (along * i) / n]);
    edge = from === 'left'
      ? `M${-pad} ${-pad} ${pts.map(([a, b]) => `L${a.toFixed(1)} ${b.toFixed(1)}`).join(' ')} L${-pad} ${height + pad} Z`
      : `M${-pad} ${-pad} ${pts.map(([a, b]) => `L${b.toFixed(1)} ${a.toFixed(1)}`).join(' ')} L${width + pad} ${-pad} Z`;
  } else {
    const cx = from[0] * width, cy = from[1] * height, r = reach * p;
    edge = `M${Array.from({length: n}, (_, i) => {
      const a = (i / n) * Math.PI * 2, rr = Math.max(0, r * (1 + 0.16 * front(i * 0.5) * (1 - p * 0.5)));
      return `${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`;
    }).join(' L')} Z`;
  }
  const clip = <path d={edge} />;
  // the shine is strongest while the paint is freshly laid and goes as it soaks in
  const wet = 0.5 * (1 - dr) * Math.min(1, p * 3);
  return (
    <>
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', mixBlendMode: 'multiply'}}>
      <defs>
        <linearGradient id={`${id}-c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} /><stop offset="0.55" stopColor={mid} /><stop offset="0.86" stopColor={low} /><stop offset="1" stopColor={pool} />
        </linearGradient>
        <clipPath id={`${id}-spread`}>{clip}</clipPath>
        <filter id={`${id}-f`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          {/* the edge wanders where the water went, then catches on the paper's tooth */}
          <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="3" seed={edgeSeed} result="n1" />
          <feDisplacementMap in="SourceGraphic" in2="n1" scale={wobble * 2} xChannelSelector="R" yChannelSelector="G" result="d1" />
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed={seed + 3} result="n2" />
          <feDisplacementMap in="d1" in2="n2" scale={1.6} xChannelSelector="R" yChannelSelector="G" result="shape" />
          {/* where the paint lies, as a hard-edged mask: soft while wet, sharp once dry */}
          <feGaussianBlur in="shape" stdDeviation={soften} result="sb" />
          <feColorMatrix in="sb" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${hard} ${-(hard - 1) / 2}`} result="A" />
          {/* the drying edge: pigment carried outwards by the evaporating water, a line just inside the edge */}
          <feGaussianBlur in="A" stdDeviation="3.2" result="B" />
          <feComposite in="A" in2="B" operator="arithmetic" k1="-1" k2="1" k3="0" k4="0" result="rim0" />
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed={seed + 17} result="en" />
          <feColorMatrix in="en" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.6 0 0 0 -0.7" result="E" />
          <feComposite in="rim0" in2="E" operator="arithmetic" k1="1.15" k2="0.15" k3="0" k4="0" result="rimA" />
          <feGaussianBlur in="A" stdDeviation="1.1" result="B2" />
          <feComposite in="A" in2="B2" operator="arithmetic" k1="-1.6" k2="1.6" k3="0" k4="0" result="line0" />
          <feComposite in="line0" in2="E" operator="arithmetic" k1="1.1" k2="0.2" k3="0" k4="0" result="lineA" />
          {/* granulation: pigment settled into the hollows of cold-press paper, and the slow unevenness of a wash laid wet */}
          <feTurbulence type="fractalNoise" baseFrequency="0.17" numOctaves="3" seed={seed + 7} result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  6 0 0 0 -2.8" result="G" />
          <feTurbulence type="fractalNoise" baseFrequency="0.0045 0.006" numOctaves="3" seed={seed + 11} result="cl" />
          <feColorMatrix in="cl" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -0.75" result="CL" />
          <feComposite in="A" in2="G" operator="arithmetic" k1={granulate} k2={1 - 0.35 * granulate} k3="0" k4="0" result="bodyG" />
          <feComposite in="bodyG" in2="CL" operator="arithmetic" k1="-0.38" k2="1" k3="0" k4="0" result="bodyA" />
          <feComposite in="bodyA" in2="rimA" operator="arithmetic" k1="0" k2={body} k3={rim * 0.75} k4="0" result="t1" />
          <feOffset in="A" dy="-9" result="up" />
          <feComposite in="A" in2="up" operator="arithmetic" k1="-1" k2="1" k3="0" k4="0" result="lowA" />
          <feGaussianBlur in="lowA" stdDeviation="2.5" result="pool" />
          <feComposite in="t1" in2="pool" operator="arithmetic" k1="0" k2="1" k3={0.7 * rim} k4="0" result="t2" />
          <feComposite in="t2" in2="lineA" operator="arithmetic" k1="0" k2="1" k3={rim * 1.1} k4="0" result="T" />
          <feComposite in="shape" in2="T" operator="in" />
        </filter>
        {blooms.length > 0 && (
          <filter id={`${id}-b`} x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
            {/* a backrun: water crept into the drying wash and pushed the pigment out into a frilled edge */}
            <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="4" seed={seed + 21} result="n" />
            <feDisplacementMap in="SourceAlpha" in2="n" scale="40" xChannelSelector="R" yChannelSelector="G" result="fr" />
            <feColorMatrix in="fr" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 4 -1.6" result="T" />
            <feGaussianBlur in="T" stdDeviation="4" result="B" />
            <feComposite in="B" in2="T" operator="arithmetic" k1="-1.6" k2="1.6" k3="0" k4="0" result="ring" />
            <feFlood floodColor={pool} />
            <feComposite in2="ring" operator="in" />
          </filter>
        )}
        {blooms.length > 0 && (
          <filter id={`${id}-bm`} x="-60%" y="-60%" width="220%" height="220%">
            <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="4" seed={seed + 21} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="40" xChannelSelector="R" yChannelSelector="G" result="fr" />
            <feGaussianBlur in="fr" stdDeviation="2" />
          </filter>
        )}
        {(blooms.length > 0 || lf > 0) && (
          <filter id={`${id}-lr`} x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed={seed + 31} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={Math.min(60, 12 + reach * lf * 0.3)} xChannelSelector="R" yChannelSelector="G" result="r" />
            <feGaussianBlur in="r" stdDeviation={Math.min(9, 3 + reach * lf * 0.04)} />
          </filter>
        )}
        {(blooms.length > 0 || lf > 0) && (
          <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-width} y={-height} width={width * 3} height={height * 3}>
            <rect x={-width} y={-height} width={width * 3} height={height * 3} fill="#fff" />
            {dr > 0 && <g filter={`url(#${id}-bm)`}>{blooms.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r * (0.6 + 0.4 * dr)} fill="#000" fillOpacity={0.4 * dr} />)}</g>}
            {lf > 0 && <circle cx={liftFrom[0] * width} cy={liftFrom[1] * height} r={reach * lf} fill="#000" fillOpacity={0.93} filter={`url(#${id}-lr)`} />}
          </mask>
        )}
        {/* while wet: the bead of pigment pushed ahead of the spreading water, and the shine of a wet surface */}
        <filter id={`${id}-wet`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="3" seed={edgeSeed} result="n1" />
          <feDisplacementMap in="SourceGraphic" in2="n1" scale={wobble * 2} xChannelSelector="R" yChannelSelector="G" result="d1" />
          <feGaussianBlur in="d1" stdDeviation="2.4" />
        </filter>
        <mask id={`${id}-front`} maskUnits="userSpaceOnUse" x={-width} y={-height} width={width * 3} height={height * 3}><path d={edge} fill="none" stroke="#fff" strokeWidth={wobble * 0.7 + 3} /></mask>
        <radialGradient id={`${id}-sheen`} cx="0.36" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" /><stop offset="0.35" stopColor="#fff" stopOpacity="0.18" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g mask={blooms.length > 0 || lf > 0 ? `url(#${id}-m)` : undefined}>
        <g filter={`url(#${id}-f)`}>
          <g clipPath={p < 1 ? `url(#${id}-spread)` : undefined}><path d={d} fill={`url(#${id}-c)`} /></g>
        </g>
        {p < 1 && dr < 1 && <g filter={`url(#${id}-wet)`} opacity={(1 - dr) * 0.75}><path d={d} fill={pool} mask={`url(#${id}-front)`} /></g>}
        {dr > 0 && blooms.length > 0 && <g filter={`url(#${id}-b)`} opacity={dr}>{blooms.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r * (0.6 + 0.4 * dr)} fill="#000" />)}</g>}
      </g>
    </svg>
    {wet > 0.02 && (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', mixBlendMode: 'screen', opacity: wet}}>
        <g filter={`url(#${id}-wet)`}><g clipPath={p < 1 ? `url(#${id}-spread)` : undefined}><path d={d} fill={`url(#${id}-sheen)`} /></g></g>
      </svg>
    )}
    </>
  );
}
