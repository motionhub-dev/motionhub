import React from 'react';
import {FRAME_X, FRAME_Y, MAP_TOP, MAP_BOTTOM, CameraContext} from './geometry.ts';

export const meta = {
  name: {en: 'Sheet and camera', 'zh-CN': '图纸与镜头'},
  purpose: 'ground',
  line: 'A cool layout sheet with faint registration crosses, under one camera.',
  fits: 'every scene; the map inside is in map pixels',
  params: {
    camX: {type: 'px', default: 960, doc: 'the map point at the centre of the frame, across'},
    camY: {type: 'px', default: 480, doc: 'the map point at the centre of the frame, down (the frame centre sits at y 480, above the captions)'},
    zoom: {type: 'number', default: 1, doc: '1 shows 1920 map pixels across; 1.4 to 1.7 to travel a relation; 0.6 for a whole large map'},
    smear: {type: 'point', default: [0, 0], doc: '[dx, dy] on screen: the crosses on the sheet streak along the travel of the camera while it moves (0 at rest, 60 to 120 at full speed); the words stay sharp'},
  },
  preview: 36.6,
};

const FIELD = 6000;

// registration crosses every 160 map pixels: a layout sheet, not squared paper, and enough texture to show the camera moving
const tile = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>${svg}</svg>`)}")`;
const CROSS = tile("<path d='M80 73v14M73 80h14' stroke='#A9BDCC' stroke-width='1.5' stroke-linecap='square'/><circle cx='0' cy='0' r='1.4' fill='#9FB6C8' fill-opacity='0.6'/>");
// a camera in motion: each cross pales and draws a streak along the travel, so the sheet reads as moving while the words stay sharp
const STREAK = (dx: number, dy: number) => tile(`<path d='M80 73v14M73 80h14' stroke='#A9BDCC' stroke-opacity='0.35' stroke-width='1.5'/><path d='M${(80 - dx / 2).toFixed(1)} ${(80 - dy / 2).toFixed(1)}L${(80 + dx / 2).toFixed(1)} ${(80 + dy / 2).toFixed(1)}' stroke='#B4C5D2' stroke-width='1.4' stroke-linecap='round'/>`);

export function Sheet({camX = 960, camY = 480, zoom = 1, smear = [0, 0], children}: {camX?: number; camY?: number; zoom?: number; smear?: [number, number]; children?: React.ReactNode}) {
  // the streak in map pixels, at most most of a tile
  const sl = Math.hypot(smear[0], smear[1]) / zoom, k = sl > 140 ? 140 / sl : 1;
  const ground = sl > 2 ? STREAK((smear[0] / zoom) * k, (smear[1] / zoom) * k) : CROSS;
  const world = `translate(${FRAME_X}px, ${FRAME_Y}px) scale(${zoom.toFixed(4)}) translate(${(-camX).toFixed(2)}px, ${(-camY).toFixed(2)}px)`;
  const mask = `linear-gradient(180deg, transparent ${MAP_TOP - 50}px, #000 ${MAP_TOP}px, #000 ${MAP_BOTTOM - 40}px, transparent ${MAP_BOTTOM}px)`;
  return (
    <div data-camera="" style={{position: 'absolute', inset: 0, overflow: 'hidden', background: 'var(--color-bg)'}}>
      <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: world, opacity: 0.8}}>
        <div style={{position: 'absolute', left: -FIELD, top: -FIELD, width: 2 * FIELD, height: 2 * FIELD, backgroundImage: ground, backgroundSize: '160px 160px', backgroundPosition: '0 0'}} />
      </div>
      <div data-camera="" style={{position: 'absolute', left: 0, top: 0, width: 1920, height: MAP_BOTTOM, overflow: 'hidden', maskImage: mask, WebkitMaskImage: mask}}>
        <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: world}}>
          <CameraContext.Provider value={{camX, camY, zoom}}>{children}</CameraContext.Provider>
        </div>
      </div>
    </div>
  );
}
