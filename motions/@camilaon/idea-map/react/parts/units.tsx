import {useMap, useEdgeFade, unit, ease, spaced} from './geometry.ts';
import {GlyphArt} from './pictogram.tsx';

export const meta = {
  name: {en: 'Unit chart', 'zh-CN': '单位图'},
  purpose: 'data',
  line: 'A share as a row of pictograms counted in, the share in red: three in ten without a sentence.',
  fits: 'one in three prescriptions; four in five households; nine in ten species',
  params: {
    glyph: {type: 'text', doc: 'the pictogram each unit is (see Pictogram)'},
    total: {type: 'number', default: 10, doc: 'how many units: 4 to 20'},
    marked: {type: 'number', doc: 'how many of them are the share, drawn in red first'},
    cols: {type: 'number', default: 10, doc: 'units to a row'},
    size: {type: 'px', default: 64, doc: 'one unit\'s height'},
    label: {type: 'text', doc: 'what the units are, in a few words, with how they were counted ("at least")'},
    source: {type: 'text', doc: 'where the share comes from'},
    at: {type: 'text', doc: 'inside IdeaMap: the term it stands beside'},
    place: {type: 'text', default: 'right', doc: 'right or below the term named by at'},
    x: {type: 'px', default: 0, doc: 'without at: its left edge'},
    y: {type: 'px', default: 0, doc: 'without at: its baseline (the bottom of the first row)'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the units draw in turn, the marked ones first, then the label'},
  },
  preview: 24.5,
};

export function Units({glyph, total = 10, marked = 0, cols = 10, size = 64, label, source, at, place = 'right', x = 0, y = 0, show = 1}: {
  glyph: string; total?: number; marked?: number; cols?: number; size?: number; label?: string; source?: string; at?: string; place?: 'right' | 'below'; x?: number; y?: number; show?: number;
}) {
  const map = useMap();
  const n = at ? map?.at(at) : undefined;
  let X = x, Y = y;
  if (n) {
    if (place === 'below') { X = n.x; Y = n.y + n.box.depth + 40 + size; } else { X = n.x + n.box.w + 90; Y = n.y; }
  }
  const step = size * 1.18, rows = Math.ceil(total / cols);
  const W = Math.min(total, cols) * step, H = rows * step;
  const fade = useEdgeFade({x0: X, y0: Y - size, x1: X + W, y1: Y + H - size + (label ? 50 : 0) + (source ? 44 : 0)});
  if (show <= 0.001) return null;
  const draws = (i: number) => ease(unit(show * 1.25 * total - i));
  const text = ease(unit((show - 0.75) / 0.25));
  return (
    <div style={{position: 'absolute', left: X, top: Y - size, width: 0, height: 0, opacity: fade}}>
      {Array.from({length: total}, (_, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * step, top: Math.floor(i / cols) * step}}>
          <GlyphArt name={glyph} size={size} draw={draws(i)} color={i < marked ? 'var(--color-op)' : 'var(--color-text)'} stroke={i < marked ? 4.2 : 3.2} />
        </div>
      ))}
      {label && <div style={{position: 'absolute', left: 0, top: H + 6, whiteSpace: 'nowrap', opacity: text, fontFamily: 'var(--font-display)', fontStyle: /[㐀-鿿]/.test(label) ? 'normal' : 'italic', fontSize: 40, lineHeight: '50px', color: 'var(--color-muted)'}}>
        <span style={{fontFamily: 'var(--font-sans)', fontStyle: 'normal', fontWeight: 600, color: 'var(--color-op)'}}>{marked}/{total}</span>&nbsp; {spaced(label)}
      </div>}
      {source && <div style={{position: 'absolute', left: 0, top: H + (label ? 58 : 6), whiteSpace: 'nowrap', opacity: text, fontFamily: 'var(--font-mono)', fontSize: 32, lineHeight: '40px', color: 'var(--color-muted)'}}>{spaced(source)}</div>}
    </div>
  );
}
