// Screen Desk's sample: one example among many. Do not reuse its story, scenes, layout or timings; read it for technique, after your own scenes are planned.
// Kiln is an invented app, drawn in code (parts/kiln.tsx); the whole film is one desk under one camera (parts/world.tsx), a global part whose props the scenes tween.
import {Doc, Scene, Line, Part, Animation, Appear, Disappear, Tween, Set} from '@visotalk/jsx';
import {useProp} from '@visotalk/runtime';
import {World} from './parts/world.tsx';
import {Keys} from '../parts/keys.tsx';

export default <Doc
  id="screen-desk-sample"
  title="Back up your photos every night"
  poster={57.0}
  lang="en"
  canvas="16x9"
  theme="visotalk/light"
  tokens={{
    colors: {bg: '#E7E5E0', panel: '#FFFFFF', panel2: '#F5F4F1', border: '#E3E1DC', text: '#1C1D21', muted: '#6F7178', faint: '#C7C5BF', data: '#2F5BFF', grad: '#DCE4FF', op: '#2F5BFF', good: '#1E9A5B', bad: '#D6453B', warn: '#B9800F'},
    fonts: {sans: '"Inter", "Noto Sans SC", sans-serif', mono: '"JetBrains Mono", "Noto Sans SC", monospace'},
    caption: {font: 'sans', size: 36, weight: 400, color: '#1C1D21', background: 'rgba(255, 255, 255, 0.94)', radius: 14, padding: [12, 28], bottom: 54, maxWidth: 1500, shadow: '0 10px 30px -12px rgba(28, 29, 33, 0.35), 0 1px 3px rgba(28, 29, 33, 0.12)'},
  }}
  pacing={{lead: 0.3, hold: 0.4, tail: 0.8}}
  exports={{captions: 'burned'}}
>
  <Part id="desk"><World /></Part>

  <Scene id="open" title="Kiln on the desk">
    <Line id="l1">Kiln keeps your photo library on your own computer.</Line>
    <Line id="l2" hold={0.6}>Here is how to back it up every night, in three steps.</Line>
    <Animation>
      <Appear target="desk" at="start" dur={0} />
      <Set target="desk" to={{land: 0, tilt: 42, zoom: 0.74, turn: -8, camY: 540}} at="start" />
      <Tween target="desk" to={{land: 1}} at="start" offset={0.15} dur={1.1} easing="linear" />
      <Tween id="crane" target="desk" to={{tilt: 12, zoom: 0.95, turn: 0, camY: 460}} at="start" dur={3.4} easing="cubic-bezier(0.45, 0, 0.15, 1)" />
      <Tween target="desk" to={{zoom: 0.99, camY: 452}} after="crane" until="end" easing="easeInOutSine" />
      <Tween target="desk" to={{title: 1}} line="l2" word="back it up" dur={0.9} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="settings" title="Step 1: Backups">
    <Line id="l3">First, press command comma to open Settings.</Line>
    <Line id="l4" hold={0.5}>Then choose Backups in the sidebar.</Line>

    <Part id="keys" x={860} y={760} w={200} h={110}>{() => <Keys keys={['⌘', ',']} press={useProp('press', 0)} show={useProp('show', 0)} />}</Part>
    <Animation>
      <Tween target="desk" to={{title: 0}} at="start" dur={0.6} easing="easeInQuad" />
      <Tween target="desk" to={{tilt: 0, zoom: 1, camY: 430}} at="start" dur={1.2} easing="easeInOutSine" />
      <Appear target="keys" line="l3" word="press" dur={0} />
      <Tween target="keys" to={{show: 1}} line="l3" word="press" dur={0.4} easing="easeOutQuart" />
      <Tween target="keys" to={{press: 1}} line="l3" word="command comma" dur={1.1} easing="linear" />
      <Tween target="desk" to={{settings: 1}} line="l3" word="comma" offset={0.25} dur={0.45} easing="easeInOutSine" />
      <Tween target="desk" to={{camX: 660, camY: 370, zoom: 1.38}} line="l3" word="open settings" dur={1.3} easing="cubic-bezier(0.55, 0, 0.18, 1)" />
      <Tween target="desk" to={{travel: 1}} line="l3" word="open settings" dur={1.3} easing="cubic-bezier(0.55, 0, 0.18, 1)" />
      <Tween target="keys" to={{show: 0}} line="l4" dur={0.35} />
      <Disappear target="keys" line="l4" offset={0.4} dur={0} />
      <Set target="desk" to={{curX: 980, curY: 560}} line="l4" />
      <Tween target="desk" to={{cur: 1}} line="l4" dur={0.3} />
      <Tween target="desk" to={{curX: 452, curY: 360}} line="l4" word="choose" dur={0.7} easing="cubic-bezier(0.55, 0, 0.18, 1)" />
      <Tween target="desk" to={{click: 1}} line="l4" word="backups" dur={0.6} easing="linear" />
      <Set target="desk" to={{pane: 1}} line="l4" word="backups" offset={0.15} />
      <Tween target="desk" to={{r1: 1}} line="l4" word="backups" offset={0.2} dur={1.1} easing="linear" />
      <Tween target="desk" to={{s1: 1}} line="l4" word="backups" offset={0.5} dur={0.8} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="destination" title="Step 2: a drive">
    <Line id="l5">Next, pick where the copies go.</Line>
    <Line id="l6" hold={0.5}>An external drive is the safest place.</Line>
    <Animation>
      <Set target="desk" to={{click: 0, travel: 0}} at="start" />
      <Tween target="desk" to={{r1: 0, s1: 0}} at="start" dur={0.4} />
      <Tween target="desk" to={{camX: 1110, camY: 392, zoom: 1.42}} line="l5" word="pick" dur={1.3} easing="cubic-bezier(0.55, 0, 0.18, 1)" />
      <Tween target="desk" to={{travel: 1}} line="l5" word="pick" dur={1.3} easing="cubic-bezier(0.55, 0, 0.18, 1)" />
      <Tween target="desk" to={{curX: 1500, curY: 350}} line="l5" word="pick" offset={0.1} dur={1.1} easing="cubic-bezier(0.55, 0, 0.18, 1)" />
      <Tween target="desk" to={{r2: 1}} line="l5" word="copies go" dur={1.1} easing="linear" />
      <Tween target="desk" to={{click: 1}} line="l6" word="external drive" dur={0.6} easing="linear" />
      <Tween target="desk" to={{drive: 1}} line="l6" word="external drive" offset={0.2} dur={0.5} />
      <Tween target="desk" to={{s2: 1}} line="l6" word="external drive" offset={0.4} dur={0.8} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="schedule" title="Step 3: every night">
    <Line id="l7" text="Now switch on “Back up every night”.">Now switch on back up every night.</Line>
    <Line id="l8" hold={0.5}>It runs at two in the morning, while you sleep.</Line>
    <Animation>
      <Set target="desk" to={{click: 0, travel: 0}} at="start" />
      <Tween target="desk" to={{r2: 0, s2: 0}} at="start" dur={0.4} />
      <Tween target="desk" to={{camX: 1150, camY: 405, zoom: 1.42}} line="l7" dur={1.1} easing="cubic-bezier(0.55, 0, 0.18, 1)" />
      <Tween target="desk" to={{lift: 1}} line="l7" word="switch on" dur={1.0} easing="easeOut" />
      <Tween target="desk" to={{curX: 1540, curY: 448}} line="l7" word="switch on" dur={0.8} easing="cubic-bezier(0.55, 0, 0.18, 1)" />
      <Tween target="desk" to={{click: 1}} line="l7" word="every night" dur={0.6} easing="linear" />
      <Tween target="desk" to={{on: 1}} line="l7" word="every night" offset={0.1} dur={0.35} easing="easeInOutSine" />
      <Tween target="desk" to={{r3: 1}} line="l7" word="every night" offset={0.25} dur={1.1} easing="linear" />
      <Tween target="desk" to={{s3: 1}} line="l7" word="every night" offset={0.6} dur={0.8} easing="linear" />
      <Tween target="desk" to={{lift: 0, r3: 0}} line="l8" dur={0.6} easing="easeInOutSine" />
      <Tween target="desk" to={{cur: 0}} line="l8" dur={0.3} />
      <Tween target="desk" to={{r4: 1}} line="l8" word="two in the morning" dur={1.1} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="check" title="Check it in a terminal">
    <Line id="l9">To check it, run kiln backup status in a terminal.</Line>
    <Line id="l10" hold={0.6}>It shows the drive, the schedule, and that the next run is ready.</Line>
    <Animation>
      <Set target="desk" to={{travel: 0}} at="start" />
      <Tween target="desk" to={{r4: 0, s3: 0}} at="start" dur={0.4} />
      <Tween target="desk" to={{term: 1}} line="l9" word="check it" offset={0.7} dur={0.9} easing="easeOutQuart" />
      <Tween target="desk" to={{camX: 1900, camY: 610, zoom: 1.35}} line="l9" word="check it" dur={1.4} easing="cubic-bezier(0.55, 0, 0.18, 1)" />
      <Tween target="desk" to={{travel: 1}} line="l9" word="check it" dur={1.4} easing="cubic-bezier(0.55, 0, 0.18, 1)" />
      <Tween target="desk" to={{typed: 1}} line="l9" word="kiln backup status" dur={1.3} easing="linear" />
      <Tween target="desk" to={{shown: 1}} line="l10" word="drive" dur={0.25} />
      <Tween target="desk" to={{shown: 3}} line="l10" word="schedule" dur={0.5} />
      <Tween target="desk" to={{shown: 4}} line="l10" word="next run" dur={0.9} easing="linear" />
      <Tween target="desk" to={{r5: 1}} line="l10" word="ready" offset={0.1} dur={1.1} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="morning" title="The next morning">
    <Line id="l11" hold={0.5}>The next morning, your phone tells you it's done.</Line>
    <Animation>
      <Set target="desk" to={{travel: 0}} at="start" />
      <Tween target="desk" to={{r5: 0, term: 0}} at="start" dur={0.6} easing="easeInQuad" />
      <Tween target="desk" to={{phone: 1}} line="l11" word="next morning" offset={0.3} dur={1.0} easing="linear" />
      <Tween target="desk" to={{camX: 1790, camY: 500, zoom: 1}} line="l11" word="next morning" dur={1.5} easing="cubic-bezier(0.55, 0, 0.18, 1)" />
      <Tween target="desk" to={{travel: 1}} line="l11" word="next morning" dur={1.5} easing="cubic-bezier(0.55, 0, 0.18, 1)" />
      <Tween target="desk" to={{notify: 1}} line="l11" word="tells you" dur={0.9} easing="linear" />
      <Set target="desk" to={{done: 1}} line="l11" word="next morning" />
    </Animation>
  </Scene>

  <Scene id="difference" title="What changed">
    <Line id="l13">Before, your photos lived on one disk. Now there's a copy every night.</Line>
    <Line id="l14" text="And from night two, only changes are copied: 36 photos, not all 12,480." hold={0.6}>And from night two, only changes are copied: thirty-six photos, not all twelve thousand four hundred and eighty.</Line>
    <Animation>
      <Set target="desk" to={{travel: 0}} at="start" />
      <Tween target="desk" to={{camX: 1100, camY: 400, zoom: 1.25}} line="l13" dur={1.4} easing="cubic-bezier(0.55, 0, 0.18, 1)" />
      <Tween target="desk" to={{travel: 1}} line="l13" dur={1.4} easing="cubic-bezier(0.55, 0, 0.18, 1)" />
      <Set target="desk" to={{wipe: 0.002}} line="l13" word="before" />
      <Tween target="desk" to={{wipe: 1}} line="l13" word="now" dur={1.4} easing="easeInOutSine" />
      <Tween target="desk" to={{camX: 900, camY: 420, zoom: 1.1}} line="l14" dur={1.2} easing="easeInOutSine" />
      <Tween target="desk" to={{fig: 1}} line="l14" word="night two" dur={0.9} easing="linear" />
      <Tween target="desk" to={{figValue: 36}} line="l14" word="thirty-six photos" dur={1.2} easing="easeOutQuart" />
    </Animation>
  </Scene>

  <Scene id="close" title="Three steps">
    <Line id="l12" hold={1.4}>That's it: three steps, and your photos are safe.</Line>
    <Animation>
      <Tween target="desk" to={{fig: 0}} at="start" dur={0.5} easing="easeInQuad" />
      <Set target="desk" to={{wipe: 0}} at="start" offset={0.5} />
      <Tween target="desk" to={{camX: 1090, camY: 360, zoom: 0.69, tilt: 14, turn: -4}} line="l12" word="that's it" dur={2.8} easing="cubic-bezier(0.45, 0, 0.15, 1)" />
      <Tween target="desk" to={{s1: 1}} line="l12" word="three steps" dur={0.7} easing="linear" />
      <Tween target="desk" to={{s2: 1}} line="l12" word="three steps" offset={0.25} dur={0.7} easing="linear" />
      <Tween target="desk" to={{s3: 1}} line="l12" word="three steps" offset={0.5} dur={0.7} easing="linear" />
    </Animation>
  </Scene>
</Doc>;
