// Depth Stage's reel: twenty-five seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
import type {CSSProperties, ReactNode} from 'react';
import {Easing, Sequence, interpolate, useTime} from '@motionhub/runtime';
import {Stage, Plane, Ahead} from './parts/stage.tsx';
import {Ridge} from './parts/ridge.tsx';
import {Title} from './parts/title.tsx';
import {Figure} from './parts/figure.tsx';
import {Pin} from './parts/pin.tsx';
import {Beacon} from './parts/beacon.tsx';
import {Parting} from './parts/parting.tsx';
import {Motes} from './parts/motes.tsx';
import {Mileposts} from './parts/mileposts.tsx';
import {Section} from './parts/section.tsx';
import {Term} from './parts/term.tsx';
import {Columns} from './parts/columns.tsx';
import {Thread} from './parts/thread.tsx';

export const reel = {seconds: 25, width: 1920, height: 1080};
/** What happens when, for the motion's sound (sound.json): the camera dollies, focus racks, a light kindles, a figure lands, a section builds, the posts pass by */
export const cues = [
  {at: 0, role: 'move', dur: 4.2}, {at: 1.2, role: 'land'}, {at: 2.6, role: 'draw', dur: 1.4}, {at: 4.2, role: 'move', dur: 1}, {at: 6.0, role: 'cut'},
  {at: 6.4, role: 'draw', dur: 0.8}, {at: 6.6, role: 'move', dur: 2.2}, {at: 6.6, role: 'land'}, {at: 8.4, role: 'count'},
  {at: 10.4, role: 'draw', dur: 1.8}, {at: 12.2, role: 'land'},
  {at: 13.6, role: 'draw', dur: 1.5}, {at: 15.2, role: 'draw', dur: 0.8}, {at: 16.2, role: 'land'},
  {at: 18.4, role: 'land'}, {at: 18.9, role: 'land'}, {at: 19.1, role: 'move', dur: 2.7}, {at: 19.4, role: 'land'}, {at: 21.0, role: 'cut'},
  {at: 21.8, role: 'move', dur: 1.7}, {at: 22.8, role: 'land'}, {at: 23.3, role: 'count'}, {at: 23.6, role: 'land'},
];

type Ease = (v: number) => number;
const sine = Easing.inOutSine, linear = Easing.linear, outQuart = Easing.outQuart;
const outSine = Easing.bezier(0.61, 1, 0.88, 1), inSine = Easing.bezier(0.12, 0, 0.39, 0), outQuad = Easing.bezier(0.5, 1, 0.89, 1), inQuad = Easing.bezier(0.11, 0, 0.5, 0);
/** Through the values at the times, eased between each pair */
const keys = (t: number, times: number[], values: number[], easing: Ease = sine) => interpolate(t, times, values, {easing, clamp: true});

/** A layer that keeps the stage's 3D space, for the parts that place their own planes */
const Space = ({children}: {children: ReactNode}) => {
  const style: CSSProperties = {position: 'absolute', inset: 0, transformStyle: 'preserve-3d'};
  return <div style={style}>{children}</div>;
};

const DEPOSIT = [
  {label: 'Pumice', note: 'fell for 18 hours · about 2.8 m', depth: 260},
  {label: 'Hot ash and gas', note: 'surges on the second morning', depth: 150},
];
const CENTURIES = [
  {label: 'AD 79', note: 'buried'},
  {label: 'AD 500', note: 'fields over it'},
  {label: 'AD 1000', note: 'a name forgotten'},
  {label: 'AD 1500', note: 'a canal cut through'},
  {label: 'AD 1748', note: 'the first dig'},
];

/** The bay at rest: the title in focus, a rack to the mountain and a thread from it to the town, then the dolly into the fog */
function Bay() {
  const t = useTime();
  return (
    <Stage cam={t < 4.2 ? keys(t, [0, 4.2], [0, 220]) : keys(t, [4.2, 5.2], [220, 2000], inQuad)} focus={keys(t, [1.8, 3.0], [420, 2600])} panX={keys(t, [0, 4.2], [-80, 50])}
      veil={keys(t, [4.5, 5.2], [0, 1], inSine)} lightX={1420} lightY={430} rays={0.7}>
      <Plane z={5200}><Ridge shape="peaks" seed="apennines" top={560} relief={150} mist={0.8} /></Plane>
      <Plane z={2600}><Ridge shape="cone" seed="vesuvius" top={300} relief={420} at={1180} mist={0.5} rim={0.5} /></Plane>
      <Plane z={2600}><Thread from={[1180, 312]} to={[560, 500]} bend={130} label="Pompeii, about 10 km away" draw={keys(t, [2.6, 4.0], [0, 1], linear)} /></Plane>
      <Plane z={1500}><Ridge shape="town" seed="pompeii-upper" top={520} relief={150} at={900} mist={0.4} rim={0.4} /></Plane>
      <Plane z={900}><Ridge shape="town" seed="pompeii" top={570} relief={170} at={700} mist={0.3} rim={0.5} /></Plane>
      <Plane z={420}><Title x={290} y={190} kicker="The Bay of Naples · AD 79" title="Pompeii" size={150} show={keys(t, [0.05, 1.2, 2.4, 3.0], [0, 1, 1, 0], outSine)} /></Plane>
      <Plane z={120}><Ridge shape="bank" seed="field" top={770} relief={110} mist={0} /></Plane>
      <Motes kind="dust" seed="bay" near={-150} far={2200} count={22} />
    </Stage>
  );
}

/** The mountain wakes: one blow, a light kindling in the crater, embers, its name, the height of the column, and the ash */
function Eruption() {
  const t = useTime(), blow = keys(t, [0.8, 0.92, 2.2], [0, 1, 0], outQuad);
  return (
    <Stage cam={keys(t, [1.4, 3.6], [900, 0])} focus={1600} veil={keys(t, [0, 0.8, 4.0, 4.8], [1, 0, 0, 0.85], outSine)} quake={blow} flash={blow * 0.85}
      lightX={1120} lightY={570} glow={keys(t, [0.8, 1.8], [0.15, 0.7], outQuad)}>
      <Plane z={4800}><Ridge shape="peaks" seed="apennines-2" top={600} relief={140} mist={0.8} /></Plane>
      <Plane z={1600}><Ridge shape="cone" seed="vesuvius" top={560} relief={300} at={1120} mist={0.4} rim={0.45} /></Plane>
      <Plane z={1600}><Beacon x={1120} y={570} size={3} flicker={0.8} on={keys(t, [0.8, 1.4], [0, 1], outQuad)} /></Plane>
      <Plane z={1600}><Pin x={1120} y={572} rise={170} side="right" label="Vesuvius" note="1,281 m today" draw={keys(t, [1.2, 2.0], [0, 1], outSine)} /></Plane>
      <Plane z={1600}><Figure x={250} y={300} value={keys(t, [2.2, 3.2], [0, 30], outQuart)} unit="km" label="and higher: the column of ash" show={keys(t, [2.2, 2.8], [0, 1], outSine)} /></Plane>
      <Plane z={300}><Ridge shape="town" seed="pompeii-near" top={760} relief={120} at={600} mist={0.2} /></Plane>
      <Space><Motes kind="embers" seed="vent" near={300} far={1700} count={30} amount={keys(t, [0.8, 1.4], [0, 1])} /></Space>
      <Space><Motes kind="ash" seed="fall" near={-100} far={2400} count={40} amount={keys(t, [2.6, 3.8], [0, 1], inSine)} /></Space>
    </Stage>
  );
}

const SCALE = [
  {label: 'Everest', value: 8.8, note: '8.8 km'},
  {label: 'An airliner', value: 11, note: '11 km'},
  {label: 'The column', value: 30, note: '30 km'},
];

/** For scale: the column of ash stood beside the highest mountain and a cruising airliner, risen one after another */
function Scale() {
  const t = useTime();
  return (
    <Stage cam={keys(t, [0, 3.2], [0, 140])} focus={700} veil={keys(t, [0, 0.6, 2.7, 3.2], [0.85, 0, 0, 0.85], outSine)} lightX={1500} lightY={300} glow={0.55} haze={1.1}>
      <Plane z={4800}><Ridge shape="peaks" seed="apennines-3" top={640} relief={130} mist={0.8} /></Plane>
      <Plane z={700}><Columns items={SCALE} max={30} x={560} gap={400} base={850} height={560} warm={2} rise={keys(t, [0.4, 2.2], [0, 1], linear)} /></Plane>
      <Plane z={160}><Ridge shape="bank" seed="scale" top={900} relief={60} mist={0} /></Plane>
      <Motes kind="ash" seed="scale" near={-100} far={2400} count={20} amount={0.5} />
    </Stage>
  );
}

/** The town buried: the section lays pumice, then the surge, over the old surface */
function Buried() {
  const t = useTime();
  return (
    <Stage cam={keys(t, [0, 5.0], [0, 160])} focus={400} veil={keys(t, [0, 0.7, 4.6, 5.0], [0.85, 0, 0, 0.85], outSine)} lightX={1180} lightY={360} glow={0.5}>
      <Plane z={3200}><Ridge shape="cone" seed="vesuvius" top={330} relief={330} at={1180} mist={0.6} rim={0.3} /></Plane>
      <Plane z={400}><Section bands={DEPOSIT} walls={4} labelX={1250} built={keys(t, [0.4, 1.9, 2.0, 2.8], [0, 1, 1, 2])} /></Plane>
      <Plane z={400}><Term x={180} y={170} word="Pyroclastic surge" meaning="a cloud of hot ash and gas that races along the ground" size={84} show={keys(t, [2.6, 4.0, 4.6, 5.0], [0, 1, 1, 0], outSine)} /></Plane>
      <Motes kind="ash" seed="rain" near={-100} far={2600} count={36} />
    </Stage>
  );
}

/** Centuries counted as posts, the camera dollying past them to the wall of ash built ahead */
function Forgotten() {
  const t = useTime();
  return (
    <Stage cam={keys(t, [0.9, 3.6], [0, 5200])} focus={keys(t, [0.9, 3.6], [1500, 5400])} veil={keys(t, [0, 0.6, 2.5, 2.8, 3.6], [0.85, 0, 0, 0.75, 0], outSine)}
      lightX={760} lightY={410} glow={0.45} haze={1.2}>
      <Plane z={6800}><Ridge shape="cone" seed="vesuvius" top={430} relief={300} at={1240} mist={0.6} rim={0.3} /></Plane>
      <Plane z={2400}><Ridge shape="hills" seed="ash-plain" top={640} relief={90} mist={0.6} /></Plane>
      <Plane z={300}><Ridge shape="bank" seed="buried" top={800} relief={90} mist={0} /></Plane>
      <Space><Mileposts items={CENTURIES} z={700} step={1000} shown={keys(t, [0.2, 1.4], [0, 5], outSine)} /></Space>
      <Ahead by={5200}><Plane z={200}><Parting shape="strata" seed="ash" top={-40} seam={980} gap={640} /></Plane></Ahead>
      <Motes kind="ash" seed="settled" near={-100} far={3000} count={18} amount={0.6} />
    </Stage>
  );
}

/** The ash parts on the city: focus racks to it, the forum is named, the title comes out of the haze */
function Found() {
  const t = useTime();
  return (
    <Stage cam={keys(t, [0, 1.5, 2.6], [0, 260, 420])} focus={keys(t, [0, 1.5], [200, 900])} lightX={1300} lightY={380}
      glow={keys(t, [1.5, 2.6], [0.75, 1])} rays={keys(t, [1.5, 2.6], [0.5, 0.9])}>
      <Plane z={2800}><Ridge shape="cone" seed="vesuvius" top={360} relief={400} at={1320} mist={0.5} rim={0.5} /></Plane>
      <Plane z={900}><Ridge shape="town" seed="pompeii" top={560} relief={190} at={760} mist={0.25} rim={0.6} /></Plane>
      <Plane z={900}><Pin x={640} y={600} rise={170} label="The forum" note="the city's square" draw={keys(t, [1.0, 1.6, 1.9, 2.3], [0, 1, 1, 0], outSine)} /></Plane>
      <Plane z={160}><Ridge shape="bank" seed="dig" top={820} relief={80} mist={0} /></Plane>
      <Plane z={200}><Parting shape="strata" seed="ash" top={-40} seam={980} open={keys(t, [0, 1.7], [0, 1], Easing.inOutCubic)} gap={640} /></Plane>
      <Plane z={900}><Title x={1340} y={150} align="center" kicker="Buried AD 79 · found 1748" title="Pompeii" size={120} show={keys(t, [1.6, 2.6], [0, 1], outSine)} /></Plane>
      <Space><Motes kind="ash" seed="spill" near={-100} far={900} count={34} amount={keys(t, [0, 0.4, 1.0, 2.0], [0, 1, 1, 0.25], linear)} /></Space>
    </Stage>
  );
}

export default function Reel() {
  return (
    <>
      <Sequence from={0} duration={5.2}><Bay /></Sequence>
      <Sequence from={5.2} duration={4.8}><Eruption /></Sequence>
      <Sequence from={10.0} duration={3.2}><Scale /></Sequence>
      <Sequence from={13.2} duration={5.0}><Buried /></Sequence>
      <Sequence from={18.2} duration={3.6}><Forgotten /></Sequence>
      <Sequence from={21.8}><Found /></Sequence>
    </>
  );
}
