// Pixel Quest's sample: one example among many. Do not reuse its story, scenes, layout or timings; read it for technique, after your own scenes are planned.
// The level, the hero, the status bar and the balls in the hero's hands are global parts, so the world scrolls on and the bar keeps what was won;
// each scene adds its stage card, its pattern window and its moves. The pattern (parts/pattern.tsx) is this film's own drawing.
import {Doc, Scene, Line, Part, Animation, Appear, Disappear, Tween, Set} from '@visotalk/jsx';
import {useProp} from '@visotalk/runtime';
import {Level} from '../parts/level.tsx';
import {Hero} from '../parts/hero.tsx';
import {Hud} from '../parts/hud.tsx';
import {Title} from '../parts/title.tsx';
import {StageCard} from '../parts/stage-card.tsx';
import {Dialog} from '../parts/dialog.tsx';
import {Loot} from '../parts/loot.tsx';
import {Clear} from '../parts/clear.tsx';
import {Boss} from '../parts/boss.tsx';
import {Results} from '../parts/results.tsx';
import {DeviceScreen} from '../parts/screen.tsx';
import {Wipe} from '../parts/wipe.tsx';
import {Pattern, HandBalls} from './parts/pattern.tsx';

export default <Doc
  id="pixel-quest-sample"
  title="Juggle three balls"
  poster={31.7}
  lang="en"
  canvas="16x9"
  theme="visotalk/dark"
  tokens={{
    colors: {bg: '#111925', panel: '#1A2233', panel2: '#243049', border: '#F4ECD6', text: '#F4ECD6', muted: '#9AA9B5', faint: '#4A5670', data: '#FFC83D', grad: '#C77B12', op: '#5BE3B0', good: '#5BE3B0', bad: '#F2564B', warn: '#FF9A3D'},
    fonts: {sans: '"Fusion Pixel 12px Prop zh-Hans", sans-serif', mono: '"Fusion Pixel 12px Prop zh-Hans", monospace', display: '"Silkscreen", "Fusion Pixel 12px Prop zh-Hans", sans-serif'},
    caption: {font: 'sans', size: 48, weight: 400, color: '#F4ECD6', background: 'linear-gradient(#F4ECD6 0 0) top/100% 4px no-repeat, linear-gradient(#F4ECD6 0 0) bottom/100% 4px no-repeat, #1A2233', radius: 0, padding: [12, 32], bottom: 40, maxWidth: 1600, shadow: '4px 4px 0 #0B0E14'},
  }}
  pacing={{lead: 0.3, hold: 0.4, tail: 0.8}}
  exports={{captions: 'burned'}}
>
  <Part id="level">{() => <Level scroll={useProp('scroll', 0)} stages={3} boss={3} dusk={useProp('dusk', 0)} shake={useProp('shake', 0)} />}</Part>
  <Part id="hero" z={1}>{() => <Hero x={useProp('x', 120)} pose={useProp('pose', 'idle')} face={useProp('face', 'front')} hop={useProp('hop', 0)} />}</Part>
  <Part id="balls" z={1}>{() => <HandBalls x={120} balls={useProp('balls', 1)} clock={useProp('clock', 0)} show={useProp('show', 0)} />}</Part>
  <Part id="wipe" z={5}>{() => <Wipe p={useProp('p', 0)} />}</Part>
  <Part id="hud" z={6}>{() => <Hud stage={useProp('stage', '1')} xp={useProp('xp', 0)} segments={3} boss={useProp('boss', false)} items={['arc', 'star']} got={useProp('got', 0)} show={useProp('show', 0)} />}</Part>

  <Scene id="open" title="Title screen">
    <Line id="l1">Juggling three balls looks like magic.</Line>
    <Line id="l2">Really, it's two short stages, and one boss.</Line>
    <Part id="title">{() => <Title title="JUGGLE|THREE BALLS" sub="2 STAGES + 1 BOSS" drop={useProp('drop', 0)} shine={useProp('shine', 0)} leave={useProp('leave', 0)} />}</Part>
    <Animation>
      <Appear target={['level', 'hero', 'balls', 'wipe']} at="start" dur={0} />
      <Appear target="title" line="l1" word="juggling" dur={0} />
      <Tween id="titled" target="title" to={{drop: 1}} line="l1" word="juggling" dur={1.6} easing="linear" />
      <Tween target="title" to={{shine: 1}} after="titled" dur={1.1} easing="linear" />
      <Tween target="title" to={{leave: 1}} line="l2" word="two short stages" offset={-0.3} dur={0.5} easing="linear" />
      <Appear target="hud" line="l2" word="two short stages" dur={0} />
      <Tween target="hud" to={{show: 1}} line="l2" word="two short stages" dur={0.5} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="one-ball" title="Stage 1: one ball">
    <Line id="l3">Stage one: one ball, tossed from hand to hand.</Line>
    <Line id="l4" hold={1.4}>Every throw peaks just above your eyes. That arc is your first move.</Line>
    <Part id="card1">{() => <StageCard n="1" name="One ball" drop={useProp('drop', 0)} leave={useProp('leave', 0)} />}</Part>
    <Part id="pattern1">{() => <Pattern balls={1} label="ONE BALL" clock={useProp('clock', 0)} open={useProp('open', 0)} eye={useProp('eye', 0)} />}</Part>
    <Part id="burst1">{() => <Clear x={120} y={158} burst={useProp('burst', 0)} />}</Part>
    <Part id="chest">{() => <Loot x={190} icon="arc" label="THE ARC" open={useProp('open', 0)} fly={useProp('fly', 0)} slot={0} slots={3} />}</Part>
    <Animation>
      <Appear target="card1" line="l3" word="stage one" dur={0} />
      <Tween target="card1" to={{drop: 1}} line="l3" word="stage one" dur={1.3} easing="linear" />
      <Tween target="card1" to={{leave: 1}} line="l3" word="tossed" offset={-0.2} dur={0.5} easing="linear" />
      <Appear target="pattern1" line="l3" word="tossed" dur={0} />
      <Tween target="pattern1" to={{open: 1}} line="l3" word="tossed" offset={0.2} dur={0.35} easing="linear" />
      <Tween target="pattern1" to={{clock: 14}} line="l3" word="tossed" offset={0.4} dur={14} easing="linear" />
      <Set target="hero" to={{pose: 'act'}} line="l3" word="tossed" />
      <Set target="balls" to={{show: 1, balls: 1, clock: 0}} line="l3" word="tossed" />
      <Tween target="balls" to={{clock: 14}} line="l3" word="tossed" offset={0.4} dur={14} easing="linear" />
      <Tween target="pattern1" to={{eye: 1}} line="l4" word="above your eyes" dur={0.1} />
      <Appear target="chest" line="l4" word="that arc" dur={0} />
      <Tween target="chest" to={{open: 1}} line="l4" word="that arc" dur={1.0} easing="linear" />
      <Tween target="hud" to={{xp: 0.34}} line="l4" word="first move" dur={0.8} easing="linear" />
      <Appear target="burst1" line="l4" word="first move" dur={0} />
      <Tween target="burst1" to={{burst: 0.999}} line="l4" word="first move" dur={1.3} easing="linear" />
      <Set target="hero" to={{pose: 'cheer'}} line="l4" word="first move" />
      <Tween target="hero" to={{hop: 1}} line="l4" word="first move" dur={0.9} easing="linear" />
      <Set target="hero" to={{pose: 'act', hop: 0}} line="l4" word="first move" offset={1.0} />
      <Tween target="chest" to={{fly: 1}} line="l4" word="first move" offset={1.3} dur={0.8} easing="linear" />
      <Tween target="hud" to={{got: 1}} line="l4" word="first move" offset={2.1} dur={0.5} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="two-balls" title="Stage 2: two balls">
    <Line id="l5">Stage two: two balls.</Line>
    <Line id="l6">Throw one, and when it peaks, throw the other under it.</Line>
    <Line id="l7" hold={0.8}>Catch, catch, and the stage is clear.</Line>
    <Part id="card2" z={7}>{() => <StageCard n="2" name="Two balls" drop={useProp('drop', 0)} leave={useProp('leave', 0)} />}</Part>
    <Part id="pattern2">{() => <Pattern balls={2} label="TWO BALLS" clock={useProp('clock', 0)} open={useProp('open', 0)} />}</Part>
    <Part id="rule">{() => <Dialog text="PEAK, THEN THROW|THE NEXT ONE UNDER" name="RULE" mark="PEAK" x={20} y={48} w={200} open={useProp('open', 0)} typed={useProp('typed', 0)} />}</Part>
    <Part id="burst">{() => <Clear x={120} y={158} burst={useProp('burst', 0)} />}</Part>
    <Animation>
      <Set target="balls" to={{show: 0}} at="start" />
      <Set target="hero" to={{pose: 'walk', face: 'right', hop: 0}} at="start" />
      <Tween target="level" to={{scroll: 140}} at="start" dur={0.9} easing="linear" />
      <Tween target="wipe" to={{p: 1}} at="start" offset={0.4} dur={1.3} easing="linear" />
      <Set target="level" to={{scroll: 480}} at="start" offset={1.05} />
      <Set target="hero" to={{pose: 'idle', face: 'front'}} at="start" offset={1.05} />
      <Set target="hud" to={{stage: '2'}} at="start" offset={1.05} />
      <Appear target="card2" at="start" offset={1.0} dur={0} />
      <Tween target="card2" to={{drop: 1}} at="start" offset={1.0} dur={1.3} easing="linear" />
      <Tween target="card2" to={{leave: 1}} line="l6" word="throw one" offset={-0.3} dur={0.5} easing="linear" />
      <Appear target="pattern2" line="l6" word="throw one" dur={0} />
      <Tween target="pattern2" to={{open: 1}} line="l6" word="throw one" dur={0.35} easing="linear" />
      <Tween target="pattern2" to={{clock: 14}} line="l6" word="throw one" offset={0.3} dur={14} easing="linear" />
      <Set target="hero" to={{pose: 'act'}} line="l6" word="throw one" />
      <Set target="balls" to={{show: 1, balls: 2, clock: 0}} line="l6" word="throw one" />
      <Tween target="balls" to={{clock: 14}} line="l6" word="throw one" offset={0.3} dur={14} easing="linear" />
      <Appear target="rule" line="l6" word="when it peaks" dur={0} />
      <Tween target="rule" to={{open: 1}} line="l6" word="when it peaks" dur={0.3} easing="linear" />
      <Tween target="rule" to={{typed: 1}} line="l6" word="when it peaks" offset={0.3} dur={1.6} easing="linear" />
      <Tween target="rule" to={{open: 0}} line="l7" offset={0.6} dur={0.3} easing="linear" />
      <Appear target="burst" line="l7" word="clear" dur={0} />
      <Tween target="burst" to={{burst: 0.999}} line="l7" word="clear" dur={1.3} easing="linear" />
      <Tween target="hud" to={{xp: 0.67}} line="l7" word="clear" dur={0.8} easing="linear" />
      <Set target="balls" to={{show: 0}} line="l7" word="clear" />
      <Set target="hero" to={{pose: 'cheer'}} line="l7" word="clear" />
      <Tween target="hero" to={{hop: 1}} line="l7" word="clear" dur={0.9} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="boss" title="The boss: three balls">
    <Line id="l8">Then the boss: the third ball.</Line>
    <Line id="l9">Hold two in one hand, and keep the same rule: every peak, a throw.</Line>
    <Line id="l10" hold={4.4}>Ten catches in a row, and it's beaten.</Line>
    <Part id="boss3">{() => <Boss x={384} name="THE THIRD BALL" enter={useProp('enter', 0)} hp={useProp('hp', 1)} hit={useProp('hit', 0)} defeat={useProp('defeat', 0)} />}</Part>
    <Part id="pattern3">{() => <Pattern balls={3} label="THREE BALLS" x={20} y={44} w={204} h={120} clock={useProp('clock', 0)} open={useProp('open', 0)} />}</Part>
    <Part id="star">{() => <Loot x={384} icon="star" label="CASCADE" chest={false} open={useProp('open', 0)} fly={useProp('fly', 0)} slot={1} slots={3} />}</Part>
    <Part id="levelup">{() => <Clear x={120} y={158} word="LEVEL UP!" burst={useProp('burst', 0)} beam={useProp('beam', 0)} />}</Part>
    <Animation>
      <Set target="balls" to={{show: 0}} at="start" />
      <Set target="hero" to={{pose: 'walk', face: 'right', hop: 0}} at="start" />
      <Tween target="level" to={{scroll: 620}} at="start" dur={0.9} easing="linear" />
      <Set target="wipe" to={{p: 0}} at="start" />
      <Tween target="wipe" to={{p: 1}} at="start" offset={0.4} dur={1.3} easing="linear" />
      <Set target="level" to={{scroll: 960, dusk: 1}} at="start" offset={1.05} />
      <Set target="hero" to={{pose: 'idle', face: 'front'}} at="start" offset={1.05} />
      <Set target="hud" to={{stage: 'BOSS', boss: true}} at="start" offset={1.05} />
      <Appear target="boss3" line="l8" word="the boss" dur={0} />
      <Tween target="boss3" to={{enter: 1}} line="l8" word="the boss" offset={0.4} dur={1.6} easing="linear" />
      <Tween target="level" to={{shake: 1}} line="l8" word="the boss" offset={1.52} dur={0.7} easing="linear" />
      <Appear target="pattern3" line="l9" word="hold two" dur={0} />
      <Tween target="pattern3" to={{open: 1}} line="l9" word="hold two" dur={0.35} easing="linear" />
      <Tween target="pattern3" to={{clock: 16}} line="l9" word="keep the same rule" dur={16} easing="linear" />
      <Set target="hero" to={{pose: 'act'}} line="l9" word="hold two" />
      <Set target="balls" to={{show: 1, balls: 3, clock: 0}} line="l9" word="hold two" />
      <Tween target="balls" to={{clock: 16}} line="l9" word="keep the same rule" dur={16} easing="linear" />
      <Tween target="boss3" to={{hp: 0}} line="l9" word="every peak" until={{line: 'l10', word: 'beaten'}} easing="linear" />
      <Tween target="boss3" to={{hit: 1}} line="l9" word="every peak" dur={0.5} easing="linear" repeat={7} />
      <Tween target="boss3" to={{defeat: 1}} line="l10" word="beaten" dur={2.4} easing="linear" />
      <Set target="level" to={{shake: 0}} line="l10" word="beaten" />
      <Tween target="level" to={{shake: 1}} line="l10" word="beaten" offset={1.2} dur={0.6} easing="linear" />
      <Tween target="level" to={{dusk: 0}} line="l10" word="beaten" offset={1.3} dur={0.5} easing="linear" />
      <Set target="balls" to={{show: 0}} line="l10" word="beaten" offset={1.2} />
      <Tween target="pattern3" to={{open: 0}} line="l10" word="beaten" offset={1.0} dur={0.3} easing="linear" />
      <Appear target="star" line="l10" word="beaten" offset={1.3} dur={0} />
      <Tween target="star" to={{open: 1}} line="l10" word="beaten" offset={1.3} dur={0.8} easing="linear" />
      <Appear target="levelup" line="l10" word="beaten" offset={1.6} dur={0} />
      <Tween target="levelup" to={{beam: 0.999}} line="l10" word="beaten" offset={1.6} dur={1.6} easing="linear" />
      <Tween target="levelup" to={{burst: 0.999}} line="l10" word="beaten" offset={1.9} dur={1.4} easing="linear" />
      <Tween target="hud" to={{xp: 1}} line="l10" word="beaten" offset={1.6} dur={0.8} easing="linear" />
      <Set target="hero" to={{pose: 'cheer'}} line="l10" word="beaten" offset={1.9} />
      <Tween target="hero" to={{hop: 1}} line="l10" word="beaten" offset={1.9} dur={0.9} easing="linear" />
      <Tween target="star" to={{fly: 1}} line="l10" word="beaten" offset={3.0} dur={0.8} easing="linear" />
      <Tween target="hud" to={{got: 2}} line="l10" word="beaten" offset={3.8} dur={0.5} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="log" title="Practise and the quest log">
    <Line id="l11">Practise with a timer: five minutes, once a day.</Line>
    <Line id="l12" hold={1.6}>Keep at it, and the next level is yours.</Line>
    <Part id="timer">{() => <DeviceScreen device="phone" x={324} y={40} app="TIMER" big={useProp('big', '05:00')} rows={['START', 'RESET']} step={1} n={1} press={useProp('press', 0)} show={useProp('show', 0)} />}</Part>
    <Part id="log">{() => <Results x={44} y={52} rows={['One ball', 'Two balls', 'The third ball', 'Next: four balls']} shown={useProp('shown', 0)} open={useProp('open', 0)} />}</Part>
    <Animation>
      <Set target="balls" to={{show: 0}} at="start" />
      <Set target="hero" to={{pose: 'idle'}} at="start" />
      <Set target="hud" to={{stage: 'END'}} at="start" />
      <Appear target="timer" line="l11" word="timer" dur={0} />
      <Tween target="timer" to={{show: 1}} line="l11" word="timer" dur={0.5} easing="linear" />
      <Tween target="timer" to={{press: 1}} line="l11" word="five minutes" dur={1.1} easing="linear" />
      <Set target="timer" to={{big: '04:59'}} line="l11" word="five minutes" offset={1.4} />
      <Set target="timer" to={{big: '04:58'}} line="l11" word="five minutes" offset={2.4} />
      <Set target="timer" to={{big: '04:57'}} line="l11" word="five minutes" offset={3.4} />
      <Set target="timer" to={{big: '04:56'}} line="l11" word="five minutes" offset={4.4} />
      <Appear target="log" line="l12" word="keep at it" dur={0} />
      <Tween target="log" to={{open: 1}} line="l12" word="keep at it" dur={0.35} easing="linear" />
      <Tween target="log" to={{shown: 3}} line="l12" word="keep at it" offset={0.35} dur={0.9} easing="linear" />
      <Tween target="log" to={{shown: 4}} line="l12" word="next level" dur={0.1} />
      <Set target="hero" to={{pose: 'cheer'}} line="l12" word="yours" />
      <Tween target="hero" to={{hop: 1}} line="l12" word="yours" dur={1.0} easing="linear" />
    </Animation>
  </Scene>
</Doc>;
