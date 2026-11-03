export const meta = {
  name: {en: 'Question', 'zh-CN': '问题标题'},
  purpose: 'title',
  line: "The question in heavy white, top left, over the dark of the lab; it leaves once the light is on.",
  fits: "stating what the experiment will answer",
  params: {
    text: {type: 'string', doc: 'the question'},
    at: {type: '[x, y]', default: '[80, 64]', doc: 'its top left'},
    size: {type: 'number', default: 72, doc: 'its size in px'},
    show: {type: 'progress', default: 1, doc: 'it arrives and leaves'},
  },
  preview: 1,
};

export function Heading({text, at = [80, 64], size = 72, show = 1}: {text: string; at?: [number, number]; size?: number; show?: number}) {
  return <div style={{position: 'absolute', left: at[0], top: at[1], opacity: show, transform: `translateY(${(1 - show) * 10}px)`, fontFamily: 'var(--font-display)', fontSize: size, fontWeight: 800, lineHeight: 1.1, color: '#FFFFFF', whiteSpace: 'nowrap'}}>{text}</div>;
}
