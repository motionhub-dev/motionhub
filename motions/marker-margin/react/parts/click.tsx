import {MarkerStroke} from './loop.tsx';
import {curve, loop, stage, wobble, type Pt} from './marker.ts';

export const meta = {
  name: {en: 'Click', 'zh-CN': '点这里'},
  purpose: 'mark',
  line: 'Where the cursor clicks, a small ring and a burst of four strokes, so the step is seen as it happens.',
  fits: 'the button pressed in a walkthrough; a switch flipped on camera',
  params: {
    at: {type: 'point', doc: '[x, y]: where the click lands'},
    r: {type: 'px', default: 34, doc: 'the ring\'s radius'},
    draw: {type: 'progress', default: 0, doc: '0 to 1: the ring, then the burst; tween it on the click, in about 0.4 s'},
    seed: {type: 'text', default: 'click', doc: 'another seed is another hand'},
  },
  preview: 47.9,
};

export function Click({at, r = 34, draw = 0, seed = 'click'}: {at: [number, number]; r?: number; draw?: number; seed?: string}) {
  const [x, y] = at;
  const ring = wobble(loop(x, y, r, r * 0.92, seed, 1.08, 0), seed, 1.5);
  const rays = [-2.4, -1.6, -0.8, 0.1].map((a): Pt[] => curve([x + Math.cos(a) * r * 1.45, y + Math.sin(a) * r * 1.45], [x + Math.cos(a) * r * 2.3, y + Math.sin(a) * r * 2.3], 0, 4));
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <MarkerStroke strokes={[ring]} draw={stage(draw, 0, 0.55)} weight={7} seed={seed} />
      <MarkerStroke strokes={rays} draw={stage(draw, 0.5, 1)} weight={7} seed={`${seed}:rays`} />
    </div>
  );
}
