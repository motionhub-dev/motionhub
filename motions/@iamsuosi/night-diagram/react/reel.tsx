// Night Diagram's reel: twenty seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
import {Easing, interpolate, useTime} from '@motionhub/runtime';
import {C, smooth} from './parts/night.ts';
import {Sky} from './parts/sky.tsx';
import {Mass} from './parts/mass.tsx';
import {Motes} from './parts/motes.tsx';
import {Arc} from './parts/arc.tsx';
import {Ruler} from './parts/ruler.tsx';
import {Pin} from './parts/pin.tsx';
import {Reading} from './parts/reading.tsx';
import {Lens} from './parts/lens.tsx';
import {Heading} from './parts/heading.tsx';
import {Pulse} from './parts/pulse.tsx';
import {Dive} from './parts/dive.tsx';

export const reel = {seconds: 20, width: 1920, height: 1080};
/** What happens when, for the motion's sound (sound.json): the cloud grows, a collision happens, the stroke strikes, the air rolls out, the planet comes up, a reading settles */
export const cues = [
  {at: 0.0, role: 'move', dur: 1.5}, {at: 0.3, role: 'draw', dur: 0.9}, {at: 1.7, role: 'land'}, {at: 3.0, role: 'count'}, {at: 4.8, role: 'land'},
  {at: 5.6, role: 'land'}, {at: 7.0, role: 'cut'}, {at: 7.4, role: 'land'}, {at: 8.4, role: 'count'}, {at: 9.6, role: 'move', dur: 2.2},
  {at: 10.0, role: 'draw', dur: 3.0}, {at: 11.2, role: 'land'}, {at: 11.8, role: 'count'}, {at: 14.6, role: 'move', dur: 3.2},
  {at: 17.2, role: 'land'}, {at: 18.5, role: 'count'},
];

const ease = Easing.inOutSine, out = Easing.outQuart, lin = Easing.linear;
const at = (t: number, from: number, to: number, a = 0, b = 1, easing = lin) => interpolate(t, [from, to], [a, b], {easing});
/** A value moved through several keys: [second, value] pairs, each leg eased */
const keys = (t: number, k: [number, number][], easing = lin) => {
  let v = k[0][1];
  for (let i = 1; i < k.length; i++) if (t >= k[i - 1][0]) v = at(t, k[i - 1][0], k[i][0], k[i - 1][1], k[i][1], easing);
  return v;
};
/** On from one second until another, in and out over `fade` */
const shown = (t: number, on: number, off: number, fade = 0.4) => Math.min(at(t, on, on + fade, 0, 1), at(t, off, off + 0.35, 1, 0));

// the sample's storm: the cloud, the stroke and its forks, on a land line at y 880 with 58 px to the km
const CLOUD: Array<[number, number, number, number]> = [
  [610, 310, 110, 0.15], [1470, 290, 130, 0.2], [800, 290, 130, 0.35], [1250, 265, 145, 0.45], [1020, 250, 150, 0.6],
  [560, 490, 110, 0.2], [1420, 450, 140, 0.28], [720, 430, 170, 0.45], [1210, 405, 195, 0.55], [960, 380, 215, 0.72],
  [620, 610, 90, 0.05], [1460, 580, 90, 0.04], [800, 580, 160, 0.14], [1280, 585, 150, 0.1], [1040, 590, 190, 0.08],
];
const BOLT: Array<[number, number]> = [[1010, 660], [1050, 712], [1000, 748], [1072, 804], [1030, 834], [1090, 880]];
const FORKS: Array<Array<[number, number]>> = [[[1000, 748], [930, 792], [948, 818], [890, 870]], [[1072, 804], [1136, 840], [1128, 860], [1176, 880]]];
const FLOOR = 880, KM = 58, alt = (km: number) => FLOOR - km * KM;

// one collision in the lens: an ice crystal and a soft hail pellet meet, and part with opposite charges
const Collision = ({k}: {k: number}) => {
  const meet = smooth(k * 2), part = smooth(k * 2 - 1), gap = 96 * (1 - meet) + 92 * part;
  return <>
    <rect x={-160} y={-160} width={320} height={320} fill="#0A1538" />
    <g transform={`translate(0 ${-gap}) scale(0.72)`}>
      <path d="M0 -44L38 -22V22L0 44L-38 22V-22Z" fill="#DDF3FF" />
      <path d="M0 -44V44M38 -22L-38 22M-38 -22L38 22" stroke="#7FB9DE" strokeWidth={3} />
      {part > 0.2 && <path d="M60 0H92M76 -16V16" stroke={C.ember} strokeWidth={8} strokeLinecap="round" opacity={part} />}
    </g>
    <g transform={`translate(0 ${gap * 0.8}) scale(0.72)`}>
      <circle r={62} fill="#9CB3D4" /><circle cy={-10} r={48} fill="#BCCFE6" />
      {part > 0.2 && <path d="M78 0H110" stroke={C.ice} strokeWidth={8} strokeLinecap="round" opacity={part} />}
    </g>
    {meet > 0.92 && part < 0.25 && <circle r={34} fill="#fff" opacity={1 - part * 4} />}
  </>;
};

// the planet at night, from the sample: lightning falls mostly on land, so the flashes keep to these regions
const START = 9, PIVOT: [number, number] = [1350, 490];
const LAND: Array<[number, number, number, number]> = [[1010, 290, 170, 170], [1045, 510, 70, 150], [1350, 490, 130, 220], [1460, 290, 280, 90]];
const Globe = () => <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
  <defs><radialGradient id="reel-planet" cx="0.38" cy="0.32"><stop offset="0" stopColor="#2A5C9E" /><stop offset="1" stopColor="#0A1C44" /></radialGradient><clipPath id="reel-round"><circle cx={1270} cy={470} r={392} /></clipPath></defs>
  <circle cx={1270} cy={470} r={412} fill="#4B86D8" opacity={0.14} />
  <circle cx={1270} cy={470} r={392} fill="url(#reel-planet)" />
  <g clipPath="url(#reel-round)" fill="#16335F" transform="translate(0 -60)">
    <path d="M880 250C980 210 1110 250 1130 340C1140 400 1080 440 1050 500C1090 540 1080 640 1040 700C1010 740 980 690 985 620C990 560 930 520 900 460C860 400 830 300 880 250Z" />
    <path d="M1230 280C1320 250 1400 270 1460 250C1560 230 1680 280 1700 360C1710 420 1620 440 1560 450C1520 480 1480 440 1450 470C1490 540 1480 640 1420 720C1380 770 1340 740 1320 660C1300 600 1250 560 1240 490C1230 440 1270 410 1240 370C1215 340 1200 300 1230 280Z" />
  </g>
</svg>;

const STRIKE = 7.0, CLOSE = 9.6, PLANET = 14.6;

/** The storm charges: the lens shows one collision, charge separates and is named, then the strike, and the channel's heat rolls up */
function Storm({t}: {t: number}) {
  const leave = (on: number, fade = 0.4) => shown(t, on, CLOSE - 0.5, fade);
  const light = t < STRIKE ? 0 : keys(t, [[STRIKE, 1], [STRIKE + 0.35, 1], [STRIKE + 1.9, 0.35]], out);
  const power = keys(t, [[STRIKE + 0.2, 1], [STRIKE + 0.26, 0.4], [STRIKE + 0.28, 0.4], [STRIKE + 0.34, 1]]);
  return <>
    <Mass puffs={CLOUD} from={[1000, 680]} grow={at(t, 0, 1.5)} drift={t * 2} lit={[1030, 640, 620]} light={light} />
    <div style={{position: 'absolute', inset: 0, opacity: leave(0, 0.01)}}>
      <Ruler x={372} y0={alt(0)} y1={alt(12)} to={12} ticks={[0, 2, 4, 6, 8, 10, 12]} unit="km" t={at(t, 0.3, 1.2)} level={6.5} levelLabel="-15 °C" levelTo={1540} levelShow={at(t, 1.3, 2.0, 0, 1, out)} />
      <Motes n={22} glyph="plus" color={C.ember} from={[760, 340, 480, 120]} to={[650, 150, 800, 150]} t={at(t, 3.6, 5.4)} show={at(t, 3.4, 3.7)} seed={2} />
      <Motes n={30} glyph="minus" color={C.ice} from={[760, 340, 480, 120]} to={[620, 430, 880, 130]} t={at(t, 4.4, 6.2)} show={at(t, 3.4, 3.7)} seed={7} />
    </div>
    {t >= STRIKE && <Arc path={BOLT} forks={FORKS} t={at(t, STRIKE, STRIKE + 0.14)} power={power} />}
    <Pin at={[1440, 235]} elbow={[1560, 150]} to={1840} text="Positive top" note="light ice crystals" color={C.ember} t={leave(4.8, 0.6)} />
    <Pin at={[1450, 520]} elbow={[1560, 420]} to={1840} text="Negative layer" note="heavy hail, sinking" color={C.ice} t={leave(5.6, 0.6)} />
    <Lens at={[1680, 660]} r={160} from={[1200, 503]} show={shown(t, 1.7, 5.5, 0.5)} label="One collision"><Collision k={at(t, 2.0, 4.0)} /></Lens>
    <Reading at={[1236, 610]} label="Temperature of the channel" prefix="up to" value={28000} unit="°C" note="five times the surface of the Sun" source="US National Weather Service" show={leave(STRIKE + 0.4, 0.5)} roll={at(t, STRIKE + 0.5, STRIKE + 1.4)} />
    <Heading text="Where does lightning come from?" size={64} show={leave(0, 0.4)} />
  </>;
}

/** Close on the foot of the stroke: the air blasts outward as rings, and thunder's speed is the reading */
function Thunder({t}: {t: number}) {
  const s = at(t, CLOSE, CLOSE + 2.2, 1, 1.16, ease);
  return <>
    <Dive at={[1060, FLOOR]} floor={FLOOR} s={s}>
      <Mass puffs={CLOUD} from={[1000, 680]} drift={t * 2} lit={[1030, 640, 620]} light={0.35} />
      <Arc path={BOLT} forks={FORKS} power={at(t, CLOSE, CLOSE + 1.8, 1, 0.55, ease)} />
    </Dive>
    <Pulse at={[1072, 820]} r={800} n={9} floor={FLOOR} t={at(t, CLOSE + 0.4, PLANET - 0.2)} />
    <Pin at={[1100, 740]} elbow={[1400, 560]} to={1840} text="Hot air, expanding" note="faster than sound, at first" t={shown(t, CLOSE + 0.5, PLANET - 0.9, 0.6)} />
    <Reading at={[80, 300]} label="Thunder travels" prefix="about" value={3} unit="s per km" note="count from the flash, then divide by three" source="US National Weather Service" color={C.ember} show={shown(t, CLOSE + 1.6, PLANET - 0.9)} roll={at(t, CLOSE + 1.6, CLOSE + 2.2)} />
  </>;
}

/** Pull back from the storm to the planet, where it is happening all the time */
function Planet({t}: {t: number}) {
  const s = Math.exp(at(t, PLANET, PLANET + 3.2, Math.log(START), Math.log(0.88), ease)), rate = t > PLANET + 2 ? 1.2 : 0;
  return <>
    <Dive at={PIVOT} floor={FLOOR} soft={40 + 120 * smooth((s - 1.4) / 2)} s={s}>
      <div style={{position: 'absolute', inset: 0, opacity: smooth((START - s) / (START * 0.5))}}><Globe /></div>
      <div style={{position: 'absolute', inset: 0, transformOrigin: `${PIVOT[0]}px ${PIVOT[1]}px`, transform: `scale(${1 / START})`, opacity: smooth((s - 1.4) / 1.4)}}>
        <div style={{position: 'absolute', inset: 0, transformOrigin: `1060px ${FLOOR}px`, transform: `scale(${1 + 0.16 * smooth((s - START * 0.8) / (START * 0.2))})`}}>
          <Mass puffs={CLOUD} from={[1000, 680]} drift={t * 2} lit={[1030, 640, 620]} light={0.35} />
          <div style={{position: 'absolute', inset: 0, opacity: smooth((s - 3.5) / 2.5)}}><Arc path={BOLT} forks={FORKS} power={0.55} /></div>
        </div>
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: smooth((3 - s) / 1.5)}}>
        {LAND.map(([x, y, w, h], i) => <Motes key={i} n={Math.round((w * h) / 1600)} glyph="dot" color={C.core} size={13 / Math.max(1, s * 0.5)} from={[x - w / 2, y - h / 2, w, h]} to={[x - w / 2, y - h / 2, w, h]} twinkle={rate} seed={i * 9 + 2} />)}
      </div>
    </Dive>
    <Pin at={PIVOT} elbow={[1640, 250]} to={1840} text="This storm" note="one of many" color={C.ember} t={at(t, PLANET + 2.6, PLANET + 3.2)} />
    <Reading at={[80, 400]} label="Lightning worldwide" prefix="about" value={44} unit="per second" note="about 1.4 billion a year · planet illustrative" source="Christian et al., J. Geophys. Res. 2003" color={C.ice} show={at(t, PLANET + 3.0, PLANET + 3.5)} roll={at(t, PLANET + 3.0, PLANET + 3.9)} />
  </>;
}

export default function Reel() {
  const t = useTime();
  // the field: a light that builds, blazes with the strike and pools, then fades with the stars as the planet comes up
  const light = t < STRIKE ? at(t, 5.9, STRIKE, 0, 0.18, Easing.bezier(0.55, 0, 1, 0.45)) : t < PLANET ? keys(t, [[STRIKE, 1], [STRIKE + 0.35, 1], [STRIKE + 1.9, 0.5]], out) : at(t, PLANET, PLANET + 1.2, 0.5, 0);
  return <>
    <Sky land={FLOOR} fade={at(t, PLANET, PLANET + 1.4, 1, 0)} stars={110} glow={[1030, 700, 700]} light={light} />
    {t < CLOSE ? <Storm t={t} /> : t < PLANET ? <Thunder t={t} /> : <Planet t={t} />}
  </>;
}
