// Ink Scroll's sample: one example among many. Do not reuse its story, scenes, layout or timings; read it for technique, after your own scenes are planned.
// Dates: Cai Lun's report of 105 (Book of the Later Han); the Talas captives as a tradition ("相传"), not a settled fact; a Baghdad paper mill
// in the 790s; paper made at Xàtiva in al-Andalus by about 1150. The sample is Chinese, as the motion is.
import {Doc, Scene, Line, Part, Animation, Appear, Tween, Set} from '@visotalk/jsx';
import {useProp} from '@visotalk/runtime';
import {Scroll, Place} from '../parts/scroll.tsx';
import {Wash, ridge} from '../parts/wash.tsx';
import {Brush} from '../parts/brush.tsx';
import {Figure} from '../parts/figure.tsx';
import {Inscription} from '../parts/inscription.tsx';
import {Era} from '../parts/era.tsx';
import {Seal} from '../parts/seal.tsx';
import {rng} from '../parts/ink.ts';

// one strip, read from its right end leftwards: Luoyang, Samarkand, Baghdad, Xàtiva
const LENGTH = 5600;
type Pts = [number, number][];

// the road west, from the capital to Baghdad, low on the paper and rising and falling with the land; a long way is painted in a few strokes
const ROAD: Pts = [[5140, 828], [4860, 836], [4560, 818], [4260, 806], [3960, 816], [3640, 834], [3340, 826], [3040, 808], [2740, 816], [2440, 836], [2160, 826], [1860, 812], [1600, 820]];
const STROKES = [ROAD.slice(0, 4), ROAD.slice(3, 7), ROAD.slice(6, 10), ROAD.slice(9, 13)];
const box = (pts: Pts, pad = 30) => {
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]), x = Math.min(...xs) - pad, y = Math.min(...ys) - pad;
  return {x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y, local: pts.map(([px, py]) => [px - x, py - y] as [number, number])};
};
// texture strokes down each slope of a summit at (x, y), following the slope rather than radiating from the top, as a painter finishes a near peak
const cun = (x: number, y: number, h: number): Pts[] => {
  const r = rng(x * 7 + y);
  return [-1, 1].flatMap((side) => [0.1, 0.26, 0.42, 0.58].map((t, i): Pts => {
    const sx = x + side * (h * 0.3 * (t + r() * 0.08) + 6), sy = y + h * (t + r() * 0.06) * 0.5 + 14, bend = (r() - 0.5) * h * 0.08;
    return [[sx, sy], [sx + side * h * 0.06 + bend, sy + h * (0.18 + r() * 0.08)], [sx + side * h * (0.06 + r() * 0.1), sy + h * (0.36 + r() * 0.16 - i * 0.04)]];
  }));
};
// Samarkand: long dunes, one steep face and one gentle back each, unlike the mountains
const DUNES = 'M0 330 C 120 300, 260 250, 380 200 C 430 180, 470 186, 500 214 C 560 266, 640 300, 700 296 C 780 280, 840 210, 900 168 C 940 142, 980 150, 1010 184 C 1050 232, 1090 290, 1100 330 Z';
// Baghdad as washes only: low walls, three domes and two minarets, then the domes again, darker, as the second tone
const CITY = [
  'M0 330 C 30 300, 50 262, 70 252 L110 248 C 112 214, 150 196, 168 196 C 186 196, 222 214, 224 250 L246 254 L250 120 L262 96 L274 120 L278 247 L300 251',
  'L300 214 C 300 150, 350 112, 390 104 C 430 112, 480 150, 480 214 L480 253 L516 248 L520 110 L532 84 L544 110 L548 252 L566 249',
  'C 568 222, 596 208, 612 208 C 628 208, 656 222, 658 250 L700 250 C 724 268, 744 300, 760 330 Z',
].join(' ');
const DOMES = 'M300 250 L300 214 C 300 150, 350 112, 390 104 C 430 112, 480 150, 480 214 L480 250 Z M112 250 C 114 216, 150 198, 168 198 C 186 198, 220 216, 222 250 Z M568 250 C 570 224, 596 210, 612 210 C 628 210, 654 224, 656 250 Z';
// the coast at Xàtiva: two long wave strokes near the shore
const WAVES: Pts[] = [[[640, 40], [400, 30], [140, 46]], [[580, 92], [320, 84], [40, 98]]];

/** A summit's texture, in its range's own px */
function Cun({x, y, h, draw}: {x: number; y: number; h: number; draw: number}) {
  return <>{cun(x, y, h).map((c, i) => <Brush key={i} points={c} width={900} height={500} weight={5} dry={0.7} tone="light" draw={draw * 1.5 - (i % 4) * 0.15} />)}</>;
}

function Painting() {
  const p = (name: string, base = 0) => useProp(name, base);
  const road = p('road'), whole = p('whole');
  return (
    <Scroll length={LENGTH} view={p('view', LENGTH - 1920)} unroll={p('unroll', 0)} whole={whole}
      marks={[{x: 4700, label: '105'}, {x: 3250, label: '751'}, {x: 2200, label: '794'}, {x: 960, label: '1150'}]}>
      {/* Luoyang: two far ranges, the near peak finished with texture, Cai Lun, and the title */}
      <Place x={4200} y={250} w={980} h={470}><Wash d={ridge(980, 470, 3, 3, 0.6)} width={980} height={470} tone="clear" bloom={p('far')} from={[0.7, 0.3]} /></Place>
      <Place x={3860} y={330} w={560} h={390}><Wash d={ridge(560, 390, 2, 5, 0.6)} width={560} height={390} tone="clear" bloom={p('far')} from={[0.8, 0.4]} /></Place>
      <Place x={4330} y={300} w={820} h={470}>
        <Wash d={ridge(820, 470, 2, 8, 0.8)} width={820} height={470} tone="light" bloom={p('peak')} settle={p('peakSettle')} from={[0.45, 0.15]} />
        <Cun x={576} y={26} h={300} draw={p('peakSettle')} /><Cun x={144} y={124} h={220} draw={p('peakSettle')} />
      </Place>
      <Place x={5200} y={96} w={240} h={760}><Inscription text="纸的西行" sub={whole > 0.3 ? '' : '公元一〇五年至一一五〇年'} size={104} write={p('title')} /></Place>
      <Place x={4070} y={160} w={220} h={330} hide={0.6}><Era year="105" place="东汉　洛阳" show={p('e105')} /></Place>
      {/* the bank Cai Lun stands on */}
      <Place x={4080} y={740} w={300} h={70}><Brush points={[[20, 32], [140, 38], [280, 30]]} width={300} height={70} weight={12} dry={0.65} tone="light" draw={p('cai')} /></Place>
      <Place x={4160} y={540} w={115} h={230}><Figure pose="stand" size={230} paint={p('cai')} /></Place>
      <Place x={3870} y={330} w={160} h={300} hide={0.6}><Inscription text={'树皮\n麻头\n破布'} size={50} tone="thick" write={p('stuff')} /></Place>

      {/* the road, stroke by stroke as the story travels */}
      {STROKES.map((pts, i) => {
        const b = box(pts);
        return <Place key={i} x={b.x} y={b.y} w={b.w} h={b.h}><Brush points={b.local} width={b.w} height={b.h} weight={15} dry={0.6} tone="thick" draw={road * STROKES.length - i} /></Place>;
      })}

      {/* Samarkand: long dunes, a craftsman walking west with his bundle */}
      <Place x={2700} y={470} w={1100} h={330}><Wash d={DUNES} width={1100} height={330} tone="light" bloom={p('dunes')} from={[0.85, 0.5]} /></Place>
      <Place x={3400} y={150} w={260} h={360} hide={0.6}><Era year="751" place="撒马尔罕" show={p('e751')} /></Place>
      <Place x={3150} y={560} w={100} h={200}><Figure pose="walk" carry size={200} paint={p('maker')} /></Place>

      {/* Baghdad: the city blooms, then its domes settle a deeper tone */}
      <Place x={1820} y={400} w={760} h={330}>
        <Wash d={CITY} width={760} height={330} tone="light" bloom={p('city')} settle={p('citySettle')} from={[0.5, 0.4]} />
        <Wash d={DOMES} width={760} height={330} tone="light" bloom={p('citySettle')} from={[0.5, 0.5]} />
      </Place>
      <Place x={2620} y={150} w={300} h={300} hide={0.6}><Era year="794" unit="年前后" place="巴格达" show={p('e794')} /></Place>

      {/* Xàtiva: hills on the sea, the colophon and the seal */}
      <Place x={580} y={300} w={760} h={420}>
        <Wash d={ridge(760, 420, 2, 34, 0.7)} width={760} height={420} tone="light" bloom={p('coast')} settle={p('coastSettle')} from={[0.6, 0.2]} />
        <Cun x={516} y={29} h={300} draw={p('coastSettle')} /><Cun x={204} y={98} h={230} draw={p('coastSettle')} />
      </Place>
      <Place x={600} y={680} w={680} h={140}>{WAVES.map((w, i) => <Brush key={i} points={w} width={680} height={140} weight={9} dry={0.5} tone="heavy" draw={p(`wave${i}`)} />)}</Place>
      <Place x={1420} y={150} w={340} h={420} hide={0.6}><Era year="1150" unit="年前后" place="西班牙　沙蒂瓦" show={p('e1150')} /></Place>
      <Place x={200} y={120} w={180} h={520}><Inscription text="一纸千年" size={96} write={p('colophon')} /></Place>
      <Place x={215} y={660} w={150} h={150}><Seal text="千年西行" size={150} stamp={p('seal')} /></Place>
    </Scroll>
  );
}

export default <Doc
  id="ink-scroll-sample"
  title="纸的西行"
  poster={48}
  lang="zh-CN"
  voice="minimax:Chinese (Mandarin)_News_Anchor"
  canvas="16x9"
  theme="visotalk/light"
  tokens={{
    colors: {bg: '#CFC6B2', panel: '#EFE7D4', panel2: '#E5DBC5', border: '#9C9A86', text: '#1C1A17', muted: '#6E685D', faint: '#CBC2AE', data: '#3E4A4F', grad: '#B23A2C', op: '#8A6B47', good: '#4D6650', bad: '#B23A2C', warn: '#A8813E'},
    fonts: {sans: '"Newsreader", "Noto Serif SC", serif', mono: '"JetBrains Mono", monospace', display: '"Newsreader", "LXGW WenKai", serif'},
    caption: {font: 'sans', size: 42, weight: 500, color: '#1C1A17', background: 'none', padding: [6, 24], bottom: 66, maxWidth: 1500, shadow: '0 0 12px #EFE7D4, 0 0 22px #EFE7D4, 0 0 3px #EFE7D4'},
  }}
  pacing={{lead: 0.5, hold: 0.7, tail: 1.4}}
  exports={{captions: 'burned'}}
>
  <Scene id="open" duration={3}>
    <Part id="painting" x={0} y={0} w={1920} h={1080}><Painting /></Part>
    <Animation>
      <Appear target="painting" at="start" dur={0} />
      <Tween target="painting" to={{unroll: 1}} at="start" dur={1.6} easing="easeInOutSine" />
      <Tween target="painting" to={{title: 1}} at="start" offset={1.1} dur={1.9} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="scroll">
    <Line id="l1" text="公元105年，东汉的蔡伦改进了造纸术。">公元一〇五年，东汉的蔡伦改进了造纸术。</Line>
    <Line id="l2">树皮、麻头和破布，被捣成纸浆，抄成一张张轻薄的纸。</Line>
    <Line id="l3" hold={0.6}>此后六百多年，造纸的手艺主要留在东亚。</Line>
    <Line id="l4" text="相传公元751年怛罗斯之战后，被俘的工匠把造纸术带到了撒马尔罕。">相传公元七五一年怛罗斯之战后，被俘的工匠把造纸术带到了撒马尔罕。</Line>
    <Line id="l5">四十多年后，巴格达有了纸坊，纸顺着商路传遍了伊斯兰世界。</Line>
    <Line id="l6" text="大约1150年，西班牙的沙蒂瓦有了欧洲最早的纸坊之一。">大约一一五〇年，西班牙的沙蒂瓦有了欧洲最早的纸坊之一。</Line>
    <Line id="l7" hold={4.6}>从洛阳到地中海，这张纸走了一千多年。</Line>

    <Part id="painting" x={0} y={0} w={1920} h={1080}><Painting /></Part>

    <Animation>
      <Appear target="painting" at="start" dur={0} />
      <Set target="painting" to={{unroll: 1, title: 1}} at="start" />
      <Tween target="painting" to={{far: 1}} line="l1" word="东汉" dur={2.2} easing="easeOut" />
      <Tween target="painting" to={{e105: 1}} line="l1" word="公元一〇五年" dur={1.2} easing="easeOut" />
      <Tween target="painting" to={{cai: 1}} line="l1" word="蔡伦" dur={1.4} easing="easeInOutSine" />
      <Tween target="painting" to={{peak: 1}} line="l1" word="造纸术" dur={1.8} easing="easeOut" />
      <Tween target="painting" to={{stuff: 1}} line="l2" word="树皮" dur={1.6} easing="linear" />
      <Tween target="painting" to={{peakSettle: 1}} line="l2" word="纸浆" dur={1.6} easing="easeOut" />
      <Tween target="painting" to={{road: 0.25}} line="l3" word="六百多年" dur={2.2} easing="easeInOutSine" />

      <Tween target="painting" to={{view: 2350}} line="l4" word="相传" dur={2.6} easing="easeInOutSine" />
      <Tween target="painting" to={{road: 0.75}} line="l4" word="相传" dur={2.6} easing="easeInOutSine" />
      <Tween target="painting" to={{stuff: 0}} line="l4" word="相传" dur={1} easing="easeInOutSine" />
      <Tween target="painting" to={{dunes: 1}} line="l4" word="怛罗斯" dur={1.8} easing="easeOut" />
      <Tween target="painting" to={{maker: 1}} line="l4" word="工匠" dur={1.2} easing="easeInOutSine" />
      <Tween target="painting" to={{e751: 1}} line="l4" word="撒马尔罕" dur={1.2} easing="easeOut" />

      <Tween target="painting" to={{view: 1240}} line="l5" word="四十多年后" dur={2.2} easing="easeInOutSine" />
      <Tween target="painting" to={{road: 1}} line="l5" word="四十多年后" dur={2.2} easing="easeInOutSine" />
      <Tween target="painting" to={{city: 1}} line="l5" word="巴格达" dur={1.6} easing="easeOut" />
      <Tween target="painting" to={{e794: 1}} line="l5" word="巴格达" dur={1.2} easing="easeOut" />
      <Tween target="painting" to={{citySettle: 1}} line="l5" word="伊斯兰世界" dur={1.4} easing="easeOut" />

      <Tween target="painting" to={{view: 0}} line="l6" word="大约" dur={2.2} easing="easeInOutSine" />
      <Tween target="painting" to={{e1150: 1}} line="l6" word="一一五〇年" dur={1.2} easing="easeOut" />
      <Tween target="painting" to={{coast: 1}} line="l6" word="沙蒂瓦" dur={1.6} easing="easeOut" />
      <Tween target="painting" to={{wave0: 1}} line="l6" word="欧洲" dur={0.6} easing="easeInOutSine" />
      <Tween target="painting" to={{wave1: 1}} line="l6" word="欧洲" offset={0.25} dur={0.6} easing="easeInOutSine" />
      <Tween target="painting" to={{coastSettle: 1}} line="l6" word="纸坊" dur={1.4} easing="easeOut" />

      <Tween target="painting" to={{colophon: 1}} line="l7" word="从洛阳" dur={1.6} easing="linear" />
      <Tween target="painting" to={{seal: 1}} line="l7" word="一千多年" dur={0.6} easing="linear" />
      <Tween target="painting" to={{whole: 1}} line="l7" word="一千多年" offset={3} dur={2.4} easing="easeInOutSine" />
    </Animation>
  </Scene>
</Doc>;
