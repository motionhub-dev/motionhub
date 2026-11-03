// Red Pencil's reel: twenty seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
import type {ReactNode} from 'react';
import {Easing, Sequence, interpolate, useTime} from '@motionhub/runtime';
import {Page} from './parts/page.tsx';
import {Headline} from './parts/headline.tsx';
import {Figure} from './parts/figure.tsx';
import {PencilMark} from './parts/pencil.tsx';
import {Ledger} from './parts/ledger.tsx';
import {Correction} from './parts/correction.tsx';
import {MarginNote} from './parts/note.tsx';
import {Excerpt} from './parts/excerpt.tsx';

export const reel = {seconds: 20, width: 1920, height: 1080};
/** What happens when, for the motion's sound (sound.json): the page is printed, the pencil circles, strikes, writes and ticks, the total counts, the page turns */
export const cues = [
  {at: 0.1, role: 'land'}, {at: 0.6, role: 'land'}, {at: 1.3, role: 'draw', dur: 0.9}, {at: 4.0, role: 'cut'}, {at: 4.7, role: 'draw', dur: 1.2},
  {at: 7.2, role: 'cut'}, {at: 7.9, role: 'land'}, {at: 8.6, role: 'land'}, {at: 9.3, role: 'count'}, {at: 9.5, role: 'draw', dur: 0.7},
  {at: 10.4, role: 'draw', dur: 0.7}, {at: 11.6, role: 'cut'}, {at: 11.9, role: 'draw', dur: 0.4}, {at: 12.5, role: 'draw', dur: 1.1},
  {at: 13.7, role: 'draw', dur: 0.7}, {at: 14.5, role: 'draw', dur: 0.6}, {at: 15.8, role: 'cut'}, {at: 16.7, role: 'land'},
  {at: 17.2, role: 'draw', dur: 0.4}, {at: 17.9, role: 'draw', dur: 0.4},
];

// The pencil eases in and out; writing is linear (MOTION.md §5).
const stroke = (t: number, from: number, to: number) => interpolate(t, [from, to], [0, 1], {easing: Easing.inOutSine});
const write = (t: number, from: number, to: number) => interpolate(t, [from, to], [0, 1]);

/** Print at x, y of w × h: it is there, appearing in place within a fifth of a second; it never slides or moves once placed */
function Print({x, y, w, h, start = 0, children}: {x: number; y: number; w: number; h: number; start?: number; children: ReactNode}) {
  const t = useTime();
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity: interpolate(t, [start, start + 0.2], [0, 1])}}>{children}</div>;
}

const ROWS = [
  {label: 'Twelve months at $10', value: '$120'},
  {label: 'Joining fee', value: '$49'},
  {label: 'Annual fee', value: '$39'},
];

/** The claim as printed, and the pencil circling the price */
function Claim() {
  const t = useTime();
  return (
    <>
      <Print x={176} y={140} w={1180} h={300}><Headline kicker="Membership" title="Ten dollars a month?" deck="What the first year really costs" /></Print>
      <Print x={176} y={500} w={1000} h={340} start={0.6}>
        <div style={{position: 'relative', paddingLeft: 40, paddingTop: 40}}>
          <Figure value={10} prefix="$" unit="a month" label="as advertised" size={210} />
          <PencilMark kind="circle" x={40} y={40} width={330} height={200} draw={stroke(t, 1.3, 2.2)} seed="price" />
        </div>
      </Print>
    </>
  );
}

/** The clause that decides, underlined as it is read */
function Clause() {
  const t = useTime();
  return (
    <Print x={176} y={200} w={1180} h={460}>
      <Excerpt text="Members pay a one-time joining fee of $49 and an annual fee of $39, charged on each anniversary of joining."
        mark="joining fee of $49 and an annual fee of $39" draw={stroke(t, 0.7, 1.9)} source="Membership agreement, clause 4.2 (an example)" />
    </Print>
  );
}

/** The sum printed row by row, the total highlighted, then boxed by the pencil */
function Sum() {
  const t = useTime(), shown = t < 0.7 ? 1 : t < 1.4 ? 2 : t < 2.1 ? 3 : 4;
  return (
    <>
      <Print x={176} y={150} w={1180} h={560}>
        <Ledger rows={ROWS} total={{label: 'First year', value: '$208'}} shown={shown} highlight={3} swipe={interpolate(t, [2.3, 3.0], [0, 1], {easing: Easing.outCubic})} width={1100} />
      </Print>
      <Print x={176} y={150} w={1180} h={560}>
        <PencilMark kind="box" x={974} y={228} width={130} height={72} draw={stroke(t, 3.2, 3.9)} seed="total" />
      </Print>
    </>
  );
}

/** The advertised figure struck, the real one written above, and the verdict in the margin with its leader */
function Price() {
  const t = useTime();
  return (
    <>
      <Print x={150} y={260} w={1100} h={480}>
        <div style={{paddingLeft: 40}}>
          <Correction wrong="$10" right="$17.33" strike={stroke(t, 0.3, 0.7)} write={write(t, 0.9, 2.0)} size={210} label="a month, over the first year" />
        </div>
      </Print>
      <Print x={680} y={260} w={1100} h={420}>
        <div style={{paddingLeft: 760, paddingTop: 20}}>
          <MarginNote text={'the real\nprice'} write={write(t, 2.1, 2.8)} to={[-700, 100]} lead={stroke(t, 2.9, 3.5)} />
        </div>
      </Print>
    </>
  );
}

const PLANS = [
  {label: 'This gym', note: 'a month, first year', value: '$17.33'},
  {label: 'The one down the road', note: 'no fees', value: '$15.00'},
];

/** Two offers printed line by line: the pencil crosses one and ticks the other */
function Offers() {
  const t = useTime();
  return (
    <>
      <Print x={176} y={140} w={1180} h={260}><Headline kicker="Before you sign" title="Compare the real price" /></Print>
      <Print x={176} y={420} w={1180} h={300} start={0.3}>
        <div style={{position: 'relative'}}>
          <Ledger rows={PLANS} shown={t < 0.9 ? 1 : 2} width={1100} />
          <PencilMark kind="cross" x={1112} y={14} width={56} height={56} draw={stroke(t, 1.4, 1.8)} seed="cross" />
          <PencilMark kind="tick" x={1112} y={95} width={56} height={56} draw={stroke(t, 2.1, 2.5)} seed="tick" />
        </div>
      </Print>
    </>
  );
}

export default function Reel() {
  return (
    <>
      <Page folio="An example, in fine print" page="12" />
      <Sequence from={0} duration={4}><Claim /></Sequence>
      <Sequence from={4} duration={3.2}><Clause /></Sequence>
      <Sequence from={7.2} duration={4.4}><Sum /></Sequence>
      <Sequence from={11.6} duration={4.2}><Price /></Sequence>
      <Sequence from={15.8}><Offers /></Sequence>
    </>
  );
}
