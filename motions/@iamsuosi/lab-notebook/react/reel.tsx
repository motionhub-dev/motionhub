// Lab Notebook's reel: eighteen seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
import type {ReactNode} from 'react';
import {Easing, Sequence, interpolate, useTime} from '@motionhub/runtime';
import {Sheet} from './parts/sheet.tsx';
import {Ink} from './parts/ink.tsx';
import {HandLabel} from './parts/label.tsx';
import {CurveArrow} from './parts/arrow.tsx';
import {Tab} from './parts/tab.tsx';
import {Formula} from './parts/formula.tsx';
import {Frame} from './parts/frame.tsx';

export const reel = {seconds: 18, width: 1920, height: 1080};

/** What happens when, for the motion's sound (sound.json): the pen draws a line or writes, a tab is stuck on, the page turns, the result is boxed */
export const cues = [
  {at: 0.0, role: 'draw', dur: 1.1}, {at: 1.1, role: 'draw', dur: 0.7}, {at: 1.8, role: 'draw', dur: 0.6}, {at: 2.5, role: 'draw', dur: 0.7},
  {at: 3.5, role: 'draw', dur: 1.2}, {at: 5.3, role: 'draw', dur: 0.6}, {at: 6.3, role: 'land'}, {at: 8.0, role: 'cut'},
  {at: 8.9, role: 'draw', dur: 2.0}, {at: 10.9, role: 'draw', dur: 0.9}, {at: 12.1, role: 'land'}, {at: 12.5, role: 'draw', dur: 0.6},
  {at: 12.9, role: 'draw', dur: 1.6}, {at: 14.7, role: 'draw', dur: 0.8}, {at: 16.3, role: 'count'},
];

const hand = Easing.inOutSine, lin = Easing.linear;
/** A drawing's progress: the hand eases in and out of a line; writing is linear */
const at = (t: number, a: number, b: number, to = 1, from = 0, easing = hand) => interpolate(t, [a, b], [from, to], {easing});

/** A box at x, y of w × h; `on` is its opacity (a page's things are drawn in, so this is only for clearing a page or sticking a tab on) */
function Box({x, y, w, h, on = 1, children}: {x: number; y: number; w: number; h: number; on?: number; children: ReactNode}) {
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity: on}}>{children}</div>;
}

// a glass with water and a cube of ice, and one water molecule (the H–O–H angle is 104.5°)
const GLASS = 'M60 40 L110 560 L430 560 L480 40';
const WATER = 'M78 230 C 180 218, 330 242, 466 228';
const CUBE = 'M200 160 L330 150 L344 280 L212 288 Z';
const O = [330, 210], H1 = [190, 330], H2 = [470, 330];
const circle = ([x, y]: number[], r: number) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
const MOLECULE = `${circle(O, 74)} M${O[0] - 52} ${O[1] + 52} L${H1[0] + 30} ${H1[1] - 30} M${O[0] + 52} ${O[1] + 52} L${H2[0] - 30} ${H2[1] - 30} ${circle(H1, 44)} ${circle(H2, 44)}`;

// the ice lattice seen from above: hexagons whose corners are molecules
const HEX = (() => {
  const r = 92, w = Math.sqrt(3) * r, out: string[] = [], dots: number[][] = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
    const cx = 110 + col * w + (row % 2) * (w / 2), cy = 110 + row * r * 1.5;
    const pts = Array.from({length: 6}, (_, k) => [cx + r * Math.cos(Math.PI / 6 + (k * Math.PI) / 3), cy + r * Math.sin(Math.PI / 6 + (k * Math.PI) / 3)]);
    out.push(`M${pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L')} Z`);
    dots.push(...pts);
  }
  return {d: out.join(' '), dots: dots.filter((p, i) => dots.findIndex((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 2) === i)};
})();

/** 0–8 s: the glass, the water, the cube that floats, then one molecule beside it, named and its angle pencilled */
function Glass() {
  const t = useTime(), clear = at(t, 7.6, 8.0, 0, 1);
  const names = at(t, 4.7, 5.1, 1, 0, lin);
  return (
    <>
      <Box x={300} y={150} w={560} h={640} on={clear}>
        <Ink d={GLASS} width={560} height={600} draw={at(t, 0, 1.1)} />
        <Ink d={WATER} width={560} height={600} pen="pencil" weight={3} draw={at(t, 1.1, 1.8)} />
        <Ink d={CUBE} width={560} height={600} draw={at(t, 1.8, 2.4)} fill="var(--color-data)" />
      </Box>
      <Box x={830} y={300} w={420} h={110} on={clear}><HandLabel text="ice floats!" pen="red" underline write={at(t, 2.5, 3.2, 1, 0, lin)} /></Box>
      <Box x={1060} y={180} w={660} h={460} on={clear}>
        <Ink d={MOLECULE} width={660} height={460} draw={at(t, 3.5, 4.7)} />
        <div style={{position: 'absolute', left: 312, top: 176}}><HandLabel text="O" size={60} tilt={0} write={names} /></div>
        <div style={{position: 'absolute', left: 176, top: 300}}><HandLabel text="H" size={52} tilt={0} write={names} /></div>
        <div style={{position: 'absolute', left: 456, top: 300}}><HandLabel text="H" size={52} tilt={0} write={names} /></div>
        <div style={{position: 'absolute', left: 260, top: 380}}><HandLabel text="104.5°" size={40} pen="pencil" write={at(t, 5.3, 5.9, 1, 0, lin)} /></div>
      </Box>
      {/* a tab is stuck on in one beat, no slide */}
      <Box x={1240} y={8} w={300} h={110} on={Math.min(at(t, 6.3, 6.42, 1, 0, lin), clear)}><Tab text="the shape" color="yellow" /></Box>
    </>
  );
}

/** 8–18 s: a clean page: the lattice from above, framed as a figure, its gaps tabbed, and the working with the result boxed in red */
function Lattice() {
  const t = useTime(), dots = at(t, 0.2, 1.2, 1, 0, lin);
  return (
    <>
      <Box x={280} y={110} w={860} h={640}>
        <Frame width={820} height={560} draw={at(t, 2.9, 3.8)} label="Fig. 1 — ice, from above" />
        <div style={{position: 'absolute', left: 20, top: 30}}>
          <Ink d={HEX.d} width={780} height={500} draw={at(t, 0.9, 2.9)} />
          <svg width={780} height={500} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            {HEX.dots.slice(0, Math.round(dots * HEX.dots.length)).map(([x, y], i) => <circle key={i} cx={x} cy={y} r={11} fill="var(--color-text)" />)}
          </svg>
        </div>
      </Box>
      <Box x={1240} y={8} w={300} h={110} on={at(t, 4.1, 4.22, 1, 0, lin)}><Tab text="the gaps" color="yellow" /></Box>
      <Box x={1100} y={330} w={160} h={200}><CurveArrow from={[10, 170]} to={[140, 60]} bend={-0.3} draw={at(t, 4.5, 5.1)} /></Box>
      <Box x={1260} y={260} w={540} h={480}>
        <Formula lines={['density = mass ÷ volume', 'same mass, more volume', 'ice ≈ 0.92 g/cm³']}
          write={interpolate(t, [4.9, 6.5, 6.7, 7.5], [0, 2, 2, 3], {easing: lin})} box={at(t, 7.7, 8.3)} size={40} />
      </Box>
    </>
  );
}

export default function Reel() {
  return (
    <>
      <Sheet title="Why does ice float?" date="Oct 30" />
      <Sequence from={0} duration={8}><Glass /></Sequence>
      <Sequence from={8}><Lattice /></Sequence>
    </>
  );
}
