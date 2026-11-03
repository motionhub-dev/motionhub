import {MarkerStroke} from './loop.tsx';
import {Writing} from './note.tsx';
import {curve, stage, wobble, type Pt} from './marker.ts';

export const meta = {
  name: {en: 'Span', 'zh-CN': '量一段'},
  purpose: 'data',
  line: 'A bracket from one point of the shot to another, ticked at both ends, how long or how far written beside it.',
  fits: 'horizon to horizon; the length of a cable; a stretch of a timeline',
  params: {
    from: {type: 'point', doc: '[x, y]: where it starts'},
    to: {type: 'point', doc: '[x, y]: where it ends'},
    bow: {type: 'number', default: 0.1, doc: 'how much it bends, a share of its length; follow the edge it measures'},
    label: {type: 'text', default: '', doc: 'how long or how far, a few words'},
    at: {type: 'point', default: [0, 0], doc: '[x, y]: the top left of the label'},
    draw: {type: 'progress', default: 0, doc: '0 to 1: the first tick, the run, the last tick, then the label; about 1.2 s'},
    seed: {type: 'text', default: 'span', doc: 'another seed is another hand'},
  },
  preview: 31.6,
};

function tick(p: Pt, q: Pt, len: number): Pt[] {
  const a = Math.atan2(q[1] - p[1], q[0] - p[0]) + Math.PI / 2;
  return [[p[0] - Math.cos(a) * len, p[1] - Math.sin(a) * len], [p[0] + Math.cos(a) * len, p[1] + Math.sin(a) * len]];
}

export function Span({from, to, bow = 0.1, label = '', at = [0, 0], draw = 0, seed = 'span'}: {from: Pt; to: Pt; bow?: number; label?: string; at?: [number, number]; draw?: number; seed?: string}) {
  const run = wobble(curve(from, to, bow, 48), seed, 3), n = run.length;
  const strokes = [tick(run[0], run[2], 26), run, tick(run[n - 1], run[n - 3], 26)];
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <MarkerStroke strokes={strokes} draw={stage(draw, 0, label ? 0.65 : 1)} seed={seed} />
      {label && <div style={{position: 'absolute', left: at[0], top: at[1]}}><Writing text={label} write={stage(draw, 0.6, 1)} size={64} seed={seed} /></div>}
    </div>
  );
}
