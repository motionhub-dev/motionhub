export const meta = {
  name: {en: 'Taped clipping', 'zh-CN': '剪报'},
  purpose: 'quote',
  line: 'A printed scrap taped to the page: a quotation, a line of a document or a fact from a source, with where it came from under it.',
  fits: 'what someone said; a line of a law or a report; a source for a claim; anything too long to write by hand',
  params: {
    text: {type: 'text', doc: 'the words, one to three short sentences'},
    source: {type: 'text', default: '', doc: 'who said it or where it is from'},
    width: {type: 'px', default: 720, doc: 'the scrap\'s width; its height follows the words'},
    size: {type: 'px', default: 36, doc: 'the print\'s size'},
    tilt: {type: 'degrees', default: -1.5, doc: 'how it was stuck on'},
  },
  preview: 27.5,
};

export function Clipping({text, source = '', width = 720, size = 36, tilt = -1.5}: {text: string; source?: string; width?: number; size?: number; tilt?: number}) {
  return (
    <div style={{paddingTop: 20, display: 'inline-block'}}>
      <div style={{position: 'relative', width, boxSizing: 'border-box', transform: `rotate(${tilt}deg)`, padding: '28px 34px 26px', background: 'var(--color-panel2)', boxShadow: '0 6px 14px -8px rgba(20,30,50,0.55)', fontFamily: 'var(--font-sans)', color: 'var(--color-text)'}}>
        <div style={{position: 'absolute', left: '50%', top: -16, width: 110, height: 30, marginLeft: -55, background: 'rgba(255,255,255,0.55)', transform: 'rotate(-3deg)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'}} />
        <div style={{fontSize: size, lineHeight: 1.35}}>{text}</div>
        {source && <div style={{marginTop: 14, fontSize: Math.max(24, size * 0.72), lineHeight: 1.25, color: 'var(--color-muted)'}}>{source}</div>}
      </div>
    </div>
  );
}
