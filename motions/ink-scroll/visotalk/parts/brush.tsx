import {TONE, bristles, fid, hash, strokeOutline, type Pt, type Tone} from './ink.ts';

export const meta = {
  name: {en: 'Brush stroke', 'zh-CN': '笔触'},
  purpose: 'link',
  line: 'One stroke of a loaded brush: pressed in, swelling, tapering, its dry end breaking into flying white.',
  fits: 'a road, a river or a trade route between places; a pine trunk; one decisive line',
  params: {
    points: {type: '[x, y][]', doc: 'the centreline, a few points in px inside the box; the stroke runs through them smoothly'},
    width: {type: 'px', doc: 'the box\'s width'},
    height: {type: 'px', doc: 'the box\'s height'},
    weight: {type: 'px', default: 18, doc: 'the brush\'s width at full press'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: how far the brush has travelled; tween it over the words that follow the route'},
    dry: {type: 'progress', default: 0.3, doc: '0 is a wet, solid stroke; 1 is flying white, bristle tracks only'},
    tone: {type: 'clear | light | heavy | thick | burnt', default: 'thick', doc: 'how dark the ink is'},
  },
  preview: 33,
};

export function Brush({points, width, height, weight = 18, draw = 1, dry = 0.3, tone = 'thick'}: {points: Pt[]; width: number; height: number; weight?: number; draw?: number; dry?: number; tone?: Tone}) {
  const key = JSON.stringify(points) + weight, seed = hash(key) % 9973, id = fid('brush', key);
  // the wet body runs until the brush starts to dry; from there only the bristle tracks go on
  const tracks = bristles(points, weight, draw, dry, seed);
  const body = strokeOutline(points, weight, Math.min(draw, dry > 0 ? tracks.body : 1), seed);
  if (!body && !tracks.tracks.length) return null;
  const ink = TONE[tone];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        {/* the paper drinks a hair of ink past the stroke's edge */}
        <filter id={`${id}-wet`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed={seed % 97} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={Math.max(2.5, weight * 0.16)} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="0.7" />
        </filter>
      </defs>
      <g filter={`url(#${id}-wet)`}>
        {body && <path d={body} fill="var(--vt-text)" fillOpacity={ink} />}
        {tracks.tracks.map((t, i) => <path key={i} d={t.d} fill="none" stroke="var(--vt-text)" strokeOpacity={ink * t.ink} strokeWidth={tracks.weight} strokeLinecap="round" strokeLinejoin="round" />)}
      </g>
    </svg>
  );
}
