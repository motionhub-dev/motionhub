import {eyebrow, stage, tag} from './ink.ts';

export const meta = {
  name: {en: 'Verdict', 'zh-CN': '\u7ed3\u8bba\u5355'},
  purpose: 'close',
  line: 'A scorecard: each point opens on its words, a teal plus or a quiet minus; the verdict is ruled off below.',
  fits: 'the pros and cons a review ends on; a recap of what was tested',
  params: {
    title: {type: 'text', default: '', doc: 'what is judged, one short line above'},
    items: {type: 'list', doc: 'the points, each starting with "+" or "-", a few words after it'},
    shown: {type: 'number', default: 0, doc: 'how many points are out: tween it up by one on each point\'s words'},
    result: {type: 'text', default: '', doc: 'the verdict, a few words, ruled off under the points'},
    settle: {type: 'progress', default: 0, doc: '0 to 1: the rule draws and the verdict appears'},
    width: {type: 'px', default: 620, doc: 'the tag\'s width'},
  },
  preview: 50.9,
};

export function Verdict({title = '', items, shown = 0, result = '', settle = 0, width = 620}: {title?: string; items: string[]; shown?: number; result?: string; settle?: number; width?: number}) {
  const s = stage(settle, 0, 1);
  return (
    <div style={{...tag, width, boxSizing: 'border-box', padding: '22px 30px 26px'}}>
      {title && <div style={{...eyebrow, marginBottom: 14}}>{title}</div>}
      {items.map((raw, i) => {
        const plus = raw.trim().startsWith('+'), text = raw.trim().replace(/^[+\-\u2212]\s*/, ''), o = stage(shown - i, 0, 1);
        return (
          <div key={raw} style={{display: 'flex', alignItems: 'center', gap: 18, padding: '7px 0', opacity: o, transform: `translateX(${(1 - o) * -16}px)`}}>
            <span style={{width: 40, height: 40, flex: 'none', borderRadius: 4, display: 'grid', placeItems: 'center', fontFamily: 'var(--vt-display)', fontSize: plus ? 36 : 44, fontWeight: 800, lineHeight: 1,
              background: plus ? 'var(--vt-data)' : 'transparent', color: plus ? 'var(--vt-panel)' : 'var(--vt-muted)'}}>{plus ? '+' : '\u2212'}</span>
            <span style={{fontFamily: 'var(--vt-sans)', fontSize: 40, fontWeight: 700, lineHeight: 1.15, color: plus ? 'var(--vt-text)' : 'var(--vt-muted)'}}>{text}</span>
          </div>
        );
      })}
      {result && (
        <>
          <div style={{height: 3, margin: '16px 0 14px', width: `${(100 * s).toFixed(1)}%`, background: 'var(--vt-data)'}} />
          <div style={{fontFamily: 'var(--vt-display)', fontSize: 50, fontWeight: 800, lineHeight: 1.1, color: 'var(--vt-text)', opacity: s, transform: `translateY(${(1 - s) * 12}px)`}}>{result}</div>
        </>
      )}
    </div>
  );
}
