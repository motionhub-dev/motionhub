import {useDocTime} from '@visotalk/runtime';
import {C, FLOOR, Screen, Sprite, px, steps, twos, type Art} from './pixel.ts';

export const meta = {
  name: {en: 'Hero', 'zh-CN': '小勇者'},
  purpose: 'mark',
  line: 'The small hero in a blue cap, the viewer\'s stand-in: idles, walks to the next stage, holds out its hands to act the step, hops on a clear.',
  fits: 'the learner doing each step; one hero all film long',
  params: {
    x: {type: 'px', default: 120, doc: 'where it stands, in game pixels from the left (its middle)'},
    pose: {type: 'text', default: 'idle', doc: 'idle, walk, act (hands out at waist height, palms up) or cheer (arms up)'},
    hop: {type: 'progress', default: 0, doc: '0 to 1: one hop up and back down, in whole-pixel steps'},
    face: {type: 'text', default: 'front', doc: 'front, or right / left when it walks'},
  },
  preview: 9.5,
};

const PAL = {k: C.ink, b: C.blue, B: C.blueDark, w: C.bone, s: C.skin, S: C.skinDark, h: C.hair, n: C.boot, N: C.bootDark, g: C.gold};

const HEAD: Art = [
  '.....kkkkkk.....',
  '....kbbbbbbk....',
  '...kbbbbbwwbk...',
  '...kbbbbbbbbk...',
  '..kBBBBBBBBBBk..',
  '...khhsssshhk...',
  '...khskssksSk...',
  '...kSssssssSk...',
  '....kSsssSSk....',
  '.....kkkkkk.....',
];
const LEGS: Art = [
  '....kBBkkBBk....',
  '....knnkknnk....',
  '....knnkknnk....',
  '...kNNNkkNNNk...',
  '...kkkkkkkkkk...',
];
const FRONT: Record<string, Art> = {
  idle: [...HEAD,
    '....kbbbbbbk....',
    '...kbbbbbbbbk...',
    '..kbkbbggbbkbk..',
    '..kbkbbggbbkbk..',
    '..kbkBBBBBBkbk..',
    '..kskbbbbbbksk..',
    '..kkkbbbbbbkkk..',
    '....kbbbbbbk....', ...LEGS],
  act: [...HEAD,
    '....kbbbbbbk....',
    '...kbbbbbbbbk...',
    '..kbbbbggbbbbk..',
    '.kbbkbbggbbkbbk.',
    'ksskkBBBBBBkkssk',
    '.kk.kbbbbbbk.kk.',
    '....kbbbbbbk....',
    '....kbbbbbbk....', ...LEGS],
  cheer: [
    'kk............kk',
    'ksk..kkkkkk..ksk',
    'kbk.kbbbbbbk.kbk',
    'kbkkbbbbbwwbkkbk',
    '.kbkbbbbbbbbkbk.',
    '..kBBBBBBBBBBk..',
    '...khhsssshhk...',
    '...khskssksSk...',
    '...kSsskksSSk...',
    '....kSsssSSk....',
    '....kkkkkkkk....',
    '...kbbbbbbbbk...',
    '...kbbbggbbbk...',
    '...kbbbggbbbk...',
    '...kBBBBBBBBk...',
    '....kbbbbbbk....',
    '....kbbbbbbk....',
    '....kbbbbbbk....', ...LEGS],
};
const SIDE_TOP: Art = [
  '....kkkkkk......',
  '...kbbbbbbk.....',
  '..kbbbbbbwwk....',
  '..kbbbbbbbbk....',
  '..kBBBBBBBBBBk..',
  '...khhhssssk....',
  '...khhsssksk....',
  '...khSssssssk...',
  '....kSsssSk.....',
  '.....kkkkk......',
  '....kbbbbbk.....',
  '...kbbbbbbbk....',
  '...kbbkbbgbk....',
  '...kbbkbbgbk....',
  '...kBBkskBBk....',
  '...kbbbkkbbk....',
  '....kbbbbbk.....',
  '....kBBkBBk.....',
];
const STRIDE: Art = ['...knnk.knnk....', '..knnk...knnk...', '.kNNNk...kNNNk..', '.kkkkk...kkkkk..'];
const PASS: Art = ['....knnnk.......', '....knnnk.......', '....kNNNNk......', '....kkkkkk......'];

export function Hero({x = 120, pose = 'idle', hop = 0, face = 'front'}: {x?: number; pose?: string; hop?: number; face?: string}) {
  const t = useDocTime();
  const f = twos(t);
  // a hop is six drawings up and six down, a parabola in whole pixels
  const h = hop > 0 && hop < 1 ? Math.round(Math.sin(steps(hop, 12) * Math.PI) * 14) : 0;
  let art: Art;
  let bob = 0;
  if (pose === 'walk' || face !== 'front') {
    const step = Math.floor(f / 2) % 2;   // a stride every two drawings
    art = [...SIDE_TOP, ...(pose === 'walk' && step === 0 ? STRIDE : PASS)];
    bob = pose === 'walk' && step === 1 ? -1 : 0;
  } else {
    art = FRONT[pose] ?? FRONT.idle;
    bob = pose === 'idle' && Math.floor(f / 6) % 2 === 1 ? 1 : 0;   // breathing: the body settles a pixel twice a second
  }
  const top = FLOOR - art.length - h + bob;
  return (
    <Screen>
      <rect x={px(x) - 6} y={FLOOR} width={12} height={1} fill={C.ink} opacity={h > 0 ? 0.35 : 0.6} />
      <Sprite art={art} pal={PAL} x={px(x) - 8} y={top} flip={face === 'left'} />
    </Screen>
  );
}

/** where the hero's hands are in the act pose, for a part that puts something in them */
export const hands = (x: number) => ({left: {x: px(x) - 6, y: FLOOR - 9}, right: {x: px(x) + 6, y: FLOOR - 9}});
