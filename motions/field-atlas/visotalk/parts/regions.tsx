// Regions filled by a value, one sequential ochre from the land's own paper to its darkest step, with a fine paper edge between them.
// They fill one by one: in the order given, or as a route reaches each of them, so the fill is said, not shown at once.
import React, {useMemo} from 'react';
import {useView, find, along, arc, RAD, unit, type Feature, type LonLat} from './geo.ts';
import {Paint, type PaintOp} from './atlas.tsx';

export const meta = {
  name: {en: 'Regions', 'zh-CN': '分区填色'},
  purpose: 'data',
  line: 'Countries, states or provinces filled in one ochre by a value, darker for more, filling one after another or as a route reaches each; read with a Legend.',
  fits: 'a value by country or state (a share, a count, a rate); the places an event touched',
  params: {
    values: {type: '{[id]: number}', doc: 'each region\'s value, by ISO code (`USA`, `US-IL`) or by name; drawn in the vendored map, or in `extra`'},
    max: {type: 'number', default: 1, doc: 'the value drawn darkest; 0 stays the bare land'},
    fill: {type: 'progress', default: 0, doc: '0 to 1: how far the filling has gone, through the regions in the order given (or along `reach`)'},
    reach: {type: '[lon, lat][]', doc: 'optional: a route; each region fills when `fill` passes the point of the route nearest to it'},
    extra: {type: 'Feature[]', doc: 'optional: a work\'s own areas (geo.ts features), for regions the vendored map lacks'},
    lift: {type: 'progress', default: 0, doc: '0 to 1: the regions at `max` rise off the map like cut paper, casting a soft shadow; on the word that singles them out'},
    dim: {type: 'progress', default: 0, doc: '0 to 1: the fill fades away while something else is the subject (a close view inside one region)'},
  },
  preview: 20.9,
};

/** The colour of a value on the ochre scale: the land's paper at 0, the full ochre at `max` */
export const ochre = (v: number, max: number) => `color-mix(in oklab, var(--vt-grad) ${Math.round(18 + 82 * unit(v / max))}%, var(--vt-panel))`;

/** Where along a route, 0 to 1 by distance, a feature is nearest */
function nearest(route: LonLat[], f: Feature): number {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < 200; i++) {
    const [lo, la] = along(route, i / 199);
    const d = arc(lo * RAD, la * RAD, f.lon, f.lat);
    if (d < bestD) { bestD = d; best = i / 199; }
  }
  return best;
}

export function Regions({values, max = 1, fill = 0, reach, extra, lift = 0, dim = 0}: {values: Record<string, number>; max?: number; fill?: number; reach?: LonLat[]; extra?: Feature[]; lift?: number; dim?: number}) {
  const view = useView();
  const items = useMemo(() => {
    const ids = Object.keys(values);
    const list = ids.map((id) => extra?.find((f) => f.id === id || f.name === id) ?? find(id)).map((f, i) => ({f, id: ids[i]})).filter((x): x is {f: Feature; id: string} => !!x.f);
    const when = list.map((x, i) => (reach ? nearest(reach, x.f) : i / Math.max(1, list.length)));
    return list.map((x, i) => ({...x, when: when[i]}));
  }, [values, reach, extra]);
  if (fill <= 0) return null;
  const n = Math.max(1, items.length);
  const ops: PaintOp[] = [], raised: PaintOp[] = [];
  const up = unit(lift), h = 22 * (1 - Math.pow(1 - up, 3)) + 3 * Math.sin(Math.PI * up);   // rises fast, overshoots a little, settles
  for (const {f, id, when} of items) {
    if (!view.sees(f)) continue;
    // a region takes a short moment to fill once the sweep reaches it, so a run of them reads as a wave, not a switch
    const a = unit((fill - when) / (reach ? 0.06 : 1.4 / n));
    if (a <= 0) continue;
    const d = view.path(f), top = values[id] >= max && up > 0;
    if (!top) { ops.push({d, fill: ochre(values[id], max), stroke: 'var(--vt-panel)', width: 1.4, alpha: a}); continue; }
    ops.push({d, fill: 'var(--vt-panel)', alpha: a});
    raised.push({d, fill: 'rgb(34, 38, 43)', alpha: a * 0.38 * up, blur: 5 + h * 0.5, dy: h * 0.3});
    raised.push({d, fill: ochre(values[id], max), stroke: 'var(--vt-panel)', width: 1.6, alpha: a, dy: -h});
  }
  ops.push(...raised);
  return <Paint ops={ops} opacity={1 - unit(dim)} />;
}
