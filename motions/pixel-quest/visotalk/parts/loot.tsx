import {useDocTime} from '@visotalk/runtime';
import {C, FLOOR, ICONS, Screen, Sprite, Words, px, steps, twos, type Art} from './pixel.ts';
import {slotAt} from './hud.tsx';

export const meta = {
  name: {en: 'Loot chest', 'zh-CN': '宝箱'},
  purpose: 'term',
  line: 'A chest springs open; the item rises with its name and hops into its slot in the bar.',
  fits: 'what a step gives: a new term, a rule, a shortcut learnt',
  params: {
    x: {type: 'px', default: 300, doc: 'where the chest stands, in game pixels (its middle)'},
    icon: {type: 'text', default: 'star', doc: 'the item: ball, arc, clock, star, key or gem'},
    label: {type: 'text', default: '', doc: 'its name, one or two words, shown in gold over it'},
    open: {type: 'progress', default: 0, doc: '0 to 1: the chest drops in, the lid springs, the item rises and its name types'},
    fly: {type: 'progress', default: 0, doc: '0 to 1: the item hops to its slot and the chest sinks away'},
    chest: {type: 'boolean', default: true, doc: 'false: no chest, the item rises out of the floor where something was beaten'},
    slot: {type: 'number', default: 0, doc: 'which slot of the bar it goes to, from the left'},
    slots: {type: 'number', default: 3, doc: 'how many slots the bar has (the status bar\'s items length)'},
  },
  preview: 14.6,
};

const PAL = {k: C.ink, w: C.wood, W: C.woodDark, g: C.gold, G: C.goldDark, d: C.dirtLit};
const BOX: Art = [
  'kkkkkkkkkkkkkkkk',
  'kwwwwwwgGwwwwwwk',
  'kwWWWWWgGWWWWWwk',
  'kggggggkkggggggk',
  'kwwwwwwkkwwwwwwk',
  'kwwwwwwwwwwwwwwk',
  'kWWWWWWWWWWWWWWk',
  'kkkkkkkkkkkkkkkk',
];
const LID: Art = [
  '...kkkkkkkkkk...',
  '.kkddddddddddkk.',
  'kddwwwwwwwwwwddk',
  'kwwwwwwggwwwwwwk',
  'kWWWWWWGGWWWWWWk',
  'kkkkkkkkkkkkkkkk',
];
const LID_OPEN: Art = [
  'kkkkkkkkkkkkkkkk',
  'kWWWWWWWWWWWWWWk',
  'kWWWWWWWWWWWWWWk',
  'kkkkkkkkkkkkkkkk',
];

export function Loot({x = 300, icon = 'star', label = '', open = 0, fly = 0, chest = true, slot = 0, slots = 3}: {x?: number; icon?: string; label?: string; open?: number; fly?: number; chest?: boolean; slot?: number; slots?: number}) {
  const t = useDocTime();
  if (open <= 0) return null;
  const o = steps(open, 12);
  const X = px(x) - 8;
  const land = [-60, -36, -16, 0, -3, 0][Math.min(5, Math.floor(o * 12))];
  const sprung = chest ? o >= 0.5 : o > 0;
  const rise = sprung ? Math.round(Math.min(1, chest ? (o - 0.5) / 0.3 : o / 0.6) * (chest ? 22 : 40)) : 0;
  const item = ICONS[icon] ?? ICONS.star;
  const f = steps(fly, 10);
  const target = slotAt(slot, slots);
  const ix0 = px(x) - 4, iy0 = FLOOR - 16 - rise;
  const ix = Math.round(ix0 + (target.x - ix0) * f);
  const iy = Math.round(iy0 + (target.y - iy0) * f - Math.sin(f * Math.PI) * 40);
  const sink = Math.round(f * 10);
  const shine = twos(t) % 6 < 3;
  return (
    <Screen>
      {chest && <g transform={`translate(0 ${land + sink})`}>
        <Sprite art={BOX} pal={PAL} x={X} y={FLOOR - 8} dissolve={f} />
        <Sprite art={sprung ? LID_OPEN : LID} pal={PAL} x={X} y={FLOOR - 8 - (sprung ? 4 : 6)} dissolve={f} />
      </g>}
      {f > 0 && f < 1 && [0.1, 0.2, 0.3].map((back, k) => {
        const g = Math.max(0, f - back);
        const tx = Math.round(ix0 + (target.x - ix0) * g) + 4, ty = Math.round(iy0 + (target.y - iy0) * g - Math.sin(g * Math.PI) * 40) + 4;
        return <rect key={`t${k}`} x={tx - (2 - k) / 2} y={ty} width={3 - k} height={3 - k} fill={k === 0 ? '#FFE596' : C.gold} />;
      })}
      {sprung && f < 1 && <Sprite art={item.art} pal={item.pal} x={ix} y={iy} />}
      {sprung && f === 0 && shine && <rect x={ix + 8} y={iy - 2} width={2} height={2} fill={C.bone} />}
      {sprung && label && f === 0 && <Words x={px(x)} y={iy - 6} size={8} weight={700} anchor="middle" color={C.gold} outline={C.ink} chars={Math.ceil(Math.min(1, (o - 0.6) / 0.3) * label.length)}>{label}</Words>}
    </Screen>
  );
}
