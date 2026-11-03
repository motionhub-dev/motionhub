// Clay World's reel: twenty seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
import {Easing, Sequence, interpolate, useTime} from '@motionhub/runtime';
import {ClayWorld, mix, unit} from './parts/world.tsx';
import {Lump} from './parts/lump.tsx';
import {Coil} from './parts/coil.tsx';
import {Slice} from './parts/slice.tsx';
import {Critter} from './parts/critter.tsx';
import {Tag} from './parts/tag.tsx';
import {Title} from './parts/title.tsx';
import {Figure} from './parts/figure.tsx';
import {Crumbs} from './parts/crumbs.tsx';

export const reel = {seconds: 20, width: 1920, height: 1080};
/** What happens when, for the motion's sound (sound.json): a branch rolls out, a blossom and a critter land, a clay figure counts up, the apple hits the ground, the cut opens, a tree grows */
export const cues = [
  {at: 0, role: 'draw', dur: 1.4}, {at: 1.9, role: 'land'}, {at: 2.4, role: 'move', dur: 1.8}, {at: 4.2, role: 'land'}, {at: 4.5, role: 'count'},
  {at: 6.4, role: 'move', dur: 2.4}, {at: 6.6, role: 'land'}, {at: 7.9, role: 'count'}, {at: 9.5, role: 'land'}, {at: 10.8, role: 'draw', dur: 1.2},
  {at: 12, role: 'cut'}, {at: 12.1, role: 'move', dur: 1.7}, {at: 13.6, role: 'land'}, {at: 14.2, role: 'count'}, {at: 16.2, role: 'draw', dur: 1},
  {at: 16.2, role: 'land'}, {at: 16.8, role: 'draw', dur: 1}, {at: 18, role: 'land'}, {at: 18.8, role: 'land'},
];

type Ease = (v: number) => number;
type P3 = [number, number, number];
const sine = Easing.inOutSine, linear = Easing.linear, outSine = Easing.bezier(0.61, 1, 0.88, 1), outQuad = Easing.bezier(0.5, 1, 0.89, 1);
/** Through the values at the times, eased between each pair */
const keys = (t: number, times: number[], values: number[], easing: Ease = sine) => interpolate(t, times, values, {easing, clamp: true});
const once = (t: number, a: number, b: number, easing: Ease = linear) => keys(t, [a, b], [0, 1], easing);

// the branch the spring hangs on, and the twig the blossom and the apple grow from
const BRANCH: P3[] = [[-34, 15, -6], [-22, 14, -3], [-10, 15.5, -1], [2, 17, 0], [12, 19.5, 1]];
const TWIG: P3[] = [[1, 16.9, 0], [3, 15.4, -2.4], [4, 13.6, -5]];
const BLOSSOM = {x: 4, y: 13.6, z: -5};
const FLESH = [{at: 0.955, color: '#F5DFA8'}, {at: 0.62, color: '#F8E8BE'}];

/** An apple blossom built from clay forms: five petals round a yellow heart; `fall` drops the petals one after another */
function Blossom({x, y, z, size = 6.5, form = 1, fall = 0, heart = true}: {x: number; y: number; z: number; size?: number; form?: number; fall?: number; heart?: boolean}) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 + 0.3, p = unit(fall * 1.8 - i * 0.2), k = unit(p / 0.42), e = k * k * (3 - 2 * k);
        const sway = Math.sin(k * Math.PI * 2.5 + i) * 1.6 * Math.sin(Math.PI * k);
        return (
          <Lump key={i} shape="petal" color="grad" seed={`petal${i}`} size={size * 0.55}
            x={mix(x + Math.cos(a) * size * 0.3, x + Math.cos(a) * size * 0.9 + (i - 2) * 1.2, e) + sway}
            z={mix(z + Math.sin(a) * size * 0.3, z - 3 + Math.sin(a) * size * 0.6, e)}
            y={0} height={y - 0.15} drop={p} rx={mix(-14, 0, e)} ry={90 - (a * 180) / Math.PI + 70 * i * e}
            form={unit(form * 1.6 - i * 0.12)} shadow={e} />
        );
      })}
      {heart && <Lump shape="ball" color="warn" seed="heart" x={x} y={y - 0.25} z={z} size={size * 0.2} form={unit(form * 1.3 - 0.3)} shadow={0} />}
    </>
  );
}

function Spring() {
  const t = useTime(), cam = (a: number, b: number) => keys(t, [2.6, 4.8], [a, b]);
  const form = once(t, 1.3, 2.4), pollen = once(t, 3.9, 4.5);
  return (
    <ClayWorld yaw={keys(t, [0, 2.6, 4.8], [-14, -4, 12])} pitch={cam(10, 6)} dist={cam(46, 30)} tx={cam(0, 6)} ty={cam(17, 15.5)} tz={cam(0, -4)}>
      <Coil path={BRANCH} radius={1.1} taper={0.7} color="muted" seed="branch" draw={once(t, 0, 1.4, outSine)} />
      <Coil path={TWIG} radius={0.42} taper={0.4} color="muted" seed="twig" draw={once(t, 0.9, 1.3, outSine)} />
      <Lump shape="leaf" color="good" seed="leaf1" x={-8} y={15} z={1.5} size={5} rx={-30} ry={40} rz={20} shadow={0} form={once(t, 1.0, 1.8)} />
      <Lump shape="leaf" color="good" seed="leaf2" x={-16} y={13.6} z={-0.5} size={4.4} rx={-24} ry={-150} rz={-10} shadow={0} form={once(t, 1.1, 1.9)} />
      <Blossom {...BLOSSOM} form={form} />
      <Critter x={BLOSSOM.x + 0.9} y={BLOSSOM.y + 0.7} z={BLOSSOM.z + 1.6} size={2.4} color="warn" bands={3} wings antennae from={[-26, 19, 10]} turn={-20} look={0.6}
        loops={1} shadow={0} arrive={once(t, 2.4, 4.2)} />
      <Lump shape="ball" color="warn" seed="pollen1" x={BLOSSOM.x + 0.4} y={BLOSSOM.y + 0.6} z={BLOSSOM.z + 2.7} size={0.7} shadow={0} form={pollen} />
      <Lump shape="ball" color="warn" seed="pollen2" x={BLOSSOM.x + 1.5} y={BLOSSOM.y + 0.6} z={BLOSSOM.z + 2.6} size={0.6} shadow={0} form={pollen} />
      <Tag x={BLOSSOM.x + 1.6} y={BLOSSOM.y + 0.9} z={BLOSSOM.z + 2.8} dx={220} dy={120} text="pollen" note="from another tree" dot="text" show={once(t, 4.0, 4.6, outSine)} />
      <Title y={120} kicker="A small story in clay" title="Where apples come from" size={112} show={keys(t, [0.05, 1.3, 2.4, 2.9], [0, 1, 1, 0], linear)} />
    </ClayWorld>
  );
}

function Summer() {
  const t = useTime(), cam = (a: number, b: number) => keys(t, [1.4, 5.0], [a, b]);
  const grow = keys(t, [0.3, 1.4, 3.6], [0.25, 0.36, 1], linear), drop = once(t, 3.9, 4.9);
  return (
    <ClayWorld yaw={cam(8, 0)} pitch={26} dist={cam(38, 44)} tx={cam(3, 0)} ty={cam(8, 7)} tz={0}
      sun={keys(t, [1.2, 3.6], [0, 720])} shake={keys(t, [4.28, 4.33, 4.9], [0, 1, 0], outQuad)}>
      <Coil path={BRANCH} radius={1.1} taper={0.7} color="muted" seed="branch" />
      <Coil path={TWIG} radius={0.42} taper={0.4} color="muted" seed="twig" />
      <Lump shape="leaf" color="good" seed="leaf1" x={-8} y={15} z={1.5} size={5} rx={-30} ry={40} rz={20} shadow={0} />
      <Blossom {...BLOSSOM} heart={false} fall={once(t, 0, 1.6)} />
      {/* the flower's yellow heart is kneaded into a little green fruit, which grows, reddens and falls */}
      <Lump shape="ball" into="fruit" seed="apple" x={BLOSSOM.x} y={0} z={BLOSSOM.z} height={BLOSSOM.y - 0.05 - 4.68 * grow} size={5.2}
        color="warn" to="good,data" grow={grow} tint={keys(t, [0.3, 1.4, 3.3, 4.0], [0, 1, 1, 2], linear)} knead={once(t, 0.3, 1.4)} drop={drop} />
      <Crumbs x={BLOSSOM.x} z={BLOSSOM.z} count={16} reach={8} size={1.1} color="faint,grad,panel" seed="thud" burst={once(t, 4.29, 5.3)} />
      <Figure x={170} y={470} value={keys(t, [1.6, 2.7], [0, 5], outQuad)} unit="months" label="from blossom to ripe apple" size={190} color="data" show={once(t, 1.6, 2.3)} />
    </ClayWorld>
  );
}

function Inside() {
  const t = useTime(), crane = (a: number, b: number) => keys(t, [1.7, 4.0], [a, b]);
  return (
    <ClayWorld yaw={keys(t, [0, 1.6, 4.0], [-12, -4, 0])} pitch={crane(22, 70)} dist={keys(t, [0, 1.6, 4.0], [44, 36, 42])} tx={keys(t, [0, 1.6, 4.0], [-3, -4, 2])} ty={crane(3, 0)} tz={0}>
      <Slice x={-4} z={0} size={11} color="data" rings={FLESH} chambers={5} chamber="#DDBB6A" seeds="#4A2A20" seed="apple"
        cut={once(t, 0.2, 1.4)} open={once(t, 1.5, 3.2)} pop={once(t, 3.0, 4.1)} />
      <Coil path={[[-4, 9.6, 0], [-3.7, 11, 0.2], [-3.1, 12.1, 0.4]]} radius={0.28} color="muted" seed="stem" draw={t < 1.45 ? 1 : 0} />
      <Tag x={7.9} y={5} z={0} dx={170} dy={-230} text="a star" note="five chambers" show={once(t, 2.8, 3.4, outSine)} />
      <Tag x={-2.9} y={5.1} z={1.5} dx={-240} dy={120} text="seeds" show={once(t, 3.4, 4.0, outSine)} />
    </ClayWorld>
  );
}

// a sprout that grows into a small apple tree: the trunk rolls up, the boughs roll out, blossoms and leaves are squeezed on, one apple hangs
const TRUNK: P3[] = [[0, 5.0, 0.4], [0.4, 8, 0.6], [-0.3, 11, 0.3], [0.2, 14.5, 0]];
const BOUGHS: P3[][] = [
  [[0.1, 10.2, 0.4], [-2.5, 12.2, 0.9], [-5, 13.4, 1.4]],
  [[0, 12.0, 0.2], [2.6, 13.8, 0.6], [5.2, 14.6, 0.4]],
  [[0.1, 13.6, 0], [-1.6, 15.8, -0.6], [-3.2, 17.0, -0.4]],
  [[0.2, 14.4, 0], [1.5, 16.4, 0.2], [2.6, 17.6, 0.6]],
];
const BUDS: P3[] = [[-5, 13.6, 1.5], [-3.3, 12.6, 1.1], [5.2, 14.8, 0.5], [3.4, 14.2, 0.7], [-3.2, 17.2, -0.4], [-2.0, 16.1, -0.5], [2.6, 17.8, 0.6], [0.3, 15.0, 0.1]];
const LEAVES = [[-4.2, 13.6, 2.2, 30], [4.4, 15.2, 1.4, -40], [-2.5, 16.8, 0.4, 70], [1.9, 17.4, 1.4, -70], [-1.2, 11.8, 1.6, 120], [1.6, 13.3, 1.5, -120]];

function Again() {
  const t = useTime(), cam = (a: number, b: number) => keys(t, [0.6, 3.6], [a, b]);
  const branch = once(t, 1.2, 2.2, outSine), bloom = once(t, 1.6, 2.8), fruit = once(t, 2.6, 3.2);
  return (
    <ClayWorld yaw={cam(12, -40)} pitch={cam(22, 15)} dist={cam(34, 74)} tx={0} ty={cam(4, 8.5)} tz={0} island={10}>
      <Lump shape="pebble" color="muted" seed="soil" x={0} z={0} size={9} />
      <Lump shape="drop" color="#5B3A2E" seed="seed" x={0} y={5.1} z={0.9} size={1.6} rx={180} height={11} drop={once(t, 0, 0.8)} shadow={0} />
      <Coil path={TRUNK} radius={0.55} taper={0.45} color="muted" seed="trunk" draw={once(t, 0.6, 1.6, outSine)} />
      {BOUGHS.map((p, i) => <Coil key={i} path={p} radius={0.3} taper={0.6} color="muted" seed={`bough${i}`} draw={unit(branch * 1.6 - i * 0.2)} />)}
      {LEAVES.map(([x, y, z, ry], i) => <Lump key={`l${i}`} shape="leaf" color="good" seed={`sap-leaf${i}`} x={x} y={y} z={z} size={2.4} rx={-35} ry={ry} shadow={0}
        form={unit(bloom * 1.8 - i * 0.12)} />)}
      {BUDS.map(([x, y, z], i) => <Lump key={`b${i}`} shape="ball" color="grad" seed={`bud${i}`} x={x} y={y} z={z} size={1.3} shadow={0} form={unit(bloom * 1.8 - 0.3 - i * 0.1)} />)}
      <Coil path={[[3.4, 14.4, 0.7], [3.6, 13.6, 1.0]]} radius={0.12} color="muted" seed="apple-stem" draw={unit(fruit * 4)} />
      <Lump shape="fruit" color="data" seed="new-apple" x={3.6} y={11.2} z={1.0} size={2.6} shadow={0} form={fruit} />
      <Title y={64} title="Every apple hides a star" size={84} color="data" show={once(t, 1.8, 3.0)} />
    </ClayWorld>
  );
}

export default function Reel() {
  return (
    <>
      <Sequence from={0} duration={5.2}><Spring /></Sequence>
      <Sequence from={5.2} duration={5.4}><Summer /></Sequence>
      <Sequence from={10.6} duration={5}><Inside /></Sequence>
      <Sequence from={15.6}><Again /></Sequence>
    </>
  );
}
