import {C, CANVAS, SANS, clamp, glide, type Pt} from './night.ts';

export const meta = {
  name: {en: 'Pin label', 'zh-CN': '引线标注'},
  purpose: 'term',
  line: "A dot on the thing named, a hairline with one elbow out to clear space, the name on the rule and a note under it.",
  fits: "naming a part on the word it is said",
  params: {
    at: {type: '[x, y]', doc: 'the point on the thing named'},
    elbow: {type: '[x, y]', doc: 'where the line turns; its y is the height of the rule'},
    to: {type: 'number', doc: 'x where the rule ends; the words sit on it, on whichever side is the far one'},
    text: {type: 'string', doc: 'the name, short'},
    note: {type: 'string', doc: 'one short line under the rule'},
    color: {type: 'string', doc: 'ember or ice when it names one of two opposed things, white otherwise'},
    t: {type: 'progress', default: 1, doc: 'the line draws, then the words arrive: about 0.6 s'},
  },
  preview: 14.5,
};

export function Pin({at, elbow, to, text, note, color = C.ink, t = 1}: {at: Pt; elbow: Pt; to: number; text: string; note?: string; color?: string; t?: number}) {
  const line = clamp(t / 0.6), words = glide((t - 0.45) / 0.55);
  if (line <= 0) return null;
  const x = Math.min(to, elbow[0]);
  return (
    <svg {...CANVAS}>
      <path d={`M${at[0]} ${at[1]}L${elbow[0]} ${elbow[1]}H${to}`} fill="none" stroke={color} strokeWidth={2.5} pathLength={1} strokeDasharray={`${line} 1`} />
      <circle cx={at[0]} cy={at[1]} r={7} fill={color} />
      <g fontFamily={SANS} fill={color} opacity={words} transform={`translate(${(1 - words) * 16} 0)`}>
        <text x={x} y={elbow[1] - 14} fontSize={40} fontWeight={700}>{text}</text>
        {note && <text x={x} y={elbow[1] + 38} fontSize={28}>{note}</text>}
      </g>
    </svg>
  );
}
