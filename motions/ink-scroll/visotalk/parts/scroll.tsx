import React, {createContext, useContext, type ReactNode} from 'react';
import {TONE, ease, rng} from './ink.ts';

export const meta = {
  name: {en: 'Handscroll', 'zh-CN': '手卷'},
  purpose: 'ground',
  line: 'A long strip of rice paper between silk bands, unrolled from the right and travelled leftwards as time moves on.',
  fits: 'every scene: a history, a journey or stages laid out on one painting; seen whole as the summing-up',
  params: {
    length: {type: 'px', default: 1920, doc: 'how long the strip is; a film that travels makes it several frames long'},
    view: {type: 'px', default: 0, doc: 'the strip x at the frame\'s left edge: start at length − 1920 (the right end, where a handscroll begins) and tween it down to travel on'},
    unroll: {type: 'progress', default: 1, doc: '0 to 1: the roller travels from the right edge to the left, opening the paper behind it'},
    whole: {type: 'progress', default: 0, doc: '0 to 1: pull back until the whole strip is in the frame'},
    marks: {type: '{x, label}[]', default: [], doc: 'dates on the line of time, written large on the table under the strip when it is seen whole: x in strip px'},
    children: {type: 'nodes', doc: 'what is painted on it, each in a <Place x y w h hide> (exported beside it) in strip px: x from the strip\'s left end, y as on the canvas'},
  },
  preview: 52,
};

/** The paper between the bands, in strip px */
export const PAPER = {top: 46, bottom: 1034} as const;
const W = 1920, H = 1080, FADE = 150, EDGE = 16;

type Lens = {s: number; x: number; y: number; left: number};
const LensContext = createContext<Lens>({s: 1, x: 0, y: 0, left: 0});

// the paper's tooth, pulp and fibres: one tile, drawn once and repeated by the browser
const TILE = (() => {
  const r = rng(7), fibres = Array.from({length: 26}, () => {
    const x = r() * 480, y = r() * 480, a = r() * Math.PI, l = 30 + r() * 80, b = (r() - 0.5) * 26;
    return `M${x.toFixed(0)} ${y.toFixed(0)} q${(Math.cos(a) * l * 0.5 + b).toFixed(0)} ${(Math.sin(a) * l * 0.5 - b).toFixed(0)} ${(Math.cos(a) * l).toFixed(0)} ${(Math.sin(a) * l).toFixed(0)}`;
  }).join(' ');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480"><filter id="g" x="0" y="0" width="100%" height="100%">'
    + '<feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="4" stitchTiles="stitch" result="t"/>'
    + '<feColorMatrix in="t" type="matrix" values="0 0 0 0 0.36 0 0 0 0 0.31 0 0 0 0 0.24 0 0 0 -1.1 0.62" result="a"/>'
    + '<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="9" stitchTiles="stitch" result="p"/>'
    + '<feColorMatrix in="p" type="matrix" values="0 0 0 0 0.5 0 0 0 0 0.44 0 0 0 0 0.33 0 0 0 -0.7 0.28" result="b"/>'
    + '<feMerge><feMergeNode in="b"/><feMergeNode in="a"/></feMerge></filter>'
    + `<rect width="480" height="480" filter="url(#g)"/><path d="${fibres}" fill="none" stroke="#6E685D" stroke-opacity="0.16" stroke-width="0.9"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
})();
// the slow clouding of handmade paper, at the scale of a frame
const MOTTLE = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><filter id="m" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.0035 0.0042" numOctaves="4" seed="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0.55 0 0 0 0 0.46 0 0 0 0 0.3 0 0 0 0.075 -0.02"/></filter><rect width="1600" height="1000" filter="url(#m)"/></svg>')}")`;

/** A rect clipped to the frame, or null when none of it is in the frame */
const inFrame = (x: number, y: number, w: number, h: number) => {
  const x0 = Math.max(0, x), y0 = Math.max(0, y), x1 = Math.min(W, x + w), y1 = Math.min(H, y + h);
  return x1 > x0 && y1 > y0 ? {x: x0, y: y0, w: x1 - x0, h: y1 - y0} : null;
};

export function Scroll({length = 1920, view = 0, unroll = 1, whole = 0, marks = [], children}: {length?: number; view?: number; unroll?: number; whole?: number; marks?: {x: number; label: string}[]; children?: ReactNode}) {
  const w = ease(whole), fit = Math.min(1, 1840 / length), s = 1 + (fit - 1) * w;
  const x = -view * s * (1 - w) + ((W - length * fit) / 2) * w, y = ((H - H * fit) / 2) * w;
  // the roller travels leftwards; the paper is open to its right
  const roller = W - 28 - 1852 * ease(unroll), left = unroll < 1 ? roller : 0;
  // the paper and its bands are one backdrop drawn only where the strip is in the frame, its texture held to the strip
  const strip = inFrame(Math.max(x, left), y, x + length * s - Math.max(x, left), H * s);
  const anchor = (r: {x: number; y: number}) => `${(x - r.x).toFixed(1)}px ${(y - r.y).toFixed(1)}px`;
  const band = (from: number, to: number) => `linear-gradient(to bottom, transparent ${(from * s).toFixed(1)}px, var(--vt-border) ${(from * s).toFixed(1)}px, var(--vt-border) ${(to * s).toFixed(1)}px, transparent ${(to * s).toFixed(1)}px)`;
  const line = (at: number) => `linear-gradient(to bottom, transparent ${(at * s).toFixed(1)}px, rgba(28, 26, 23, 0.55) ${(at * s).toFixed(1)}px, rgba(28, 26, 23, 0.55) ${((at + 4) * s).toFixed(1)}px, transparent ${((at + 4) * s).toFixed(1)}px)`;
  return (
    <div style={{position: 'absolute', inset: 0, background: 'var(--vt-bg)'}}>
      {strip && <div style={{position: 'absolute', left: strip.x, top: strip.y, width: strip.w, height: strip.h, backgroundColor: 'var(--vt-panel)',
        backgroundImage: [line(PAPER.top - 4), line(PAPER.bottom), band(0, PAPER.top), band(PAPER.bottom, H), MOTTLE, TILE].join(', '),
        backgroundSize: `100% ${(H * s).toFixed(1)}px, 100% ${(H * s).toFixed(1)}px, 100% ${(H * s).toFixed(1)}px, 100% ${(H * s).toFixed(1)}px, ${(1600 * s).toFixed(1)}px ${(1000 * s).toFixed(1)}px, ${(480 * s).toFixed(1)}px ${(480 * s).toFixed(1)}px`,
        backgroundPosition: `0 ${(y - strip.y).toFixed(1)}px, 0 ${(y - strip.y).toFixed(1)}px, 0 ${(y - strip.y).toFixed(1)}px, 0 ${(y - strip.y).toFixed(1)}px, ${anchor(strip)}, ${anchor(strip)}`,
        backgroundRepeat: 'no-repeat, no-repeat, no-repeat, no-repeat, repeat, repeat',
        boxShadow: w > 0.02 ? `0 ${24 * w}px ${50 * w}px -20px rgba(40,30,15,${0.45 * w})` : undefined}} />}
      <LensContext.Provider value={{s, x, y, left}}>{children}</LensContext.Provider>
      {unroll < 1 && <Roller x={roller} />}
      {/* seen whole, the dates are written large on the table under the strip, so a lesson's line of time can be read at a glance */}
      {w > 0.6 && marks.length > 0 && (
        <div style={{position: 'absolute', left: 0, top: y + H * s + 26, width: W, height: 90, opacity: ease(whole, 0.7, 1), fontFamily: 'var(--vt-sans)', color: 'var(--vt-text)'}}>
          {marks.map((m) => (
            <div key={m.label} style={{position: 'absolute', left: Math.round(x + m.x * s) - 4, top: 0, display: 'flex', alignItems: 'flex-start', gap: 10}}>
              <div style={{width: 4, height: 54, background: 'var(--vt-text)', opacity: TONE.thick, borderRadius: 2}} />
              <div style={{fontSize: 46, fontWeight: 500, lineHeight: 1, opacity: TONE.burnt, fontVariantNumeric: 'oldstyle-nums', whiteSpace: 'nowrap'}}>{m.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * A box on the strip, in strip px. It is drawn where the view puts it and dissolves into the paper as it nears an edge of the frame
 * (or the roller), so the frame never cuts a painting. `hide` is the scale below which it fades away as the scroll is pulled back:
 * small writing that could no longer be read leaves the painting rather than shrinking into it.
 */
export function Place({x, y, w, h, hide = 0, children}: {x: number; y: number; w: number; h: number; hide?: number; children?: ReactNode}) {
  const lens = useContext(LensContext), k = lens.s;
  const sx = lens.x + x * lens.s, sy = lens.y + y * lens.s;
  const room = Math.min(sx - lens.left, W - (sx + w * k), sy, H - (sy + h * k)) - EDGE;
  const o = ease(room / FADE) * (hide > 0 ? ease((k - hide) / 0.12) : 1);
  if (o < 0.04) return null;
  return (
    <div style={{position: 'absolute', left: sx, top: sy, width: w, height: h, transform: k !== 1 ? `scale(${k.toFixed(4)})` : undefined, transformOrigin: '0 0', opacity: o < 1 ? o : undefined}}>
      {children}
    </div>
  );
}

/** The wooden roller the paper is wound on: a rod the height of the scroll with turned ends */
function Roller({x}: {x: number}) {
  const r = 26;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="ink-roller" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4a3524" /><stop offset="0.35" stopColor="#8a6a48" /><stop offset="0.55" stopColor="#a8875f" /><stop offset="1" stopColor="#3b2a1c" />
        </linearGradient>
        <linearGradient id="ink-wound" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#cfc4ab" /><stop offset="0.45" stopColor="#f3ecdb" /><stop offset="1" stopColor="#b9ad92" />
        </linearGradient>
      </defs>
      <rect x={x - r} y={22} width={r * 2} height={H - 44} rx={r * 0.5} fill="url(#ink-wound)" />
      {[0.25, 0.5, 0.75].map((t) => <line key={t} x1={x - r + r * 2 * t} y1={PAPER.top} x2={x - r + r * 2 * t} y2={PAPER.bottom} stroke="#9c8f72" strokeOpacity={0.35} strokeWidth={1} />)}
      <rect x={x - r} y={22} width={r * 2} height={PAPER.top - 22} fill="var(--vt-border)" style={{filter: 'brightness(0.85)'}} />
      <rect x={x - r} y={PAPER.bottom} width={r * 2} height={H - PAPER.bottom - 22} fill="var(--vt-border)" style={{filter: 'brightness(0.85)'}} />
      <rect x={x - r * 0.6} y={4} width={r * 1.2} height={20} rx={6} fill="url(#ink-roller)" />
      <rect x={x - r * 0.6} y={H - 24} width={r * 1.2} height={20} rx={6} fill="url(#ink-roller)" />
    </svg>
  );
}
