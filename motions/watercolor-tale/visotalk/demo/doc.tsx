// Watercolor Tale's sample: one example among many. Do not reuse its story, scenes, layout or timings; read it for technique, after your own scenes are planned.
// Facts: chlorophyll is the green that turns light into sugars; carotenoids (yellow, orange) are in the leaf all summer and show when the chlorophyll
// breaks down as days shorten and nights cool; maples and some other trees make new red pigments (anthocyanins) in autumn; then the leaves fall.
import React, {type ReactNode} from 'react';
import {Doc, Scene, Line, Part, Animation, Appear, Tween} from '@visotalk/jsx';
import {useProp} from '@visotalk/runtime';
import {Book} from '../parts/book.tsx';
import {Wash} from '../parts/wash.tsx';
import {Glaze} from '../parts/glaze.tsx';
import {Pencil} from '../parts/pencil.tsx';
import {Note} from '../parts/note.tsx';
import {Title} from '../parts/title.tsx';
import {Swatches} from '../parts/swatches.tsx';
import {Spatter} from '../parts/spatter.tsx';
import {blob, maple, stroke, type Pt} from '../parts/paint.ts';

/** A box on the spread, in canvas px */
const At = ({x, y, w = 0, h = 0, children, style}: {x: number; y: number; w?: number; h?: number; children?: ReactNode; style?: React.CSSProperties}) =>
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, ...style}}>{children}</div>;

// the maple, in its own box on the right page (x 1040, y 40, 640 × 820): a crown of three lumps over a trunk and three limbs
const TREE = {x: 1040, y: 40, w: 640, h: 820};
const CROWN = [blob(320, 290, 228, 4, 8, 0.2, 0.86), blob(168, 372, 132, 9, 6), blob(478, 362, 140, 12, 6)].join(' ');
const TRUNK = [
  stroke([[322, 812], [316, 640], [326, 470]], 66, 34),
  stroke([[318, 590], [250, 500], [176, 430]], 28, 8),
  stroke([[324, 540], [404, 456], [470, 392]], 26, 8),
  stroke([[324, 480], [316, 390], [334, 300]], 22, 7),
].join(' ');
// the underdrawing: a loose ring round the crown and the two sides of the trunk
const SKETCH: Pt[][] = [
  [[112, 330], [150, 190], [270, 100], [420, 110], [540, 200], [600, 330], [560, 460], [420, 500], [230, 500], [120, 440]],
  [[290, 810], [292, 620], [300, 480]], [[354, 810], [344, 620], [350, 480]],
];
// hills across the whole spread, run off the page's edges as a printed book trims them
const HILLS = 'M0 120 C 260 40, 520 110, 820 80 C 1100 50, 1400 120, 1700 70 C 1800 54, 1860 60, 1920 70 L1920 300 L0 300 Z';
const NEAR = 'M620 300 C 760 250, 900 120, 1100 90 C 1300 64, 1480 100, 1620 120 C 1760 136, 1860 110, 1920 100 L1920 300 Z';

function Tree({crown = 1, glaze = 1, fade = 0, red = 0, bare = 0, trunk = 1, sketch = 0}: {crown?: number; glaze?: number; fade?: number; red?: number; bare?: number; trunk?: number; sketch?: number}) {
  return (
    <At {...TREE}>
      {SKETCH.map((pts, i) => <Pencil key={i} points={pts} closed={i === 0} width={TREE.w} height={TREE.h} draw={sketch * 1.3 - i * 0.15} weight={2.2} />)}
      <Wash d={TRUNK} width={TREE.w} height={TREE.h} pigment="op" strength={0.85} paint={trunk} dry={trunk} from={[0.5, 1]} granulate={0.8} />
      {/* letting go: the crown is lifted off, then its last stain clears */}
      <div style={{position: 'absolute', inset: 0, opacity: bare > 0.55 ? 1 - Math.min(1, (bare - 0.55) / 0.45) : undefined}}>
      <Wash d={CROWN} width={TREE.w} height={TREE.h} pigment="warn" strength={0.85} paint={crown} dry={crown} from={[0.5, 0.35]} granulate={0.15} lift={bare} liftFrom={[0.5, 0.1]} />
      {fade < 1 && <Glaze d={CROWN} width={TREE.w} height={TREE.h} pigment="data" strength={0.62} glaze={glaze} lift={fade} liftFrom={[0.5, 0]} />}
      {/* the new red comes first to the top and the sunny side, dropped into the gold while it is wet so the two bleed */}
      <Glaze d={CROWN} width={TREE.w} height={TREE.h} pigment="grad" strength={0.92} glaze={red} reach={0.36} side={[0.8, 0.1]} wet lift={bare} liftFrom={[0.5, 0.1]} />
      </div>
    </At>
  );
}

function Cover() {
  const p = (n: string) => useProp(n, 0);
  return (
    <Book turn={p('turn')}>
      <At x={136} y={220} w={760} h={400}><Title text={'Why Leaves Turn\nRed and Gold'} by="a little book about autumn" size={98} pigment="warn" swash={p('swash')} write={p('title')} /></At>
      <At x={0} y={0} w={1920} h={1080}><Spatter from={[860, 520]} to={[1180, 640]} width={1920} height={1080} pigment="#E8A21F" count={26} spread={170} size={17} flick={p('swash')} seed={7} /></At>
      <At x={1150} y={120} w={620} h={680}>
        <Wash d={maple(310, 560, 520, 12, 5)} width={620} height={680} pigment="grad" strength={0.82} paint={p('leaf')} dry={p('leafDry')} from={[0.5, 0.45]} granulate={0.35} />
        <Glaze d={maple(310, 560, 520, 12, 5)} width={620} height={680} pigment="warn" strength={0.8} glaze={p('leafWarm')} reach={0.7} side={[0.25, 0.85]} wet />
      </At>
    </Book>
  );
}

function Summer() {
  const p = (n: string) => useProp(n, 0);
  return (
    <Book turn={p('turn')}>
      <At x={0} y={600} w={1920} h={300}><Wash d={HILLS} width={1920} height={300} pigment="good" strength={0.62} paint={p('hills')} dry={p('hills')} from="left" granulate={0.4} /></At>
      <At x={0} y={600} w={1920} h={300}><Wash d={NEAR} width={1920} height={300} pigment="good" strength={0.8} paint={p('near')} dry={p('near')} from="left" granulate={0.5} /></At>
      <At x={500} y={120} w={260} h={260}><Wash d={blob(130, 130, 92, 3, 9, 0.06)} width={260} height={260} pigment="warn" strength={0.9} paint={p('sun')} dry={p('sun')} granulate={0.1} /></At>
      {[[[780, 230], [940, 250], [1090, 300]], [[780, 300], [940, 340], [1100, 400]], [[760, 360], [900, 440], [1110, 500]]].map((ray, i) =>
        <At key={i} x={0} y={0} w={1920} h={1080}><Pencil points={ray as Pt[]} width={1920} height={1080} draw={p('rays') * 1.4 - i * 0.2} arrow /></At>)}
      <Tree sketch={p('sketch')} trunk={p('trunk')} crown={p('crown')} glaze={p('glaze')} />
      <At x={1590} y={50}><Note text="chlorophyll" to={[-20, 125]} write={p('chloro')} size={46} /></At>
      <At x={1500} y={560}><Note text="food" to={[-110, 40]} write={p('food')} size={44} /></At>
    </Book>
  );
}

function Autumn() {
  const p = (n: string) => useProp(n, 0);
  return (
    <Book turn={p('turn')}>
      <At x={0} y={600} w={1920} h={300}><Wash d={HILLS} width={1920} height={300} pigment="#B5803A" strength={0.6} paint={p('hills')} dry={p('hills')} from="left" granulate={0.6} /></At>
      <At x={0} y={600} w={1920} h={300}><Wash d={NEAR} width={1920} height={300} pigment="#9A6A34" strength={0.62} paint={p('hills')} dry={p('hills')} from="left" granulate={0.7} /></At>
      {/* evening: a cold sky glazed down from the top of the left page, the moon lifted out of it */}
      <At x={44} y={24} w={916} h={560}>
        <Wash d="M-20 -20 L910 -20 L910 306 C 856 336, 736 276, 596 328 C 446 386, 276 336, 136 406 C 66 438, 20 432, -20 442 Z" width={916} height={560} pigment="data" strength={0.62} paint={p('night')} dry={p('night')} from="top" granulate={0.9}
          lift={p('moon')} liftFrom={[0.7, 0.3]} />
      </At>
      <At x={0} y={0} w={1920} h={1080}><Pencil points={[[150, 690], [330, 560], [520, 530], [710, 560], [880, 690]]} width={1920} height={1080} draw={p('arc')} arrow /></At>
      <At x={440} y={460} w={160} h={160}><Wash d={blob(80, 80, 52, 6, 8, 0.06)} width={160} height={160} pigment="#E2742C" strength={0.85} paint={p('lowSun')} dry={p('lowSun')} granulate={0.1} /></At>
      <At x={620} y={470}><Note text="short days" write={p('arc')} size={46} /></At>
      <Tree trunk={p('tree')} crown={p('tree')} glaze={p('tree')} fade={p('fade')} red={p('red')} />
      <At x={0} y={0} w={1920} h={1080}><Spatter from={[1800, 90]} to={[1470, 260]} width={1920} height={1080} pigment="grad" count={34} spread={170} size={13} flick={p('flick')} seed={3} /></At>
      <At x={1640} y={510}><Note text={'gold,\nall along'} to={[-110, 4]} write={p('gold')} size={46} /></At>
    </Book>
  );
}

// leaves letting go: each falls from its place in the crown, swinging as it drops, and comes to rest on the hill
// a gust takes them: they lift and sweep right before they swing down, turning over in the air (their backs are paler) and settle on the hill
const FALLING = [[1180, 300, 1150, 800, 'warn'], [1330, 220, 1420, 790, 'grad'], [1490, 330, 1560, 810, 'warn'], [1260, 420, 1250, 820, 'grad'], [1420, 410, 1340, 800, 'warn'],
  [1560, 250, 1660, 790, 'grad'], [1380, 160, 1760, 820, 'warn'], [1220, 230, 1820, 760, 'grad'], [1600, 380, 1720, 805, 'warn']] as const;
function Rest() {
  const p = (n: string) => useProp(n, 0);
  const fall = p('fall');
  return (
    <Book turn={p('turn')}>
      <At x={0} y={600} w={1920} h={300}><Wash d={HILLS} width={1920} height={300} pigment="#B5803A" strength={0.5} paint={p('hills')} dry={p('hills')} from="left" granulate={0.6} /></At>
      <At x={0} y={600} w={1920} h={300}><Wash d={NEAR} width={1920} height={300} pigment="#9A6A34" strength={0.55} paint={p('hills')} dry={p('hills')} from="left" granulate={0.7} /></At>
      <Tree trunk={p('tree')} crown={p('tree')} fade={1} red={p('tree')} bare={fall} />
      {FALLING.map(([x0, y0, x1, y1, pig], i) => {
        const k = Math.max(0, Math.min(1, fall * 1.7 - i * 0.08)), e = k * k * (3 - 2 * k);
        if (k <= 0) return null;
        const gust = Math.sin(Math.PI * Math.min(1, e * 1.4)) * (90 + i * 12), x = x0 + (x1 - x0) * e + gust + Math.sin(e * 9 + i) * 36 * (1 - e);
        const y = y0 + (y1 - y0) * e - Math.sin(Math.PI * Math.min(1, e * 2)) * 70;
        const still = 1 - e * 0.8, ry = Math.sin(e * 13 + i) * 70 * still, rx = Math.cos(e * 9 + i * 1.3) * 50 * still;
        const backSide = Math.cos((ry * Math.PI) / 180) * Math.cos((rx * Math.PI) / 180) < 0;
        return <At key={i} x={x - 60} y={y - 120} w={120} h={140} style={{transform: `perspective(520px) rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg) rotate(${(Math.sin(e * 7 + i * 2) * 40 + i * 25).toFixed(1)}deg)`, opacity: backSide ? 0.62 : 1}}>
          <Wash d={maple(60, 110, 100, 0, 30 + i)} width={120} height={140} pigment={pig} strength={0.85} granulate={0.2} wobble={4} />
        </At>;
      })}
      <At x={1510} y={470} w={80} h={80}><Wash d={blob(40, 40, 16, 8, 5, 0.1, 1.4)} width={80} height={80} pigment="good" strength={0.9} paint={p('bud')} dry={p('bud')} granulate={0.2} wobble={3} /></At>
      <At x={1590} y={360}><Note text={'a bud,\nfor spring'} to={[-50, 130]} write={p('bud')} size={46} /></At>
    </Book>
  );
}

export default <Doc
  id="watercolor-tale-sample"
  title="Why leaves turn red and gold"
  poster={30.7}
  lang="en"
  canvas="16x9"
  theme="visotalk/light"
  tokens={{
    colors: {bg: '#C9C2B2', panel: '#F7F1E4', panel2: '#EFE6D3', border: '#A79F8E', text: '#33291F', muted: '#5F5A55', faint: '#D9D0BE', data: '#2A78B8', grad: '#D2452F', op: '#A0522D', good: '#6A9A3A', bad: '#B83A4B', warn: '#F0C419'},
    fonts: {sans: '"Fraunces", "LXGW WenKai", serif', mono: '"JetBrains Mono", monospace', display: '"Patrick Hand", "LXGW WenKai", cursive'},
    caption: {font: 'sans', size: 46, weight: 500, color: '#33291F', background: 'none', padding: [4, 20], bottom: 64, maxWidth: 1560},
  }}
  pacing={{lead: 0.5, hold: 0.6, tail: 1.2}}
  exports={{captions: 'burned'}}
>
  {/* the swatch card lies on the book, above its pages, so it keeps what each chapter added through the page turns */}
  <Part id="palette" x={70} y={50} w={420} h={430} z={5}>{() => (
    <div style={{position: 'absolute', left: 14, top: 14, width: 390, height: 400, transform: 'rotate(-3deg)'}}>
      <Swatches card columns={2} cell={150} shown={useProp('shown', 0)} items={[{pigment: 'good', label: 'green'}, {pigment: 'warn', label: 'gold', strength: 0.85}, {pigment: 'grad', label: 'red'}, {pigment: 'op', label: 'rest', strength: 0.45}]} />
    </div>
  )}</Part>

  <Scene id="cover" title="The cover">
    <Line id="l0" hold={1.8}>Why leaves turn red and gold.</Line>
    <Part id="cover-spread"><Cover /></Part>
    <Animation>
      <Appear target="cover-spread" at="start" dur={0} />
      <Tween target="cover-spread" to={{title: 1}} line="l0" word="why" dur={1.8} easing="linear" />
      <Tween target="cover-spread" to={{leaf: 1}} line="l0" word="why" offset={0.3} dur={1.6} easing="easeOut" />
      <Tween target="cover-spread" to={{leafWarm: 1}} line="l0" word="red" offset={0.6} dur={1.4} easing="easeOut" />
      <Tween target="cover-spread" to={{swash: 1}} line="l0" word="gold" dur={1.2} easing="easeInOutSine" />
      <Tween target="cover-spread" to={{leafDry: 1}} line="l0" word="gold" dur={1.6} easing="easeOut" />
      <Tween target="cover-spread" to={{turn: 1}} line="l0" edge="end" offset={1.1} dur={1.3} easing="easeInOutSine" />
    </Animation>
  </Scene>

  <Scene id="summer" title="Summer">
    <Line id="l1" hold={0.6}>All summer long, a maple's leaves are green.</Line>
    <Line id="l2" hold={2}>That green is chlorophyll, which turns sunlight into food for the tree.</Line>
    <Part id="summer-spread"><Summer /></Part>
    <Animation>
      <Appear target="summer-spread" at="start" dur={0} />
      <Tween target="summer-spread" to={{sun: 1}} line="l1" word="summer" dur={1.6} easing="easeOut" />
      <Tween target="summer-spread" to={{hills: 1}} at="start" offset={0.2} dur={2} easing="easeInOutSine" />
      <Tween target="summer-spread" to={{sketch: 1}} line="l1" word="maple's" dur={1} easing="linear" />
      <Tween target="summer-spread" to={{trunk: 1}} line="l1" word="maple's" offset={0.5} dur={1.2} easing="easeOut" />
      <Tween target="summer-spread" to={{near: 1}} line="l1" word="maple's" offset={0.5} dur={1.6} easing="easeInOutSine" />
      <Tween target="summer-spread" to={{crown: 1}} line="l1" word="leaves" dur={1.3} easing="easeOut" />
      <Tween target="summer-spread" to={{glaze: 1}} line="l1" word="green" dur={1.5} easing="easeInOutSine" />
      <Appear target="palette" line="l1" word="green" offset={0.4} dur={0.4} />
      <Tween target="palette" to={{shown: 1}} line="l1" word="green" offset={0.6} dur={0.9} easing="easeOut" />
      <Tween target="summer-spread" to={{chloro: 1}} line="l2" word="chlorophyll" dur={1.2} easing="linear" />
      <Tween target="summer-spread" to={{rays: 1}} line="l2" word="sunlight" dur={1.2} easing="easeInOutSine" />
      <Tween target="summer-spread" to={{food: 1}} line="l2" word="food" dur={1.2} easing="linear" />
      <Tween target="summer-spread" to={{turn: 1}} line="l2" edge="end" offset={0.9} dur={1.3} easing="easeInOutSine" />
    </Animation>
  </Scene>

  <Scene id="autumn" title="Autumn">
    <Line id="l3">As autumn comes, the days grow short, and the nights turn cold.</Line>
    <Line id="l4">The tree stops making chlorophyll, and the green fades away.</Line>
    <Line id="l5">Underneath, a golden yellow was there all along.</Line>
    <Line id="l6" hold={1.8}>And maples make a new red of their own.</Line>
    <Part id="autumn-spread"><Autumn /></Part>
    <Animation>
      <Appear target="autumn-spread" at="start" dur={0} />
      <Tween target="autumn-spread" to={{tree: 1}} line="l3" word="autumn" dur={1.2} easing="easeOut" />
      <Tween target="autumn-spread" to={{hills: 1}} at="start" offset={0.2} dur={1.8} easing="easeInOutSine" />
      <Tween target="autumn-spread" to={{arc: 1}} line="l3" word="days" dur={1.4} easing="easeInOutSine" />
      <Tween target="autumn-spread" to={{lowSun: 1}} line="l3" word="short" dur={1.2} easing="easeOut" />
      <Tween target="autumn-spread" to={{night: 1}} line="l3" word="nights" dur={1.6} easing="easeInOutSine" />
      <Tween target="autumn-spread" to={{moon: 0.16}} line="l3" word="cold" dur={1} easing="easeOut" />
      <Tween target="autumn-spread" to={{fade: 1}} line="l4" word="green fades" dur={2.2} easing="easeInOutSine" />
      <Tween target="autumn-spread" to={{gold: 1}} line="l5" word="golden yellow" dur={1.4} easing="linear" />
      <Tween target="palette" to={{shown: 2}} line="l5" word="golden yellow" offset={0.4} dur={0.9} easing="easeOut" />
      <Tween target="autumn-spread" to={{red: 1}} line="l6" word="new red" dur={1.6} easing="easeInOutSine" />
      <Tween target="autumn-spread" to={{flick: 1}} line="l6" word="new red" offset={-0.2} dur={1.3} easing="linear" />
      <Tween target="palette" to={{shown: 3}} line="l6" word="new red" offset={0.4} dur={0.9} easing="easeOut" />
      <Tween target="autumn-spread" to={{turn: 1}} line="l6" edge="end" offset={0.6} dur={1.3} easing="easeInOutSine" />
    </Animation>
  </Scene>

  <Scene id="rest" title="Rest">
    <Line id="l7">At last the leaves let go, and the tree rests until spring.</Line>
    <Line id="l8" hold={2.6}>Green, then gold, then red, then rest.</Line>
    <Part id="rest-spread"><Rest /></Part>
    <Animation>
      <Appear target="rest-spread" at="start" dur={0} />
      <Tween target="rest-spread" to={{tree: 1, hills: 1}} at="start" dur={1} easing="easeOut" />
      <Tween target="rest-spread" to={{fall: 1}} line="l7" word="let go" dur={3} easing="linear" />
      <Tween target="rest-spread" to={{bud: 1}} line="l7" word="spring" dur={1.2} easing="easeOut" />
      <Tween target="palette" to={{x: 222, y: 165, scale: 1.55, rotate: 3}} line="l8" word="green" dur={1.4} easing="easeInOutSine" />
      <Tween target="palette" to={{shown: 4}} line="l8" word="rest" dur={0.9} easing="easeOut" />
    </Animation>
  </Scene>
</Doc>;
