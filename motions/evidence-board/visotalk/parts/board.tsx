import React from 'react';
import {random} from '@visotalk/runtime';

export const meta = {
  name: {en: 'Board and camera', 'zh-CN': '证据墙与镜头'},
  purpose: 'ground',
  line: 'A dark felt board under one soft light, old pin holes in its weave, and the camera that glides across it and pushes into a card.',
  fits: 'every scene: everything inside in board pixels; tween camX, camY, zoom',
  params: {
    camX: {type: 'px', default: 960, doc: 'the board point at the centre of the frame, across'},
    camY: {type: 'px', default: 430, doc: 'the board point at the centre of the frame, down (the frame centre sits at y 430, above the captions)'},
    zoom: {type: 'number', default: 1, doc: '1 shows 1920 board pixels across; 1.3 to 1.5 to read a line, the card whole in frame; 0.5 to 0.6 for the whole case'},
    drift: {type: 'px', default: 0, doc: 'a slow sideways drift added to camX, tweened over a held frame so a still board breathes (20 to 40 px over a line)'},
    tilt: {type: 'degrees', default: 0, doc: 'the board leans back from the camera, lit by a raking light: 25 to 40 for an opening or a closing shot, 0 whenever a line is read'},
    turn: {type: 'degrees', default: 0, doc: 'the board turned under the camera, -8 to 8, tweened with `tilt` for a slow crane'},
    travel: {type: 'progress', default: 0, doc: '0 to 1 across a glide between cards, tweened with the camera: the camera rises a little and the board blurs at the fastest point; set back to 0 before the next glide'},
  },
  preview: 28.9,
};

/** The camera's zoom, for marks that keep their weight on screen however close the camera is */
export const ZoomContext = React.createContext(1);
export const useZoom = () => React.useContext(ZoomContext);

// the point of the frame the camera centres on: above the middle, so cards stay clear of the caption slip
export const FRAME_X = 960;
export const FRAME_Y = 430;
// the board's extent in board pixels; the felt is drawn this large and the camera stays over it
export const BOARD = {w: 3400, h: 1900};
// where the pinned layer ends on the frame: it fades out over the 35 px above, clear of the caption slip
const PINNED_BOTTOM = 905;
// the felt runs this far past the board on every side, so a wide shot never shows its edge
const FELT = 2400;

// the felt's weave: two faint families of short strokes on a 640 px tile, so the dark ground has a tooth and does not band in a compressed video;
// a CSS background (not an svg) so it reads as the ground behind the cards, not as something drawn under the captions
const tile = (key: string, size: number, draw: (g: () => number) => string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>${draw(random(key))}</svg>`)}")`;
const WEAVE = tile('evidence-board:weave', 640, (g) => {
  let a = '', b = '';
  for (let i = 0; i < 640; i++) {
    const x = Math.round(g() * 636), y = Math.round(g() * 636), l = 3 + Math.round(g() * 5);
    if (i % 2) a += `M${x} ${y}h${l}`; else b += `M${x} ${y}v${l}`;
  }
  return `<path d='${a}' stroke='%23FFF6E8' stroke-opacity='0.07' stroke-width='1.4'/><path d='${b}' stroke='%23000' stroke-opacity='0.3' stroke-width='1.4'/>`.replace(/%23/g, '#');
});
// pin holes left by earlier cases, on a larger tile so they do not read as a pattern: the board has been used before
const HOLES = tile('evidence-board:holes', 1130, (g) => Array.from({length: 16}, () => {
  const x = Math.round(g() * 1110) + 10, y = Math.round(g() * 1110) + 10, r = (1.6 + g() * 1.6).toFixed(1);
  return `<circle cx='${x}' cy='${y + 0.8}' r='${r}' fill='#FFF6E8' fill-opacity='0.05'/><circle cx='${x}' cy='${y}' r='${r}' fill='#080706' fill-opacity='0.75'/>`;
}).join(''));

export function Board({camX = 960, camY = 430, zoom = 1, drift = 0, tilt = 0, turn = 0, travel = 0, children}: {camX?: number; camY?: number; zoom?: number; drift?: number; tilt?: number; turn?: number; travel?: number; children?: React.ReactNode}) {
  const cx = camX + drift;
  // a glide is a short flight: the camera rises at its fastest point (the board shrinks a little) and the board blurs with the speed
  const arc = Math.sin(Math.PI * Math.max(0, Math.min(1, travel)));
  const z = zoom * (1 - 0.1 * arc);
  const blur = 5 * arc * arc;
  const lean = Math.abs(tilt) > 0.01 || Math.abs(turn) > 0.01;
  const world = `translate(${FRAME_X}px, ${FRAME_Y}px)${lean ? ` perspective(2200px) rotateX(${tilt.toFixed(2)}deg) rotateZ(${turn.toFixed(2)}deg)` : ''} scale(${z.toFixed(4)}) translate(${(-cx).toFixed(2)}px, ${(-camY).toFixed(2)}px)`;
  const moving = blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : undefined;
  // a raking light across a leaning board: brighter at its top edge, falling into shadow towards the lens
  const rake = Math.min(1, Math.abs(tilt) / 35);
  return (
    // the frame is the camera's: what lies past it is cropped, and qa measures only what it shows (data-vt-camera)
    <div data-vt-camera="" style={{position: 'absolute', inset: 0, overflow: 'hidden', background: 'var(--vt-bg)'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: BOARD.w, height: BOARD.h, transformOrigin: '0 0', transform: world, filter: moving}}>
        {/* the felt and its weave, under everything pinned to it; it runs under the caption slip */}
        <div style={{position: 'absolute', left: -FELT, top: -FELT, width: BOARD.w + 2 * FELT, height: BOARD.h + 2 * FELT, backgroundImage: `${HOLES}, ${WEAVE}`, backgroundSize: '1130px 1130px, 640px 640px'}} />
      </div>
      {/* what is pinned to the board, under the same camera, fades into the felt above the caption slip: nothing pinned is ever read under it */}
      <div data-vt-camera="" style={{position: 'absolute', left: 0, top: 0, width: 1920, height: PINNED_BOTTOM, overflow: 'hidden',
        maskImage: `linear-gradient(180deg, #000 ${PINNED_BOTTOM - 35}px, transparent ${PINNED_BOTTOM}px)`, WebkitMaskImage: `linear-gradient(180deg, #000 ${PINNED_BOTTOM - 35}px, transparent ${PINNED_BOTTOM}px)`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: BOARD.w, height: BOARD.h, transformOrigin: '0 0', transform: world, filter: moving}}>
          <ZoomContext.Provider value={z}>{children}</ZoomContext.Provider>
        </div>
      </div>
      {rake > 0.01 && <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: rake, background: 'linear-gradient(180deg, rgba(255, 232, 196, 0.16) 0%, rgba(255, 232, 196, 0) 38%, rgba(0, 0, 0, 0.5) 100%)'}} />}
      {/* one soft light from above the board, fixed in the room: a pool at the top of the frame, falling away to the corners */}
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(80% 70% at 50% 24%, rgba(255, 236, 205, 0.11) 0%, rgba(255, 236, 205, 0) 65%), radial-gradient(130% 115% at 50% 38%, transparent 50%, rgba(0, 0, 0, 0.6) 100%)'}} />
    </div>
  );
}
