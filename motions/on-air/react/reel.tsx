// On Air's reel: twenty seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
// The player holds no footage, so the inset's stand-in fills the frame where the recording would be, reframed at each cut, until it steps aside into its window.
import type {ReactNode} from 'react';
import {Easing, interpolate, useTime} from '@motionhub/runtime';
import {Scrim} from './parts/scrim.tsx';
import {Inset} from './parts/inset.tsx';
import {Chapter} from './parts/chapter.tsx';
import {Chips} from './parts/chips.tsx';
import {Callout} from './parts/callout.tsx';
import {Figure} from './parts/figure.tsx';
import {Swap} from './parts/swap.tsx';
import {NameTag} from './parts/name-tag.tsx';
import {Headline} from './parts/headline.tsx';
import {Bars} from './parts/bars.tsx';
import {Quote} from './parts/quote.tsx';
import {Versus} from './parts/versus.tsx';
import {Verdict} from './parts/verdict.tsx';

export const reel = {seconds: 20, width: 1920, height: 1080};
/** What happens when, for the motion's sound (sound.json): a tag lands, a ring is drawn, a figure counts, the shot cuts, the recording steps aside, a verdict settles */
export const cues = [
  {at: 0.3, role: 'land'}, {at: 2.8, role: 'cut'}, {at: 2.9, role: 'draw', dur: 1.0}, {at: 4.3, role: 'count'}, {at: 5.0, role: 'cut'},
  {at: 5.2, role: 'draw', dur: 0.5}, {at: 6.2, role: 'land'}, {at: 6.6, role: 'count'}, {at: 7.4, role: 'cut'}, {at: 7.9, role: 'draw', dur: 0.6},
  {at: 8.2, role: 'land'}, {at: 8.4, role: 'draw', dur: 1.3}, {at: 10.2, role: 'move', dur: 0.9}, {at: 11.0, role: 'land'}, {at: 13.4, role: 'land'},
  {at: 15.0, role: 'count'}, {at: 15.9, role: 'land'}, {at: 18.7, role: 'count'},
];

const out = Easing.outCubic, lin = Easing.linear;
const at = (t: number, from: number, to: number, a: number, b: number, easing = out) => interpolate(t, [from, to], [a, b], {easing});
/** a count that steps up by one at each of `times`, each step taking `dur` */
const steps = (t: number, times: number[], dur = 0.35) => times.reduce((n, s) => n + at(t, s, s + dur, 0, 1), 0);

/** The cuts of the stand-in's shots before the inset; a tag on a shot goes with its cut, at once */
const CUTS = [0, 2.8, 5.0, 7.4];
const FRAMING = ['scale(1.05)', 'scale(1.35) translate(-10%, 5%)', 'scale(1.2) translate(6%, -5%)', 'scale(1.3) translate(9%, 6%)'];
const INSET = 10.2;

/**
 * A box at x, y of w × h (the whole frame by default), drawn from `from` until `to`. A tag that ends with its line fades out over 0.3 s before `to`
 * (`fade`); one that ends on a cut goes at once.
 */
function Part({x = 0, y = 0, w = 1920, h = 1080, from, to = Infinity, fade = false, children}: {x?: number; y?: number; w?: number; h?: number; from: number; to?: number; fade?: boolean; children: ReactNode}) {
  const t = useTime();
  if (t < from || t >= to) return null;
  const opacity = fade ? at(t, to - 0.3, to, 1, 0, Easing.inOutSine) : 1;
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity}}>{children}</div>;
}

export default function Reel() {
  const t = useTime(), shot = CUTS.filter((c) => t >= c).length - 1;
  return (
    <>
      {/* The recording, full frame until it draws itself into a window on the right for the summary */}
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: 0, transform: t < INSET ? FRAMING[shot] : undefined}}>
          <Inset src="take" side="right" size={0.44} move={at(t, INSET, INSET + 0.9, 0, 1, Easing.inOutSine)} />
        </div>
      </div>
      <Part from={0} to={INSET + 0.9}><Scrim side="left" depth={at(t, INSET, INSET + 0.9, 1, 0, lin)} reach={50} /></Part>

      <Part x={80} y={56} w={520} h={64} from={0} to={8.2} fade><Chapter n="Q·01" title="Planet names" show={at(t, 0.1, 0.6, 0, 1)} /></Part>
      <Part x={80} y={56} w={600} h={64} from={8.2}><Chapter n="Q·02" title="Further out" show={at(t, 8.2, 8.7, 0, 1)} /></Part>

      {/* Shot 1: the items, one per word, the one being said in teal */}
      <Part x={1460} y={150} w={400} h={520} from={0.3} to={CUTS[1]}>
        <Chips items={['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']} shown={steps(t, [0.3, 0.7, 1.1, 1.5, 1.9])} focus={t < 2.4 ? Math.min(4, Math.floor((t - 0.3) / 0.4)) : -1} column />
      </Part>

      {/* Shot 2: ring the thing in the shot; count it as it is said */}
      <Part from={CUTS[1]} to={CUTS[2]}><Callout at={[1205, 640]} to={[1440, 540]} r={60} label="Easy to see by eye" draw={at(t, 2.9, 3.9, 0, 1, lin)} /></Part>
      <Part x={90} y={150} w={620} h={220} from={3.4} to={CUTS[2]}><Figure value={at(t, 3.4, 4.3, 0, 5)} unit="planets" label="Seen without a telescope" show={at(t, 3.4, 3.8, 0, 1)} /></Part>

      {/* Shot 3: strike and correct; name it as it is said */}
      <Part x={90} y={150} w={1100} h={110} from={CUTS[2]} to={CUTS[3]}><Swap from="A name in every culture" to="Roman names" strike={at(t, 5.2, 5.7, 0, 1)} turn={at(t, 6.0, 6.6, 0, 1)} /></Part>
      <Part x={90} y={640} w={760} h={150} from={6.2} to={CUTS[3]}><NameTag name="Latin" role="The language of the Roman Empire" show={at(t, 6.2, 6.9, 0, 1)} width={720} /></Part>

      {/* Shot 4: a headline underlined, then weigh two */}
      <Part x={80} y={330} w={600} h={260} from={CUTS[3]} to={9.3} fade>
        <Headline text="Named after the Roman gods" mark="Roman gods" under={at(t, 7.9, 8.5, 0, 1)} show={at(t, 7.5, 7.9, 0, 1)} width={560} />
      </Part>
      <Part x={90} y={150} w={760} h={240} from={8.4} to={10.4} fade>
        <Bars title="Historically called planets" labels={['Known to every culture', 'Further out']} values={[5, 3]} grown={steps(t, [8.4, 9.1], 0.6)} focus={t < 9.1 ? -1 : 1} />
      </Part>

      {/* Step aside for the summary: the tags go on the ink beside the window */}
      <Part x={90} y={200} w={820} h={340} from={11.0} to={13.4} fade>
        <Quote text="Fit in with the existing theme of the mythology" source="On naming Uranus, Neptune and Pluto" show={at(t, 11.0, 12.6, 0, 1, lin)} width={800} />
      </Part>
      <Part x={90} y={240} w={820} h={200} from={13.4} to={15.9} fade>
        <Versus a="Seen by every culture" aNote="The inner five" b="Discovered recently" bNote="The outer three" winner="b" show={at(t, 13.4, 14.1, 0, 1)} decide={at(t, 14.5, 15.0, 0, 1)} width={800} />
      </Part>
      <Part x={90} y={180} w={700} h={520} from={15.9}>
        <Verdict title="Uranus · Neptune · Pluto" items={['+ Named like the old five', '- Fainter', '- Slower', '- Not seen by the naked eye']}
          shown={steps(t, [15.9, 16.5, 17.0, 17.5], 0.4)} result="Found by telescope" settle={at(t, 18.1, 18.7, 0, 1)} width={660} />
      </Part>
    </>
  );
}
