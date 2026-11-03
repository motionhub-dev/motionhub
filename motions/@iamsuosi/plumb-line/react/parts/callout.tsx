import {C, CANVAS, DISPLAY, MONO, SANS, clamp, smooth, yOf, type Cam} from './plumb.ts';

export const meta = {
  name: {en: 'Card label', 'zh-CN': '卡片标注'},
  purpose: 'term',
  line: "A small piece of the same cream card, tied by a thin line to a point at its true depth, with a name, a note and where the figure comes from.",
  fits: "naming what is at a level, or the one number that belongs to it",
  params: {
    cam: {type: '{at, scale}', doc: "the scene's camera"},
    x: {type: 'number', doc: 'the point it names, in px across'},
    depth: {type: 'number', doc: 'the point it names, on the axis'},
    at: {type: '[x, y]', doc: 'the top left of the card, in px'},
    width: {type: 'number', default: 400, doc: 'the width of the card in px: wide enough for its longest line, so the leader meets its edge'},
    text: {type: 'string', doc: 'the name'},
    note: {type: 'string', doc: 'one line under it'},
    source: {type: 'string', doc: 'where the figure comes from'},
    t: {type: 'progress', default: 1, doc: 'the line draws, then the card arrives; tween it to 0 before moving on'},
  },
  preview: 22,
};

export function Callout({cam, x, depth, at, width = 400, text, note, source, t = 1}: {cam: Cam; x: number; depth: number; at: [number, number]; width?: number; text: string; note?: string; source?: string; t?: number}) {
  if (t <= 0) return null;
  const y = yOf(cam, depth), a = smooth(t * 1.8), card = clamp((t - 0.4) / 0.6), near = x > at[0] + width ? at[0] + width : x < at[0] ? at[0] : x, ex = x + (near - x) * a, ey = y + (at[1] + 30 - y) * a;
  return (
    <>
      <svg {...CANVAS}>
        <path d={`M${x} ${y}L${ex} ${ey}`} stroke={C.card} strokeWidth={3} />
        <circle cx={x} cy={y} r={8} fill={C.card} stroke={C.ink} strokeWidth={2.5} />
      </svg>
      <div style={{position: 'absolute', left: at[0], top: at[1], width, boxSizing: 'border-box', padding: '12px 22px 14px', background: C.card, borderRadius: 6, boxShadow: '0 6px 12px rgba(4, 12, 30, 0.4)', opacity: card, transform: `translateY(${(1 - card) * 8}px)`, whiteSpace: 'nowrap'}}>
        <div style={{fontFamily: DISPLAY, fontSize: 38, fontWeight: 700, lineHeight: '46px', color: C.ink}}>{text}</div>
        {note && <div style={{fontFamily: SANS, fontSize: 28, lineHeight: '36px', color: C.read}}>{note}</div>}
        {source && <div style={{fontFamily: MONO, fontSize: 28, lineHeight: '36px', color: C.read}}>{source}</div>}
      </div>
    </>
  );
}
