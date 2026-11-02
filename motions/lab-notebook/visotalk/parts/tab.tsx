export const meta = {
  name: {en: 'Index tab', 'zh-CN': '索引便签'},
  purpose: 'transition',
  line: 'A coloured paper tab stuck to the page with a strip of tape, marking a place to come back to.',
  fits: 'the question a section answers; a result to remember; a page that changes topic',
  params: {
    text: {type: 'text', doc: 'one to three words'},
    color: {type: 'yellow | green | blue | violet', default: 'yellow', doc: 'the tab\'s paper'},
    tilt: {type: 'degrees', default: 3, doc: 'how it was stuck on'},
  },
  preview: 17.6,
};

const PAPER = {yellow: 'var(--vt-warn)', green: 'var(--vt-good)', blue: 'var(--vt-data)', violet: 'var(--vt-op)'};

export function Tab({text, color = 'yellow', tilt = 3}: {text: string; color?: keyof typeof PAPER; tilt?: number}) {
  const dark = color !== 'yellow';
  return (
    // the room above is for the tape
    <div style={{paddingTop: 20, display: 'inline-block'}}>
    <div style={{position: 'relative', display: 'inline-block', transform: `rotate(${tilt}deg)`, padding: '14px 30px 16px', background: PAPER[color],
      boxShadow: '0 6px 12px -8px rgba(20,30,50,0.55)', fontFamily: 'var(--vt-display)', fontSize: 40, fontWeight: 600, color: dark ? 'var(--vt-panel)' : 'var(--vt-text)', whiteSpace: 'nowrap'}}>
      <div style={{position: 'absolute', left: '50%', top: -16, width: 96, height: 30, marginLeft: -48, background: 'rgba(255,255,255,0.55)', transform: 'rotate(-4deg)',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'}} />
      {text}
    </div>
    </div>
  );
}
