// Red Pencil's sample: one example among many. Do not reuse its story, scenes, layout or timings; read it for technique, after your own scenes are planned.
import {Doc, Scene, Line, Part, Animation, Appear, Disappear, Tween, Set} from '@visotalk/jsx';
import {useProp} from '@visotalk/runtime';
import {Page} from '../parts/page.tsx';
import {Headline} from '../parts/headline.tsx';
import {Figure} from '../parts/figure.tsx';
import {PencilMark} from '../parts/pencil.tsx';
import {Ledger} from '../parts/ledger.tsx';
import {Correction} from '../parts/correction.tsx';
import {MarginNote} from '../parts/note.tsx';
import {Excerpt} from '../parts/excerpt.tsx';

const ROWS = [
  {label: 'Twelve months at $10', value: '$120'},
  {label: 'Joining fee', value: '$49'},
  {label: 'Annual fee', value: '$39'},
];

export default <Doc
  id="red-pencil-sample"
  title="Ten dollars a month?"
  poster={26}
  lang="en"
  canvas="16x9"
  theme="visotalk/light"
  tokens={{
    colors: {bg: '#E7E1D4', panel: '#FBF8F1', panel2: '#F1EBDF', border: '#D6CDBB', text: '#211F1B', muted: '#6F685C', faint: '#B9AF9C', data: '#24456B', grad: '#C8352A', op: '#5E6B4E', good: '#2F6A45', bad: '#C8352A', warn: '#F0CF4F'},
    fonts: {sans: '"Newsreader", "Noto Serif SC", serif', mono: '"JetBrains Mono", monospace', display: '"Caveat", "LXGW WenKai", cursive'},
    caption: {font: 'sans', size: 36, color: '#211F1B', background: 'rgba(251, 248, 241, 0.96)', radius: 2, padding: [10, 28], bottom: 60, rule: '#C8352A', ruleSide: 'left'},
  }}
  pacing={{lead: 0.4, hold: 0.5, tail: 1}}
  exports={{captions: 'burned'}}
>
  <Part id="page"><Page folio="An example, in fine print" page="12" /></Part>

  <Scene id="claim">
    <Line id="l1" text="Say a gym advertises membership at $10 a month.">Say a gym advertises membership at ten dollars a month.</Line>

    <Part id="headline" x={176} y={140} w={1180} h={300}><Headline kicker="Membership" title="Ten dollars a month?" deck="What the first year really costs" /></Part>
    <Part id="price" x={176} y={500} w={1000} h={340}>{() => (
      <div style={{position: 'relative', paddingLeft: 40, paddingTop: 40}}>
        <Figure value={10} prefix="$" unit="a month" label="as advertised" size={210} />
        <PencilMark kind="circle" x={40} y={40} width={330} height={200} draw={useProp('circle', 0)} seed="price" />
      </div>
    )}</Part>
    <Animation>
      <Appear target="page" at="start" dur={0} />
      <Appear target="headline" line="l1" word="advertises" />
      <Appear target="price" line="l1" word="ten dollars" />
      <Tween target="price" to={{circle: 1}} line="l1" word="a month" dur={0.9} easing="easeInOutSine" />
    </Animation>
  </Scene>

  <Scene id="terms">
    <Line id="lq" text="But the agreement says more, in clause 4.2." hold={0.6}>But the agreement says more, in clause four point two.</Line>

    <Part id="clause" x={176} y={200} w={1180} h={460}>{() => (
      <Excerpt text="Members pay a one-time joining fee of $49 and an annual fee of $39, charged on each anniversary of joining."
        mark="joining fee of $49 and an annual fee of $39" draw={useProp('draw', 0)} source="Membership agreement, clause 4.2 (an example)" />
    )}</Part>
    <Animation>
      <Appear target="clause" line="lq" word="agreement" />
      <Tween target="clause" to={{draw: 1}} line="lq" word="clause" dur={1.2} easing="easeInOutSine" />
    </Animation>
  </Scene>

  <Scene id="sum">
    <Line id="l2" text="The contract adds a $49 joining fee and a $39 annual fee.">The contract adds a forty-nine dollar joining fee and a thirty-nine dollar annual fee.</Line>
    <Line id="l3" text="Over the first year, that is $208." hold={0.6}>Over the first year, that is two hundred and eight dollars.</Line>

    <Part id="ledger" x={176} y={150} w={1180} h={560}>{() => (
      <Ledger rows={ROWS} total={{label: 'First year', value: '$208'}} shown={useProp('shown', 1)} highlight={3} swipe={useProp('swipe', 0)} width={1100} />
    )}</Part>
    <Animation>
      <Appear target="ledger" line="l2" word="contract" />
      <Set target="ledger" to={{shown: 2}} line="l2" word="joining fee" />
      <Set target="ledger" to={{shown: 3}} line="l2" word="annual fee" />
      <Set target="ledger" to={{shown: 4}} line="l3" word="two hundred" />
      <Tween target="ledger" to={{swipe: 1}} line="l3" word="two hundred" dur={0.8} easing="easeOutSine" />
    </Animation>
  </Scene>

  <Scene id="price">
    <Line id="l4" text="So the real price is about $17.33 a month." hold={1}>So the real price is about seventeen dollars and thirty-three cents a month.</Line>

    <Part id="fix" x={150} y={260} w={1100} h={480}>{() => (
      <div style={{paddingLeft: 40}}>
        <Correction wrong="$10" right="$17.33" strike={useProp('strike', 0)} write={useProp('write', 0)} size={210} label="a month, over the first year" />
      </div>
    )}</Part>
    <Part id="note" x={680} y={260} w={1100} h={420}>{() => (
      <div style={{paddingLeft: 760, paddingTop: 20}}>
        <MarginNote text={'the real\nprice'} write={useProp('write', 0)} to={[-700, 100]} lead={useProp('lead', 0)} />
      </div>
    )}</Part>
    <Animation>
      <Appear target="fix" at="start" />
      <Tween target="fix" to={{strike: 1}} line="l4" word="real price" dur={0.5} easing="easeOutSine" />
      <Tween target="fix" to={{write: 1}} line="l4" word="seventeen dollars" dur={1.2} easing="linear" />
      <Appear target="note" line="l4" word="real price" dur={0} />
      <Tween target="note" to={{write: 1}} line="l4" word="real price" dur={0.9} easing="linear" />
      <Tween target="note" to={{lead: 1}} line="l4" word="a month" dur={0.6} easing="easeInOutSine" />
    </Animation>
  </Scene>
</Doc>;
