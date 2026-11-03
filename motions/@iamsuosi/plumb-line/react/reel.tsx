// Plumb Line's reel: twenty seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
import {Easing, interpolate, useTime} from '@motionhub/runtime';
import {C, EDGE, group} from './parts/plumb.ts';
import {Strata} from './parts/strata.tsx';
import {Gauge} from './parts/gauge.tsx';
import {Bob} from './parts/bob.tsx';
import {Rays} from './parts/rays.tsx';
import {Cutouts, type Item} from './parts/cutouts.tsx';
import {Sparks} from './parts/sparks.tsx';
import {Standard} from './parts/standard.tsx';
import {Callout} from './parts/callout.tsx';
import {Heading} from './parts/heading.tsx';

export const reel = {seconds: 22, width: 1920, height: 1080};
/** What happens when, for the motion's sound (sound.json): a card arrives, the camera sinks stop by stop, living light sparks, the last line lands; nothing at the pull-back until Everest */
export const cues = [
  {at: 0.1, role: 'land'}, {at: 1.8, role: 'move', dur: 1.8}, {at: 3.2, role: 'land'}, {at: 5.0, role: 'move', dur: 2.2}, {at: 6.9, role: 'land'},
  {at: 8.4, role: 'move', dur: 2.2}, {at: 9.2, role: 'draw', dur: 1.6}, {at: 10.4, role: 'land'}, {at: 12.0, role: 'move', dur: 2.2}, {at: 13.4, role: 'land'},
  {at: 15.0, role: 'move', dur: 2.2}, {at: 16.7, role: 'land'}, {at: 19.9, role: 'land'},
];

const ease = Easing.inOutSine;
/** A value through keyframes [time, value], eased between each pair */
const keys = (t: number, frames: Array<[number, number]>) => interpolate(t, frames.map((f) => f[0]), frames.map((f) => f[1]), {easing: ease});
/** A card's progress: its line draws and the card arrives from `on`, and it leaves from `off`, before the camera moves */
const card = (t: number, on: number, off = 99) => Math.min(interpolate(t, [on, on + 0.6], [0, 1]), interpolate(t, [off, off + 0.35], [1, 0]));

const BANDS = [{from: 0, color: '#3FA3C6'}, {from: 200, color: '#1F78A6'}, {from: 1000, color: '#144C79'}, {from: 4000, color: '#0E3159'}, {from: 6000, color: '#123460'}];
const FLOOR = {at: 6000, notch: [520, 1120] as [number, number], to: 10935, color: '#040A18'};
const TICKS = [{at: 200, label: '200 m'}, {at: 0, label: '0 m'}, {at: 1000, label: '1,000 m'}, {at: 4000, label: '4,000 m'}, {at: 6000, label: '6,000 m'}, {at: 10935, label: '10,935 m'}];
const ZONES = [
  {name: 'Sunlight', note: 'plants can grow', from: 0, to: 200},
  {name: 'Twilight', note: 'the light gives out', from: 200, to: 1000},
  {name: 'Midnight', note: 'only living light', from: 1000, to: 4000},
  {name: 'Abyss', note: 'near freezing', from: 4000, to: 6000},
  {name: 'Hadal', note: 'trenches only', from: 6000, to: 10935},
];
const SHIP = 'M-130 4L-108 36L-26 36L-16 -2L-30 -6L-40 -6L-40 -24L-62 -24L-62 -6L-96 -6L-96 -24L-118 -24L-118 4ZM14 10L36 40L122 30L150 -8L92 -6L92 -24L68 -24L68 -5L42 -4L42 -22L20 -22L20 2Z';
const DUMBO = 'M-60 -6C-60 -60 60 -60 60 -6C60 16 44 26 40 42C30 34 26 30 20 50C12 36 6 34 0 54C-6 34 -12 36 -20 50C-26 30 -30 34 -40 42C-44 26 -60 16 -60 -6ZM-58 -30C-92 -56 -96 -20 -62 -14ZM58 -30C92 -56 96 -20 62 -14Z';
const LIFE: Item[] = [
  {shape: 'fish', x: 340, depth: 62, size: 0.8, color: C.amber}, {shape: 'fish', x: 500, depth: 84, size: 0.55, color: C.amber}, {shape: 'fish', x: 250, depth: 100, size: 0.6, color: C.amber}, {shape: 'fish', x: 620, depth: 50, size: 0.5, color: C.amber},
  {shape: 'whale', x: 640, depth: 620, size: 1.5}, {shape: 'fish', x: 1160, depth: 860, size: 0.8, color: C.pale, flip: true}, {shape: 'fish', x: 1290, depth: 900, size: 0.55, color: C.pale, flip: true},
  {shape: 'jelly', x: 1180, depth: 1900, size: 1, color: C.pale}, {shape: 'angler', x: 640, depth: 2900, size: 1.3, color: '#2A5C8C'},
  {d: SHIP, x: 1040, depth: 3800, size: 1.2, color: '#0A2142'}, {d: DUMBO, x: 720, depth: 5000, size: 1.2, color: C.pale}, {shape: 'fish', x: 820, depth: 8336, size: 0.7, color: C.pale},
];

// One take down one axis: each stop is [when the camera leaves, when it arrives, depth held at the middle, log of the scale, where the weight hangs]
const STOPS: Array<[number, number, number, number, number]> = [
  [0, 0, 90, 0.602, 0],
  [1.8, 3.6, 90, 0.602, 200],
  [5.0, 7.2, 600, -0.022, 1000],
  [8.4, 10.6, 2500, -0.585, 2500],
  [12.0, 14.2, 4400, -0.42, 4000],
  [15.0, 17.2, 8500, -0.796, 10900],
  [17.8, 20.2, 5300, -1.133, 10900],
];
const along = (t: number, i: 2 | 3 | 4) => keys(t, STOPS.flatMap((s, j): Array<[number, number]> => j ? [[s[0], STOPS[j - 1][i]], [s[1], s[i]]] : [[0, s[i]]]));

export default function Reel() {
  const t = useTime(), clock = t * 2;
  const cam = {at: along(t, 2), scale: Math.pow(10, along(t, 3))}, d = along(t, 4);
  return (
    <>
      <Strata cam={cam} sky="#BFE7F0" bands={BANDS} floor={FLOOR} clock={clock} />
      <div style={{position: 'absolute', left: 0, top: 0, width: EDGE, height: 880, overflow: 'hidden'}}>
        <Rays cam={cam} to={200} clock={clock} />
        <Cutouts cam={cam} items={LIFE} clock={clock} />
        <Sparks cam={cam} from={1000} to={4000} clock={clock} show={interpolate(t, [9.2, 10.8], [0, 1])} />
        <Standard cam={cam} x={820} base={10935} height={8849} t={interpolate(t, [19.0, 20.4], [0, 1])} />
      </div>
      <Callout cam={cam} x={800} depth={200} at={[140, 620]} width={580} text="Nearly all the light ends here" note="about 200 m" t={card(t, 3.2, 4.8)} />
      <Callout cam={cam} x={760} depth={620} at={[110, 200]} width={480} text="Sperm whales hunt here" note="they dive past 1,000 m" t={card(t, 6.9, 8.2)} />
      <Callout cam={cam} x={1180} depth={1900} at={[110, 180]} width={560} text="3 in 4 animals make light" note="of those filmed, to 3,900 m" t={card(t, 10.4, 11.8)} />
      <Callout cam={cam} x={1040} depth={3800} at={[430, 90]} width={330} text="The Titanic" note="about 3,800 m" t={card(t, 13.4, 14.8)} />
      <Callout cam={cam} x={720} depth={5000} at={[110, 470]} width={420} text="Dumbo octopus" note="as deep as 6,900 m" t={card(t, 13.8, 14.8)} />
      <Callout cam={cam} x={820} depth={8336} at={[110, 240]} width={570} text="The deepest fish ever filmed" note="8,336 m, a snailfish" t={card(t, 16.7, 17.6)} />
      <Callout cam={cam} x={820} depth={10935 - 8849} at={[1130, 260]} width={360} text="Everest" note="8,849 m, height to scale" t={card(t, 19.9)} />
      <Callout cam={cam} x={500} depth={100} at={[110, 200]} width={470} text="Nearly all the sunlight" note="the top 200 m, true to scale" t={card(t, 20.5)} />
      <Bob cam={cam} d={d} sub={`about ${group(Math.max(1, Math.round(d / 100) * 10))} atm`} />
      <Gauge cam={cam} ticks={TICKS} zones={ZONES} note="Figures not to scale" />
      <Heading text="How deep does the sea go?" size={68} show={Math.min(interpolate(t, [0.05, 0.5], [0, 1]), interpolate(t, [1.6, 2.0], [1, 0]))} />
    </>
  );
}
