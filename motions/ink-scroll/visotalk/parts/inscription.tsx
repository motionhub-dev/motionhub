import {TONE, ease, fid, type Tone} from './ink.ts';

export const meta = {
  name: {en: 'Inscription', 'zh-CN': '题字'},
  purpose: 'title',
  line: 'Words written on the painting in columns, right to left, each character soaking in as it is written.',
  fits: 'the title of the scroll; a name or a place where it is painted; a line worth keeping',
  params: {
    text: {type: 'text', doc: 'the words; a new line starts a new column to the left'},
    sub: {type: 'text', default: '', doc: 'a smaller column after it, as a painter signs: a date, a source, a person'},
    write: {type: 'progress', default: 1, doc: '0 to 1: how many characters are written; tween it while the words are said'},
    size: {type: 'px', default: 72, doc: 'the character size'},
    vertical: {type: 'boolean', default: true, doc: 'columns, as an inscription is written; false for one line across'},
    tone: {type: 'clear | light | heavy | thick | burnt', default: 'burnt', doc: 'how dark the ink is'},
  },
  preview: 2.9,
};

export function Inscription({text, sub = '', write = 1, size = 72, vertical = true, tone = 'burnt'}: {text: string; sub?: string; write?: number; size?: number; vertical?: boolean; tone?: Tone}) {
  const id = fid('script', 'inscription');
  const chars = [...text.replace(/\n/g, '')].length + [...sub].length;
  let n = 0;
  // each character arrives as wet ink: soft and pale, then sharp as the paper takes it
  const glyph = (c: string, key: string) => {
    const p = ease(write * chars - n++, 0, 1.4);
    return <span key={key} style={{opacity: p, filter: p < 1 ? `blur(${((1 - p) * 4).toFixed(2)}px)` : undefined}}>{c}</span>;
  };
  const columns = text.split('\n').map((col, i) => <div key={i}>{[...col].map((c, j) => glyph(c, `${i}.${j}`))}</div>);
  return (
    <div style={{position: 'absolute', left: vertical ? undefined : 0, right: vertical ? 0 : undefined, top: 0, writingMode: vertical ? 'vertical-rl' : 'horizontal-tb', fontFamily: 'var(--vt-display)', color: 'var(--vt-text)', filter: `url(#${id})`}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="2" seed="21" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div style={{fontSize: size, lineHeight: 1.3, letterSpacing: vertical ? '0.08em' : '0.02em', opacity: TONE[tone], whiteSpace: 'nowrap'}}>{columns}</div>
      {sub && <div style={{fontSize: Math.round(size * 0.42), lineHeight: 1.6, letterSpacing: '0.12em', opacity: TONE.heavy, whiteSpace: 'nowrap', [vertical ? 'paddingTop' : 'paddingLeft']: size * 1.2, [vertical ? 'marginRight' : 'marginTop']: size * 0.25}}>{[...sub].map((c, j) => glyph(c, `s${j}`))}</div>}
    </div>
  );
}
