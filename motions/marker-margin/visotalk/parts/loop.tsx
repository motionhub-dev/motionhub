import {INK, KEY, fray, lengthOf, loop, pathOf, unit, wobble, type Ink, type Pt} from './marker.ts';

export const meta = {
  name: {en: 'Loop', 'zh-CN': '圈'},
  purpose: 'mark',
  line: 'A loop scribbled round the thing in the shot as it is named, running on past its start.',
  fits: 'the gadget in their hand; a dial they point at; one face in a crowd',
  params: {
    at: {type: 'point', doc: '[x, y] in the part\'s box: the centre of the thing'},
    rx: {type: 'px', default: 90, doc: 'half its width, with room to spare'},
    ry: {type: 'px', default: 70, doc: 'half its height'},
    tilt: {type: 'number', default: -0.12, doc: 'radians the loop leans by'},
    draw: {type: 'progress', default: 0, doc: '0 to 1: the loop runs round; tween it on the word, in about 0.4 s'},
    seed: {type: 'text', default: 'loop', doc: 'another seed is another hand'},
  },
  preview: 7.9,
};

/**
 * The marker's stroke, shared by every mark of the motion: `strokes` are drawn one after another as `draw` goes 0 → 1, each with its keyline, a frayed
 * core and the streak where the felt drags. Coordinates are the part's own.
 */
export function MarkerStroke({strokes, draw, ink = 'marker', weight = 9, seed}: {strokes: Pt[][]; draw: number; ink?: Ink; weight?: number; seed: string}) {
  const lengths = strokes.map(lengthOf), total = lengths.reduce((a, b) => a + b, 0) || 1;
  const f = fray(seed);
  let left = unit(draw) * total;
  return (
    <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <defs>
        <filter id={f.id} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves={2} seed={f.seed} />
          <feDisplacementMap in="SourceGraphic" scale={weight * 0.45} />
        </filter>
      </defs>
      {strokes.map((pts, i) => {
        const len = lengths[i] || 1, shown = Math.max(0, Math.min(len, left)) / len;
        left -= len;
        if (shown <= 0) return null;
        const d = pathOf(pts), dash = {pathLength: 1, strokeDasharray: `${shown.toFixed(4)} 2`};
        return (
          <g key={i} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={d} stroke={KEY} strokeWidth={weight + 7} {...dash} />
            <path d={d} stroke={INK[ink]} strokeWidth={weight} strokeOpacity={0.96} filter={`url(#${f.id})`} {...dash} />
            {/* the felt's streak: a darker hair along one side of the stroke */}
            <path d={d} stroke={`color-mix(in srgb, ${INK[ink]} 62%, #000)`} strokeWidth={Math.max(1.2, weight * 0.2)} strokeOpacity={0.4}
              transform={`translate(${(weight * 0.2).toFixed(1)} ${(-weight * 0.18).toFixed(1)})`} {...dash} />
          </g>
        );
      })}
    </svg>
  );
}

export function Loop({at, rx = 90, ry = 70, tilt = -0.12, draw = 0, seed = 'loop'}: {at: [number, number]; rx?: number; ry?: number; tilt?: number; draw?: number; seed?: string}) {
  const pts = wobble(loop(at[0], at[1], rx, ry, seed, 1.22, tilt), seed, Math.max(3, Math.min(rx, ry) * 0.06));
  return <MarkerStroke strokes={[pts]} draw={draw} seed={seed} />;
}
