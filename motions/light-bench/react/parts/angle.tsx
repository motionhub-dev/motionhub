import {toScreen, type View} from './bench.tsx';
import {dirOf, type P2} from './optics.ts';

export const meta = {
  name: {en: 'Measured angle', 'zh-CN': '角度弧'},
  purpose: 'mark',
  line: "A thin arc drawn in the plane of the beams between two directions, seen in true perspective, with its size in degrees at the end of it.",
  fits: "how far a beam turned, how wide a fan is, the angle in the law",
  params: {
    view: {type: 'View', doc: "the bench's camera, the same object"},
    at: {type: '[x, z]', doc: 'its centre, on the table'},
    y: {type: 'number', default: 1.2, doc: 'its height: the height of the beams'},
    from: {type: 'number', doc: 'one direction, in degrees: as the lamp is aimed'},
    to: {type: 'number', doc: 'the other direction, in degrees'},
    r: {type: 'number', default: 3, doc: 'its radius, in table units'},
    text: {type: 'string', doc: 'what the angle is'},
    t: {type: 'progress', default: 1, doc: 'it draws from `from` to `to`, then its words arrive'},
  },
  preview: 8.6,
};

const clamp = (v: number) => Math.min(1, Math.max(0, v));

export function Angle({view, at, y = 1.2, from, to, r = 3, text, t = 1}: {view: View; at: P2; y?: number; from: number; to: number; r?: number; text?: string; t?: number}) {
  if (t <= 0) return null;
  const k = clamp(t * 1.6), words = clamp((t - 0.6) / 0.4);
  const pt = (deg: number, radius = r) => { const d = dirOf(deg); return toScreen(view, [at[0] + d[0] * radius, y, at[1] + d[1] * radius]); };
  const arc = Array.from({length: 25}, (_, i) => pt(from + ((to - from) * k * i) / 24));
  const mark = pt(to + Math.sign(to - from) * 9, r + 0.4);
  return (
    <>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <path d={'M' + arc.map(([a, b]) => `${a.toFixed(1)} ${b.toFixed(1)}`).join('L')} fill="none" stroke="#FFFFFF" strokeWidth={2.5} />
      </svg>
      {text && <div style={{position: 'absolute', left: mark[0] - 150, width: 300, top: mark[1] - 20, opacity: words, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 28, lineHeight: '36px', color: '#FFFFFF', whiteSpace: 'nowrap', textShadow: '0 1px 8px #050608'}}>{text}</div>}
    </>
  );
}
