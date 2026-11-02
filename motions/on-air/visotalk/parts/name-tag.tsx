import {eyebrow, stage, tag, wipe} from './ink.ts';

export const meta = {
  name: {en: 'Name tag', 'zh-CN': '名牌条'},
  purpose: 'term',
  line: 'A lower-third tag naming who or what is on screen: a teal edge rises, then the tag wipes open.',
  fits: 'a person introduced; a product or model named; a place the shot shows',
  params: {
    name: {type: 'text', doc: 'the name, as it should be read'},
    role: {type: 'text', default: '', doc: 'one line over it: a title, a maker, a year'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the edge rises, then the tag opens'},
    width: {type: 'px', default: 640, doc: 'the tag\'s width'},
  },
  preview: 22.6,
};

export function NameTag({name, role = '', show = 1, width = 640}: {name: string; role?: string; show?: number; width?: number}) {
  const edge = stage(show, 0, 0.35), open = stage(show, 0.25, 1);
  return (
    <div style={{position: 'relative', width, display: 'flex', alignItems: 'stretch'}}>
      <div style={{width: 10, background: 'var(--vt-data)', transform: `scaleY(${edge})`, transformOrigin: 'bottom'}} />
      <div style={{...tag, ...wipe(open), borderRadius: '0 4px 4px 0', padding: '18px 28px 20px', flex: 1, boxSizing: 'border-box'}}>
        {role && <div style={{...eyebrow, marginBottom: 8}}>{role}</div>}
        <div style={{fontFamily: 'var(--vt-sans)', fontSize: 50, fontWeight: 700, lineHeight: 1.1, color: 'var(--vt-text)'}}>{name}</div>
      </div>
    </div>
  );
}
