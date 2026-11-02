import {RED, label, unit} from './package.ts';

export const meta = {
  name: {en: 'Stinger', 'zh-CN': '转场条带'},
  purpose: 'transition',
  line: 'The one full-frame move: slanted white, red and ink bands sweep across, cover the cut with a huge word, and sweep on.',
  fits: 'studio to archive; the next story; results',
  params: {
    word: {type: 'text', doc: 'the word on the red, one or two short words: REPLAY, NEXT, RESULTS'},
    line: {type: 'text', default: '', doc: 'a small line under it: what follows'},
    pass: {type: 'progress', default: 0, doc: '0 to 1: the bands enter (to 0.4), cover the frame (0.4 to 0.6), leave (to 1); put the cut at 0.5'},
  },
  preview: 22.2,
};

const H = 1080, LEAN = 320;
const easeOut = (t: number) => 1 - (1 - unit(t)) ** 3;
const easeIn = (t: number) => unit(t) ** 3;
/** The bands' leading edge (at the frame's foot) as the pass runs: whoosh in, hang over the cut, whoosh out */
const lead = (p: number) => p < 0.4 ? -LEAN + (1960 + LEAN) * easeOut(p / 0.4) : p < 0.6 ? 1960 + 140 * ((p - 0.4) / 0.2) : 2100 + (4136 - 2100) * easeIn((p - 0.6) / 0.4);
/** A band between two x positions at the frame's foot, leaning forward by LEAN at the top */
const band = (a: number, b: number) => `polygon(${a + LEAN}px 0, ${b + LEAN}px 0, ${b}px ${H}px, ${a}px ${H}px)`;

/** Full frame: <Part x={0} y={0} w={1920} h={1080}>. Tween `pass` 0 to 1 over about 2 s (linear), centred on the cut. */
export function Sting({word, line = '', pass = 0}: {word: string; line?: string; pass?: number}) {
  if (pass <= 0 || pass >= 1) return null;
  const L = lead(pass);
  // from the leading edge back: a white rule, the red body, an ink band, a last white rule
  const white = band(L - 30, L), red = band(L - 2430, L - 30), ink = band(L - 2520, L - 2430), tail = band(L - 2536, L - 2520);
  const drift = (L - 2030) * 0.3;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', inset: 0, background: 'var(--vt-bg)', clipPath: ink}} />
      <div style={{position: 'absolute', inset: 0, background: 'var(--vt-text)', clipPath: tail}} />
      <div data-vt-camera="" style={{position: 'absolute', inset: 0, overflow: 'hidden', background: RED, clipPath: red}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateX(${drift.toFixed(1)}px)`}}>
          <div style={{...label, fontSize: 300, fontWeight: 900, letterSpacing: '0.02em', color: '#FFFFFF', lineHeight: 0.9, whiteSpace: 'nowrap'}}>{word}</div>
          {line && <div style={{...label, fontSize: 48, fontWeight: 800, letterSpacing: '0.24em', color: 'var(--vt-bg)', marginTop: 26, whiteSpace: 'nowrap'}}>{line}</div>}
        </div>
      </div>
      <div style={{position: 'absolute', inset: 0, background: 'var(--vt-text)', clipPath: white}} />
    </div>
  );
}
