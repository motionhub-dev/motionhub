export const meta = {
  name: {en: 'Printed headline', 'zh-CN': '印刷标题'},
  purpose: 'title',
  line: 'A kicker, a serif headline and a one-line standfirst, set as a page sets them, before the pencil gets to them.',
  fits: 'the question a film checks; the claim a section is about to test',
  params: {
    kicker: {type: 'text', default: '', doc: 'a few words in small capitals above'},
    title: {type: 'text', doc: 'the headline, at most about eight words'},
    deck: {type: 'text', default: '', doc: 'the standfirst, one line in italic'},
    size: {type: 'px', default: 88, doc: 'the headline size'},
  },
  preview: 2.2,
};

export function Headline({kicker = '', title, deck = '', size = 88}: {kicker?: string; title: string; deck?: string; size?: number}) {
  return (
    <div style={{fontFamily: 'var(--vt-sans)', color: 'var(--vt-text)'}}>
      {kicker && <div style={{fontSize: 24, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--vt-muted)', marginBottom: 18}}>{kicker}</div>}
      <div style={{fontSize: size, lineHeight: 1.05, fontWeight: 600, letterSpacing: '-0.01em'}}>{title}</div>
      {deck && <div style={{fontSize: Math.round(size * 0.4), lineHeight: 1.3, fontStyle: 'italic', color: 'var(--vt-muted)', marginTop: 22}}>{deck}</div>}
    </div>
  );
}
