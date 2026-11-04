// The crease pattern: the unfolded sheet with every crease its steps make, in the notation of fold diagrams
// (valley dashed, mountain dash-dot); one step's creases can be drawn on in the accent.
import {useMemo} from 'react';
import {sequence, type ModelDef} from './fold.ts';

export const meta = {
  name: {en: 'Crease pattern', 'zh-CN': '折痕图'},
  purpose: 'compare',
  line: 'The unfolded sheet with its creases: valley dashed, mountain dash-dot; one step drawn on in the accent.',
  fits: 'how much is hidden in one sheet; where a step\'s creases fall once the model is opened; a model\'s plan before it is folded',
  params: {
    model: {type: 'ModelDef', doc: 'the model'},
    width: {type: 'px', doc: 'the drawing\'s width; its height follows the sheet'},
    upTo: {type: 'number', default: 'all', doc: 'show the creases of steps 1 to upTo'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: how much of the shown creases is drawn, step after step'},
    highlight: {type: 'number', default: 'none', doc: 'a step whose creases are drawn in the accent'},
  },
  preview: 23,
};

export function CreasePattern({model, width, upTo, draw = 1, highlight}: {model: ModelDef; width: number; upTo?: number; draw?: number; highlight?: number}) {
  const {chords} = useMemo(() => sequence(model), [model]);
  const [w, h] = model.sheet, k = width / w, height = h * k;
  const last = upTo ?? model.steps.length;
  const shown = chords.filter((c) => c.step <= last);
  const total = shown.length;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow: 'visible', display: 'block'}}>
      <rect x={0} y={0} width={width} height={height} fill="var(--color-front)" />
      {shown.map((c, i) => {
        const on = Math.max(0, Math.min(1, draw * total - i));
        if (on <= 0) return null;
        const hot = c.step === highlight;
        const [x1, y1, x2, y2] = [c.a[0] * k, height - c.a[1] * k, c.b[0] * k, height - c.b[1] * k];
        const L = Math.hypot(x2 - x1, y2 - y1);
        return (
          <line key={i} x1={x1} y1={y1} x2={x1 + (x2 - x1) * on} y2={y1 + (y2 - y1) * on} stroke={hot ? 'var(--color-now)' : 'var(--color-back)'}
            strokeWidth={hot ? 5 : 3} strokeLinecap="round" opacity={hot ? 1 : 0.75}
            strokeDasharray={c.kind === 'V' ? '12 8' : '24 6 4 6'} data-length={L.toFixed(0)} />
        );
      })}
      <rect x={0} y={0} width={width} height={height} fill="none" stroke="var(--color-ink)" strokeOpacity={0.35} strokeWidth={2} />
    </svg>
  );
}
