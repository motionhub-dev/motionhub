import type React from 'react';
import {Video} from '@visotalk/runtime';
import {MarkerStroke} from './loop.tsx';
import {KEY, curve, stage, wobble, type Pt} from './marker.ts';

export const meta = {
  name: {en: 'Screen', 'zh-CN': '录屏插入'},
  purpose: 'transition',
  line: 'A screen recording swung in over the dimmed footage at a slight angle, still playing, its corners caught in marker.',
  fits: 'the app or page they talk about; what the camera cannot show',
  params: {
    asset: {type: 'text', doc: 'the screen recording\'s video asset id'},
    start: {type: 'number', default: 0, doc: 'the scene second at which the clip\'s first frame would show; set it so the clip\'s clicks land on their words'},
    show: {type: 'progress', default: 0, doc: '0 to 1: it swings in and the corners are drawn; back to 0 to put it away'},
    turn: {type: 'number', default: -7, doc: 'degrees it is turned toward the speaker; 0 square to the camera'},
  },
  preview: 46.9,
};

/** The window's box in a 1920 × 1080 frame */
const SCREEN = {x: 300, y: 56, w: 1320, h: 743} as const;

const corner = (x: number, y: number, sx: number, sy: number, arm: number): Pt[] => [...curve([x + sx * arm, y], [x, y], 0.03, 8), ...curve([x, y], [x, y + sy * arm], 0.03, 8).slice(1)];

/**
 * The part covers the frame: <Part x={0} y={0} w={1920} h={1080}>. Marks on the recording (a Box, a Click) are its children, placed in the recording's own
 * pixels (1920 × 1080), so they turn with it and stay on what they mark; drive them from the same part's props.
 */
export function Screen({asset, start = 0, show = 0, turn = -7, children}: {asset: string; start?: number; show?: number; turn?: number; children?: React.ReactNode}) {
  const swing = stage(show, 0, 0.7), frame = stage(show, 0.45, 1);
  if (show <= 0) return null;
  const {x, y, w, h} = SCREEN, pad = 18, arm = 120;
  const corners = [corner(x - pad, y - pad, 1, 1, arm), corner(x + w + pad, y - pad, -1, 1, arm), corner(x + w + pad, y + h + pad, -1, -1, arm), corner(x - pad, y + h + pad, 1, -1, arm)]
    .map((c, i) => wobble(c, `screen:${i}`, 2));
  return (
    <div style={{position: 'absolute', inset: 0, perspective: 2200}}>
      <div style={{position: 'absolute', inset: 0, background: KEY, opacity: swing * 0.9}} />
      <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transformOrigin: '50% 60%',
        transform: `translateY(${((1 - swing) * 50).toFixed(1)}px) rotateY(${(turn * (0.4 + 0.6 * swing)).toFixed(2)}deg) rotateX(${((1 - swing) * 14).toFixed(2)}deg)`, opacity: Math.min(1, swing * 2.5)}}>
        <div style={{position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden', borderRadius: 10, background: '#000',
          boxShadow: '0 50px 90px -40px rgba(0, 0, 0, 0.95), 0 0 0 2px rgba(255, 255, 255, 0.14)'}}>
          <Video asset={asset} start={start} fit="cover" />
        </div>
        <div style={{position: 'absolute', left: x, top: y, width: 1920, height: 1080, transform: `scale(${(w / 1920).toFixed(4)})`, transformOrigin: '0 0'}}>{children}</div>
        <MarkerStroke strokes={corners} draw={frame} weight={8} seed="screen" />
      </div>
    </div>
  );
}
