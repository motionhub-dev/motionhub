import {Underline, Writing} from './note.tsx';
import {stage} from './marker.ts';

export const meta = {
  name: {en: 'Figure', 'zh-CN': '手写数字'},
  purpose: 'data',
  line: 'A number written large where the shot has room, its unit in marker, double-underlined as it lands.',
  fits: 'a speed, a price or a size said to camera',
  params: {
    value: {type: 'text', doc: 'the figure as said, with its separators: 17,500'},
    unit: {type: 'text', default: '', doc: 'its unit, short: mph, GB, min'},
    note: {type: 'text', default: '', doc: 'a few words under it, smaller'},
    write: {type: 'progress', default: 0, doc: '0 to 1: the figure, then its unit, then the note are written; about 1 s'},
    under: {type: 'progress', default: 0, doc: '0 to 1: the double underline; tween it as the figure lands'},
    size: {type: 'px', default: 150, doc: 'the figure\'s size'},
    seed: {type: 'text', default: 'figure', doc: 'another seed is another hand'},
  },
  preview: 24.0,
};

export function Figure({value, unit = '', note = '', write = 0, under = 0, size = 150, seed = 'figure'}: {value: string; unit?: string; note?: string; write?: number; under?: number; size?: number; seed?: string}) {
  const big = stage(write, 0, 0.6), small = stage(write, 0.5, 0.8), aside = stage(write, 0.75, 1);
  return (
    <div style={{position: 'absolute', left: size * 0.12, top: size * 0.3, transform: 'rotate(-3deg)', transformOrigin: 'left bottom'}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: size * 0.12}}>
        <div style={{position: 'relative', display: 'inline-block'}}>
          <Writing text={value} write={big} size={size} seed={seed} />
          <Underline draw={under} weight={Math.max(9, size * 0.075)} double seed={seed} />
        </div>
        {unit && <Writing text={unit} write={small} size={size * 0.46} ink="marker" seed={`${seed}:unit`} />}
      </div>
      {note && <div style={{marginTop: size * 0.12}}><Writing text={note} write={aside} size={size * 0.3} seed={`${seed}:note`} /></div>}
    </div>
  );
}
