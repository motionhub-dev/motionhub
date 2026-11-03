// Iso Works's reel: twenty seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
import {Easing, Sequence, interpolate, useTime} from '@motionhub/runtime';
import {Floor} from './parts/floor.tsx';
import {Plaque} from './parts/plaque.tsx';
import {Building} from './parts/building.tsx';
import {Belt} from './parts/belt.tsx';
import {Stack} from './parts/stack.tsx';
import {Stacks} from './parts/stacks.tsx';
import {Sign} from './parts/sign.tsx';

export const reel = {seconds: 20, width: 1920, height: 1080};

/** What happens when, for the motion's sound (sound.json): the floor is laid, buildings and signs land, belts run, the roof lifts, stacks fill and count, scenes cut */
export const cues = [
  {at: 0.0, role: 'draw', dur: 1.2}, {at: 1.15, role: 'land'}, {at: 4.1, role: 'draw', dur: 0.7}, {at: 4.4, role: 'land'},
  {at: 5.7, role: 'land'}, {at: 6.2, role: 'move', dur: 1.2}, {at: 8.4, role: 'move', dur: 1.1}, {at: 8.4, role: 'draw', dur: 0.8},
  {at: 9.6, role: 'land'}, {at: 10.5, role: 'cut'}, {at: 10.8, role: 'draw', dur: 2.0}, {at: 11.1, role: 'land'},
  {at: 12.8, role: 'count'}, {at: 13.5, role: 'land'}, {at: 14.1, role: 'cut'}, {at: 14.2, role: 'draw', dur: 1.1},
  {at: 15.3, role: 'count'}, {at: 15.6, role: 'draw', dur: 1.2}, {at: 16.8, role: 'count'}, {at: 17.7, role: 'cut'}, {at: 18.2, role: 'land'},
];

const ease = Easing.inOutSine, out = Easing.outQuart, inQuad = (x: number) => x * x;
/** `a` to `b` between seconds `from` and `to` */
const at = (t: number, from: number, to: number, a: number, b: number, easing = ease) => interpolate(t, [from, to], [a, b], {easing});
/** A view moving through key views at key seconds: one camera for every part of a scene */
const camera = (t: number, times: number[], views: [number, number, number][]) => ({
  origin: [interpolate(t, times, views.map((v) => v[0]), {easing: ease}), interpolate(t, times, views.map((v) => v[1]), {easing: ease})] as [number, number],
  k: interpolate(t, times, views.map((v) => v[2]), {easing: ease}),
});

// the belts run in front of the buildings and turn in at their doors
const IN: [number, number][] = [[2.4, 5], [2.4, 7], [7.2, 7], [7.2, 5.5]];
const OUT: [number, number][] = [[9.3, 5.5], [9.3, 7], [14.4, 7], [14.4, 5]];

/** The floor is laid from the middle and the plaque springs up from it */
function Open() {
  const t = useTime(), v = camera(t, [0, 3.5], [[780, 190, 58], [745, 160, 63]]);
  return (
    <>
      <Floor reveal={at(t, 0, 1.2, 0, 1, out)} {...v} />
      <Plaque at={[0, 4]} width={17} title="A night at the hub" kicker="How a parcel finds its truck" role="process" rise={at(t, 0.25, 1.15, 0, 1, Easing.linear)} {...v} />
    </>
  );
}

/** The works is raised building by building, the belts run, and the sorting hall's roof lifts to show the scanner */
function Hub() {
  const t = useTime();
  const v = camera(t, [0, 1.3, 2.7, 3.8, 4.9, 6.0], [[1069, 330, 72], [1021, 196, 70], [1021, 196, 70], [660, 212, 74], [660, 212, 74], [790, 225, 56]]);
  const rise = (s: number) => at(t, s, s + 0.9, 0, 1, Easing.linear), ping = (s: number) => at(t, s + 0.6, s + 1.5, 0, 1, Easing.outCubic);
  const dimIn = interpolate(t, [2.7, 3.3, 4.9, 5.5], [0, 0.8, 0.8, 0]);
  return (
    <>
      <Floor {...v} />
      <Belt path={IN} draw={at(t, 0.6, 1.3, 0, 1)} travel={at(t, 1.0, 7, 0, 21, Easing.linear)} from="intake" dim={dimIn} {...v} />
      <Belt path={OUT} draw={at(t, 4.9, 5.7, 0, 1)} travel={at(t, 5.3, 7, 0, 6, Easing.linear)} from="process" {...v} />
      <Building at={[0, 2]} size={[3.5, 3, 2.2]} role="intake" name="Docks" rise={rise(0)} ping={ping(0)} dim={dimIn} {...v} />
      <Building at={[6, 1.5]} size={[4.5, 4, 2.8]} role="process" name="Sorting" machine="arch" goods={['intake', 'process']}
        rise={rise(1.3)} ping={ping(1.3)} lift={interpolate(t, [2.8, 4.0, 4.9, 5.6], [0, 1, 1, 0], {easing: ease})} {...v} />
      <Building at={[12.6, 2]} size={[3.5, 3, 2.2]} role="output" name="Outbound" rise={rise(5.2)} ping={ping(5.2)} {...v} />
    </>
  );
}

/** One cube is ten thousand parcels: the stack drops in while its sign counts up */
function Count() {
  const t = useTime(), v = camera(t, [0, 3.6], [[860, 250, 58], [900, 320, 53]]);
  return (
    <>
      <Floor {...v} />
      <Sign at={[-4, 7]} width={3.6} title="one cube" figure="10,000" role="store" show={at(t, 0.1, 0.6, 0, 1, out)} {...v} />
      <Stack at={[1, 1]} count={41.6} fill={at(t, 0.3, 2.3, 0, 1, inQuad)} per={10000} unit="parcels" title="sorted per hour" footprint={[3, 3]} {...v} />
      <Sign at={[7, -2]} width={4} title="every second" figure="≈ 115" role="store" show={at(t, 2.6, 3.0, 0, 1, out)} {...v} />
    </>
  );
}

/** Before and after, in one unit on one baseline; the gain is the subject */
function Pair() {
  const t = useTime(), v = camera(t, [0, 1.5, 2.8], [[740, 360, 54], [740, 360, 54], [560, 375, 53]]);
  const grow = interpolate(t, [0.1, 1.2, 1.5, 2.7], [0, 1, 1, 2], {easing: inQuad});
  return (
    <>
      <Floor {...v} />
      <Stacks at={[1, 0]} items={[{label: 'before expansion', value: 304000}, {label: 'after expansion', value: 416000}]}
        per={10000} unit="an hour" grow={grow} focus={t < 1.5 ? -1 : 1} footprint={[3, 3]} spacing={7} {...v} />
    </>
  );
}

/** The whole works again, every belt running, the outbound dock pinging as the trucks go: the frame the reel ends on */
function Close() {
  const t = useTime(), v = camera(t, [0, 2.5], [[800, 250, 54], [790, 225, 56]]);
  return (
    <>
      <Floor {...v} />
      <Belt path={IN} travel={at(t, 0, 2.5, 6, 12, Easing.linear)} from="intake" {...v} />
      <Belt path={OUT} travel={at(t, 0, 2.5, 6, 12, Easing.linear)} from="process" {...v} />
      <Building at={[0, 2]} size={[3.5, 3, 2.2]} role="intake" name="Docks" {...v} />
      <Building at={[6, 1.5]} size={[4.5, 4, 2.8]} role="process" name="Sorting" {...v} />
      <Building at={[12.6, 2]} size={[3.5, 3, 2.2]} role="output" name="Outbound" ping={at(t, 0.2, 1.4, 0, 1, Easing.outCubic)} {...v} />
    </>
  );
}

export default function Reel() {
  return (
    <>
      <Sequence from={0} duration={3.5}><Open /></Sequence>
      <Sequence from={3.5} duration={7}><Hub /></Sequence>
      <Sequence from={10.5} duration={3.6}><Count /></Sequence>
      <Sequence from={14.1} duration={3.6}><Pair /></Sequence>
      <Sequence from={17.7}><Close /></Sequence>
    </>
  );
}
