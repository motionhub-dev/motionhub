// Stage Light's sample: one example among many. Do not reuse its story, scenes, layout or timings; read it for technique, after your own scenes are planned.
import {Doc, Scene, Line, Part, Animation, Appear, Tween, Set} from '@visotalk/jsx';
import {useProp} from '@visotalk/runtime';
import {Stage} from '../parts/stage.tsx';
import {Plate} from '../parts/plate.tsx';
import {Numeral} from '../parts/numeral.tsx';
import {Link} from '../parts/link.tsx';
import {Kicker} from '../parts/kicker.tsx';
import {Meter} from '../parts/meter.tsx';
import {Ranking} from '../parts/ranking.tsx';

const MILESTONES = [
  {note: '1971', label: 'Intel 4004', value: '2,300'},
  {note: '1985', label: 'Intel 386', value: '275,000'},
  {note: '1993', label: 'Pentium', value: '3.1 million'},
  {note: '2000', label: 'Pentium 4', value: '42 million'},
];

export default <Doc
  id="stage-light-sample"
  title="From 2,300 to 19 billion"
  poster={11.7}
  lang="en"
  canvas="16x9"
  theme="visotalk/dark"
  tokens={{
    colors: {bg: '#121316', panel: '#1D1F24', panel2: '#26292F', border: '#34383F', text: '#EDE9E2', muted: '#8E9198', faint: '#3B3F47', data: '#F2B33D', grad: '#F3E3C3', op: '#9AA7FF', good: '#7FC79A', bad: '#E5675A', warn: '#F2B33D'},
    fonts: {sans: '"Hanken Grotesk", "Noto Sans SC", sans-serif', mono: '"JetBrains Mono", monospace', display: '"Big Shoulders Display", "Noto Sans SC", sans-serif'},
    caption: {font: 'sans', size: 36, weight: 500, color: '#EDE9E2', background: 'none', padding: [4, 22], bottom: 66, shadow: '0 2px 12px rgba(0, 0, 0, 0.9)', rule: '#F2B33D', ruleSide: 'left'},
  }}
  pacing={{lead: 0.3, hold: 0.35, tail: 0.8}}
  exports={{captions: 'burned'}}
>
  <Part id="stage">{() => <Stage spotX={useProp('spotX', 560)} spotY={useProp('spotY', 470)} spotR={useProp('spotR', 560)} />}</Part>

  <Scene id="chips">
    <Line id="l1" text="In 1971, Intel's first microprocessor held 2,300 transistors.">In nineteen seventy-one, Intel's first microprocessor held two thousand three hundred transistors.</Line>
    <Line id="l2" text="About fifty years later, Apple's A17 Pro, in a phone, holds 19 billion." hold={0.5}>About fifty years later, Apple's A seventeen Pro, in a phone, holds nineteen billion.</Line>

    <Part id="old" x={200} y={170} w={680} h={200}>{() => <Plate title="Intel 4004" sub="1971 · the first microprocessor" lit={useProp('lit', 1)} />}</Part>
    <Part id="old-n" x={200} y={420} w={680} h={360}>{() => <Numeral value={useProp('value', 0)} label="transistors" lit={useProp('lit', 1)} />}</Part>
    <Part id="link" x={880} y={260} w={160} h={40}>{() => <Link from={[10, 10]} to={[150, 10]} draw={useProp('draw', 0)} />}</Part>
    <Part id="new" x={1040} y={170} w={680} h={200}>{() => <Plate title="A17 Pro" sub="2023 · Apple, in a phone" lit={useProp('lit', 1)} />}</Part>
    <Part id="new-n" x={1040} y={420} w={680} h={360}>{() => <Numeral value={useProp('value', 0)} unit="billion" label="transistors" accent lit={useProp('lit', 1)} />}</Part>
    <Animation>
      <Appear target="stage" at="start" dur={0} />
      <Appear target="old" line="l1" word="first microprocessor" />
      <Appear target="old-n" line="l1" word="two thousand" />
      <Tween target="old-n" to={{value: 2300}} line="l1" word="two thousand" dur={1.2} easing="easeOutQuart" />
      <Tween target="stage" to={{spotX: 1380, spotR: 600}} line="l2" word="fifty years later" dur={1.4} easing="easeInOutSine" />
      <Tween target={['old', 'old-n']} to={{lit: 0.15}} line="l2" word="fifty years later" dur={1.2} easing="easeInOutSine" />
      <Appear target="link" line="l2" word="fifty years later" dur={0} />
      <Tween target="link" to={{draw: 1}} line="l2" word="fifty years later" dur={1.2} easing="easeInOutSine" />
      <Appear target="new" line="l2" word="A seventeen Pro" />
      <Appear target="new-n" line="l2" word="nineteen billion" />
      <Tween target="new-n" to={{value: 19}} line="l2" word="nineteen billion" dur={1} easing="easeOutQuart" />
    </Animation>
  </Scene>

  <Scene id="between">
    <Line id="lb" text="In between, the 386 held 275,000, the first Pentium 3.1 million, and the Pentium 4 42 million." hold={0.5}>In between, the three eighty-six held two hundred seventy-five thousand, the first Pentium three point one million, and the Pentium four forty-two million.</Line>

    <Part id="list" x={200} y={150} w={1520} h={480}>{() => <Ranking rows={MILESTONES} shown={useProp('shown', 1)} focus={useProp('focus', 0)} width={1400} />}</Part>
    <Animation>
      <Set target="stage" to={{spotX: 700, spotY: 210, spotR: 520}} at="start" />
      <Appear target="list" at="start" />
      <Set target="list" to={{shown: 2, focus: 1}} line="lb" word="three eighty-six" />
      <Tween target="stage" to={{spotY: 306}} line="lb" word="three eighty-six" dur={0.9} easing="easeInOutSine" />
      <Set target="list" to={{shown: 3, focus: 2}} line="lb" word="first Pentium" />
      <Tween target="stage" to={{spotY: 402}} line="lb" word="first Pentium" dur={0.9} easing="easeInOutSine" />
      <Set target="list" to={{shown: 4, focus: 3}} line="lb" word="Pentium four" />
      <Tween target="stage" to={{spotY: 498}} line="lb" word="Pentium four" dur={0.9} easing="easeInOutSine" />
    </Animation>
  </Scene>

  <Scene id="scale">
    <Line id="l3" text="That is about 8 million times as many, on a chip you carry in your pocket." hold={0.6}>That is about eight million times as many, on a chip you carry in your pocket.</Line>

    <Part id="head" x={200} y={130} w={1520} h={280}><Kicker eyebrow="1971 → 2023" title="About 8 million ×" /></Part>
    <Part id="meter" x={200} y={470} w={1520} h={330}>{() => (
      <Meter items={[{label: 'Intel 4004', value: 2300, text: '2,300'}, {label: 'A17 Pro', value: 19e9, text: '19 billion'}]} grow={useProp('grow', 0)} focus={1} log width={1500} />
    )}</Part>
    <Animation>
      <Set target="stage" to={{spotX: 960, spotY: 420, spotR: 900}} at="start" />
      <Appear target="head" line="l3" word="eight million" />
      <Appear target="meter" line="l3" word="eight million" dur={0} />
      <Tween target="meter" to={{grow: 1}} line="l3" word="eight million" dur={1.4} easing="easeOutQuart" />
    </Animation>
  </Scene>
</Doc>;
