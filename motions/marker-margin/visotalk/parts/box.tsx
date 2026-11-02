import {MarkerStroke} from './loop.tsx';
import {random} from '@visotalk/runtime';
import {curve, wobble, type Pt} from './marker.ts';

export const meta = {
  name: {en: 'Box', 'zh-CN': '框选'},
  purpose: 'mark',
  line: 'A rough box round a region of a screen or shot, four quick strokes overshooting the corners.',
  fits: 'the row or field of a screen recording that matters; a label',
  params: {
    x: {type: 'px', doc: 'the left of the region, in the part\'s box'},
    y: {type: 'px', doc: 'the top of the region'},
    w: {type: 'px', doc: 'its width'},
    h: {type: 'px', doc: 'its height'},
    draw: {type: 'progress', default: 0, doc: '0 to 1: top, right, bottom, left; about 0.6 s'},
    seed: {type: 'text', default: 'box', doc: 'another seed is another hand'},
  },
  preview: 12.8,
};

export function Box({x, y, w, h, draw = 0, seed = 'box'}: {x: number; y: number; w: number; h: number; draw?: number; seed?: string}) {
  const r = random(`${seed}:box`), o = () => 10 + r() * 14, j = () => (r() - 0.5) * 10, pad = 14;
  const L = x - pad, T = y - pad, R = x + w + pad, B = y + h + pad;
  const sides: [Pt, Pt][] = [[[L - o(), T + j()], [R + o(), T + j()]], [[R + j(), T - o()], [R + j(), B + o()]], [[R + o(), B + j()], [L - o(), B + j()]], [[L + j(), B + o()], [L + j(), T - o()]]];
  const strokes = sides.map(([a, b], i) => wobble(curve(a, b, (r() - 0.5) * 0.03, 20), `${seed}:${i}`, 2));
  return <MarkerStroke strokes={strokes} draw={draw} seed={seed} />;
}
