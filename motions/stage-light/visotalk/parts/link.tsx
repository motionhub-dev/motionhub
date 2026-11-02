import {unit} from './light.ts';

export const meta = {
  name: {en: 'Link', 'zh-CN': '连线'},
  purpose: 'link',
  line: 'A hairline from one thing to another with a bright point running along it, and an optional word at its middle.',
  fits: 'from then to now; a cause to its effect; money or data moving between two plates',
  params: {
    from: {type: '[x, y]', doc: 'where it starts, in px inside the box'},
    to: {type: '[x, y]', doc: 'where it ends'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: how far the line has run; the point rides its front'},
    label: {type: 'text', default: '', doc: 'a word at its middle'},
  },
  preview: 8.6,
};

export function Link({from, to, draw = 1, label = ''}: {from: [number, number]; to: [number, number]; draw?: number; label?: string}) {
  const d = unit(draw), x = from[0] + (to[0] - from[0]) * d, y = from[1] + (to[1] - from[1]) * d;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      <line x1={from[0]} y1={from[1]} x2={x} y2={y} stroke="var(--vt-muted)" strokeWidth={2} />
      {d > 0 && d < 1 && <circle cx={x} cy={y} r={7} fill="var(--vt-data)" />}
      {d >= 1 && <circle cx={to[0]} cy={to[1]} r={6} fill="var(--vt-data)" />}
      {label && d >= 1 && <text x={(from[0] + to[0]) / 2} y={(from[1] + to[1]) / 2 - 18} textAnchor="middle" fill="var(--vt-muted)" fontSize={28} fontFamily="var(--vt-sans)" letterSpacing="0.08em">{label}</text>}
    </svg>
  );
}
