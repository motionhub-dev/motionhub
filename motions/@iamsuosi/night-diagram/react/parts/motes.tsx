import {useCompositionTime} from '@motionhub/runtime';
import {C, CANVAS, glide, hash, mix, stagger} from './night.ts';

export const meta = {
  name: {en: 'Moving motes', 'zh-CN': '流动粒子'},
  purpose: 'data',
  line: "Small marks that travel between regions, each on its own path and time, so a process can be watched happening.",
  fits: "charge separating, ions crossing, gas spreading; flashes all over a region",
  params: {
    n: {type: 'number', default: 24, doc: 'how many'},
    from: {type: '[x, y, w, h]', doc: 'the region they start in'},
    to: {type: '[x, y, w, h]', doc: 'the region they end in'},
    t: {type: 'progress', default: 1, doc: '0 to 1: they travel, each a little after the last'},
    show: {type: 'progress', default: 1, doc: 'their opacity'},
    glyph: {type: "'plus' | 'minus' | 'dot'", default: "'dot'", doc: 'the mark: a charge sign, or a point of light'},
    color: {type: 'string', doc: 'its colour: ember for one kind, ice for the other'},
    size: {type: 'number', default: 14, doc: 'half the width of the mark, in px'},
    seed: {type: 'number', default: 1, doc: 'which paths they take'},
    twinkle: {type: 'number', default: 0, doc: 'above 0, each flashes on and off this many times a second, for events that happen all over a region rather than a journey'},
  },
  preview: 11.5,
};

export function Motes({n = 24, from, to, t = 1, show = 1, glyph = 'dot', color = C.ice, size = 14, seed = 1, twinkle = 0}: {n?: number; from: [number, number, number, number]; to: [number, number, number, number]; t?: number; show?: number; glyph?: 'plus' | 'minus' | 'dot'; color?: string; size?: number; seed?: number; twinkle?: number}) {
  const time = useCompositionTime();
  if (show <= 0.001) return null;
  return (
    <svg {...CANVAS}>
      <g opacity={show} stroke={color} strokeWidth={size * 0.46} strokeLinecap="round" fill={color}>
        {Array.from({length: n}, (_, i) => {
          const a = hash(i * 3 + seed), b = hash(i * 5 + seed + 40), c = hash(i * 7 + seed + 80), d = hash(i * 11 + seed + 120);
          const k = glide(stagger(t, a * n, n, 0.5));
          // they waver on the way and keep stirring after they arrive: the process never freezes
          const w = Math.sin(time * (1 + d) + i) * 8;
          const x = mix(from[0] + b * from[2], to[0] + c * to[2], k) + w, y = mix(from[1] + c * from[3], to[1] + b * to[3], k) + Math.cos(time * (1.2 + a) + i) * 5;
          const g = `translate(${x.toFixed(1)} ${y.toFixed(1)})`;
          if (twinkle > 0) {
            const on = (time * twinkle * (0.6 + d * 0.8) + a * 7) % 1;
            if (on > 0.22) return null;
            return <circle key={i} transform={`translate(${(from[0] + b * from[2]).toFixed(1)} ${(from[1] + c * from[3]).toFixed(1)})`} r={size * (1 - on * 3)} stroke="none" />;
          }
          if (glyph === 'dot') return <circle key={i} transform={g} r={size * 0.42} stroke="none" />;
          return <path key={i} transform={g} d={glyph === 'plus' ? `M${-size} 0H${size}M0 ${-size}V${size}` : `M${-size} 0H${size}`} fill="none" />;
        })}
      </g>
    </svg>
  );
}
