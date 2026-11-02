// Field Atlas's sample: one example among many. Do not reuse its story, scenes, layout or timings; read it for technique, after your own scenes are planned.
// The paths of totality are NASA GSFC's predictions by Fred Espenak (public domain), in demo/data/eclipses.json; the close view's rivers and
// borders are Natural Earth 1:10m (public domain), in demo/data/southern-illinois.json. The states each path crossed are NASA's lists
// (2017: fourteen, Iowa's corner among them; 2024: fifteen, with corners of Tennessee and Michigan); the crossing is where the central lines meet.
import {Doc, Scene, Line, Part, Animation, Appear, Tween, Set} from '@visotalk/jsx';
import {useProp} from '@visotalk/runtime';
import {Atlas, Layer} from '../parts/atlas.tsx';
import {Route} from '../parts/route.tsx';
import {Regions} from '../parts/regions.tsx';
import {Legend} from '../parts/legend.tsx';
import {Place} from '../parts/place.tsx';
import {Plate} from '../parts/plate.tsx';
import {Note} from '../parts/note.tsx';
import {Locator} from '../parts/locator.tsx';
import {features, unit, type LonLat} from '../parts/geo.ts';
import ECLIPSES from './data/eclipses.json';
import LOCAL from './data/southern-illinois.json';

const E17 = ECLIPSES.e2017 as {north: LonLat[]; south: LonLat[]; center: LonLat[]};
const E24 = ECLIPSES.e2024 as {north: LonLat[]; south: LonLat[]; center: LonLat[]};

const IN_2017 = ['US-OR', 'US-ID', 'US-MT', 'US-WY', 'US-NE', 'US-KS', 'US-IA', 'US-MO', 'US-IL', 'US-KY', 'US-TN', 'US-GA', 'US-NC', 'US-SC'];
const IN_2024 = ['US-TX', 'US-OK', 'US-AR', 'US-MO', 'US-IL', 'US-KY', 'US-TN', 'US-IN', 'US-OH', 'US-MI', 'US-PA', 'US-NY', 'US-VT', 'US-NH', 'US-ME'];
const ONCE = Object.fromEntries(IN_2017.map((id) => [id, 1]));
const TOTAL = Object.fromEntries(IN_2024.map((id) => [id, IN_2017.includes(id) ? 2 : 1]));
const BOTH = Object.fromEntries(IN_2024.filter((id) => IN_2017.includes(id)).map((id) => [id, 2]));

const RIVERS = features(LOCAL.rivers.map((r, i) => ({id: `river-${i}`, name: r.name, coords: [r.coords as LonLat[]], lines: true})));
const BORDERS = features(LOCAL.borders.map((b, i) => ({id: `border-${i}`, coords: [b.coords as LonLat[]], lines: true})));
const LAKES = features(LOCAL.lakes.map((l, i) => ({id: `lake-${i}`, name: l.name, coords: l.coords as LonLat[][]})));

const CROSS: LonLat = [-89.271, 37.642];

function Map() {
  const zoom = useProp('zoom', 0), detail = useProp('detail', 0);
  const d17 = useProp('draw17', 0), d24 = useProp('draw24', 0);
  const told17 = useProp('told17', 0), told24 = useProp('told24', 0);
  const follow = useProp('ride', 0), lift = useProp('lift', 0), dim = useProp('dim', 0);
  return (
    <Atlas lon={useProp('lon', 8)} lat={useProp('lat', 12)} zoom={zoom} detail={detail}
      follow={follow < 1 ? E17.center : E24.center} followAt={follow < 1 ? d17 : d24} followMix={useProp('mix', 0)}
      under={<>
        <Regions values={ONCE} max={2} reach={E17.center} fill={d17} dim={dim} />
        <Regions values={TOTAL} max={2} reach={E24.center} fill={d24} dim={dim} />
      </>}>
      {lift > 0.001 && <Regions values={BOTH} max={2} reach={E24.center} fill={d24} lift={lift} dim={dim} />}
      <Layer data={LAKES} kind="lake" opacity={detail} />
      <Layer data={BORDERS} kind="border" opacity={detail} />
      <Layer data={RIVERS} kind="river" opacity={detail} />
      <Place lon={-126} lat={29} name="Pacific Ocean" kind="water" zoomIn={0.6} zoomOut={3.2} show={useProp('pacific', 1)} />
      <Place lon={-69} lat={30} name="Atlantic Ocean" kind="water" zoomIn={0.6} zoomOut={3.2} show={useProp('atlantic', 1)} />
      <Place lon={-90.2} lat={26.9} name="Gulf of Mexico" kind="water" size={34} zoomIn={1.3} zoomOut={1.85} show={useProp('gulf', 1)} />
      <Route path={E17.center} left={E17.north} right={E17.south} draw={d17} told={told17} head={useProp('head17', 1)} corridor={1 - detail} shade={7000} />
      <Route path={E24.center} left={E24.north} right={E24.south} draw={d24} told={told24} head={useProp('head24', 1)} corridor={1 - detail} shade={7000} />
      <Place lon={-120.5} lat={42.95} name="Oregon" kind="region" zoomIn={1.2} zoomOut={4} show={useProp('oregon', 0)} />
      <Place lon={-80.85} lat={32.95} name="South Carolina" kind="region" zoomIn={1.2} zoomOut={4} show={useProp('carolina', 0)} />
      <Place lon={-107.2} lat={30.1} name="Mexico" kind="country" zoomIn={1} zoomOut={4} show={useProp('mexico', 0)} />
      <Place lon={-87.65} lat={41.85} name="Chicago" zoomIn={2.6} zoomOut={4.3} show={useProp('cities', 0)} />
      <Place lon={-90.24} lat={38.63} name="St. Louis" side="left" zoomIn={3.0} zoomOut={5.6} show={useProp('cities', 0)} />
      <Place lon={-90.05} lat={35.15} name="Memphis" side="left" zoomIn={3.0} zoomOut={5.0} show={useProp('cities', 0)} />
      <Place lon={-86.78} lat={36.16} name="Nashville" zoomIn={3.0} zoomOut={5.0} show={useProp('cities', 0)} />
      <Place lon={-87.56} lat={37.97} name="Evansville" zoomIn={4.4} zoomOut={6.4} show={useProp('cities', 0)} />
      <Place lon={-88.6} lat={37.08} name="Paducah" zoomIn={4.8} zoomOut={6.8} show={useProp('cities', 0)} />
      <Place lon={-89.52} lat={37.31} name="Cape Girardeau" zoomIn={6.6} side="left" size={36} show={useProp('towns', 0)} />
      <Place lon={-89.9} lat={37.84} name="Mississippi" kind="water" size={34} zoomIn={6.8} show={useProp('towns', 0) * (1 - useProp('avgShow', 0))} />
      <Place lon={-89.83} lat={37.52} name="Missouri" kind="region" zoomIn={6.6} show={useProp('towns', 0) * (1 - useProp('avgShow', 0))} />
      <Place lon={-88.95} lat={37.56} name="Illinois" kind="region" zoomIn={6.6} show={useProp('towns', 0)} />
      <Place lon={-89.217} lat={37.727} name="Carbondale" note="Illinois" side="left" size={40} zoomIn={5.5} show={useProp('carbondale', 0)} />
      <Place lon={CROSS[0]} lat={CROSS[1]} name="The paths cross" kind="point" side="left" size={36} zoomIn={6.5} show={useProp('cross', 0)} ripple={useProp('ripple', 0)} />
      <Place lon={CROSS[0]} lat={CROSS[1]} name="Carbondale" kind="point" side="right" size={34} zoomOut={3.2} show={useProp('meet', 0)} ripple={useProp('ripple2', 0)} />
      <Note value={useProp('avg', 0)} unit="years" label="the average wait for totality at one spot" x={120} y={150} show={useProp('avgShow', 0)} />
      <Note value={useProp('gap', 0)} digits={1} unit="years" label="Carbondale's wait between the two" x={120} y={430} accent show={useProp('gapShow', 0)} />
      <Legend title="States in the path of totality" steps={[{value: 1, label: 'in one path'}, {value: 2, label: 'in both'}]} max={2} shown={useProp('keys', 0)}
        paths={[{label: 'path of 2017', told: told17, show: 1}, {label: 'path of 2024', told: told24, show: unit(d24 * 4)}]} source="NASA eclipse predictions" show={useProp('legend', 0)} />
      <Locator x={1680} y={250} r={112} show={useProp('locator', 1)} />
      <Plate kicker="United States · 2017 and 2024" title="Two shadows, one town" x={1010} y={110} size={78} show={useProp('title', 0)} />
      <Plate kicker="37.6° N · 89.3° W" title="Where two shadows met" size={80} show={useProp('end', 0)} />
    </Atlas>
  );
}

export default <Doc
  id="field-atlas-sample"
  title="Two shadows, one town"
  lang="en"
  canvas="16x9"
  theme="visotalk/light"
  tokens={{
    colors: {bg: '#ECE7DC', panel: '#FAF7EF', panel2: '#D3E1E3', border: '#A99D8B', text: '#22262B', muted: '#646A70', faint: '#DCD5C7', data: '#C23B26', grad: '#B98432', op: '#5F8A99', good: '#5E8A57', bad: '#B33A2B', warn: '#C98A2E'},
    fonts: {sans: '"Hanken Grotesk", "Noto Sans SC", sans-serif', mono: '"JetBrains Mono", monospace', display: '"Newsreader", "Noto Serif SC", serif'},
    caption: {font: 'sans', size: 34, weight: 500, color: '#22262B', background: 'rgba(250, 247, 239, 0.94)', radius: 2, padding: [10, 24], bottom: 56, maxWidth: 1240, shadow: '0 1px 2px rgba(34, 38, 43, 0.18)', rule: '#22262B', ruleSide: 'left'},
  }}
  pacing={{lead: 0.4, hold: 0.5, tail: 1}}
  exports={{captions: 'burned'}}
>
  <Part id="map">{() => <Map />}</Part>

  <Scene id="first" title="The first shadow">
    <Line id="l1" text="On August 21, 2017, the Moon's shadow crossed the United States, from Oregon to South Carolina.">On August twenty-first, twenty seventeen, the Moon's shadow crossed the United States, from Oregon to South Carolina.</Line>
    <Line id="l2" text="In fourteen states, day turned to night for up to two and a half minutes.">In fourteen states, day turned to night for up to two and a half minutes.</Line>
    <Animation>
      <Appear target="map" at="start" dur={0.6} />
      <Tween target="map" to={{title: 1}} at="start" offset={0.3} dur={1.4} easing="easeOutSine" />
      <Tween target="map" to={{lon: -97, lat: 38.5, zoom: 1.75}} at="start" until={{line: "l1", word: "crossed"}} easing="easeInOutSine" />
      <Tween target="map" to={{title: 0}} line="l1" word="Moon's shadow" dur={0.8} easing="easeInSine" />
      <Tween target="map" to={{draw17: 1}} line="l1" word="crossed" until={{line: "l1", edge: "end"}} easing="easeInOutSine" />
      <Tween target="map" to={{mix: 0.55, zoom: 2.2, atlantic: 0}} line="l1" word="crossed" dur={1.4} easing="easeInOutSine" />
      <Tween target="map" to={{oregon: 1}} line="l1" word="Oregon" dur={0.6} easing="easeOutSine" />
      <Tween target="map" to={{carolina: 1}} line="l1" word="South Carolina" dur={0.6} easing="easeOutSine" />
      <Tween target="map" to={{mix: 0, zoom: 1.75}} line="l1" edge="end" offset={-0.3} dur={1.6} easing="easeInOutSine" />
      <Tween target="map" to={{head17: 0}} line="l1" edge="end" offset={0.4} dur={0.6} />
      <Tween target="map" to={{legend: 1, keys: 1, atlantic: 1}} line="l2" word="fourteen states" dur={0.8} easing="easeOutSine" />
    </Animation>
  </Scene>

  <Scene id="second" title="The second shadow">
    <Line id="l3" text="Seven years later, a second shadow came up from Mexico, and crossed the first.">Seven years later, a second shadow came up from Mexico, and crossed the first.</Line>
    <Line id="l4" text="Four states saw both, and the two paths cross just south of Carbondale, Illinois." hold={0.8}>Four states saw both, and the two paths cross just south of Carbondale, Illinois.</Line>
    <Animation>
      <Tween target="map" to={{told17: 1, oregon: 0, carolina: 0, gulf: 0, atlantic: 0}} line="l3" dur={1} easing="easeInOutSine" />
      <Set target="map" to={{ride: 1}} line="l3" />
      <Tween target="map" to={{mexico: 1}} line="l3" word="Mexico" dur={0.6} easing="easeOutSine" />
      <Tween target="map" to={{mexico: 0}} line="l3" word="crossed the first" dur={0.5} easing="easeInSine" />
      <Tween target="map" to={{keys: 2}} line="l3" word="Mexico" offset={0.5} dur={0.8} easing="easeOutSine" />
      <Tween target="map" to={{draw24: 1}} line="l3" word="second shadow" until={{line: "l3", edge: "end"}} offset={0} easing="easeInOutSine" />
      <Tween target="map" to={{mix: 0.85, zoom: 2.05}} line="l3" dur={1.2} easing="easeInOutSine" />
      <Tween target="map" to={{head24: 0}} line="l3" edge="end" offset={0.4} dur={0.6} />
      <Tween target="map" to={{mix: 0, zoom: 1.75}} line="l3" edge="end" offset={-0.2} dur={1.4} easing="easeInOutSine" />
      <Tween target="map" to={{atlantic: 1}} line="l4" word="saw both" dur={0.8} easing="easeOutSine" />
      <Tween target="map" to={{lift: 1}} line="l4" word="Four states" dur={0.9} easing="easeOutSine" />
      <Tween target="map" to={{cities: 1}} line="l4" word="the two paths" dur={0.4} />
      <Tween target="map" to={{legend: 0, told17: 0}} line="l4" word="the two paths" dur={0.8} easing="easeInSine" />
      <Tween target="map" to={{lon: -89.36, lat: 37.5}} line="l4" word="the two paths" dur={1.1} easing="easeInOutSine" />
      <Tween target="map" to={{zoom: 7.3}} line="l4" word="the two paths" offset={0.5} until={{line: "l4", edge: "end", offset: 0.6}} easing="easeInOut" />
      <Tween target="map" to={{detail: 1, dim: 1}} line="l4" word="the two paths" offset={0.4} dur={1.3} easing="easeInOutSine" />
      <Tween target="map" to={{carbondale: 1}} line="l4" word="Carbondale" dur={0.6} easing="easeOutSine" />
      <Tween target="map" to={{cross: 1, towns: 1}} line="l4" word="Illinois" dur={0.8} easing="easeOutBack(1.6)" />
      <Tween target="map" to={{ripple: 1}} line="l4" word="Illinois" offset={0.2} dur={2.2} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="wait" title="The wait">
    <Line id="l5" text="On average, a total eclipse returns to the same spot about once every 375 years.">On average, a total eclipse returns to the same spot about once every three hundred and seventy-five years.</Line>
    <Line id="l6" text="Carbondale waited less than seven." hold={0.6}>Carbondale waited less than seven.</Line>
    <Line id="l7" text="From far enough away, the two shadows meet at a single point." hold={1.4}>From far enough away, the two shadows meet at a single point.</Line>
    <Animation>
      <Tween target="map" to={{lon: -89.38, lat: 37.48, zoom: 7.15}} line="l5" until={{line: "l6", edge: "end"}} easing="easeInOutSine" />
      <Tween target="map" to={{avgShow: 1}} line="l5" word="once every" dur={0.8} easing="easeOutSine" />
      <Tween target="map" to={{avg: 375}} line="l5" word="once every" dur={1.6} easing="easeOutQuart" />
      <Tween target="map" to={{gapShow: 1}} line="l6" word="Carbondale" dur={0.8} easing="easeOutSine" />
      <Tween target="map" to={{gap: 6.6}} line="l6" word="waited" dur={1.2} easing="easeOutQuart" />
      <Tween target="map" to={{avgShow: 0, gapShow: 0, towns: 0}} line="l7" dur={0.8} easing="easeInSine" />
      <Tween target="map" to={{locator: 0, pacific: 0, atlantic: 0}} line="l7" dur={0.5} easing="easeInSine" />
      <Tween target="map" to={{lon: -92, lat: 33, zoom: 0.25, detail: 0, dim: 0.4, cross: 0, told17: 1, told24: 1}} line="l7" until={{line: "l7", edge: "end"}} easing="easeInOutSine" />
      <Tween target="map" to={{meet: 1}} line="l7" word="single point" dur={0.8} easing="easeOutBack(1.6)" />
      <Tween target="map" to={{ripple2: 1}} line="l7" word="single point" offset={0.2} dur={2.2} easing="linear" />
      <Tween target="map" to={{lon: -78}} line="l7" edge="end" until="end" easing="linear" />
      <Tween target="map" to={{end: 1}} line="l7" edge="end" offset={-0.2} dur={1.2} easing="easeOutSine" />
    </Animation>
  </Scene>
</Doc>;
