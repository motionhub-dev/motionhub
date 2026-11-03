import {C, DISPLAY, glide} from './plumb.ts';

export const meta = {
  name: {en: 'Question', 'zh-CN': '问题标题'},
  purpose: 'title',
  line: "The question in a heavy old-style serif, top left of the first sheet, gone as soon as the line starts down.",
  fits: "stating what the descent will answer",
  params: {
    text: {type: 'string', doc: 'the question'},
    at: {type: '[x, y]', default: '[80, 60]', doc: 'its top left'},
    size: {type: 'number', default: 72, doc: 'its size in px'},
    color: {type: 'string', doc: 'its colour'},
    show: {type: 'progress', default: 1, doc: 'it arrives and leaves'},
  },
  preview: 1.2,
};

export function Heading({text, at = [80, 60], size = 72, color = C.ink, show = 1}: {text: string; at?: [number, number]; size?: number; color?: string; show?: number}) {
  const k = glide(show);
  return <div style={{position: 'absolute', left: at[0], top: at[1], opacity: k, transform: `translateY(${(1 - k) * 12}px)`, fontFamily: DISPLAY, fontSize: size, fontWeight: 800, lineHeight: 1.1, color, whiteSpace: 'nowrap'}}>{text}</div>;
}
