import {stage, tag, unit} from './ink.ts';

export const meta = {
  name: {en: 'Quote', 'zh-CN': '\u5f15\u8bed\u724c'},
  purpose: 'quote',
  line: 'A few words written out on a tag behind a teal quotation mark, with their source below.',
  fits: 'a line from a spec sheet, a maker or a review they cite; the sentence the video turns on',
  params: {
    text: {type: 'text', doc: 'the words, at most about fifteen, without quotation marks'},
    source: {type: 'text', default: '', doc: 'who said or wrote it, and where'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the mark lands, then the words are written out, then the source'},
    width: {type: 'px', default: 820, doc: 'the widest it goes before wrapping'},
  },
  preview: 40.5,
};

export function Quote({text, source = '', show = 1, width = 820}: {text: string; source?: string; show?: number; width?: number}) {
  // unspaced scripts (Chinese, Japanese) are written out a character at a time, others a word at a time
  const unspaced = /[\u3040-\u30ff\u3400-\u9fff]/.test(text);
  const pieces = unspaced ? [...text] : text.split(/(\s+)/);
  const mark = stage(show, 0, 0.2), words = unit((show - 0.15) / 0.7), from = stage(show, 0.85, 1);
  return (
    <div style={{...tag, display: 'inline-block', maxWidth: width, boxSizing: 'border-box', padding: '26px 34px 28px 104px', position: 'relative', opacity: unit(mark * 2)}}>
      <div style={{position: 'absolute', left: 26, top: 6, fontFamily: 'var(--vt-display)', fontSize: 132, fontWeight: 800, lineHeight: 1, color: 'var(--vt-data)', transform: `translateY(${(1 - mark) * -18}px)`}}>{'\u201c'}</div>
      <div style={{fontFamily: 'var(--vt-sans)', fontSize: 46, fontWeight: 700, lineHeight: 1.25, color: 'var(--vt-text)'}}>
        {pieces.map((p, i) => <span key={i} style={{opacity: unit(words * pieces.length - i)}}>{p}</span>)}
      </div>
      {source && <div style={{marginTop: 14, fontFamily: 'var(--vt-mono)', fontSize: 26, letterSpacing: '0.04em', color: 'var(--vt-muted)', opacity: from}}>{'\u2014'} {source}</div>}
    </div>
  );
}
