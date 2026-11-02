export const meta = {
  name: {en: 'Case title', 'zh-CN': '案题'},
  purpose: 'title',
  line: 'The case written on the felt: a mono line of dates over a large serif question.',
  fits: 'the opening question of an investigation or a fact-check',
  params: {
    kicker: {type: 'text', doc: 'the dates or file line, in the mono face: "APOLLO 13 · APRIL–JUNE 1970"'},
    title: {type: 'text', doc: 'the question the board answers, eight words or fewer'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the kicker, then the title, printed in from the left'},
    width: {type: 'px', default: 1100, doc: 'the width the title wraps in, in board pixels'},
  },
  preview: 3.8,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));

export function CaseTitle({kicker, title, show = 1, width = 1100}: {kicker: string; title: string; show?: number; width?: number}) {
  const k = unit(show / 0.4), t = unit((show - 0.25) / 0.75);
  return (
    <div style={{width, color: 'var(--vt-text)'}}>
      <div style={{fontFamily: 'var(--vt-mono)', fontSize: 26, letterSpacing: '0.1em', color: 'var(--vt-muted)', opacity: k, clipPath: `inset(0 ${(100 - 100 * k).toFixed(1)}% 0 0)`}}>{kicker}</div>
      <div style={{fontFamily: 'var(--vt-display)', fontSize: 104, fontWeight: 500, lineHeight: 1.02, letterSpacing: '-0.015em', marginTop: 18, opacity: t, transform: `translateX(${(-24 * (1 - t)).toFixed(1)}px)`}}>{title}</div>
    </div>
  );
}
