import {litStyle} from './light.ts';

export const meta = {
  name: {en: 'Kicker and title', 'zh-CN': '眉题与标题'},
  purpose: 'title',
  line: 'A short line in the light\'s colour, spaced wide, over a title in tall condensed capitals.',
  fits: 'the claim a section makes; a result stated as a headline; the question a film opens on',
  params: {
    eyebrow: {type: 'text', default: '', doc: 'the short line above'},
    title: {type: 'text', doc: 'a few words'},
    size: {type: 'px', default: 150, doc: 'the title\'s height'},
    lit: {type: 'progress', default: 1, doc: '1 in the light, 0 in the shadow'},
  },
  preview: 25.6,
};

export function Kicker({eyebrow = '', title, size = 150, lit = 1}: {eyebrow?: string; title: string; size?: number; lit?: number}) {
  return (
    <div style={litStyle(lit)}>
      {eyebrow && <div style={{fontFamily: 'var(--vt-sans)', fontSize: 26, fontWeight: 600, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--vt-data)', marginBottom: 18}}>{eyebrow}</div>}
      <div style={{fontFamily: 'var(--vt-display)', fontSize: size, fontWeight: 800, lineHeight: 0.92, textTransform: 'uppercase', color: 'var(--vt-text)'}}>{title}</div>
    </div>
  );
}
