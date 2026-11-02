import {useDocTime} from '@visotalk/runtime';
import {Glow, unit, useLook} from './stage.tsx';

export const meta = {
  name: {en: 'Distant light', 'zh-CN': '远处的光'},
  purpose: 'mark',
  line: 'A warm point of light kindling far off in the dusk, its halo carried by the haze.',
  fits: 'a crater waking, a first lamp, a signal fire, a star',
  params: {
    x: {type: 'px', default: 960, doc: 'where the light is, across, at rest'},
    y: {type: 'px', default: 500, doc: 'where the light is, down, at rest'},
    on: {type: 'progress', default: 1, doc: '0 dark, 1 alight'},
    size: {type: 'px', default: 1, doc: 'how large its halo is; 1 is a lamp, 4 a fire that lights the sky'},
    flicker: {type: 'progress', default: 0.4, doc: 'how much it trembles: 0 a star, 1 a fire'},
  },
  preview: 12.4,
};

export function Beacon({x = 960, y = 500, on = 1, size = 1, flicker = 0.4}: {x?: number; y?: number; on?: number; size?: number; flicker?: number}) {
  const t = useDocTime();
  const {fog} = useLook();
  const o = unit(on);
  // a light kindles: the core first, its halo after it, with a small overshoot as it catches
  const core = unit(o * 1.6), halo = unit(o * 1.25 - 0.25) * (1 + 0.25 * Math.sin(Math.min(1, o) * Math.PI));
  const tremble = 1 + unit(flicker) * 0.12 * (Math.sin(t * 7.3) + 0.6 * Math.sin(t * 13.1 + 1.3) + 0.4 * Math.sin(t * 3.1));
  const r = 7 * Math.sqrt(size);
  return (
    <>
      <Glow x={x} y={y} r={260 * size * tremble} color="var(--vt-data)" alpha={halo * 0.55 * (1 - 0.3 * fog)} />
      <Glow x={x} y={y} r={60 * Math.sqrt(size) * tremble} color="color-mix(in oklab, var(--vt-data), var(--vt-text) 40%)" alpha={halo * 0.9} />
      <div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', opacity: core,
        background: 'radial-gradient(circle, var(--vt-text) 0%, color-mix(in oklab, var(--vt-text), var(--vt-data) 45%) 55%, color-mix(in srgb, var(--vt-data) 0%, transparent) 100%)'}} />
    </>
  );
}
