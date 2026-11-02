import {stage, tag} from './ink.ts';

export const meta = {
  name: {en: 'Headline', 'zh-CN': '要点句'},
  purpose: 'title',
  line: 'The point of a passage in a few words on a tag, the key words underlined in teal as they are said.',
  fits: 'what the speaker concludes; the question the video answers',
  params: {
    text: {type: 'text', doc: 'the line, at most about a dozen words'},
    mark: {type: 'text', default: '', doc: 'the words in it to underline'},
    under: {type: 'progress', default: 0, doc: '0 to 1: the underline runs under the marked words'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the tag opens'},
    width: {type: 'px', default: 900, doc: 'the widest it goes before wrapping'},
  },
  preview: 25.9,
};

export function Headline({text, mark = '', under = 0, show = 1, width = 900}: {text: string; mark?: string; under?: number; show?: number; width?: number}) {
  const open = stage(show, 0, 1), line = stage(under, 0, 1);
  const at = mark ? text.indexOf(mark) : -1;
  const parts = at < 0 ? [text] : [text.slice(0, at), mark, text.slice(at + mark.length)];
  return (
    <div style={{...tag, display: 'inline-block', maxWidth: width, padding: '22px 32px 26px', opacity: open, transform: `translateY(${(1 - open) * 20}px)`,
      fontFamily: 'var(--vt-display)', fontSize: 58, fontWeight: 800, lineHeight: 1.18, color: 'var(--vt-text)'}}>
      {parts.map((p, i) => i === 1 ? (
        <span key={i} style={{backgroundImage: 'linear-gradient(var(--vt-data), var(--vt-data))', backgroundRepeat: 'no-repeat', backgroundPosition: '0 92%', backgroundSize: `${(100 * line).toFixed(1)}% 8px`}}>{p}</span>
      ) : <span key={i}>{p}</span>)}
    </div>
  );
}
