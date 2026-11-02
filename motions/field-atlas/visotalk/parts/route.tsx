// A journey drawn on the map as one line: a red line in a paper casing that grows from its first point as it is told, a head that leads
// it, and, for a path with a width (a shadow, a flyway, a storm track), its corridor drawn with it. A line already told turns to ink.
import {useDocTime} from '@visotalk/runtime';
import {useView, lead, along, unit, type LonLat} from './geo.ts';
import {Paint} from './atlas.tsx';

export const meta = {
  name: {en: 'Route', 'zh-CN': '路线'},
  purpose: 'link',
  line: 'A journey as one red line drawn across the map from its first point, led by its head, with its corridor when the path has a width; it turns to ink once it has been told.',
  fits: 'a journey or a migration; a shadow, a storm or a flight crossing the land; a trade route; the path the camera rides (Atlas follow)',
  params: {
    path: {type: '[lon, lat][]', doc: 'the points it runs through, in degrees, close enough to draw as straight steps'},
    draw: {type: 'progress', default: 0, doc: '0 to 1: how much of it is drawn, by distance from its first point'},
    left: {type: '[lon, lat][]', doc: 'optional: one edge of its corridor, point for point beside the path'},
    right: {type: '[lon, lat][]', doc: 'optional: the other edge of the corridor'},
    told: {type: 'progress', default: 0, doc: '0 is the line being told, in red; 1 is a line told before, in ink, quieter'},
    head: {type: 'progress', default: 1, doc: 'how strongly its head shows; tween to 0 once it has arrived'},
    corridor: {type: 'progress', default: 1, doc: '1 fills the corridor; toward 0 the fill gives way to its two limits as dashed lines, for a close view inside it'},
    shade: {type: 'km', default: 0, doc: 'optional: a soft shadow this many km across the head\'s path, dark at its core, that sweeps the land as the line draws (a moon\'s shadow, a storm, night); it leaves with `head`'},
  },
  preview: 6.2,
};

const mix = (told: number, red: string, ink: string) => `color-mix(in oklab, ${red}, ${ink} ${Math.round(unit(told) * 100)}%)`;

export function Route({path, draw = 0, left, right, told = 0, head = 1, corridor = 1, shade = 0}: {path: LonLat[]; draw?: number; left?: LonLat[]; right?: LonLat[]; told?: number; head?: number; corridor?: number; shade?: number}) {
  const view = useView();
  const t = useDocTime();
  if (draw <= 0.0005) return null;
  const px = (pts: LonLat[]) => pts.map(([lo, la]) => view.at(lo, la));
  const line = (pts: [number, number, boolean][]) => {
    let d = '', pen = false;
    for (const [x, y, ok] of pts) { if (!ok) { pen = false; continue; } d += `${pen ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; pen = true; }
    return d;
  };
  const drawn = px(lead(path, draw));
  const colour = mix(told, 'var(--vt-data)', 'var(--vt-text)');
  let band = '';
  let edges = '';
  if (left && right) {
    const a = px(lead(left, draw)), b = px(lead(right, draw)).reverse();
    if (a.every((p) => p[2]) && b.every((p) => p[2]) && a.length && b.length) { band = line(a) + line(b).replace(/^M/, 'L') + 'Z'; edges = line(a) + line(b); }
  }
  const [hx, hy, hv] = view.at(...along(path, draw));
  const pulse = (t * 0.8) % 1;
  const width = 4.2 - unit(told) * 1.4;
  const trace = line(drawn), on = hv && head > 0.01 ? unit(head) * (1 - unit(told)) : 0;
  const ring = (r: number) => `M${hx - r} ${hy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  // the shadow: a wide soft dusk round a small dark core, multiplied into the map beneath, so the land itself goes dark where it passes
  const r = (shade / 2) * view.pxPerKm, dusk = hv && shade > 0 ? unit(head) * (1 - unit(told)) * unit(draw / 0.03) : 0;
  const night = dusk > 0.01 && r > 4 ? <Paint blend="multiply" ops={[{d: `M0 0H${1920}V${1080}H0Z`, alpha: dusk, radial: {x: hx, y: hy, r, stops: [
    [0, 'rgb(28, 34, 62)'], [0.018, 'rgb(46, 54, 88)'], [0.05, 'rgb(118, 124, 150)'], [0.3, 'rgb(196, 198, 208)'], [0.7, 'rgb(238, 237, 236)'], [1, 'rgb(255, 255, 255)'],
  ]}}]} /> : null;
  return <>{night}<Paint ops={[
    band !== '' && {d: band, fill: colour, alpha: (0.18 - 0.11 * unit(told)) * unit(corridor)},
    band !== '' && {d: band, stroke: colour, width: 1, alpha: 0.4 * unit(corridor) * (0.18 - 0.11 * unit(told)) / 0.18},
    edges !== '' && {d: edges, stroke: colour, width: 2, dash: [10, 8], alpha: 0.75 * (1 - unit(corridor))},
    {d: trace, stroke: 'var(--vt-panel)', width: width + 5, alpha: 0.95},
    {d: trace, stroke: colour, width},
    on > 0 && {d: ring(10 + pulse * 22), stroke: 'var(--vt-data)', width: 2, alpha: 0.6 * (1 - pulse) * on},
    on > 0 && {d: ring(9), fill: 'var(--vt-data)', stroke: 'var(--vt-panel)', width: 3, alpha: on},
  ]} /></>;
}
