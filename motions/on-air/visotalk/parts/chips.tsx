import {stage, tag} from './ink.ts';

export const meta = {
  name: {en: 'Chips', 'zh-CN': '条目'},
  purpose: 'steps',
  line: 'Short items in a row of tags, each opening when it is named; the one being said has the teal edge.',
  fits: 'two to five things listed aloud: uses, features, reasons',
  params: {
    items: {type: 'list', doc: 'the items, a few words each'},
    shown: {type: 'number', default: 0, doc: 'how many are out: tween it up by one on each item\'s word'},
    focus: {type: 'number', default: -1, doc: 'the index of the one being said, or -1 for none'},
    column: {type: 'boolean', default: false, doc: 'stack them instead of a row'},
  },
  preview: 6.5,
};

export function Chips({items, shown = 0, focus = -1, column = false}: {items: string[]; shown?: number; focus?: number; column?: boolean}) {
  return (
    <div style={{display: 'flex', flexDirection: column ? 'column' : 'row', alignItems: 'flex-start', gap: 16}}>
      {items.map((item, i) => {
        const open = stage(shown - i, 0, 1);
        const on = Math.round(focus) === i;
        return (
          <div key={item} style={{...tag, padding: '14px 24px', borderLeft: `8px solid ${on ? 'var(--vt-data)' : 'var(--vt-faint)'}`, fontFamily: 'var(--vt-sans)', fontSize: 40, fontWeight: 700,
            color: on || focus < 0 ? 'var(--vt-text)' : 'var(--vt-muted)', whiteSpace: 'nowrap', opacity: open, transform: `translateY(${(1 - open) * 18}px)`}}>{item}</div>
        );
      })}
    </div>
  );
}
