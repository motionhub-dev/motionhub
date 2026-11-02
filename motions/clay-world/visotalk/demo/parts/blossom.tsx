// The sample's apple blossom: five petals round a yellow heart, built from the motion's clay forms. `fall` drops the petals one after
// another: each flutters down to the floor and lands with a squash (the form's own landing, driven by `drop`).
import {Lump} from '../../parts/lump.tsx';
import {mix, unit} from '../../parts/world.tsx';

export function Blossom({x, y, z, size = 6, form = 1, fall = 0, heart = true}: {x: number; y: number; z: number; size?: number; form?: number; fall?: number; heart?: boolean}) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 + 0.3;
        const p = unit(fall * 1.8 - i * 0.2);
        const k = unit(p / 0.42);                  // the part of its landing spent falling
        const e = k * k * (3 - 2 * k);
        const sway = Math.sin(k * Math.PI * 2.5 + i) * 1.6 * Math.sin(Math.PI * k);
        return (
          <Lump key={i} shape="petal" color="grad" seed={`petal${i}`} size={size * 0.55}
            x={mix(x + Math.cos(a) * size * 0.3, x + Math.cos(a) * size * 0.9 + (i - 2) * 1.2, e) + sway}
            z={mix(z + Math.sin(a) * size * 0.3, z - 3 + Math.sin(a) * size * 0.6, e)}
            y={0} height={y - 0.15} drop={p}
            rx={mix(-14, 0, e)} ry={90 - (a * 180) / Math.PI + 70 * i * e}
            form={unit(form * 1.6 - i * 0.12)} shadow={e} />
        );
      })}
      {heart && <Lump shape="ball" color="warn" seed="heart" x={x} y={y - 0.25} z={z} size={size * 0.2} form={unit(form * 1.3 - 0.3)} grow={1 - unit(fall * 2.5 - 0.3)} shadow={0} />}
    </>
  );
}
