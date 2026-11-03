// Ink Scroll's reel: twenty seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
import {Easing, interpolate, useTime} from '@motionhub/runtime';
import {Scroll, Place} from './parts/scroll.tsx';
import {Wash, ridge} from './parts/wash.tsx';
import {Brush} from './parts/brush.tsx';
import {Figure} from './parts/figure.tsx';
import {Inscription} from './parts/inscription.tsx';
import {Era} from './parts/era.tsx';
import {Seal} from './parts/seal.tsx';
import {rng} from './parts/ink.ts';

export const reel = {seconds: 20, width: 1920, height: 1080};

/** What happens when, for the motion's sound (sound.json): the scroll unrolls and travels, ink blooms and the brush runs, an era mark lands, the seal is pressed */
export const cues = [
  {at: 0.0, role: 'move', dur: 1.1}, {at: 2.2, role: 'land'}, {at: 3.0, role: 'draw', dur: 1.6}, {at: 4.6, role: 'draw', dur: 1.2},
  {at: 6.0, role: 'move', dur: 2.0}, {at: 7.8, role: 'land'}, {at: 9.2, role: 'move', dur: 1.6}, {at: 10.0, role: 'draw', dur: 1.4},
  {at: 12.4, role: 'move', dur: 1.6}, {at: 13.2, role: 'land'}, {at: 13.4, role: 'draw', dur: 1.4}, {at: 15.2, role: 'draw', dur: 1.3},
  {at: 16.9, role: 'land'}, {at: 17.4, role: 'move', dur: 1.6},
];

type Pts = [number, number][];
type Ease = (v: number) => number;
const sine = Easing.inOutSine, out = Easing.outCubic, linear = Easing.linear;

/** One value tweened through keys of [start, end, to], from `base`: the reel's own Tween */
function track(t: number, base: number, keys: [number, number, number, Ease?][]) {
  let v = base;
  for (const [a, b, to, easing = out] of keys) v = t <= a ? v : interpolate(t, [a, b], [v, to], {easing, clamp: true});
  return v;
}
const once = (t: number, a: number, b: number, easing: Ease = out) => track(t, 0, [[a, b, 1, easing]]);

// one strip, read from its right end leftwards: Luoyang, Samarkand, Baghdad, Xàtiva
const LENGTH = 5600;
const ROAD: Pts = [[5140, 828], [4860, 836], [4560, 818], [4260, 806], [3960, 816], [3640, 834], [3340, 826], [3040, 808], [2740, 816], [2440, 836], [2160, 826], [1860, 812], [1600, 820]];
const STROKES = [ROAD.slice(0, 4), ROAD.slice(3, 7), ROAD.slice(6, 10), ROAD.slice(9, 13)];
const box = (pts: Pts, pad = 30) => {
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]), x = Math.min(...xs) - pad, y = Math.min(...ys) - pad;
  return {x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y, local: pts.map(([px, py]) => [px - x, py - y] as [number, number])};
};
// texture strokes down each slope of a summit, following the slope as a painter finishes a near peak
const cun = (x: number, y: number, h: number): Pts[] => {
  const r = rng(x * 7 + y);
  return [-1, 1].flatMap((side) => [0.1, 0.26, 0.42, 0.58].map((f, i): Pts => {
    const sx = x + side * (h * 0.3 * (f + r() * 0.08) + 6), sy = y + h * (f + r() * 0.06) * 0.5 + 14, bend = (r() - 0.5) * h * 0.08;
    return [[sx, sy], [sx + side * h * 0.06 + bend, sy + h * (0.18 + r() * 0.08)], [sx + side * h * (0.06 + r() * 0.1), sy + h * (0.36 + r() * 0.16 - i * 0.04)]];
  }));
};
const DUNES = 'M0 330 C 120 300, 260 250, 380 200 C 430 180, 470 186, 500 214 C 560 266, 640 300, 700 296 C 780 280, 840 210, 900 168 C 940 142, 980 150, 1010 184 C 1050 232, 1090 290, 1100 330 Z';
const CITY = [
  'M0 330 C 30 300, 50 262, 70 252 L110 248 C 112 214, 150 196, 168 196 C 186 196, 222 214, 224 250 L246 254 L250 120 L262 96 L274 120 L278 247 L300 251',
  'L300 214 C 300 150, 350 112, 390 104 C 430 112, 480 150, 480 214 L480 253 L516 248 L520 110 L532 84 L544 110 L548 252 L566 249',
  'C 568 222, 596 208, 612 208 C 628 208, 656 222, 658 250 L700 250 C 724 268, 744 300, 760 330 Z',
].join(' ');
const DOMES = 'M300 250 L300 214 C 300 150, 350 112, 390 104 C 430 112, 480 150, 480 214 L480 250 Z M112 250 C 114 216, 150 198, 168 198 C 186 198, 220 216, 222 250 Z M568 250 C 570 224, 596 210, 612 210 C 628 210, 654 224, 656 250 Z';
const WAVES: Pts[] = [[[640, 40], [400, 30], [140, 46]], [[580, 92], [320, 84], [40, 98]]];

function Cun({x, y, h, draw}: {x: number; y: number; h: number; draw: number}) {
  return <>{cun(x, y, h).map((c, i) => <Brush key={i} points={c} width={900} height={500} weight={5} dry={0.7} tone="light" draw={draw * 1.5 - (i % 4) * 0.15} />)}</>;
}

export default function Reel() {
  const t = useTime();
  // the view: Luoyang, then travel leftwards stop by stop, then the whole scroll
  const view = track(t, LENGTH - 1920, [[6.0, 8.0, 2350, sine], [9.2, 10.8, 1240, sine], [12.4, 14.0, 0, sine]]);
  const road = track(t, 0, [[4.6, 5.8, 0.25, sine], [6.0, 8.0, 0.75, sine], [9.2, 10.8, 1, sine]]);
  const whole = once(t, 17.4, 19.0, sine);
  const peakSettle = once(t, 4.2, 5.4), citySettle = once(t, 11.0, 12.2), coastSettle = once(t, 14.8, 15.8);
  return (
    <Scroll length={LENGTH} view={view} unroll={once(t, 0, 1.1, sine)} whole={whole}
      marks={[{x: 4700, label: '105'}, {x: 3250, label: '751'}, {x: 2200, label: '794'}, {x: 960, label: '1150'}]}>
      {/* Luoyang: two far ranges, the near peak finished with texture, Cai Lun, and the title */}
      <Place x={4200} y={250} w={980} h={470}><Wash d={ridge(980, 470, 3, 3, 0.6)} width={980} height={470} tone="clear" bloom={once(t, 1.6, 3.4)} from={[0.7, 0.3]} /></Place>
      <Place x={3860} y={330} w={560} h={390}><Wash d={ridge(560, 390, 2, 5, 0.6)} width={560} height={390} tone="clear" bloom={once(t, 1.6, 3.4)} from={[0.8, 0.4]} /></Place>
      <Place x={4330} y={300} w={820} h={470}>
        <Wash d={ridge(820, 470, 2, 8, 0.8)} width={820} height={470} tone="light" bloom={once(t, 3.0, 4.6)} settle={peakSettle} from={[0.45, 0.15]} />
        <Cun x={576} y={26} h={300} draw={peakSettle} /><Cun x={144} y={124} h={220} draw={peakSettle} />
      </Place>
      <Place x={5200} y={96} w={240} h={760}><Inscription text="纸的西行" sub={whole > 0.3 ? '' : '公元一〇五年至一一五〇年'} size={104} write={once(t, 0.6, 2.2, linear)} /></Place>
      <Place x={4070} y={160} w={220} h={330} hide={0.6}><Era year="105" place="东汉　洛阳" show={once(t, 2.2, 3.2)} /></Place>
      <Place x={4080} y={740} w={300} h={70}><Brush points={[[20, 32], [140, 38], [280, 30]]} width={300} height={70} weight={12} dry={0.65} tone="light" draw={once(t, 2.8, 4.0, sine)} /></Place>
      <Place x={4160} y={540} w={115} h={230}><Figure pose="stand" size={230} paint={once(t, 2.8, 4.0, sine)} /></Place>
      <Place x={3870} y={330} w={160} h={300} hide={0.6}><Inscription text={'树皮\n麻头\n破布'} size={50} tone="thick" write={track(t, 0, [[3.6, 4.8, 1, linear], [6.0, 6.6, 0, sine]])} /></Place>

      {/* the road, stroke by stroke as the story travels */}
      {STROKES.map((pts, i) => {
        const b = box(pts);
        return <Place key={i} x={b.x} y={b.y} w={b.w} h={b.h}><Brush points={b.local} width={b.w} height={b.h} weight={15} dry={0.6} tone="thick" draw={road * STROKES.length - i} /></Place>;
      })}

      {/* Samarkand: long dunes, a craftsman walking west with his bundle */}
      <Place x={2700} y={470} w={1100} h={330}><Wash d={DUNES} width={1100} height={330} tone="light" bloom={once(t, 7.0, 8.6)} from={[0.85, 0.5]} /></Place>
      <Place x={3400} y={150} w={260} h={360} hide={0.6}><Era year="751" place="撒马尔罕" show={once(t, 7.8, 8.8)} /></Place>
      <Place x={3150} y={560} w={100} h={200}><Figure pose="walk" carry size={200} paint={once(t, 7.6, 8.8, sine)} /></Place>

      {/* Baghdad: the city blooms, then its domes settle a deeper tone */}
      <Place x={1820} y={400} w={760} h={330}>
        <Wash d={CITY} width={760} height={330} tone="light" bloom={once(t, 10.0, 11.4)} settle={citySettle} from={[0.5, 0.4]} />
        <Wash d={DOMES} width={760} height={330} tone="light" bloom={citySettle} from={[0.5, 0.5]} />
      </Place>
      <Place x={2620} y={150} w={300} h={300} hide={0.6}><Era year="794" unit="年前后" place="巴格达" show={once(t, 10.2, 11.2)} /></Place>

      {/* Xàtiva: hills on the sea, the colophon and the seal */}
      <Place x={580} y={300} w={760} h={420}>
        <Wash d={ridge(760, 420, 2, 34, 0.7)} width={760} height={420} tone="light" bloom={once(t, 13.4, 14.8)} settle={coastSettle} from={[0.6, 0.2]} />
        <Cun x={516} y={29} h={300} draw={coastSettle} /><Cun x={204} y={98} h={230} draw={coastSettle} />
      </Place>
      <Place x={600} y={680} w={680} h={140}>
        {WAVES.map((w, i) => <Brush key={i} points={w} width={680} height={140} weight={9} dry={0.5} tone="heavy" draw={once(t, 14.2 + i * 0.25, 14.8 + i * 0.25, sine)} />)}
      </Place>
      <Place x={1420} y={150} w={340} h={420} hide={0.6}><Era year="1150" unit="年前后" place="西班牙　沙蒂瓦" show={once(t, 13.2, 14.2)} /></Place>
      <Place x={200} y={120} w={180} h={520}><Inscription text="一纸千年" size={96} write={once(t, 15.2, 16.5, linear)} /></Place>
      <Place x={215} y={660} w={150} h={150}><Seal text="千年西行" size={150} stamp={once(t, 16.6, 17.1, linear)} /></Place>
    </Scroll>
  );
}
