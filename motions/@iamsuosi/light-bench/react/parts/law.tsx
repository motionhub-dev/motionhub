export const meta = {
  name: {en: 'Law line', 'zh-CN': '公式行'},
  purpose: 'term',
  line: "The one law at work, set in mono on a thin rule with a word on what it says, so the viewer knows the picture is calculated.",
  fits: "Snell's law, the thin-lens equation, the one formula a film rests on",
  params: {
    at: {type: '[x, y]', doc: 'its top left, in px'},
    law: {type: 'ReactNode', doc: 'the formula; use <sub> for subscripts'},
    says: {type: 'string', doc: 'what it says, in a few plain words'},
    show: {type: 'progress', default: 1, doc: 'it arrives'},
  },
  preview: 8.6,
};

export function Law({at, law, says, show = 1}: {at: [number, number]; law: React.ReactNode; says?: string; show?: number}) {
  if (show <= 0) return null;
  return (
    <div style={{position: 'absolute', left: at[0], top: at[1], opacity: show, borderTop: '2px solid #5B6572', paddingTop: 10}}>
      <div style={{fontFamily: 'var(--font-mono)', fontSize: 40, lineHeight: '50px', color: '#FFFFFF', whiteSpace: 'nowrap'}}>{law}</div>
      {says && <div style={{fontFamily: 'var(--font-sans)', fontSize: 28, lineHeight: '36px', color: '#B9C2CE', whiteSpace: 'nowrap'}}>{says}</div>}
    </div>
  );
}
