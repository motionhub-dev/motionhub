import {stage, tag, wipe} from './ink.ts';

export const meta = {
  name: {en: 'Chapter tab', 'zh-CN': '章节角标'},
  purpose: 'open',
  line: 'A small tab in a top corner naming the part of the video, its number in teal; it stays for the part.',
  fits: 'the sections of a review; the steps of a tutorial; an interview\'s questions',
  params: {
    n: {type: 'text', doc: 'the part\'s number or mark, as shown: 01, 2/4'},
    title: {type: 'text', doc: 'the part, two or three words'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the tab opens from its corner'},
  },
  preview: 2,
};

export function Chapter({n, title, show = 1}: {n: string; title: string; show?: number}) {
  const s = stage(show, 0, 1);
  return (
    <div style={{...tag, ...wipe(s), display: 'inline-flex', alignItems: 'baseline', gap: 14, padding: '10px 20px'}}>
      <span style={{fontFamily: 'var(--vt-mono)', fontSize: 26, fontWeight: 700, color: 'var(--vt-data)'}}>{n}</span>
      <span style={{fontFamily: 'var(--vt-sans)', fontSize: 28, fontWeight: 700, color: 'var(--vt-text)', whiteSpace: 'nowrap'}}>{title}</span>
    </div>
  );
}
