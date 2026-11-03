// Light Bench's reel: twenty seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
import {Easing, interpolate, useTime} from '@motionhub/runtime';
import {Bench, onBeam, type View} from './parts/bench.tsx';
import {WAVES, dirOf, trace, type Optic, type P2} from './parts/optics.ts';
import {Tag} from './parts/tag.tsx';
import {Spectrum} from './parts/spectrum.tsx';
import {Law} from './parts/law.tsx';
import {Angle} from './parts/angle.tsx';
import {Heading} from './parts/heading.tsx';

export const reel = {seconds: 20, width: 1920, height: 1080};

/** What happens when, for the motion's sound (sound.json): light runs out and splits, labels and glass land, the camera walks the table, the slit closes, white comes back */
export const cues = [
  {at: 0.2, role: 'draw', dur: 0.9}, {at: 1.0, role: 'move', dur: 5.5}, {at: 1.6, role: 'land'}, {at: 2.4, role: 'cut'},
  {at: 3.4, role: 'land'}, {at: 4.6, role: 'draw', dur: 0.9}, {at: 6.5, role: 'move', dur: 3.1}, {at: 8.1, role: 'land'},
  {at: 8.3, role: 'draw', dur: 2.0}, {at: 11.0, role: 'land'}, {at: 11.8, role: 'land'}, {at: 13.5, role: 'out'},
  {at: 15.4, role: 'move', dur: 3.8}, {at: 16.4, role: 'land'}, {at: 16.9, role: 'count'},
];

const ease = Easing.inOutSine, out = Easing.outQuart, lin = Easing.linear;
/** A value that goes from a to b between two seconds */
const at = (t: number, from: number, to: number, a: number, b: number, easing = ease) => interpolate(t, [from, to], [a, b], {easing});
/** A value moved through several keys: [second, value] pairs, each leg eased */
const keys = (t: number, k: [number, number][], easing = ease) => {
  let v = k[0][1];
  for (let i = 1; i < k.length; i++) if (t >= k[i - 1][0]) v = at(t, k[i - 1][0], k[i][0], k[i - 1][1], k[i][1], easing);
  return v;
};
/** On between two seconds, fading in and out over a given time */
const shown = (t: number, on: number, off: number, fade = 0.5) => Math.min(at(t, on, on + fade, 0, 1, lin), at(t, off, off + 0.4, 1, 0, lin));

// the sample's layout, worked out from the trace: the fan leaves the prism running away from the camera, onto the face of the card we see
const FROM: P2 = [-6.33, -3.67], AIM = 35, AXIS = -32.74;
const CARD: P2 = [7.114, -3.842], JAWS: P2 = [4.385, -2.087], LENS: P2 = [4.301, -2.033], SECOND: P2 = [5.329, -2.864], CARD2: P2 = [5.556, -4.912];
const EXIT: P2 = [0.6, 0.346], PRISM: Optic = {kind: 'prism', at: [0, 0], flip: true};
const turned = (i: number) => { const p = trace(FROM, dirOf(AIM), WAVES[i], [PRISM]).pts, a = p[p.length - 2], b = p[p.length - 1]; return AIM - (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI; };
const RED = +turned(0).toFixed(1), VIOLET = +turned(6).toFixed(1);

/** The camera walks round the table: wide on the split, close on the slit and the second prism, round to the lens, then back out */
function camera(t: number): View {
  const k = (a: number, b: number, c: number, d: number, e: number): [number, number][] => [[0, a], [1, a], [6.5, b], [9.6, c], [15.4, d], [19.2, e]];
  return {
    yaw: keys(t, k(-8, -6, 6, -10, 8)),
    pitch: keys(t, k(26, 26, 38, 26, 26)),
    dist: keys(t, k(21, 17, 11.5, 13, 20)),
    tx: keys(t, k(0.8, 2.1, 4.8, 4.6, 1.6)),
    ty: 1,
    tz: keys(t, k(-1.2, -1.6, -2.8, -2.6, -1.6)),
  };
}

export default function Reel() {
  const t = useTime(), view = camera(t);
  // light runs out from the lamp, stops at the glass, then goes on through
  const reach = keys(t, [[0.2, 0], [1.1, 6.6], [1.5, 6.6], [2.4, 16.5], [2.6, 40]], lin);
  // the slit lands and closes on the red; a second prism lands before the card leaves, so the red is never let into the dark;
  // then the card comes back first, the prism lifts, the slit opens and lifts, and a lens brings it back
  const jaws = Math.min(at(t, 7.3, 8.1, 0, 1, out), at(t, 14.5, 15.1, 1, 0));
  const close = Math.min(at(t, 8.3, 10.3, 0, 1, lin), at(t, 13.9, 14.5, 1, 0));
  const second = Math.min(at(t, 10.2, 11.0, 0, 1, out), at(t, 13.5, 14.1, 1, 0));
  const optics: Optic[] = [
    PRISM,
    {kind: 'card', at: CARD, rot: AXIS, w: 3, in: Math.max(at(t, 10.9, 11.5, 1, 0), at(t, 12.9, 13.5, 0, 1, out))},
    {kind: 'jaws', at: JAWS, rot: AXIS, slit: 0.219, width: 0.06, close, in: jaws},
    {kind: 'prism', at: SECOND, rot: -65.02, side: 1.6, flip: true, in: second},
    {kind: 'card', at: CARD2, rot: -95, w: 1.6, in: second},
    {kind: 'lens', at: LENS, rot: AXIS, f: 1.9, dia: 1.7, in: at(t, 15.1, 16.4, 0, 1, out)},
  ];
  const land = (i: number) => onBeam(trace(FROM, dirOf(AIM), WAVES[i], optics).pts.at(-1)!);
  return (
    <>
      <Bench view={view} from={FROM} aim={AIM} reach={reach} optics={optics}>
        <Tag view={view} on={[0, 2, 0.2]} at={[640, 190]} width={300} text="Dense flint glass" note="60° prism" t={shown(t, 1.6, 2.9)} />
        <Tag view={view} on={land(0)} at={[1530, 430]} width={310} text="Red bends least" note={`turned ${RED.toFixed(1)}°`} color={WAVES[0].css} t={shown(t, 3.4, 6.8)} />
        <Tag view={view} on={land(6)} at={[640, 300]} width={380} text="Violet bends most" note={`turned ${VIOLET.toFixed(1)}°`} color={WAVES[6].css} t={shown(t, 3.7, 6.8)} />
        <Tag view={view} on={land(0)} at={[1380, 300]} width={460} text="Still only red" note="bent again, no new colour" color={WAVES[0].css} t={shown(t, 11.8, 12.9)} />
        <Tag view={view} on={land(3)} at={[1510, 180]} width={330} text="White again" note="all seven, one spot" t={shown(t, 16.6, 30)} />
        <Angle view={view} at={EXIT} from={AIM - RED} to={AIM - VIOLET} r={4} text={`${(VIOLET - RED).toFixed(1)}° apart`} t={shown(t, 4.6, 6.8, 0.9)} />
        <Spectrum at={[1320, 90]} source="n of SF11 glass (Schott)" show={shown(t, 3.0, 6.8)} />
        <Law at={[80, 760]} law={<>n<sub>1</sub> sin θ<sub>1</sub> = n<sub>2</sub> sin θ<sub>2</sub></>} says="Snell's law: every beam here is computed" show={Math.max(shown(t, 4.1, 6.8), at(t, 17.2, 17.8, 0, 1, lin))} />
      </Bench>
      <Heading text="What is white light made of?" size={68} show={shown(t, 0, 1.6, 0.4)} />
    </>
  );
}
