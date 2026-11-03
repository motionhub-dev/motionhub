import type {ReactNode} from 'react';

export const meta = {
  name: {en: 'Scale dive', 'zh-CN': '尺度推拉'},
  purpose: 'transition',
  line: "One camera over a scene: an unbroken push in or pull back, so the change of scale is itself the explanation.",
  fits: "from a thing to what it is part of, or into what it is made of",
  params: {
    at: {type: '[x, y]', doc: 'the point it moves on, which stays still on the frame'},
    s: {type: 'number', default: 1, doc: 'the scale: tween it geometrically by easing, 1 is the picture as drawn'},
    floor: {type: 'number', default: 1080, doc: 'y the view stops at, so what it sees stays above the caption band while pushed in'},
    soft: {type: 'number', default: 0, doc: 'px over which the view dissolves into the field at its floor; 0 ends it on a line, as on land'},
    children: {type: 'ReactNode', doc: 'what the camera sees'},
  },
  preview: 33.4,
};

export function Dive({at, s = 1, floor = 1080, soft = 0, children}: {at: [number, number]; s?: number; floor?: number; soft?: number; children: ReactNode}) {
  const mask = soft > 0 ? `linear-gradient(#000 ${floor - soft}px, transparent ${floor}px)` : undefined;
  return (
    <div data-camera="" style={{position: 'absolute', left: 0, top: 0, width: 1920, height: floor, overflow: 'hidden', maskImage: mask, WebkitMaskImage: mask}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: `${at[0]}px ${at[1]}px`, transform: `scale(${s})`}}>{children}</div>
    </div>
  );
}
