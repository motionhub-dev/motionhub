// Origami's reel: the dart folded at a brisk pace, walked round, then opened back out to its crease pattern. For a
// player; not a template: read it for how the parts move together.
import type {ReactNode} from 'react';
import {Caption, Easing, interpolate, useTime} from '@motionhub/runtime';
import {FoldStage} from './parts/stage.tsx';
import {StepRail} from './parts/rail.tsx';
import {CreasePattern} from './parts/pattern.tsx';
import {paperPlane} from './parts/models.ts';

export const reel = {seconds: 30, width: 1920, height: 1080};

// the beats, as MOTION.md times them: per step a mark, a fold and a hold; a precrease folds and opens, so its fold beat
// is longer
const MARK = 0.9, FOLD = 1.5, PRECREASE = 2.6, HOLD = 1.0, START = 0.5;
type Beat = {step: number; mark: number; fold: number; end: number};
const BEATS: Beat[] = [];
{
  let t = START;
  paperPlane.steps.forEach((st, i) => {
    const marked = !!st.folds?.length, fold = st.precrease ? PRECREASE : FOLD;
    const mark = t, foldAt = t + (marked ? MARK : 0), end = foldAt + fold + HOLD;
    BEATS.push({step: i + 1, mark, fold: foldAt, end});
    t = end;
  });
}
const FOLDED = BEATS[BEATS.length - 1].end; // about 21 s
const WALK = FOLDED + 4.2, OPEN = reel.seconds;

/** What happens when, for the motion's sound (sound.json): the crease scored, the fold, the paper landing, the model done */
export const cues = [
  ...BEATS.flatMap((b) => {
    const st = paperPlane.steps[b.step - 1], fold = b.end - HOLD - b.fold;
    return [
      ...(st.folds?.length ? [{at: b.mark, role: 'draw', dur: MARK * 0.8}] : []),
      {at: b.fold, role: 'move', dur: fold},
      {at: b.end - HOLD - 0.05, role: 'land'},
    ];
  }),
  {at: FOLDED + 0.2, role: 'count'},
  {at: WALK + 1.0, role: 'draw', dur: 2.4},
];

const clamp = {clamp: true};
const ease = Easing.bezier(0.45, 0, 0.2, 1);

function Box({x, y, children, opacity = 1}: {x: number; y: number; children: ReactNode; opacity?: number}) {
  return <div style={{position: 'absolute', left: x, top: y, opacity}}>{children}</div>;
}

export default function Reel() {
  const t = useTime();
  // steps done: each fold runs linearly over its beat (the solve eases it)
  let at = 0, mark: {step: number; draw: number; opacity: number} | undefined;
  for (const b of BEATS) {
    const foldEnd = b.end - HOLD;
    if (t >= foldEnd) at = b.step;
    else if (t >= b.fold) at = b.step - 1 + (t - b.fold) / (foldEnd - b.fold);
    if (t >= b.mark && t < b.end && paperPlane.steps[b.step - 1].folds?.length) {
      mark = {step: b.step, draw: interpolate(t, [b.mark, b.mark + MARK * 0.85], [0, 1], clamp), opacity: interpolate(t, [foldEnd, b.end], [1, 0.35], clamp)};
    }
  }
  const beat = BEATS.find((b) => t >= b.mark && t < b.end);
  // the camera: high over the sheet, lower and closer once the plane stands up, then a walk round
  const fourth = BEATS[3];
  const el = interpolate(t, [0, fourth.fold, fourth.end, FOLDED, WALK], [52, 50, 28, 26, 22], {...clamp, easing: ease});
  const zoom = interpolate(t, [0, BEATS[1].fold, BEATS[1].end, fourth.fold, fourth.end, WALK, WALK + 0.8], [0.86, 0.86, 0.95, 0.95, 1.22, 1.22, 0.95], {...clamp, easing: ease});
  const az = interpolate(t, [0, FOLDED, WALK, OPEN], [24, 36, 36 + 230, 36 + 260], {...clamp, easing: ease});
  const railOut = interpolate(t, [FOLDED, FOLDED + 0.5], [1, 0], clamp);
  const shift = interpolate(t, [FOLDED, FOLDED + 0.8, WALK, WALK + 0.8], [190, 0, 0, 430], {...clamp, easing: ease});
  const pattern = interpolate(t, [WALK + 0.8, WALK + 1.1], [0, 1], clamp);
  const say = beat ? paperPlane.steps[beat.step - 1].say : t >= WALK ? 'Opened back out: every crease, on one sheet.' : t >= FOLDED ? 'Six folds, one sheet: a dart.' : '';
  const sayAt = beat ? beat.mark : t >= WALK ? WALK : FOLDED;
  const sayEnd = beat ? beat.end : t >= WALK ? OPEN : WALK;
  const sayOn = interpolate(t, [sayAt, sayAt + 0.2, sayEnd - 0.2, sayEnd], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: 'absolute', inset: 0, background: 'var(--color-table)', fontFamily: 'var(--font-sans)'}}>
      <FoldStage model={paperPlane} at={at} mark={mark} az={az} el={el} zoom={zoom} shift={shift} />
      <Box x={1380} y={250} opacity={railOut}><StepRail model={paperPlane} at={at} step={beat ? beat.step : t >= FOLDED ? paperPlane.steps.length + 1 : 1} size={30} /></Box>
      <Box x={1330} y={170} opacity={pattern}>
        <CreasePattern model={paperPlane} width={420} draw={interpolate(t, [WALK + 1.0, WALK + 3.4], [0, 1], clamp)} />
      </Box>
      {say && <Caption opacity={sayOn}>{say}</Caption>}
    </div>
  );
}
