// Clay World's sample: one example among many. Do not reuse its story, scenes, layout or timings; read it for technique, after your own scenes are planned.
import {Doc, Scene, Line, Part, Animation, Appear, Tween} from '@visotalk/jsx';
import {Obj, useProp} from '@visotalk/runtime';
import {ClayWorld} from '../parts/world.tsx';
import {Lump} from '../parts/lump.tsx';
import {Coil} from '../parts/coil.tsx';
import {Slice} from '../parts/slice.tsx';
import {Critter} from '../parts/critter.tsx';
import {Tag} from '../parts/tag.tsx';
import {Title} from '../parts/title.tsx';
import {Figure} from '../parts/figure.tsx';
import {Crumbs} from '../parts/crumbs.tsx';
import {Blossom} from './parts/blossom.tsx';
import {Sapling} from './parts/sapling.tsx';

// the branch the whole first half hangs on, and the twig the blossom and the apple grow from
const BRANCH = [[-34, 15, -6], [-22, 14, -3], [-10, 15.5, -1], [2, 17, 0], [12, 19.5, 1]];
const TWIG = [[1, 16.9, 0], [3, 15.4, -2.4], [4, 13.6, -5]];
const BLOSSOM = {x: 4, y: 13.6, z: -5};
// inside the apple: the skin, the flesh, and five chambers round the core, a seed in each
const FLESH = [{at: 0.955, color: '#F5DFA8'}, {at: 0.62, color: '#F8E8BE'}];

export default <Doc
  id="clay-world-sample"
  title="The star inside an apple"
  lang="en"
  canvas="16x9"
  theme="visotalk/light"
  tokens={{
    colors: {bg: '#CFE4DF', panel: '#EAD7BC', panel2: '#FFF6EA', border: '#D8BFA2', text: '#3A2A2C', muted: '#7C5E50', faint: '#CDB9A2', data: '#E0533D', grad: '#F4ADB0', op: '#6EA2D4', good: '#7BB257', bad: '#A85478', warn: '#F0BF4C'},
    fonts: {sans: '"Fredoka", "Noto Sans SC", sans-serif', mono: '"JetBrains Mono", monospace', display: '"Fredoka", "LXGW WenKai", sans-serif'},
    caption: {font: 'sans', size: 38, weight: 500, color: '#3A2A2C', background: '#FFF6EA', radius: 26, padding: [10, 28], bottom: 52, shadow: '0 5px 0 #D8BFA2, 0 14px 26px rgba(70, 40, 30, 0.2)'},
  }}
  pacing={{lead: 0.4, hold: 0.5, tail: 1}}
  exports={{captions: 'burned'}}
>
  <Scene id="spring" title="Spring">
    <Line id="l1">Every apple begins as a blossom on a spring branch.</Line>
    <Line id="l2">A bee lands on it, carrying pollen from another apple tree.</Line>

    <Part id="spring-set">{() => (
      <ClayWorld yaw={useProp('yaw', -14)} pitch={useProp('pitch', 10)} dist={useProp('dist', 46)} tx={useProp('tx', 0)} ty={useProp('ty', 17)} tz={useProp('tz', 0)}>
        <Coil path={BRANCH} radius={1.1} taper={0.7} color="muted" seed="branch" draw={useProp('branchDraw', 0)} />
        <Coil path={TWIG} radius={0.42} taper={0.4} color="muted" seed="twig" draw={useProp('twigDraw', 0)} />
        <Lump shape="leaf" color="good" seed="leaf1" x={-8} y={15} z={1.5} size={5} rx={-30} ry={40} rz={20} shadow={0} form={useProp('leavesForm', 0)} />
        <Lump shape="leaf" color="good" seed="leaf2" x={-16} y={13.6} z={-0.5} size={4.4} rx={-24} ry={-150} rz={-10} shadow={0} form={useProp('leavesForm', 0)} />
        <Blossom {...BLOSSOM} size={6.5} form={useProp('blossomForm', 0)} />
        <Critter x={BLOSSOM.x + 0.9} y={BLOSSOM.y + 0.7} z={BLOSSOM.z + 1.6} size={2.4} color="warn" bands={3} wings antennae from={[-26, 19, 10]} turn={-20} look={0.6}
          loops={1} shadow={0} arrive={useProp('beeArrive', 0)} />
        <Lump shape="ball" color="warn" seed="pollen1" x={BLOSSOM.x + 0.4} y={BLOSSOM.y + 0.6} z={BLOSSOM.z + 2.7} size={0.7} shadow={0} form={useProp('pollenForm', 0)} />
        <Lump shape="ball" color="warn" seed="pollen2" x={BLOSSOM.x + 1.5} y={BLOSSOM.y + 0.6} z={BLOSSOM.z + 2.6} size={0.6} shadow={0} form={useProp('pollenForm', 0)} />
        <Obj id="pollen-tag"><Tag x={BLOSSOM.x + 1.6} y={BLOSSOM.y + 0.9} z={BLOSSOM.z + 2.8} dx={220} dy={120} text="pollen" note="from another tree" dot="text" show={useProp('pollen-tag', 'show', 0)} /></Obj>
        <Obj id="title"><Title y={120} kicker="A small story in clay" title="Where apples come from" size={112} show={useProp('title', 'show', 0)} /></Obj>
      </ClayWorld>
    )}</Part>
    <Animation>
      <Appear target="spring-set" at="start" dur={0} />
      <Tween target="title" to={{show: 1}} line="l1" word="Every apple" dur={1.4} easing="linear" />
      <Tween target="spring-set" to={{branchDraw: 1}} at="start" dur={2.2} easing="easeOutSine" />
      <Tween target="spring-set" to={{yaw: -4}} at="start" until={{line: 'l1', edge: 'end'}} easing="easeInOutSine" />
      <Tween target="spring-set" to={{twigDraw: 1}} line="l1" word="blossom" offset={-0.5} dur={0.5} easing="easeOutSine" />
      <Tween target="spring-set" to={{leavesForm: 1}} line="l1" word="spring" dur={1} easing="linear" />
      <Tween target="spring-set" to={{blossomForm: 1}} line="l1" word="blossom" dur={1.3} easing="linear" />
      <Tween target="title" to={{show: 0}} line="l2" offset={-0.3} dur={0.6} easing="easeInSine" />
      <Tween target="spring-set" to={{dist: 30, tx: 6, ty: 15.5, tz: -4, yaw: 12, pitch: 6}} line="l2" until={{line: 'l2', edge: 'end'}} easing="easeInOutSine" />
      <Tween target="spring-set" to={{beeArrive: 1}} line="l2" word="bee" offset={-0.3} dur={2.3} easing="linear" />
      <Tween target="spring-set" to={{pollenForm: 1}} line="l2" word="pollen" dur={0.8} easing="linear" />
      <Tween target="pollen-tag" to={{show: 1}} line="l2" word="pollen" dur={0.8} easing="easeOutSine" />
    </Animation>
  </Scene>

  <Scene id="summer" title="Summer">
    <Line id="l3">The petals fall, and the base of the flower swells into a little fruit.</Line>
    <Line id="l4" text="All summer it grows, for about 5 months, until it is red, heavy, and falls.">All summer it grows, for about five months, until it is red, heavy, and falls.</Line>

    <Part id="summer-set">{() => (
      <ClayWorld yaw={useProp('yaw', 8)} pitch={useProp('pitch', 26)} dist={useProp('dist', 38)} tx={useProp('tx', 3)} ty={useProp('ty', 8)} tz={0}
        sun={useProp('sun', 0)} shake={useProp('shake', 0)}>
        <Coil path={BRANCH} radius={1.1} taper={0.7} color="muted" seed="branch" />
        <Coil path={TWIG} radius={0.42} taper={0.4} color="muted" seed="twig" />
        <Lump shape="leaf" color="good" seed="leaf1" x={-8} y={15} z={1.5} size={5} rx={-30} ry={40} rz={20} shadow={0} />
        <Blossom {...BLOSSOM} size={6.5} heart={false} fall={useProp('petalsFall', 0)} />
        {/* the flower's yellow heart is kneaded into a little green fruit, which grows, reddens and falls */}
        <Lump shape="ball" into="fruit" seed="apple" x={BLOSSOM.x} y={0} z={BLOSSOM.z} height={BLOSSOM.y - 0.05 - 4.68 * useProp('appleGrow', 0.25)} size={5.2}
          color="warn" to="good,data" grow={useProp('appleGrow', 0.25)} tint={useProp('appleTint', 0)} knead={useProp('appleKnead', 0)} drop={useProp('appleDrop', 0)} />
        <Crumbs x={BLOSSOM.x} z={BLOSSOM.z} count={16} reach={8} size={1.1} color="faint,grad,panel" seed="thud" burst={useProp('thud', 0)} />
        <Obj id="months"><Figure x={170} y={470} value={useProp('months', 'value', 0)} unit="months" label="from blossom to ripe apple" size={190} color="data" show={useProp('months', 'show', 0)} /></Obj>
      </ClayWorld>
    )}</Part>
    <Animation>
      <Appear target="summer-set" at="start" dur={0} />
      <Tween target="summer-set" to={{petalsFall: 1}} line="l3" word="petals fall" dur={2.4} easing="linear" />
      <Tween target="summer-set" to={{appleKnead: 1, appleTint: 1, appleGrow: 0.36}} line="l3" word="swells" dur={1.6} easing="linear" />
      <Tween target="summer-set" to={{dist: 44, ty: 7, tx: 0, yaw: 0, pitch: 26}} line="l4" word="grows" until={{line: 'l4', edge: 'end'}} easing="easeInOutSine" />
      <Tween target="summer-set" to={{sun: 1080}} line="l4" word="All summer" dur={3.4} easing="easeInOutSine" />
      <Tween target="summer-set" to={{appleGrow: 1}} line="l4" word="grows" dur={3} easing="easeInOutSine" />
      <Tween target="months" to={{show: 1}} line="l4" word="five months" dur={0.8} easing="linear" />
      <Tween target="months" to={{value: 5}} line="l4" word="five months" dur={1.2} easing="easeOutQuad" />
      <Tween target="summer-set" to={{appleTint: 2}} line="l4" word="red" dur={1} easing="easeInOutSine" />
      <Tween target="summer-set" to={{appleDrop: 1}} line="l4" word="falls" dur={1.2} easing="linear" />
      <Tween id="jolt" target="summer-set" to={{shake: 1}} line="l4" word="falls" offset={0.47} dur={0.05} easing="linear" />
      <Tween target="summer-set" to={{shake: 0}} after="jolt" dur={0.6} easing="easeOutQuad" />
      <Tween target="summer-set" to={{thud: 1}} line="l4" word="falls" offset={0.48} dur={1.1} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="inside" title="Inside">
    <Line id="l5">Now cut it across the middle, not from stem to tip.</Line>
    <Line id="l6" text="Inside, the seeds sit in a star: 5 little chambers.">Inside, the seeds sit in a star: five little chambers.</Line>

    <Part id="inside-set">{() => (
      <ClayWorld yaw={useProp('yaw', -12)} pitch={useProp('pitch', 22)} dist={useProp('dist', 44)} tx={useProp('tx', -3)} ty={useProp('ty', 3)} tz={0}>
        <Slice x={-4} z={0} size={11} color="data" rings={FLESH} chambers={5} chamber="#DDBB6A" seeds="#4A2A20" seed="apple"
          cut={useProp('appleCut', 0)} open={useProp('appleOpen', 0)} pop={useProp('seedsPop', 0)} />
        <Coil path={[[-4, 9.6, 0], [-3.7, 11, 0.2], [-3.1, 12.1, 0.4]]} radius={0.28} color="muted" seed="stem" draw={useProp('stemDraw', 1)} />
        <Obj id="star-tag"><Tag x={7.9} y={5} z={0} dx={170} dy={-230} text="a star" note="five chambers" show={useProp('star-tag', 'show', 0)} /></Obj>
        <Obj id="seed-tag"><Tag x={-2.9} y={5.1} z={1.5} dx={-240} dy={120} text="seeds" show={useProp('seed-tag', 'show', 0)} /></Obj>
      </ClayWorld>
    )}</Part>
    <Animation>
      <Appear target="inside-set" at="start" dur={0} />
      <Tween target="inside-set" to={{dist: 36, yaw: -4, tx: -4}} at="start" until={{line: 'l5', edge: 'end'}} easing="easeInOutSine" />
      <Tween target="inside-set" to={{appleCut: 1}} line="l5" word="across the middle" offset={-0.2} dur={1.5} easing="linear" />
      <Tween target="inside-set" to={{stemDraw: 0}} line="l6" word="Inside" offset={-0.1} dur={0.1} easing="linear" />
      <Tween target="inside-set" to={{appleOpen: 1}} line="l6" word="Inside" dur={2.1} easing="linear" />
      <Tween target="inside-set" to={{pitch: 70, dist: 42, tx: 2, ty: 0, yaw: 0}} line="l6" word="Inside" offset={0.3} until={{line: 'l6', edge: 'end'}} easing="easeInOutSine" />
      <Tween target="star-tag" to={{show: 1}} line="l6" word="star" dur={0.8} easing="easeOutSine" />
      <Tween target="inside-set" to={{seedsPop: 1}} line="l6" word="seeds" dur={1.4} easing="linear" />
      <Tween target="seed-tag" to={{show: 1}} line="l6" word="seeds" offset={0.3} dur={0.8} easing="easeOutSine" />
    </Animation>
  </Scene>

  <Scene id="again" title="Again">
    <Line id="l7" hold={3.2}>Plant one seed, and the whole story begins again.</Line>

    <Part id="again-set">{() => (
      <ClayWorld yaw={useProp('yaw', 12)} pitch={useProp('pitch', 22)} dist={useProp('dist', 34)} tx={0} ty={useProp('ty', 4)} tz={0} island={10}>
        <Lump shape="pebble" color="muted" seed="soil" x={0} z={0} size={9} />
        <Lump shape="drop" color="#5B3A2E" seed="seed" x={0} y={5.1} z={0.9} size={1.6} rx={180} height={11} drop={useProp('seedDrop', 0)} shadow={0} />
        <Sapling grow={useProp('trunk', 0)} branch={useProp('boughs', 0)} bloom={useProp('bloom', 0)} fruit={useProp('fruit', 0)} />
        <Obj id="end-title"><Title y={64} title="Every apple hides a star" size={84} color="data" show={useProp('end-title', 'show', 0)} /></Obj>
      </ClayWorld>
    )}</Part>
    <Animation>
      <Appear target="again-set" at="start" dur={0} />
      <Tween target="again-set" to={{seedDrop: 1}} line="l7" word="Plant" dur={1.1} easing="linear" />
      <Tween target="again-set" to={{trunk: 1}} line="l7" word="whole story" offset={-0.3} dur={1.5} easing="easeOutSine" />
      <Tween target="again-set" to={{boughs: 1}} line="l7" word="begins" dur={1.5} easing="easeOutSine" />
      <Tween target="again-set" to={{bloom: 1}} line="l7" word="again" dur={1.8} easing="linear" />
      <Tween target="again-set" to={{fruit: 1}} line="l7" word="again" offset={1.6} dur={1} easing="linear" />
      <Tween target="again-set" to={{ty: 8.5, dist: 74, yaw: -40, pitch: 15}} line="l7" word="whole story" until="end" easing="easeInOutSine" />
      <Tween target="end-title" to={{show: 1}} line="l7" word="again" offset={0.8} dur={1.6} easing="linear" />
    </Animation>
  </Scene>
</Doc>;
