import {hazed, unit, useLook} from './stage.tsx';

export const meta = {
  name: {en: 'Word in the haze', 'zh-CN': '雾中术语'},
  purpose: 'term',
  line: 'A term in italic serif with a hairline drawn under it and its meaning in plain type, on a plane of the world; the meaning comes into focus on its own beat.',
  fits: 'a word the narration defines (a pyroclastic surge, a caldera, a stratum, an era); what a name means',
  params: {
    x: {type: 'px', default: 180, doc: 'its left edge (or centre, with align center), at rest'},
    y: {type: 'px', default: 220, doc: 'the top of the term, at rest'},
    word: {type: 'text', doc: 'the term, a word or a few'},
    meaning: {type: 'text', doc: 'what it means, one or two short lines'},
    size: {type: 'px', default: 96, doc: 'the term\'s height'},
    align: {type: 'text', default: 'left', doc: 'left or center'},
    show: {type: 'progress', default: 1, doc: '0 lost in the haze; the term comes into focus by 0.5, the hairline draws, the meaning arrives by 1'},
  },
  preview: 17.0,
};

export function Term({x = 180, y = 220, word, meaning, size = 96, align = 'left', show = 1}: {
  x?: number; y?: number; word: string; meaning: string; size?: number; align?: string; show?: number;
}) {
  const {fog} = useLook();
  const w = unit(show * 2), rule = unit(show * 2.5 - 1), m = unit(show * 2 - 1);
  const centre = align === 'center';
  const halo = '0 2px 30px rgba(6, 9, 16, 0.55)';
  const sharp = (k: number, px: number) => (k < 0.99 ? `blur(${((1 - k) * px).toFixed(1)}px)` : 'none');
  return (
    <div style={{position: 'absolute', left: centre ? x - 700 : x, top: y, width: 1400, textAlign: centre ? 'center' : 'left', opacity: unit(w * 3)}}>
      <div style={{fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: size, fontWeight: 300, lineHeight: 1.02, letterSpacing: '-0.005em',
        color: hazed('var(--color-text)', fog * 0.6), textShadow: halo, opacity: w, filter: sharp(w, 16), whiteSpace: 'nowrap'}}>{word}</div>
      <div style={{height: 1.5, width: 260, marginTop: 26, marginLeft: centre ? 'auto' : 0, marginRight: centre ? 'auto' : 0,
        background: hazed('var(--color-data)', fog * 0.4), transform: `scaleX(${rule})`, transformOrigin: centre ? 'center' : 'left'}} />
      <div style={{fontFamily: 'var(--font-sans)', fontSize: 40, fontWeight: 500, lineHeight: 1.3, letterSpacing: '0.01em', marginTop: 24, maxWidth: 1000,
        marginLeft: centre ? 'auto' : 0, marginRight: centre ? 'auto' : 0,
        color: hazed('color-mix(in oklab, var(--color-text), var(--color-muted) 15%)', fog * 0.5), textShadow: halo, opacity: m, filter: sharp(m, 10)}}>{meaning}</div>
    </div>
  );
}
