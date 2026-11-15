// Tideframe's reel: the schematic, the board and a definition, briskly, for the player. Not a template.
import type {CSSProperties, ReactNode} from 'react';
import {Easing, Sequence, interpolate, useTime} from '@motionhub/runtime';
import {Field} from './parts/field.tsx';
import {Lockup} from './parts/lockup.tsx';
import {Node} from './parts/node.tsx';
import {Conduit} from './parts/conduit.tsx';
import {Board} from './parts/board.tsx';
import {Split} from './parts/split.tsx';
import {Stages} from './parts/stages.tsx';
import {Spec} from './parts/spec.tsx';
import {Callout} from './parts/callout.tsx';

export const reel = {seconds: 20, width: 1920, height: 1080};
/** Tiles land, conduits draw, packets travel, rows print, a figure counts, the claim leaves. */
export const cues = [
  {at: 0.25, role: 'land'},
  {at: 0.7, role: 'draw', dur: 0.55},
  {at: 0.85, role: 'land'},
  {at: 1.25, role: 'land'},
  {at: 1.15, role: 'draw', dur: 0.7},
  {at: 1.65, role: 'land'},
  {at: 1.7, role: 'draw', dur: 0.55},
  {at: 2.3, role: 'move', dur: 3.6},
  {at: 6.7, role: 'cut'},
  {at: 6.9, role: 'land'},
  {at: 7.25, role: 'land'},
  {at: 7.6, role: 'land'},
  {at: 7.95, role: 'land'},
  {at: 8.5, role: 'count'},
  {at: 10.4, role: 'count'},
  {at: 13.15, role: 'cut'},
  {at: 13.3, role: 'land'},
  {at: 14.0, role: 'move', dur: 0.45},
  {at: 14.7, role: 'land'},
  {at: 15.4, role: 'land'},
  {at: 16.3, role: 'draw', dur: 0.7},
  {at: 17.6, role: 'out'},
];

const lock = Easing.bezier(0.16, 1, 0.3, 1);
const drawEase = Easing.bezier(0.45, 0, 0.2, 1);
const at = (t: number, from: number, to: number, a: number, b: number, easing = lock) => interpolate(t, [from, to], [a, b], {easing});

function Box({x, y, w, h, start = 0, children}: {x: number; y: number; w: number; h: number; start?: number; children: ReactNode}) {
  const t = useTime();
  const p = at(t, start, start + 0.4, 0, 1);
  const style: CSSProperties = {position: 'absolute', left: x, top: y, width: w, height: h, opacity: p, transform: `translateY(${(12 * (1 - p)).toFixed(1)}px)`};
  return <div style={style}>{children}</div>;
}

const ROWS = [
  {label: 'Edge', value: '1,240', note: 'in flight'},
  {label: 'Queue', value: '860', note: 'waiting'},
  {label: 'Workers', value: '640', note: 'running'},
  {label: 'Return', value: '1,180', note: 'answered'},
];

function Schematic() {
  const t = useTime();
  const live = t > 1.7 ? 1 : 0;
  return (
    <>
      <Box x={120} y={78} w={980} h={250} start={0.15}>
        <Lockup kicker="Ingress" title="Three lanes." sub="Edge admits, the queue holds, workers run." track={at(t, 0.2, 0.95, 0, 1)} rule={at(t, 0.7, 1.45, 0, 1, drawEase)} />
      </Box>
      <Box x={0} y={0} w={1920} h={1080} start={0.9}>
        <Conduit points={[[200, 390], [1560, 390]]} draw={at(t, 0.95, 1.7, 0, 1, drawEase)} flow={0} packets={0} />
      </Box>
      <Box x={0} y={0} w={1920} h={1080} start={1.15}>
        <Conduit points={[[320, 390], [320, 468]]} draw={at(t, 1.15, 1.7, 0, 1, drawEase)} flow={0} packets={0} />
      </Box>
      <Box x={0} y={0} w={1920} h={1080} start={1.35}>
        <Conduit points={[[860, 390], [860, 468]]} draw={at(t, 1.35, 1.95, 0, 1, drawEase)} flow={0} packets={0} />
      </Box>
      <Box x={0} y={0} w={1920} h={1080} start={2.05}>
        <Conduit points={[[200, 390], [860, 390], [860, 468]]} draw={1} line={false} flow={(t - 2.15) * 0.22} packets={5} gap={148} />
      </Box>
      <Box x={0} y={0} w={1920} h={1080} start={1.55}>
        <Conduit points={[[1400, 390], [1400, 468]]} draw={at(t, 1.55, 2.15, 0, 1, drawEase)} flow={0} packets={0} />
      </Box>
      <Box x={160} y={468} w={320} h={210} start={0.85}><Node index="01" name="Edge" role="admits" load={at(t, 1.1, 1.8, 0, 0.38)} arrive={1} /></Box>
      <Box x={700} y={468} w={320} h={210} start={1.25}><Node index="02" name="Queue" role="holds" live={live === 1} load={at(t, 1.7, 2.5, 0, 0.76)} arrive={1} /></Box>
      <Box x={1240} y={468} w={320} h={210} start={1.65}><Node index="03" name="Workers" role="running" load={at(t, 2.0, 2.7, 0, 0.52)} arrive={1} /></Box>
    </>
  );
}

function Numbers() {
  const t = useTime();
  const shown = t < 0.45 ? 1 : t < 0.8 ? 2 : t < 1.15 ? 3 : 4;
  const focus = t < 1.7 ? -1 : t < 2.6 ? 0 : t < 3.5 ? 1 : 2;
  const now = Math.round(at(t, 3.85, 4.85, 96, 42, Easing.outQuart));
  return (
    <>
      <Box x={100} y={150} w={860} h={520} start={0.1}>
        <Board title="In flight" columns={['Lane', 'Now', 'State']} rows={ROWS} shown={shown} focus={focus} width={820} />
      </Box>
      <Box x={1040} y={250} w={780} h={280} start={3.5}>
        <Split beforeLabel="Was" before="96" nowLabel="Now" now={String(now)} unit="ms" width={740} />
      </Box>
    </>
  );
}

function Defined() {
  const t = useTime();
  const shown = t < 0.5 ? 1 : t < 1.2 ? 2 : t < 1.9 ? 3 : 4;
  return (
    <>
      <Box x={120} y={130} w={1680} h={180} start={0.1}>
        <Stages items={['Admit', 'Batch', 'Run', 'Return']} shown={shown} current={shown - 1} width={1640} />
      </Box>
      <Box x={120} y={420} w={780} h={320} start={2.6}>
        <Spec term="Backpressure" token="max.in.flight" meaning="How many requests a lane holds before it slows the edge." reveal={at(t, 2.7, 3.6, 0, 1)} />
      </Box>
      <Box x={980} y={450} w={820} h={240} start={3.9}>
        <Callout text="The queue is the product." arrive={at(t, 4.0, 4.8, 0, 1)} width={780} />
      </Box>
    </>
  );
}

export default function Reel() {
  const t = useTime();
  return (
    <>
      <Field wash={0.8 + 0.15 * Math.sin(t * 0.6)} drift={t * 8} />
      <Sequence from={0} duration={6.6}><Schematic /></Sequence>
      <Sequence from={6.6} duration={6.4}><Numbers /></Sequence>
      <Sequence from={13}><Defined /></Sequence>
    </>
  );
}
