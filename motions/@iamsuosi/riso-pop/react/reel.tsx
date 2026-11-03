// Riso Pop's reel: twenty seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
import type {ReactNode} from 'react';
import {Easing, Sequence, interpolate, useTime} from '@motionhub/runtime';
import {Paper} from './parts/paper.tsx';
import {Title} from './parts/title.tsx';
import {Overlap} from './parts/overlap.tsx';
import {Tone} from './parts/tone.tsx';
import {Stencil, type Shape} from './parts/stencil.tsx';
import {Tag} from './parts/tag.tsx';
import {Flood} from './parts/flood.tsx';

export const reel = {seconds: 20, width: 1920, height: 1080};
/** What happens when, for the motion's sound (sound.json): a plate rolls on, a tag stamps, the sheet knocks, pink floods, the camera pushes to a cut */
export const cues = [
  {at: 0.1, role: 'land'}, {at: 1.2, role: 'move', dur: 0.8}, {at: 1.5, role: 'draw', dur: 0.7}, {at: 2.6, role: 'land'}, {at: 4.4, role: 'land'},
  {at: 5.3, role: 'land'}, {at: 5.9, role: 'move', dur: 0.4}, {at: 8.0, role: 'land'}, {at: 8.6, role: 'move', dur: 0.8}, {at: 9.4, role: 'move', dur: 1.1},
  {at: 10.4, role: 'draw', dur: 2.0}, {at: 11.1, role: 'land'}, {at: 11.9, role: 'land'}, {at: 12.6, role: 'move', dur: 1.4}, {at: 14.0, role: 'cut'},
  {at: 14.0, role: 'land'}, {at: 14.5, role: 'land'}, {at: 14.9, role: 'land'}, {at: 15.8, role: 'land'}, {at: 17.0, role: 'land'}, {at: 17.6, role: 'land'},
];

const inQuad = (x: number) => x * x, outSine = (x: number) => Math.sin((x * Math.PI) / 2);
/** 0 to 1 between seconds `from` and `to`: plates roll, tags stamp and knocks run linearly (MOTION.md §5) */
const lin = (t: number, from: number, to: number, easing = Easing.linear) => interpolate(t, [from, to], [0, 1], {easing});

// an annulus, for rings cut with evenodd
const ring = (r1: number, r2: number) => `M${r1} 0A${r1} ${r1} 0 1 0 ${-r1} 0A${r1} ${r1} 0 1 0 ${r1} 0ZM${r2} 0A${r2} ${r2} 0 1 0 ${-r2} 0A${r2} ${r2} 0 1 0 ${r2} 0Z`;
// a red onion cut across: a pink disc of flesh, its layers printed over it in blue, so each layer line prints violet
const slice = (R: number, flesh = true): Shape[] => [
  ...(flesh ? [{circle: [0, 0, R] as [number, number, number], ink: 'pink' as const}] : []),
  {d: ring(R, R - 10), ink: 'blue', evenodd: true},
  ...[0.84, 0.68, 0.52, 0.36, 0.2].map((f) => ({d: ring(R * f, R * f - 6), ink: 'blue' as const, evenodd: true})),
  ...[0.84, 0.52].map((f) => ({d: ring(R * f - 6, R * (f - 0.16)), ink: 'blue' as const, tint: 0.3, evenodd: true})),
  {circle: [0, 0, R * 0.06], ink: 'blue'},
];
// an eye: a blue lid ring, a pink iris, a blue pupil printed over it (violet), three lashes
const EYE: Shape[] = [
  {d: 'M-150 0Q0 -128 150 0Q0 128 -150 0ZM-122 0Q0 -94 122 0Q0 94 -122 0Z', ink: 'blue', evenodd: true},
  {circle: [0, 0, 62], ink: 'pink'},
  {circle: [0, 0, 62], ink: 'blue', tint: 0.15},
  {circle: [0, 0, 26], ink: 'blue'},
  {d: 'M-70 -60l-14 -36l10 -4l14 36zM-3 -66l0 -40l11 0l0 40zM66 -60l14 -36l-10 -4l-14 36z', ink: 'blue'},
];
// a kitchen knife, point down: a blue blade with a lighter edge, a pink handle with violet rivets
const KNIFE: Shape[] = [
  {d: 'M0 0H58V250Q40 330 0 372Z', ink: 'blue'},
  {d: 'M0 0H18V360L0 372Z', ink: 'blue', tint: 0.3},
  {d: 'M-6 -190H64V0H-6Z', ink: 'pink'},
  {circle: [29, -140, 8], ink: 'blue'},
  {circle: [29, -50, 8], ink: 'blue'},
];

/** A camera over the sheet: the world under it is scaled about the frame's middle and moved, and the frame crops it */
const Push = ({s, x, y, children}: {s: number; x: number; y: number; children: ReactNode}) => (
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
    <div style={{position: 'absolute', inset: 0, transformOrigin: '960px 540px', transform: `translate(${x}px, ${y}px) scale(${s})`}}>{children}</div>
  </div>
);

/** The title's letters hit, the pink sun rolls on over its end, the onion's rings print, and the plates knock */
function Open({knock}: {knock: number}) {
  const t = useTime();
  return (
    <>
      <Title title={'Why onions\nmake you cry'} kicker="Kitchen chemistry" at={[150, 400]} size={160} sun={[1230, 520, 260]} blue={1} pink={lin(t, 1.2, 2.0)} type={lin(t, 0, 1.6)} slip={knock} />
      <Stencil shapes={slice(175, false)} at={[1230, 520]} blue={lin(t, 1.5, 2.2)} slip={knock} />
    </>
  );
}

/** Two things kept apart in a cell; a knife breaks the wall, they meet in violet, the knock, and pink floods the sheet */
function Cell({knock}: {knock: number}) {
  const t = useTime();
  return (
    <>
      <Overlap left="sulfur compounds" right="an enzyme" frame="one onion cell" both="tear gas" show={lin(t, 0, 1.2)}
        meet={interpolate(t, [1.9, 2.3, 2.4, 3.8], [0, 0.25, 0.25, 1], {easing: Easing.inOutSine})} slip={knock} />
      {t < 2.4 && (
        <div style={{position: 'absolute', inset: 0, transform: `translateY(${150 * lin(t, 1.7, 2.1, inQuad)}px)`}}>
          <Stencil shapes={KNIFE} at={[931, 230]} blue={lin(t, 1.1, 1.6)} pink={lin(t, 1.1, 1.6)} />
        </div>
      )}
      {t >= 4.4 && <Flood from={[960, 526, 0]} to={[960, 526, 2400]} t={lin(t, 4.4, 5.2, inQuad)} />}
    </>
  );
}

/** The flood ebbs into the onion, the gas rises toward an eye, and the camera pushes into the dots to a cut */
function Rise() {
  const t = useTime(), push = lin(t, 3.2, 4.6, inQuad), s = 1 + 8 * push, x = -1260 * push, y = 1890 * push;
  return (
    <>
      <Push s={s} x={x} y={y}>
        <Flood from={[960, 526, 2400]} to={[400, 660, 150]} t={lin(t, 0, 1.1, Easing.outQuart)} />
        <Stencil shapes={slice(150, false)} at={[400, 660]} blue={lin(t, 0.9, 1.6)} />
        <Stencil shapes={EYE} at={[1500, 280]} scale={1.1} blue={lin(t, 2.5, 3.1)} pink={lin(t, 2.5, 3.1)} />
        {t < 3.2 && <Tag text="tear gas" at={[1060, 700]} point={[900, 520]} show={lin(t, 1.7, 2.15)} />}
      </Push>
      {/* the gas is printed by its own camera, so the dots past the frame are never drawn */}
      <Tone from={[470, 560]} to={[1300, 300]} bend={-90} width={[70, 240]} grow={lin(t, 1.0, 3.0, Easing.inOutSine)} view={[s, x, y]} />
    </>
  );
}

/** Three onions side by side, each with less gas than the last; the pink sticker is stamped and knocks */
function Fix({knock}: {knock: number}) {
  const t = useTime();
  const onion = (x: number, s: number) => <Stencil shapes={slice(105)} at={[x, 600]} blue={lin(t, s, s + 0.6)} pink={lin(t, s + 0.2, s + 0.8)} />;
  return (
    <>
      {onion(420, 0)}
      <Tone from={[420, 500]} to={[470, 150]} bend={30} width={[50, 150]} density={0.75} grow={lin(t, 0.4, 1.6, outSine)} />
      <Tag text="room temp" at={[300, 790]} show={lin(t, 0.5, 0.95)} />
      {t >= 0.9 && onion(960, 0.9)}
      <Tone from={[960, 500]} to={[990, 290]} bend={20} width={[45, 110]} density={0.4} grow={lin(t, 1.4, 2.4, outSine)} />
      <Tag text="chilled" at={[860, 790]} show={lin(t, 1.3, 1.75)} />
      {t >= 1.8 && onion(1500, 1.8)}
      <Tone from={[1500, 500]} to={[1510, 400]} bend={10} width={[40, 70]} density={0.2} grow={lin(t, 2.3, 3.1, outSine)} />
      <Tag text="bred mild" at={[1380, 790]} show={lin(t, 2.2, 2.65)} />
      <Tag text="tearless" ink="pink" at={[1580, 460]} point={[1545, 540]} show={lin(t, 3.0, 3.45)} slip={knock} />
    </>
  );
}

// one knock per scene, on its accent; the sheet's own marks feel it too
const KNOCKS = [2.6, 8.0, 17.6];

export default function Reel() {
  const t = useTime(), knock = (i: number) => lin(t, KNOCKS[i], KNOCKS[i] + 1.4), sheet = KNOCKS.reduce((k, _, i) => Math.max(k, knock(i) < 1 ? knock(i) : 0), 0);
  return (
    <>
      <Paper slip={sheet} />
      <Sequence from={0} duration={4.2}><Open knock={knock(0)} /></Sequence>
      <Sequence from={4.2} duration={5.2}><Cell knock={knock(1)} /></Sequence>
      <Sequence from={9.4} duration={4.6}><Rise /></Sequence>
      <Sequence from={14}><Fix knock={knock(2)} /></Sequence>
      <Paper layer="grain" />
    </>
  );
}
