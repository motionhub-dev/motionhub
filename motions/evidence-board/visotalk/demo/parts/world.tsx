// The sample's one board: the claim, the three sources, the figures, the threads and the date rail, all in board pixels under one camera.
// The words on the cards are quoted from the sources: NASA's technical air-to-ground voice transcription (13 April 1970),
// photograph S70-35703 (NASA, 17 April 1970) and the Report of Apollo 13 Review Board (NASA, June 1970), cut with … .
import {useProp} from '@visotalk/runtime';
import {Board} from '../../parts/board.tsx';
import {Card, pinAt} from '../../parts/card.tsx';
import {Document} from '../../parts/document.tsx';
import {Photo} from '../../parts/photo.tsx';
import {Thread} from '../../parts/thread.tsx';
import {Chart} from '../../parts/chart.tsx';
import {CaseTitle} from '../../parts/title.tsx';
import {DateRail} from '../../parts/timeline.tsx';
import {Claim} from '../../parts/claim.tsx';

export const TITLE = {x: 260, y: 110};
export const CLAIM = {x: 300, y: 330, w: 760};
export const CALL = {x: 250, y: 680, w: 860};
export const PHOTO = {x: 1290, y: 400, w: 804, img: [760, 478] as [number, number]};
export const FIG = {x: 1280, y: 1100, w: 900};
export const REPORT = {x: 2280, y: 300, w: 900};
export const ITEM = {x: 2280, y: 900, w: 900};
export const RAIL = {x: 230, y: 1560, w: 2960};

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

// where each card is pinned: off the words a thread would cross, and on the side its threads run to
const PINS = {claim: 0.92, call: 0.88, photo: 0.5, report: 0.035, item: 0.965};
// the photograph's threads are tacked to the inner corners of its mount, so neither crosses the picture (the card hangs at 1.3°)
const PHOTO_IN = pinAt(PHOTO.x, PHOTO.w, PHOTO.y + 8, 0.03, 1.3);
const PHOTO_OUT = pinAt(PHOTO.x, PHOTO.w, PHOTO.y + 8, 0.97, 1.3);
// the report's thread down to item h is tacked in its right margin, clear of its text and its tag
const REPORT_OUT = pinAt(REPORT.x, REPORT.w, REPORT.y + 14, 0.972, 0.7);
const pin = (c: {x: number; y: number; w: number}, at: number, rot: number) => pinAt(c.x, c.w, c.y, at, rot);

export function World() {
  const p = (name: string, base: number) => useProp(name, base);
  const camX = p('camX', 900), camY = p('camY', 520), zoom = p('zoom', 0.8), drift = p('drift', 0);
  // depth of field: while one card is read (`focusOn`, its number below), the others go soft by `dof`
  const dof = p('dof', 0), on = p('focusOn', 0);
  const soft = (n: number) => (on === n ? 0 : dof);
  return (
    <Board camX={camX} camY={camY} zoom={zoom} drift={drift} tilt={p('tilt', 0)} turn={p('turn', 0)} travel={p('travel', 0)}>
      <div style={{position: 'absolute', left: TITLE.x, top: TITLE.y}}>
        <CaseTitle kicker="APOLLO 13 · APRIL–JUNE 1970" title="What broke, and how we know" show={p('title', 0)} width={1500} />
      </div>
      <DateRail x={RAIL.x} y={RAIL.y} w={RAIL.w} draw={p('rail', 0)} stops={[
        {at: CALL.x + CALL.w / 2, date: '13 APR 1970', label: 'the call'},
        {at: PHOTO.x + PHOTO.w / 2, date: '17 APR 1970', label: 'the photograph'},
        {at: REPORT.x + REPORT.w / 2, date: '15 JUN 1970', label: 'the finding'},
      ]} />
      <Card x={CLAIM.x} y={CLAIM.y} w={CLAIM.w} rot={-2.2} pin={p('claim', 0)} pinX={PINS.claim} focus={soft(1)} hang={p('hang', 0)} paper="none">
        <Claim claim="Houston, we have a problem." who="As usually quoted" width={CLAIM.w} />
      </Card>
      <Card x={CALL.x} y={CALL.y} w={CALL.w} rot={-1.1} pin={p('call', 0)} pinX={PINS.call} focus={soft(2)} tag="NASA · Air-to-ground transcript" date="13 APR 1970">
        <Document issuer="NASA · Manned Spacecraft Center" title="Apollo 13 Technical Air-to-Ground Voice Transcription" rows={CALL_ROWS} mark={p('callMark', 0)} size={32} />
      </Card>
      <Card x={PHOTO.x} y={PHOTO.y} w={PHOTO.w} rot={1.3} pin={p('photo', 0)} pinX={PINS.photo} focus={soft(3)} tag="NASA · Photo S70-35703" date="17 APR 1970" paper="print">
        <Photo asset="service-module" w={PHOTO.img[0]} h={PHOTO.img[1]} caption="“This view of the damaged Apollo 13 Service Module (SM) was photographed … following SM jettisoning. As seen here, an entire SM panel was blown away …”"
          area={{x: 0.55, y: 0.24, w: 0.33, h: 0.54}} crop={p('crop', 0)} />
      </Card>
      <Card x={FIG.x} y={FIG.y} w={FIG.w} rot={-0.6} pin={p('fig', 0)} focus={soft(6)} tag="Review Board · Chapter 5" date="15 JUN 1970" paper="slip">
        <Chart rows={[
          {label: 'Switches rated for', value: 28, note: 'the spacecraft supply'},
          {label: 'Heaters run on', value: 65, note: 'at KSC · item h'},
        ]} unit="V dc" max={70} ticks={20} show={p('figShow', 0)} accent={1} />
      </Card>
      <Card x={REPORT.x} y={REPORT.y} w={REPORT.w} rot={0.7} pin={p('report', 0)} pinX={PINS.report} focus={soft(4)} tag="NASA · Review Board report" date="15 JUN 1970">
        <Document issuer="National Aeronautics and Space Administration" title="Report of Apollo 13 Review Board" rows={REPORT_ROWS} mark={p('reportMark', 0)} size={30} />
      </Card>
      <Card x={ITEM.x} y={ITEM.y} w={ITEM.w} rot={-0.5} pin={p('item', 0)} pinX={PINS.item} focus={soft(5)} tag="NASA · Review Board report" date="15 JUN 1970">
        <Document issuer="Report of Apollo 13 Review Board" title="Chapter 5, Part 1, item h" rows={ITEM_ROWS} mark={p('itemMark', 0)} size={30} />
      </Card>
      <Thread from={pin(CLAIM, PINS.claim, -2.2)} to={pin(CALL, PINS.call, -1.1)} draw={p('t0', 0)} pulse={p('t0p', 0)} slack={40} tacks={false} />
      <Thread from={pin(CALL, PINS.call, -1.1)} to={PHOTO_IN} draw={p('t1', 0)} pulse={p('t1p', 0)} slack={70} />
      <Thread from={PHOTO_OUT} to={pin(REPORT, PINS.report, 0.7)} draw={p('t2', 0)} pulse={p('t2p', 0)} slack={40} />
      <Thread from={REPORT_OUT} to={pin(ITEM, PINS.item, -0.5)} draw={p('t3', 0)} pulse={p('t3p', 0)} slack={30} />
    </Board>
  );
}
