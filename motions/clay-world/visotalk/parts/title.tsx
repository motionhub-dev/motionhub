// A title of thick clay letters: each one drops on to the line and lands with a squash, a beat after the one before it, and stands with
// its own depth and a soft shadow on the set. A small line above names the subject.
import {unit} from './world.tsx';

export const meta = {
  name: {en: 'Clay letters', 'zh-CN': '黏土字'},
  purpose: 'title',
  line: 'Thick rounded clay letters that drop on one after another and squash, under a small line naming the subject.',
  fits: 'the question a film opens on, a chapter, the last words',
  params: {
    x: {type: 'px', default: 960, doc: 'its centre (or left edge, with align left)'},
    y: {type: 'px', default: 150, doc: 'the top of the small line'},
    kicker: {type: 'text', default: '', doc: 'the small line above'},
    title: {type: 'text', doc: 'a few words; a line break is kept'},
    size: {type: 'px', default: 128, doc: 'the letters\' height'},
    color: {type: 'text', default: 'text', doc: 'the clay of the letters: a colour token'},
    align: {type: 'text', default: 'center', doc: 'center or left'},
    show: {type: 'progress', default: 1, doc: '0 none, 1 every letter landed: tween it over a second or two; back to 0 lifts them off'},
  },
  preview: 2.9,
};

export function Title({x = 960, y = 150, kicker = '', title, size = 128, color = 'text', align = 'center', show = 1}: {
  x?: number; y?: number; kicker?: string; title: string; size?: number; color?: string; align?: string; show?: number;
}) {
  const s = unit(show);
  if (s <= 0) return null;
  const centre = align !== 'left';
  const letters = [...title];
  const n = Math.max(1, letters.filter((c) => c.trim()).length);
  const ink = `var(--vt-${color})`;
  const side = `color-mix(in oklab, ${ink}, #2a140c 32%)`;
  let i = 0;
  return (
    <div style={{position: 'absolute', left: centre ? x - 900 : x, top: y, width: 1800, textAlign: centre ? 'center' : 'left'}}>
      {kicker && <div style={{fontFamily: 'var(--vt-sans)', fontSize: 34, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--vt-muted)',
        marginBottom: 14, opacity: unit(s * 3), transform: `translateY(${((1 - unit(s * 2)) * -20).toFixed(1)}px)`}}>{kicker}</div>}
      <div style={{fontFamily: 'var(--vt-display)', fontSize: size, fontWeight: 700, lineHeight: 1.05, whiteSpace: 'pre-line', color: ink}}>
        {letters.map((ch, k) => {
          if (ch === '\n') return <br key={k} />;
          if (!ch.trim()) return <span key={k} style={{whiteSpace: 'pre'}}>{ch}</span>;
          // each letter falls, squashes on the line, springs and settles
          const p = unit(s * 1.6 - (i++ / n) * 0.6);
          const fall = Math.min(1, p / 0.45);
          const yy = (1 - fall * fall) * -size * 0.6;
          const q = Math.max(0, (p - 0.45) / 0.55);
          const sq = p < 0.45 ? 1.12 : 1 - 0.3 * Math.sin(Math.min(1, q * 2.4) * Math.PI) * Math.exp(-2.5 * q) + 0.06 * Math.sin(q * Math.PI * 3) * Math.exp(-4 * q);
          return <span key={k} style={{display: 'inline-block', whiteSpace: 'pre', opacity: unit(p * 6),
            transform: `translateY(${yy.toFixed(1)}px) scale(${(1 / Math.sqrt(sq)).toFixed(3)}, ${sq.toFixed(3)})`, transformOrigin: '50% 88%',
            textShadow: `0 ${Math.round(size * 0.045)}px 0 ${side}, 0 ${Math.round(size * 0.1)}px ${Math.round(size * 0.12)}px rgba(70, 40, 30, ${(0.28 * fall).toFixed(2)})`}}>{ch}</span>;
        })}
      </div>
    </div>
  );
}
