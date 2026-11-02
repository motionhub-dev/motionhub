import {PEN, unit} from './pens.ts';

export const meta = {
  name: {en: 'Working', 'zh-CN': '推导'},
  purpose: 'steps',
  line: 'Lines of working written one after another by hand, the last one boxed in red as the result.',
  fits: 'a short derivation; a definition then a value; a comparison reduced to one inequality',
  params: {
    lines: {type: 'text[]', doc: 'the lines, short; the last is the result'},
    write: {type: 'number', default: 99, doc: 'how many lines are written so far, with fractions mid-line: tween 0 to 1, then to 2, on each line\'s word'},
    size: {type: 'px', default: 52, doc: 'the hand\'s size'},
    box: {type: 'progress', default: 0, doc: '0 to 1: how much of the box around the result is drawn'},
  },
  preview: 23,
};

/** The red box round the result, drawn side by side as a pen goes round it: top, right, bottom, left; it fits whatever the line's width is */
function Box({progress}: {progress: number}) {
  const side = (i: number) => unit(progress * 4 - i);
  const pen = {position: 'absolute' as const, background: PEN.red, borderRadius: 2};
  return (
    <div style={{position: 'absolute', inset: '-4px -2px -2px -4px', transform: 'rotate(-0.6deg)'}}>
      <div style={{...pen, left: 0, top: 0, height: 4, width: '100%', transformOrigin: 'left', transform: `scaleX(${side(0)})`}} />
      <div style={{...pen, right: 0, top: 0, width: 4, height: '100%', transformOrigin: 'top', transform: `scaleY(${side(1)})`}} />
      <div style={{...pen, right: 0, bottom: 0, height: 4, width: '100%', transformOrigin: 'right', transform: `scaleX(${side(2)})`}} />
      <div style={{...pen, left: 0, bottom: 0, width: 4, height: '100%', transformOrigin: 'bottom', transform: `scaleY(${side(3)})`}} />
    </div>
  );
}

export function Formula({lines, write = 99, size = 52, box = 0}: {lines: string[]; write?: number; size?: number; box?: number}) {
  return (
    <div style={{fontFamily: 'var(--vt-display)', fontSize: size, lineHeight: 1.5, fontWeight: 500}}>
      {lines.map((text, i) => {
        const last = i === lines.length - 1, shown = unit(write - i);
        return (
          <div key={i} style={{position: 'relative', display: 'table', marginTop: last ? size * 0.35 : 0, padding: last ? '0 18px' : 0, color: last ? PEN.red : PEN.ink}}>
            <span style={{display: 'inline-block', whiteSpace: 'nowrap', clipPath: `inset(-25% ${((1 - shown) * 100).toFixed(1)}% -25% -4%)`}}>{text}</span>
            {last && box > 0 && <Box progress={box} />}
          </div>
        );
      })}
    </div>
  );
}
