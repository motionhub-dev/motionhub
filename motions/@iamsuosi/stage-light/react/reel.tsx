// Stage Light's reel: twenty seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
import type {CSSProperties, ReactNode} from 'react';
import {Easing, Sequence, interpolate, useTime} from '@motionhub/runtime';
import {Stage} from './parts/stage.tsx';
import {Plate} from './parts/plate.tsx';
import {Numeral} from './parts/numeral.tsx';
import {Link} from './parts/link.tsx';
import {Kicker} from './parts/kicker.tsx';
import {Meter} from './parts/meter.tsx';
import {Ranking} from './parts/ranking.tsx';

export const reel = {seconds: 20, width: 1920, height: 1080};
/** What happens when, for the motion's sound (sound.json): a plate lands, the light moves, a figure lands, a bar grows */
export const cues = [
  {at: 0.3, role: 'land'}, {at: 2.0, role: 'count'}, {at: 3.0, role: 'move', dur: 1.2}, {at: 3.0, role: 'draw', dur: 1.0}, {at: 3.6, role: 'land'},
  {at: 5.2, role: 'count'}, {at: 7.0, role: 'cut'}, {at: 8.3, role: 'land'}, {at: 8.3, role: 'move', dur: 0.6}, {at: 9.6, role: 'land'},
  {at: 9.6, role: 'move', dur: 0.6}, {at: 10.9, role: 'land'}, {at: 10.9, role: 'move', dur: 0.6}, {at: 13.0, role: 'move', dur: 0.8},
  {at: 13.2, role: 'land'}, {at: 13.6, role: 'draw', dur: 1.3}, {at: 14.9, role: 'count'},
];

const ease = Easing.inOutSine, out = Easing.outQuart;
const at = (t: number, from: number, to: number, a: number, b: number, easing = ease) => interpolate(t, [from, to], [a, b], {easing});

/** A box at x, y of w × h that fades in from `start` over a third of a second */
function Box({x, y, w, h, start = 0, children}: {x: number; y: number; w: number; h: number; start?: number; children: ReactNode}) {
  const t = useTime(), style: CSSProperties = {position: 'absolute', left: x, top: y, width: w, height: h, opacity: at(t, start, start + 0.35, 0, 1)};
  return <div style={style}>{children}</div>;
}

const MILESTONES = [
  {note: '1971', label: 'Intel 4004', value: '2,300'},
  {note: '1985', label: 'Intel 386', value: '275,000'},
  {note: '1993', label: 'Pentium', value: '3.1 million'},
  {note: '2000', label: 'Pentium 4', value: '42 million'},
];

function Chips() {
  const t = useTime(), dim = at(t, 3.0, 4.0, 1, 0.15);
  return (
    <>
      <Box x={200} y={170} w={680} h={200} start={0.3}><Plate title="Intel 4004" sub="1971 · the first microprocessor" lit={dim} /></Box>
      <Box x={200} y={420} w={680} h={360} start={0.8}><Numeral value={Math.round(at(t, 0.8, 2.0, 0, 2300, out))} label="transistors" lit={dim} /></Box>
      <Box x={880} y={260} w={160} h={40} start={3.0}><Link from={[10, 10]} to={[150, 10]} draw={at(t, 3.0, 4.0, 0, 1)} /></Box>
      <Box x={1040} y={170} w={680} h={200} start={3.6}><Plate title="A17 Pro" sub="2023 · Apple, in a phone" /></Box>
      <Box x={1040} y={420} w={680} h={360} start={4.2}><Numeral value={Math.round(at(t, 4.2, 5.2, 0, 19, out))} unit="BILLION" label="transistors" accent /></Box>
    </>
  );
}

function Between() {
  const t = useTime(), step = t < 1.3 ? 1 : t < 2.6 ? 2 : t < 3.9 ? 3 : 4;
  return <Box x={200} y={150} w={1520} h={480}><Ranking rows={MILESTONES} shown={step} focus={step - 1} width={1400} /></Box>;
}

function Scale() {
  const t = useTime();
  return (
    <>
      <Box x={200} y={130} w={1520} h={280} start={0.2}><Kicker eyebrow="1971 → 2023" title="About 8 million ×" /></Box>
      <Box x={200} y={470} w={1520} h={330} start={0.6}>
        <Meter items={[{label: 'Intel 4004', value: 2300, text: '2,300'}, {label: 'A17 Pro', value: 19e9, text: '19 billion'}]} grow={at(t, 0.6, 1.9, 0, 1, out)} focus={1} log width={1500} />
      </Box>
    </>
  );
}

/** The light: on the first chip, across to the second, down the list row by row, then wide over the comparison */
function light(t: number) {
  if (t < 7) return {x: at(t, 3.0, 4.2, 560, 1380), y: 470, r: at(t, 3.0, 4.2, 560, 600)};
  if (t < 13) {
    const row = t < 8.3 ? 0 : t < 9.6 ? 1 : t < 10.9 ? 2 : 3;
    const y = 210 + 96 * row, prev = 210 + 96 * Math.max(0, row - 1), since = [7, 8.3, 9.6, 10.9][row];
    return {x: 700, y: at(t, since, since + 0.6, prev, y), r: 520};
  }
  return {x: at(t, 13, 13.8, 700, 960), y: at(t, 13, 13.8, 498, 420), r: at(t, 13, 13.8, 520, 900)};
}

export default function Reel() {
  const t = useTime(), l = light(t);
  return (
    <>
      <Stage spotX={l.x} spotY={l.y} spotR={l.r} />
      <Sequence from={0} duration={7}><Chips /></Sequence>
      <Sequence from={7} duration={6}><Between /></Sequence>
      <Sequence from={13}><Scale /></Sequence>
    </>
  );
}
