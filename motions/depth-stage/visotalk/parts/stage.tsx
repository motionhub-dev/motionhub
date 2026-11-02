// The stage and the camera every Depth Stage component is seen through. A plane stands at a depth `z` (px behind the picture plane at rest);
// the stage's CSS perspective places it, and the same numbers give its defocus (a thin-lens circle of confusion) and its haze (aerial
// perspective), so what is far is small, soft and pale, and only the depth in focus is sharp.
import React, {createContext, useContext, useMemo} from 'react';
import {useDocTime, useFrame} from '@visotalk/runtime';

export const meta = {
  name: {en: 'Depth stage', 'zh-CN': '景深舞台'},
  purpose: 'ground',
  line: 'A dusk sky and its haze seen through one camera that dollies, pans and racks focus; every other component stands on a plane in it.',
  fits: 'every scene: one per scene, holding that scene\'s planes; tween cam to dolly through the layers, focus to rack between them',
  params: {
    cam: {type: 'px', default: 0, doc: 'how far the camera has dollied forward into the depth'},
    focus: {type: 'px', default: 0, doc: 'the depth that is sharp (a plane\'s z)'},
    aperture: {type: 'number', default: 22, doc: 'how soft what is out of focus becomes; 0 keeps everything sharp'},
    panX: {type: 'px', default: 0, doc: 'the camera moved sideways: near planes slide more than far ones'},
    panY: {type: 'px', default: 0, doc: 'the camera moved up or down'},
    lightX: {type: 'px', default: 1320, doc: 'where the low light sits in the sky, across'},
    lightY: {type: 'px', default: 470, doc: 'where the low light sits in the sky, down'},
    glow: {type: 'progress', default: 0.6, doc: 'how bright the light in the sky is'},
    veil: {type: 'progress', default: 0, doc: 'haze in front of everything: 1 is a bank of fog the camera passes through'},
    haze: {type: 'number', default: 1, doc: 'how thick the air is: more makes far planes paler sooner'},
    rays: {type: 'progress', default: 0, doc: 'shafts of the low light in the haze, between the middle and the far layers'},
    quake: {type: 'progress', default: 0, doc: 'the ground shaking under the camera: tween it up on the blow and back to 0; once a film'},
    flash: {type: 'progress', default: 0, doc: 'the sky lit at once by a blast or a bolt: tween it up and let it fall'},
  },
  preview: 41.0,
};

/** The lens: px from the eye to the picture plane. */
export const LENS = 1000;
/** A plane's sheet reaches past the frame on every side, so a pan or a dolly never shows its edge. */
export const SHEET = {x: -480, y: -240, w: 2880, h: 1720};

type Camera = {cam: number; focus: number; aperture: number; haze: number};
export type Look = {near: number; grow: number; blur: number; fog: number; fade: number};

const CameraContext = createContext<Camera>({cam: 0, focus: 0, aperture: 22, haze: 1});
const LookContext = createContext<Look>({near: LENS, grow: 1, blur: 0, fog: 0, fade: 1});
const AheadContext = createContext(0);
const LightContext = createContext({x: 1320, y: 470, glow: 0.6});

/** Where the low light is and how bright, for a component that catches it */
export const useLight = () => useContext(LightContext);

export const unit = (v: number) => Math.max(0, Math.min(1, v));

/** What the camera makes of a plane `near` px from the eye that shows at its drawn size `rest` px from it. */
function look(near: number, rest: number, c: Camera): Look {
  const sharp = Math.max(80, LENS + c.focus - c.cam);
  const coc = c.aperture * LENS * Math.abs(1 / sharp - 1 / Math.max(1, near));
  return {
    near,
    grow: rest / Math.max(1, near),
    blur: Math.round(Math.min(16, coc) * 2) / 2,       // half-pixel steps, so a layer at rest keeps its cached blur
    fog: unit((Math.max(0, near - LENS) / 5500) ** 0.8 * c.haze),
    fade: unit((near - 140) / 520),                     // a plane the camera reaches fades as it passes the lens
  };
}

/** How the plane a component stands on is seen: its fog (0 clear, 1 lost in the haze), its blur and its size on screen. */
export const useLook = () => useContext(LookContext);

/** A colour seen through `fog` of haze. */
export const hazed = (color: string, fog: number) => `color-mix(in oklab, ${color}, var(--vt-grad) ${Math.round(unit(fog) * 100)}%)`;

/**
 * A flat layer of the world at depth `z`. `x` and `y` place it as it shows at rest; the camera's pan gives it parallax, its dolly its growth.
 * Everything drawn inside it is blurred and hazed together, as one painted card on a multiplane stand.
 */
export function Plane({z, x = 0, y = 0, children}: {z: number; x?: number; y?: number; children?: React.ReactNode}) {
  const c = useContext(CameraContext);
  const ahead = useContext(AheadContext);
  const depth = z + ahead;
  const l = look(LENS + depth - c.cam, LENS + z, c);
  // a set built ahead stays hidden until its sheet covers the frame, so its edges never show: arrive at it through a veil
  if (ahead > 0) l.fade *= unit((l.grow - 0.62) / 0.14);
  if (l.fade <= 0) return null;
  const local = l.blur / Math.max(0.05, l.grow);       // a CSS filter blurs before the projection scales it
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '960px 540px', opacity: l.fade,
      transform: `translate3d(0px, 0px, ${-(depth - c.cam)}px) scale(${(LENS + z) / LENS}) translate(${x}px, ${y}px)`,
      filter: local > 0.3 ? `blur(${local.toFixed(2)}px)` : 'none'}}>
      <LookContext.Provider value={l}>{children}</LookContext.Provider>
    </div>
  );
}

/**
 * The next set, built `by` px further into the depth: its planes are written with the depths they have in their own scene and show exactly
 * as they do there once the camera has dollied `by` px, so a scene can end by travelling into the next one.
 */
export function Ahead({by, children}: {by: number; children?: React.ReactNode}) {
  const base = useContext(AheadContext);
  return <AheadContext.Provider value={base + by}>{children}</AheadContext.Provider>;
}

/**
 * A painted shape on a plane's whole sheet: an SVG path used as a mask over a CSS paint. Drawn this way a silhouette is the ground the
 * picture stands on (the sheet is larger than the frame), not ink placed on it, and its colour may change every frame while the mask stays cached.
 */
export function Sheet({d, paint, stroke = 0, opacity = 1}: {d: string; paint: string; stroke?: number; opacity?: number}) {
  const mask = useMemo(() => {
    const body = stroke > 0
      ? `<path d="${d}" fill="none" stroke="#fff" stroke-width="${stroke}" stroke-linejoin="round" stroke-linecap="round"/>`
      : `<path d="${d}" fill="#fff"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${SHEET.x} ${SHEET.y} ${SHEET.w} ${SHEET.h}" width="${SHEET.w}" height="${SHEET.h}" preserveAspectRatio="none">${body}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [d, stroke]);
  if (opacity <= 0.01) return null;
  return (
    <div style={{position: 'absolute', left: SHEET.x, top: SHEET.y, width: SHEET.w, height: SHEET.h, background: paint, opacity,
      WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: '100% 100%', maskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat'}} />
  );
}

/** A soft round light on a plane's whole sheet: a glow, a lamp's halo, light falling on a wall. */
export function Glow({x, y, r, color, alpha = 1}: {x: number; y: number; r: number; color: string; alpha?: number}) {
  if (alpha <= 0.01) return null;
  return (
    <div style={{position: 'absolute', left: SHEET.x, top: SHEET.y, width: SHEET.w, height: SHEET.h, opacity: unit(alpha), mixBlendMode: 'screen',
      background: `radial-gradient(${Math.round(r)}px ${Math.round(r)}px at ${Math.round(x - SHEET.x)}px ${Math.round(y - SHEET.y)}px, ${color}, color-mix(in srgb, ${color} 30%, transparent) 28%, transparent 100%)`}} />
  );
}

/** Shafts of light fanning down from the light through the haze, fading with distance from it */
function Rays({x, y, alpha}: {x: number; y: number; alpha: number}) {
  const at = `${Math.round(x - SHEET.x)}px ${Math.round(y - SHEET.y)}px`;
  const stops = [94, 101, 110, 117, 128, 139, 146, 158, 171, 182, 197, 206, 221, 233, 248, 262].map((a, i) => {
    const w = 2.2 + (i % 3) * 1.6, o = 14 + ((i * 7) % 5) * 5;
    return `transparent ${a - w}deg, color-mix(in srgb, var(--vt-data) ${o}%, transparent) ${a}deg, transparent ${a + w}deg`;
  }).join(', ');
  const fade = `radial-gradient(1500px 1100px at ${at}, #000 0%, rgba(0,0,0,0.55) 35%, transparent 80%)`;
  return (
    <div style={{position: 'absolute', left: SHEET.x, top: SHEET.y, width: SHEET.w, height: SHEET.h, opacity: alpha,
      background: `conic-gradient(from 0deg at ${at}, transparent 0deg, ${stops}, transparent 360deg)`, WebkitMaskImage: fade, maskImage: fade}} />
  );
}

// a fine film grain, so the long soft gradients of the sky and the haze do not band in a compressed video
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.6 -0.55"/></filter><rect width="360" height="360" filter="url(#n)"/></svg>')}")`;

export function Stage({cam = 0, focus = 0, aperture = 22, panX = 0, panY = 0, lightX = 1320, lightY = 470, glow = 0.6, veil = 0, haze = 1, rays = 0, quake = 0, flash = 0, children}: {
  cam?: number; focus?: number; aperture?: number; panX?: number; panY?: number; lightX?: number; lightY?: number; glow?: number; veil?: number; haze?: number; rays?: number; quake?: number; flash?: number; children?: React.ReactNode;
}) {
  const t = useDocTime();
  const frame = useFrame();
  // the camera is never locked off: it breathes a few pixels, slowly, so a held frame is still alive
  const q = unit(quake);
  const driftX = Math.sin(t * 0.23) * 7 + q * 14 * (Math.sin(t * 43) + 0.5 * Math.sin(t * 71 + 2));
  const driftY = Math.sin(t * 0.17 + 1) * 3 + q * 10 * (Math.sin(t * 37 + 1) + 0.5 * Math.sin(t * 89));
  const camera = useMemo(() => ({cam, focus, aperture, haze}), [cam, focus, aperture, haze]);
  const g = unit(glow);
  const light = useMemo(() => ({x: lightX, y: lightY, glow: g}), [lightX, lightY, g]);
  return (
    <div style={{position: 'absolute', inset: 0, contain: 'paint', perspective: `${LENS}px`, perspectiveOrigin: '960px 540px',
      background: 'linear-gradient(180deg, var(--vt-bg) 0%, color-mix(in oklab, var(--vt-bg), var(--vt-grad) 50%) 36%, var(--vt-grad) 56%, color-mix(in oklab, var(--vt-grad), var(--vt-bg) 35%) 100%)'}}>
      {/* the low light in the sky: a wide warm bloom in the haze, and its disc */}
      <div style={{position: 'absolute', inset: 0, opacity: g, background: `radial-gradient(1300px 520px at ${Math.round(lightX - panX * 0.05)}px ${Math.round(lightY + 60)}px, color-mix(in srgb, var(--vt-data) 42%, transparent), color-mix(in srgb, var(--vt-data) 13%, transparent) 45%, transparent 100%)`}} />
      <div style={{position: 'absolute', inset: 0, opacity: g, background: `radial-gradient(64px 64px at ${Math.round(lightX - panX * 0.05)}px ${Math.round(lightY)}px, color-mix(in srgb, var(--vt-text) 92%, var(--vt-data)) 0%, color-mix(in srgb, var(--vt-text) 80%, var(--vt-data)) 45%, color-mix(in srgb, var(--vt-data) 30%, transparent) 75%, transparent 100%)`}} />
      <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `translate3d(${(-panX - driftX).toFixed(2)}px, ${(-panY - driftY).toFixed(2)}px, 0px)`}}>
        <CameraContext.Provider value={camera}><LightContext.Provider value={light}>
          {rays > 0.01 && <Plane z={1800}><Rays x={lightX} y={lightY} alpha={unit(rays) * g} /></Plane>}
          {children}
        </LightContext.Provider></CameraContext.Provider>
      </div>
      {/* the fog bank the camera passes through between two sets */}
      {veil > 0.01 && <div style={{position: 'absolute', inset: 0, opacity: unit(veil), background: 'radial-gradient(120% 120% at 50% 55%, color-mix(in oklab, var(--vt-grad), var(--vt-text) 18%), var(--vt-grad) 70%)'}} />}
      {flash > 0.01 && <div style={{position: 'absolute', inset: 0, opacity: unit(flash), mixBlendMode: 'screen', background: `radial-gradient(140% 120% at ${Math.round(lightX)}px ${Math.round(lightY)}px, color-mix(in oklab, var(--vt-text), var(--vt-data) 35%), color-mix(in srgb, var(--vt-data) 30%, transparent) 55%, transparent 100%)`}} />}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(125% 115% at 50% 46%, transparent 52%, rgba(4, 6, 12, 0.62) 100%)'}} />
      <div style={{position: 'absolute', inset: 0, opacity: 0.07, mixBlendMode: 'overlay', backgroundImage: GRAIN, backgroundPosition: `${(frame * 97) % 360}px ${(frame * 61) % 360}px`}} />
    </div>
  );
}
