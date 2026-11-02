// Drafting Table's sample: one example among many. Do not reuse its story, scenes, layout or timings; read it for technique, after your own scenes are planned.
import {Doc, Scene, Line, Part, Animation, Appear, Disappear, Tween, Set} from '@visotalk/jsx';
import {useProp} from '@visotalk/runtime';
import {Sheet} from '../parts/sheet.tsx';
import {LineWork} from '../parts/line-work.tsx';
import {Section} from '../parts/section.tsx';
import {CutLine} from '../parts/cut-line.tsx';
import {Dimension} from '../parts/dimension.tsx';
import {Callout} from '../parts/callout.tsx';
import {ViewLabel} from '../parts/view-label.tsx';
import {Detail} from '../parts/detail.tsx';
import {Exploded} from '../parts/exploded.tsx';
import {Stroke, ACCENT, LINE, hatchLines, phase, settle} from '../parts/draft.ts';

// A pin tumbler lock in longitudinal section, in canvas pixels: 160 px is the plug's 12.7 mm, so 12.6 px a millimetre.
// The shear line (where the plug meets the housing) is y 510; the plug's axis is y 590.
const SHEAR = 510, AXIS = 590;
const CHAMBERS = [530, 670, 810, 950, 1090];
const KEY_PIN = [62, 84, 54, 78, 68]; // 4.9, 6.7, 4.3, 6.2 and 5.4 mm
const DRIVER = 76, REST = 635, SPRING_TOP = 260;
const rect = (x0: number, y0: number, x1: number, y1: number) => `M${x0} ${y0} H${x1} V${y1} H${x0} Z`;

const HOUSING_OUT = 'M400 430 L470 430 L470 240 L1160 240 L1160 430 L1230 430 L1230 750 L400 750 Z';
const CAVITY = rect(400, SHEAR, 1180, 670);
const CHAMBER_HOLES = CHAMBERS.map((x) => rect(x - 18, SPRING_TOP, x + 18, SHEAR)).join(' ');
const HOUSING = `${HOUSING_OUT} ${CAVITY} ${CHAMBER_HOLES}`;
const PLUG = 'M360 498 L400 498 L400 510 L1180 510 L1180 670 L400 670 L400 682 L360 682 L360 655 L1160 655 L1160 550 L360 550 Z';
const PLUG_HOLES = CHAMBERS.map((x) => rect(x - 18, SHEAR, x + 18, 550)).join(' ');
const PLUG_CUT = `${PLUG} ${PLUG_HOLES}`;
const CENTRES = `M300 ${AXIS} H1290 ${CHAMBERS.map((x) => `M${x} 220 V700`).join(' ')}`;

// the end view, to the right, projected from the section: the same heights
const EV = 1580;
const circle = (x: number, y: number, r: number) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
const END_OUT = `M${EV - 45} ${AXIS - 152} V240 H${EV + 45} V${AXIS - 152} A160 160 0 1 1 ${EV - 45} ${AXIS - 152} Z`;
const END_PLUG = circle(EV, AXIS, 80);
const KEYWAY_END = `M${EV - 10} 550 L${EV + 8} 572 L${EV - 8} 596 L${EV + 10} 620 L${EV - 6} 655 L${EV + 12} 655 L${EV + 22} 620 L${EV + 6} 596 L${EV + 22} 572 L${EV + 6} 550 Z`;
const END_HIDDEN = `M${EV - 18} ${SPRING_TOP} V${SHEAR + 40} M${EV + 18} ${SPRING_TOP} V${SHEAR + 40}`;

// pins, from how far the key has lifted each stack: 0 at rest, 1 when its gap sits on the shear line
const pinBottom = (k: number, lift: number) => REST - (REST - (SHEAR + KEY_PIN[k])) * lift;
const keyPin = (x: number, top: number, bottom: number) => `M${x - 11} ${top} H${x + 11} L${x + 15} ${top + 4} V${bottom - 12} L${x} ${bottom} L${x - 15} ${bottom - 12} V${top + 4} Z`;
const driverPin = (x: number, top: number, bottom: number) => `M${x - 11} ${top} H${x + 11} L${x + 15} ${top + 4} V${bottom - 4} L${x + 11} ${bottom} H${x - 11} L${x - 15} ${bottom - 4} V${top + 4} Z`;
const spring = (x: number, top: number, bottom: number) => {
  const n = 9, step = (bottom - top) / n;
  return `M${x} ${top} ${Array.from({length: n}, (_, i) => `L${x + (i % 2 ? -13 : 13)} ${top + step * (i + 0.5)}`).join(' ')} L${x} ${bottom}`;
};
const pins = (lift: number | number[]) => CHAMBERS.map((x, k) => {
  const b = pinBottom(k, typeof lift === 'number' ? lift : lift[k]), t = b - KEY_PIN[k], d = t - DRIVER;
  return {key: keyPin(x, t, b), driver: driverPin(x, d, t), spring: spring(x, SPRING_TOP, d), driverTop: d};
});

/**
 * The five stacks. `drop` 0 to 1 lowers the pins into their chambers one after another, from above the housing, each seated with a small bounce;
 * `springs` draws the springs once they are in; `lift` 0 to 1 is the key sliding under them, so the front stack rises first.
 */
function Pins({drop = 1, springs = 1, lift = 0}: {drop?: number; springs?: number; lift?: number}) {
  const p = pins(CHAMBERS.map((_, k) => settle(phase(lift, k * 0.1, k * 0.1 + 0.55), 1.6)));
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      {p.map((s, k) => {
        const fall = settle(phase(drop, k * 0.13, k * 0.13 + 0.48), 0.9);
        if (fall <= 0) return null;
        const dy = -(1 - fall) * 300;
        return <g key={k} transform={`translate(0 ${dy.toFixed(1)})`} opacity={phase(drop, k * 0.13, k * 0.13 + 0.08)}>
          <Stroke d={s.spring} weight="detail" draw={springs} />
          <Stroke d={s.driver} weight="outline" solid />
          <Stroke d={s.key} weight="outline" solid />
        </g>;
      })}
    </svg>
  );
}

// a small end view in the corner, whose plug turns a quarter once the shear line is clear
function TurningPlug({turn = 0, draw = 1}: {turn?: number; draw?: number}) {
  const a = settle(turn, 0.8) * 90;
  const arc = (r: number, a0: number, a1: number) => {
    const p = (deg: number) => [EV + r * Math.cos((deg * Math.PI) / 180), AXIS + r * Math.sin((deg * Math.PI) / 180)].map((v) => v.toFixed(1)).join(' ');
    return `M${p(a0)} A${r} ${r} 0 0 1 ${p(a1)}`;
  };
  const head = (deg: number, r: number) => {
    const t = (deg * Math.PI) / 180, x = EV + r * Math.cos(t), y = AXIS + r * Math.sin(t), tx = -Math.sin(t), ty = Math.cos(t), nx = Math.cos(t), ny = Math.sin(t);
    return `M${x + tx * 4} ${y + ty * 4} L${x - tx * 22 + nx * 9} ${y - ty * 22 + ny * 9} L${x - tx * 22 - nx * 9} ${y - ty * 22 - ny * 9} Z`;
  };
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <g transform={`translate(1590 752) scale(0.6) translate(${-EV} ${-AXIS})`}>
        <Stroke d={`M${EV - 200} ${AXIS} H${EV + 200} M${EV} 220 V780`} weight="centre" draw={draw} />
        <Stroke d={END_OUT} draw={draw} width={6} />
        <g transform={`rotate(${a.toFixed(2)} ${EV} ${AXIS})`}>
          <Stroke d={END_PLUG} accent={turn > 0} draw={draw} width={6} />
          <Stroke d={KEYWAY_END} weight="detail" draw={draw} width={4} />
        </g>
        {turn > 0 && <>
          <path d={arc(192, -60, -60 + a)} stroke={ACCENT} strokeWidth={5} fill="none" />
          {a > 8 && <path d={head(-60 + a, 192)} fill={ACCENT} />}
        </>}
      </g>
    </svg>
  );
}

// the key, cut to lift each stack to the shear line
const KEY = (() => {
  const valleys = CHAMBERS.map((x, k) => [x, SHEAR + KEY_PIN[k]]).reverse();
  const top = valleys.map(([x, y]) => `L${x + 30} 556 L${x + 8} ${y} L${x - 8} ${y} L${x - 30} 556`).join(' ');
  return `M360 556 L360 520 L210 520 Q160 520 160 570 L160 630 Q160 680 210 680 L360 680 L360 645 L1125 645 L1150 615 L1150 575 L1135 556 ${top} Z ${circle(208, 600, 22)}`;
})();

// the joint of the third stack, drawn again as plain SVG for the magnified detail: only what falls in the small circle's square (x 760–860, y 460–560),
// since every line is measured where it runs even when the circle hides it; strokes keep their width when it is scaled up
function Joint({hot = true}: {hot?: boolean}) {
  const s = {fill: 'none', vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const};
  const hatch = (box: [number, number, number, number], angle: number) => hatchLines(box, angle, 4.5); // 18 px apart once magnified four times
  return (
    <g>
      <path d={`${hatch([760, 460, 792, 510], 45)} ${hatch([828, 460, 860, 510], 45)}`} stroke={LINE.thin.color} strokeWidth={1.5} {...s} />
      <path d={`${hatch([760, 510, 792, 550], 135)} ${hatch([828, 510, 860, 550], 135)}`} stroke={LINE.thin.color} strokeWidth={1.5} {...s} />
      <path d="M792 460 V550 M828 460 V550 M760 550 H792 M828 550 H860" stroke="var(--vt-text)" strokeWidth={4} {...s} />
      <path d="M795 460 V506 L799 510 H821 L825 506 V460 M795 560 V514 L799 510 H821 L825 514 V560" stroke="var(--vt-text)" strokeWidth={4} {...s} />
      <path d={`M760 ${SHEAR} H860`} stroke={hot ? ACCENT : 'var(--vt-text)'} strokeWidth={4} {...s} />
    </g>
  );
}

// one chamber, taken apart along its centre line; each part in its own box, listed back to front; the housing and plug are cut through, so their faces are hatched
const EXPLODED = [
  {d: spring(15, 0, 110), w: 30, h: 110, from: 78, to: 150, label: 'spring', delay: 0.1, solid: false, depth: 26},
  {d: driverPin(15, 0, DRIVER), w: 30, h: DRIVER, from: 150, to: 285, label: 'driver pin', delay: 0.2, depth: 30},
  {d: keyPin(15, 0, 62), w: 30, h: 62, from: 226, to: 390, label: 'key pin', delay: 0.3, depth: 30},
  {d: 'M0 60 H280 L300 40 V14 L290 0 H190 L160 22 H140 L110 0 H0 Z', w: 300, h: 60, from: 262, to: 596, label: 'key', delay: 0.45, depth: 14},
  {d: 'M0 0 H112 V70 H148 V0 H260 V90 H0 Z', w: 260, h: 90, from: 190, to: 478, label: 'plug', delay: 0.35, depth: 90, cut: true},
  {d: 'M0 0 H260 V130 H148 V18 H112 V130 H0 Z', w: 260, h: 130, from: 60, to: 0, label: 'housing', delay: 0, depth: 90, cut: true},
];

export default <Doc
  id="drafting-table-sample"
  title="How a pin tumbler lock works"
  poster={35.9}
  lang="en"
  canvas="16x9"
  theme="visotalk/dark"
  tokens={{
    colors: {bg: '#0A1A33', panel: '#123764', panel2: '#19467A', border: '#A9BEDA', text: '#EEF3F8', muted: '#93AED0', faint: '#2E5A90', data: '#FF7A50', grad: '#FF7A50', op: '#B9C8FF', good: '#7FD1A8', bad: '#FF7A50', warn: '#FFD27A'},
    fonts: {sans: '"Hanken Grotesk", "Noto Sans SC", sans-serif', mono: '"JetBrains Mono", "Noto Sans SC", monospace', display: '"Hanken Grotesk", "Noto Sans SC", sans-serif'},
    caption: {font: 'sans', size: 34, weight: 500, color: '#EEF3F8', background: 'rgba(10, 28, 54, 0.92)', radius: 2, padding: [10, 26], bottom: 78, rule: '#93AED0', ruleSide: 'left'},
  }}
  pacing={{lead: 0.4, hold: 0.6, tail: 1}}
  exports={{captions: 'burned'}}
>
  <Scene id="cut" title="Cut open">
    <Line id="l1">This is a pin tumbler lock, the kind on most front doors.</Line>
    <Line id="l2" text="Cut it open along the keyway, and inside a fixed housing sits a brass plug, about 13 mm across.">Cut it open along the keyway, and inside a fixed housing sits a brass plug, about thirteen millimetres across.</Line>

    <Part id="sheet">{() => <Sheet title="Pin tumbler lock" note={useProp('note', 'End view')} />}</Part>
    <Part id="end-view">{() => <LineWork width={1920} height={1080} draw={useProp('draw', 0)} layers={[
      {d: `M${EV - 200} ${AXIS} H${EV + 200} M${EV} 220 V780`, weight: 'centre'},
      {d: END_OUT},
      {d: END_PLUG},
      {d: KEYWAY_END, weight: 'detail'},
      {d: END_HIDDEN, weight: 'hidden'},
    ]} />}</Part>
    <Part id="cut-line">{() => <CutLine from={[EV, 212]} to={[EV, 772]} look={-1} draw={useProp('draw', 0)} />}</Part>
    <Part id="section-lines">{() => <LineWork width={1920} height={1080} draw={useProp('draw', 0)} layers={[
      {d: CENTRES, weight: 'centre'},
      {d: HOUSING},
      {d: PLUG_CUT},
    ]} />}</Part>
    <Part id="housing-hatch">{() => <Section d={HOUSING} width={1920} height={1080} cut={useProp('cut', 0)} />}</Part>
    <Part id="plug-hatch">{() => <Section d={PLUG_CUT} angle={135} width={1920} height={1080} cut={useProp('cut', 0)} />}</Part>
    <Part id="housing-name">{() => <Callout at={[1215, 700]} knee={[1290, 806]} text="housing" draw={useProp('draw', 0)} />}</Part>
    <Part id="plug-name">{() => <Callout at={[380, 520]} knee={[250, 440]} side="left" text="plug" draw={useProp('draw', 0)} />}</Part>
    <Part id="plug-size">{() => <Dimension from={[1180, 670]} to={[1180, 510]} offset={-118} value="Ø12.7" accent measure={useProp('measure', 0)} />}</Part>
    <Part id="section-name">{() => <div style={{position: 'absolute', left: 560, top: 790}}><ViewLabel text="Section A–A" scale="2 : 1" write={useProp('write', 0)} /></div>}</Part>

    <Animation>
      {/* the camera: every drawn part fills the canvas, so one scale and shift on all of them moves over the drawing together, inside the sheet's frame, which stays. It opens close on the end view and pulls back as the lock is cut */}
      <Set target={["end-view", "cut-line", "section-lines", "housing-hatch", "plug-hatch", "housing-name", "plug-name", "plug-size", "section-name"]} at="start" to={{scale: 1.3, x: -806, y: 22}} />
      <Tween id="pull" target={["end-view", "cut-line", "section-lines", "housing-hatch", "plug-hatch", "housing-name", "plug-name", "plug-size", "section-name"]} line="l2" word="Cut it open" dur={1.3} to={{scale: 1, x: 0, y: 0}} easing="easeInOutQuart" />
      <Appear target="sheet" at="start" dur={0} />
      <Appear target="end-view" line="l1" word="pin tumbler lock" dur={0} />
      <Tween target="end-view" to={{draw: 1}} line="l1" word="pin tumbler lock" dur={2.4} easing="easeInOutSine" />
      <Set target="sheet" after="pull" to={{note: "Section A–A · end view"}} />
      <Appear target="cut-line" after="pull" dur={0} />
      <Tween id="cut" target="cut-line" to={{draw: 1}} after="pull" dur={0.6} easing="easeInOutSine" />
      <Appear target="section-lines" after="cut" dur={0} />
      <Tween target="section-lines" to={{draw: 1}} after="cut" dur={1.4} easing="easeInOutSine" />
      <Appear target="housing-hatch" line="l2" word="housing" edge="end" dur={0} />
      <Tween target="housing-hatch" to={{cut: 1}} line="l2" word="housing" edge="end" dur={1.1} easing="easeInOutSine" />
      <Appear target="housing-name" line="l2" word="housing" edge="end" dur={0} />
      <Tween target="housing-name" to={{draw: 1}} line="l2" word="housing" edge="end" dur={0.9} easing="linear" />
      <Appear target="plug-hatch" line="l2" word="brass plug" dur={0} />
      <Tween target="plug-hatch" to={{cut: 1}} line="l2" word="brass plug" dur={1} easing="easeInOutSine" />
      <Appear target="plug-name" line="l2" word="brass plug" dur={0} />
      <Tween target="plug-name" to={{draw: 1}} line="l2" word="brass plug" dur={0.8} easing="linear" />
      <Appear target="plug-size" line="l2" word="thirteen millimetres" dur={0} />
      <Tween target="plug-size" to={{measure: 1}} line="l2" word="thirteen millimetres" dur={1.3} easing="linear" />
      <Appear target="section-name" line="l2" word="across" dur={0} />
      <Tween target="section-name" to={{write: 1}} line="l2" word="across" dur={0.8} easing="linear" />
      {/* the next scene keeps the section: what it does not keep is cleared, so the cut between them is no jump */}
      <Disappear target={["end-view", "cut-line", "plug-size", "section-name", "housing-name", "plug-name"]} at="end" offset={-0.5} dur={0.4} />
    </Animation>
  </Scene>

  <Scene id="pins" title="The pins">
    <Line id="l3">Five chambers are drilled through both, and each one holds a stack of pins.</Line>
    <Line id="l4">A key pin, a driver pin and a spring above them: the drivers block the plug.</Line>

    <Part id="sheet"><Sheet title="Pin tumbler lock" note="Section A–A · at rest" /></Part>
    <Part id="drawing">
      <LineWork width={1920} height={1080} layers={[{d: CENTRES, weight: 'centre'}, {d: HOUSING}, {d: PLUG_CUT}]} />
      <Section d={HOUSING} width={1920} height={1080} />
      <Section d={PLUG_CUT} angle={135} width={1920} height={1080} />
    </Part>
    <Part id="pins">{() => <Pins drop={useProp('drop', 0)} springs={useProp('springs', 0)} />}</Part>
    <Part id="key-pin-name">{() => <Callout at={[1100, 612]} knee={[1290, 700]} text="key pin" draw={useProp('draw', 0)} />}</Part>
    <Part id="driver-name">{() => <Callout at={[1100, 470]} knee={[1290, 470]} text="driver pin" draw={useProp('draw', 0)} />}</Part>
    <Part id="spring-name">{() => <Callout at={[1100, 330]} knee={[1290, 330]} text="spring" draw={useProp('draw', 0)} />}</Part>
    <Part id="shear">{() => <LineWork width={1920} height={1080} draw={useProp('draw', 0)} layers={[{d: `M330 ${SHEAR} H1270`, weight: 'centre'}]} />}</Part>
    <Part id="shear-name">{() => <Callout at={[345, SHEAR]} knee={[290, 806]} text="shear line" draw={useProp('draw', 0)} />}</Part>

    <Animation>
      <Appear target={['sheet', 'drawing']} at="start" dur={0} />
      <Appear target="pins" line="l3" word="stack of pins" dur={0} />
      <Tween target="pins" to={{drop: 1}} line="l3" word="stack of pins" dur={1.8} easing="linear" />
      <Tween target="pins" to={{springs: 1}} line="l4" word="spring" dur={0.9} easing="easeInOutSine" />
      <Appear target="key-pin-name" line="l4" word="key pin" dur={0} />
      <Tween target="key-pin-name" to={{draw: 1}} line="l4" word="key pin" dur={0.8} easing="linear" />
      <Appear target="driver-name" line="l4" word="driver pin" dur={0} />
      <Tween target="driver-name" to={{draw: 1}} line="l4" word="driver pin" dur={0.8} easing="linear" />
      <Appear target="spring-name" line="l4" word="spring" dur={0} />
      <Tween target="spring-name" to={{draw: 1}} line="l4" word="spring" dur={0.8} easing="linear" />
      <Appear target="shear" line="l4" word="block the plug" dur={0} />
      <Tween target="shear" to={{draw: 1}} line="l4" word="block the plug" dur={0.9} easing="easeInOutSine" />
      <Appear target="shear-name" line="l4" word="block the plug" dur={0} />
      <Tween target="shear-name" to={{draw: 1}} line="l4" word="block the plug" dur={0.9} easing="linear" />
    </Animation>
  </Scene>

  <Scene id="key" title="The right key">
    <Line id="l5">The right key lifts every stack until the gap between its two pins sits exactly on the shear line.</Line>
    <Line id="l6" hold={1}>Seen up close, nothing crosses that line any more, so the plug is free to turn.</Line>

    <Part id="sheet"><Sheet title="Pin tumbler lock" note="Section A–A · key in" /></Part>
    <Part id="drawing">
      <LineWork width={1920} height={1080} layers={[{d: CENTRES, weight: 'centre'}, {d: HOUSING}, {d: PLUG_CUT}]} />
      <Section d={HOUSING} width={1920} height={1080} />
      <Section d={PLUG_CUT} angle={135} width={1920} height={1080} />
    </Part>
    <Part id="key">{() => (
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <g transform={`translate(${-150 * (1 - useProp('push', 0))} 0)`}><Stroke d={KEY} weight="outline" solid /></g>
      </svg>
    )}</Part>
    <Part id="pins">{() => <Pins lift={useProp('lift', 0)} />}</Part>
    <Part id="end-turn">{() => <TurningPlug draw={useProp('draw', 0)} turn={useProp('turn', 0)} />}</Part>
    <Part id="shear">{() => <LineWork width={1920} height={1080} draw={useProp('draw', 0)} layers={[{d: `M330 ${SHEAR} H1270`, weight: 'centre', accent: useProp('hot', 1) > 0.5}]} />}</Part>
    <Part id="joint">{() => <Detail at={[810, SHEAR]} r={50} to={[1590, 300]} radius={150} open={useProp('open', 0)}><Joint hot={useProp('shear', 'hot', 1) > 0.5} /></Detail>}</Part>

    <Animation>
      <Appear target={['sheet', 'drawing', 'pins']} at="start" dur={0} />
      <Appear target="key" line="l5" word="right key" dur={0.3} />
      <Tween target="key" to={{push: 1}} line="l5" word="right key" dur={1.4} easing="easeOutQuart" />
      <Tween target="pins" to={{lift: 1}} line="l5" word="lifts every stack" dur={1.5} easing="linear" />
      <Appear target="shear" line="l5" word="shear line" dur={0} />
      <Tween target="shear" to={{draw: 1}} line="l5" word="shear line" dur={0.9} easing="easeInOutSine" />
      <Appear target="joint" line="l6" word="Seen up close" dur={0} />
      <Tween target="joint" to={{open: 1}} line="l6" word="Seen up close" dur={2.2} easing="linear" />
      <Appear target="end-turn" line="l6" word="nothing crosses" dur={0} />
      <Tween target="end-turn" to={{draw: 1}} line="l6" word="nothing crosses" dur={1.2} easing="easeInOutSine" />
      {/* one vermilion thing at a time: the shear line hands the colour to the turn */}
      <Set target="shear" line="l6" word="free to turn" to={{hot: 0}} />
      <Tween target="end-turn" to={{turn: 1}} line="l6" word="free to turn" dur={1.1} easing="linear" />
      {/* the camera glides along the sheet to the next view: this drawing slides off to the left and fades, the next one comes in from the right */}
      <Tween target={["drawing", "key", "pins", "end-turn", "shear", "joint"]} at="end" offset={-0.7} dur={0.7} to={{x: -140}} easing="easeInQuad" />
      <Disappear target={["drawing", "key", "pins", "end-turn", "shear", "joint"]} at="end" offset={-0.7} dur={0.6} />
    </Animation>
  </Scene>

  <Scene id="apart" title="Taken apart">
    <Line id="l7">Taken apart, one chamber is only a spring and two pins, between the housing and the plug.</Line>
    <Line id="l8" hold={1.4} text="The lock's secret is not its metal, but five pins of brass, each cut to its length.">The lock's secret is not its metal, but five pins of brass, each cut to its length.</Line>

    <Part id="sheet"><Sheet title="Pin tumbler lock" note="One chamber" /></Part>
    <Part id="chamber" x={420} y={110} w={880} h={800}>{() => (
      <div style={{transform: 'translate(0, 30px) scale(1.1)', transformOrigin: '0 0'}}>
        <Exploded items={EXPLODED} width={620} height={660} spread={useProp('spread', 0)} tilt={useProp('tilt', 0)} labels={useProp('labels', 0)} />
      </div>
    )}</Part>
    <Part id="pin-length" x={420} y={110} w={880} h={800}>{() => (
      <div style={{transform: 'translate(0, 30px) scale(1.1)', transformOrigin: '0 0'}}>
        <Dimension from={[295, 452]} to={[295, 390]} offset={70} value="4.9" accent measure={useProp('measure', 0)} />
      </div>
    )}</Part>
    <Part id="view-name" x={1290} y={780} w={510} h={90}>{() => <ViewLabel text="Exploded view" scale="2 : 1" write={useProp('write', 0)} />}</Part>

    <Animation>
      <Set target={["chamber", "view-name"]} at="start" to={{x: 160}} />
      <Appear target="sheet" at="start" dur={0} />
      <Appear target="chamber" at="start" dur={0.6} />
      <Tween target={["chamber", "view-name"]} at="start" dur={0.9} to={{x: 0}} easing="easeOutQuad" />
      <Tween target="chamber" to={{spread: 1}} line="l7" word="Taken apart" dur={2.2} easing="linear" />
      <Tween target="chamber" to={{tilt: 1}} line="l7" word="Taken apart" offset={0.6} dur={2.4} easing="linear" />
      <Tween target="chamber" to={{labels: 1}} line="l7" word="one chamber" dur={2.6} easing="linear" />
      {/* back to a flat elevation to measure: a length is read off a true view */}
      <Tween target="chamber" to={{tilt: 0}} line="l8" word="five pins" dur={1.2} easing="linear" />
      <Appear target="view-name" line="l7" word="between the housing" dur={0} />
      <Tween target="view-name" to={{write: 1}} line="l7" word="between the housing" dur={0.8} easing="linear" />
      <Appear target="pin-length" line="l8" word="each cut" dur={0} />
      <Tween target="pin-length" to={{measure: 1}} line="l8" word="each cut" dur={1.3} easing="linear" />
    </Animation>
  </Scene>
</Doc>;
