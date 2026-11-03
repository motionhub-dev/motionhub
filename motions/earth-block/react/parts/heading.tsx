import {C, DISPLAY, SANS, settle} from './earth.ts';

export const meta = {
  name: {en: 'Plate title', 'zh-CN': '图版标题'},
  purpose: 'title',
  line: "The question in a heavy old-style serif, top left of the plate, with one plain line under it.",
  fits: "stating what the plate answers",
  params: {
    text: {type: 'string', doc: 'the question'},
    sub: {type: 'string', doc: 'one line under it'},
    at: {type: '[x, y]', default: '[80, 56]', doc: 'its top left'},
    size: {type: 'number', default: 76, doc: 'its size in px'},
    show: {type: 'progress', default: 1, doc: 'it arrives'},
  },
  preview: 2,
};

export function Heading({text, sub, at = [80, 56], size = 76, show = 1}: {text: string; sub?: string; at?: [number, number]; size?: number; show?: number}) {
  const k = settle(show);
  return (
    <div style={{position: 'absolute', left: at[0], top: at[1], opacity: k, transform: `translateY(${(1 - k) * 12}px)`}}>
      <div style={{fontFamily: DISPLAY, fontSize: size, fontWeight: 800, lineHeight: 1.1, color: C.ink}}>{text}</div>
      {sub && <div style={{fontFamily: SANS, fontSize: size * 0.42, color: C.read, marginTop: 10}}>{sub}</div>}
    </div>
  );
}
