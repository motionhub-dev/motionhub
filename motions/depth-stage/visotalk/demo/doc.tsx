// Depth Stage's sample: one example among many. Do not reuse its story, scenes, layout or timings; read it for technique, after your own scenes are planned.
import {Doc, Scene, Line, Part, Animation, Appear, Tween, Set} from '@visotalk/jsx';
import {Obj, useProp} from '@visotalk/runtime';
import {Stage, Plane, Ahead} from '../parts/stage.tsx';
import {Ridge} from '../parts/ridge.tsx';
import {Title} from '../parts/title.tsx';
import {Figure} from '../parts/figure.tsx';
import {Pin} from '../parts/pin.tsx';
import {Beacon} from '../parts/beacon.tsx';
import {Parting} from '../parts/parting.tsx';
import {Motes} from '../parts/motes.tsx';
import {Mileposts} from '../parts/mileposts.tsx';
import {Section} from '../parts/section.tsx';
import {Plume} from './parts/plume.tsx';

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

export default <Doc
  id="depth-stage-sample"
  title="Pompeii, under its own ash"
  lang="en"
  canvas="16x9"
  theme="visotalk/dark"
  tokens={{
    colors: {bg: '#19243A', panel: '#0A0C12', panel2: '#1A2232', border: '#2E3A4E', text: '#F1EADF', muted: '#A7AFBD', faint: '#3A465A', data: '#F2A65E', grad: '#8C9BB2', op: '#9DBBDC', good: '#8CC79F', bad: '#E0705F', warn: '#F2A65E'},
    fonts: {sans: '"Hanken Grotesk", "Noto Serif SC", sans-serif', mono: '"JetBrains Mono", monospace', display: '"Newsreader", "Noto Serif SC", serif'},
    caption: {font: 'sans', size: 36, weight: 500, color: '#F1EADF', background: 'none', padding: [4, 24], bottom: 64, shadow: '0 1px 3px rgba(4, 6, 12, 0.9), 0 0 26px rgba(4, 6, 12, 0.85)'},
  }}
  pacing={{lead: 0.4, hold: 0.45, tail: 1}}
  exports={{captions: 'burned'}}
>
  <Scene id="bay" title="The bay">
    <Line id="l1" text="In AD 79, Pompeii was a busy port town on the Bay of Naples.">In A D seventy-nine, Pompeii was a busy port town on the Bay of Naples.</Line>
    <Line id="l2" hold={0.6}>Behind it stood a quiet mountain, covered in vineyards.</Line>

    <Part id="bay-world">{() => (
      <Stage cam={useProp('cam', 0)} focus={useProp('focus', 420)} panX={useProp('panX', -80)} veil={useProp('veil', 0)} lightX={1420} lightY={430} rays={0.7}>
        <Plane z={5200}><Ridge shape="peaks" seed="apennines" top={560} relief={150} mist={0.8} /></Plane>
        <Plane z={2600}><Ridge shape="cone" seed="vesuvius" top={300} relief={420} at={1180} mist={0.5} rim={0.5} /></Plane>
        <Plane z={1500}><Ridge shape="town" seed="pompeii-upper" top={520} relief={150} at={900} mist={0.4} rim={0.4} /></Plane>
        <Plane z={900}><Ridge shape="town" seed="pompeii" top={570} relief={170} at={700} mist={0.3} rim={0.5} /></Plane>
        <Plane z={420}><Obj id="bay-title"><Title x={290} y={190} kicker="The Bay of Naples · AD 79" title="Pompeii" size={150} show={useProp('bay-title', 'show', 0)} /></Obj></Plane>
        <Plane z={120}><Ridge shape="bank" seed="field" top={770} relief={110} mist={0} /></Plane>
        <Motes kind="dust" seed="bay" near={-150} far={2200} count={22} />
      </Stage>
    )}</Part>
    <Animation>
      <Appear target="bay-world" at="start" dur={0} />
      <Tween target="bay-title" to={{show: 1}} line="l1" word="Pompeii" dur={1.4} easing="easeOutSine" />
      <Tween target="bay-world" to={{cam: 220, panX: 50}} at="start" until={{line: "l2", edge: "end"}} easing="easeInOutSine" />
      <Tween target="bay-world" to={{focus: 2600}} line="l2" word="quiet mountain" dur={1.6} easing="easeInOutSine" />
      <Tween target="bay-title" to={{show: 0}} line="l1" edge="end" offset={0.1} dur={0.8} easing="easeInSine" />
      <Tween target="bay-world" to={{cam: 2000}} line="l2" edge="end" offset={-0.2} until="end" easing="easeInQuad" />
      <Tween target="bay-world" to={{veil: 1}} line="l2" edge="end" offset={0.6} until="end" easing="easeInSine" />
    </Animation>
  </Scene>

  <Scene id="eruption" title="The eruption">
    <Line id="l3" text="Then Vesuvius woke, and a column of ash rose more than 30 kilometres into the sky.">Then Vesuvius woke, and a column of ash rose more than thirty kilometres into the sky.</Line>

    <Part id="eruption-world">{() => (
      <Stage cam={useProp('cam', 900)} focus={1600} veil={useProp('veil', 1)} quake={useProp('quake', 0)} flash={useProp('flash', 0)} lightX={1120} lightY={570} glow={useProp('glow', 0.15)}>
        <Plane z={4800}><Ridge shape="peaks" seed="apennines-2" top={600} relief={140} mist={0.8} /></Plane>
        <Plane z={1620}><Obj id="column"><Plume x={1120} base={568} height={520} rise={useProp('column', 'rise', 0)} /></Obj></Plane>
        <Plane z={1600}><Ridge shape="cone" seed="vesuvius" top={560} relief={300} at={1120} mist={0.4} rim={0.45} /></Plane>
        <Plane z={1600}><Obj id="crater"><Beacon x={1120} y={570} size={3} flicker={0.8} on={useProp('crater', 'on', 0)} /></Obj></Plane>
        <Plane z={1600}><Obj id="crater-pin"><Pin x={1120} y={572} rise={170} side="right" label="Vesuvius" note="1,281 m today" draw={useProp('crater-pin', 'draw', 0)} /></Obj></Plane>
        <Plane z={1600}><Obj id="height"><Figure x={250} y={300} value={useProp('height', 'value', 0)} unit="km" label="and higher: the column of ash" show={useProp('height', 'show', 0)} /></Obj></Plane>
        <Plane z={300}><Ridge shape="town" seed="pompeii-near" top={760} relief={120} at={600} mist={0.2} /></Plane>
        <Obj id="embers" style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d'}}><Motes kind="embers" seed="vent" near={300} far={1700} count={30} amount={useProp('embers', 'amount', 0)} /></Obj>
        <Obj id="ashfall" style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d'}}><Motes kind="ash" seed="fall" near={-100} far={2400} count={40} amount={useProp('ashfall', 'amount', 0)} /></Obj>
      </Stage>
    )}</Part>
    <Animation>
      <Appear target="eruption-world" at="start" dur={0} />
      <Tween target="eruption-world" to={{veil: 0}} at="start" dur={1.1} easing="easeOutSine" />
      <Tween id="blow" target="eruption-world" to={{quake: 1, flash: 0.85}} line="l3" word="woke" dur={0.12} easing="easeOutQuad" />
      <Tween target="eruption-world" to={{quake: 0, flash: 0}} after="blow" dur={1.6} easing="easeOutQuad" />
      <Tween target="embers" to={{amount: 1}} line="l3" word="woke" dur={0.6} />
      <Tween target="ashfall" to={{amount: 1}} line="l3" word="into the sky" dur={1.5} easing="easeInSine" />
      <Tween target="eruption-world" to={{veil: 0.85}} line="l3" edge="end" offset={0.5} until="end" easing="easeInSine" />
      <Tween target="crater-pin" to={{draw: 1}} line="l3" word="Vesuvius" dur={1} easing="easeOutSine" />
      <Tween target="crater" to={{on: 1}} line="l3" word="woke" dur={0.8} easing="easeOutQuad" />
      <Tween target="column" to={{rise: 1}} line="l3" word="column of ash" dur={3.2} easing="easeOutSine" />
      <Tween target="eruption-world" to={{glow: 0.7}} line="l3" word="woke" dur={1.2} easing="easeOutQuad" />
      <Tween target="eruption-world" to={{cam: 0}} line="l3" word="column of ash" dur={2.8} easing="easeInOutSine" />
      <Tween target="height" to={{show: 1}} line="l3" word="thirty kilometres" dur={0.8} easing="easeOutSine" />
      <Tween target="height" to={{value: 30}} line="l3" word="thirty kilometres" dur={1.2} easing="easeOutQuart" />
    </Animation>
  </Scene>

  <Scene id="buried" title="Buried">
    <Line id="l4" text="Pumice rained down for 18 hours. Then surges of hot ash and gas swept over the town.">Pumice rained down for eighteen hours. Then surges of hot ash and gas swept over the town.</Line>

    <Part id="buried-world">{() => (
      <Stage cam={useProp('cam', 0)} focus={400} veil={useProp('veil', 0.85)} lightX={1180} lightY={360} glow={0.5}>
        <Plane z={3200}><Ridge shape="cone" seed="vesuvius" top={330} relief={330} at={1180} mist={0.6} rim={0.3} /></Plane>
        <Plane z={3220}><Plume x={1180} base={338} height={300} rise={1} /></Plane>
        <Plane z={400}><Obj id="deposit"><Section bands={DEPOSIT} walls={4} labelX={1250} built={useProp('deposit', 'built', 0)} /></Obj></Plane>
        <Motes kind="ash" seed="rain" near={-100} far={2600} count={36} />
      </Stage>
    )}</Part>
    <Animation>
      <Appear target="buried-world" at="start" dur={0} />
      <Tween target="buried-world" to={{veil: 0}} at="start" dur={1} easing="easeOutSine" />
      <Tween target="buried-world" to={{cam: 120}} at="start" until="end" easing="easeInOutSine" />
      <Tween target="deposit" to={{built: 1}} line="l4" word="Pumice rained" dur={2.6} easing="easeInOutSine" />
      <Tween target="deposit" to={{built: 2}} line="l4" word="surges of hot ash" dur={1.4} easing="easeOutQuad" />
    </Animation>
  </Scene>

  <Scene id="forgotten" title="Forgotten">
    <Line id="l5" text="The town vanished under up to 6 metres of ash, and was forgotten for almost 17 centuries.">The town vanished under up to six metres of ash, and was forgotten for almost seventeen centuries.</Line>

    <Part id="forgotten-world">{() => (
      <Stage cam={useProp('cam', 0)} focus={useProp('focus', 1500)} veil={useProp('veil', 0.85)} lightX={760} lightY={410} glow={0.45} haze={1.2}>
        <Plane z={6800}><Ridge shape="cone" seed="vesuvius" top={430} relief={300} at={1240} mist={0.6} rim={0.3} /></Plane>
        <Plane z={2400}><Ridge shape="hills" seed="ash-plain" top={640} relief={90} mist={0.6} /></Plane>
        <Plane z={300}><Ridge shape="bank" seed="buried" top={800} relief={90} mist={0} /></Plane>
        <Obj id="posts" style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d'}}><Mileposts items={CENTURIES} z={700} step={1000} shown={useProp('posts', 'shown', 0)} /></Obj>
        {/* the next scene's wall of ash, built ahead: the camera arrives exactly where that scene begins */}
        <Ahead by={5200}><Plane z={200}><Parting shape="strata" seed="ash" top={-40} seam={980} gap={640} /></Plane></Ahead>
        <Motes kind="ash" seed="settled" near={-100} far={3000} count={18} amount={0.6} />
      </Stage>
    )}</Part>
    <Animation>
      <Appear target="forgotten-world" at="start" dur={0} />
      <Appear target="posts" at="start" dur={0} />
      <Tween target="forgotten-world" to={{veil: 0}} at="start" dur={1} easing="easeOutSine" />
      <Tween target="posts" to={{shown: 5}} line="l5" word="vanished" dur={1.6} easing="easeOutSine" />
      <Tween target="forgotten-world" to={{cam: 5200, focus: 5400}} line="l5" word="vanished" until="end" easing="easeInOutSine" />
      <Tween id="haze-in" target="forgotten-world" to={{veil: 0.75}} line="l5" word="seventeen centuries" offset={0.2} dur={0.6} easing="easeInSine" />
      <Tween target="forgotten-world" to={{veil: 0}} after="haze-in" until="end" easing="easeOutSine" />
    </Animation>
  </Scene>

  <Scene id="found" title="Found">
    <Line id="l7" text="In 1748, diggers broke through, and the ash gave back a whole city.">In seventeen forty-eight, diggers broke through, and the ash gave back a whole city.</Line>
    <Line id="l8" hold={1.2}>The ash that buried Pompeii is the reason we can still walk its streets.</Line>

    <Part id="found-world">{() => (
      <Stage cam={useProp('cam', 0)} focus={useProp('focus', 200)} lightX={1300} lightY={380} glow={useProp('glow', 0.75)} rays={useProp('rays', 0.5)}>
        <Plane z={2800}><Ridge shape="cone" seed="vesuvius" top={360} relief={400} at={1320} mist={0.5} rim={0.5} /></Plane>
        <Plane z={900}><Ridge shape="town" seed="pompeii" top={560} relief={190} at={760} mist={0.25} rim={0.6} /></Plane>
        <Plane z={900}><Obj id="forum-pin"><Pin x={640} y={600} rise={170} label="The forum" note="the city's square" draw={useProp('forum-pin', 'draw', 0)} /></Obj></Plane>
        <Plane z={160}><Ridge shape="bank" seed="dig" top={820} relief={80} mist={0} /></Plane>
        <Plane z={200}><Obj id="ash"><Parting shape="strata" seed="ash" top={-40} seam={980} open={useProp('ash', 'open', 0)} gap={640} /></Obj></Plane>
        <Plane z={900}><Obj id="end-title"><Title x={1340} y={150} align="center" kicker="Buried AD 79 · found 1748" title="Pompeii" size={120} show={useProp('end-title', 'show', 0)} /></Obj></Plane>
        <Obj id="spill" style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d'}}><Motes kind="ash" seed="spill" near={-100} far={900} count={34} amount={useProp('spill', 'amount', 0)} /></Obj>
      </Stage>
    )}</Part>
    <Animation>
      <Appear target="found-world" at="start" dur={0} />
      <Tween target="spill" to={{amount: 1}} line="l7" word="broke through" dur={0.5} />
      <Tween target="spill" to={{amount: 0.25}} line="l7" word="whole city" dur={1.5} />
      <Tween target="found-world" to={{cam: 260}} line="l7" word="broke through" until={{line: "l7", edge: "end"}} easing="easeInOutSine" />
      <Tween target="forum-pin" to={{draw: 0}} line="l8" dur={0.8} easing="easeInSine" />
      <Tween target="found-world" to={{cam: 420, glow: 1, rays: 0.9}} line="l8" until="end" easing="easeInOutSine" />
      <Tween target="end-title" to={{show: 1}} line="l8" word="the reason" dur={1.8} easing="easeOutSine" />
      <Tween target="ash" to={{open: 1}} line="l7" word="broke through" dur={2.6} easing="easeInOut" />
      <Tween target="found-world" to={{focus: 900}} line="l7" word="broke through" dur={2.2} easing="easeInOutSine" />
      <Tween target="forum-pin" to={{draw: 1}} line="l7" word="whole city" dur={1} easing="easeOutSine" />
    </Animation>
  </Scene>
</Doc>;
