import {useDocTime} from '@visotalk/runtime';
import {C, Screen, Words, TEXT, steps, twos} from './pixel.ts';

export const meta = {
  name: {en: 'Stage card', 'zh-CN': '关卡牌'},
  purpose: 'title',
  line: 'STAGE and a number in big gold letters drop in and bounce, the step\'s name typed beneath; it blinks out when play starts.',
  fits: 'the start of each step or each part of a lesson',
  params: {
    n: {type: 'text', doc: 'the stage\'s number or word: 1, 2, 3, BOSS'},
    name: {type: 'text', default: '', doc: 'what the step is, in two to four words'},
    x: {type: 'px', default: 240, doc: 'the middle of the card, in game pixels'},
    y: {type: 'px', default: 96, doc: 'the baseline of the big letters, in game pixels'},
    drop: {type: 'progress', default: 0, doc: '0 to 1: the letters fall, land and bounce twice; then the name types in'},
    leave: {type: 'progress', default: 0, doc: '0 to 1: the card hops up and blinks out, on and off every drawing'},
  },
  preview: 18.8,
};

// where the letters are, drawing by drawing: a fall, a landing, two bounces (whole pixels)
const FALL = [-48, -34, -22, -12, -4, 0, -8, -10, -8, 0, -3, 0];

export function StageCard({n, name = '', x = 240, y = 96, drop = 0, leave = 0}: {n: string; name?: string; x?: number; y?: number; drop?: number; leave?: number}) {
  const t = useDocTime();
  if (drop <= 0 || leave >= 1 || (leave > 0.3 && twos(t) % 2 === 1)) return null;
  const f = Math.min(FALL.length - 1, Math.floor(steps(drop * 1.6, FALL.length)  * FALL.length));
  const up = -Math.round(steps(Math.min(leave / 0.3, 1), 3) * 6);
  const dy = FALL[f] + up;
  const typed = Math.max(0, (drop - 0.4) / 0.3);
  return (
    <Screen>
      <g transform={`translate(0 ${dy})`}>
        <Words x={x} y={y} size={24} weight={700} anchor="middle" color={C.gold} outline={C.ink} drop={C.goldDark}>{`STAGE ${n}`}</Words>
      </g>
      {name && <Words x={x} y={y + 26} size={12} font={TEXT} anchor="middle" color={C.bone} outline={C.ink} chars={Math.floor(steps(typed, name.length) * name.length)}>{name}</Words>}
    </Screen>
  );
}
