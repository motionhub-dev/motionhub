import {random} from '@visotalk/runtime';

export const meta = {
  name: {en: 'Printed page', 'zh-CN': '印刷页'},
  purpose: 'ground',
  line: 'The sheet everything is printed on: a running head, a text column and a margin for the pencil, lying on a darker desk.',
  fits: 'every scene; a new section changes the running head, not the page',
  params: {
    folio: {type: 'text', default: '', doc: 'the running head, left: the section or the question'},
    page: {type: 'text', default: '', doc: 'the page number, right'},
  },
  preview: 0.5,
};

/** Where the page sits on the 1920 × 1080 canvas; the text column and the margin, for laying parts out on it */
export const PAGE = {left: 96, top: 40, right: 1824, bottom: 872, column: [176, 1360] as const, margin: [1440, 1760] as const};

// paper fibres: short faint strokes, fixed by their seed
const FIBRES = (() => {
  const r = random('red-pencil:fibres');
  return Array.from({length: 420}, () => {
    const x = r() * (PAGE.right - PAGE.left), y = r() * (PAGE.bottom - PAGE.top), a = r() * Math.PI, l = 6 + r() * 14;
    return `M${x.toFixed(0)} ${y.toFixed(0)}l${(Math.cos(a) * l).toFixed(1)} ${(Math.sin(a) * l).toFixed(1)}`;
  }).join('');
})();

export function Page({folio = '', page = ''}: {folio?: string; page?: string}) {
  const w = PAGE.right - PAGE.left, h = PAGE.bottom - PAGE.top;
  return (
    <div style={{position: 'absolute', inset: 0, background: 'var(--vt-bg)'}}>
      <div style={{position: 'absolute', left: PAGE.left, top: PAGE.top, width: w, height: h, background: 'var(--vt-panel)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.08), 0 18px 40px -24px rgba(40,30,10,0.45)'}}>
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <path d={FIBRES} stroke="var(--vt-faint)" strokeWidth={1} strokeOpacity={0.35} fill="none" />
          {/* the margin's hairline */}
          <line x1={PAGE.margin[0] - PAGE.left - 40} y1={92} x2={PAGE.margin[0] - PAGE.left - 40} y2={h - 48} stroke="var(--vt-border)" strokeWidth={1} />
        </svg>
        <div style={{position: 'absolute', left: PAGE.column[0] - PAGE.left, right: w - (PAGE.margin[1] - PAGE.left), top: 34, display: 'flex', justifyContent: 'space-between',
          fontFamily: 'var(--vt-sans)', fontSize: 22, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--vt-muted)', borderBottom: '1px solid var(--vt-text)', paddingBottom: 10}}>
          <span>{folio}</span><span>{page}</span>
        </div>
      </div>
    </div>
  );
}
