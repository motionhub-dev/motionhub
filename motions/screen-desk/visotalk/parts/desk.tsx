import React from 'react';
import {random} from '@visotalk/runtime';

export const meta = {
  name: {en: 'Desk and camera', 'zh-CN': '桌面与镜头'},
  purpose: 'ground',
  line: 'A pale matte desk in window light, and the camera over it that cranes, flies, pushes in and pulls back.',
  fits: 'every scene: screens inside in desk pixels; tween camX, camY, zoom, travel (x and y move the whole desk)',
  params: {
    camX: {type: 'px', default: 960, doc: 'the desk point at the centre of the frame, across'},
    camY: {type: 'px', default: 430, doc: 'the desk point at the centre of the frame, down (430 keeps the subject above the captions)'},
    zoom: {type: 'number', default: 1, doc: '1 shows 1920 desk pixels across; 2 is twice as close; under 1 pulls back over the desk'},
    tilt: {type: 'degrees', default: 0, doc: 'degrees the desk leans away, for an establishing or closing shot; 0 whenever text must be read'},
    turn: {type: 'degrees', default: 0, doc: 'degrees the desk is turned under the camera, a slow orbit for an opening or a closing; 0 whenever text must be read'},
    travel: {type: 'progress', default: 0, doc: '0 to 1 over a move between screens, tweened with the camera: the camera rises mid-way and the desk smears along the move; set it back to 0 before the next move'},
  },
  preview: 2.4,
};

/** The camera's zoom, for marks that keep their size on screen however close the camera is */
export const ZoomContext = React.createContext(1);
export const useZoom = () => React.useContext(ZoomContext);

// The point of the frame the camera centres on: above the middle, so the subject stays clear of the caption band
export const FRAME_X = 960;
export const FRAME_Y = 430;

// a fine tooth on the matte surface, so its light does not band in a compressed video
const GRAIN = (() => {
  const g = random('screen-desk:grain');
  return Array.from({length: 760}, () => `M${Math.round(g() * 1916)} ${Math.round(g() * 876)}h1.4`).join('');
})();

export function Desk({camX = 960, camY = 430, zoom = 1, tilt = 0, turn = 0, travel = 0, children}: {camX?: number; camY?: number; zoom?: number; tilt?: number; turn?: number; travel?: number; children?: React.ReactNode}) {
  // a move between screens is a short flight: the camera rises (the desk shrinks a little) and the desk smears along the move at its fastest
  const arc = Math.sin(Math.PI * Math.max(0, Math.min(1, travel)));
  const z = zoom * (1 - 0.16 * arc);
  const smear = 14 * arc * arc;
  // the window light moves a little with the camera, slower than the desk: the light is in the room, not on the desk
  const dx = -(camX - 960) * 0.18;
  const dy = -(camY - 430) * 0.18;
  const lightScale = 1 + (z - 1) * 0.22;
  const leaning = Math.abs(tilt) > 0.01;
  const turning = Math.abs(turn) > 0.01;
  const world = `translate(${FRAME_X}px, ${FRAME_Y}px)${leaning ? ` perspective(2600px) rotateX(${tilt.toFixed(2)}deg)` : ''}${turning ? ` rotate(${turn.toFixed(2)}deg)` : ''} scale(${z.toFixed(4)}) translate(${(-camX).toFixed(2)}px, ${(-camY).toFixed(2)}px)`;
  return (
    // the frame is the camera's: what lies past it is cropped, and qa measures only what it shows (data-vt-camera)
    <div data-vt-camera="" style={{position: 'absolute', inset: 0, overflow: 'hidden', background: 'var(--vt-bg)'}}>
      {/* the room's light: brighter from the upper left, falling off to the right */}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(120% 110% at 18% 0%, #F3F2EE 0%, rgba(243,242,238,0) 62%), linear-gradient(180deg, rgba(255,255,255,0.0) 55%, rgba(60,58,52,0.07) 100%)'}} />
      {/* a window's panes thrown across the desk, soft and faint */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '960px 430px',
        transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${lightScale.toFixed(3)})`, filter: 'blur(38px)', opacity: 0.55}}>
        {[[-120, -80], [330, -80], [-120, 300], [330, 300]].map(([x, y], i) => (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: 400, height: 330, borderRadius: 18, background: 'rgba(255, 253, 246, 0.95)', transform: 'skewX(-18deg)'}} />
        ))}
      </div>
      {/* the tooth stops above the caption band, which nothing drawn may reach */}
      <svg width={1920} height={880} style={{position: 'absolute', left: 0, top: 0}}><path d={GRAIN} stroke="#5A564C" strokeOpacity={0.06} strokeWidth={1.4} /></svg>
      {smear > 0.2 && (
        <svg width={0} height={0} style={{position: 'absolute'}}><filter id="screen-desk-smear" x="-5%" y="0" width="110%" height="100%"><feGaussianBlur stdDeviation={`${smear.toFixed(2)} 0`} /></filter></svg>
      )}
      {/* the desk itself, under the camera */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: world, filter: smear > 0.2 ? 'url(#screen-desk-smear)' : undefined}}>
        <ZoomContext.Provider value={z}>{children}</ZoomContext.Provider>
      </div>
      {/* a light vignette: the edge of the frame, never a spotlight */}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(140% 120% at 50% 42%, transparent 62%, rgba(40,38,34,0.10) 100%)'}} />
    </div>
  );
}
