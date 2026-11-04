// Lab Notebook's reel: thirty seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
import type {ReactNode} from 'react';
import {Easing, Sequence, interpolate, useTime} from '@motionhub/runtime';
import {Sheet} from './parts/sheet.tsx';
import {Ink} from './parts/ink.tsx';
import {HandLabel} from './parts/label.tsx';
import {CurveArrow} from './parts/arrow.tsx';
import {Tab} from './parts/tab.tsx';
import {Formula} from './parts/formula.tsx';
import {Frame} from './parts/frame.tsx';
import {Bars} from './parts/bars.tsx';
import {Figure} from './parts/figure.tsx';
import {Versus} from './parts/versus.tsx';
import {Graph} from './parts/graph.tsx';
import {Clipping} from './parts/clipping.tsx';
import {Takeaway} from './parts/takeaway.tsx';

export const reel = {seconds: 30, width: 1920, height: 1080};

/** What happens when, for the motion's sound (sound.json): the pen draws a line or writes, a tab is stuck on, the page turns, the result is boxed */
export const cues = [
  {at: 0.0, role: 'draw', dur: 1.1}, {at: 1.1, role: 'draw', dur: 0.7}, {at: 1.8, role: 'draw', dur: 0.6}, {at: 2.5, role: 'draw', dur: 0.7},
  {at: 3.5, role: 'draw', dur: 1.2}, {at: 5.3, role: 'draw', dur: 0.6}, {at: 6.3, role: 'land'}, {at: 8.0, role: 'cut'},
  {at: 8.9, role: 'draw', dur: 2.0}, {at: 10.9, role: 'draw', dur: 0.9}, {at: 12.1, role: 'land'}, {at: 12.5, role: 'draw', dur: 0.6},
  {at: 12.9, role: 'draw', dur: 1.6}, {at: 14.7, role: 'draw', dur: 0.8}, {at: 16.3, role: 'count'},
  {at: 18.2, role: 'draw', dur: 2.0}, {at: 20.3, role: 'draw', dur: 0.8}, {at: 22, role: 'cut'}, {at: 22.1, role: 'draw', dur: 1.8}, {at: 24.2, role: 'draw', dur: 0.6},
  {at: 25, role: 'cut'}, {at: 25.1, role: 'draw', dur: 1.9}, {at: 27.1, role: 'land'}, {at: 27.8, role: 'cut'}, {at: 27.9, role: 'draw', dur: 1.4}, {at: 29.3, role: 'count'},
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

/** 18–22 s: a clean page: the densities by hand, and the one figure they come to */
function HowMuch() {
  const t = useTime();
  return (
    <>
      <Sheet title="How much lighter?" date="Oct 30" />
      <Box x={280} y={170} w={900} h={460}>
        <Bars items={[{label: 'pine', value: 0.5, display: '0.50'}, {label: 'ice', value: 0.92, display: '0.92'}, {label: 'water', value: 1, display: '1.00'}]} focus={1} width={900} height={420} draw={at(t, 0.2, 2.2, 1, 0, lin)} />
      </Box>
      <Box x={1230} y={210} w={560} h={330}><Figure value="8%" note="less dense than water" width={540} write={at(t, 2.3, 3.1, 1, 0, lin)} /></Box>
      <Box x={280} y={620} w={700} h={60}><HandLabel text="grams per cubic centimetre" size={34} pen="pencil" tilt={0} write={at(t, 3.1, 3.6, 1, 0, lin)} /></Box>
    </>
  );
}

/** 22–25 s: facing columns, row by row, a pencil ring round the number, the verdict in red */
function Facing() {
  const t = useTime();
  return (
    <>
      <Sheet title="Ice against water" date="Oct 30" />
      <Box x={290} y={160} w={1460} h={600}>
        <Versus left="ice" right="liquid water" width={1460} height={560} verdict="the open one floats"
          rows={[{left: 'a fixed lattice', right: 'molecules jostling'}, {left: 'hexagons hold gaps', right: 'gaps collapse'}, {left: '0.92 g/cm³', right: '1.00 g/cm³', ring: 'left'}]}
          shown={at(t, 0.1, 1.9, 4, 0, lin)} rings={at(t, 1.9, 2.2, 1, 0, lin)} conclude={at(t, 2.2, 2.8, 1, 0, lin)} />
      </Box>
    </>
  );
}

/** 25–27.8 s: the graph of density against temperature (0 to 20 °C, in g/cm³), and a clipping stuck on beside it */
function Winter() {
  const t = useTime();
  return (
    <>
      <Sheet title="Why lakes freeze from the top" date="Oct 31" />
      <Box x={280} y={130} w={900} h={640}>
        <Graph width={900} height={620} zero={false} points={[[0, 0.99984], [4, 0.99997], [10, 0.9997], [15, 0.9991], [20, 0.99821]]} mark={1} markLabel="densest at 4 °C"
          xLabel="temperature" yLabel="density of water" xTicks={[[0, '0 °C'], [4, '4'], [10, '10'], [20, '20 °C']]} draw={at(t, 0.1, 2.0, 1, 0, lin)} />
      </Box>
      <Box x={1210} y={300} w={590} h={320} on={at(t, 2.1, 2.22, 1, 0, lin)}>
        <Clipping width={570} text="The coldest water floats, so a lake freezes from the top and keeps liquid water beneath." source="Lab note, winter term" tilt={1.2} />
      </Box>
    </>
  );
}

/** 27.8–30 s: the takeaway, boxed in red */
function Remember() {
  const t = useTime();
  return (
    <>
      <Sheet title="So" date="Oct 31" />
      <Box x={300} y={190} w={1400} h={560}>
        <Takeaway points={['Bonds open up as water freezes', 'Same mass, more room']} result="Ice floats because of its gaps" width={1400} size={88}
          write={at(t, 0.1, 1.5, 3, 0, lin)} box={at(t, 1.5, 2.0)} />
      </Box>
    </>
  );
}

export default function Reel() {
  return (
    <>
      <Sequence from={0} duration={18}><Sheet title="Why does ice float?" date="Oct 30" /></Sequence>
      <Sequence from={0} duration={8}><Glass /></Sequence>
      <Sequence from={8} duration={10}><Lattice /></Sequence>
      <Sequence from={18} duration={4}><HowMuch /></Sequence>
      <Sequence from={22} duration={3}><Facing /></Sequence>
      <Sequence from={25} duration={2.8}><Winter /></Sequence>
      <Sequence from={27.8}><Remember /></Sequence>
    </>
  );
}
