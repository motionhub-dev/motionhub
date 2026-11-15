export const meta = {
  name: {en: 'Spec', 'zh-CN': '词条'},
  purpose: 'term',
  line: 'A term, the token it is known by in a cyan chip, then what it means.',
  fits: 'a limit, a header, a metric name or a flag the film defines',
  params: {
    term: {type: 'text', doc: 'the word being defined'},
    token: {type: 'text', doc: 'the token, as it is written: max.in.flight'},
    meaning: {type: 'text', doc: 'what it means, one or two lines'},
    reveal: {type: 'progress', default: 1, doc: '0 hidden, 1 the term, the chip and the meaning'},
    width: {type: 'px', default: 760, doc: 'the block\'s width'},
  },
  preview: 17.2,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));

export function Spec({term, token, meaning, reveal = 1, width = 760}: {term: string; token: string; meaning: string; reveal?: number; width?: number}) {
  const r = unit(reveal);
  return (
    <div style={{width, opacity: Math.min(1, r * 2), transform: `translateY(${((1 - r) * 14).toFixed(1)}px)`}}>
      <div style={{fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 64, letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--color-text)'}}>{term}</div>
      <div style={{marginTop: 18, display: 'inline-block', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-grad)', fontFamily: 'var(--font-mono)', fontSize: 24, color: 'var(--color-grad)', opacity: Math.max(0, Math.min(1, (r - 0.2) / 0.4))}}>{token}</div>
      <div style={{marginTop: 18, maxWidth: 680, fontFamily: 'var(--font-sans)', fontSize: 30, lineHeight: 1.35, color: 'var(--color-muted)', opacity: Math.max(0, (r - 0.45) / 0.55)}}>{meaning}</div>
    </div>
  );
}
