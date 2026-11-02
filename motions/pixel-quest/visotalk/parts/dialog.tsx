import {useDocTime} from '@visotalk/runtime';
import {C, Screen, Window, Words, TEXT, px, steps, twos} from './pixel.ts';

export const meta = {
  name: {en: 'Dialogue box', 'zh-CN': '对话框'},
  purpose: 'quote',
  line: 'A window with a cut-corner frame and a gold name tab; its words type in, and a gold pip hops when done.',
  fits: 'a step\'s one rule, a tip, a command; a few words, never the narration',
  params: {
    text: {type: 'text', doc: 'the words, at most about 30 characters a row; | starts a new row'},
    name: {type: 'text', default: 'TIP', doc: 'the tab\'s word: who or what speaks (TIP, RULE, GUIDE, a name)'},
    x: {type: 'px', default: 120, doc: 'the window\'s left edge, in game pixels'},
    y: {type: 'px', default: 48, doc: 'its top edge, in game pixels'},
    w: {type: 'px', default: 240, doc: 'its width, in game pixels'},
    open: {type: 'progress', default: 0, doc: '0 to 1: the window unfolds from its middle row in four steps'},
    typed: {type: 'progress', default: 0, doc: '0 to 1: how much of the text has typed in; tween it linearly, about 15 characters a second'},
    mark: {type: 'text', default: '', doc: 'a word typed in gold, if one word of the text is the key (it must occur in the text)'},
  },
  preview: 22.3,
};

export function Dialog({text, name = 'TIP', x = 120, y = 48, w = 240, open = 0, typed = 0, mark = ''}: {text: string; name?: string; x?: number; y?: number; w?: number; open?: number; typed?: number; mark?: string}) {
  const t = useDocTime();
  const rows = text.split('|');
  const h = 14 + rows.length * 16;
  const o = steps(open, 4);
  if (o <= 0) return null;
  const hh = Math.max(4, Math.round((h * o) / 2) * 2);
  const top = px(y + (h - hh) / 2);
  const total = rows.reduce((a, r) => a + r.length, 0);
  let left = Math.floor(steps(typed, Math.max(1, total)) * total);
  const done = typed >= 1;
  const pip = done ? [0, 1, 2, 1][Math.floor(twos(t) / 2) % 4] : 0;   // the pip hops two pixels, a step every two drawings
  return (
    <Screen>
      <Window x={x} y={top} w={w} h={hh} />
      {o >= 1 && (
        <g>
          <rect x={px(x) + 8} y={px(y) - 6} width={name.length * 6 + 9} height={11} fill={C.ink} />
          <rect x={px(x) + 9} y={px(y) - 5} width={name.length * 6 + 7} height={9} fill={C.gold} />
          <Words x={px(x) + 13} y={px(y) + 2} size={8} weight={700} color={C.ink} outline={null}>{name}</Words>
          {rows.map((row, i) => {
            const n = Math.max(0, Math.min(row.length, left));
            left -= row.length;
            const at = mark ? row.indexOf(mark) : -1;
            const ry = px(y) + 22 + i * 16;
            if (at < 0) return <Words key={i} x={px(x) + 10} y={ry} size={12} font={TEXT} outline={null} color={C.bone} chars={n}>{row}</Words>;
            return (
              <text key={i} x={px(x) + 10} y={ry} fontFamily={TEXT} fontSize={12} fill={C.bone} style={{whiteSpace: 'pre'}}>
                {row.slice(0, Math.min(n, at))}
                <tspan fill={C.gold}>{row.slice(at, Math.max(at, Math.min(n, at + mark.length)))}</tspan>
                {row.slice(at + mark.length, Math.max(at + mark.length, n))}
              </text>
            );
          })}
          {done && <path d={`M${px(x) + w - 14} ${px(y) + h - 12 - pip}h5v1h-1v1h-1v1h-1v-1h-1v-1h-1z`} fill={C.gold} />}
        </g>
      )}
    </Screen>
  );
}
