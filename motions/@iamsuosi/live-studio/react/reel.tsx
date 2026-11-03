// Live Studio's reel: twenty seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
// The player holds no footage, so a stand-in fills the frame where the recording would be; the package is drawn over it as it would be over a programme.
import type {ReactNode} from 'react';
import {Easing, Video, interpolate, useTime} from '@motionhub/runtime';
import {Bug} from './parts/bug.tsx';
import {Ticker} from './parts/ticker.tsx';
import {Strap} from './parts/strap.tsx';
import {Scorebar} from './parts/scorebar.tsx';
import {Pip} from './parts/pip.tsx';
import {Headline} from './parts/headline.tsx';
import {Roster} from './parts/roster.tsx';
import {Locator} from './parts/locator.tsx';
import {Readout} from './parts/readout.tsx';
import {Sting} from './parts/sting.tsx';

export const reel = {seconds: 20, width: 1920, height: 1080};
/** What happens when, for the motion's sound (sound.json): a strap lands, a score row ticks, the stinger sweeps and cuts, a headline flips, a name lands, the figure settles */
export const cues = [
  {at: 0.2, role: 'land'}, {at: 0.9, role: 'land'}, {at: 4.2, role: 'land'}, {at: 5.6, role: 'count'}, {at: 6.8, role: 'count'},
  {at: 7.2, role: 'land'}, {at: 9.4, role: 'count'}, {at: 10.0, role: 'move', dur: 1.6}, {at: 10.8, role: 'cut'}, {at: 11.2, role: 'land'},
  {at: 13.15, role: 'count'}, {at: 14.5, role: 'land'}, {at: 15.1, role: 'land'}, {at: 15.7, role: 'land'}, {at: 16.6, role: 'land'},
  {at: 18.3, role: 'count'},
];

const lin = Easing.linear, out = Easing.outQuart, ease = Easing.inOutSine;
/** a piece's `show`: on from `on` over `dur` (the part paces its own layers), pulled off from `off` over 0.35 s, the entrance reversed */
const shown = (t: number, on: number, dur: number, off = Infinity) =>
  t < off ? interpolate(t, [on, on + dur], [0, 1], {easing: lin}) : interpolate(t, [off, off + 0.35], [1, 0], {easing: ease});
const at = (t: number, from: number, to: number, a: number, b: number, easing = ease) => interpolate(t, [from, to], [a, b], {easing});

/** A box at x, y of w × h, drawn only between `from` and `to`: pieces push themselves on, nothing fades */
function Box({x, y, w, h, from = 0, to = Infinity, children}: {x: number; y: number; w: number; h: number; from?: number; to?: number; children: ReactNode}) {
  const t = useTime();
  if (t < from || t >= to) return null;
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h}}>{children}</div>;
}

const NEWS = ['Soyuz MS-27 docks at the Prichal module', 'Launched from Baikonur, Kazakhstan, April 8', 'Ryzhikov commands Soyuz MS-27'];
const CUT = 10.8;

export default function Reel() {
  const t = useTime();
  return (
    <>
      <div style={{position: 'absolute', inset: 0}}><Video src="take" /></div>

      {/* The two hosts, one strap each, under each of them at the near edge */}
      <Box x={96} y={606} w={640} h={190} from={0.2} to={4.4}><Strap name="Raegan Scharfetter" role="Space to Ground" tag="Host" show={shown(t, 0.2, 1.2, 3.9)} /></Box>
      <Box x={1184} y={606} w={640} h={190} from={0.9} to={4.5}><Strap name="Nilufar Ramji" role="Space to Ground" tag="Host" side="right" show={shown(t, 0.9, 1.2, 4.0)} /></Box>

      {/* Tick the score in the free column; the last row waits as a question, then wins */}
      <Box x={96} y={240} w={430} h={460} from={4.2} to={CUT}>
        <Scorebar title="Flight time" labels={['L.A. – New York', 'Oslo – Athens', 'Earth – station']} values={[306, 230, 180]} notes={['', '', '+']} format="hm"
          shown={t < 5.8 ? at(t, 4.5, 5.6, 0, 1, out) : t < 7.0 ? at(t, 5.8, 6.8, 1, 2, out) : at(t, 7.0, 7.4, 2, 3)}
          ask={2} reveal={at(t, 8.4, 9.4, 0, 1, out)} focus={t < 7.0 ? -1 : 2} badge="Fastest" win={at(t, 9.5, 10.3, 0, 1, lin)} show={shown(t, 4.2, 0.6)} />
      </Box>
      {/* Open a window on the one they mention, in the other column */}
      <Box x={1400} y={180} w={424} h={352} from={7.2} to={CUT}><Pip src="kim" name="Jonny Kim" role="NASA" show={shown(t, 7.2, 1.1)} /></Box>

      {/* After the stinger: a headline that flips, then the crew's roll call over a dateline */}
      <Box x={96} y={722} w={1100} h={74} from={11.2} to={14.5}>
        <Headline tab="Launch" text="Soyuz MS-27 lifts off" next="Three crew, bound for the station" flip={at(t, 12.7, 13.15, 0, 1)} show={shown(t, 11.2, 1.0, 14.1)} />
      </Box>
      <Box x={96} y={190} w={700} h={420} from={13.6} to={17.2}>
        <Roster title="Crew" names={['Kim', 'Ryzhikov', 'Zubritsky']} roles={['NASA', 'Roscosmos', 'Roscosmos']}
          shown={t < 14.5 ? at(t, 14.0, 14.5, 0, 1) : t < 15.1 ? at(t, 14.6, 15.1, 1, 2) : at(t, 15.2, 15.7, 2, 3)} show={shown(t, 13.6, 0.3, 16.8)} />
      </Box>
      <Box x={96} y={666} w={800} h={130} from={14.6}><Locator place="Baikonur Cosmodrome" line="Kazakhstan · Apr 8 2025" show={shown(t, 14.6, 1.0)} /></Box>

      {/* The figure the story ends on, its digit spinning to eight */}
      <Box x={1290} y={196} w={534} h={340} from={16.6}>
        <Readout value={at(t, 17.2, 18.3, 0, 8, out)} places={1} unit="Months" tab="Mission" note="Research on the station" show={shown(t, 16.6, 1.0)} />
      </Box>

      {/* The one stinger, covering the cut from studio to archive at its middle */}
      <Box x={0} y={0} w={1920} h={1080} from={CUT - 0.8} to={CUT + 0.85}><Sting word="Replay" line="Baikonur · April 8" pass={at(t, CUT - 0.8, CUT + 0.8, 0, 1, lin)} /></Box>

      {/* The furniture: on with the first frames, and it stays; the bug flips to REPLAY at the cut */}
      <Box x={1224} y={54} w={600} h={68}><Bug mark="WK 15" state="THIS WEEK" next="REPLAY" flip={at(t, CUT, CUT + 0.4, 0, 1)} date="APR 11 2025" show={at(t, 0, 1.0, 0, 1, lin)} /></Box>
      <Box x={96} y={964} w={1728} h={62}><Ticker label="Latest" items={NEWS} show={at(t, 0.3, 1.1, 0, 1, lin)} /></Box>
    </>
  );
}
