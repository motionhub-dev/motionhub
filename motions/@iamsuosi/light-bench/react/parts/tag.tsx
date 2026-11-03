import {toScreen, type View} from './bench.tsx';

export const meta = {
  name: {en: 'Bench label', 'zh-CN': '平台标注'},
  purpose: 'term',
  line: "A dot on a point in the 3D scene that stays on it as the camera moves, a hairline to a thin rule, and the name in white with a figure in mono under it.",
  fits: "naming an element or a beam on the word it is said",
  params: {
    view: {type: 'View', doc: "the bench's camera, the same object"},
    on: {type: '[x, y, z]', doc: 'the point named, in table units'},
    at: {type: '[x, y]', doc: 'the left end of the rule, in px: put it to one side of the point, so the line never crosses the words'},
    width: {type: 'number', default: 300, doc: 'the rule, in px'},
    text: {type: 'string', doc: 'the name'},
    note: {type: 'string', doc: 'a figure or a line under the rule'},
    color: {type: 'string', default: "'#FFFFFF'", doc: 'its colour: the colour of the light it names'},
    t: {type: 'progress', default: 1, doc: 'the line draws, then the words arrive; tween it to 0 before moving on'},
  },
  preview: 8.6,
};

const clamp = (v: number) => Math.min(1, Math.max(0, v));

export function Tag({view, on, at, width = 300, text, note, color = '#FFFFFF', t = 1}: {view: View; on: [number, number, number]; at: [number, number]; width?: number; text: string; note?: string; color?: string; t?: number}) {
  if (t <= 0) return null;
  const [x, y] = toScreen(view, on), a = clamp(t * 1.8), words = clamp((t - 0.45) / 0.55), near = x > at[0] + width ? at[0] + width : at[0];
  const ex = x + (near - x) * a, ey = y + (at[1] - y) * a;
  return (
    <>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <path d={`M${x} ${y}L${ex} ${ey}${a >= 1 ? `M${at[0]} ${at[1]}H${at[0] + width}` : ''}`} fill="none" stroke={color} strokeWidth={2} />
        <circle cx={x} cy={y} r={7} fill="#050608" stroke={color} strokeWidth={2.5} />
      </svg>
      <div style={{position: 'absolute', left: at[0], width, top: at[1] - 54, opacity: words, fontFamily: 'var(--font-sans)', fontSize: 40, fontWeight: 700, lineHeight: '50px', color, whiteSpace: 'nowrap'}}>{text}</div>
      {note && <div style={{position: 'absolute', left: at[0], width, top: at[1] + 8, paddingLeft: 16, boxSizing: 'border-box', opacity: words, fontFamily: 'var(--font-mono)', fontSize: 28, lineHeight: '36px', color: '#B9C2CE', whiteSpace: 'nowrap'}}>{note}</div>}
    </>
  );
}
