import {C, CANVAS, CUT_SHADOW, clamp, yOf, type Cam} from './plumb.ts';

export type Item = {shape?: 'fish' | 'whale' | 'jelly' | 'angler'; d?: string; x: number; depth: number; size?: number; color?: string; flip?: boolean};

export const meta = {
  name: {en: 'Paper cutouts', 'zh-CN': '纸雕剪影'},
  purpose: 'term',
  line: "Flat cut-paper figures, each with a soft shadow, hung at the depth where they really belong and moving with the sheets behind them.",
  fits: "who or what lives at each level: fish, planes, climbers, satellites; pass your own outline in d",
  params: {
    cam: {type: '{at, scale}', doc: "the scene's camera"},
    items: {type: '{shape | d, x, depth, size, color, flip}[]', doc: 'each figure: a shape or an outline drawn about 0,0 and 200 px wide, the px across the frame, its true depth, its scale'},
    clock: {type: 'number', default: 0, doc: 'seconds: tween it linearly so they keep swimming'},
    full: {type: 'number', default: 0.26, doc: 'the camera scale at or above which they are their own size; below it they shrink with the pull-back'},
  },
  preview: 11.5,
};

const SHAPES = {
  fish: 'M-60 0C-30 -30 30 -30 60 0C30 30 -30 30 -60 0ZM-54 0L-96 -28L-90 0L-96 28Z',
  whale: 'M-120 -14C-60 -60 110 -56 150 -8C168 12 190 -4 214 -24L208 8L224 40C196 26 168 28 146 38C60 72 -74 66 -120 18C-130 8 -130 -6 -120 -14Z',
  jelly: 'M-44 0C-44 -52 44 -52 44 0L34 -2L34 54L24 10L12 74L4 8L-8 72L-18 8L-30 56L-34 -2Z',
  angler: 'M-110 0C-90 -60 40 -70 100 -10L140 -30L130 12L146 50L96 24C40 70 -90 60 -110 0Z',
};

export function Cutouts({cam, items, clock = 0, full = 0.26}: {cam: Cam; items: Item[]; clock?: number; full?: number}) {
  const far = clamp(cam.scale / full, 0.1, 1);
  return (
    <svg {...CANVAS}>
      {items.map((it, i) => {
        const y = yOf(cam, it.depth), s = (it.size ?? 1) * far, color = it.color ?? C.shade;
        if (y < -160 || y > 1000) return null;
        const swim = Math.sin(clock * 0.5 + i * 2.3) * 14;
        return <g key={i} transform={`translate(${it.x + swim} ${y + Math.cos(clock * 0.4 + i) * 5}) scale(${it.flip ? -s : s} ${s})`} style={{filter: CUT_SHADOW}}>
          <path d={it.d ?? SHAPES[it.shape ?? 'fish']} fill={color} />
          {it.shape === 'angler' && <>
            <path d="M-30 -56C-70 -120 -110 -110 -120 -84" fill="none" stroke={color} strokeWidth={7} />
            <circle cx={-124} cy={-78} r={40} fill={C.lure} opacity={0.26 + Math.sin(clock * 1.3) * 0.08} />
            <circle cx={-124} cy={-78} r={14} fill={C.lure} />
          </>}
        </g>;
      })}
    </svg>
  );
}
