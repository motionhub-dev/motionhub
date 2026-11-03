// Evidence Board's reel: twenty-two seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
// The words on the cards are quoted from NASA's technical air-to-ground voice transcription (13 April 1970) and the
// Report of Apollo 13 Review Board (June 1970), both in the public domain, cut with … .
import {Easing, interpolate, useTime} from '@motionhub/runtime';
import {Board} from './parts/board.tsx';
import {Card, pinAt} from './parts/card.tsx';
import {Document} from './parts/document.tsx';
import {Thread} from './parts/thread.tsx';
import {Chart} from './parts/chart.tsx';
import {CaseTitle} from './parts/title.tsx';
import {DateRail} from './parts/timeline.tsx';
import {Claim} from './parts/claim.tsx';

export const reel = {seconds: 22, width: 1920, height: 1080};
/** What happens when, for the motion's sound (sound.json): a pin is pressed in, a card is set down, a thread runs between cards, a highlight lands, a bar is drawn */
export const cues = [
  {at: 0, role: 'move', dur: 2.4}, {at: 2.2, role: 'land'}, {at: 2.5, role: 'move', dur: 1.3}, {at: 3.6, role: 'draw', dur: 1},
  {at: 3.8, role: 'land'}, {at: 4.1, role: 'move', dur: 1.2}, {at: 6, role: 'count'}, {at: 7.6, role: 'move', dur: 1.4},
  {at: 8.8, role: 'draw', dur: 1.2}, {at: 9.1, role: 'land'}, {at: 12.3, role: 'count'}, {at: 13.4, role: 'draw', dur: 0.9}, {at: 13.8, role: 'land'},
  {at: 15.5, role: 'count'}, {at: 16.1, role: 'count'}, {at: 16.7, role: 'count'}, {at: 16.8, role: 'move', dur: 1.2},
  {at: 17.6, role: 'draw', dur: 0.9}, {at: 17.9, role: 'land'}, {at: 18.4, role: 'draw', dur: 0.5}, {at: 19, role: 'count'},
  {at: 19.1, role: 'move', dur: 1.5}, {at: 19.3, role: 'draw', dur: 1.1}, {at: 20, role: 'draw', dur: 1.2},
];

const glide = Easing.bezier(0.45, 0, 0.15, 1), lin = Easing.linear;
const at = (t: number, from: number, to: number, a = 0, b = 1, easing = lin) => interpolate(t, [from, to], [a, b], {easing});

// the board, designed whole: the claim top left, the sources left to right in the order they happened, the figure by its source, the rail along the foot
const TITLE = {x: 260, y: 110};
const CLAIM = {x: 300, y: 330, w: 760};
const CALL = {x: 250, y: 680, w: 860};
const REPORT = {x: 1290, y: 300, w: 900};
const ITEM = {x: 1290, y: 900, w: 900};
const FIG = {x: 2300, y: 700, w: 900};
const RAIL = {x: 230, y: 1560, w: 2960};

const CALL_ROWS = [
  {at: '055 55 20', by: 'CMP', text: 'Okay, Houston, [[we’ve had a problem here.]]'},
  {at: '055 55 28', by: 'CC', text: 'This is Houston. Say again, please.'},
  {at: '055 55 35', by: 'CDR', text: 'Houston, we’ve had a problem. We’ve had a MAIN B BUS UNDERVOLT.'},
];
const REPORT_ROWS = [
  {text: 'It was found that the accident was not the result of a chance malfunction in a statistical sense, but rather resulted from [[an unusual combination of mistakes, coupled with a somewhat deficient and unforgiving design.]]'},
];
const ITEM_ROWS = [
  {at: 'h.', text: '… The original 1962 specifications … for the tank and heater assembly [[specified the use of 28 V dc power]] … In 1965, NR issued a revised specification which stated that the heaters [[should use a 65 V dc power supply]] … Beech ordered switches … but [[did not change the switch specifications]] to be compatible with 65 V dc.'},
];

// where each card is pinned: off the words a thread would cross, on the side its threads run to
const ROT = {claim: -2.2, call: -1.1, report: 0.7, item: -0.5, fig: 0.6};
const PINS = {claim: 0.92, call: 0.88, report: 0.035, item: 0.965, fig: 0.04};
const pin = (c: {x: number; y: number; w: number}, x: number, rot: number) => pinAt(c.x, c.w, c.y, x, rot);
const REPORT_OUT = pinAt(REPORT.x, REPORT.w, REPORT.y + 14, 0.972, ROT.report);

type Cam = {camX: number; camY: number; zoom: number; dof: number; tilt: number; turn: number; drift: number};
type Shot = {at: number; dur: number; to: Partial<Cam>; travel?: boolean; ease?: (x: number) => number};

// the camera: crane up off a leaning board, read card by card (push in, rack the rest soft, pull back), then the whole case
const START: Cam = {camX: 1040, camY: 560, zoom: 0.8, dof: 0, tilt: 36, turn: -7, drift: 0};
const SHOTS: Shot[] = [
  {at: 0, dur: 2.4, to: {camX: 975, camY: 360, zoom: 1, tilt: 0, turn: 0}, ease: Easing.bezier(0.3, 0, 0.1, 1)},
  {at: 2.5, dur: 1.3, to: {camX: 700, camY: 765, zoom: 0.9}, travel: true},
  {at: 4.1, dur: 1.2, to: {camX: 680, camY: 955, zoom: 1.42, dof: 1}},
  {at: 6.3, dur: 1.0, to: {camX: 700, camY: 740, zoom: 0.92, dof: 0}},
  {at: 7.6, dur: 1.4, to: {camX: 1300, camY: 620, zoom: 0.7}, travel: true},
  {at: 9.3, dur: 1.2, to: {camX: 1740, camY: 570, zoom: 1.5, dof: 1}},
  {at: 12.6, dur: 0.9, to: {camX: 1740, camY: 820, zoom: 0.75, dof: 0}},
  {at: 14.2, dur: 1.0, to: {camX: 1740, camY: 1170, zoom: 1.45, dof: 1}},
  {at: 16.8, dur: 1.2, to: {camX: 2750, camY: 870, zoom: 1.4}, travel: true},
  {at: 19.1, dur: 1.5, to: {camX: 1710, camY: 830, zoom: 0.53, dof: 0}},
  {at: 19.7, dur: 1.5, to: {drift: 20, tilt: 6, turn: 1}, ease: Easing.inOutSine},
];

function camera(t: number): Cam & {travel: number} {
  let cam = START, travel = 0;
  for (const s of SHOTS) {
    if (t <= s.at) break;
    const p = (s.ease ?? glide)(Math.min(1, (t - s.at) / s.dur));
    const next = {...cam};
    for (const k of Object.keys(s.to) as (keyof Cam)[]) next[k] = cam[k] + ((s.to[k] as number) - cam[k]) * p;
    if (s.travel && p < 1) travel = p;
    cam = next;
  }
  return {...cam, travel};
}

// which card the camera reads while the rest go soft: 2 the call, 4 the report, 5 item h, 6 the figure
const reading = (t: number) => (t < 7.6 ? 2 : t < 12.6 ? 4 : t < 16.8 ? 5 : 6);

export default function Reel() {
  const t = useTime(), cam = camera(t), on = reading(t);
  const soft = (n: number) => (n === on ? 0 : cam.dof);
  return (
    <Board camX={cam.camX} camY={cam.camY} zoom={cam.zoom} drift={cam.drift} tilt={cam.tilt} turn={cam.turn} travel={cam.travel}>
      <div style={{position: 'absolute', left: TITLE.x, top: TITLE.y}}>
        <CaseTitle kicker="APOLLO 13 · APRIL–JUNE 1970" title="What broke, and how we know" show={at(t, 0, 1.4, 0, 1, Easing.outQuart)} width={1500} />
      </div>
      <DateRail x={RAIL.x} y={RAIL.y} w={RAIL.w} draw={at(t, 19.3, 20.4, 0, 1, Easing.inOutSine)} stops={[
        {at: CALL.x + CALL.w / 2, date: '13 APR 1970', label: 'the call'},
        {at: REPORT.x + REPORT.w / 2, date: '15 JUN 1970', label: 'the finding'},
        {at: FIG.x + FIG.w / 2, date: '15 JUN 1970', label: 'the figures'},
      ]} />
      <Card x={CLAIM.x} y={CLAIM.y} w={CLAIM.w} rot={ROT.claim} pin={at(t, 1.2, 2.2)} pinX={PINS.claim} focus={soft(1)} hang={at(t, 6.7, 7.9)} paper="none">
        <Claim claim="Houston, we have a problem." who="As usually quoted" width={CLAIM.w} />
      </Card>
      <Card x={CALL.x} y={CALL.y} w={CALL.w} rot={ROT.call} pin={at(t, 2.8, 3.8)} pinX={PINS.call} focus={soft(2)} tag="NASA · Air-to-ground transcript" date="13 APR 1970">
        <Document issuer="NASA · Manned Spacecraft Center" title="Apollo 13 Technical Air-to-Ground Voice Transcription" rows={CALL_ROWS} mark={at(t, 5.3, 6.0)} size={32} />
      </Card>
      <Card x={REPORT.x} y={REPORT.y} w={REPORT.w} rot={ROT.report} pin={at(t, 8.1, 9.1)} pinX={PINS.report} focus={soft(4)} tag="NASA · Review Board report" date="15 JUN 1970">
        <Document issuer="National Aeronautics and Space Administration" title="Report of Apollo 13 Review Board" rows={REPORT_ROWS} mark={at(t, 10.5, 12.3)} size={30} />
      </Card>
      <Card x={ITEM.x} y={ITEM.y} w={ITEM.w} rot={ROT.item} pin={at(t, 12.9, 13.8)} pinX={PINS.item} focus={soft(5)} tag="NASA · Review Board report" date="15 JUN 1970">
        <Document issuer="Report of Apollo 13 Review Board" title="Chapter 5, Part 1, item h" rows={ITEM_ROWS} mark={interpolate(t, [15.0, 15.5, 15.6, 16.1, 16.2, 16.7], [0, 1, 1, 2, 2, 3], {easing: lin})} size={30} />
      </Card>
      <Card x={FIG.x} y={FIG.y} w={FIG.w} rot={ROT.fig} pin={at(t, 17.0, 17.9)} pinX={PINS.fig} focus={soft(6)} tag="Review Board · Chapter 5" date="15 JUN 1970" paper="slip">
        <Chart rows={[
          {label: 'Switches rated for', value: 28, note: 'the spacecraft supply'},
          {label: 'Heaters run on', value: 65, note: 'at KSC · item h'},
        ]} unit="V dc" max={70} ticks={20} show={interpolate(t, [17.9, 18.4, 18.5, 19.0], [0, 1, 1, 2], {easing: lin})} accent={1} />
      </Card>
      <Thread from={pin(CLAIM, PINS.claim, ROT.claim)} to={pin(CALL, PINS.call, ROT.call)} draw={at(t, 3.6, 4.6)} pulse={at(t, 20.0, 20.45)} slack={40} tacks={false} />
      <Thread from={pin(CALL, PINS.call, ROT.call)} to={pin(REPORT, PINS.report, ROT.report)} draw={at(t, 8.8, 10.0)} pulse={at(t, 20.25, 20.7)} slack={70} tacks={false} />
      <Thread from={REPORT_OUT} to={pin(ITEM, PINS.item, ROT.item)} draw={at(t, 13.4, 14.3)} pulse={at(t, 20.5, 20.95)} slack={30} />
      <Thread from={pin(ITEM, PINS.item, ROT.item)} to={pin(FIG, PINS.fig, ROT.fig)} draw={at(t, 17.6, 18.5)} pulse={at(t, 20.75, 21.2)} slack={50} tacks={false} />
    </Board>
  );
}
