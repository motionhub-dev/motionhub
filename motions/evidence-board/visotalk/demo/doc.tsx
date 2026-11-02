// Evidence Board's sample: one example among many. Do not reuse its story, scenes, layout or timings; read it for technique, after your own scenes are planned.
// Sources, all works of NASA and in the public domain: the technical air-to-ground voice transcription of 13 April 1970,
// photograph S70-35703 of 17 April 1970 (Wikimedia Commons) and the Report of Apollo 13 Review Board, June 1970.
// The whole film is one board under one camera (parts/world.tsx), a global part whose props the scenes tween.
import {Doc, Scene, Line, Part, Asset, Animation, Appear, Tween, Set} from '@visotalk/jsx';
import {World} from './parts/world.tsx';

export default <Doc
  id="evidence-board-sample"
  title="What broke on Apollo 13, and how we know"
  poster={21.5}
  lang="en"
  canvas="16x9"
  theme="visotalk/dark"
  tokens={{
    colors: {bg: '#221F1C', panel: '#EFEADF', panel2: '#E3DCCB', border: '#34302B', text: '#EFEADF', muted: '#ABA497', faint: '#4C4740', data: '#F5DE3F', grad: '#FBEFA0', op: '#D2342B', good: '#7FBF8C', bad: '#E0645A', warn: '#E8B04A'},
    fonts: {sans: '"Hanken Grotesk", "Noto Sans SC", sans-serif', mono: '"JetBrains Mono", "Noto Sans SC", monospace', display: '"Newsreader", "Noto Serif SC", serif'},
    caption: {font: 'sans', size: 36, weight: 500, color: '#221F1C', background: '#EFEADF', radius: 2, padding: [10, 26], bottom: 50, maxWidth: 1500, shadow: '0 12px 22px -10px rgba(0, 0, 0, 0.75), 0 2px 3px rgba(0, 0, 0, 0.45)'},
  }}
  pacing={{lead: 0.35, hold: 0.5, tail: 1}}
  exports={{captions: 'burned'}}
>
  <Asset id="service-module" kind="image" src="media/service-module.jpg"
    license={{id: 'PD-USGov', attribution: 'NASA (photograph S70-35703, by the Apollo 13 crew)', obligations: []}}
    source="https://commons.wikimedia.org/wiki/File:Apollo_13_SM.jpg" />
  <Part id="board"><World /></Part>

  <Scene id="claim" title="The line everyone quotes">
    <Line id="l1" text="Apollo 13’s famous line is usually quoted as “Houston, we have a problem.”">Apollo thirteen's famous line is usually quoted as: Houston, we have a problem.</Line>
    <Line id="l2">The flight transcript says something else.</Line>
    <Animation>
      <Appear target="board" at="start" dur={0} />
      <Set target="board" to={{camX: 1040, camY: 560, zoom: 0.8, tilt: 36, turn: -7}} at="start" />
      <Tween id="crane" target="board" to={{camX: 975, camY: 360, zoom: 1, tilt: 0, turn: 0}} at="start" dur={3.6} easing="cubic-bezier(0.3, 0, 0.1, 1)" />
      <Tween target="board" to={{title: 1}} at="start" offset={0.1} dur={1.8} easing="easeOutQuart" />
      <Tween target="board" to={{claim: 1}} line="l1" word="usually quoted" dur={1.1} easing="linear" />
      <Tween target="board" to={{camX: 700, camY: 765, zoom: 0.9}} line="l2" dur={1.5} easing="cubic-bezier(0.45, 0, 0.15, 1)" />
      <Tween target="board" to={{travel: 1}} line="l2" dur={1.5} easing="cubic-bezier(0.45, 0, 0.15, 1)" />
      <Tween target="board" to={{call: 1}} line="l2" word="flight transcript" dur={1.1} easing="linear" />
      <Tween target="board" to={{t0: 1}} line="l2" word="something else" dur={1.3} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="call" title="What was said">
    <Line id="l3" text="Fifty-five hours in, Jack Swigert said: “Okay, Houston, we’ve had a problem here.”" hold={0.9}>Fifty-five hours in, Jack Swigert said: Okay, Houston, we've had a problem here.</Line>
    <Animation>
      <Set target="board" to={{travel: 0, focusOn: 2}} at="start" />
      <Tween target="board" to={{camX: 680, camY: 955, zoom: 1.42, dof: 1}} line="l3" dur={1.6} easing="cubic-bezier(0.45, 0, 0.15, 1)" />
      <Tween target="board" to={{callMark: 1}} line="l3" word="we've had a problem here" dur={0.6} easing="linear" />
      <Tween target="board" to={{camX: 700, camY: 740, zoom: 0.92, dof: 0}} line="l3" word="here" offset={0.35} dur={1.2} easing="cubic-bezier(0.45, 0, 0.15, 1)" />
      <Tween target="board" to={{hang: 1}} line="l3" word="here" offset={0.75} dur={1.5} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="photo" title="What it did">
    <Line id="l5">Four days later, the crew cast off the service module, and photographed it.</Line>
    <Line id="l6" hold={0.6}>A whole side panel had been blown away.</Line>
    <Animation>
      <Set target="board" to={{focusOn: 3}} at="start" />
      <Tween target="board" to={{camX: 1180, camY: 700, zoom: 0.72}} line="l5" dur={1.6} easing="cubic-bezier(0.45, 0, 0.15, 1)" />
      <Tween target="board" to={{travel: 1}} line="l5" dur={1.6} easing="cubic-bezier(0.45, 0, 0.15, 1)" />
      <Tween target="board" to={{photo: 1}} line="l5" word="service module" dur={1.1} easing="linear" />
      <Tween target="board" to={{t1: 1}} line="l5" word="photographed it" dur={1.4} easing="linear" />
      <Set target="board" to={{travel: 0}} line="l6" />
      <Tween target="board" to={{camX: 1850, camY: 720, zoom: 1.3, dof: 1}} line="l6" dur={1.4} easing="cubic-bezier(0.45, 0, 0.15, 1)" />
      <Tween target="board" to={{crop: 1}} line="l6" word="side panel" dur={0.9} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="finding" title="Why it happened">
    <Line id="l7">In June, the review board traced it to oxygen tank number two.</Line>
    <Line id="l8" text="Not a chance failure, it found, but “an unusual combination of mistakes, coupled with a somewhat deficient and unforgiving design.”" hold={0.6}>Not a chance failure, it found, but an unusual combination of mistakes, coupled with a somewhat deficient and unforgiving design.</Line>
    <Animation>
      <Tween target="board" to={{camX: 2235, camY: 640, zoom: 0.94, dof: 0}} line="l7" dur={1.6} easing="cubic-bezier(0.45, 0, 0.15, 1)" />
      <Tween target="board" to={{travel: 1}} line="l7" dur={1.6} easing="cubic-bezier(0.45, 0, 0.15, 1)" />
      <Tween target="board" to={{report: 1}} line="l7" word="review board" dur={1.1} easing="linear" />
      <Tween target="board" to={{t2: 1}} line="l7" word="traced it" dur={1.4} easing="linear" />
      <Set target="board" to={{travel: 0, focusOn: 4}} line="l8" />
      <Tween target="board" to={{camX: 2730, camY: 570, zoom: 1.5, dof: 1}} line="l8" dur={1.5} easing="cubic-bezier(0.45, 0, 0.15, 1)" />
      <Tween target="board" to={{reportMark: 1}} line="l8" word="an unusual combination" dur={4.2} easing="linear" />
      <Tween target="board" to={{dof: 0}} line="l8" word="unforgiving design" offset={0.9} dur={0.5} />
    </Animation>
  </Scene>

  <Scene id="volts" title="The mistake">
    <Line id="l9" text="The tank’s heaters were specified for 28 volts, then 65. Its switches were never changed.">The tank's heaters were specified for twenty-eight volts, then sixty-five. Its switches were never changed.</Line>
    <Line id="l9b" text="Rated for 28 volts but run on 65, the switches could not open properly, and the tank overheated." hold={0.6}>Rated for twenty-eight volts but run on sixty-five, the switches could not open properly, and the tank overheated.</Line>
    <Animation>
      <Set target="board" to={{focusOn: 5}} at="start" />
      <Tween target="board" to={{camX: 2730, camY: 1170, zoom: 1.45, dof: 1}} line="l9" dur={1.5} easing="cubic-bezier(0.45, 0, 0.15, 1)" />
      <Tween target="board" to={{item: 1}} line="l9" word="the tank's heaters" offset={0.3} dur={1.1} easing="linear" />
      <Tween target="board" to={{t3: 1}} line="l9" word="specified" dur={1.3} easing="linear" />
      <Tween target="board" to={{itemMark: 1}} line="l9" word="specified for twenty-eight volts" dur={0.9} easing="linear" />
      <Tween target="board" to={{itemMark: 2}} line="l9" word="then sixty-five" dur={0.8} easing="linear" />
      <Tween target="board" to={{itemMark: 3}} line="l9" word="never changed" dur={0.9} easing="linear" />
      <Tween target="board" to={{dof: 0}} line="l9" word="never changed" offset={0.9} dur={0.4} />
      <Set target="board" to={{focusOn: 6}} line="l9b" />
      <Tween target="board" to={{camX: 1730, camY: 1275, zoom: 1.5, dof: 1}} line="l9b" dur={1.5} easing="cubic-bezier(0.45, 0, 0.15, 1)" />
      <Tween target="board" to={{travel: 1}} line="l9b" dur={1.5} easing="cubic-bezier(0.45, 0, 0.15, 1)" />
      <Tween target="board" to={{fig: 1}} line="l9b" offset={0.3} dur={1.0} easing="linear" />
      <Tween target="board" to={{figShow: 1}} line="l9b" word="twenty-eight volts" dur={0.7} easing="linear" />
      <Tween target="board" to={{figShow: 2}} line="l9b" word="sixty-five" dur={0.9} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="case" title="The case">
    <Line id="l10" hold={0.6}>Three sources, one thread. That is how we know.</Line>
    <Animation>
      <Set target="board" to={{travel: 0}} at="start" />
      <Tween target="board" to={{camX: 1710, camY: 900, zoom: 0.53, dof: 0}} line="l10" dur={2.2} easing="cubic-bezier(0.45, 0, 0.15, 1)" />
      <Tween target="board" to={{rail: 1}} line="l10" word="three sources" offset={0.4} dur={2.0} easing="easeInOutSine" />
      <Tween target="board" to={{t0p: 1}} line="l10" word="one thread" dur={0.5} easing="linear" />
      <Tween target="board" to={{t1p: 1}} line="l10" word="one thread" offset={0.4} dur={0.7} easing="linear" />
      <Tween target="board" to={{t2p: 1}} line="l10" word="one thread" offset={1.0} dur={0.7} easing="linear" />
      <Tween target="board" to={{t3p: 1}} line="l10" word="one thread" offset={1.6} dur={0.5} easing="linear" />
      <Tween target="board" to={{drift: 30, tilt: 9, turn: 1.5}} line="l10" word="how we know" dur={3} easing="easeInOutSine" />
    </Animation>
  </Scene>
</Doc>;
