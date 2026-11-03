import {C, SANS, glide} from './night.ts';

export const meta = {
  name: {en: 'Question heading', 'zh-CN': '问题标题'},
  purpose: 'title',
  line: "The scene's question in heavy white, top left and out of the picture's way, with one quiet line below it.",
  fits: "stating what the scene answers",
  params: {
    text: {type: 'string', doc: 'the question'},
    sub: {type: 'string', doc: 'one short line under it'},
    at: {type: '[x, y]', default: '[64, 44]', doc: 'its top left'},
    size: {type: 'number', default: 76, doc: 'font size in px'},
    show: {type: 'progress', default: 1, doc: 'it arrives'},
    sharp: {type: 'progress', default: 1, doc: 'the sub line arrives'},
  },
  preview: 2,
};

export function Heading({text, sub, at = [80, 44], size = 76, show = 1, sharp = 1}: {text: string; sub?: string; at?: [number, number]; size?: number; show?: number; sharp?: number}) {
  const k = glide(show), s = glide(sharp);
  return (
    <div style={{position: 'absolute', left: at[0], top: at[1], fontFamily: SANS, opacity: k, transform: `translateY(${(1 - k) * 14}px)`, textShadow: '0 2px 20px rgba(5,10,32,0.8)'}}>
      <div style={{fontSize: size, fontWeight: 800, lineHeight: 1.15, color: C.ink}}>{text}</div>
      {sub && <div style={{fontSize: size * 0.42, fontWeight: 500, color: C.read, marginTop: 6, opacity: s}}>{sub}</div>}
    </div>
  );
}
