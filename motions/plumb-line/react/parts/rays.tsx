import {C, CANVAS, yOf, type Cam} from './plumb.ts';

export const meta = {
  name: {en: 'Falling light', 'zh-CN': '透入的光'},
  purpose: 'mark',
  line: "Pale shafts from the top of the subject that thin out and end at the depth the light really reaches.",
  fits: "sunlight in water, heat from above, anything from the surface that gives out on the way down",
  params: {
    cam: {type: '{at, scale}', doc: "the scene's camera"},
    from: {type: 'number', default: 0, doc: 'where it enters'},
    to: {type: 'number', doc: 'where it has given out'},
    clock: {type: 'number', default: 0, doc: 'seconds: tween it linearly so the shafts sway'},
    color: {type: 'string', doc: 'the light'},
  },
  preview: 6,
};

export function Rays({cam, from = 0, to, clock = 0, color = C.sun}: {cam: Cam; from?: number; to: number; clock?: number; color?: string}) {
  const a = yOf(cam, from), b = yOf(cam, to);
  if (a > 1000 || b < 0) return null;
  return (
    <svg {...CANVAS}>
      <defs><linearGradient id="rays-fall" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={a} y2={b}><stop offset="0" stopColor={color} stopOpacity={0.5} /><stop offset="1" stopColor={color} stopOpacity={0} /></linearGradient></defs>
      {[[760, 900, 170], [1000, 1170, 220], [1260, 1360, 150], [420, 520, 130]].map(([x0, x1, lean], i) => {
        const sway = Math.sin(clock * 0.35 + i * 1.7) * 26;
        return <path key={i} d={`M${x0} ${a}L${x1} ${a}L${x1 + lean + sway} ${b}L${x0 + lean * 0.7 + sway} ${b}Z`} fill="url(#rays-fall)" />;
      })}
    </svg>
  );
}
