import {pathOf, lengthOf, stroke, wobble} from './pencil-path.ts';

export const meta = {
  name: {en: 'Margin note', 'zh-CN': '页边批注'},
  purpose: 'term',
  line: 'A few words written by hand in red in the margin, with a pencil leader running back to what they are about.',
  fits: 'the verdict on a printed claim; the word a reader should take away; what the fine print really means',
  params: {
    text: {type: 'text', doc: 'the note, a few words; a line break with \\n'},
    write: {type: 'progress', default: 0, doc: '0 to 1: how much of the note is written, left to right'},
    to: {type: '[x, y]', default: null, doc: 'where the leader ends, in px from the note\'s top left (negative is left or up); none draws no leader'},
    lead: {type: 'progress', default: 0, doc: '0 to 1: how much of the leader is drawn'},
    size: {type: 'px', default: 60, doc: 'the hand\'s size'},
    tilt: {type: 'degrees', default: -3, doc: 'how far the note leans'},
  },
  preview: 26,
};

export function MarginNote({text, write = 0, to = null, lead = 0, size = 60, tilt = -3}: {text: string; write?: number; to?: [number, number] | null; lead?: number; size?: number; tilt?: number}) {
  const leader = to && wobble(stroke([-12, size * 0.55], to, `note:${text}`, 0.06), `note:${text}`, 2.5);
  const len = leader ? lengthOf(leader) : 0;
  const shown = Math.max(0, Math.min(1, write));
  return (
    <div style={{position: 'relative', transform: `rotate(${tilt}deg)`, transformOrigin: 'left top'}}>
      {leader && lead > 0 && (
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} width={1} height={1}>
          <path d={pathOf(leader)} fill="none" stroke="var(--vt-grad)" strokeWidth={3.5} strokeLinecap="round" strokeOpacity={0.85}
            strokeDasharray={len} strokeDashoffset={len * (1 - Math.min(1, lead))} />
        </svg>
      )}
      <div style={{fontFamily: 'var(--vt-display)', fontSize: size, lineHeight: 1.2, fontWeight: 600, color: 'var(--vt-grad)', whiteSpace: 'pre-line',
        clipPath: `inset(-20% ${((1 - shown) * 100).toFixed(1)}% -20% -4%)`}}>{text}</div>
    </div>
  );
}
