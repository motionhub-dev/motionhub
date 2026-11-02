import React from 'react';
import {useProp, useDocTime} from '@visotalk/runtime';
import {C, FLOOR, H, W, Screen, Sprite, Words, px, steps, twos, type Art} from './pixel.ts';

export const meta = {
  name: {en: 'Level', 'zh-CN': '关卡'},
  purpose: 'ground',
  line: 'The tiled world at dusk: dithered sky, parallax ridges and trees, a grass floor, a signpost per stage.',
  fits: 'every scene, one global part: scroll 480 a stage, dusk for the boss, shake on impact',
  params: {
    scroll: {type: 'px', default: 0, doc: 'how far the world has scrolled, in game pixels; one stage is 480'},
    stages: {type: 'number', default: 3, doc: 'how many numbered signposts stand along the floor, one a stage'},
    boss: {type: 'number', default: 0, doc: 'the stage whose signpost is the boss\'s (a red plate and a mark), 0 for none'},
    dusk: {type: 'progress', default: 0, doc: '0 to 1: the sky steps through three palettes to a red dusk (never a blend)'},
    shake: {type: 'progress', default: 0, doc: '0 to 1 tweened over an impact: the world jolts by whole pixels, then settles'},
  },
  preview: 5.4,
};

export const STAGE = 480;

const SKIES = [
  {sky: C.sky, ridge: '#25434F', ridgeLit: '#33596A', far: C.far, farLit: C.farLit, near: C.near, nearLit: C.nearLit, moon: '#E9DFC4', moonDark: '#BFB394'},
  {sky: ['#130F1F', '#1C1931', '#2A2442', '#3D2D4A'], ridge: '#2E2840', ridgeLit: '#41385A', far: '#211F35', farLit: '#2C2842', near: '#1F3536', nearLit: '#2A4640', moon: '#F2C9A0', moonDark: '#C99A74'},
  {sky: ['#14090F', '#22101C', '#3A1527', '#5A1F2C'], ridge: '#3A1A2A', ridgeLit: '#552236', far: '#2A1424', farLit: '#3A1A2C', near: '#24252A', nearLit: '#323036', moon: '#FF8A5C', moonDark: '#C8573A'},
];

// a tree of the middle distance, 20 × 30: a round canopy lit on top, a trunk
const TREE: Art = [
  '.......llll.........',
  '.....llnnnnll.......',
  '...llnnnnnnnnll.....',
  '..lnnnnnnnnnnnnl....',
  '.lnnnnnnnnnnnnnnl...',
  '.nnnnnnnnnnnnnnnnl..',
  'lnnnnnnnnnnnnnnnnnl.',
  'nnnnnnnnnnnnnnnnnnn.',
  'nnnnnnnnnnnnnnnnnnnn',
  'nnnnnnnnnnnnnnnnnnnn',
  '.nnnnnnnnnnnnnnnnnn.',
  '.nnnnnnnnnnnnnnnnnn.',
  '..nnnnnnnnnnnnnnnn..',
  '...nnnnnnnnnnnnnn...',
  '....nnnnnnnnnnnn....',
  '......nnnttnnn......',
  '........tt..........',
  '........tt..........',
  '........tt..........',
  '........tt..........',
  '........tt..........',
  '.......tttt.........',
];

// a cloud, 24 × 7: a lit rim on top, the body in the band's colour
const CLOUD: Art = [
  '.......llll.............',
  '....lllbbbbll...lll.....',
  '..llbbbbbbbbbllbbbbll...',
  '.lbbbbbbbbbbbbbbbbbbbbl.',
  'lbbbbbbbbbbbbbbbbbbbbbbl',
  '.dddbbbbddddbbbbbddddd..',
  '....dddd....ddddd.......',
];
const BUSH: Art = [
  '.....llll.......',
  '...llnnnnll..ll.',
  '..lnnnnnnnnllnnl',
  '.lnnnnnnnnnnnnnn',
  'lnnnnnnnnnnnnnnn',
  'nnnnnnnnnnnnnnnn',
];
const POST: Art = [
  'kkkkkkkkkkkkkkkk',
  'kwwwwwwwwwwwwwwk',
  'kwppppppppppppDk',
  'kwppppppppppppDk',
  'kwppppppppppppDk',
  'kwppppppppppppDk',
  'kwppppppppppppDk',
  'kwppppppppppppDk',
  'kwppppppppppppDk',
  'kDDDDDDDDDDDDDDk',
  'kkkkkkkwDkkkkkkk',
  '......kwDk......',
  '......kwDk......',
  '......kwDk......',
  '......kwDk......',
  '.....kkwDkk.....',
];

/** the hills' outline, stepped every 4 pixels, the same every time it is drawn */
const ridge = (x: number) => Math.round((Math.sin(x * 0.007 + 2.1) * 20 + Math.sin(x * 0.019) * 8) / 2) * 2;
const hill = (x: number) => Math.round((Math.sin(x * 0.011) * 16 + Math.sin(x * 0.031 + 1.7) * 7 + Math.sin(x * 0.005 + 0.4) * 10) / 2) * 2;

export function Level({scroll = 0, stages = 3, boss = 0, dusk = 0, shake = 0}: {scroll?: number; stages?: number; boss?: number; dusk?: number; shake?: number}) {
  const t = useDocTime();
  const pal = SKIES[Math.round(steps(dusk, 2) * 2)];
  const s = px(scroll);
  const jolt = shake > 0 && shake < 1 ? [0, 3, -3, 2, -2, 1, -1, 0][Math.min(7, Math.floor(shake * 8))] : 0;
  const bands = [[22, 84], [84, 124], [124, 156], [156, FLOOR]];
  const ids = React.useId().replace(/:/g, '');
  const cloudShift = (s >> 2) + (twos(t) >> 3);   // clouds drift one pixel every eight drawings and scroll at a quarter
  const hillShift = Math.round(s * 0.35);
  const bushShift = Math.round(s * 0.6);
  // the world is a camera's view: what scrolls past the frame is cropped, and the deep earth under the captions is painted in CSS below it
  // the deep earth under the captions is one CSS backdrop, layered band by band: solid rows, and dithered rows as a 4-pixel checker
  const solid = (c: string, top: number, h: number) => `linear-gradient(${c}, ${c}) 0 ${top * 4}px / 100% ${h * 4}px no-repeat`;
  const dither = (a: string, b: string, top: number) => [0, 2].map((d) => `repeating-conic-gradient(${a} 0 25%, ${b} 0 50%) 0 ${(top + d) * 4}px / 8px 8px repeat-x`).join(', ');
  const deep = [solid(C.dirt, 220, 2), dither(C.dirt, C.dirtDark, 222), solid(C.dirtDark, 226, 12), dither(C.dirtDark, C.deep, 238), solid(C.deep, 242, 12), dither(C.deep, C.ink, 254), C.ink].join(', ');
  return (
    <div data-vt-camera="" style={{position: 'absolute', left: 0, top: 0, width: W * 4, height: H * 4, overflow: 'hidden', background: C.ink}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: W * 4, height: H * 4, background: deep}} />
    <Screen style={{height: 220 * 4}}>
      <defs>
        {pal.sky.slice(1).map((c, i) => (
          <pattern key={i} id={`${ids}d${i}`} width={2} height={2} patternUnits="userSpaceOnUse">
            <rect width={2} height={2} fill={pal.sky[i]} /><rect width={1} height={1} fill={c} /><rect x={1} y={1} width={1} height={1} fill={c} />
          </pattern>
        ))}
        <pattern id={`${ids}grass`} width={16} height={16} patternUnits="userSpaceOnUse" x={-s} y={FLOOR}>
          <rect width={16} height={16} fill={C.dirt} />
          <rect y={0} width={16} height={4} fill={C.grass} />
          <rect y={0} width={16} height={1} fill={C.grassLit} />
          {[[1, 1], [6, 1], [11, 2], [3, 3], [9, 3], [14, 3]].map(([x, y], i) => <rect key={`g${i}`} x={x} y={y} width={1} height={1} fill={C.grassDark} />)}
          {[0, 2, 3, 5, 7, 8, 10, 12, 13, 15].map((x, i) => <rect key={`e${i}`} x={x} y={4} width={1} height={i % 3 ? 1 : 2} fill={C.grassDark} />)}
          {[[2, 8], [9, 7], [13, 11], [5, 13], [11, 14], [0, 11]].map(([x, y], i) => <rect key={`d${i}`} x={x} y={y} width={2} height={1} fill={C.dirtDark} />)}
          {[[6, 9], [14, 8], [3, 15]].map(([x, y], i) => <rect key={`l${i}`} x={x} y={y} width={1} height={1} fill={C.dirtLit} />)}
        </pattern>
        <pattern id={`${ids}earth`} width={16} height={16} patternUnits="userSpaceOnUse" x={-s} y={FLOOR}>
          <rect width={16} height={16} fill={C.dirt} />
          {[[2, 3], [9, 1], [13, 6], [5, 9], [11, 12], [0, 14], [7, 15]].map(([x, y], i) => <rect key={i} x={x} y={y} width={2} height={1} fill={C.dirtDark} />)}
          {[[6, 4], [14, 10], [3, 12]].map(([x, y], i) => <rect key={`l${i}`} x={x} y={y} width={1} height={1} fill={C.dirtLit} />)}
        </pattern>
      </defs>
      <g transform={`translate(${jolt} ${jolt ? -Math.sign(jolt) : 0})`}>
        <rect x={-8} y={0} width={W + 16} height={220} fill={pal.sky[0]} />
        {bands.map(([a, b], i) => <rect key={i} x={-8} y={a} width={W + 16} height={b - a} fill={pal.sky[i]} />)}
        {bands.slice(1).map(([a], i) => <rect key={`dz${i}`} x={-8} y={a - 2} width={W + 16} height={4} fill={`url(#${ids}d${i})`} />)}
        {[0, 1, 2, 3].map((i) => {
          const x = ((i * 157 + 40 - cloudShift) % 628 + 628) % 628 - 74;
          const y = [44, 70, 52, 96][i];
          return <Sprite key={i} art={CLOUD} pal={{l: pal.sky[Math.min(3, i % 2 + 2)], b: pal.sky[Math.min(3, i % 2 + 1)], d: pal.sky[i % 2]}} x={x} y={y} flip={i % 2 === 1} />;
        })}
        {(() => {
          const mx = 372 - Math.round(s * 0.03), my = 58;
          return (
            <g>
              {Array.from({length: 29}, (_, j) => {
                const dy = j - 14, half = Math.round(Math.sqrt(Math.max(0, 14.5 * 14.5 - dy * dy)));
                return <rect key={`m${j}`} x={mx - half} y={my + dy} width={half * 2} height={1} fill={pal.moon} />;
              })}
              {[[-5, -4, 4], [4, 3, 3], [-2, 6, 2], [6, -6, 2]].map(([dx, dy, r], i) => <rect key={`c${i}`} x={mx + dx} y={my + dy} width={r} height={r - 1} fill={pal.moonDark} />)}
            </g>
          );
        })()}
        {Array.from({length: W / 4 + 3}, (_, i) => {
          const sh = Math.round(s * 0.2);
          const wx = i * 4 - (sh % 4) - 4;
          const top = 118 + ridge(wx + sh);
          return <g key={`r${i}`}><rect x={wx} y={top} width={4} height={FLOOR - top} fill={pal.ridge} /><rect x={wx} y={top} width={4} height={1} fill={pal.ridgeLit} /></g>;
        })}
        {Array.from({length: W / 4 + 3}, (_, i) => {
          const wx = i * 4 - (hillShift % 4) - 4;
          const top = 140 + hill(wx + hillShift);
          return <g key={`h${i}`}><rect x={wx} y={top} width={4} height={FLOOR - top} fill={pal.far} /><rect x={wx} y={top} width={4} height={1} fill={pal.farLit} /></g>;
        })}
        {Array.from({length: 7}, (_, i) => {
          const x = ((i * 89 + 30 - Math.round(s * 0.5)) % 623 + 623) % 623 - 60;
          return <Sprite key={`t${i}`} art={TREE} pal={{l: pal.nearLit, n: pal.near, t: pal.far}} x={x} y={FLOOR - 22 - (i % 3) * 2} flip={i % 2 === 1} />;
        })}
        {Array.from({length: 9}, (_, i) => {
          const x = ((i * 61 + 13 - bushShift) % 549 + 549) % 549 - 40;
          return <Sprite key={`b${i}`} art={BUSH} pal={{l: pal.nearLit, n: pal.near}} x={x} y={FLOOR - 6} flip={i % 2 === 0} />;
        })}
        {Array.from({length: stages}, (_, i) => {
          const x = i * STAGE + 40 - s;
          if (x < -24 || x > W + 8) return null;
          const isBoss = boss === i + 1;
          return (
            <g key={`p${i}`}>
              <Sprite art={POST} pal={{k: C.ink, w: isBoss ? '#FF8A7E' : C.dirtLit, p: isBoss ? C.coral : C.wood, D: isBoss ? C.coralDark : C.woodDark}} x={x} y={FLOOR - 16} />
              <Words x={x + 8} y={FLOOR - 9} anchor="middle" size={8} weight={700} color={C.bone} outline={null}>{isBoss ? '!!' : String(i + 1)}</Words>
            </g>
          );
        })}
        <rect x={-8} y={FLOOR} width={W + 16} height={16} fill={`url(#${ids}grass)`} />
        <rect x={-8} y={FLOOR + 16} width={W + 16} height={220 - FLOOR - 16} fill={`url(#${ids}earth)`} />
      </g>
    </Screen>
    </div>
  );
}
