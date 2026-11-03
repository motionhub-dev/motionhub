// Pixel Quest's reel: twenty seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
import {interpolate, useTime} from '@motionhub/runtime';
import {Level} from './parts/level.tsx';
import {Hero} from './parts/hero.tsx';
import {Hud} from './parts/hud.tsx';
import {Title} from './parts/title.tsx';
import {StageCard} from './parts/stage-card.tsx';
import {Dialog} from './parts/dialog.tsx';
import {Loot} from './parts/loot.tsx';
import {Clear} from './parts/clear.tsx';
import {Boss} from './parts/boss.tsx';
import {Results} from './parts/results.tsx';
import {DeviceScreen} from './parts/screen.tsx';
import {Wipe} from './parts/wipe.tsx';

export const reel = {seconds: 20, width: 1920, height: 1080};
/** What happens when, for the motion's sound (sound.json): a title drops, a card lands, a chest opens and a clear chimes, the wipe sweeps, the boss crashes and is hit, the quest log lands */
export const cues = [
  {at: 0.0, role: 'draw', dur: 1.2}, {at: 2.6, role: 'out'}, {at: 3.0, role: 'land'}, {at: 4.7, role: 'draw', dur: 0.8}, {at: 5.8, role: 'land'},
  {at: 6.0, role: 'count'}, {at: 6.6, role: 'move', dur: 0.6}, {at: 7.4, role: 'move', dur: 1.2}, {at: 8.4, role: 'move', dur: 1.4},
  {at: 9.4, role: 'land'}, {at: 10.0, role: 'land'}, {at: 10.5, role: 'land'}, {at: 11.0, role: 'land'}, {at: 11.5, role: 'land'},
  {at: 12.0, role: 'land'}, {at: 12.4, role: 'cut'}, {at: 13.6, role: 'land'}, {at: 13.8, role: 'count'}, {at: 14.9, role: 'move', dur: 0.6},
  {at: 15.8, role: 'land'}, {at: 16.1, role: 'draw', dur: 0.7}, {at: 17.4, role: 'count'},
];

// Every tween is linear: the parts step it on twos in whole pixels themselves (MOTION.md §5).
/** `a` to `b` between seconds `from` and `to` */
const lin = (t: number, from: number, to: number, a = 0, b = 1) => interpolate(t, [from, to], [a, b]);
/** A part drawn only between two seconds: things blink in and out, never fade */
const during = (t: number, from: number, to = Infinity) => t >= from && t < to;

// The run: a title, stage one (a rule, a chest, a clear), a diamond wipe to the boss, the boss beaten, then the quest log beside a timer.
const WIPE = 7.4, CLOSED = WIPE + 0.6, BOSS = 8.4, BLOWS = 10.0, BEATEN = 12.4, LOG = 15.8;

/** The hero: acting the step, cheering on a clear, walking to the next stage */
function hero(t: number) {
  if (during(t, 6.0, 6.9) || during(t, 14.0, 14.9) || during(t, 18.0, 19.0)) {
    const s = t < 7 ? 6.0 : t < 15 ? 14.0 : 18.0;
    return {pose: 'cheer', hop: lin(t, s, s + 0.8), face: 'front'};
  }
  if (during(t, WIPE - 0.3, CLOSED)) return {pose: 'walk', hop: 0, face: 'right'};
  if (during(t, 3.6, 6.0) || during(t, 9.8, BEATEN + 1.2)) return {pose: 'act', hop: 0, face: 'front'};
  return {pose: 'idle', hop: 0, face: 'front'};
}

/** The boss flashes on every blow: one blow each half second while its HP drains */
const blow = (t: number) => (during(t, BLOWS, BEATEN) ? ((t - BLOWS) % 0.5) / 0.5 : 0);

export default function Reel() {
  const t = useTime(), h = hero(t);
  const scroll = t < CLOSED ? lin(t, WIPE - 0.3, CLOSED, 0, 140) : 480;
  const dusk = during(t, CLOSED, BEATEN + 1.3) ? 1 : 0;
  const shake = t < BEATEN ? lin(t, BOSS + 0.98, BOSS + 1.5) : lin(t, BEATEN + 1.1, BEATEN + 1.6);
  return (
    <>
      <Level scroll={scroll} stages={2} boss={2} dusk={dusk} shake={shake} />
      <Hero x={120} pose={h.pose} face={h.face} hop={h.hop} />

      {/* the title drops in letter by letter, a glint runs over it, and it dithers away as the bar unrolls */}
      {during(t, 0, 3.2) && <Title title="JUGGLE|THREE BALLS" sub="1 STAGE + 1 BOSS" drop={lin(t, 0, 1.2)} shine={lin(t, 1.3, 2.1)} leave={lin(t, 2.6, 3.1)} />}

      {/* stage one: the card, the rule typed, the arc won from a chest, and the clear */}
      {during(t, 3.0, 4.7) && <StageCard n="1" name="One ball" drop={lin(t, 3.0, 4.0)} leave={lin(t, 4.2, 4.6)} />}
      {during(t, 4.4, 6.0) && <Dialog text="PEAK JUST ABOVE|YOUR EYES" name="RULE" mark="PEAK" x={196} y={48} w={220}
        open={t < 5.7 ? lin(t, 4.4, 4.7) : lin(t, 5.7, 6.0, 1, 0)} typed={lin(t, 4.7, 5.5)} />}
      {during(t, 5.0, 7.4) && <Loot x={250} icon="arc" label="THE ARC" open={lin(t, 5.0, 5.8)} fly={lin(t, 6.6, 7.2)} slot={0} slots={3} />}
      {during(t, 6.0, 7.3) && <Clear x={120} y={158} burst={lin(t, 6.0, 7.2, 0, 0.999)} />}

      {/* the boss: its shadow, the crash, a blow every half second with the rule typed beside it, then it bursts and light lands on the hero */}
      {during(t, BOSS, BEATEN + 2.3) && <Boss x={384} name="THE THIRD BALL" enter={lin(t, BOSS, BOSS + 1.4)} hp={lin(t, BLOWS, BEATEN, 1, 0)} hit={blow(t)} defeat={lin(t, BEATEN, BEATEN + 2.2)} />}
      {during(t, BLOWS, BEATEN) && <Dialog text="EVERY PEAK,|A THROW" name="RULE" mark="PEAK" x={20} y={48} w={200}
        open={t < BEATEN - 0.3 ? lin(t, BLOWS, BLOWS + 0.3) : lin(t, BEATEN - 0.3, BEATEN, 1, 0)} typed={lin(t, BLOWS + 0.3, BLOWS + 1.1)} />}
      {during(t, BEATEN + 1.2, LOG) && <Loot x={384} icon="star" label="CASCADE" chest={false} open={lin(t, BEATEN + 1.2, BEATEN + 1.9)} fly={lin(t, BEATEN + 2.5, BEATEN + 3.1)} slot={1} slots={3} />}
      {during(t, BEATEN + 1.4, BEATEN + 3.0) && <Clear x={120} y={158} word="LEVEL UP!" beam={lin(t, BEATEN + 1.4, BEATEN + 2.9, 0, 0.999)} burst={lin(t, BEATEN + 1.6, BEATEN + 2.9, 0, 0.999)} />}

      {/* the end: the quest log writes its rows, a timer for practice drops in beside it */}
      {during(t, LOG) && <Results x={44} y={52} rows={['One ball', 'The third ball', 'Next: four balls']} shown={t < 17.2 ? lin(t, LOG + 0.3, LOG + 1.0, 0, 2) : 3} open={lin(t, LOG, LOG + 0.3)} />}
      {during(t, LOG + 0.2) && <DeviceScreen device="phone" x={324} y={40} app="TIMER" big={t < 17.6 ? '05:00' : t < 18.6 ? '04:59' : t < 19.6 ? '04:58' : '04:57'}
        rows={['START', 'RESET']} step={1} n={1} press={lin(t, LOG + 0.6, LOG + 1.6)} show={lin(t, LOG + 0.2, LOG + 0.6)} />}

      <Wipe p={lin(t, WIPE, WIPE + 1.2)} />
      <Hud stage={t < CLOSED ? '1' : t < LOG ? 'BOSS' : 'END'} xp={t < BEATEN ? lin(t, 6.0, 6.6, 0, 0.5) : lin(t, BEATEN + 1.4, BEATEN + 2.0, 0.5, 1)} segments={2}
        boss={during(t, CLOSED)} items={['arc', 'star']} got={t < 10 ? lin(t, 7.1, 7.5) : lin(t, BEATEN + 3.0, BEATEN + 3.4, 1, 2)} show={lin(t, 2.6, 3.1)} />
    </>
  );
}
