import {Box} from './formula.tsx';
import {PEN, drawn, fit, unit, written} from './pens.ts';

export const meta = {
  name: {en: 'The takeaway', 'zh-CN': '结论'},
  purpose: 'close',
  line: 'What was worked out, ticked off line by line in pencil, then the one thing to remember written large and boxed in red.',
  fits: 'the last seconds of a film; a summary; the answer to the question the film opened with',
  params: {
    points: {type: 'text[]', default: [], doc: 'up to four short lines, each ticked as it is written'},
    result: {type: 'text', doc: 'the one thing to remember'},
    write: {type: 'number', default: 99, doc: 'how many lines are written, the result being the last, with fractions mid-line; tween it on the words'},
    box: {type: 'progress', default: 0, doc: '0 to 1: how much of the red box is drawn'},
    width: {type: 'px', default: 1300, doc: 'the widest a line may be'},
    size: {type: 'px', default: 92, doc: 'the result\'s size; a long one writes smaller'},
  },
  preview: 29.9,
};

export function Takeaway({points = [], result, write = 99, box = 0, width = 1300, size = 92}: {points?: string[]; result: string; write?: number; box?: number; width?: number; size?: number}) {
  const big = fit(result, width - 40, size);
  return (
    <div style={{width, fontFamily: 'var(--font-display)', fontWeight: 500}}>
      {points.map((text, i) => {
        const p = unit(write - i);
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 22, height: 74}}>
            <svg width={36} height={36} style={{flex: 'none', overflow: 'visible'}}><path d="M2 20 L14 33 L34 3" fill="none" stroke={PEN.pencil} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" {...drawn(p / 0.25)} /></svg>
            <div style={{fontSize: fit(text, width - 60, 46), color: PEN.pencil, whiteSpace: 'nowrap', ...written((p - 0.2) / 0.8)}}>{text}</div>
          </div>
        );
      })}
      <div style={{position: 'relative', display: 'table', marginTop: points.length ? 36 : 0, padding: '8px 20px'}}>
        <div style={{fontSize: big, lineHeight: 1.2, fontWeight: 600, color: PEN.red, whiteSpace: 'nowrap', ...written(write - points.length)}}>{result}</div>
        {box > 0 && <Box progress={box} />}
      </div>
    </div>
  );
}
