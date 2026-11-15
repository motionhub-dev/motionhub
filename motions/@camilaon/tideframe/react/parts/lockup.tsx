export const meta = {
  name: {en: 'Lockup', 'zh-CN': '锁定标题'},
  purpose: 'title',
  line: 'A kicker, a headline that tracks from wide to tight, and a green rule that draws under it.',
  fits: 'the claim a film opens on; a section name; the sentence a schematic is about to show',
  params: {
    kicker: {type: 'text', doc: 'small tracked label above the headline'},
    title: {type: 'text', doc: 'the headline, a few words'},
    sub: {type: 'text', default: '', doc: 'one line under the rule; none without one'},
    track: {type: 'progress', default: 1, doc: '0 wide and low, 1 locked tight'},
    rule: {type: 'progress', default: 1, doc: '0 to 1: the green rule drawing from the left'},
    size: {type: 'px', default: 92, doc: 'the headline height'},
  },
  preview: 4.2,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));

export function Lockup({kicker, title, sub = '', track = 1, rule = 1, size = 92}: {kicker: string; title: string; sub?: string; track?: number; rule?: number; size?: number}) {
  const t = unit(track);
  const spacing = (0.18 - 0.21 * t).toFixed(3);
  return (
    <div style={{color: 'var(--color-text)'}}>
      <div style={{fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-grad)'}}>{kicker}</div>
      <div style={{marginTop: 12, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size, lineHeight: 0.96, letterSpacing: `${spacing}em`, transform: `translateY(${(16 * (1 - t)).toFixed(1)}px)`, opacity: 0.2 + 0.8 * t}}>{title}</div>
      <div style={{marginTop: 18, height: 4, position: 'relative'}}>
        <div style={{position: 'absolute', left: 0, top: 0, height: 4, width: `${(unit(rule) * Math.min(420, size * 3.2)).toFixed(0)}px`, borderRadius: 2, background: 'var(--color-data)'}} />
      </div>
      {sub && <div style={{marginTop: 18, maxWidth: 760, fontFamily: 'var(--font-sans)', fontSize: 30, lineHeight: 1.3, color: 'var(--color-muted)'}}>{sub}</div>}
    </div>
  );
}
