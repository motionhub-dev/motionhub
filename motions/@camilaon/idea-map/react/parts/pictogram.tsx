import React from 'react';
import {useTime} from '@motionhub/runtime';
import {useMap, useEdgeFade, bounds, unit, ease, spaced} from './geometry.ts';
import {GLYPHS} from './glyphs.ts';

export const meta = {
  name: {en: 'Pictogram', 'zh-CN': '线描图标'},
  purpose: 'mark',
  line: 'A large line pictogram drawn stroke by stroke, then acting: multiplying, bursting, turning, beating, filling.',
  fits: 'bacteria multiplying; a cell bursting; a machine running; a heart beating; a reservoir filling',
  params: {
    name: {type: 'text', doc: 'the pictogram (GLYPHS in glyphs.ts): person, people, factory, bolt, pylon, tree, alert, document, coin, chart, gear, globe, cell, virus, pill, flask, clock, home, car, phone, server, cloud, drop, sun, flame, leaf, shield, lock, scale, flag, bulb, check, cross, loop and more'},
    size: {type: 'px', default: 180, doc: 'its height'},
    act: {type: 'text', doc: 'what it does once drawn: multiply, burst, spin, pulse or fill'},
    actAt: {type: 'progress', doc: '0 to 1: how far the act has gone (tween it on the word); spin and pulse run on their own when it is left out'},
    label: {type: 'text', doc: 'a word or two under it'},
    tone: {type: 'text', default: 'ink', doc: 'ink, red (the one that matters) or dim'},
    at: {type: 'text', doc: 'inside IdeaMap: the term it stands beside'},
    place: {type: 'text', default: 'right', doc: 'right, left, above or below the term named by at'},
    among: {type: 'object', doc: 'inside IdeaMap: term ids it stands in the middle of (the centre of a cycle)'},
    x: {type: 'px', default: 0, doc: 'without at: its left edge'},
    y: {type: 'px', default: 0, doc: 'without at: its baseline'},
    show: {type: 'progress', default: 1, doc: '0 to 1: drawn stroke by stroke'},
  },
  preview: 17.0,
};

export type Act = 'multiply' | 'burst' | 'spin' | 'pulse' | 'fill';

/** where the copies of a multiplying pictogram go, in units of its size */
// up and to the right of it, clear of the word under it
const BUDS: [number, number][] = [[1.0, 0.15], [1.05, 0.75], [1.65, 0.4], [1.6, -0.15], [0.45, -0.35]];

/**
 * A pictogram as svg in a 64-unit square: drawn stroke by stroke by `draw`, then acting by `act` and `actAt`.
 * Used by Pictogram, by a term's glyph, by Units and by Compare.
 */
export function GlyphArt({name, size, draw = 1, act, actAt, color = 'var(--color-text)', accent = 'var(--color-op)', stroke = 3.4}: {
  name: string; size: number; draw?: number; act?: Act; actAt?: number; color?: string; accent?: string; stroke?: number;
}) {
  const t = useTime();
  const paths = GLYPHS[name] ?? GLYPHS.question;
  const a = actAt ?? (act === 'spin' ? (t * 0.35) % 1 : act === 'pulse' ? (t * 1.1) % 1 : 0);
  const k = ease(a);
  const strokes = (col: string, p: number, extra?: (i: number) => string) => paths.map((d, i) => {
    const q = unit(p * paths.length - i);
    return <path key={i} d={d} pathLength={1} fill="none" stroke={col} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray="1 1" strokeDashoffset={1 - q} opacity={q > 0 ? 1 : 0} transform={extra?.(i)} />;
  });
  let body: React.ReactNode;
  if (act === 'spin') body = <g transform={`rotate(${(a * 360).toFixed(1)} 32 32)`}>{strokes(color, draw)}</g>;
  else if (act === 'pulse') {
    const s = 1 + 0.09 * Math.sin(a * Math.PI * 2) ** 8;
    body = <g transform={`translate(32 32) scale(${s.toFixed(3)}) translate(-32 -32)`}>{strokes(color, draw)}</g>;
  } else if (act === 'burst') {
    // each stroke flies out from the centre and fades, in the red, as the thing breaks apart
    body = strokes(k > 0 ? accent : color, draw, (i) => {
      const ang = (i / paths.length) * Math.PI * 2 + 0.6;
      return `translate(${(Math.cos(ang) * 22 * k).toFixed(1)} ${(Math.sin(ang) * 22 * k).toFixed(1)}) rotate(${(k * (i % 2 ? 25 : -25)).toFixed(1)} 32 32)`;
    });
    body = <g opacity={1 - 0.65 * k}>{body}</g>;
  } else if (act === 'fill') {
    // a level rising inside the outline, clipped to the first stroke's shape
    const id = `vt-fill-${name}-${Math.round(size)}`;
    body = <>
      <clipPath id={id}>{paths.map((d, i) => <path key={i} d={d} />)}</clipPath>
      <rect x={0} y={64 - 64 * k} width={64} height={64 * k} fill={accent} fillOpacity={0.85} clipPath={`url(#${id})`} />
      {strokes(color, draw)}
    </>;
  } else body = strokes(color, draw);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{overflow: 'visible', display: 'block'}}>
      {body}
      {act === 'multiply' && BUDS.map(([bx, by], j) => {
        // copies bud off one after another and settle beside it, smaller
        const p = ease(unit(a * BUDS.length - j));
        if (p <= 0) return null;
        const sc = 0.55 * p;
        return <g key={j} transform={`translate(${(32 + (bx * 64 - 32) * p).toFixed(1)} ${(32 + (by * 64 - 32) * p).toFixed(1)}) scale(${sc.toFixed(3)}) translate(-32 -32)`} opacity={p}>
          {paths.map((d, i) => <path key={i} d={d} fill="none" stroke={j === 0 ? accent : color} strokeWidth={stroke / Math.max(0.3, sc)} strokeLinecap="round" strokeLinejoin="round" />)}
        </g>;
      })}
    </svg>
  );
}

export function Pictogram({name, size = 180, act, actAt, label, tone = 'ink', at, place = 'right', among, x = 0, y = 0, show = 1}: {
  name: string; size?: number; act?: Act; actAt?: number; label?: string; tone?: 'ink' | 'red' | 'dim'; at?: string; place?: 'right' | 'left' | 'above' | 'below'; among?: string[]; x?: number; y?: number; show?: number;
}) {
  const map = useMap();
  const n = at ? map?.at(at) : undefined;
  let X = x, Y = y;
  const group = among && map ? map.nodes.filter((m) => among.includes(m.id)) : [];
  if (group.length) {
    // in the middle of the terms' rules: the gap between two columns, halfway between two rows
    const b = bounds(group), ys = group.map((m) => m.y);
    X = (b.x0 + b.x1) / 2 - size / 2; Y = (Math.min(...ys) + Math.max(...ys)) / 2 + size / 2 - 14;
  } else if (n) {
    if (place === 'right') { X = n.x + n.box.w + 80; Y = n.y; }
    else if (place === 'left') { X = n.x - size - 80; Y = n.y; }
    else if (place === 'above') { X = n.x; Y = n.y - n.box.above - 30; }
    else { X = n.x; Y = n.y + n.box.depth + size + 30; }
  }
  const fade = useEdgeFade({x0: X, y0: Y - size, x1: X + size * (act === 'multiply' ? 2.2 : 1), y1: Y + (label ? 60 : 0)});
  if (show <= 0.001) return null;
  const color = tone === 'red' ? 'var(--color-op)' : tone === 'dim' ? 'var(--color-border)' : 'var(--color-text)';
  return (
    <div style={{position: 'absolute', left: X, top: Y - size, width: 0, height: 0, opacity: fade}}>
      <GlyphArt name={name} size={size} draw={ease(unit(show / 0.8))} act={act} actAt={actAt} color={color} />
      {label && <div style={{position: 'absolute', left: 0, top: size + 14, width: size, textAlign: 'center', whiteSpace: 'nowrap', opacity: ease(unit((show - 0.6) / 0.4)),
        fontFamily: 'var(--font-sans)', fontSize: 38, fontWeight: 600, lineHeight: '46px', color}}>{spaced(label)}</div>}
    </div>
  );
}
