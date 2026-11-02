import {TONE, ease, fid, hash, type Tone} from './ink.ts';
export {ridge} from './ink.ts';

export const meta = {
  name: {en: 'Ink wash', 'zh-CN': '墨晕'},
  purpose: 'steps',
  line: 'A mass of wet ink (hills, a bank, a city) that blooms from one point with feathered edges and a tide line, then settles a deeper tone.',
  fits: 'a place coming into the story; land or a crowd as a mass; far hills in clear ink behind near ones',
  params: {
    d: {type: 'SVG path data', doc: 'the mass, closed, in px inside the box; ridge(width, height, peaks, seed) draws a range of hills'},
    width: {type: 'px', doc: 'the box\'s width'},
    height: {type: 'px', doc: 'the box\'s height'},
    tone: {type: 'clear | light | heavy | thick | burnt', default: 'light', doc: 'how dark the first wash is: far is clear, near is heavy'},
    bloom: {type: 'progress', default: 1, doc: '0 to 1: how far the ink has spread from its point; tween it on the word that names the place'},
    settle: {type: 'progress', default: 0, doc: '0 to 1: a second, deeper tone soaking into the upper part (the ridge, the near bank)'},
    from: {type: '[x, y]', default: [0.5, 0.3], doc: 'where the brush touched, as fractions of the box'},
    mist: {type: 'boolean', default: true, doc: 'the mass dissolves downwards into the paper, as hills do into mist'},
  },
  preview: 6,
};

export function Wash({d, width, height, tone = 'light', bloom = 1, settle = 0, from = [0.5, 0.3], mist = true}: {d: string; width: number; height: number; tone?: Tone; bloom?: number; settle?: number; from?: [number, number]; mist?: boolean}) {
  const key = `${d.length}:${d.slice(0, 40)}:${width}x${height}`, id = fid('wash', key), seed = hash(key) % 997;
  const feather = Math.max(14, Math.min(46, Math.min(width, height) * 0.07));
  const cx = from[0] * width, cy = from[1] * height;
  const reach = Math.max(...[[0, 0], [width, 0], [0, height], [width, height]].map(([x, y]) => Math.hypot(x - cx, y - cy))) * 1.12;
  const b = ease(bloom), s = ease(settle);
  if (b <= 0) return null;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        {/* wet ink on absorbent paper: the edge feathers on the fibres, pigment gathers in a tide line just inside it, the body granulates */}
        {[0, 1].map((layer) => (
          <filter key={layer} id={`${id}-f${layer}`} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency={layer ? 0.024 : 0.016} numOctaves="4" seed={seed + layer * 13} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={feather * (layer ? 0.8 : 1)} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feGaussianBlur in="d" stdDeviation={feather * 0.22} result="soft" />
            <feGaussianBlur in="d" stdDeviation={feather * 0.65} result="wide" />
            <feComposite in="soft" in2="wide" operator="arithmetic" k1="0" k2="2.5" k3="-1.9" k4="0" result="rim" />
            {/* the brush's drag, long and level, and the pigment's grain where it settled */}
            <feTurbulence type="fractalNoise" baseFrequency="0.006 0.022" numOctaves="4" seed={seed + 9} result="drag" />
            <feTurbulence type="fractalNoise" baseFrequency="0.32" numOctaves="2" seed={seed + 5} result="g" />
            <feComposite in="drag" in2="g" operator="arithmetic" k1="0" k2="0.35" k3="0.65" k4="0" result="tex" />
            <feColorMatrix in="tex" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.5 -0.18" result="ga" />
            <feComposite in="soft" in2="ga" operator="arithmetic" k1="0.55" k2="0.62" k3="0" k4="0" result="body" />
            <feMerge><feMergeNode in="body" /><feMergeNode in="rim" /></feMerge>
          </filter>
        ))}
        <filter id={`${id}-ragged`} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed={seed + 7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={Math.min(120, reach * 0.18)} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <radialGradient id={`${id}-front`}>
          <stop offset="0.72" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-bloom`} maskUnits="userSpaceOnUse" x={-width} y={-height} width={width * 3} height={height * 3}>
          <circle cx={cx} cy={cy} r={reach * b} fill={b >= 1 ? '#fff' : `url(#${id}-front)`} filter={b >= 1 ? undefined : `url(#${id}-ragged)`} />
        </mask>
        <linearGradient id={`${id}-down`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--vt-text)" />
          <stop offset="0.5" stopColor="var(--vt-text)" stopOpacity={mist ? 0.62 : 0.92} />
          <stop offset="1" stopColor="var(--vt-text)" stopOpacity={mist ? 0 : 0.85} />
        </linearGradient>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--vt-text)" />
          <stop offset="0.3" stopColor="var(--vt-text)" stopOpacity="0.55" />
          <stop offset="0.62" stopColor="var(--vt-text)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g mask={`url(#${id}-bloom)`}>
        <g opacity={TONE[tone]} filter={`url(#${id}-f0)`}><path d={d} fill={`url(#${id}-down)`} /></g>
        {s > 0 && <g opacity={Math.min(0.95, TONE[tone] * 1.15) * s} filter={`url(#${id}-f1)`}><path d={d} fill={`url(#${id}-top)`} /></g>}
      </g>
    </svg>
  );
}
