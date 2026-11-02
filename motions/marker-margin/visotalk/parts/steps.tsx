import {MarkerStroke} from './loop.tsx';
import {Writing} from './note.tsx';
import {curve, loop, unit, wobble, type Pt} from './marker.ts';

export const meta = {
  name: {en: 'Steps', 'zh-CN': '步骤'},
  purpose: 'steps',
  line: 'A to-do down a free corner, each number looped as it is reached and ticked when done; it stays across cuts.',
  fits: 'the steps of a set-up, a recipe or a walkthrough',
  params: {
    items: {type: 'text[]', doc: 'two to five steps, three words each at most'},
    shown: {type: 'number', default: 0, doc: 'how many steps are written; a fraction is a step being written, so tween it by one on each step\'s word'},
    done: {type: 'number', default: 0, doc: 'how many are ticked; tween it by one when a step is finished'},
    size: {type: 'px', default: 54, doc: 'the letters\' size'},
    seed: {type: 'text', default: 'steps', doc: 'another seed is another hand'},
  },
  preview: 50.8,
};

export function Steps({items, shown = 0, done = 0, size = 54, seed = 'steps'}: {items: string[]; shown?: number; done?: number; size?: number; seed?: string}) {
  const row = size * 1.55, num = size * 1.05;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      {items.map((text, i) => {
        const w = unit(shown - i), t = unit(done - i);
        if (w <= 0) return null;
        const cy = size * 0.55, cx = num * 0.42;
        const ring: Pt[] = wobble(loop(cx, cy, size * 0.48, size * 0.46, `${seed}:${i}`, 1.1, 0), `${seed}:${i}`, 2);
        const tickPts: Pt[] = [...curve([0, size * 0.5], [size * 0.32, size * 0.85], 0.05, 6), ...curve([size * 0.32, size * 0.85], [size * 0.95, 0], -0.08, 10).slice(1)];
        return (
          <div key={i} style={{position: 'absolute', left: size * 1.25, top: i * row, width: '100%', height: row}}>
            <MarkerStroke strokes={[ring]} draw={unit(w * 2.2)} weight={6} seed={`${seed}:${i}`} />
            <div style={{position: 'absolute', left: cx - size * 0.2, top: 0}}><Writing text={`${i + 1}`} write={unit(w * 3 - 0.3)} size={size} seed={`${seed}:n${i}`} /></div>
            <div style={{position: 'absolute', left: num + size * 0.35, top: 0, opacity: 1 - 0.15 * t}}><Writing text={text} write={unit(w * 1.4 - 0.25)} size={size} seed={`${seed}:t${i}`} /></div>
            {t > 0 && <div style={{position: 'absolute', left: -size * 1.2, top: size * 0.05, width: size, height: size}}>
              <MarkerStroke strokes={[wobble(tickPts, `${seed}:k${i}`, 1.5)]} draw={t} weight={9} seed={`${seed}:k${i}`} />
            </div>}
          </div>
        );
      })}
    </div>
  );
}
