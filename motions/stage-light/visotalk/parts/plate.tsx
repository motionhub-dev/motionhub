import {litStyle, unit} from './light.ts';

export const meta = {
  name: {en: 'Plate', 'zh-CN': '名牌'},
  purpose: 'term',
  line: 'A dark plate naming one thing, its top edge catching the light while it is the subject.',
  fits: 'a product, a company, a person or a year that the narration compares; one plate per thing, the same plate for it throughout',
  params: {
    title: {type: 'text', doc: 'the name, short'},
    sub: {type: 'text', default: '', doc: 'one line under it: a year, a maker, a role'},
    lit: {type: 'progress', default: 1, doc: '1 in the light, 0 in the shadow'},
    width: {type: 'px', default: 640, doc: 'the plate\'s width'},
  },
  preview: 3.2,
};

export function Plate({title, sub = '', lit = 1, width = 640}: {title: string; sub?: string; lit?: number; width?: number}) {
  const l = unit(lit);
  return (
    <div style={{...litStyle(lit), position: 'relative', width, boxSizing: 'border-box', padding: '30px 36px 32px', background: 'var(--vt-panel)', borderRadius: 6,
      boxShadow: `inset 0 1px 0 color-mix(in srgb, var(--vt-text) 14%, transparent), 0 24px 50px -30px rgba(0,0,0,0.9)`}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 4, borderRadius: '6px 6px 0 0', background: 'var(--vt-data)', opacity: l}} />
      <div style={{fontFamily: 'var(--vt-display)', fontSize: 72, fontWeight: 800, lineHeight: 1, textTransform: 'uppercase', color: 'var(--vt-text)', letterSpacing: '0.01em'}}>{title}</div>
      {sub && <div style={{fontFamily: 'var(--vt-sans)', fontSize: 30, color: 'var(--vt-muted)', marginTop: 14}}>{sub}</div>}
    </div>
  );
}
