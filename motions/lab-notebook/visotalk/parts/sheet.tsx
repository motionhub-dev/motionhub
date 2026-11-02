export const meta = {
  name: {en: 'Notebook sheet', 'zh-CN': '笔记本页'},
  purpose: 'ground',
  line: 'A page of squared paper with a red margin rule and punched holes, the topic written at the top by hand.',
  fits: 'every scene; a new question is a new heading on the same page, or the page turned',
  params: {
    title: {type: 'text', default: '', doc: 'the heading, written at the top left'},
    date: {type: 'text', default: '', doc: 'written small at the top right'},
  },
  preview: 0.5,
};

/** Where the sheet sits on the 1920 × 1080 canvas, the grid's square, and the writing area right of the margin */
export const SHEET = {left: 60, top: 28, right: 1860, bottom: 876, square: 40, margin: 220, area: [260, 1800] as const};

export function Sheet({title = '', date = ''}: {title?: string; date?: string}) {
  const w = SHEET.right - SHEET.left, h = SHEET.bottom - SHEET.top, s = SHEET.square, m = SHEET.margin - SHEET.left;
  const holes = Array.from({length: Math.floor((h - 80) / 150) + 1}, (_, i) => 70 + i * 150);
  return (
    <div style={{position: 'absolute', inset: 0, background: 'var(--vt-bg)'}}>
      <div style={{position: 'absolute', left: SHEET.left, top: SHEET.top, width: w, height: h, background: 'var(--vt-panel)', borderRadius: 6,
        boxShadow: '0 2px 0 rgba(0,0,0,0.06), 0 20px 36px -26px rgba(20,30,50,0.5)'}}>
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          {Array.from({length: Math.floor(w / s)}, (_, i) => <line key={`x${i}`} x1={(i + 1) * s} y1={0} x2={(i + 1) * s} y2={h} stroke="var(--vt-faint)" strokeWidth={1} />)}
          {Array.from({length: Math.floor(h / s)}, (_, i) => <line key={`y${i}`} x1={0} y1={(i + 1) * s} x2={w} y2={(i + 1) * s} stroke="var(--vt-faint)" strokeWidth={1} />)}
          <line x1={m} y1={0} x2={m} y2={h} stroke="var(--vt-border)" strokeWidth={2} />
          <line x1={m + 6} y1={0} x2={m + 6} y2={h} stroke="var(--vt-border)" strokeWidth={1} />
          {holes.map((y) => <circle key={y} cx={56} cy={y} r={15} fill="var(--vt-bg)" />)}
        </svg>
        <div style={{position: 'absolute', left: SHEET.area[0] - SHEET.left, right: w - (SHEET.area[1] - SHEET.left), top: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          fontFamily: 'var(--vt-display)', color: 'var(--vt-text)'}}>
          <span style={{fontSize: 46, fontWeight: 600}}>{title}</span>
          <span style={{fontSize: 28, color: 'var(--vt-muted)'}}>{date}</span>
        </div>
      </div>
    </div>
  );
}
