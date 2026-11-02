// The sample's ending: a sprout that grows into a small apple tree in a few seconds, built from the motion's coils and forms. `grow` rolls
// the trunk up, `branch` rolls the boughs out one after another, `bloom` squeezes blossoms and leaves on along them, and `fruit` hangs one apple.
import {Coil} from '../../parts/coil.tsx';
import {Lump} from '../../parts/lump.tsx';
import {unit} from '../../parts/world.tsx';

const TRUNK = [[0, 5.0, 0.4], [0.4, 8, 0.6], [-0.3, 11, 0.3], [0.2, 14.5, 0]];
const BOUGHS = [
  [[0.1, 10.2, 0.4], [-2.5, 12.2, 0.9], [-5, 13.4, 1.4]],
  [[0, 12.0, 0.2], [2.6, 13.8, 0.6], [5.2, 14.6, 0.4]],
  [[0.1, 13.6, 0], [-1.6, 15.8, -0.6], [-3.2, 17.0, -0.4]],
  [[0.2, 14.4, 0], [1.5, 16.4, 0.2], [2.6, 17.6, 0.6]],
];
// where the blossoms and leaves sit along the boughs
const BUDS = [[-5, 13.6, 1.5], [-3.3, 12.6, 1.1], [5.2, 14.8, 0.5], [3.4, 14.2, 0.7], [-3.2, 17.2, -0.4], [-2.0, 16.1, -0.5], [2.6, 17.8, 0.6], [0.3, 15.0, 0.1]];
const LEAVES = [[-4.2, 13.6, 2.2, 30], [4.4, 15.2, 1.4, -40], [-2.5, 16.8, 0.4, 70], [1.9, 17.4, 1.4, -70], [-1.2, 11.8, 1.6, 120], [1.6, 13.3, 1.5, -120]];

export function Sapling({grow = 0, branch = 0, bloom = 0, fruit = 0}: {grow?: number; branch?: number; bloom?: number; fruit?: number}) {
  return (
    <>
      <Coil path={TRUNK} radius={0.55} taper={0.45} color="muted" seed="trunk" draw={grow} />
      {BOUGHS.map((p, i) => <Coil key={i} path={p} radius={0.3} taper={0.6} color="muted" seed={`bough${i}`} draw={unit(branch * 1.6 - i * 0.2)} />)}
      {LEAVES.map(([x, y, z, ry], i) => <Lump key={`l${i}`} shape="leaf" color="good" seed={`sap-leaf${i}`} x={x} y={y} z={z} size={2.4} rx={-35} ry={ry} shadow={0}
        form={unit(bloom * 1.8 - i * 0.12)} />)}
      {BUDS.map(([x, y, z], i) => <Lump key={`b${i}`} shape="ball" color="grad" seed={`bud${i}`} x={x} y={y} z={z} size={1.3} shadow={0}
        form={unit(bloom * 1.8 - 0.3 - i * 0.1)} />)}
      <Coil path={[[3.4, 14.4, 0.7], [3.6, 13.6, 1.0]]} radius={0.12} color="muted" seed="apple-stem" draw={unit(fruit * 4)} />
      <Lump shape="fruit" color="data" seed="new-apple" x={3.6} y={11.2} z={1.0} size={2.6} shadow={0} form={fruit} />
    </>
  );
}
