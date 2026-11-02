// The sample's own drawing: the juggling pattern, twice from one clock. Pattern is a window that shows the move large (two hands, the arcs
// dotted, the eye line); HandBalls puts the same balls, small, in the hero's hands in the world. `clock` is seconds of juggling, tweened
// linearly by the document, and held on twos.
import {C, Screen, Window, Words, px, twos} from '../../parts/pixel.ts';
import {hands} from '../../parts/hero.tsx';
import {ballAt} from './juggle.ts';

const COLOURS = [[C.blue, C.blueDark], [C.bone, C.fog], [C.coral, C.coralDark]];

const HAND = [
  'kk..............kk',
  'ksk............ksk',
  'kssk..........kssk',
  'kssskkkkkkkkkksssk',
  'kssssssssssssssssk',
  '.kSssssssssssssSk.',
  '..kSSssssssssSSk..',
  '...kkkSssssSkkk...',
  '.....kSssssSk.....',
  '.....kSssssSk.....',
];

function hand(x: number, y: number, flip: boolean) {
  return HAND.map((row, r) => [...(flip ? [...row].reverse().join('') : row)].map((ch, c) => ch === '.' ? null
    : <rect key={`${r}-${c}`} x={x + c} y={y + r} width={1} height={1} fill={ch === 'k' ? C.ink : ch === 's' ? C.skin : C.skinDark} />));
}

function ball(x: number, y: number, i: number, r: number) {
  const [c, d] = COLOURS[i % 3];
  if (r <= 1) return <rect key={`b${i}`} x={x - 1} y={y - 1} width={3} height={3} fill={c} />;
  return (
    <g key={`b${i}`}>
      <rect x={x - 3} y={y - 5} width={7} height={11} fill={C.ink} /><rect x={x - 5} y={y - 3} width={11} height={7} fill={C.ink} /><rect x={x - 4} y={y - 4} width={9} height={9} fill={C.ink} />
      <rect x={x - 2} y={y - 4} width={5} height={9} fill={c} /><rect x={x - 4} y={y - 2} width={9} height={5} fill={c} /><rect x={x - 3} y={y - 3} width={7} height={7} fill={c} />
      <rect x={x + 1} y={y + 1} width={3} height={2} fill={d} /><rect x={x - 1} y={y + 3} width={4} height={1} fill={d} /><rect x={x + 3} y={y - 1} width={1} height={2} fill={d} />
      <rect x={x - 2} y={y - 3} width={2} height={1} fill={C.bone} /><rect x={x - 3} y={y - 2} width={1} height={2} fill={C.bone} />
    </g>
  );
}

export function Pattern({balls = 1, clock = 0, open = 0, eye = 0, x = 232, y = 44, w = 232, h = 132, label = ''}: {balls?: number; clock?: number; open?: number; eye?: number; x?: number; y?: number; w?: number; h?: number; label?: string}) {
  if (open <= 0) return null;
  const o = Math.floor(Math.min(1, open) * 4) / 4;
  const hh = Math.max(8, Math.round(h * o));
  const t = twos(clock) / 12;
  const hy = y + h - 24, hl = x + 40, hr = x + w - 40;
  const A = h - 56;
  const eyeY = Math.round(hy - A * 0.86);
  // a throw leaves a hand on its inside and lands on the other hand's outside, so the two arcs cross: the next ball goes under
  const IN = 12, OUT = 8;
  const throwX = (hand: 0 | 1) => hand === 0 ? hl + IN : hr - IN;
  const catchX = (hand: 0 | 1) => hand === 0 ? hl - OUT : hr + OUT;
  const dots = [];
  for (const hand of [0, 1] as const) for (let s = 0; s <= 40; s += 2) {
    const u = s / 40, up = 4 * u * (1 - u);
    const x0 = throwX(hand), x1 = catchX((1 - hand) as 0 | 1);
    dots.push(<rect key={`d${hand}-${s}`} x={Math.round(x0 + (x1 - x0) * u)} y={Math.round(hy - 6 - up * A)} width={2} height={2} fill={C.slate} />);
  }
  return (
    <Screen>
      <Window x={x} y={y + Math.round((h - hh) / 2)} w={w} h={hh} />
      {o >= 1 && (
        <g>
          {label && <Words x={x + 10} y={y + 15} size={8} weight={700} color={C.gold} outline={null}>{label}</Words>}
          {dots}
          {eye > 0 && (
            <g>
              {Array.from({length: Math.floor((w - 20) / 6)}, (_, i) => <rect key={`e${i}`} x={x + 10 + i * 6} y={eyeY} width={3} height={1} fill={C.mint} />)}
              <Words x={x + w - 10} y={eyeY - 4} size={8} anchor="end" color={C.mint} outline={null}>EYES</Words>
            </g>
          )}
          {hand(hl - 9, hy - 3, false)}
          {hand(hr - 9, hy - 3, true)}
          {Array.from({length: balls}, (_, i) => {
            const b = ballAt(i, balls, t);
            const other = (1 - b.from) as 0 | 1;
            const bx = b.held ? catchX(b.from) + (throwX(b.from) - catchX(b.from)) * b.dwell : throwX(b.from) + (catchX(other) - throwX(b.from)) * b.across;
            const wait = t / 0.5 < i && balls > 1 ? (i - 1) * 6 : 0;   // balls still waiting sit side by side in the hand
            return ball(Math.round(bx) + (b.from === 0 ? -wait : wait), Math.round(hy - 6 - b.up * A), i, 2);
          })}
        </g>
      )}
    </Screen>
  );
}

export function HandBalls({balls = 1, clock = 0, x = 120, show = 0}: {balls?: number; clock?: number; x?: number; show?: number}) {
  if (show <= 0) return null;
  const t = twos(clock) / 12;
  const {left, right} = hands(x);
  return (
    <Screen>
      {Array.from({length: balls}, (_, i) => {
        const b = ballAt(i, balls, t);
        const a = b.from === 0 ? left : right, z = b.from === 0 ? right : left;
        return ball(px(b.held ? a.x : a.x + (z.x - a.x) * b.across), px(a.y - 2 - b.up * 26), i, 1);
      })}
    </Screen>
  );
}

