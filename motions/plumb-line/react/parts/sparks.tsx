import {C, CANVAS, clamp, hash, smooth, yOf, type Cam} from './plumb.ts';

export const meta = {
  name: {en: 'Points of light', 'zh-CN': '点点微光'},
  purpose: 'mark',
  line: "Small lights that pulse on and off through one dark span, each at its own time, the only bright things left on the sheet.",
  fits: "animals that glow, stars, city lights from above: what shows up once the background has gone dark",
  params: {
    cam: {type: '{at, scale}', doc: "the scene's camera"},
    from: {type: 'number', doc: 'the top of the span'},
    to: {type: 'number', doc: 'the bottom of the span'},
    x: {type: '[x0, x1]', default: '[60, 1500]', doc: 'how far across, in px'},
    n: {type: 'number', default: 42, doc: 'how many'},
    clock: {type: 'number', default: 0, doc: 'seconds: tween it linearly so they keep pulsing'},
    show: {type: 'progress', default: 1, doc: 'they come on'},
    color: {type: 'string', doc: 'their colour'},
  },
  preview: 15.5,
};

export function Sparks({cam, from, to, x = [60, 1500], n = 42, clock = 0, show = 1, color = C.lure}: {cam: Cam; from: number; to: number; x?: [number, number]; n?: number; clock?: number; show?: number; color?: string}) {
  if (show <= 0) return null;
  const far = clamp(cam.scale / 0.26, 0.3, 1);
  return (
    <svg {...CANVAS}>
      {Array.from({length: n}, (_, i) => {
        const y = yOf(cam, from + hash(i + 11) * (to - from));
        if (y < -40 || y > 1000) return null;
        const px = x[0] + hash(i) * (x[1] - x[0]), pulse = smooth(Math.sin(clock * (0.5 + hash(i + 5) * 0.7) + i * 2.1) * 0.9 + 0.3) * smooth(show * 1.5 - hash(i + 2) * 0.5);
        return pulse > 0.02 && <g key={i} opacity={pulse}><circle cx={px} cy={y} r={(15 + hash(i + 9) * 11) * far} fill={color} opacity={0.22} /><circle cx={px} cy={y} r={(3 + hash(i + 7) * 3) * far} fill={color} /></g>;
      })}
    </svg>
  );
}
