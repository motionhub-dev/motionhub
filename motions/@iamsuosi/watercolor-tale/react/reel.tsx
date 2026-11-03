// Watercolor Tale's reel: twenty seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
import React, {type ReactNode} from 'react';
import {Easing, Sequence, interpolate, useTime} from '@motionhub/runtime';
import {Book} from './parts/book.tsx';
import {Wash} from './parts/wash.tsx';
import {Glaze} from './parts/glaze.tsx';
import {Pencil} from './parts/pencil.tsx';
import {Note} from './parts/note.tsx';
import {Title} from './parts/title.tsx';
import {Swatches} from './parts/swatches.tsx';
import {Spatter} from './parts/spatter.tsx';
import {blob, maple, stroke, type Pt} from './parts/paint.ts';

export const reel = {seconds: 20, width: 1920, height: 1080};
/** What happens when, for the motion's sound (sound.json): a brush writes, a page turns, washes paint, the swatches fill, leaves fall on a gust */
export const cues = [
  {at: 0.1, role: 'draw', dur: 1.5}, {at: 1.2, role: 'land'}, {at: 3.1, role: 'cut'}, {at: 4.4, role: 'draw', dur: 1.4}, {at: 5.2, role: 'draw', dur: 1.5},
  {at: 7.0, role: 'land'}, {at: 7.2, role: 'draw', dur: 0.9}, {at: 7.6, role: 'count'}, {at: 8.2, role: 'cut'}, {at: 9.8, role: 'draw', dur: 1.0},
  {at: 11.4, role: 'draw', dur: 1.4}, {at: 12.9, role: 'draw', dur: 1.1}, {at: 13.0, role: 'count'}, {at: 13.8, role: 'cut'}, {at: 13.9, role: 'count'},
  {at: 15.6, role: 'move', dur: 2.3}, {at: 18.0, role: 'move', dur: 0.9}, {at: 18.2, role: 'land'},
];

type Ease = (v: number) => number;
const sine = Easing.inOutSine, out = Easing.outCubic, linear = Easing.linear;
/** 0 before `a`, 1 after `b`, eased between */
const once = (t: number, a: number, b: number, easing: Ease = out) => interpolate(t, [a, b], [0, 1], {easing, clamp: true});

/** A box on the spread, in canvas px */
const At = ({x, y, w = 0, h = 0, children, style}: {x: number; y: number; w?: number; h?: number; children?: ReactNode; style?: React.CSSProperties}) =>
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, ...style}}>{children}</div>;

// the maple on the right page: a crown of three lumps over a trunk and three limbs
const TREE = {x: 1040, y: 40, w: 640, h: 820};
const CROWN = [blob(320, 290, 228, 4, 8, 0.2, 0.86), blob(168, 372, 132, 9, 6), blob(478, 362, 140, 12, 6)].join(' ');
const TRUNK = [
  stroke([[322, 812], [316, 640], [326, 470]], 66, 34),
  stroke([[318, 590], [250, 500], [176, 430]], 28, 8),
  stroke([[324, 540], [404, 456], [470, 392]], 26, 8),
  stroke([[324, 480], [316, 390], [334, 300]], 22, 7),
].join(' ');
const SKETCH: Pt[][] = [
  [[112, 330], [150, 190], [270, 100], [420, 110], [540, 200], [600, 330], [560, 460], [420, 500], [230, 500], [120, 440]],
  [[290, 810], [292, 620], [300, 480]], [[354, 810], [344, 620], [350, 480]],
];
// hills across the whole spread, run off the page's edges
const HILLS = 'M0 120 C 260 40, 520 110, 820 80 C 1100 50, 1400 120, 1700 70 C 1800 54, 1860 60, 1920 70 L1920 300 L0 300 Z';
const NEAR = 'M620 300 C 760 250, 900 120, 1100 90 C 1300 64, 1480 100, 1620 120 C 1760 136, 1860 110, 1920 100 L1920 300 Z';

function Tree({crown = 1, glaze = 1, fade = 0, red = 0, bare = 0, trunk = 1, sketch = 0}: {crown?: number; glaze?: number; fade?: number; red?: number; bare?: number; trunk?: number; sketch?: number}) {
  return (
    <At {...TREE}>
      {SKETCH.map((pts, i) => <Pencil key={i} points={pts} closed={i === 0} width={TREE.w} height={TREE.h} draw={sketch * 1.3 - i * 0.15} weight={2.2} />)}
      <Wash d={TRUNK} width={TREE.w} height={TREE.h} pigment="op" strength={0.85} paint={trunk} dry={trunk} from={[0.5, 1]} granulate={0.8} />
      <div style={{position: 'absolute', inset: 0, opacity: bare > 0.55 ? 1 - Math.min(1, (bare - 0.55) / 0.45) : undefined}}>
        <Wash d={CROWN} width={TREE.w} height={TREE.h} pigment="warn" strength={0.85} paint={crown} dry={crown} from={[0.5, 0.35]} granulate={0.15} lift={bare} liftFrom={[0.5, 0.1]} />
        {fade < 1 && <Glaze d={CROWN} width={TREE.w} height={TREE.h} pigment="data" strength={0.62} glaze={glaze} lift={fade} liftFrom={[0.5, 0]} />}
        <Glaze d={CROWN} width={TREE.w} height={TREE.h} pigment="grad" strength={0.92} glaze={red} reach={0.36} side={[0.8, 0.1]} wet lift={bare} liftFrom={[0.5, 0.1]} />
      </div>
    </At>
  );
}

/** Hills across the spread: summer green, or autumn sienna */
function Hills({paint, near = paint, autumn = false, strength = 1}: {paint: number; near?: number; autumn?: boolean; strength?: number}) {
  const pigment = autumn ? 'op' : 'good';
  return (
    <>
      <At x={0} y={600} w={1920} h={300}><Wash d={HILLS} width={1920} height={300} pigment={pigment} strength={(autumn ? 0.42 : 0.62) * strength} paint={paint} dry={paint} from="left" granulate={0.5} /></At>
      <At x={0} y={600} w={1920} h={300}><Wash d={NEAR} width={1920} height={300} pigment={pigment} strength={(autumn ? 0.5 : 0.8) * strength} paint={near} dry={near} from="left" granulate={0.6} /></At>
    </>
  );
}

function Cover() {
  const t = useTime();
  const leaf = maple(310, 560, 520, 12, 5);
  return (
    <Book turn={once(t, 3.1, 4.4, sine)}>
      <At x={136} y={220} w={760} h={400}><Title text={'Why Leaves Turn\nRed and Gold'} by="a little book about autumn" size={98} pigment="warn" swash={once(t, 1.2, 2.2, sine)} write={once(t, 0.1, 1.6, linear)} /></At>
      <At x={0} y={0} w={1920} h={1080}><Spatter from={[860, 520]} to={[1180, 640]} width={1920} height={1080} pigment="warn" count={26} spread={170} size={17} flick={once(t, 1.2, 2.2, sine)} seed={7} /></At>
      <At x={1150} y={120} w={620} h={680}>
        <Wash d={leaf} width={620} height={680} pigment="grad" strength={0.82} paint={once(t, 0.2, 1.4)} dry={once(t, 1.4, 2.8)} from={[0.5, 0.45]} granulate={0.35} />
        <Glaze d={leaf} width={620} height={680} pigment="warn" strength={0.8} glaze={once(t, 0.8, 2.0)} reach={0.7} side={[0.25, 0.85]} wet />
      </At>
    </Book>
  );
}

const RAYS: Pt[][] = [[[780, 230], [940, 250], [1090, 300]], [[780, 300], [940, 340], [1100, 400]], [[760, 360], [900, 440], [1110, 500]]];
function Summer() {
  const t = useTime(), rays = once(t, 2.8, 3.7, sine), sun = once(t, 0.1, 1.2);
  return (
    <Book turn={once(t, 3.8, 5.0, sine)}>
      <Hills paint={once(t, 0, 1.4, sine)} near={once(t, 0.8, 2.0, sine)} />
      <At x={500} y={120} w={260} h={260}><Wash d={blob(130, 130, 92, 3, 9, 0.06)} width={260} height={260} pigment="warn" strength={0.9} paint={sun} dry={sun} granulate={0.1} /></At>
      {RAYS.map((ray, i) => <At key={i} x={0} y={0} w={1920} h={1080}><Pencil points={ray} width={1920} height={1080} draw={rays * 1.4 - i * 0.2} arrow /></At>)}
      <Tree sketch={once(t, 0.3, 1.1, linear)} trunk={once(t, 0.8, 1.7)} crown={once(t, 1.3, 2.3)} glaze={once(t, 1.9, 3.0, sine)} />
      <At x={1590} y={50}><Note text="chlorophyll" to={[-20, 125]} write={once(t, 2.4, 3.3, linear)} size={46} /></At>
      <At x={1500} y={560}><Note text="food" to={[-110, 40]} write={once(t, 3.2, 3.8, linear)} size={44} /></At>
    </Book>
  );
}

function Autumn() {
  const t = useTime(), tree = once(t, 0, 0.6), hills = once(t, 0, 1.2, sine), night = once(t, 0.8, 2.0, sine), arc = once(t, 0.4, 1.4, sine), sun = once(t, 0.6, 1.4);
  return (
    <Book turn={once(t, 4.4, 5.6, sine)}>
      <Hills paint={hills} autumn />
      {/* evening: a cold sky glazed down from the top of the left page, the moon lifted out of it */}
      <At x={44} y={24} w={916} h={560}>
        <Wash d="M-20 -20 L910 -20 L910 306 C 856 336, 736 276, 596 328 C 446 386, 276 336, 136 406 C 66 438, 20 432, -20 442 Z" width={916} height={560} pigment="data" strength={0.62} paint={night} dry={night} from="top" granulate={0.9}
          lift={0.16 * once(t, 1.7, 2.3)} liftFrom={[0.7, 0.3]} />
      </At>
      <At x={0} y={0} w={1920} h={1080}><Pencil points={[[150, 690], [330, 560], [520, 530], [710, 560], [880, 690]]} width={1920} height={1080} draw={arc} arrow /></At>
      <At x={440} y={460} w={160} h={160}><Wash d={blob(80, 80, 52, 6, 8, 0.06)} width={160} height={160} pigment="grad" strength={0.7} paint={sun} dry={sun} granulate={0.1} /></At>
      <At x={620} y={470}><Note text="short days" write={arc} size={46} /></At>
      <Tree trunk={tree} crown={tree} glaze={tree} fade={once(t, 2.0, 3.4, sine)} red={once(t, 3.5, 4.6, sine)} />
      <At x={0} y={0} w={1920} h={1080}><Spatter from={[1800, 90]} to={[1470, 260]} width={1920} height={1080} pigment="grad" count={34} spread={170} size={13} flick={once(t, 3.4, 4.5, linear)} seed={3} /></At>
      <At x={1640} y={510}><Note text={'gold,\nall along'} to={[-110, 4]} write={once(t, 2.8, 3.6, linear)} size={46} /></At>
    </Book>
  );
}

// leaves letting go: a gust lifts and sweeps them right, they turn over in the air (their backs are paler) and settle on the hill
const FALLING = [[1180, 300, 1150, 800, 'warn'], [1330, 220, 1420, 790, 'grad'], [1490, 330, 1560, 810, 'warn'], [1260, 420, 1250, 820, 'grad'], [1420, 410, 1340, 800, 'warn'],
  [1560, 250, 1660, 790, 'grad'], [1380, 160, 1760, 820, 'warn'], [1220, 230, 1820, 760, 'grad'], [1600, 380, 1720, 805, 'warn']] as const;
function Rest() {
  const t = useTime(), fall = once(t, 0.6, 2.9, linear), bud = once(t, 2.4, 3.2), tree = once(t, 0, 0.6);
  return (
    <Book>
      <Hills paint={tree} autumn strength={0.85} />
      <Tree trunk={tree} crown={tree} fade={1} red={tree} bare={fall} />
      {FALLING.map(([x0, y0, x1, y1, pig], i) => {
        const k = Math.max(0, Math.min(1, fall * 1.7 - i * 0.08)), e = k * k * (3 - 2 * k);
        if (k <= 0) return null;
        const gust = Math.sin(Math.PI * Math.min(1, e * 1.4)) * (90 + i * 12), x = x0 + (x1 - x0) * e + gust + Math.sin(e * 9 + i) * 36 * (1 - e);
        const y = y0 + (y1 - y0) * e - Math.sin(Math.PI * Math.min(1, e * 2)) * 70;
        const still = 1 - e * 0.8, ry = Math.sin(e * 13 + i) * 70 * still, rx = Math.cos(e * 9 + i * 1.3) * 50 * still;
        const backSide = Math.cos((ry * Math.PI) / 180) * Math.cos((rx * Math.PI) / 180) < 0;
        return <At key={i} x={x - 60} y={y - 120} w={120} h={140} style={{transform: `perspective(520px) rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg) rotate(${(Math.sin(e * 7 + i * 2) * 40 + i * 25).toFixed(1)}deg)`, opacity: backSide ? 0.62 : 1}}>
          <Wash d={maple(60, 110, 100, 0, 30 + i)} width={120} height={140} pigment={pig} strength={0.85} granulate={0.2} wobble={4} />
        </At>;
      })}
      <At x={1510} y={470} w={80} h={80}><Wash d={blob(40, 40, 16, 8, 5, 0.1, 1.4)} width={80} height={80} pigment="good" strength={0.9} paint={bud} dry={bud} granulate={0.2} wobble={3} /></At>
      <At x={1590} y={360}><Note text={'a bud,\nfor spring'} to={[-50, 130]} write={bud} size={46} /></At>
    </Book>
  );
}

const SWATCHES = [{pigment: 'good', label: 'green'}, {pigment: 'warn', label: 'gold', strength: 0.85}, {pigment: 'grad', label: 'red'}, {pigment: 'op', label: 'rest', strength: 0.45}];
/** The swatch card: a loose card above the book that keeps each chapter's colour through the page turns, laid open at the end */
function Palette() {
  const t = useTime();
  const shown = interpolate(t, [6.9, 7.6, 12.4, 13.0, 13.3, 13.9, 18.5, 19.1], [0, 1, 1, 2, 2, 3, 3, 4], {easing: out, clamp: true});
  const open = once(t, 18.0, 18.9, sine);
  const x = 70 + 152 * open, y = 50 + 115 * open, scale = 1 + 0.55 * open, rotate = 3 * open;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 420, height: 430, opacity: once(t, 6.7, 7.1), transform: `scale(${scale}) rotate(${rotate}deg)`}}>
      <div style={{position: 'absolute', left: 14, top: 14, width: 390, height: 400, transform: 'rotate(-3deg)'}}>
        <Swatches card columns={2} cell={150} shown={shown} items={SWATCHES} />
      </div>
    </div>
  );
}

export default function Reel() {
  return (
    <>
      <Sequence from={0} duration={4.4}><Cover /></Sequence>
      <Sequence from={4.4} duration={5}><Summer /></Sequence>
      <Sequence from={9.4} duration={5.6}><Autumn /></Sequence>
      <Sequence from={15}><Rest /></Sequence>
      <Palette />
    </>
  );
}
