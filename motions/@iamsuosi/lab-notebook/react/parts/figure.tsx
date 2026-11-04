import {Box} from './formula.tsx';
import {PEN, ems, fit, unit, written, type Pen} from './pens.ts';

export const meta = {
  name: {en: 'Written figure', 'zh-CN': '手写数字'},
  purpose: 'data',
  line: 'One number written large by hand, its unit beside it and what it counts pencilled underneath; boxed in red when it is the result.',
  fits: 'the one number to remember; a size, a price, a date, a share; the answer a scene arrives at',
  params: {
    value: {type: 'text', doc: 'the number as it is written: 8%, $4.60, 1450'},
    unit: {type: 'text', default: '', doc: 'written smaller, after it'},
    note: {type: 'text', default: '', doc: 'what it counts, a few words, in pencil underneath'},
    write: {type: 'progress', default: 1, doc: '0 to 1: the number, then its note'},
    box: {type: 'progress', default: 0, doc: '0 to 1: how much of a red box around it is drawn; give it to the scene\'s result only, written with pen="red"'},
    size: {type: 'px', default: 170, doc: 'the number\'s size'},
    width: {type: 'px', default: 760, doc: 'the widest it may be; a long number writes smaller'},
    pen: {type: 'ink | red', default: 'ink', doc: 'which pen writes the number'},
  },
  preview: 21.6,
};

export function Figure({value, unit: of = '', note = '', write = 1, box = 0, size = 170, width = 760, pen = 'ink'}: {value: string; unit?: string; note?: string; write?: number; box?: number; size?: number; width?: number; pen?: Pen}) {
  const big = Math.min(size, (width - 48) / (ems(value) + (of ? ems(of) * 0.4 + 0.12 : 0) || 1)), ink = PEN[pen];
  return (
    <div style={{display: 'inline-block', maxWidth: width, fontFamily: 'var(--font-display)'}}>
      <div style={{position: 'relative', display: 'table', padding: '4px 22px 10px'}}>
        <div style={{fontSize: big, lineHeight: 1.1, fontWeight: 600, color: ink, whiteSpace: 'nowrap', ...written(unit(write / 0.75))}}>
          {value}{of && <span style={{fontSize: big * 0.4, fontWeight: 500, marginLeft: big * 0.12}}>{of}</span>}
        </div>
        {box > 0 && <Box progress={box} />}
      </div>
      {note && <div style={{marginTop: 12, marginLeft: 22, fontSize: fit(note, width - 22, 42), lineHeight: 1.25, color: PEN.pencil, whiteSpace: 'nowrap', ...written(unit((write - 0.75) / 0.25))}}>{note}</div>}
    </div>
  );
}
