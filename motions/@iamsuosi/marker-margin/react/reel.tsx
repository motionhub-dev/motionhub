// Marker Margin's reel: twenty seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
// The player holds no footage, so a stand-in fills the frame where the recording would be, reframed at each cut; the marks pile up on a shot and go with its cut.
import type {ReactNode} from 'react';
import {Easing, Video, interpolate, useTime} from '@motionhub/runtime';
import {Loop} from './parts/loop.tsx';
import {Note} from './parts/note.tsx';
import {Arrow} from './parts/arrow.tsx';
import {Figure} from './parts/figure.tsx';
import {Span} from './parts/span.tsx';
import {Steps} from './parts/steps.tsx';
import {Screen} from './parts/screen.tsx';
import {Box} from './parts/box.tsx';
import {Click} from './parts/click.tsx';

export const reel = {seconds: 20, width: 1920, height: 1080};
/** What happens when, for the motion's sound (sound.json): a mark is drawn, the shot cuts, a number is written and double-underlined, a tick lands, the click rings */
export const cues = [
  {at: 0.05, role: 'draw', dur: 0.85}, {at: 1.3, role: 'draw', dur: 0.42}, {at: 2.1, role: 'draw', dur: 1.1}, {at: 4.2, role: 'cut'},
  {at: 4.35, role: 'draw', dur: 0.7}, {at: 5.3, role: 'draw', dur: 0.65}, {at: 6.6, role: 'cut'}, {at: 6.75, role: 'draw', dur: 1.4},
  {at: 8.25, role: 'draw', dur: 0.45}, {at: 8.7, role: 'count'}, {at: 9.6, role: 'cut'}, {at: 9.7, role: 'draw', dur: 1.0},
  {at: 11.0, role: 'draw', dur: 1.2}, {at: 12.6, role: 'cut'}, {at: 12.7, role: 'draw', dur: 0.8}, {at: 14.5, role: 'count'},
  {at: 14.6, role: 'land'}, {at: 15.4, role: 'draw', dur: 0.6}, {at: 16.82, role: 'count'},
];

const lin = Easing.linear, out = Easing.outCubic;
/** a stroke's progress from `a` over `dur`: a hand starts fast and slows into the end */
const pen = (t: number, a: number, dur: number, easing = out) => interpolate(t, [a, a + dur], [0, 1], {easing});
/** writing runs at an even pace, letter by letter */
const hand = (t: number, a: number, dur: number) => pen(t, a, dur, lin);

/** The cuts: every mark on a shot goes with the cut that ends it, at once */
const CUTS = [0, 4.2, 6.6, 9.6, 12.6, 20];
const shotOf = (t: number) => CUTS.findIndex((c, i) => t >= c && t < CUTS[i + 1]);
/** where the stand-in is framed on each shot, so a cut reads as a cut */
const FRAMING = ['scale(1.05)', 'scale(1.4) translate(12%, 6%)', 'scale(1.3) translate(-10%, -4%)', 'scale(1.3) translate(-8%, 9%)', 'scale(1.2) translate(6%, -6%)'];

/** A box at x, y of w × h (the whole frame by default), drawn only between `from` and `to`: marks are made on screen, never faded in or out */
function Part({x = 0, y = 0, w = 1920, h = 1080, from, to, children}: {x?: number; y?: number; w?: number; h?: number; from: number; to: number; children: ReactNode}) {
  const t = useTime();
  if (t < from || t >= to) return null;
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h}}>{children}</div>;
}

export default function Reel() {
  const t = useTime(), shot = Math.max(0, shotOf(t));
  return (
    <>
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}><div style={{position: 'absolute', inset: 0, transform: FRAMING[shot]}}><Video src="take" /></div></div>

      {/* Shot 1: the word in the free corner, the thing looped as it is named, then word and arrow */}
      <Part x={1390} y={100} w={460} h={170} from={0} to={CUTS[1]}><Note text="Columbus lab" mark="Columbus" write={hand(t, 0.05, 0.85)} under={pen(t, 1.0, 0.35)} seed="lab" /></Part>
      <Part from={1.3} to={CUTS[1]}><Loop at={[690, 300]} rx={130} ry={112} draw={pen(t, 1.3, 0.42)} seed="transceiver" /></Part>
      <Part from={2.1} to={CUTS[1]}><Arrow text="control panel" at={[96, 640]} from={[286, 640]} to={[520, 470]} bow={-0.25} draw={hand(t, 2.1, 1.1)} seed="panel" /></Part>

      {/* Shot 2: the signal between them, each end named */}
      <Part from={CUTS[1]} to={CUTS[2]}><Arrow from={[720, 160]} to={[1160, 160]} bow={-0.08} kind="wave" heads={2} draw={pen(t, 4.35, 0.7)} seed="link" /></Part>
      <Part x={1190} y={70} w={260} h={150} from={4.9} to={CUTS[2]}><Note text="ISS" write={hand(t, 4.9, 0.3)} seed="iss" /></Part>
      <Part x={240} y={70} w={440} h={150} from={5.3} to={CUTS[2]}><Note text="your school" write={hand(t, 5.3, 0.65)} seed="school" /></Part>

      {/* Shot 3: the number written big, double-underlined as it lands */}
      <Part x={430} y={290} w={1100} h={400} from={CUTS[2]} to={CUTS[3]}>
        <Figure value="17,500" unit="mph" note="over the ground station" write={hand(t, 6.75, 1.4)} under={pen(t, 8.25, 0.45)} size={160} seed="speed" />
      </Part>

      {/* Shot 4: the stressed word underlined, then the pass measured horizon to horizon */}
      <Part x={110} y={100} w={580} h={240} from={CUTS[3]} to={CUTS[4]}>
        <Note text={'25× the\nspeed of sound'} mark="25×" write={hand(t, 9.7, 1.0)} under={pen(t, 10.8, 0.35)} size={62} seed="sound" />
      </Part>
      <Part from={11.0} to={CUTS[4]}><Span from={[1325, 55]} to={[1425, 860]} bow={-0.05} label={'9–10 min\nof contact'} at={[1480, 360]} draw={hand(t, 11.0, 1.2)} seed="pass" /></Part>

      {/* Shot 5: the corner to-do, which steps aside while a screen recording is in and catches up as it leaves */}
      <Part x={100} y={110} w={480} h={300} from={CUTS[4]} to={14.6}>
        <Steps items={['float in', 'set channel', 'call school']} shown={t < 13.7 ? hand(t, 12.7, 0.8) : 1 + hand(t, 13.7, 0.8)} done={hand(t, 13.7, 0.8)} size={48} />
      </Part>
      <Part from={14.6} to={18.0}>
        <Screen src="screen" show={t < 17.4 ? hand(t, 14.6, 0.7) : 1 - pen(t, 17.4, 0.5, Easing.inOutSine)}>
          <Box x={1150} y={214} w={485} h={72} draw={pen(t, 15.4, 0.6)} seed="window" />
          <Click at={[1263, 772]} r={86} draw={pen(t, 16.4, 0.42)} seed="call" />
        </Screen>
      </Part>
      <Part x={100} y={110} w={480} h={300} from={18.0} to={20}>
        <Steps items={['float in', 'set channel', 'call school']} shown={2 + hand(t, 18.0, 0.8)} done={t < 18.9 ? 1 + hand(t, 18.0, 0.8) : 2 + hand(t, 18.9, 0.5)} size={48} />
      </Part>
    </>
  );
}
