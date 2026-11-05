// Idea Map's reel: twenty-one seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
// Its map is the sample's subject, why antibiotics stop working; the figures are from GBD 2021 Antimicrobial Resistance Collaborators,
// The Lancet (2024), for 2021 and the 2050 forecast, and Fleming-Dutra et al., JAMA (2016).
import {Easing, interpolate, useTime} from '@motionhub/runtime';
import {IdeaMap} from './parts/map.tsx';
import {Heading} from './parts/heading.tsx';
import {Key} from './parts/key.tsx';
import {Locator} from './parts/locator.tsx';
import {Units} from './parts/units.tsx';
import {Pictogram} from './parts/pictogram.tsx';
import {Chart} from './parts/chart.tsx';
import {Bracket} from './parts/bracket.tsx';
import {Compare} from './parts/compare.tsx';
import {Sheet} from './parts/sheet.tsx';
import type {MapEdge, MapNode, View} from './parts/geometry.ts';

export const reel = {seconds: 21, width: 1920, height: 1080};
/** What happens when, for the motion's sound (sound.json): a rule lands under a term, a line is ruled, the camera moves, a figure counts */
export const cues = [
  {at: 0.4, role: 'land'}, {at: 0.9, role: 'draw', dur: 0.91}, {at: 1.68, role: 'land'}, {at: 2.1, role: 'draw', dur: 0.7}, {at: 2.7, role: 'land'}, {at: 3.1, role: 'draw', dur: 0.7}, {at: 3.7, role: 'land'}, {at: 4.1, role: 'draw', dur: 0.63}, {at: 6.0, role: 'move', dur: 1.2}, {at: 6.2, role: 'draw', dur: 0.7}, {at: 6.8, role: 'land'}, {at: 7.4, role: 'count'}, {at: 8.2, role: 'draw', dur: 0.7}, {at: 8.8, role: 'land'}, {at: 9.6, role: 'move', dur: 1.2}, {at: 10.0, role: 'draw', dur: 0.7}, {at: 10.6, role: 'land'}, {at: 10.9, role: 'draw', dur: 0.63}, {at: 11.44, role: 'land'}, {at: 11.8, role: 'move', dur: 1.6}, {at: 12.0, role: 'draw', dur: 0.98}, {at: 12.84, role: 'land'}, {at: 13.5, role: 'draw', dur: 0.7}, {at: 14.1, role: 'land'}, {at: 14.3, role: 'draw', dur: 0.6},
];

const NODES: MapNode[] = [
  {id: 'use', kind: 'picture', glyph: 'pill', term: 'Antibiotic use'},
  {id: 'sel', kind: 'picture', glyph: 'bacterium', term: 'Selection'},
  {id: 'spread', kind: 'picture', glyph: 'bacterium', term: 'Resistant strains'},
  {id: 'hard', kind: 'picture', glyph: 'person', term: 'Harder infections'},
  {id: 'unneeded', glyph: 'document', term: 'Unneeded prescriptions', beside: {of: 'use', side: 't'}},
  {id: 'steward', kind: 'action', glyph: 'shield', term: 'Stewardship', beside: {of: 'unneeded', side: 'l'}},
  {id: 'plasmid', kind: 'picture', glyph: 'plasmid', term: 'Plasmid', beside: {of: 'sel', side: 't'}},
  {id: 'gene', kind: 'picture', glyph: 'dna', term: 'Resistance gene', beside: {of: 'plasmid', side: 'r'}},
  {id: 'blac', kind: 'picture', glyph: 'scissors', term: 'Beta-lactamase', beside: {of: 'gene', side: 'r'}},
  {id: 'pen', kind: 'picture', glyph: 'pill', term: 'Penicillin', beside: {of: 'blac', side: 'b'}},
];
const EDGES: MapEdge[] = [
  {id: 'e1', from: 'use', to: 'sel', kind: 'causes', label: 'spares the resistant', flow: true},
  {id: 'e2', from: 'sel', to: 'spread', kind: 'leads', label: 'multiply', flow: true},
  {id: 'e3', from: 'spread', to: 'hard', kind: 'leads', label: 'infect others', flow: true},
  {id: 'e4', from: 'hard', to: 'use', kind: 'leads', label: 'more courses', flow: true},
  {id: 'e5', from: 'unneeded', to: 'use', kind: 'contributes', label: 'adds courses'},
  {id: 'e6', from: 'steward', to: 'unneeded', kind: 'prevents', label: 'blocks'},
  {id: 'e7', from: 'plasmid', to: 'sel', kind: 'contributes', label: 'passed on', flow: true},
  {id: 'e8', from: 'gene', to: 'plasmid', kind: 'part', label: 'part of'},
  {id: 'e9', from: 'gene', to: 'blac', kind: 'causes', label: 'makes'},
  {id: 'e10', from: 'blac', to: 'pen', kind: 'opposes', label: 'works against'},
];
const RING = ['use', 'sel', 'spread', 'hard'];
const VIEWS: View[] = [
  RING,
  {ids: RING, grow: [0, 0, 0, 130]},
  {ids: ['unneeded', 'use'], grow: [0, 0, 720, 0]},
  ['sel', 'plasmid', 'gene'],
  ['gene', 'blac', 'pen'],
  {ids: RING, grow: [0, 0, 0, 380]},
];
const KEY = [
  {kind: 'causes' as const, label: 'causes'}, {kind: 'leads' as const, label: 'leads to'}, {kind: 'contributes' as const, label: 'adds to'},
  {kind: 'prevents' as const, label: 'blocks'}, {kind: 'part' as const, label: 'is part of'}, {kind: 'opposes' as const, label: 'works against'},
];

const lin = Easing.linear, out = Easing.outQuart;
/** 0 to 1 from `a` over `d` seconds */
const at = (t: number, a: number, d: number, easing = lin) => interpolate(t, [a, a + d], [0, 1], {easing});

// the map grows a step at a time (IdeaMap's grow): each line is ruled before the term it reaches. When each step runs, and for how long
const STEPS: [number, number][] = [[0.4, 0.5], [0.9, 1.3], [2.1, 1.0], [3.1, 1.0], [4.1, 0.9], [6.2, 1.0], [8.2, 1.0], [10.0, 1.0], [10.9, 0.9], [12.0, 1.4], [13.5, 1.0]];

export default function Reel() {
  const t = useTime();
  const grow = STEPS.reduce((g, [a, d]) => g + at(t, a, d), 0);
  const struck = at(t, 14.3, 0.6);
  const nodes = NODES.map((n) => ({...n, strike: n.id === 'pen' ? struck : undefined, act: n.id === 'spread' ? 'multiply' as const : undefined, actAt: n.id === 'spread' ? at(t, 3.4, 1.2) : undefined,
    state: n.id === 'hard' && t > 18.4 ? 'active' as const : n.id === 'unneeded' && t > 6.9 && t < 8.4 ? 'active' as const : n.id === 'pen' && struck > 0 ? 'struck' as const : undefined}));
  const edges = EDGES.map((e) => ({...e, state: e.id === 'e5' && t > 6.9 && t < 8.4 ? 'active' as const : undefined}));
  // the camera: the loop, out a little for its bracket, up to what feeds it, across to the gene, a ride to the enzyme, back to the whole loop
  const view = at(t, 4.6, 0.8) + at(t, 6.0, 1.2) + at(t, 9.6, 1.2) + at(t, 12.0, 1.0) + at(t, 17.6, 1.4);
  const rideMix = at(t, 11.8, 0.4) - at(t, 13.1, 0.5);
  const cam = {views: VIEWS, view, ride: 'e9', rideMix, rideZoom: 1.25, lead: 40};
  const cmp = at(t, 15.0, 0.6, out) - at(t, 17.6, 0.6);
  const locator = at(t, 9.8, 0.4) - at(t, 14.8, 0.4);
  const keyN = Math.min(6, at(t, 0.9, 0.4) + at(t, 2.1, 0.4) + at(t, 6.9, 0.4) + at(t, 8.8, 0.4) + at(t, 11.3, 0.4) + at(t, 13.5, 0.4));
  const shown = Math.max(1, Math.ceil(keyN));
  return <>
    <IdeaMap nodes={nodes} edges={edges} layout="cycle" grow={grow} {...cam} speed={rideMix * 70}>
      <Pictogram name="loop" among={RING} size={128} act="spin" tone="red" show={at(t, 5.0, 0.6) - at(t, 17.6, 0.4)} />
      <Bracket ids={RING} side="below" note="a loop that feeds itself" show={at(t, 5.0, 0.6) - at(t, 17.6, 0.4)} />
      <Units at="unneeded" glyph="document" total={10} marked={3} cols={10} size={58} label="unnecessary, at least" source="US, 2010–11 · JAMA, 2016" show={at(t, 7.0, 1.4) - at(t, 9.6, 0.4)} />
    </IdeaMap>
    <Chart x={470} y={640} title="Deaths caused by resistant bacteria, a year" source="GBD 2021 AMR Collaborators · The Lancet, 2024" width={640}
        rows={[{label: '2021', value: 1.14, shown: '1.14 million'}, {label: '2050', value: 1.91, shown: '1.91 million, forecast', estimate: true, marked: true}]} show={at(t, 18.6, 1.4)} />
    {cmp > 0.001 && (
      <div style={{position: 'absolute', inset: 0, opacity: cmp}}>
        <Sheet camX={960} camY={480 - (1 - cmp) * 40}>
          <Compare x={330} y={640} marked="right" kind="opposes" label="or" actAt={at(t, 16.0, 1.4)}
            left={{term: 'Susceptible', glyph: 'bacterium', act: 'burst', points: ['its wall fails']}}
            right={{term: 'Resistant', glyph: 'bacterium', act: 'multiply', points: ['the drug is cut first']}}
            show={at(t, 15.3, 1.0)} />
        </Sheet>
      </div>
    )}
    <Heading kicker="Microbiology · a feedback loop" title="Why do antibiotics stop working?" show={at(t, 0, 0.6)} />
    <Key items={KEY.slice(0, shown)} show={(keyN / shown) * (1 - locator)} />
    <Locator nodes={nodes} edges={edges} layout="cycle" grow={grow} {...cam} show={locator * (1 - cmp)} />
  </>;
}
