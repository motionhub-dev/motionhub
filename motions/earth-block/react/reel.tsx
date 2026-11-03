// Earth Block's reel: twenty seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
import {Easing, interpolate, useTime} from '@motionhub/runtime';
import {C, type P3, type Pt} from './parts/earth.ts';
import {Paper} from './parts/paper.tsx';
import {Block} from './parts/block.tsx';
import {Fall} from './parts/fall.tsx';
import {Seep} from './parts/seep.tsx';
import {Core} from './parts/core.tsx';
import {Grains} from './parts/grains.tsx';
import {Shaft} from './parts/shaft.tsx';
import {Tag} from './parts/tag.tsx';
import {Slabs} from './parts/slabs.tsx';
import {Heading} from './parts/heading.tsx';

export const reel = {seconds: 21, width: 1920, height: 1080};
/** What happens when, for the motion's sound (sound.json): the block lands, water draws down through the layers, the face is cut, the core is pulled, the shaft is sunk, the slabs are weighed */
export const cues = [
  {at: 0, role: 'move', dur: 1.4}, {at: 1.4, role: 'land'}, {at: 2, role: 'draw', dur: 1.2}, {at: 2.4, role: 'land'}, {at: 4.3, role: 'land'},
  {at: 6, role: 'move', dur: 1.2}, {at: 6, role: 'cut'}, {at: 7.6, role: 'draw', dur: 2.6}, {at: 7.7, role: 'land'}, {at: 9.5, role: 'land'},
  {at: 10.8, role: 'land'}, {at: 12, role: 'move', dur: 1.8}, {at: 13.9, role: 'draw', dur: 1}, {at: 14.9, role: 'count'},
  {at: 15.2, role: 'draw', dur: 0.8}, {at: 15.8, role: 'move', dur: 1.6}, {at: 16.6, role: 'land'}, {at: 18.8, role: 'draw', dur: 1},
  {at: 19.8, role: 'count'},
];

const ease = Easing.inOutSine, out = Easing.outQuart;
/** A value through keyframes [time, value], eased between each pair */
const keys = (t: number, frames: Array<[number, number]>, easing = ease) => interpolate(t, frames.map((f) => f[0]), frames.map((f) => f[1]), {easing});
/** A progress that rises from `on` and falls from `off`, each over `dur` */
const pulse = (t: number, on: number, off = Infinity, dur = 0.5) => Math.min(interpolate(t, [on, on + dur], [0, 1]), interpolate(t, [off, off + 0.35], [1, 0]));

const LAYERS = [{h: 0.5, color: C.soil}, {h: 1.4, color: C.sand}, {h: 0.42, color: C.clay}, {h: 0.5, color: C.rock}];
const CLAY_TOP = -1.9, CUT = 4.6, WELL = 1.5;
const CORE_BANDS = [{h: 0.5, color: C.soil}, {h: 0.55, color: C.sand}, {h: 0.85, color: '#6E8CA3'}, {h: 0.42, color: C.clay}, {h: 0.5, color: C.rock}];
const RIVER = [{pts: [[0, 3.1], [1.9, 2.9], [3.3, 3.8], [4.6, 3.3], [6, 3.0], [6, 3.8], [4.7, 4.1], [3.2, 4.6], [1.8, 3.7], [0, 3.9]] as Array<[number, number]>, color: C.water}];
const FARM = [{x: 0.9, y: 0.8, w: 1, d: 0.8, h: 0.62, color: C.wall}, {x: 2.2, y: 0.7, w: 0.6, d: 0.6, h: 0.42, color: C.wall}];
const TREES = [[4.3, 1, 0.5], [5, 1.9, 0.7], [4.5, 2.2, 0.42], [3.4, 0.7, 0.55], [0.9, 2.1, 0.45], [1, 5, 0.55], [2.1, 5.2, 0.42], [4.6, 5.1, 0.6]].map(([x, y, h]) => ({x, y, w: 0.5, d: 0.5, h, color: C.leaf}));
const onCut = (x: number, z: number): P3 => [x, CUT, z];
const SINK: P3[][] = [
  [onCut(1, 0), onCut(1.3, -0.5), onCut(1.1, -1.2), onCut(1.5, CLAY_TOP + 0.08)],
  [onCut(2.9, 0), onCut(2.7, -0.5), onCut(3.1, -1.2), onCut(2.8, CLAY_TOP + 0.08)],
  [onCut(5, 0), onCut(5.2, -0.5), onCut(4.8, -1.2), onCut(5.1, CLAY_TOP + 0.08)],
];
const RUN: P3[][] = [[[1, 3.5, 0], [1.9, 3.3, 0], [3.3, 4.2, 0], [4.7, 3.7, 0], [6, 3.4, 0]]];
const AIR: P3[][] = [[[1.2, 2.5, 0], [1.2, 2.5, 1.1], [1.6, 2.5, 2.2]], [[3.2, 2.6, 0], [3.1, 2.6, 1.2], [3.5, 2.6, 2.3]], [[4.8, 3, 0], [4.9, 3, 1], [4.6, 3, 2.1]]];
const DRILL: Pt = [3.3, 2.8], CORE_AT: Pt = [1440, 170];

// Beats: rain on the field (0–5.6), cut it open and follow the water down (5.6–11.6), pull a core (11.6–15), sink a well (15–18.4), weigh it (18.4–21)
export default function Reel() {
  const t = useTime();
  // one camera for every part: it settles, turns to the cut, steps aside for the core, comes back for the well, and makes room for the slabs
  const view = {
    at: [keys(t, [[0, 980], [6.0, 980], [7.8, 1000], [11.6, 1000], [12.8, 780], [15.0, 780], [16.0, 960], [18.4, 960], [19.6, 460]]), keys(t, [[0, 470], [1.6, 380], [6.0, 380], [7.8, 340], [11.6, 340], [12.8, 380], [15.0, 380], [16.0, 350], [18.4, 350], [19.6, 360]])] as Pt,
    k: keys(t, [[0, 66], [1.6, 84], [6.0, 84], [7.8, 92], [18.4, 92], [19.6, 58]]),
    yaw: keys(t, [[6.0, 0], [7.8, -20]]),
  };
  const lift = interpolate(t, [0, 1.4], [0.8, 0], {easing: out});
  const clock = t * 2.2, dip = keys(t, [[16.2, 0], [18.2, 0.6]]);
  const tagOff = 5.4;
  return (
    <>
      <Paper note="Illustrative · depth not to scale" />
      <Block view={view} layers={LAYERS} ribbons={RIVER} solids={[...FARM, ...TREES]} lift={lift} cut={CUT} slide={keys(t, [[6.0, 0], [7.2, 1]])} level={{z: keys(t, [[9.8, CLAY_TOP], [11.8, -1.05]]), on: 2, dip: {x: WELL, depth: dip, width: 0.75}}} />
      <Core view={view} from={DRILL} to={CORE_AT} bands={CORE_BANDS} t={keys(t, [[12.0, 0], [13.8, 1]])} gone={interpolate(t, [15.0, 15.4], [0, 1])} />
      <Shaft view={view} at={[WELL, CUT]} to={-1.8} t={keys(t, [[15.2, 0], [16.0, 1]])} rise={interpolate(t, [15.8, 16.4, 16.6, 17.4], [0, 0.42, 0.42, 1])} />
      <Seep view={view} paths={SINK} clock={clock} reach={Math.min(interpolate(t, [7.6, 8.2, 8.4, 9.4, 9.6, 10.2], [0, 0.3, 0.3, 0.72, 0.72, 1]), interpolate(t, [11.6, 12.0], [1, 0]))} />
      <Seep view={view} paths={RUN} n={9} clock={clock} reach={Math.min(interpolate(t, [2.0, 3.2], [0, 1]), interpolate(t, [5.6, 6.0], [1, 0]))} color={C.foam} size={7} />
      <Seep view={view} paths={AIR} n={4} clock={clock} reach={Math.min(interpolate(t, [3.2, 4.2], [0, 1]), interpolate(t, [5.6, 6.0], [1, 0]))} color={C.foam} />
      <Fall view={view} area={[0, 0, 6, 6]} clock={clock * 0.6} show={Math.min(interpolate(t, [0.6, 1.6], [0, 1]), interpolate(t, [5.6, 6.2], [1, 0]))} clear={[60, 40, 860, 150]} />
      <Tag view={view} on={[5.2, 3.5, 0]} elbow={[1520, 340]} to={1840} text="Runs off" note="about 10%" color={C.deep} t={pulse(t, 2.4, tagOff, 0.6)} />
      <Tag view={view} on={[4.6, 3, 2.1]} elbow={[1520, 180]} to={1840} text="Back to the air" note="about 40%" t={pulse(t, 3.5, tagOff, 0.6)} />
      <Tag view={view} on={[1.6, 6, -0.25]} elbow={[420, 640]} to={80} text="Soaks in" note="about 50%" color={C.soil} t={pulse(t, 4.3, tagOff, 0.6)} />
      <Tag view={view} on={onCut(0.5, -0.25)} elbow={[440, 360]} to={80} text="Soil" note="holds some" color={C.soil} t={pulse(t, 7.7, 11.4, 0.6)} />
      <Tag view={view} on={onCut(0.6, -0.8)} elbow={[440, 520]} to={80} text="Sand" note="loose: water passes" color="#8A6A36" t={pulse(t, 8.6, 11.4, 0.6)} />
      <Tag view={view} on={onCut(0.9, -2.1)} elbow={[440, 680]} to={80} text="Clay" note="tight: it stops here" color={C.clay} t={pulse(t, 9.5, 11.4, 0.6)} />
      <Tag view={view} on={onCut(5.5, -1.5)} elbow={[1560, 620]} to={1840} text="Aquifer" note="full, up to the table" color={C.deep} t={pulse(t, 10.8, 11.4, 0.6)} />
      <Tag view={view} on={onCut(WELL + 0.42, -1.05 - dip * 0.65)} elbow={[440, 620]} to={80} text="Water table" note="drawn down by the well" color={C.deep} t={pulse(t, 16.6, 18.4, 0.6)} />
      <Grains at={[1660, 610]} size={300} from={[CORE_AT[0] + 40, CORE_AT[1] + 110]} show={interpolate(t, [13.4, 13.9], [0, 1])} level={keys(t, [[13.9, 0], [14.9, 1]])} label="Water, in the gaps" gone={interpolate(t, [15.0, 15.4], [0, 1])} />
      {t >= 18.8 && <Slabs t={interpolate(t, [18.8, 19.8], [0, 1])} unit="%" scale={50} items={[{value: 30, label: 'of fresh water: in the ground', color: C.water, at: [1240, 380]}, {value: 0.3, label: 'lakes, rivers, swamps', color: C.deep, at: [1660, 540]}]} source="USGS, Where is Earth's water?" sourceAt={[1000, 800]} />}
      <Heading text="Where does the rain go?" size={64} show={Math.min(interpolate(t, [0.1, 0.6], [0, 1]), interpolate(t, [6.0, 6.5], [1, 0]))} />
    </>
  );
}
