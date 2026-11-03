import {C, CANVAS, DISPLAY, SANS, clamp, project, smooth, type P3, type Pt, type View} from './earth.ts';

export const meta = {
  name: {en: 'Margin tag', 'zh-CN': '页边标注'},
  purpose: 'term',
  line: "A dot on the thing named that stays on it as the block turns, a thin leader out to the margin, the name set on the rule like a plate's key.",
  fits: "naming a layer or a part on the word it is said",
  params: {
    view: {type: 'View', doc: "the scene's camera"},
    on: {type: '[x, y, z]', doc: "the point named, in the block's units"},
    elbow: {type: '[x, y]', doc: 'where the leader meets the rule, in px'},
    to: {type: 'number', doc: 'where the rule ends, in px: left of the elbow reads from the left'},
    text: {type: 'string', doc: 'the name'},
    note: {type: 'string', doc: 'a line under the rule'},
    color: {type: 'string', doc: "its colour, usually the material's"},
    t: {type: 'progress', default: 1, doc: 'the leader draws, then the words arrive'},
  },
  preview: 22.5,
};

export function Tag({view, on, elbow, to, text, note, color = C.ink, t = 1}: {view: View; on: P3; elbow: Pt; to: number; text: string; note?: string; color?: string; t?: number}) {
  if (t <= 0) return null;
  const [x, y] = project(view)(...on), a = smooth(t * 1.7), words = clamp((t - 0.45) / 0.55), left = to < elbow[0];
  const mx = x + (elbow[0] - x) * a, my = y + (elbow[1] - y) * a, rx = elbow[0] + (to - elbow[0]) * smooth(t * 2 - 0.6);
  const lo = Math.min(elbow[0], to), hi = Math.max(elbow[0], to);
  return (
    <>
      <svg {...CANVAS}>
        <path d={`M${x} ${y}L${mx} ${my}`} fill="none" stroke={C.paper} strokeWidth={6} opacity={0.75} />
        <path d={`M${x} ${y}L${mx} ${my}${a >= 1 ? `L${rx} ${elbow[1]}` : ''}`} fill="none" stroke={color} strokeWidth={2.5} />
        <circle cx={x} cy={y} r={8} fill={color} stroke={C.paper} strokeWidth={2.5} />
      </svg>
      <div style={{position: 'absolute', left: lo, width: hi - lo, top: elbow[1] - 60, textAlign: left ? 'left' : 'right', opacity: words, transform: `translateY(${(1 - words) * 8}px)`, fontFamily: DISPLAY, fontSize: 40, fontWeight: 700, lineHeight: '56px', color, whiteSpace: 'nowrap'}}>{text}</div>
      {note && <div style={{position: 'absolute', left: lo, width: hi - lo, top: elbow[1] + 8, textAlign: left ? 'left' : 'right', opacity: words, fontFamily: SANS, fontSize: 28, lineHeight: '36px', color: C.read, whiteSpace: 'nowrap'}}>{note}</div>}
    </>
  );
}
