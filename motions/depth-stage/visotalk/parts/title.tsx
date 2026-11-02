import {hazed, unit, useLook} from './stage.tsx';

export const meta = {
  name: {en: 'Title in the haze', 'zh-CN': '雾中标题'},
  purpose: 'title',
  line: 'A serif title under a small spaced line, on a plane of the world; it comes into focus out of the haze, letter by letter.',
  fits: 'the place and year a story opens on; a chapter; the question a film asks',
  params: {
    x: {type: 'px', default: 180, doc: 'its left edge (or centre, with align center), at rest'},
    y: {type: 'px', default: 260, doc: 'the top of the small line, at rest'},
    kicker: {type: 'text', default: '', doc: 'the small spaced line above: a place, a date, a chapter'},
    title: {type: 'text', doc: 'a few words; a line break is kept'},
    size: {type: 'px', default: 132, doc: 'the title\'s height'},
    align: {type: 'text', default: 'left', doc: 'left or center'},
    show: {type: 'progress', default: 1, doc: '0 lost in the haze, 1 in focus'},
  },
  preview: 3.4,
};

export function Title({x = 180, y = 260, kicker = '', title, size = 132, align = 'left', show = 1}: {
  x?: number; y?: number; kicker?: string; title: string; size?: number; align?: string; show?: number;
}) {
  const {fog} = useLook();
  const s = unit(show);
  const centre = align === 'center';
  return (
    <div style={{position: 'absolute', left: centre ? x - 900 : x, top: y, width: 1800, textAlign: centre ? 'center' : 'left',
      opacity: unit(s * 3)}}>
      {kicker && <div style={{fontFamily: 'var(--vt-sans)', fontSize: 26, fontWeight: 600, letterSpacing: `${(0.34 + (1 - s) * 0.2).toFixed(3)}em`, textTransform: 'uppercase',
        color: hazed('color-mix(in oklab, var(--vt-text), var(--vt-muted) 35%)', fog * 0.5), marginBottom: 22}}>{kicker}</div>}
      <div style={{fontFamily: 'var(--vt-display)', fontSize: size, fontWeight: 400, lineHeight: 1.02, letterSpacing: '-0.01em',
        whiteSpace: 'pre-line', color: hazed('var(--vt-text)', fog * 0.6), textShadow: '0 2px 30px rgba(6, 9, 16, 0.55)'}}>
        {/* each letter comes into focus a little after the one before it, rising out of the haze */}
        {[...title].map((ch, i, all) => {
          const k = unit(show * 1.7 - (i / Math.max(1, all.length)) * 0.7);
          return ch === '\n' ? <br key={i} /> : <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: k, transform: `translateY(${((1 - k) * 0.18 * size).toFixed(1)}px)`, filter: k < 0.99 ? `blur(${((1 - k) * 16).toFixed(1)}px)` : 'none'}}>{ch}</span>;
        })}
      </div>
    </div>
  );
}
