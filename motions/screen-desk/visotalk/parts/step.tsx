import {useZoom} from './desk.tsx';

export const meta = {
  name: {en: 'Step pin', 'zh-CN': '步骤钉'},
  purpose: 'steps',
  line: 'A blue capsule pinned to a point by a short leader: the step\'s number in a white disc, then its words.',
  fits: 'the steps of a how-to, one pin per step on its control, numbered through the film',
  params: {
    x: {type: 'px', doc: 'the point it is pinned to, across, in desk pixels (a ring\'s corner or edge)'},
    y: {type: 'px', doc: 'the point it is pinned to, down'},
    n: {type: 'number', doc: 'the step\'s number'},
    label: {type: 'text', default: '', doc: 'two to four words: what the step does'},
    side: {type: 'text', default: 'right', doc: 'where the capsule sits from the point: right, left, up or down'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the leader grows, the capsule lands, its words slide in'},
  },
  preview: 14.4,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));
const backOut = (t: number) => { const c = 1.9; const u = t - 1; return 1 + (c + 1) * u * u * u + c * u * u; };

const LEADER = 40;   // screen pixels between the point and the capsule
const H = 66;        // the capsule's height
const DISC = 50;     // the white disc that holds the number

export function Step({x, y, n, label = '', side = 'right', show = 1}: {x: number; y: number; n: number; label?: string; side?: string; show?: number}) {
  const z = useZoom();
  const s = unit(show);
  if (s <= 0.001) return null;
  const lead = unit(s / 0.25);
  const pop = backOut(unit((s - 0.15) / 0.4));
  const text = unit((s - 0.35) / 0.35);
  const dir = side === 'left' ? [-1, 0] : side === 'up' ? [0, -1] : side === 'down' ? [0, 1] : [1, 0];
  // the capsule hangs off the end of the leader: its near end on the leader for left and right, its middle for up and down
  const end = [dir[0] * LEADER, dir[1] * LEADER];
  const place = side === 'left' ? {right: -end[0], top: end[1] - H / 2, transformOrigin: 'right center'}
    : side === 'up' ? {left: end[0] - H / 2, bottom: -end[1], transformOrigin: `${H / 2}px bottom`}
    : side === 'down' ? {left: end[0] - H / 2, top: end[1], transformOrigin: `${H / 2}px top`}
    : {left: end[0], top: end[1] - H / 2, transformOrigin: 'left center'};
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, transform: `scale(${(1 / z).toFixed(4)})`, transformOrigin: '0 0', pointerEvents: 'none'}}>
      <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <circle cx={0} cy={0} r={6} fill="var(--vt-data)" stroke="#fff" strokeWidth={2.5} opacity={lead} />
        <line x1={0} y1={0} x2={end[0] * lead} y2={end[1] * lead} stroke="var(--vt-data)" strokeWidth={3} strokeLinecap="round" />
      </svg>
      <div style={{position: 'absolute', ...place, height: H, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', boxSizing: 'border-box',
        padding: label ? `0 24px 0 ${(H - DISC) / 2}px` : (H - DISC) / 2, borderRadius: H / 2, background: 'var(--vt-data)',
        boxShadow: '0 14px 28px -12px rgba(47, 91, 255, 0.65), 0 0 0 3px rgba(255, 255, 255, 0.9)', transform: `scale(${pop.toFixed(3)})`}}>
        <div style={{width: DISC, height: DISC, borderRadius: DISC / 2, background: '#fff', color: 'var(--vt-data)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--vt-sans)', fontWeight: 700, fontSize: 32, lineHeight: 1}}>{n}</div>
        {label && <div style={{marginLeft: 14, fontFamily: 'var(--vt-sans)', fontSize: 34, fontWeight: 700, color: '#fff', opacity: text, transform: `translateX(${(-10 * (1 - text)).toFixed(1)}px)`}}>{label}</div>}
      </div>
    </div>
  );
}
