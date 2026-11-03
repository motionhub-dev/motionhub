import {C, CANVAS, DISPLAY, EDGE, MONO, clamp, group, yOf, type Cam} from './plumb.ts';

export const meta = {
  name: {en: 'Plumb bob', 'zh-CN': '铅垂'},
  purpose: 'mark',
  line: "A brass weight on a line let down from the top of the frame, carrying a card with how far it has gone, the figure running as it drops.",
  fits: "every descent or climb: the one thing the viewer follows",
  params: {
    cam: {type: '{at, scale}', doc: "the scene's camera"},
    d: {type: 'number', default: 0, doc: 'how far it has gone: tween it, and the figure runs with it'},
    unit: {type: 'string', default: "' m'", doc: 'after the figure'},
    round: {type: 'number', default: 10, doc: 'the figure is shown to the nearest this'},
    sub: {type: 'string', doc: 'a second reading under the figure'},
  },
  preview: 15.5,
};

export function Bob({cam, d = 0, unit = ' m', round = 10, sub}: {cam: Cam; d?: number; unit?: string; round?: number; sub?: string}) {
  const y = clamp(yOf(cam, d), 60, 800), x = EDGE - 34;
  return (
    <>
      <svg {...CANVAS}>
        <path d={`M${x} 0V${y}`} stroke={C.card} strokeWidth={3} />
        <path d={`M${x} ${y - 4}C${x - 24} ${y + 14} ${x - 12} ${y + 40} ${x} ${y + 64}C${x + 12} ${y + 40} ${x + 24} ${y + 14} ${x} ${y - 4}Z`} fill={C.brass} stroke={C.ink} strokeWidth={2.5} />
      </svg>
      <div style={{position: 'absolute', right: 1920 - x + 40, top: y - 24, padding: '8px 22px 10px', background: C.card, borderRadius: 6, boxShadow: '0 6px 12px rgba(4, 12, 30, 0.4)', textAlign: 'right', whiteSpace: 'nowrap'}}>
        <div style={{fontFamily: DISPLAY, fontSize: 58, fontWeight: 800, lineHeight: '66px', color: C.ink, fontVariantNumeric: 'tabular-nums'}}>{group(Math.round(d / round) * round)}{unit}</div>
        {sub && <div style={{fontFamily: MONO, fontSize: 28, lineHeight: '36px', color: C.read}}>{sub}</div>}
      </div>
    </>
  );
}
