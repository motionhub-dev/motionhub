// Drafting Table's reel: twenty seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
import type {CSSProperties, ReactNode} from 'react';
import {Easing, Sequence, interpolate, useTime} from '@motionhub/runtime';
import {Sheet} from './parts/sheet.tsx';
import {LineWork} from './parts/line-work.tsx';
import {Section} from './parts/section.tsx';
import {CutLine} from './parts/cut-line.tsx';
import {Dimension} from './parts/dimension.tsx';
import {Callout} from './parts/callout.tsx';
import {ViewLabel} from './parts/view-label.tsx';
import {Detail} from './parts/detail.tsx';
import {Exploded} from './parts/exploded.tsx';
import {Stroke, ACCENT, LINE, hatchLines, phase, settle} from './parts/draft.ts';

export const reel = {seconds: 20, width: 1920, height: 1080};
/** What happens when, for the motion's sound (sound.json): a line draws, the view pulls back, a section is hatched, a part clicks into place, a dimension measures out */
export const cues = [
  {at: 0.05, role: 'draw', dur: 1.45}, {at: 1.5, role: 'move', dur: 1.1}, {at: 2.4, role: 'draw', dur: 0.5}, {at: 2.7, role: 'draw', dur: 1.2},
  {at: 3.7, role: 'draw', dur: 0.9}, {at: 4.7, role: 'land'}, {at: 5.2, role: 'land'}, {at: 6, role: 'count'}, {at: 6.6, role: 'cut'},
  {at: 7.8, role: 'land'}, {at: 9, role: 'move', dur: 0.9}, {at: 9.6, role: 'move', dur: 1.2}, {at: 10.6, role: 'draw', dur: 0.6},
  {at: 11.2, role: 'move', dur: 1.4}, {at: 12.6, role: 'move', dur: 0.9}, {at: 13.5, role: 'count'}, {at: 14, role: 'cut'},
  {at: 14.3, role: 'move', dur: 1.4}, {at: 16, role: 'move', dur: 1}, {at: 17.2, role: 'land'}, {at: 18, role: 'draw', dur: 0.9},
  {at: 18.9, role: 'count'},
];

const ease = Easing.inOutSine, out = Easing.outQuart, lin = Easing.linear;
const at = (t: number, from: number, to: number, a = 0, b = 1, easing = ease) => interpolate(t, [from, to], [a, b], {easing});
/** Seen between `a` and `b`: in over a quarter second, out over a third */
const seen = (t: number, a: number, b = 99) => Math.min(at(t, a, a + 0.25), at(t, b - 0.35, b, 1, 0));

/** The whole frame as a layer, so a camera move can scale and shift the drawing inside the sheet, which stays */
function Layer({style, children}: {style?: CSSProperties; children: ReactNode}) {
  return <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '50% 50%', ...style}}>{children}</div>;
}

// A pin tumbler lock in longitudinal section, in canvas pixels (from the motion's sample). Shear line y 510, plug axis y 590.
const SHEAR = 510, AXIS = 590;
const CHAMBERS = [530, 670, 810, 950, 1090];
const KEY_PIN = [62, 84, 54, 78, 68];
const DRIVER = 76, REST = 635, SPRING_TOP = 260;
const rect = (x0: number, y0: number, x1: number, y1: number) => `M${x0} ${y0} H${x1} V${y1} H${x0} Z`;
const circle = (x: number, y: number, r: number) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;

const HOUSING_OUT = 'M400 430 L470 430 L470 240 L1160 240 L1160 430 L1230 430 L1230 750 L400 750 Z';
const HOUSING = `${HOUSING_OUT} ${rect(400, SHEAR, 1180, 670)} ${CHAMBERS.map((x) => rect(x - 18, SPRING_TOP, x + 18, SHEAR)).join(' ')}`;
const PLUG = 'M360 498 L400 498 L400 510 L1180 510 L1180 670 L400 670 L400 682 L360 682 L360 655 L1160 655 L1160 550 L360 550 Z';
const PLUG_CUT = `${PLUG} ${CHAMBERS.map((x) => rect(x - 18, SHEAR, x + 18, 550)).join(' ')}`;
const CENTRES = `M300 ${AXIS} H1290 ${CHAMBERS.map((x) => `M${x} 220 V700`).join(' ')}`;

// the end view, projected from the section at the same heights
const EV = 1580;
const END_OUT = `M${EV - 45} ${AXIS - 152} V240 H${EV + 45} V${AXIS - 152} A160 160 0 1 1 ${EV - 45} ${AXIS - 152} Z`;
const END_PLUG = circle(EV, AXIS, 80);
const KEYWAY_END = `M${EV - 10} 550 L${EV + 8} 572 L${EV - 8} 596 L${EV + 10} 620 L${EV - 6} 655 L${EV + 12} 655 L${EV + 22} 620 L${EV + 6} 596 L${EV + 22} 572 L${EV + 6} 550 Z`;
const END_HIDDEN = `M${EV - 18} ${SPRING_TOP} V${SHEAR + 40} M${EV + 18} ${SPRING_TOP} V${SHEAR + 40}`;

const pinBottom = (k: number, lift: number) => REST - (REST - (SHEAR + KEY_PIN[k])) * lift;
const keyPin = (x: number, top: number, bottom: number) => `M${x - 11} ${top} H${x + 11} L${x + 15} ${top + 4} V${bottom - 12} L${x} ${bottom} L${x - 15} ${bottom - 12} V${top + 4} Z`;
const driverPin = (x: number, top: number, bottom: number) => `M${x - 11} ${top} H${x + 11} L${x + 15} ${top + 4} V${bottom - 4} L${x + 11} ${bottom} H${x - 11} L${x - 15} ${bottom - 4} V${top + 4} Z`;
const spring = (x: number, top: number, bottom: number) => {
  const n = 9, step = (bottom - top) / n;
  return `M${x} ${top} ${Array.from({length: n}, (_, i) => `L${x + (i % 2 ? -13 : 13)} ${top + step * (i + 0.5)}`).join(' ')} L${x} ${bottom}`;
};

/** The five stacks: `drop` lowers them in one after another with a small bounce, `springs` draws the springs, `lift` is the key under them */
function Pins({drop = 1, springs = 1, lift = 0}: {drop?: number; springs?: number; lift?: number}) {
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      {CHAMBERS.map((x, k) => {
        const fall = settle(phase(drop, k * 0.13, k * 0.13 + 0.48), 0.9);
        if (fall <= 0) return null;
        const b = pinBottom(k, settle(phase(lift, k * 0.1, k * 0.1 + 0.55), 1.6)), top = b - KEY_PIN[k], d = top - DRIVER;
        return <g key={k} transform={`translate(0 ${(-(1 - fall) * 300).toFixed(1)})`} opacity={phase(drop, k * 0.13, k * 0.13 + 0.08)}>
          <Stroke d={spring(x, SPRING_TOP, d)} weight="detail" draw={springs} />
          <Stroke d={driverPin(x, d, top)} weight="outline" solid />
          <Stroke d={keyPin(x, top, b)} weight="outline" solid />
        </g>;
      })}
    </svg>
  );
}

// the key, cut to lift each stack to the shear line
const KEY = (() => {
  const top = CHAMBERS.map((x, k) => [x, SHEAR + KEY_PIN[k]]).reverse().map(([x, y]) => `L${x + 30} 556 L${x + 8} ${y} L${x - 8} ${y} L${x - 30} 556`).join(' ');
  return `M360 556 L360 520 L210 520 Q160 520 160 570 L160 630 Q160 680 210 680 L360 680 L360 645 L1125 645 L1150 615 L1150 575 L1135 556 ${top} Z ${circle(208, 600, 22)}`;
})();

/** A small end view in the corner whose plug turns a quarter once the shear line is clear */
function TurningPlug({turn = 0, draw = 1}: {turn?: number; draw?: number}) {
  const a = settle(turn, 0.8) * 90;
  const p = (deg: number, r: number) => [EV + r * Math.cos((deg * Math.PI) / 180), AXIS + r * Math.sin((deg * Math.PI) / 180)];
  const arc = (r: number, a0: number, a1: number) => `M${p(a0, r).map((v) => v.toFixed(1)).join(' ')} A${r} ${r} 0 0 1 ${p(a1, r).map((v) => v.toFixed(1)).join(' ')}`;
  const head = (deg: number, r: number) => {
    const t = (deg * Math.PI) / 180, [x, y] = p(deg, r), tx = -Math.sin(t), ty = Math.cos(t), nx = Math.cos(t), ny = Math.sin(t);
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

/** The third stack's joint drawn again for the magnified detail: only what lies in the small circle's square (x 760–860, y 460–560) */
function Joint({hot}: {hot: boolean}) {
  const s = {fill: 'none', vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const};
  const hatch = (box: [number, number, number, number], angle: number) => hatchLines(box, angle, 4.5);
  return (
    <g>
      <path d={`${hatch([760, 460, 792, 510], 45)} ${hatch([828, 460, 860, 510], 45)}`} stroke={LINE.thin.color} strokeWidth={1.5} {...s} />
      <path d={`${hatch([760, 510, 792, 550], 135)} ${hatch([828, 510, 860, 550], 135)}`} stroke={LINE.thin.color} strokeWidth={1.5} {...s} />
      <path d="M792 460 V550 M828 460 V550 M760 550 H792 M828 550 H860" stroke="var(--color-text)" strokeWidth={4} {...s} />
      <path d="M795 460 V506 L799 510 H821 L825 506 V460 M795 560 V514 L799 510 H821 L825 514 V560" stroke="var(--color-text)" strokeWidth={4} {...s} />
      <path d={`M760 ${SHEAR} H860`} stroke={hot ? ACCENT : 'var(--color-text)'} strokeWidth={4} {...s} />
    </g>
  );
}

const EXPLODED = [
  {d: spring(15, 0, 110), w: 30, h: 110, from: 78, to: 150, label: 'spring', delay: 0.1, solid: false, depth: 26},
  {d: driverPin(15, 0, DRIVER), w: 30, h: DRIVER, from: 150, to: 285, label: 'driver pin', delay: 0.2, depth: 30},
  {d: keyPin(15, 0, 62), w: 30, h: 62, from: 226, to: 390, label: 'key pin', delay: 0.3, depth: 30},
  {d: 'M0 60 H280 L300 40 V14 L290 0 H190 L160 22 H140 L110 0 H0 Z', w: 300, h: 60, from: 262, to: 596, label: 'key', delay: 0.45, depth: 14},
  {d: 'M0 0 H112 V70 H148 V0 H260 V90 H0 Z', w: 260, h: 90, from: 190, to: 478, label: 'plug', delay: 0.35, depth: 90, cut: true},
  {d: 'M0 0 H260 V130 H148 V18 H112 V130 H0 Z', w: 260, h: 130, from: 60, to: 0, label: 'housing', delay: 0, depth: 90, cut: true},
];

const SECTION_LAYERS = [{d: CENTRES, weight: 'centre' as const}, {d: HOUSING}, {d: PLUG_CUT}];

/** 0–6.6 s: the end view is drafted close up, the camera pulls back, the lock is cut along A–A, hatched, named and measured */
function CutOpen() {
  const t = useTime();
  const s = at(t, 1.5, 2.6, 1.3, 1, Easing.inOutCubic), x = at(t, 1.5, 2.6, -806, 0, Easing.inOutCubic), y = at(t, 1.5, 2.6, 22, 0, Easing.inOutCubic);
  const leave = at(t, 6.2, 6.6, 1, 0);
  return (
    <Layer style={{transform: `translate(${x}px, ${y}px) scale(${s})`}}>
      <div style={{opacity: leave}}>
        <LineWork width={1920} height={1080} draw={at(t, 0.05, 1.5)} layers={[
          {d: `M${EV - 200} ${AXIS} H${EV + 200} M${EV} 220 V780`, weight: 'centre'},
          {d: END_OUT}, {d: END_PLUG}, {d: KEYWAY_END, weight: 'detail'}, {d: END_HIDDEN, weight: 'hidden'},
        ]} />
        <CutLine from={[EV, 212]} to={[EV, 772]} look={-1} draw={at(t, 2.4, 2.9)} />
      </div>
      <LineWork width={1920} height={1080} draw={at(t, 2.7, 3.9)} layers={SECTION_LAYERS} />
      <Section d={HOUSING} width={1920} height={1080} cut={at(t, 3.7, 4.6)} />
      <Section d={PLUG_CUT} angle={135} width={1920} height={1080} cut={at(t, 4.3, 5.1)} />
      <div style={{opacity: leave}}>
        <Callout at={[1215, 700]} knee={[1290, 806]} text="housing" draw={at(t, 4.0, 4.7, 0, 1, lin)} />
        <Callout at={[380, 520]} knee={[250, 440]} side="left" text="plug" draw={at(t, 4.6, 5.2, 0, 1, lin)} />
        <Dimension from={[1180, 670]} to={[1180, 510]} offset={-118} value="Ø12.7" accent measure={at(t, 5.1, 6.0, 0, 1, lin)} />
        <div style={{position: 'absolute', left: 560, top: 790}}><ViewLabel text="Section A–A" scale="2 : 1" write={at(t, 5.3, 5.9, 0, 1, lin)} /></div>
      </div>
    </Layer>
  );
}

/** 6.6–14 s: the pins drop in and are named, the key slides under them, the joint is lifted out and the plug turns */
function Mechanism() {
  const t = useTime();
  const names = seen(t, 0, 4.6), glide = at(t, 7.0, 7.4, 0, -140, Easing.bezier(0.55, 0, 1, 0.45)), gone = at(t, 7.0, 7.4, 1, 0);
  const hot = t < 6.0;
  return (
    <Layer style={{transform: `translateX(${glide}px)`, opacity: gone}}>
      <LineWork width={1920} height={1080} layers={SECTION_LAYERS} />
      <Section d={HOUSING} width={1920} height={1080} />
      <Section d={PLUG_CUT} angle={135} width={1920} height={1080} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: at(t, 2.4, 2.7)}}>
        <g transform={`translate(${at(t, 2.4, 3.3, -150, 0, out)} 0)`}><Stroke d={KEY} weight="outline" solid /></g>
      </svg>
      <Pins drop={at(t, 0.1, 1.4, 0, 1, lin)} springs={at(t, 1.0, 1.6)} lift={at(t, 3.0, 4.2, 0, 1, lin)} />
      <div style={{opacity: names}}>
        <Callout at={[1100, 612]} knee={[1290, 700]} text="key pin" draw={at(t, 1.3, 1.9, 0, 1, lin)} />
        <Callout at={[1100, 470]} knee={[1290, 470]} text="driver pin" draw={at(t, 1.6, 2.2, 0, 1, lin)} />
        <Callout at={[1100, 330]} knee={[1290, 330]} text="spring" draw={at(t, 1.9, 2.5, 0, 1, lin)} />
      </div>
      <LineWork width={1920} height={1080} draw={at(t, 4.0, 4.6)} layers={[{d: `M330 ${SHEAR} H1270`, weight: 'centre', accent: hot}]} />
      <Detail at={[810, SHEAR]} r={50} to={[1590, 300]} radius={150} open={at(t, 4.6, 6.0, 0, 1, lin)}><Joint hot={hot} /></Detail>
      <TurningPlug draw={at(t, 5.3, 6.0)} turn={at(t, 6.0, 6.9, 0, 1, lin)} />
    </Layer>
  );
}

/** 14–20 s: one chamber taken apart, turned to show its thickness, turned back flat and a pin measured */
function Apart() {
  const t = useTime();
  const box: CSSProperties = {position: 'absolute', left: 420 + at(t, 0, 0.7, 160, 0, Easing.outCubic), top: 110, width: 880, height: 800, opacity: at(t, 0, 0.45)};
  const inner: CSSProperties = {transform: 'translate(0, 30px) scale(1.1)', transformOrigin: '0 0'};
  return (
    <>
      <div style={box}>
        <div style={inner}>
          <Exploded items={EXPLODED} width={620} height={660} spread={at(t, 0.3, 1.7, 0, 1, lin)} tilt={Math.min(at(t, 0.8, 2.4, 0, 1, lin), at(t, 3.0, 3.9, 1, 0, lin))} labels={at(t, 1.0, 2.8, 0, 1, lin)} />
        </div>
      </div>
      <div style={{...box, opacity: 1}}>
        <div style={inner}><Dimension from={[295, 452]} to={[295, 390]} offset={70} value="4.9" accent measure={at(t, 4.0, 4.9, 0, 1, lin)} /></div>
      </div>
      <div style={{position: 'absolute', left: 1290 + at(t, 0, 0.7, 160, 0, Easing.outCubic), top: 780}}><ViewLabel text="Exploded view" scale="2 : 1" write={at(t, 2.6, 3.2, 0, 1, lin)} /></div>
    </>
  );
}

export default function Reel() {
  const t = useTime();
  const note = t < 2.4 ? 'End view' : t < 6.6 ? 'Section A–A · end view' : t < 9.6 ? 'Section A–A · at rest' : t < 14 ? 'Section A–A · key in' : 'One chamber';
  return (
    <>
      <Sheet title="Pin tumbler lock" note={note} />
      <Sequence from={0} duration={6.6}><CutOpen /></Sequence>
      <Sequence from={6.6} duration={7.4}><Mechanism /></Sequence>
      <Sequence from={14}><Apart /></Sequence>
    </>
  );
}
