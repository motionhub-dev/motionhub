// Lab Notebook's sample: one example among many. Do not reuse its story, scenes, layout or timings; read it for technique, after your own scenes are planned.
import {Doc, Scene, Line, Part, Animation, Appear, Tween, Set} from '@visotalk/jsx';
import {useProp} from '@visotalk/runtime';
import {Sheet} from '../parts/sheet.tsx';
import {Ink} from '../parts/ink.tsx';
import {HandLabel} from '../parts/label.tsx';
import {CurveArrow} from '../parts/arrow.tsx';
import {Tab} from '../parts/tab.tsx';
import {Formula} from '../parts/formula.tsx';
import {Frame} from '../parts/frame.tsx';

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

export default <Doc
  id="lab-notebook-sample"
  title="Why ice floats"
  poster={23}
  lang="en"
  canvas="16x9"
  theme="visotalk/light"
  tokens={{
    colors: {bg: '#D9D5C9', panel: '#FBFAF5', panel2: '#F1EFE6', border: '#E2A3A0', text: '#1B2A47', muted: '#6A7180', faint: '#D3DFEC', data: '#2F67A8', grad: '#CF4F33', op: '#7A5BA6', good: '#3B8A5F', bad: '#CF4F33', warn: '#F2C14E'},
    fonts: {sans: '"Atkinson Hyperlegible Next", "Noto Sans SC", sans-serif', mono: '"JetBrains Mono", monospace', display: '"Shantell Sans", "LXGW WenKai", cursive'},
    caption: {font: 'sans', size: 34, color: '#1B2A47', background: 'rgba(255, 253, 246, 0.97)', radius: 3, padding: [10, 26], bottom: 58, rule: '#CF4F33', ruleSide: 'top'},
  }}
  pacing={{lead: 0.4, hold: 0.5, tail: 1}}
  exports={{captions: 'burned'}}
>
  <Part id="sheet"><Sheet title="Why does ice float?" date="Oct 30" /></Part>

  <Scene id="glass">
    <Line id="l1">Most solids sink in their own liquid, but ice floats on water.</Line>
    <Line id="l2" hold={0.4}>The reason is the shape a water molecule holds when it freezes.</Line>

    <Part id="glass" x={300} y={150} w={560} h={640}>{() => (
      <>
        <Ink d={GLASS} width={560} height={600} draw={useProp('glass', 0)} />
        <Ink d={WATER} width={560} height={600} pen="pencil" weight={3} draw={useProp('water', 0)} />
        <Ink d={CUBE} width={560} height={600} draw={useProp('cube', 0)} fill="var(--vt-data)" />
      </>
    )}</Part>
    <Part id="floats" x={830} y={300} w={420} h={110}>{() => <HandLabel text="ice floats!" pen="red" underline write={useProp('write', 0)} />}</Part>
    <Part id="molecule" x={1060} y={180} w={660} h={460}>{() => (
      <>
        <Ink d={MOLECULE} width={660} height={460} draw={useProp('draw', 0)} />
        <div style={{position: 'absolute', left: 312, top: 176}}><HandLabel text="O" size={60} tilt={0} write={useProp('names', 0)} /></div>
        <div style={{position: 'absolute', left: 176, top: 300}}><HandLabel text="H" size={52} tilt={0} write={useProp('names', 0)} /></div>
        <div style={{position: 'absolute', left: 456, top: 300}}><HandLabel text="H" size={52} tilt={0} write={useProp('names', 0)} /></div>
        <div style={{position: 'absolute', left: 260, top: 380}}><HandLabel text="104.5°" size={40} pen="pencil" write={useProp('angle', 0)} /></div>
      </>
    )}</Part>
    <Animation>
      <Appear target="sheet" at="start" dur={0} />
      <Appear target="glass" line="l1" word="solids" dur={0} />
      <Tween target="glass" to={{glass: 1}} line="l1" word="solids" dur={1.2} easing="easeInOutSine" />
      <Tween target="glass" to={{water: 1}} line="l1" word="their own liquid" dur={0.8} easing="easeInOutSine" />
      <Tween target="glass" to={{cube: 1}} line="l1" word="ice" dur={0.7} easing="easeInOutSine" />
      <Appear target="floats" line="l1" word="floats" dur={0} />
      <Tween target="floats" to={{write: 1}} line="l1" word="floats" dur={0.8} easing="linear" />
      <Appear target="molecule" line="l2" word="water molecule" dur={0} />
      <Tween target="molecule" to={{draw: 1}} line="l2" word="water molecule" dur={1.3} easing="easeInOutSine" />
      <Tween target="molecule" to={{names: 1}} line="l2" word="holds" dur={0.5} easing="linear" />
      <Tween target="molecule" to={{angle: 1}} line="l2" word="freezes" dur={0.6} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="lattice">
    <Line id="l3">In ice, each molecule holds four neighbours at fixed angles, in an open hexagonal pattern.</Line>
    <Line id="l4" hold={1}>That leaves gaps, so ice takes more room than the same water: it is about nine percent less dense.</Line>

    <Part id="lattice" x={280} y={110} w={860} h={640}>{() => {
      const dots = useProp('dots', 0);
      return (
        <>
          <Frame width={820} height={560} draw={useProp('frame', 0)} label="Fig. 1 — ice, from above" />
          <div style={{position: 'absolute', left: 20, top: 30}}>
            <Ink d={HEX.d} width={780} height={500} draw={useProp('draw', 0)} />
            <svg width={780} height={500} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
              {HEX.dots.slice(0, Math.round(dots * HEX.dots.length)).map(([x, y], i) => <circle key={i} cx={x} cy={y} r={11} fill="var(--vt-text)" />)}
            </svg>
          </div>
        </>
      );
    }}</Part>
    <Part id="tab" x={1240} y={8} w={300} h={110}><Tab text="the gaps" color="yellow" /></Part>
    <Part id="link" x={1100} y={330} w={160} h={200}>{() => <CurveArrow from={[10, 170]} to={[140, 60]} bend={-0.3} draw={useProp('draw', 0)} />}</Part>
    <Part id="working" x={1260} y={260} w={540} h={480}>{() => (
      <Formula lines={['density = mass ÷ volume', 'same mass, more volume', 'ice ≈ 0.92 g/cm³']} write={useProp('write', 0)} box={useProp('box', 0)} size={40} />
    )}</Part>
    <Animation>
      <Appear target="lattice" line="l3" word="each molecule" dur={0} />
      <Tween target="lattice" to={{dots: 1}} line="l3" word="each molecule" dur={1.2} easing="linear" />
      <Tween target="lattice" to={{draw: 1}} line="l3" word="four neighbours" dur={2.2} easing="easeInOutSine" />
      <Tween target="lattice" to={{frame: 1}} line="l3" word="hexagonal" dur={1} easing="easeInOutSine" />
      <Appear target="tab" line="l4" word="gaps" />
      <Appear target="link" line="l4" word="takes more room" dur={0} />
      <Tween target="link" to={{draw: 1}} line="l4" word="takes more room" dur={0.6} easing="easeInOutSine" />
      <Appear target="working" line="l4" word="takes more room" dur={0} />
      <Tween target="working" to={{write: 2}} line="l4" word="takes more room" dur={1.8} easing="linear" />
      <Tween target="working" to={{write: 3}} line="l4" word="nine percent" dur={0.9} easing="linear" />
      <Tween target="working" to={{box: 1}} line="l4" word="less dense" dur={0.6} easing="easeInOutSine" />
    </Animation>
  </Scene>
</Doc>;
