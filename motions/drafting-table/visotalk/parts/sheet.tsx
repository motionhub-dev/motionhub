export const meta = {
  name: {en: 'Drawing sheet', 'zh-CN': '图纸'},
  purpose: 'ground',
  line: 'A deep-blue sheet edge to edge: a ruled frame with zone references, registration crosses, the subject lettered top left.',
  fits: 'every scene; a new view changes the note beside the title',
  params: {
    title: {type: 'text', default: '', doc: 'what is drawn, at the top left, in capitals'},
    note: {type: 'text', default: '', doc: 'the view or the scale beside the title, small: SECTION A–A · SCALE 4:1'},
  },
  preview: 0.5,
};

/** The sheet's frame on the 1920 × 1080 canvas, and the area a drawing may use: above the caption, inside the frame, below the title */
export const SHEET = {frame: 34, zone: 30, area: {left: 120, top: 150, right: 1800, bottom: 870}};

const W = 1920, H = 1080;

/** Lines drawn as a mask over one colour: the frame is part of the ground, a backdrop under everything, the caption included */
const masked = (color: string, svg: string) => {
  const url = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'>${svg}</svg>`)}")`;
  return {position: 'absolute' as const, inset: 0, background: color, WebkitMaskImage: url, maskImage: url};
};

export function Sheet({title = '', note = ''}: {title?: string; note?: string}) {
  const o = SHEET.frame, i = o + SHEET.zone;
  const cols = 8, rows = 3;
  const colW = (W - 2 * o) / cols, rowH = (H - 2 * o) / rows;
  const crosses: string[] = [];
  for (let x = 240; x < W - 100; x += 240) for (let y = 240; y < H - 120; y += 240) crosses.push(`M${x - 9} ${y}H${x + 9}M${x} ${y - 9}V${y + 9}`);
  const ticks = [
    ...Array.from({length: cols - 1}, (_, k) => o + (k + 1) * colW).map((x) => `M${x} ${o}V${i}M${x} ${H - i}V${H - o}`),
    ...Array.from({length: rows - 1}, (_, k) => o + (k + 1) * rowH).map((y) => `M${o} ${y}H${i}M${W - i} ${y}H${W - o}`),
  ].join('');
  // centring marks: where a drawing's middle is found on any sheet
  const centring = `M${W / 2} ${i}V${i + 22}M${W / 2} ${H - i}V${H - i - 22}M${i} ${H / 2}H${i + 22}M${W - i} ${H / 2}H${W - i - 22}`;
  const frame = `<rect x='${o}' y='${o}' width='${W - 2 * o}' height='${H - 2 * o}' fill='none' stroke='black' stroke-width='1.5'/><rect x='${i}' y='${i}' width='${W - 2 * i}' height='${H - 2 * i}' fill='none' stroke='black' stroke-width='3'/><path d='${ticks}' stroke='black' stroke-width='1.5'/><path d='${centring}' stroke='black' stroke-width='3'/>`;
  const zone = {position: 'absolute' as const, transform: 'translate(-50%, -50%)', fontFamily: 'var(--vt-mono)', fontSize: 17, color: 'var(--vt-muted)', letterSpacing: '0.05em', lineHeight: 1};
  return (
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(120% 95% at 46% 42%, var(--vt-panel2) 0%, var(--vt-panel) 58%, var(--vt-bg) 140%)'}}>
      <div style={masked('var(--vt-faint)', `<path d='${crosses.join('')}' stroke='black' stroke-width='1.5'/>`)} />
      <div style={masked('var(--vt-border)', frame)} />
      {/* zone references: numbers along the top, letters down the sides; none in the caption's band */}
      {Array.from({length: cols}, (_, k) => <span key={`n${k}`} style={{...zone, left: o + (k + 0.5) * colW, top: (o + i) / 2}}>{k + 1}</span>)}
      {Array.from({length: rows}, (_, k) => [(o + i) / 2, W - (o + i) / 2].map((x) => <span key={`l${k}${x}`} style={{...zone, left: x, top: o + (k + 0.5) * rowH}}>{'ABC'[k]}</span>))}
      {(title || note) && (
        <div style={{position: 'absolute', left: SHEET.area.left, top: 84, display: 'flex', alignItems: 'baseline', gap: 26, color: 'var(--vt-text)'}}>
          <span style={{fontFamily: 'var(--vt-display)', fontSize: 40, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase'}}>{title}</span>
          {note && <span style={{fontFamily: 'var(--vt-mono)', fontSize: 26, fontWeight: 500, letterSpacing: '0.08em', color: 'var(--vt-muted)', textTransform: 'uppercase', borderLeft: '2px solid var(--vt-border)', paddingLeft: 24}}>{note}</span>}
        </div>
      )}
    </div>
  );
}
