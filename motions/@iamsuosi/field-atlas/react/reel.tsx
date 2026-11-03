// Field Atlas's reel: twenty-three seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
// The Indian Pacific, Sydney to Perth: 4,352 km (Wikipedia, "Indian Pacific"). The line is drawn through its towns, which is close enough
// at a continent's scale; the Adelaide leg runs out from Crystal Brook and back, as the train does. The straight is Guinness World Records'
// longest railway straight, 478 km between a point near Nurina and Loongana (WA) and one near Ooldea and Watson (SA); its two ends here are
// placed between those towns. Nullarbor is from Latin nullus arbor, no tree.
import {Easing, interpolate, useTime} from '@motionhub/runtime';
import {Atlas} from './parts/atlas.tsx';
import {Route} from './parts/route.tsx';
import {Stops} from './parts/stops.tsx';
import {Regions} from './parts/regions.tsx';
import {Legend} from './parts/legend.tsx';
import {Gloss} from './parts/gloss.tsx';
import {Place} from './parts/place.tsx';
import {Plate} from './parts/plate.tsx';
import {Note} from './parts/note.tsx';
import {Locator} from './parts/locator.tsx';
import {type LonLat} from './parts/geo.ts';

export const reel = {seconds: 23, width: 1920, height: 1080};

/** What happens when, for the motion's sound (sound.json): the camera turns and dives, the line draws, a figure counts, a card lands. Sparse: never a tick per stop */
export const cues = [
  {at: 0.3, role: 'land'}, {at: 0.4, role: 'move', dur: 2.2}, {at: 2.8, role: 'draw', dur: 7.6}, {at: 10.3, role: 'count'},
  {at: 11.4, role: 'move', dur: 2.6}, {at: 13.4, role: 'draw', dur: 1.6}, {at: 14.6, role: 'land'}, {at: 15.7, role: 'count'},
  {at: 18.4, role: 'move', dur: 2.4}, {at: 20.6, role: 'land'},
];

// the straight's two ends, and the sidings on it, set on the one line between them
const EAST: LonLat = [131.7, -30.48], WEST: LonLat = [126.75, -30.97];
const on = (lon: number): LonLat => [lon, EAST[1] + ((EAST[0] - lon) / (EAST[0] - WEST[0])) * (WEST[1] - EAST[1])];
const COOK = on(130.41), FORREST = on(128.11), LOONGANA = on(127.03);
const STRAIGHT: LonLat[] = [EAST, WEST];

const LINE: LonLat[] = [
  [151.21, -33.88], [150.69, -33.75], [150.31, -33.71], [150.16, -33.48], [149.58, -33.42], [149.1, -33.28], [148.18, -33.14], [147.15, -33.09],
  [144.3, -32.9], [142.42, -32.39], [141.47, -31.95], [141.0, -32.08], [138.84, -32.97], [138.21, -33.35],
  [138.59, -34.92], [138.21, -33.35],                                                 // to Adelaide and back to Crystal Brook
  [138.01, -33.18], [137.77, -32.49], [136.8, -31.25], [134.57, -30.71], [131.83, -30.45], EAST, COOK, FORREST, LOONGANA, WEST,
  [125.33, -31.01], [123.57, -31.03], [121.47, -30.75], [119.33, -31.23], [118.28, -31.48], [116.67, -31.65], [115.88, -31.95],
];

const STOPS = [
  {lon: 151.21, lat: -33.88, name: 'Sydney', note: 'NSW'},
  {lon: 141.47, lat: -31.95, name: 'Broken Hill', note: 'NSW'},
  {lon: 138.59, lat: -34.92, name: 'Adelaide', note: 'SA'},
  {lon: COOK[0], lat: COOK[1], name: 'Cook', note: 'SA'},
  {lon: 121.47, lat: -30.75, name: 'Kalgoorlie', note: 'WA'},
  {lon: 115.88, lat: -31.95, name: 'Perth', note: 'WA'},
];

/** The states the line crosses */
const STATES = {'AU-NSW': 1, 'AU-SA': 1, 'AU-WA': 1};

const io = Easing.inOutSine, outS = Easing.bezier(0.39, 0.575, 0.565, 1);
/** A value that steps between keyframes, each move eased in and out: [time, value] pairs */
const keys = (t: number, k: Array<[number, number]>, easing = io) => interpolate(t, k.map(([a]) => a), k.map(([, b]) => b), {easing});
const at = (t: number, a: number, b: number, easing = outS) => interpolate(t, [a, b], [0, 1], {easing});
/** In over [a, a + 0.6], out over [b, b + 0.5] */
const shown = (t: number, a: number, b = 99) => Math.min(at(t, a, a + 0.6), 1 - at(t, b, b + 0.5, Easing.inOutSine));

export default function Reel() {
  const t = useTime();
  // the camera: the globe turns to Australia, rides the line coast to coast, dives to the plain, and climbs back out to the globe
  const lon = keys(t, [[0, 70], [2.6, 133.5], [11.4, 133.5], [14.0, 129.2], [18.4, 129.2], [20.8, 131.5], [23, 134]]);
  const lat = keys(t, [[0, -8], [2.6, -28.2], [11.4, -28.2], [14.0, -30.75], [18.4, -30.75], [20.8, -24]]);
  const zoom = keys(t, [[0, 0], [2.6, 1.95], [11.4, 1.95], [14.0, 5.0], [18.4, 5.0], [20.8, 0.35]]);
  const mix = keys(t, [[2.8, 0], [3.8, 0.3], [9.4, 0.3], [10.6, 0]]);
  const d = at(t, 2.8, 10.4, io), straight = at(t, 13.4, 15.0, io);
  const told = at(t, 11.4, 12.2, io);
  const stops = shown(t, 2.8, 11.4);
  const gloss = Math.min(interpolate(t, [14.4, 16.4], [0, 1]), 1 - at(t, 18.4, 18.9, io));
  const ripple = interpolate(t, [20.8, 23], [0, 1]);
  return (
    <Atlas lon={lon} lat={lat} zoom={zoom} follow={LINE} followAt={d} followMix={mix}
      under={<Regions values={STATES} max={2} reach={LINE} fill={d} dim={at(t, 11.4, 12.6, io)} />}>
      <Place lon={130} lat={-34.9} name="Great Australian Bight" kind="water" size={32} zoomIn={1.6} zoomOut={3.4} show={shown(t, 5.6, 11.4)} />
      <Place lon={146.4} lat={-30.2} name="New South Wales" kind="region" zoomIn={1.6} zoomOut={3.6} show={shown(t, 3.2, 11.4)} />
      <Place lon={135.6} lat={-27.6} name="South Australia" kind="region" zoomIn={1.6} zoomOut={3.6} show={shown(t, 5.4, 11.4)} />
      <Place lon={120} lat={-25} name="Western Australia" kind="region" zoomIn={1.6} zoomOut={3.6} show={shown(t, 7.8, 11.4)} />
      <Route path={LINE} draw={d} told={told} head={1 - at(t, 10.4, 11.0)} />
      <Route path={STRAIGHT} draw={straight} head={1 - at(t, 15.0, 15.6)} />
      <Legend title="States on the line" steps={[{value: 1, label: 'crossed'}]} max={2} shown={at(t, 3.4, 4.0)} paths={[{label: 'Indian Pacific', told}]} source="Natural Earth" x={96} y={96} show={shown(t, 3.0, 9.6)} />
      <Stops stops={STOPS} reach={LINE} reached={d} title="Indian Pacific" x={1404} y={96} show={stops} />
      <Place lon={130.9} lat={-29.55} name="South Australia" kind="region" zoomIn={4.2} show={shown(t, 13.0, 18.4)} />
      <Place lon={128.3} lat={-29.55} name="Western Australia" kind="region" zoomIn={4.2} show={shown(t, 13.0, 18.4)} />
      <Place lon={131.83} lat={-30.45} name="Ooldea" side="above" zoomIn={4.2} zoomOut={6} show={shown(t, 13.4, 18.4)} />
      <Place lon={COOK[0]} lat={COOK[1]} name="Cook" side="above" zoomIn={4.2} zoomOut={6} show={shown(t, 13.6, 18.4)} />
      <Place lon={FORREST[0]} lat={FORREST[1]} name="Forrest" side="above" zoomIn={4.2} zoomOut={6} show={shown(t, 14.1, 18.4)} />
      <Place lon={LOONGANA[0]} lat={LOONGANA[1]} name="Loongana" side="above" zoomIn={4.2} zoomOut={6} show={shown(t, 14.5, 18.4)} />
      <Gloss word="Nullarbor" origin="from Latin · nullus arbor" meaning="no tree" x={600} y={640} show={gloss} />
      <Note value={interpolate(t, [10.3, 11.2], [0, 4352], {easing: Easing.outQuart})} unit="km" label="Sydney to Perth by rail" x={120} y={130} show={shown(t, 10.1, 11.4)} />
      <Note value={interpolate(t, [15.7, 16.6], [0, 478], {easing: Easing.outQuart})} unit="km" label="without a bend: the longest railway straight on Earth" x={96} y={130} accent show={shown(t, 15.5, 18.4)} />
      <Locator x={1680} y={250} r={112} show={1 - at(t, 18.4, 18.9)} />
      <Place lon={129.2} lat={-30.73} name="The long straight" kind="point" side="right" size={34} zoomOut={3.2} show={at(t, 20.0, 20.6, Easing.outBack)} ripple={ripple} />
      <Plate kicker="Australia · the Indian Pacific" title="Ocean to ocean by rail" x={1010} y={110} size={78} show={shown(t, 0.1, 2.4)} />
      <Plate kicker="The Nullarbor · 30.7° S, 129.2° E" title="478 km without a bend" size={80} show={at(t, 20.4, 21.4)} />
    </Atlas>
  );
}
