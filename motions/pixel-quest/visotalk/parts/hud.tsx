import {useDocTime} from '@visotalk/runtime';
import {C, ICONS, Screen, Sprite, W, Words, px, steps, twos} from './pixel.ts';

export const meta = {
  name: {en: 'Status bar', 'zh-CN': '状态栏'},
  purpose: 'steps',
  line: 'The ink bar on top: the stage, an XP bar in gold cells, slots that keep the items won.',
  fits: 'progress through the steps and what was learnt',
  params: {
    stage: {type: 'text', default: '1', doc: 'the stage shown at the left: a number or a short word (BOSS)'},
    xp: {type: 'progress', default: 0, doc: '0 to 1: the XP bar, filled cell by cell in whole pixels'},
    segments: {type: 'number', default: 4, doc: 'how many cells the XP bar has, one per step (the last one is the boss\'s when boss is set)'},
    boss: {type: 'boolean', default: false, doc: 'the last cell is the boss\'s: marked in red until it fills'},
    items: {type: 'list', default: [], doc: 'the icons of the items won, in order: ball, arc, clock, star, key, gem'},
    got: {type: 'number', default: 0, doc: 'how many items are in their slots; tween it up by one over half a second and the new one blinks in'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the bar unrolls downwards in steps, then its contents switch on'},
  },
  preview: 38.6,
};

/** where slot i of `slots` sits in the bar (its icon's top left), for a part that sends an item there */
export const slotAt = (i: number, slots: number) => ({x: W - 22 - (slots - i) * 17 + 3, y: 15});

const BAR_X = 162, BAR_W = 168, BAR_Y = 16, BAR_H = 8;

export function Hud({stage = '1', xp = 0, segments = 4, boss = false, items = [], got = 0, show = 1}: {stage?: string; xp?: number; segments?: number; boss?: boolean; items?: string[]; got?: number; show?: number}) {
  const t = useDocTime();
  const tall = Math.round(steps(show, 4) * 31);
  if (show <= 0) return null;
  const n = Math.max(1, Math.round(segments));
  const cell = Math.floor((BAR_W - (n - 1)) / n);
  const filled = Math.round(steps(xp, Math.round(BAR_W / 2)) * BAR_W);   // two pixels at a time
  const slots = Math.max(3, items.length);
  const full = Math.floor(got);
  return (
    <Screen>
      <rect x={0} y={0} width={W} height={tall} fill={C.ink} />
      <rect x={0} y={tall} width={W} height={1} fill={C.slate} />
      {show >= 1 && <g>
        <Words x={22} y={23} size={8} color={C.fog} outline={null}>STAGE</Words>
        <Words x={64} y={23} size={8} weight={700} color={C.bone} outline={null}>{stage}</Words>
        <Words x={BAR_X - 6} y={23} size={8} weight={700} anchor="end" color={C.gold} outline={null}>XP</Words>
        {Array.from({length: n}, (_, i) => {
          const x0 = BAR_X + i * (cell + 1);
          const w = Math.max(0, Math.min(cell, filled - i * (cell + 1)));
          const bossCell = boss && i === n - 1;
          return (
            <g key={i}>
              <rect x={x0} y={BAR_Y} width={cell} height={BAR_H} fill={bossCell ? C.coralDark : '#1C2433'} />
              <rect x={x0} y={BAR_Y} width={cell} height={1} fill={bossCell ? '#5A1A24' : '#121822'} />
              {w > 0 && <rect x={x0} y={BAR_Y} width={w} height={BAR_H} fill={C.gold} />}
              {w > 0 && <rect x={x0} y={BAR_Y} width={w} height={2} fill="#FFE596" />}
              {w > 0 && <rect x={x0} y={BAR_Y + BAR_H - 2} width={w} height={2} fill={C.goldDark} />}
              {w > 1 && w < cell && <rect x={x0 + w - 2} y={BAR_Y - 1} width={2} height={BAR_H + 2} fill={C.bone} />}
            </g>
          );
        })}
        <rect x={BAR_X - 1} y={BAR_Y - 1} width={n * (cell + 1) + 1} height={1} fill={C.slate} />
        <rect x={BAR_X - 1} y={BAR_Y + BAR_H} width={n * (cell + 1) + 1} height={1} fill={C.slate} />
        {Array.from({length: n + 1}, (_, i) => <rect key={`s${i}`} x={BAR_X - 1 + i * (cell + 1)} y={BAR_Y} width={1} height={BAR_H} fill={C.slate} />)}
        {Array.from({length: slots}, (_, i) => {
          const x0 = W - 22 - (slots - i) * 17;
          const icon = ICONS[items[i]];
          const arriving = i === full && got - full > 0.001;
          const blink = arriving && twos(t) % 2 === 0;
          return (
            <g key={`i${i}`}>
              <rect x={x0} y={12} width={15} height={15} fill={C.slate} />
              <rect x={x0 + 1} y={13} width={13} height={13} fill="#151B27" />
              {(i < full || arriving) && icon && <Sprite art={icon.art} pal={icon.pal} x={x0 + 3} y={15} fill={blink ? C.bone : undefined} />}
            </g>
          );
        })}
      </g>}
    </Screen>
  );
}
