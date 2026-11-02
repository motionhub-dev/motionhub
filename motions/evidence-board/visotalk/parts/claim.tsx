export const meta = {
  name: {en: 'Claim slip', 'zh-CN': '待查说法'},
  purpose: 'open',
  line: 'The claim as people repeat it, on a torn slip with no source tag.',
  fits: 'the opening of a fact-check: a misquote, a shared figure, a wrong date',
  params: {
    claim: {type: 'text', doc: 'the claim, word for word as it circulates, without quotation marks (they are printed)'},
    who: {type: 'text', default: 'As usually quoted', doc: 'who repeats it, in small capitals: "As usually quoted", "As shared online"'},
    width: {type: 'px', default: 700, doc: 'the slip\'s width in board pixels'},
  },
  preview: 5.2,
};

// a torn bottom edge: a jagged polygon, the same every frame
const TEAR = Array.from({length: 25}, (_, i) => `${(100 - (i * 100) / 24).toFixed(2)}% ${(91 + ((i * 37) % 7) * 1.4).toFixed(1)}%`).join(', ');

export function Claim({claim, who = 'As usually quoted', width = 700}: {claim: string; who?: string; width?: number}) {
  return (
    <div style={{width, padding: '30px 38px 52px', background: 'var(--vt-panel2)', clipPath: `polygon(0 0, 100% 0, ${TEAR})`, color: 'var(--vt-bg)'}}>
      <div style={{fontFamily: 'var(--vt-sans)', fontSize: 19, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6}}>{who}</div>
      <div style={{fontFamily: 'var(--vt-display)', fontStyle: 'italic', fontSize: 54, lineHeight: 1.12, marginTop: 12, letterSpacing: '-0.01em'}}>“{claim}”</div>
    </div>
  );
}
