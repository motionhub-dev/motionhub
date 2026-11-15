export const meta = {
  name: {en: 'Callout', 'zh-CN': '断语'},
  purpose: 'quote',
  line: 'One sentence in the display face, bracketed by two green corners, tracking tighter as it arrives.',
  fits: 'the claim a section ends on; one sentence, not a paragraph',
  params: {
    text: {type: 'text', doc: 'the sentence'},
    arrive: {type: 'progress', default: 1, doc: '0 open and wide, 1 locked, with the corners drawn'},
    width: {type: 'px', default: 820, doc: 'the block\'s width'},
  },
  preview: 18.4,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));

export function Callout({text, arrive = 1, width = 820}: {text: string; arrive?: number; width?: number}) {
  const a = unit(arrive);
  const arm = Math.round(32 * a);
  return (
    <div style={{width, position: 'relative', boxSizing: 'border-box', padding: '32px 40px', opacity: 0.15 + 0.85 * a}}>
      <svg width={arm} height={arm} style={{position: 'absolute', left: 0, top: 0}}><path d={`M${arm} 2H2V${arm}`} fill="none" stroke="var(--color-data)" strokeWidth={3} /></svg>
      <svg width={arm} height={arm} style={{position: 'absolute', right: 0, bottom: 0}}><path d={`M1 ${arm - 2}H${arm - 1}V1`} fill="none" stroke="var(--color-data)" strokeWidth={3} /></svg>
      <div style={{fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 52, lineHeight: 1.12, letterSpacing: `${(0.06 - 0.08 * a).toFixed(3)}em`, color: 'var(--color-text)'}}>{text}</div>
    </div>
  );
}
