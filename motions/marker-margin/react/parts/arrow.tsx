import {MarkerStroke} from './loop.tsx';
import {Writing} from './note.tsx';
import {curve, stage, wobble, type Pt} from './marker.ts';

export const meta = {
  name: {en: 'Arrow', 'zh-CN': '箭头'},
  purpose: 'link',
  line: 'A word scribbled in a free corner, then an arrow flicked from it to the thing; as a wave, a signal between two.',
  fits: 'a part they point at; the link across a split screen',
  params: {
    text: {type: 'text', default: '', doc: 'the word the arrow leaves from; empty for an arrow alone'},
    at: {type: 'point', default: [0, 0], doc: '[x, y]: the top left of the word'},
    from: {type: 'point', doc: '[x, y]: where the arrow leaves (beside the word)'},
    to: {type: 'point', doc: '[x, y]: where its tip lands, just short of the thing'},
    bow: {type: 'number', default: 0.18, doc: 'how much the arrow bends, a share of its length; negative bends the other way'},
    kind: {type: 'arrow | wave', default: 'arrow', doc: 'a plain arrow, or a wave for a signal'},
    heads: {type: 'number', default: 1, doc: '1, or 2 for a head at each end'},
    draw: {type: 'progress', default: 0, doc: '0 to 1: the word is written, then the arrow runs out and its head is flicked on; about 1 s with a word, 0.45 s without'},
    size: {type: 'px', default: 60, doc: 'the word\'s size'},
    seed: {type: 'text', default: 'arrow', doc: 'another seed is another hand'},
  },
  preview: 7.9,
};

/** Two barbs flicked back from the tip, as one stroke: left barb, tip, right barb */
function head(tip: Pt, prev: Pt, len: number): Pt[] {
  const a = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]), spread = 0.5;
  const barb = (s: number): Pt => [tip[0] - len * Math.cos(a + s * spread), tip[1] - len * Math.sin(a + s * spread)];
  return [barb(1), tip, barb(-1.15)];
}

/** A wave laid along a path: a signal drawn by a hand that goes up and down as it moves */
function wave(path: Pt[], amp: number, length: number): Pt[] {
  let run = 0;
  return path.map(([x, y], i) => {
    if (i) run += Math.hypot(x - path[i - 1][0], y - path[i - 1][1]);
    const prev = path[Math.max(0, i - 1)], next = path[Math.min(path.length - 1, i + 1)];
    const dx = next[0] - prev[0], dy = next[1] - prev[1], n = Math.hypot(dx, dy) || 1;
    const fade = Math.min(1, i / 6, (path.length - 1 - i) / 6), off = amp * fade * Math.sin((run / length) * Math.PI * 2);
    return [x - (dy / n) * off, y + (dx / n) * off];
  });
}

export function Arrow({text = '', at = [0, 0], from, to, bow = 0.18, kind = 'arrow', heads = 1, draw = 0, size = 60, seed = 'arrow'}: {text?: string; at?: [number, number]; from: Pt; to: Pt; bow?: number; kind?: string; heads?: number; draw?: number; size?: number; seed?: string}) {
  const split = text ? 0.5 : 0;
  const write = stage(draw, 0, Math.max(0.01, split)), run = stage(draw, split, 1);
  const shaft = curve(from, to, bow, kind === 'wave' ? 120 : 36);
  const line = kind === 'wave' ? wave(shaft, 13, 54) : wobble(shaft, seed, 2.5);
  const tipLen = Math.max(26, size * 0.48), n = line.length;
  const strokes = [line, head(line[n - 1], line[n - 5], tipLen)];
  if (heads > 1) strokes.push(head(line[0], line[4], tipLen));
  return (
    <div style={{position: 'absolute', inset: 0}}>
      {text && <div style={{position: 'absolute', left: at[0], top: at[1]}}><Writing text={text} write={write} size={size} seed={seed} /></div>}
      <MarkerStroke strokes={strokes} draw={run} seed={seed} weight={kind === 'wave' ? 7 : 9} />
    </div>
  );
}
