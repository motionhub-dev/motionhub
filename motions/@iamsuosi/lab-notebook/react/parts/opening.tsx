import {PEN, fit, unit, written} from './pens.ts';

export const meta = {
  name: {en: 'Opening question', 'zh-CN': '开场问题'},
  purpose: 'open',
  line: 'The film\'s question written large across a clean page, line by line, with a small pencilled note above it and a line drawn under it.',
  fits: 'the first seconds of a film; a question or a claim to work through; a new chapter',
  params: {
    lines: {type: 'text[]', doc: 'one to three short lines'},
    kicker: {type: 'text', default: '', doc: 'a few words in pencil above: a date, a course, a chapter'},
    write: {type: 'progress', default: 1, doc: '0 to 1: the kicker and the lines together, then the line under them'},
    size: {type: 'px', default: 104, doc: 'the hand\'s size; a long line writes smaller'},
    width: {type: 'px', default: 1440, doc: 'the widest a line may be'},
  },
  preview: 'opening.jpg',
};

export function Opening({lines, kicker = '', write = 1, size = 104, width = 1440}: {lines: string[]; kicker?: string; write?: number; size?: number; width?: number}) {
  const n = lines.length || 1, words = unit(write / 0.85), rule = unit((write - 0.85) / 0.15);
  const s = Math.min(...lines.map((l) => fit(l, width, size)));
  return (
    <div style={{maxWidth: width, width: 'fit-content', fontFamily: 'var(--font-display)'}}>
      {kicker && <div style={{fontSize: 38, color: PEN.pencil, marginBottom: 18, whiteSpace: 'nowrap', width: 'fit-content', ...written(unit(write / 0.15))}}>{kicker}</div>}
      {lines.map((l, i) => <div key={i} style={{fontSize: s, lineHeight: 1.22, fontWeight: 600, color: PEN.ink, whiteSpace: 'nowrap', width: 'fit-content', ...written(words * n - i)}}>{l}</div>)}
      <svg width="70%" height={22} style={{display: 'block', marginTop: 20, overflow: 'visible', clipPath: `inset(-50% ${((1 - rule) * 100).toFixed(1)}% -50% 0)`}} viewBox="0 0 100 16" preserveAspectRatio="none">
        <path d="M1 9 C 30 4, 60 14, 99 6" fill="none" stroke={PEN.ink} strokeWidth={4} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
