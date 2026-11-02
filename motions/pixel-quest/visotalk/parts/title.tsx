import {useDocTime} from '@visotalk/runtime';
import {C, Screen, Words, TEXT, steps, twos} from './pixel.ts';

export const meta = {
  name: {en: 'Title screen', 'zh-CN': '标题画面'},
  purpose: 'open',
  line: 'The title as a game\'s: gold letters drop in one by one, a glint runs across them.',
  fits: 'the opening of a how-to or a lesson',
  params: {
    title: {type: 'text', doc: 'the title, about twelve letters a row; | starts a second row'},
    sub: {type: 'text', default: '', doc: 'what the run holds, a short line: 3 STAGES + 1 BOSS'},
    y: {type: 'px', default: 76, doc: 'the first row\'s baseline, in game pixels'},
    drop: {type: 'progress', default: 0, doc: '0 to 1: the letters fall into place one after another'},
    shine: {type: 'progress', default: 0, doc: '0 to 1: a glint runs across the letters, one letter a drawing, turning each bone as it passes'},
    leave: {type: 'progress', default: 0, doc: '0 to 1: the title dissolves away in an ordered dither of whole rows'},
  },
  preview: 2.3,
};

export function Title({title, sub = '', y = 76, drop = 0, shine = 0, leave = 0}: {title: string; sub?: string; y?: number; drop?: number; shine?: number; leave?: number}) {
  const t = useDocTime();
  if (drop <= 0 || leave >= 1) return null;
  const rows = title.split('|');
  const count = rows.reduce((a, r) => a + r.length, 0);
  let k = 0;
  const gone = steps(leave, 6);
  const glint = shine > 0 && shine < 1 ? steps(shine, count + 6) * (count + 6) - 3 : -99;   // the letter the glint is on
  return (
    <Screen>
      <g opacity={1}>
        {rows.map((row, r) => {
          const size = r === 0 ? 32 : 24;
          const adv = size === 32 ? 28 : 21;
          const width = row.length * adv;
          return [...row].map((ch, i) => {
            const idx = k;
            const at = (k++ / count) * 0.7;
            const s = Math.min(1, Math.max(0, (drop - at) / 0.3));
            if (s <= 0 || ch === ' ') return null;
            const fall = [-24, -14, -6, 0, -3, 0][Math.min(5, Math.floor(s * 6))];
            if (gone > 0 && ((i + r * 3) % 6) / 6 < gone) return null;
            return <Words key={`${r}-${i}`} x={240 - width / 2 + i * adv + adv / 2} y={y + r * 38 + fall} size={size} weight={700} anchor="middle" color={Math.abs(idx - glint) < 1 ? C.bone : Math.abs(idx - glint) < 2 ? '#FFE596' : C.gold} outline={C.ink} drop={C.goldDark}>{ch}</Words>;
          });
        })}
      </g>
      {sub && drop >= 1 && gone === 0 && twos(t) % 12 < 9 && <Words x={240} y={y + rows.length * 38 + 10} size={12} font={TEXT} anchor="middle" color={C.bone} outline={C.ink}>{sub}</Words>}
    </Screen>
  );
}
