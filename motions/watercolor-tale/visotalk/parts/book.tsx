import React, {type ReactNode} from 'react';
import {ease} from './paint.ts';

export const meta = {
  name: {en: 'Picture book', 'zh-CN': '绘本跨页'},
  purpose: 'ground',
  line: 'An open picture book on a linen table, two pages of cold-press paper at a soft fold; the right page turns to the next spread.',
  fits: 'every scene: one spread per idea; a page turn between chapters or steps',
  params: {
    turn: {type: 'progress', default: 0, doc: '0 to 1: the right page lifts and turns over to the left, leaving a fresh spread; tween it at the end of a scene, and start the next scene\'s painting on the new spread'},
    children: {type: 'nodes', doc: 'what is painted on the spread, positioned in canvas px; keep each picture on one page or let it run across the gutter, never with a face or a word on the fold'},
  },
  preview: 22.5,
};

/** The spread on the canvas: two pages from `left` to `right`, the fold at `gutter`; the narration is read on the table below `bottom` */
export const SPREAD = {left: 44, right: 1876, top: 24, bottom: 862, gutter: 960} as const;
const W = 1920, H = 1080;
const PAGE_W = SPREAD.gutter - SPREAD.left, PAGE_H = SPREAD.bottom - SPREAD.top, MID = (SPREAD.top + SPREAD.bottom) / 2, PERSPECTIVE = 3000;

// cold-press paper: a relief of soft bumps lit from the upper left, with the finer tooth on top; one tile, drawn once and repeated
const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const PAPER = svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420"><filter id="p" x="0" y="0" width="100%" height="100%">'
  + '<feTurbulence type="fractalNoise" baseFrequency="0.085" numOctaves="4" seed="3" stitchTiles="stitch" result="n"/>'
  + '<feDiffuseLighting in="n" surfaceScale="1.3" diffuseConstant="1" lighting-color="#fff" result="l"><feDistantLight azimuth="225" elevation="52"/></feDiffuseLighting>'
  + '<feColorMatrix in="l" type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.36  0 0 0 0 0.27  -0.75 0 0 0 0.6"/></filter>'
  + '<rect width="420" height="420" filter="url(#p)"/></svg>');
// a slow, faint clouding of the sheet, so no two places on a page are the same white
const CLOUD = svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900"><filter id="c" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.003 0.004" numOctaves="3" seed="8" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.54  0 0 0 0 0.4  0 0 0 0.06 -0.012"/></filter><rect width="1400" height="900" filter="url(#c)"/></svg>');
// linen on the table: a fine crossed weave
const LINEN = svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="w" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.04" numOctaves="2" seed="5" stitchTiles="stitch" result="a"/><feTurbulence type="fractalNoise" baseFrequency="0.04 0.9" numOctaves="2" seed="6" stitchTiles="stitch" result="b"/><feComposite in="a" in2="b" operator="arithmetic" k2="0.5" k3="0.5"/><feColorMatrix type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.27  0 0 0 0 0.22  -0.9 0 0 0 0.52"/></filter><rect width="240" height="240" filter="url(#w)"/></svg>');

/** A page's paper, `side` 'l' or 'r', shaded as it curves down into the gutter */
function Sheet({side, style}: {side: 'l' | 'r'; style?: React.CSSProperties}) {
  const towards = side === 'l' ? 'to right' : 'to left';
  return (
    <div style={{position: 'absolute', top: SPREAD.top, left: side === 'l' ? SPREAD.left : SPREAD.gutter, width: PAGE_W, height: PAGE_H, backgroundColor: 'var(--vt-panel)',
      backgroundImage: [
        // the page bends down into the fold: a soft shadow, a little light where it rises out of it
        `linear-gradient(${towards}, transparent 80%, rgba(255,250,238,0.35) 91%, rgba(70,55,40,0.07) 96%, rgba(60,45,30,0.26) 100%)`,
        CLOUD, PAPER,
      ].join(', '),
      backgroundSize: `100% 100%, 1400px 900px, 420px 420px`,
      backgroundPosition: side === 'l' ? '0 0, 0 0, 0 0' : '0 0, -916px 0, -916px 0',
      ...style}} />
  );
}

/** Pages under the open ones, seen at the outer edges and the foot of the book */
function Block() {
  const edge = (k: number) => `0 ${2 + k * 2}px 0 -${k}px #E6DECD, 0 ${3 + k * 2}px 0 -${k}px rgba(120,100,80,0.25)`;
  return (
    <div style={{position: 'absolute', left: SPREAD.left, top: SPREAD.top, width: SPREAD.right - SPREAD.left, height: PAGE_H, borderRadius: 3,
      boxShadow: [edge(1), edge(2), edge(3), '0 14px 26px -8px rgba(60,50,35,0.38)', '0 2px 4px rgba(60,50,35,0.2)'].join(', ')}} />
  );
}

export function Book({turn = 0, children}: {turn?: number; children?: ReactNode}) {
  const t = ease(turn), turning = t > 0 && t < 1;
  const angle = -180 * t, lifted = Math.sin(Math.PI * t);
  // paint is trimmed with the page, so a wash may run off the edge as it does in a printed book
  const page = (side: 'l' | 'r' | 'both') => ({position: 'absolute' as const, inset: 0, clipPath:
    `inset(${SPREAD.top}px ${side === 'l' ? W - SPREAD.gutter : W - SPREAD.right}px ${H - SPREAD.bottom}px ${side === 'r' ? SPREAD.gutter : SPREAD.left}px)`});
  return (
    <div style={{position: 'absolute', inset: 0, width: W, height: H, backgroundColor: 'var(--vt-bg)', backgroundImage: LINEN}}>
      <Block />
      <Sheet side="l" />
      <Sheet side="r" />
      {/* the painting: whole while the spread is open; while the leaf turns, the left page keeps its half and the leaf carries the right */}
      {t === 0 && <div style={page('both')}>{children}</div>}
      {/* the old left page goes under the landing leaf; it fades as the leaf comes down, so no edge of it shows round the leaf */}
      {turning && <div style={{...page('l'), opacity: 1 - ease(t, 0.55, 0.92)}}>{children}</div>}
      {turning && (
        // the leaf's shadow sweeps across the fresh right page as it lifts
        <div style={{position: 'absolute', top: SPREAD.top, left: SPREAD.gutter, width: PAGE_W, height: PAGE_H,
          background: `linear-gradient(to right, rgba(50,38,25,${(0.42 * lifted).toFixed(3)}), rgba(50,38,25,0) ${(20 + 70 * Math.cos((Math.PI / 2) * Math.min(1, t * 2))).toFixed(0)}%)`}} />
      )}
      {turning && (
        // seen from above the book: the lifted edge would grow towards the eye, so the leaf is drawn smaller by as much and its far edge keeps the page's height
        <div style={{position: 'absolute', inset: 0, perspective: PERSPECTIVE, perspectiveOrigin: `${SPREAD.gutter}px ${MID}px`}}>
          <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transformOrigin: `${SPREAD.gutter}px ${MID}px`,
            transform: `scale(${((PERSPECTIVE - PAGE_W * lifted * 0.85) / PERSPECTIVE).toFixed(4)})`}}>
            <Strip i={0} t={t}>{children}</Strip>
          </div>
        </div>
      )}
      {/* the fold itself, over everything painted: paint runs into it and darkens there */}
      <div style={{position: 'absolute', top: SPREAD.top, left: SPREAD.gutter - 26, width: 52, height: PAGE_H, mixBlendMode: 'multiply',
        background: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(90,70,50,0.10) 40%, rgba(70,52,36,0.32) 50%, rgba(90,70,50,0.10) 60%, rgba(0,0,0,0) 100%)'}} />
    </div>
  );
}

/** The turning leaf is paper, not board: it is cut into strips that each turn a little further than the one nearer the spine, so it curls */
const STRIPS = 9, SW = PAGE_W / STRIPS;
/** How far strip `i` has turned at `t`: the hand pulls the outer edge over first and the spine follows */
const turned = (i: number, t: number) => {
  const k = i / (STRIPS - 1), lead = ease(t, 0, 0.82), lag = ease(t, 0.12, 1);
  return -180 * (lag + (lead - lag) * k);
};

function Strip({i, t, children}: {i: number; t: number; children?: ReactNode}) {
  const a = turned(i, t), rel = a - (i > 0 ? turned(i - 1, t) : 0), x0 = SPREAD.gutter + i * SW;
  const r = (a * Math.PI) / 180;
  // light from above the reader: the front darkens as it turns away, the back brightens as it comes down; a sheen where the curl faces the light
  const front = 0.34 * (1 - Math.cos(r)) / 2, back = 0.3 * (1 + Math.cos(r)) / 2, sheen = 0.16 * Math.max(0, Math.sin(-r * 2)) * (1 - Math.abs(rel) / 40);
  const face = {position: 'absolute' as const, inset: 0, overflow: 'hidden' as const, backfaceVisibility: 'hidden' as const};
  return (
    <div style={{position: 'absolute', left: i === 0 ? SPREAD.gutter : SW, top: 0, width: SW + 0.6, height: H, transformStyle: 'preserve-3d',
      transformOrigin: `0 ${MID}px`, transform: `rotateY(${rel.toFixed(3)}deg)`}}>
      {/* each face crops its slice of the page, so it is marked as a frame (data-vt-camera) for the checks */}
      <div data-vt-camera="" style={face}>
        <div style={{position: 'absolute', left: -x0, top: 0, width: W, height: H}}>
          <Sheet side="r" />
          <div style={{position: 'absolute', inset: 0, clipPath: `inset(${SPREAD.top}px ${W - SPREAD.right}px ${H - SPREAD.bottom}px ${SPREAD.gutter}px)`}}>{children}</div>
        </div>
        <div style={{position: 'absolute', left: 0, top: SPREAD.top, width: SW + 1, height: PAGE_H, background: `rgba(45,34,22,${front.toFixed(3)})`}} />
        {sheen > 0.005 && <div style={{position: 'absolute', left: 0, top: SPREAD.top, width: SW + 1, height: PAGE_H, background: `rgba(255,252,244,${sheen.toFixed(3)})`}} />}
      </div>
      {/* the back of the strip is the slice of the next spread's left page it will land on */}
      <div data-vt-camera="" style={{...face, transform: 'rotateY(180deg)'}}>
        <div style={{position: 'absolute', left: -(SPREAD.gutter - (i + 1) * SW), top: 0, width: W, height: H}}><Sheet side="l" /></div>
        <div style={{position: 'absolute', left: 0, top: SPREAD.top, width: SW + 1, height: PAGE_H, background: `rgba(45,34,22,${back.toFixed(3)})`}} />
      </div>
      {i < STRIPS - 1 && <Strip i={i + 1} t={t}>{children}</Strip>}
    </div>
  );
}
