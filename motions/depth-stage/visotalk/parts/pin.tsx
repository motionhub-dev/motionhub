import {hazed, unit, useLook} from './stage.tsx';

export const meta = {
  name: {en: 'Depth pin', 'zh-CN': '景深标注'},
  purpose: 'mark',
  line: 'A ring on a place and a hairline rising to its name, on that place\'s plane: sharp only while the focus is there.',
  fits: 'a forum, a summit, a crater, a house',
  params: {
    x: {type: 'px', default: 960, doc: 'the place pinned, across, at rest'},
    y: {type: 'px', default: 600, doc: 'the place pinned, down, at rest'},
    label: {type: 'text', doc: 'its name, a word or two'},
    note: {type: 'text', default: '', doc: 'a short line under the name'},
    rise: {type: 'px', default: 150, doc: 'how far the hairline rises above the place'},
    side: {type: 'text', default: 'right', doc: 'which side of the hairline the name reads from: right or left'},
    draw: {type: 'progress', default: 1, doc: '0 nothing, 0.5 the ring and the hairline, 1 the name too'},
  },
  preview: 13.8,
};

export function Pin({x = 960, y = 600, label, note = '', rise = 150, side = 'right', draw = 1}: {
  x?: number; y?: number; label: string; note?: string; rise?: number; side?: string; draw?: number;
}) {
  const {fog} = useLook();
  const d = unit(draw), stroke = unit(d * 2), words = unit(d * 2 - 1);
  const left = side === 'left';
  const ink = hazed('var(--vt-text)', fog * 0.5);
  return (
    <>
      <svg width={40} height={rise + 30} viewBox={`-20 ${-rise - 10} 40 ${rise + 30}`} style={{position: 'absolute', left: x - 20, top: y - rise - 10, overflow: 'visible'}}>
        <circle r={9} fill="none" stroke={hazed('var(--vt-data)', fog * 0.4)} strokeWidth={2.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - stroke} />
        <circle r={3} fill={hazed('var(--vt-data)', fog * 0.4)} opacity={stroke} />
        <line x1={0} y1={-14} x2={0} y2={-14 - (rise - 14) * stroke} stroke={ink} strokeWidth={1.5} opacity={0.85} />
      </svg>
      <div style={{position: 'absolute', top: y - rise - 6, width: 560, opacity: words, textAlign: left ? 'right' : 'left',
        ...(left ? {left: x - 14 - 560} : {left: x + 14}), filter: words < 0.99 ? `blur(${((1 - words) * 8).toFixed(1)}px)` : 'none'}}>
        <div style={{fontFamily: 'var(--vt-sans)', fontSize: 30, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: ink, lineHeight: 1.1}}>{label}</div>
        {note && <div style={{fontFamily: 'var(--vt-display)', fontStyle: 'italic', fontSize: 34, color: hazed('color-mix(in oklab, var(--vt-text), var(--vt-muted) 40%)', fog * 0.5), marginTop: 6, lineHeight: 1.15}}>{note}</div>}
      </div>
    </>
  );
}
