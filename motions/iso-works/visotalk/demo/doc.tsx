// Iso Works's sample: one example among many. Do not reuse its story, scenes, layout or timings; read it for technique, after your own scenes are planned.
// The figures: UPS Worldport, Louisville, sorts up to about 416,000 packages an hour; before its expansion its capacity was about 304,000 an hour (UPS, as reported by Engadget 2013 and Inside Logistics 2010).
import {Doc, Scene, Line, Part, Animation, Appear, Tween, Set} from '@visotalk/jsx';
import {useProp} from '@visotalk/runtime';
import {Floor} from '../parts/floor.tsx';
import {Plaque} from '../parts/plaque.tsx';
import {Building} from '../parts/building.tsx';
import {Belt} from '../parts/belt.tsx';
import {Stack} from '../parts/stack.tsx';
import {Stacks} from '../parts/stacks.tsx';
import {Sign} from '../parts/sign.tsx';

// the hub, seen whole: docks, the sorting hall and the outbound docks along one belt
const HUB = {origin: [790, 225] as [number, number], k: 56};
// the belts run in front of the buildings and turn in at their doors, so no building hides them
const IN: [number, number][] = [[2.4, 5], [2.4, 7], [7.2, 7], [7.2, 5.5]];
const OUT: [number, number][] = [[9.3, 5.5], [9.3, 7], [14.4, 7], [14.4, 5]];
// the count, seen closer, and the comparison, a little to the left
const NEAR = {origin: [860, 250] as [number, number], k: 58};
const PAIR = {origin: [740, 360] as [number, number], k: 54};
const OPEN = {origin: [770, 180] as [number, number], k: 58};

// The camera: every part of a scene reads its view from its own props, so one <Tween> over all of them (ox, oy, k) pans and pushes the works as one.
const useView = (base: {origin: [number, number]; k: number}) => ({origin: [useProp('ox', base.origin[0]), useProp('oy', base.origin[1])] as [number, number], k: useProp('k', base.k)});

export default <Doc
  id="iso-works-sample"
  title="A night at the parcel hub"
  poster={21.8}
  lang="en"
  canvas="16x9"
  theme="visotalk/light"
  tokens={{
    colors: {bg: '#ECEAE4', panel: '#FFFFFF', panel2: '#E2DFD7', border: '#D0CCC2', text: '#22252D', muted: '#6F7480', faint: '#C6C3BB', data: '#3D5BD9', grad: '#EB6A4B', op: '#1C9C8A', good: '#3A9A5B', bad: '#D6463A', warn: '#E2A62E'},
    fonts: {sans: '"Hanken Grotesk", "Noto Sans SC", sans-serif', mono: '"JetBrains Mono", monospace', display: '"Hanken Grotesk", "Noto Sans SC", sans-serif'},
    caption: {font: 'sans', size: 34, weight: 500, color: '#22252D', background: 'rgba(255, 255, 255, 0.96)', radius: 4, padding: [10, 24], bottom: 56, shadow: '0 2px 0 #D0CCC2', rule: '#3D5BD9', ruleSide: 'left'},
  }}
  pacing={{lead: 0.4, hold: 0.45, tail: 1}}
  exports={{captions: 'burned'}}
>
  <Scene id="open" title="The question">
    <Line id="o1">Every night, a parcel hub turns a mountain of boxes into neat truckloads, one for every town.</Line>
    <Part id="floor-o">{() => <Floor reveal={useProp('reveal', 0)} {...useView(OPEN)} />}</Part>
    <Part id="plaque" z={1}>{() => <Plaque at={[0, 4]} width={17} title="A night at the hub" kicker="How a parcel finds its truck" role="process" rise={useProp('rise', 0)} {...useView(OPEN)} />}</Part>
    <Animation>
      <Appear target="floor-o" at="start" dur={0} />
      <Tween target="floor-o" to={{reveal: 1}} at="start" dur={1.8} easing="easeOutQuart" />
      <Appear target="plaque" line="o1" word="parcel hub" dur={0} />
      <Tween target="plaque" to={{rise: 1}} line="o1" word="parcel hub" dur={1.3} easing="linear" />
      <Tween target={['floor-o', 'plaque']} to={{k: 62, ox: 745, oy: 159}} at="start" until="end" easing="easeInOutSine" />
    </Animation>
  </Scene>

  <Scene id="hub" title="Through the hub">
    <Line id="h1">Planes and trucks are unloaded at the docks, and every parcel goes onto a belt.</Line>
    <Line id="h2">Inside the sorting hall, a scanner reads its label in a fraction of a second,</Line>
    <Line id="h3">and the belt steers it to the outbound dock that serves its town.</Line>
    <Part id="floor-h">{() => <Floor {...useView(HUB)} />}</Part>
    <Part id="belt-in" z={1}>{() => <Belt path={IN} draw={useProp('draw', 0)} travel={useProp('travel', 0)} from="intake" dim={useProp('dim', 0)} {...useView(HUB)} />}</Part>
    <Part id="belt-out" z={1}>{() => <Belt path={OUT} draw={useProp('draw', 0)} travel={useProp('travel', 0)} from="process" {...useView(HUB)} />}</Part>
    <Part id="docks" z={2}>{() => <Building at={[0, 2]} size={[3.5, 3, 2.2]} role="intake" name="Docks" rise={useProp('rise', 0)} ping={useProp('ping', 0)} dim={useProp('dim', 0)} {...useView(HUB)} />}</Part>
    <Part id="sorter" z={2}>{() => <Building at={[6, 1.5]} size={[4.5, 4, 2.8]} role="process" name="Sorting" machine="arch" goods={['intake', 'process']} rise={useProp('rise', 0)} ping={useProp('ping', 0)} lift={useProp('lift', 0)} {...useView(HUB)} />}</Part>
    <Part id="outbound" z={2}>{() => <Building at={[12.6, 2]} size={[3.5, 3, 2.2]} role="output" name="Outbound" rise={useProp('rise', 0)} ping={useProp('ping', 0)} {...useView(HUB)} />}</Part>
    <Animation>
      <Appear target="floor-h" at="start" dur={0} />
      {/* the camera opens close on the docks and pulls back as the belt leads away from them */}
      <Set target={['floor-h', 'belt-in', 'belt-out', 'docks', 'sorter', 'outbound']} to={{k: 72, ox: 1069, oy: 330}} at="start" />
      <Tween target={['floor-h', 'belt-in', 'belt-out', 'docks', 'sorter', 'outbound']} to={{k: 70, ox: 1021, oy: 196}} line="h1" word="belt" dur={1.8} easing="easeInOut" />
      <Appear target="docks" line="h1" word="docks" dur={0} />
      <Tween target="docks" to={{rise: 1}} line="h1" word="docks" dur={1.3} easing="linear" />
      <Tween target="docks" to={{ping: 1}} line="h1" word="docks" offset={0.9} dur={1.2} easing="easeOutSine" />
      <Appear target="belt-in" line="h1" word="belt" dur={0} />
      <Tween target="belt-in" to={{draw: 1}} line="h1" word="belt" dur={0.8} easing="easeInOutSine" />
      <Tween target="belt-in" to={{travel: 40}} line="h1" word="belt" offset={0.6} until="end" easing="linear" />
      <Appear target="sorter" line="h2" word="sorting hall" dur={0} />
      <Tween target="sorter" to={{rise: 1}} line="h2" word="sorting hall" dur={1.3} easing="linear" />
      <Tween target="sorter" to={{ping: 1}} line="h2" word="sorting hall" offset={0.9} dur={1.2} easing="easeOutSine" />
      <Tween target={['floor-h', 'belt-in', 'belt-out', 'docks', 'sorter', 'outbound']} to={{k: 74, ox: 660, oy: 212}} line="h2" word="scanner" dur={1.4} easing="easeInOut" />
      <Tween target="sorter" to={{lift: 1}} line="h2" word="scanner" offset={0.2} dur={1.4} easing="easeInOutSine" />
      <Tween target={['docks', 'belt-in']} to={{dim: 0.8}} line="h2" word="scanner" dur={0.8} />
      <Tween target={['floor-h', 'belt-in', 'belt-out', 'docks', 'sorter', 'outbound']} to={{k: 56, ox: 790, oy: 210}} line="h3" word="steers" dur={1.4} easing="easeInOut" />
      <Appear target="belt-out" line="h3" word="steers" dur={0} />
      <Tween target="belt-out" to={{draw: 1}} line="h3" word="steers" dur={0.9} easing="easeInOutSine" />
      <Tween target="belt-out" to={{travel: 30}} line="h3" word="steers" offset={0.5} until="end" easing="linear" />
      <Tween target="sorter" to={{lift: 0}} line="h3" word="steers" dur={1} easing="easeInOutSine" />
      <Tween target={['docks', 'belt-in']} to={{dim: 0}} line="h3" word="steers" dur={0.8} />
      <Appear target="outbound" line="h3" word="outbound dock" dur={0} />
      <Tween target="outbound" to={{rise: 1}} line="h3" word="outbound dock" dur={1.3} easing="linear" />
      <Tween target="outbound" to={{ping: 1}} line="h3" word="outbound dock" offset={0.9} dur={1.2} easing="easeOutSine" />
    </Animation>
  </Scene>

  <Scene id="count" title="How many">
    <Line id="c1" text="The largest, UPS Worldport in Louisville, sorts about 416,000 parcels an hour.">The largest, U P S Worldport in Louisville, sorts about four hundred and sixteen thousand parcels an hour.</Line>
    <Line id="c2" text="That is about 115 every second.">That is about one hundred and fifteen every second.</Line>
    <Part id="floor-c">{() => <Floor {...useView(NEAR)} />}</Part>
    <Part id="key" z={1}>{() => <Sign at={[-4, 7]} width={3.6} title="one cube" figure="10,000" role="store" show={useProp('show', 0)} {...useView(NEAR)} />}</Part>
    <Part id="stack" z={2}>{() => <Stack at={[1, 1]} count={41.6} fill={useProp('fill', 0)} per={10000} unit="parcels" title="sorted per hour" footprint={[3, 3]} {...useView(NEAR)} />}</Part>
    <Part id="rate" z={1}>{() => <Sign at={[7, -2]} width={4} title="every second" figure="≈ 115" role="store" show={useProp('show', 0)} {...useView(NEAR)} />}</Part>
    <Animation>
      <Appear target="floor-c" at="start" dur={0} />
      <Appear target="key" line="c1" word="Worldport" dur={0} />
      <Tween target="key" to={{show: 1}} line="c1" word="Worldport" dur={0.7} easing="easeOutQuart" />
      <Appear target="stack" line="c1" word="four hundred" dur={0} />
      <Tween target="stack" to={{fill: 1}} line="c1" word="four hundred" dur={2.8} easing="easeInQuad" />
      <Tween target={['floor-c', 'key', 'stack', 'rate']} to={{k: 52, ox: 900, oy: 330}} at="start" until="end" easing="easeInOutSine" />
      <Appear target="rate" line="c2" word="one hundred" dur={0} />
      <Tween target="rate" to={{show: 1}} line="c2" word="one hundred" dur={0.7} easing="easeOutQuart" />
    </Animation>
  </Scene>

  <Scene id="growth" title="Before and after">
    <Line id="g1" text="Before its last expansion, the same hour held about 304,000.">Before its last expansion, the same hour held about three hundred and four thousand.</Line>
    <Line id="g2" text="The new halls added more than 100,000 an hour.">The new halls added more than a hundred thousand an hour.</Line>
    <Part id="floor-g">{() => <Floor {...useView(PAIR)} />}</Part>
    <Part id="pair" z={1}>{() => <Stacks at={[1, 0]} items={[{label: 'before expansion', value: 304000}, {label: 'after expansion', value: 416000}]}
      per={10000} unit="an hour" grow={useProp('grow', 0)} focus={useProp('focus', -1)} footprint={[3, 3]} spacing={7} {...useView(PAIR)} />}</Part>
    <Animation>
      <Appear target="floor-g" at="start" dur={0} />
      <Appear target="pair" line="g1" word="three hundred" dur={0} />
      <Tween target="pair" to={{grow: 1}} line="g1" word="three hundred" dur={1.8} easing="easeInQuad" />
      <Tween target="pair" to={{grow: 2}} line="g2" word="new halls" dur={2.2} easing="easeInQuad" />
      <Set target="pair" to={{focus: 1}} line="g2" word="new halls" />
      <Tween target={['floor-g', 'pair']} to={{k: 52, ox: 448, oy: 380}} line="g2" word="new halls" dur={2.4} easing="easeInOutSine" />
    </Animation>
  </Scene>

  <Scene id="close" title="Morning">
    <Line id="e1" hold={1.4}>By sunrise every truck has gone, and the hub sinks back into quiet until the next night.</Line>
    <Part id="floor-e">{() => <Floor {...useView(HUB)} />}</Part>
    <Part id="belt-in-e" z={1}>{() => <Belt path={IN} draw={useProp('draw', 1)} travel={useProp('travel', 8)} from="intake" {...useView(HUB)} />}</Part>
    <Part id="belt-out-e" z={1}>{() => <Belt path={OUT} draw={useProp('draw', 1)} travel={useProp('travel', 8)} from="process" {...useView(HUB)} />}</Part>
    <Part id="docks-e" z={2}>{() => <Building at={[0, 2]} size={[3.5, 3, 2.2]} role="intake" name="Docks" rise={useProp('rise', 1)} {...useView(HUB)} />}</Part>
    <Part id="sorter-e" z={2}>{() => <Building at={[6, 1.5]} size={[4.5, 4, 2.8]} role="process" name="Sorting" rise={useProp('rise', 1)} {...useView(HUB)} />}</Part>
    <Part id="outbound-e" z={2}>{() => <Building at={[12.6, 2]} size={[3.5, 3, 2.2]} role="output" name="Outbound" rise={useProp('rise', 1)} ping={useProp('ping', 0)} {...useView(HUB)} />}</Part>
    <Animation>
      <Appear target={['floor-e', 'belt-in-e', 'belt-out-e', 'docks-e', 'sorter-e', 'outbound-e']} at="start" dur={0} />
      <Tween target={['belt-in-e', 'belt-out-e']} to={{travel: 20}} at="start" easing="easeOutSine" until={{line: 'e1', word: 'quiet'}} />
      <Tween target="outbound-e" to={{ping: 1}} line="e1" word="every truck" dur={1.2} easing="easeOutSine" />
      <Tween target={['belt-in-e', 'belt-out-e']} to={{draw: 0}} line="e1" word="sinks back" dur={0.9} easing="easeInOutSine" />
      <Tween target={['outbound-e', 'sorter-e', 'docks-e']} to={{rise: 0}} line="e1" word="sinks back" offset={0.2} stagger={0.25} dur={1.2} easing="linear" />
      <Tween target={['floor-e', 'belt-in-e', 'belt-out-e', 'docks-e', 'sorter-e', 'outbound-e']} to={{k: 50, ox: 820, oy: 260}} at="start" until="end" easing="easeInOutSine" />
    </Animation>
  </Scene>
</Doc>;
