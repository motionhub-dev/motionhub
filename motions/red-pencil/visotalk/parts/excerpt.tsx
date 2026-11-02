export const meta = {
  name: {en: 'Printed excerpt', 'zh-CN': '原文摘录'},
  purpose: 'quote',
  line: 'A passage set as quoted print with its source, the phrase that decides underlined in red as it is read.',
  fits: 'the clause of a contract; the sentence of a rule or a report; what an advert actually promises',
  params: {
    text: {type: 'text', doc: 'the passage, a sentence or two, as printed'},
    mark: {type: 'text', default: '', doc: 'the phrase inside it to underline, exactly as it appears in the text'},
    draw: {type: 'progress', default: 0, doc: '0 to 1: how much of the underline is drawn'},
    source: {type: 'text', default: '', doc: 'where it comes from, in small capitals under it'},
    size: {type: 'px', default: 52, doc: 'the passage\'s size'},
  },
  preview: 9,
};

export function Excerpt({text, mark = '', draw = 0, source = '', size = 52}: {text: string; mark?: string; draw?: number; source?: string; size?: number}) {
  const at = mark ? text.indexOf(mark) : -1;
  const d = Math.max(0, Math.min(1, draw));
  const marked = at < 0 ? text : (
    <>
      {text.slice(0, at)}
      {/* the underline grows under the phrase, across a line break if it wraps */}
      <span style={{backgroundImage: 'linear-gradient(var(--vt-grad), var(--vt-grad))', backgroundRepeat: 'no-repeat', backgroundPosition: '0 100%',
        backgroundSize: `${(d * 100).toFixed(1)}% 5px`, paddingBottom: 4, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>{mark}</span>
      {text.slice(at + mark.length)}
    </>
  );
  return (
    <figure style={{margin: 0, paddingLeft: 36, borderLeft: '3px solid var(--vt-text)', fontFamily: 'var(--vt-sans)', color: 'var(--vt-text)'}}>
      <blockquote style={{margin: 0, fontSize: size, lineHeight: 1.4, fontStyle: 'italic'}}>{marked}</blockquote>
      {source && <figcaption style={{marginTop: 22, fontSize: 24, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--vt-muted)'}}>{source}</figcaption>}
    </figure>
  );
}
