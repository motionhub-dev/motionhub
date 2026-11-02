import {LINE, ease, lettering, phase, typed} from './draft.ts';

export const meta = {
  name: {en: 'Leader callout', 'zh-CN': '引线标注'},
  purpose: 'term',
  line: 'A part named on the word: a dot, a leader with one knee, the name on a shelf.',
  fits: 'naming a part; a material; a count for a part that repeats',
  params: {
    at: {type: '[x, y]', doc: 'the point on the part, in px inside the box'},
    knee: {type: '[x, y]', doc: 'where the leader bends to the shelf'},
    text: {type: 'text', doc: 'the name, a few words'},
    count: {type: 'text', default: '', doc: 'a quantity after the name, quieter: ×5'},
    side: {type: 'right | left', default: 'right', doc: 'which way the shelf runs from the knee'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: the dot, the leader, then the name'},
    size: {type: 'px', default: 34, doc: 'the lettering'},
  },
  preview: 22.9,
};

type P = [number, number];

export function Callout({at, knee, text, count = '', side = 'right', draw = 1, size = 34}: {at: P; knee: P; text: string; count?: string; side?: 'right' | 'left'; draw?: number; size?: number}) {
  const lead = ease(phase(draw, 0.05, 0.45)), write = phase(draw, 0.45, 1);
  const shelf = (text.length + (count ? count.length + 1 : 0)) * size * 0.66 + 16;
  const dir = side === 'right' ? 1 : -1;
  const k: P = [at[0] + (knee[0] - at[0]) * lead, at[1] + (knee[1] - at[1]) * lead];
  const shelfEnd = knee[0] + dir * shelf * ease(phase(draw, 0.4, 0.7));
  return (
    <>
      <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {draw > 0 && <circle cx={at[0]} cy={at[1]} r={5.5} fill="var(--vt-text)" opacity={phase(draw, 0, 0.08)} />}
        {lead > 0 && <path d={`M${at[0]} ${at[1]} L${k[0]} ${k[1]}${lead >= 1 ? ` L${shelfEnd} ${knee[1]}` : ''}`} stroke={LINE.thin.color} strokeWidth={2} fill="none" />}
      </svg>
      {write > 0 && (
        <div style={{position: 'absolute', top: knee[1] - size * 1.25, ...(dir > 0 ? {left: knee[0] + 8} : {right: `calc(100% - ${knee[0] - 8}px)`}), ...lettering(size), color: 'var(--vt-text)', ...typed(write)}}>
          {text}{count && <span style={{color: 'var(--vt-muted)', marginLeft: '0.5em'}}>{count}</span>}
        </div>
      )}
    </>
  );
}
