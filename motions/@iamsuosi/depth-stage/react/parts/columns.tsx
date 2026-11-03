import {Glow, hazed, unit, useLook} from './stage.tsx';

export const meta = {
  name: {en: 'Columns of light', 'zh-CN': '光柱对比'},
  purpose: 'compare',
  line: 'Two to four slender columns standing on one plane, rising one after another to heights in proportion; the one the sentence is about is warm, the rest hazed.',
  fits: 'how high or deep or long things are against each other: a column of ash against a mountain, a tower against a cathedral, then against now',
  params: {
    items: {type: '{label, value, note?}[]', doc: 'the things compared, left to right; the note is the value as read (8.8 km)'},
    max: {type: 'number', doc: 'the value drawn `height` tall; every column is in proportion to it'},
    x: {type: 'px', default: 520, doc: 'the first column, across, at rest'},
    gap: {type: 'px', default: 340, doc: 'from one column to the next'},
    base: {type: 'px', default: 860, doc: 'the ground they stand on, down, at rest'},
    height: {type: 'px', default: 560, doc: 'how tall `max` stands'},
    warm: {type: 'number', default: -1, doc: 'which column is warm (its index); -1 for none'},
    rise: {type: 'progress', default: 1, doc: '0 to 1: the columns rise one after another, each landing its value'},
  },
  preview: 12.6,
};

export function Columns({items, max, x = 520, gap = 340, base = 860, height = 560, warm = -1, rise = 1}: {
  items: Array<{label: string; value: number; note?: string}>; max: number; x?: number; gap?: number; base?: number; height?: number; warm?: number; rise?: number;
}) {
  const {fog} = useLook();
  const n = Math.max(1, items.length);
  const ink = hazed('var(--color-text)', fog * 0.6);
  const quiet = hazed('color-mix(in oklab, var(--color-text), var(--color-muted) 40%)', fog * 0.5);
  const halo = '0 2px 30px rgba(6, 9, 16, 0.55)';
  return (
    <>
      {/* the ground line they share, so the heights read against one another */}
      <div style={{position: 'absolute', left: x - gap * 0.45, top: base, width: gap * (n - 0.1), height: 1.5, background: quiet, opacity: 0.7 * unit(rise * 4)}} />
      {items.map((it, i) => {
        // each rises over its own share of `rise`, slow out of the ground and slower into place
        const k = unit((rise - i / n) * n * 1.15), e = 1 - Math.pow(1 - k, 3);
        if (k <= 0) return null;
        const hot = i === warm, h = (it.value / max) * height * e, cx = x + i * gap;
        const colour = hot ? hazed('var(--color-data)', fog * 0.4) : ink;
        const top = base - h, word = unit(k * 2 - 1);
        return (
          <div key={i}>
            {hot && <Glow x={cx} y={top} r={70} color="var(--color-data)" alpha={0.5 * e} />}
            <div style={{position: 'absolute', left: cx - 4, top, width: 8, height: h, borderRadius: 4,
              background: `linear-gradient(to top, transparent, ${colour} 30%, ${colour})`, opacity: hot ? 1 : 0.7, boxShadow: hot ? `0 0 24px ${colour}` : 'none'}} />
            <div style={{position: 'absolute', left: cx - 300, width: 600, top: top - 92, textAlign: 'center', opacity: word, filter: word < 0.99 ? `blur(${((1 - word) * 10).toFixed(1)}px)` : 'none',
              fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 300, lineHeight: 1, color: hot ? colour : ink, textShadow: halo, whiteSpace: 'nowrap', fontVariantNumeric: 'lining-nums'}}>{it.note ?? it.value}</div>
            <div style={{position: 'absolute', left: cx - 300, width: 600, top: base + 22, textAlign: 'center', opacity: unit(k * 3),
              fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: quiet, textShadow: halo, whiteSpace: 'nowrap'}}>{it.label}</div>
          </div>
        );
      })}
    </>
  );
}
