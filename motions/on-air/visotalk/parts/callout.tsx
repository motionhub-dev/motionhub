import {stage, tag, unit} from './ink.ts';

export const meta = {
  name: {en: 'Callout', 'zh-CN': '圈注'},
  purpose: 'mark',
  line: 'A ring drawn around something in the shot, a leader out to a short label.',
  fits: 'a sticker, a port or a button on the product in hand; a sign they mention',
  params: {
    at: {type: 'point', doc: '[x, y] in the part\'s box: the centre of the thing'},
    to: {type: 'point', doc: '[x, y] in the part\'s box: where the label starts'},
    r: {type: 'px', default: 70, doc: 'the ring\'s radius'},
    label: {type: 'text', doc: 'what it is, a few words'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: the ring draws, then the leader, then the label opens'},
  },
  preview: 9.0,
};

export function Callout({at, to, r = 70, label, draw = 1}: {at: [number, number]; to: [number, number]; r?: number; label: string; draw?: number}) {
  const ring = stage(draw, 0, 0.45), lead = stage(draw, 0.4, 0.7), open = stage(draw, 0.65, 1);
  const circ = 2 * Math.PI * r;
  // the leader leaves the ring's edge, toward the label
  const dx = to[0] - at[0], dy = to[1] - at[1], d = Math.hypot(dx, dy) || 1;
  const sx = at[0] + (dx / d) * r, sy = at[1] + (dy / d) * r;
  const ex = sx + (to[0] - sx) * lead, ey = sy + (to[1] - sy) * lead;
  const right = dx >= 0;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <circle cx={at[0]} cy={at[1]} r={r} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={11} strokeDasharray={circ} strokeDashoffset={circ * (1 - ring)} transform={`rotate(-90 ${at[0]} ${at[1]})`} />
        <circle cx={at[0]} cy={at[1]} r={r} fill="none" stroke="var(--vt-data)" strokeWidth={5} strokeDasharray={circ} strokeDashoffset={circ * (1 - ring)} transform={`rotate(-90 ${at[0]} ${at[1]})`} />
        {lead > 0 && <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="var(--vt-data)" strokeWidth={4} strokeLinecap="round" />}
      </svg>
      <div style={{...tag, position: 'absolute', top: to[1] - 34, ...(right ? {left: to[0]} : {right: `calc(100% - ${to[0]}px)`}), padding: '12px 22px', whiteSpace: 'nowrap',
        fontFamily: 'var(--vt-sans)', fontSize: 38, fontWeight: 700, color: 'var(--vt-text)', opacity: unit(open * 1.5), transform: `scale(${0.92 + 0.08 * open})`, transformOrigin: right ? 'left center' : 'right center'}}>{label}</div>
    </div>
  );
}
