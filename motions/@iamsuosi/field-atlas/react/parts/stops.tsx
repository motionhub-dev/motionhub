// The stops of a journey, numbered as a timetable numbers them: a small ink disc with its number on the map at each stop, and the same
// numbers down a timetable card in the margin, each row with its name and a note (a day, a distance). They land one by one, in the order
// given or as a route reaches each; the stop just reached is red, the ones behind it ink.
import React, {useMemo} from 'react';
import {useView, along, arc, band, unit, RAD, W, H, type LonLat} from './geo.ts';

export const meta = {
  name: {en: 'Stops', 'zh-CN': '站点表'},
  purpose: 'steps',
  line: 'A journey\'s stops numbered on the map and down a timetable card in the margin, each with its note; they land in order or as a route reaches them, the latest in red.',
  fits: 'the stations of a line, the stages of an expedition or a migration, the steps of anything told as places in order',
  params: {
    stops: {type: '{lon, lat, name, note?}[]', doc: 'the stops in order, in degrees; the note is one short line (a day, a distance, a date)'},
    reached: {type: 'progress', default: 0, doc: '0 to 1: how far the journey has gone, through the stops in the order given (or along `reach`)'},
    reach: {type: '[lon, lat][]', doc: 'optional: the Route\'s path; each stop lands when `reached` passes the point of the path nearest to it, so pass the Route\'s `draw`'},
    title: {type: 'text', doc: 'optional: the card\'s heading in spaced capitals (the line\'s name)'},
    names: {type: 'boolean', default: true, doc: 'also set each stop\'s name beside its disc on the map; false when Place already names it'},
    x: {type: 'px', default: 96, doc: 'the card\'s left edge'},
    y: {type: 'px', default: 96, doc: 'the card\'s top'},
    show: {type: 'progress', default: 0, doc: 'the card\'s and the discs\' entrance; tween it down to set them all aside'},
  },
  preview: 9.0,
};

/** Where along a path, 0 to 1 by distance, a point is nearest */
function nearest(path: LonLat[], [lon, lat]: LonLat): number {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < 400; i++) {
    const [lo, la] = along(path, i / 399);
    const d = arc(lo * RAD, la * RAD, lon * RAD, lat * RAD);
    if (d < bestD) { bestD = d; best = i / 399; }
  }
  return best;
}

type Stop = {lon: number; lat: number; name: string; note?: string};

export function Stops({stops, reached = 0, reach, title, names = true, x = 96, y = 96, show = 0}: {
  stops: Stop[]; reached?: number; reach?: LonLat[]; title?: string; names?: boolean; x?: number; y?: number; show?: number;
}) {
  const view = useView();
  const when = useMemo(() => stops.map((s, i) => (reach ? nearest(reach, [s.lon, s.lat]) : i / Math.max(1, stops.length))), [stops, reach]);
  const s = unit(show);
  if (s <= 0.01) return null;
  // how far each stop has landed: over a short moment that ends as the journey reaches it, so the last stop lands with the line's end
  const land = when.map((w) => unit((reached - w) / (reach ? 0.025 : 0.6 / stops.length) + 1));
  const latest = land.reduce((n, a, i) => (a > 0 ? i : n), -1);
  const disc = (i: number, r: number) => {
    const red = i === latest;
    return (
      <svg width={r * 2 + 8} height={r * 2 + 8} style={{display: 'block', overflow: 'visible', flex: 'none'}}>
        <circle cx={r + 4} cy={r + 4} r={r + 2.5} fill="var(--color-panel)" />
        <circle cx={r + 4} cy={r + 4} r={r} fill={red ? 'var(--color-data)' : 'var(--color-text)'} />
        <text x={r + 4} y={r + 4} dy="0.36em" textAnchor="middle" fill="var(--color-panel)" style={{fontFamily: 'var(--font-sans)', fontSize: r * 1.15, fontWeight: 700, fontVariantNumeric: 'tabular-nums'}}>{i + 1}</text>
      </svg>
    );
  };
  return (
    <>
      {stops.map((st, i) => {
        const a = land[i] * s;
        if (a <= 0.01) return null;
        const [px, py, vis] = view.at(st.lon, st.lat);
        // a disc near the frame's edge, or under the caption band, fades rather than being cut
        const room = band(Math.min(px, W - px), 40, 90) * band(py, 40, 90) * band(H - py, 220, 270);
        if (!vis || a * room <= 0.01) return null;
        const pop = 0.55 + 0.45 * (1 - Math.pow(1 - a, 3)) + 0.12 * Math.sin(Math.PI * a);
        return (
          <div key={i} style={{position: 'absolute', left: px, top: py, opacity: room * unit(a / 0.3), display: 'flex', alignItems: 'center', gap: 6, transform: `translate(-23px, -50%)`}}>
            <div style={{transform: `scale(${pop})`}}>{disc(i, 19)}</div>
            {names && <div style={{fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, color: 'var(--color-text)', whiteSpace: 'nowrap', textShadow: '0 0 2px var(--color-panel), 0 0 4px var(--color-panel), 0 0 7px var(--color-panel)'}}>{st.name}</div>}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: x, top: y + (1 - s) * 10, opacity: s, width: 420, boxSizing: 'border-box', padding: '22px 26px 18px', background: 'color-mix(in srgb, var(--color-panel) 94%, transparent)', borderTop: '3px solid var(--color-text)', boxShadow: '0 1px 2px rgba(34, 38, 43, 0.16)', fontFamily: 'var(--font-sans)', color: 'var(--color-text)'}}>
        {title && <div style={{fontSize: 26, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1.3, marginBottom: 14}}>{title}</div>}
        <div style={{position: 'relative', display: 'flex', flexDirection: 'column', gap: 10}}>
          {stops.map((st, i) => {
            const a = land[i];
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 14, opacity: 0.22 + 0.78 * a, transform: `translateX(${(1 - a) * -6}px)`}}>
                {disc(i, 17)}
                <div style={{fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 500, lineHeight: 1.05, whiteSpace: 'nowrap', flex: 1}}>{st.name}</div>
                {st.note && <div style={{fontSize: 24, color: 'var(--color-muted)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums'}}>{st.note}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
