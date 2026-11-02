import {lettering, phase, typed} from './draft.ts';

export const meta = {
  name: {en: 'View title', 'zh-CN': '视图名'},
  purpose: 'title',
  line: 'A view\'s name under it, double-underlined, its scale beside: SECTION A–A.',
  fits: 'telling a section from an outside view; a scale that matters',
  params: {
    text: {type: 'text', doc: 'the view\'s name, in capitals'},
    scale: {type: 'text', default: '', doc: 'the scale beside it, quieter: 4 : 1'},
    write: {type: 'progress', default: 1, doc: '0 to 1: the name, then its two underlines'},
    size: {type: 'px', default: 34, doc: 'the name\'s size'},
  },
  preview: 11.5,
};

export function ViewLabel({text, scale = '', write = 1, size = 34}: {text: string; scale?: string; write?: number; size?: number}) {
  const name = phase(write, 0, 0.7), under = phase(write, 0.6, 1);
  return (
    <div style={{position: 'relative', display: 'inline-flex', alignItems: 'baseline', gap: 22}}>
      <div style={{position: 'relative'}}>
        <div style={{fontFamily: 'var(--vt-display)', fontSize: size, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--vt-text)', whiteSpace: 'nowrap', lineHeight: 1.3, ...typed(name)}}>{text}</div>
        <div style={{position: 'absolute', left: 0, top: '100%', marginTop: 8, height: 3, width: `${under * 100}%`, background: 'var(--vt-text)'}} />
        <div style={{position: 'absolute', left: 0, top: '100%', marginTop: 15, height: 1.5, width: `${under * 100}%`, background: 'var(--vt-text)'}} />
      </div>
      {scale && <div style={{...lettering(Math.max(30, size * 0.8)), color: 'var(--vt-muted)', ...typed(under)}}>{scale}</div>}
    </div>
  );
}
