// Riso Pop's sample: one example among many. Do not reuse its story, scenes, layout or timings; read it for technique, after your own scenes are planned.
// The chemistry: an onion keeps its sulfur compounds and the enzyme alliinase apart in the cell; cutting mixes them, and a second enzyme
// (lachrymatory factor synthase, Imai et al., Nature 2002) turns the product into syn-propanethial S-oxide, the gas that makes eyes water.
import type React from 'react';
import {Doc, Scene, Line, Part, Animation, Appear, Disappear, Tween, Set} from '@visotalk/jsx';
import {useProp} from '@visotalk/runtime';
import {Paper} from '../parts/paper.tsx';
import {Title} from '../parts/title.tsx';
import {Overlap} from '../parts/overlap.tsx';
import {Tone} from '../parts/tone.tsx';
import {Stencil, type Shape} from '../parts/stencil.tsx';
import {Tag} from '../parts/tag.tsx';
import {Flood} from '../parts/flood.tsx';

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
// a camera over the sheet: the world under it is scaled about the frame's middle and moved, and the frame crops it
const Push = ({s, x, y, children}: {s: number; x: number; y: number; children: React.ReactNode}) => (
  <div data-vt-camera="" style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
    <div style={{position: 'absolute', inset: 0, transformOrigin: '960px 540px', transform: `translate(${x}px, ${y}px) scale(${s})`}}>{children}</div>
  </div>
);
const DROP = 'M0 -34C15 -10 24 4 24 16A24 24 0 0 1 -24 16C-24 4 -15 -10 0 -34Z';
const TEARS: Shape[] = [{d: DROP, ink: 'blue'}, {d: 'M44 30C59 54 68 68 68 80A24 24 0 0 1 20 80C20 68 29 54 44 30Z', ink: 'blue', tint: 0.5}];

export default <Doc
  id="riso-pop-sample"
  title="Why onions make you cry"
  poster={3.5}
  lang="en"
  canvas="16x9"
  theme="visotalk/light"
  tokens={{
    colors: {bg: '#F3EEE3', panel: '#FBF8F1', panel2: '#E9E2D3', border: '#DCD3C2', text: '#2B50C0', muted: '#6B7FC4', faint: '#D8D0BF', data: '#2B50C0', grad: '#FF4E95', op: '#2B1870', good: '#2B50C0', bad: '#FF4E95', warn: '#FF4E95'},
    fonts: {sans: '"Hanken Grotesk", "Noto Sans SC", sans-serif', mono: '"JetBrains Mono", monospace', display: '"Fraunces", "Noto Sans SC", serif'},
    caption: {font: 'sans', size: 36, weight: 600, color: '#2B50C0', background: 'rgba(251, 248, 241, 0.97)', radius: 2, padding: [10, 26], bottom: 56, rule: '#FF4E95', ruleSide: 'left'},
  }}
  pacing={{lead: 0.4, hold: 0.45, tail: 1}}
  exports={{captions: 'burned'}}
>
  <Part id="paper">{() => <Paper />}</Part>
  <Part id="grain" z={9}>{() => <Paper layer="grain" />}</Part>

  <Scene id="open" title="The question">
    <Line id="o1">Why does cutting an onion make you cry?</Line>
    <Part id="title" z={1}>{() => <Title title={'Why onions\nmake you cry'} kicker="Kitchen chemistry" at={[150, 400]} size={160} sun={[1230, 520, 260]} blue={useProp('blue', 0)} pink={useProp('pink', 0)} type={useProp('type', 0)} slip={useProp('slip', 0)} />}</Part>
    <Part id="rings" z={2}>{() => <Stencil shapes={slice(175, false)} at={[1230, 520]} blue={useProp('blue', 0)} slip={useProp('slip', 0)} />}</Part>
    <Animation>
      <Appear target={['paper', 'grain', 'title', 'rings']} at="start" dur={0} />
      <Tween target="title" to={{blue: 1}} at="start" dur={0} />
      <Tween target="title" to={{type: 1}} at="start" dur={1.7} easing="linear" />
      <Tween target="title" to={{pink: 1}} line="o1" word="cutting" dur={0.9} easing="linear" />
      <Tween target="rings" to={{blue: 1}} line="o1" word="cutting" offset={0.3} dur={0.8} easing="linear" />
      <Tween target={['title', 'rings']} to={{slip: 1}} line="o1" word="cry" dur={1.4} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="cell" title="Kept apart">
    <Line id="c1">Inside each onion cell, sulfur compounds are stored in one place, and an enzyme waits in another.</Line>
    <Line id="c2">A knife breaks the wall between them.</Line>
    <Line id="c3" hold={2.2}>Where the two meet, a chain of reactions makes something new: a gas that stings.</Line>
    <Part id="cell" z={1}>{() => <Overlap left="sulfur compounds" right="an enzyme" frame="one onion cell" both="tear gas" show={useProp('show', 0)} meet={useProp('meet', 0)} slip={useProp('slip', 0)} />}</Part>
    <Part id="flood-c" z={3}>{() => <Flood from={[960, 526, 0]} to={[960, 526, 2400]} t={useProp('t', 0)} />}</Part>
    <Part id="knife" z={2}>{() => <Stencil shapes={KNIFE} at={[931, 230]} blue={useProp('blue', 0)} pink={useProp('pink', 0)} />}</Part>
    <Animation>
      <Appear target="cell" line="c1" word="onion cell" dur={0} />
      <Tween target="cell" to={{show: 1}} line="c1" word="onion cell" dur={1.8} easing="linear" />
      <Appear target="knife" line="c2" word="knife" dur={0} />
      <Tween target="knife" to={{blue: 1, pink: 1}} line="c2" word="knife" dur={0.6} easing="linear" />
      <Tween target="knife" to={{y: 150}} line="c2" word="breaks" dur={0.45} easing="easeIn" />
      <Tween target="cell" to={{meet: 0.25}} line="c2" word="breaks" offset={0.3} dur={0.5} easing="linear" />
      <Disappear target="knife" line="c3" word="Where" dur={0} />
      <Tween target="cell" to={{meet: 1}} line="c3" word="meet" dur={2.2} easing="easeInOutSine" />
      <Tween target="cell" to={{slip: 1}} line="c3" word="stings" dur={1.4} easing="linear" />
      <Appear target="flood-c" line="c3" word="stings" offset={1.2} dur={0} />
      <Tween target="flood-c" to={{t: 1}} line="c3" word="stings" offset={1.2} until="end" easing="easeInQuad" />
    </Animation>
  </Scene>

  <Scene id="rise" title="It rises">
    <Line id="r1" hold={1.4}>The gas drifts up from the cut, and the cloud thickens as it rises toward your eyes.</Line>
    {/* one world under one camera: the flood ebbs into the onion, the gas rises, and the camera pushes into the dots until they are discs */}
    <Part id="world" z={1}>{() => (<>
      <Push s={useProp('s', 1)} x={useProp('panX', 0)} y={useProp('panY', 0)}>
        <Flood from={[960, 526, 2400]} to={[400, 660, 150]} t={useProp('ebb', 0)} />
        <Stencil shapes={slice(150, false)} at={[400, 660]} blue={useProp('rings', 0)} />
        <Stencil shapes={EYE} at={[1500, 280]} scale={1.1} blue={useProp('eye', 0)} pink={useProp('eye', 0)} />
        <Tag text="tear gas" at={[1060, 700]} point={[900, 520]} show={useProp('tag', 0)} />
      </Push>
      {/* the gas is printed by its own camera, so the dots past the frame are never drawn; ink multiplies, so it may lie over the eye */}
      <Tone from={[470, 560]} to={[1300, 300]} bend={-90} width={[70, 240]} grow={useProp('grow', 0)} view={[useProp('s', 1), useProp('panX', 0), useProp('panY', 0)]} />
    </>)}</Part>
    <Animation>
      <Appear target="world" at="start" dur={0} />
      <Tween target="world" to={{ebb: 1}} at="start" dur={1.1} easing="easeOutQuart" />
      <Tween target="world" to={{rings: 1}} at="start" offset={0.9} dur={0.7} easing="linear" />
      <Tween target="world" to={{grow: 1}} line="r1" word="drifts" until={{line: 'r1', word: 'eyes'}} easing="easeInOutSine" />
      <Tween target="world" to={{tag: 1}} line="r1" word="cloud" dur={0.45} easing="linear" />
      <Tween target="world" to={{eye: 1}} line="r1" word="eyes" dur={0.6} easing="linear" />
      <Set target="world" to={{tag: 0}} line="r1" word="eyes" offset={0.6} />
      <Tween target="world" to={{s: 9, panX: -1260, panY: 1890}} line="r1" word="eyes" offset={0.6} until="end" easing="easeInQuad" />
    </Animation>
  </Scene>

  <Scene id="sting" title="The alarm">
    <Line id="s1">It reaches your eye, nerves sound the alarm, and your tear glands flush it away.</Line>
    <Part id="plume-s" z={1}>{() => <Tone from={[230, 760]} to={[770, 470]} bend={60} width={[70, 200]} grow={useProp('grow', 0.55)} slip={useProp('slip', 0)} />}</Part>
    <Part id="eye-s" z={2}>{() => <Stencil shapes={EYE} at={[1010, 400]} scale={2.1} slip={useProp('slip', 0)} />}</Part>
    <Part id="tag-s" z={3}>{() => <Tag text="nerves fire" ink="pink" at={[1280, 150]} point={[1100, 312]} show={useProp('show', 0)} slip={useProp('slip', 0)} />}</Part>
    <Part id="tears" z={3}>{() => <Stencil shapes={TEARS} at={[1300, 540]} scale={2.2} blue={useProp('blue', 0)} />}</Part>
    <Animation>
      <Appear target={['plume-s', 'eye-s']} at="start" dur={0} />
      <Tween target="plume-s" to={{grow: 1}} at="start" until={{line: 's1', word: 'alarm'}} easing="easeOutSine" />
      <Appear target="tag-s" line="s1" word="nerves" dur={0} />
      <Tween target="tag-s" to={{show: 1}} line="s1" word="nerves" dur={0.45} easing="linear" />
      <Tween target={['plume-s', 'eye-s', 'tag-s']} to={{slip: 1}} line="s1" word="alarm" dur={1.4} easing="linear" />
      <Appear target="tears" line="s1" word="tear glands" dur={0} />
      <Tween target="tears" to={{blue: 1}} line="s1" word="tear glands" dur={0.5} easing="linear" />
      <Tween target="tears" to={{y: 150}} line="s1" word="flush" dur={1.2} easing="easeIn" />
    </Animation>
  </Scene>

  <Scene id="fix" title="Fewer tears">
    <Line id="f1">Chilling the onion first slows the reaction down.</Line>
    <Line id="f2" hold={1}>And breeders now grow onions that make far less of it; some are sold as tearless.</Line>
    <Part id="onions-f" z={1}>{() => <Stencil shapes={slice(105)} at={[420, 600]} blue={useProp('blue', 0)} pink={useProp('pink', 0)} />}</Part>
    <Part id="plume-a" z={2}>{() => <Tone from={[420, 500]} to={[470, 150]} bend={30} width={[50, 150]} density={0.75} />}</Part>
    <Part id="tag-a" z={3}>{() => <Tag text="room temp" at={[300, 790]} />}</Part>
    <Part id="onion-b" z={1}>{() => <Stencil shapes={slice(105)} at={[960, 600]} blue={useProp('blue', 0)} pink={useProp('pink', 0)} />}</Part>
    <Part id="plume-b" z={2}>{() => <Tone from={[960, 500]} to={[990, 290]} bend={20} width={[45, 110]} density={0.4} grow={useProp('grow', 0)} />}</Part>
    <Part id="tag-b" z={3}>{() => <Tag text="chilled" at={[860, 790]} show={useProp('show', 0)} />}</Part>
    <Part id="onion-c" z={1}>{() => <Stencil shapes={slice(105)} at={[1500, 600]} blue={useProp('blue', 0)} pink={useProp('pink', 0)} />}</Part>
    <Part id="plume-c" z={2}>{() => <Tone from={[1500, 500]} to={[1510, 400]} bend={10} width={[40, 70]} density={0.2} grow={useProp('grow', 0)} />}</Part>
    <Part id="tag-c" z={3}>{() => <Tag text="bred mild" at={[1380, 790]} show={useProp('show', 0)} />}</Part>
    <Part id="sticker" z={4}>{() => <Tag text="tearless" ink="pink" at={[1580, 460]} point={[1545, 540]} show={useProp('show', 0)} slip={useProp('slip', 0)} />}</Part>
    <Animation>
      <Appear target={['onions-f', 'plume-a', 'tag-a']} at="start" dur={0} />
      <Tween target="onions-f" to={{blue: 1, pink: 1}} at="start" dur={0.6} easing="linear" />
      <Appear target={['onion-b', 'plume-b', 'tag-b']} line="f1" word="Chilling" dur={0} />
      <Tween target="onion-b" to={{blue: 1, pink: 1}} line="f1" word="Chilling" dur={0.6} easing="linear" />
      <Tween target="tag-b" to={{show: 1}} line="f1" word="Chilling" offset={0.4} dur={0.45} easing="linear" />
      <Tween target="plume-b" to={{grow: 1}} line="f1" word="slows" dur={1.6} easing="easeOutSine" />
      <Appear target={['onion-c', 'plume-c', 'tag-c']} line="f2" word="breeders" dur={0} />
      <Tween target="onion-c" to={{blue: 1, pink: 1}} line="f2" word="breeders" dur={0.6} easing="linear" />
      <Tween target="tag-c" to={{show: 1}} line="f2" word="breeders" offset={0.4} dur={0.45} easing="linear" />
      <Tween target="plume-c" to={{grow: 1}} line="f2" word="far less" dur={1.2} easing="easeOutSine" />
      <Appear target="sticker" line="f2" word="tearless" dur={0} />
      <Tween target="sticker" to={{show: 1}} line="f2" word="tearless" dur={0.45} easing="linear" />
      <Tween target="sticker" to={{slip: 1}} line="f2" word="tearless" offset={0.5} dur={1.4} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="close" title="You started it">
    <Line id="e1" hold={1.4}>So every onion tear is a little chemistry, and you started it.</Line>
    <Part id="title-e" z={1}>{() => <Title title={'A little\nchemistry,\nstarted by you'} kicker="Every onion tear" at={[880, 300]} size={140} sun={[650, 500, 260]} blue={useProp('blue', 0)} pink={useProp('pink', 0)} type={useProp('type', 0)} slip={useProp('slip', 0)} />}</Part>
    <Part id="rings-e" z={2}>{() => <Stencil shapes={slice(175, false)} at={[650, 500]} blue={useProp('blue', 0)} slip={useProp('slip', 0)} />}</Part>
    <Animation>
      <Appear target={['title-e', 'rings-e']} at="start" dur={0} />
      <Tween target="title-e" to={{pink: 1}} at="start" dur={0.8} easing="linear" />
      <Tween target="rings-e" to={{blue: 1}} line="e1" word="chemistry" dur={0.9} easing="linear" />
      <Tween target="title-e" to={{blue: 1}} line="e1" word="every" dur={0} />
      <Tween target="title-e" to={{type: 1}} line="e1" word="every" dur={1.8} easing="linear" />
      <Tween target={['title-e', 'rings-e']} to={{slip: 1}} line="e1" word="started" dur={1.4} easing="linear" />
    </Animation>
  </Scene>
</Doc>;
