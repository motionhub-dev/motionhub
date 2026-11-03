// Field Atlas's reel: twenty-one seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
// The paths of totality are NASA GSFC's predictions by Fred Espenak (public domain): limits and central line every 2 minutes UT over North America.
// The states each path crossed are NASA's lists; the crossing is where the central lines meet.
import {Easing, interpolate, useTime} from '@motionhub/runtime';
import {Atlas} from './parts/atlas.tsx';
import {Route} from './parts/route.tsx';
import {Regions} from './parts/regions.tsx';
import {Legend} from './parts/legend.tsx';
import {Place} from './parts/place.tsx';
import {Plate} from './parts/plate.tsx';
import {Note} from './parts/note.tsx';
import {Locator} from './parts/locator.tsx';
import {unit, type LonLat} from './parts/geo.ts';

export const reel = {seconds: 21, width: 1920, height: 1080};

/** What happens when, for the motion's sound (sound.json): the camera turns and rides, a route draws, a plate or a place lands, a figure counts. Sparse: never a tick per region */
export const cues = [
  {at: 0.3, role: 'land'}, {at: 0.4, role: 'move', dur: 2.0}, {at: 2.4, role: 'draw', dur: 3.6}, {at: 6.2, role: 'land'},
  {at: 7.4, role: 'draw', dur: 3.2}, {at: 12.5, role: 'count'}, {at: 12.8, role: 'move', dur: 2.8}, {at: 15.2, role: 'land'},
  {at: 16.8, role: 'count'}, {at: 17.4, role: 'count'}, {at: 17.6, role: 'move', dur: 2.0}, {at: 19.2, role: 'land'},
];

const E17 = {
  north: [[-126.84,45.35],[-125.11,45.32],[-123.44,45.27],[-121.84,45.2],[-120.31,45.11],[-118.82,45.01],[-117.39,44.89],[-116,44.76],[-114.65,44.61],[-113.34,44.45],[-112.08,44.29],[-110.84,44.11],[-109.64,43.92],[-108.47,43.73],[-107.33,43.52],[-106.22,43.31],[-105.13,43.09],[-104.07,42.85],[-103.03,42.62],[-102.02,42.38],[-101.02,42.12],[-100.04,41.87],[-99.09,41.6],[-98.15,41.33],[-97.23,41.06],[-96.32,40.78],[-95.43,40.49],[-94.56,40.2],[-93.69,39.9],[-92.84,39.6],[-92.01,39.29],[-91.18,38.98],[-90.37,38.66],[-89.56,38.34],[-88.77,38.02],[-87.98,37.69],[-87.2,37.35],[-86.43,37.01],[-85.67,36.67],[-84.91,36.32],[-84.16,35.97],[-83.41,35.61],[-82.67,35.25],[-81.93,34.89],[-81.19,34.52],[-80.46,34.15],[-79.72,33.77],[-78.99,33.38],[-78.26,33],[-77.53,32.61],[-76.8,32.21],[-76.06,31.81]] as LonLat[],
  south: [[-126.27,44.47],[-124.59,44.42],[-122.98,44.35],[-121.43,44.27],[-119.94,44.17],[-118.51,44.05],[-117.12,43.93],[-115.77,43.79],[-114.47,43.64],[-113.2,43.48],[-111.97,43.3],[-110.78,43.12],[-109.62,42.93],[-108.48,42.73],[-107.38,42.52],[-106.3,42.31],[-105.24,42.09],[-104.21,41.86],[-103.2,41.62],[-102.22,41.38],[-101.25,41.13],[-100.3,40.87],[-99.37,40.61],[-98.46,40.34],[-97.56,40.07],[-96.68,39.79],[-95.82,39.51],[-94.96,39.22],[-94.12,38.93],[-93.29,38.63],[-92.48,38.33],[-91.67,38.02],[-90.88,37.71],[-90.09,37.4],[-89.31,37.08],[-88.54,36.75],[-87.78,36.42],[-87.02,36.09],[-86.27,35.76],[-85.53,35.41],[-84.79,35.07],[-84.06,34.72],[-83.33,34.37],[-82.6,34.01],[-81.88,33.65],[-81.15,33.28],[-80.43,32.91],[-79.71,32.54],[-78.99,32.16],[-78.27,31.78],[-77.54,31.39],[-76.82,31]] as LonLat[],
  center: [[-126.55,44.91],[-124.84,44.87],[-123.2,44.81],[-121.63,44.73],[-120.12,44.64],[-118.66,44.53],[-117.25,44.41],[-115.88,44.27],[-114.56,44.12],[-113.27,43.97],[-112.02,43.8],[-110.81,43.62],[-109.63,43.43],[-108.47,43.23],[-107.35,43.02],[-106.26,42.81],[-105.19,42.59],[-104.14,42.35],[-103.12,42.12],[-102.11,41.88],[-101.14,41.62],[-100.17,41.37],[-99.23,41.11],[-98.31,40.84],[-97.39,40.56],[-96.5,40.28],[-95.62,40],[-94.76,39.71],[-93.91,39.41],[-93.07,39.12],[-92.24,38.81],[-91.43,38.5],[-90.62,38.19],[-89.83,37.87],[-89.04,37.55],[-88.26,37.22],[-87.49,36.89],[-86.73,36.55],[-85.97,36.21],[-85.22,35.87],[-84.48,35.52],[-83.73,35.17],[-83,34.81],[-82.27,34.45],[-81.53,34.08],[-80.81,33.72],[-80.08,33.34],[-79.35,32.96],[-78.63,32.58],[-77.9,32.2],[-77.17,31.8],[-76.44,31.41]] as LonLat[],
};
const E24 = {
  north: [[-112.73,17.38],[-112.19,17.97],[-111.65,18.56],[-111.11,19.14],[-110.57,19.73],[-110.04,20.31],[-109.51,20.9],[-108.98,21.48],[-108.45,22.06],[-107.92,22.64],[-107.38,23.22],[-106.84,23.8],[-106.31,24.37],[-105.76,24.95],[-105.22,25.52],[-104.66,26.1],[-104.11,26.67],[-103.54,27.25],[-102.97,27.82],[-102.39,28.39],[-101.8,28.96],[-101.2,29.54],[-100.59,30.11],[-99.97,30.68],[-99.33,31.25],[-98.68,31.82],[-98.02,32.39],[-97.34,32.96],[-96.65,33.53],[-95.93,34.1],[-95.2,34.67],[-94.45,35.23],[-93.67,35.8],[-92.87,36.37],[-92.05,36.93],[-91.19,37.5],[-90.31,38.06],[-89.4,38.62],[-88.45,39.19],[-87.47,39.75],[-86.44,40.3],[-85.38,40.86],[-84.27,41.41],[-83.11,41.96],[-81.89,42.51],[-80.62,43.05],[-79.28,43.59],[-77.88,44.13],[-76.39,44.66],[-74.83,45.18],[-73.17,45.69],[-71.4,46.19],[-69.52,46.69],[-67.51,47.16],[-65.34,47.62],[-63,48.07],[-60.45,48.48],[-57.64,48.87],[-54.53,49.22],[-51.01,49.51]] as LonLat[],
  south: [[-111.22,16.27],[-110.68,16.85],[-110.14,17.43],[-109.61,18.01],[-109.08,18.59],[-108.55,19.17],[-108.03,19.74],[-107.5,20.32],[-106.97,20.89],[-106.45,21.46],[-105.92,22.03],[-105.39,22.6],[-104.86,23.17],[-104.32,23.74],[-103.78,24.31],[-103.24,24.87],[-102.69,25.44],[-102.13,26],[-101.57,26.57],[-101,27.13],[-100.42,27.69],[-99.83,28.25],[-99.23,28.81],[-98.62,29.37],[-98,29.93],[-97.37,30.49],[-96.72,31.05],[-96.06,31.61],[-95.38,32.17],[-94.69,32.72],[-93.97,33.28],[-93.24,33.84],[-92.49,34.39],[-91.72,34.94],[-90.92,35.5],[-90.09,36.05],[-89.24,36.6],[-88.36,37.15],[-87.45,37.7],[-86.5,38.24],[-85.52,38.79],[-84.5,39.33],[-83.43,39.87],[-82.32,40.41],[-81.17,40.95],[-79.95,41.48],[-78.68,42.01],[-77.35,42.53],[-75.94,43.05],[-74.46,43.56],[-72.89,44.07],[-71.23,44.56],[-69.46,45.05],[-67.57,45.53],[-65.55,45.99],[-63.36,46.43],[-60.99,46.86],[-58.4,47.26],[-55.53,47.62],[-52.32,47.95]] as LonLat[],
  center: [[-111.97,16.82],[-111.43,17.41],[-110.89,17.99],[-110.36,18.58],[-109.82,19.16],[-109.29,19.74],[-108.76,20.32],[-108.23,20.9],[-107.71,21.48],[-107.18,22.05],[-106.65,22.62],[-106.11,23.2],[-105.58,23.77],[-105.04,24.34],[-104.5,24.91],[-103.95,25.48],[-103.39,26.05],[-102.83,26.62],[-102.27,27.19],[-101.69,27.76],[-101.11,28.33],[-100.51,28.89],[-99.91,29.46],[-99.29,30.02],[-98.67,30.59],[-98.03,31.16],[-97.37,31.72],[-96.7,32.28],[-96.01,32.85],[-95.31,33.41],[-94.59,33.97],[-93.84,34.53],[-93.08,35.09],[-92.29,35.65],[-91.48,36.21],[-90.64,36.77],[-89.78,37.33],[-88.88,37.88],[-87.95,38.44],[-86.98,38.99],[-85.98,39.54],[-84.94,40.09],[-83.85,40.64],[-82.72,41.18],[-81.53,41.73],[-80.29,42.26],[-78.99,42.8],[-77.62,43.33],[-76.17,43.85],[-74.65,44.37],[-73.04,44.87],[-71.33,45.37],[-69.5,45.86],[-67.56,46.34],[-65.46,46.8],[-63.2,47.25],[-60.74,47.67],[-58.05,48.06],[-55.06,48.42],[-51.71,48.73]] as LonLat[],
};

const IN_2017 = ['US-OR', 'US-ID', 'US-MT', 'US-WY', 'US-NE', 'US-KS', 'US-IA', 'US-MO', 'US-IL', 'US-KY', 'US-TN', 'US-GA', 'US-NC', 'US-SC'];
const IN_2024 = ['US-TX', 'US-OK', 'US-AR', 'US-MO', 'US-IL', 'US-KY', 'US-TN', 'US-IN', 'US-OH', 'US-MI', 'US-PA', 'US-NY', 'US-VT', 'US-NH', 'US-ME'];
const ONCE = Object.fromEntries(IN_2017.map((id) => [id, 1]));
const TOTAL = Object.fromEntries(IN_2024.map((id) => [id, IN_2017.includes(id) ? 2 : 1]));
const BOTH = Object.fromEntries(IN_2024.filter((id) => IN_2017.includes(id)).map((id) => [id, 2]));
const CROSS: LonLat = [-89.271, 37.642];

const io = Easing.inOutSine, outS = Easing.bezier(0.39, 0.575, 0.565, 1), lin = Easing.linear;
/** A value that steps between keyframes, each move eased in and out: [time, value] pairs */
const keys = (t: number, k: Array<[number, number]>, easing = io) => interpolate(t, k.map(([a]) => a), k.map(([, b]) => b), {easing});
const at = (t: number, a: number, b: number, easing = outS) => interpolate(t, [a, b], [0, 1], {easing});
/** In over [a, a + 0.6], out over [b, b + 0.5] */
const shown = (t: number, a: number, b = 99) => Math.min(at(t, a, a + 0.6), 1 - at(t, b, b + 0.5, Easing.inOutSine));

export default function Reel() {
  const t = useTime();
  // the camera: the globe turns to North America, rides each shadow, comes down to the crossing, and climbs back out to the globe
  const lon = keys(t, [[0, 8], [2.4, -97], [12.4, -97], [13.4, -89.36], [17.6, -89.38], [19.6, -92], [21, -88]], io);
  const lat = keys(t, [[0, 12], [2.4, 38.5], [12.4, 38.5], [13.4, 37.5], [17.6, 37.48], [19.6, 33]], io);
  const zoom = keys(t, [[0, 0], [2.4, 1.75], [3.6, 2.2], [5.8, 2.2], [7.0, 1.75], [7.4, 1.75], [8.6, 2.05], [10.4, 2.05], [11.6, 1.75], [12.8, 1.75], [15.6, 6.3], [17.6, 6.25], [19.6, 0.3]]);
  const mix = keys(t, [[2.4, 0], [3.6, 0.55], [5.8, 0.55], [7.0, 0], [7.4, 0], [8.6, 0.85], [10.4, 0.85], [11.6, 0]]);
  const d17 = at(t, 2.4, 6.0, io), d24 = at(t, 7.4, 10.6, io);
  const ride = t >= 7.0;
  const told17 = Math.max(at(t, 7.0, 7.8, io) - at(t, 12.4, 13.2, io), at(t, 17.6, 18.6, io)), told24 = at(t, 17.6, 18.6, io);
  const close = at(t, 13.6, 15.2, io) - at(t, 17.6, 18.8, io);
  const dim = close, corridor = 1 - 0.75 * close;
  const lift = at(t, 11.6, 12.5) * (1 - at(t, 17.6, 18.6, io));
  const ripple = interpolate(t, [15.3, 17.5], [0, 1], {easing: lin}), ripple2 = interpolate(t, [19.0, 21], [0, 1], {easing: lin});
  return (
    <Atlas lon={lon} lat={lat} zoom={zoom} follow={ride ? E24.center : E17.center} followAt={ride ? d24 : d17} followMix={mix}
      under={<>
        <Regions values={ONCE} max={2} reach={E17.center} fill={d17} dim={dim} />
        <Regions values={TOTAL} max={2} reach={E24.center} fill={d24} dim={dim} />
      </>}>
      {lift > 0.001 && <Regions values={BOTH} max={2} reach={E24.center} fill={d24} lift={lift} dim={dim} />}
      <Place lon={-126} lat={29} name="Pacific Ocean" kind="water" zoomIn={0.6} zoomOut={3.2} show={shown(t, 0, 2.4)} />
      <Place lon={-69} lat={30} name="Atlantic Ocean" kind="water" zoomIn={0.6} zoomOut={3.2} show={shown(t, 0, 2.4) + shown(t, 6.4, 7.0) + shown(t, 11.6, 17.6)} />
      <Route path={E17.center} left={E17.north} right={E17.south} draw={d17} told={told17} head={1 - at(t, 6.3, 6.9)} corridor={corridor} shade={7000} />
      <Route path={E24.center} left={E24.north} right={E24.south} draw={d24} told={told24} head={1 - at(t, 10.8, 11.4)} corridor={corridor} shade={7000} />
      <Place lon={-120.5} lat={42.95} name="Oregon" kind="region" zoomIn={1.2} zoomOut={4} show={shown(t, 2.7, 7.0)} />
      <Place lon={-80.85} lat={32.95} name="South Carolina" kind="region" zoomIn={1.2} zoomOut={4} show={shown(t, 5.4, 7.0)} />
      <Place lon={-107.2} lat={30.1} name="Mexico" kind="country" zoomIn={1} zoomOut={4} show={shown(t, 7.4, 9.4)} />
      <Place lon={-87.65} lat={41.85} name="Chicago" zoomIn={2.6} zoomOut={4.3} show={shown(t, 12.4, 17.6)} />
      <Place lon={-90.24} lat={38.63} name="St. Louis" side="left" zoomIn={3.0} zoomOut={7.6} show={shown(t, 12.4, 17.6)} />
      <Place lon={-90.05} lat={35.15} name="Memphis" side="left" zoomIn={3.0} zoomOut={5.0} show={shown(t, 12.4, 17.6)} />
      <Place lon={-86.78} lat={36.16} name="Nashville" zoomIn={3.0} zoomOut={5.0} show={shown(t, 12.4, 17.6)} />
      <Place lon={-87.56} lat={37.97} name="Evansville" zoomIn={4.4} show={shown(t, 12.4, 17.6)} />
      <Place lon={-88.6} lat={37.08} name="Paducah" zoomIn={4.8} show={shown(t, 12.4, 17.6)} />
      <Place lon={-89.52} lat={37.31} name="Cape Girardeau" side="left" size={36} zoomIn={5.6} show={shown(t, 12.4, 17.6)} />
      <Place lon={-88.95} lat={37.56} name="Illinois" kind="region" zoomIn={5.6} show={shown(t, 14.6, 17.6)} />
      <Place lon={-89.217} lat={37.727} name="Carbondale" note="Illinois" side="left" size={40} zoomIn={5.4} show={shown(t, 14.6, 17.6)} />
      <Place lon={CROSS[0]} lat={CROSS[1]} name="The paths cross" kind="point" side="right" size={36} zoomIn={5.6} show={shown(t, 15.2, 17.6)} ripple={ripple} />
      <Place lon={CROSS[0]} lat={CROSS[1]} name="Carbondale" kind="point" side="right" size={34} zoomOut={3.2} show={at(t, 18.8, 19.4, Easing.outBack)} ripple={ripple2} />
      <Note value={interpolate(t, [15.8, 16.8], [0, 375], {easing: Easing.outQuart})} unit="years" label="the average wait for totality at one spot" x={120} y={150} show={shown(t, 15.6, 17.6)} />
      <Note value={interpolate(t, [16.6, 17.4], [0, 6.6], {easing: Easing.outQuart})} digits={1} unit="years" label="Carbondale's wait between the two" x={120} y={430} accent show={shown(t, 16.4, 17.6)} />
      <Legend title="States in the path of totality" steps={[{value: 1, label: 'in one path'}, {value: 2, label: 'in both'}]} max={2}
        shown={keys(t, [[6.2, 0], [6.8, 1], [8.0, 1], [8.6, 2]], outS)}
        paths={[{label: 'path of 2017', told: told17, show: 1}, {label: 'path of 2024', told: told24, show: unit(d24 * 4)}]} source="NASA eclipse predictions" show={shown(t, 6.2, 12.4)} />
      <Locator x={1680} y={250} r={112} show={1 - at(t, 17.6, 18.1)} />
      <Plate kicker="United States · 2017 and 2024" title="Two shadows, one town" x={1010} y={110} size={78} show={shown(t, 0.1, 2.2)} />
      <Plate kicker="37.6° N · 89.3° W" title="Where two shadows met" size={80} show={at(t, 19.2, 20.2)} />
    </Atlas>
  );
}
