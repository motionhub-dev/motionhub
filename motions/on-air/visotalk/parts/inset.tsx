import {Video} from '@visotalk/runtime';
import {stage} from './ink.ts';

export const meta = {
  name: {en: 'Inset', 'zh-CN': '画面收框'},
  purpose: 'transition',
  line: 'The recording draws itself into a framed window on one side, still playing; the rest becomes ink for tags.',
  fits: 'a stretch of points or a comparison beside the speaker; a recap; a shot too busy for tags',
  params: {
    asset: {type: 'text', doc: 'the recording\'s asset id'},
    side: {type: 'text', default: 'right', doc: '"left" or "right": where the window goes'},
    size: {type: 'number', default: 0.44, doc: 'the window\'s width, as a share of the frame\'s'},
    focus: {type: 'number', default: 0.5, doc: '0 to 1: which part of the picture across the window keeps (0 its left edge)'},
    move: {type: 'progress', default: 0, doc: '0 to 1: from the full picture into the window'},
  },
  preview: 36.5,
};

/** The part covers the whole frame: <Part x={0} y={0} w={W} h={H}>. Declare the window with keepClear while it is out (at 1920×1080 and size 0.44: x 985, y 90, w 845, h 742), so no tag lands on it. */
export function Inset({asset, side = 'right', size = 0.44, focus = 0.5, move = 0}: {asset: string; side?: string; size?: number; focus?: number; move?: number}) {
  // the window keeps 4.7 % from the side, 8.3 % from the top and ends at 77 % of the height, above three lines of captions
  const m = stage(move, 0, 1), mx = 4.7, my = 8.3;
  const lerp = (a: number, b: number) => a + (b - a) * m;
  const w = lerp(100, size * 100), h = lerp(100, 77 - my), left = lerp(0, side === 'left' ? mx : 100 - mx - size * 100), top = lerp(0, my);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', inset: 0, background: 'var(--vt-bg)', opacity: m}} />
      <div style={{position: 'absolute', left: `${left}%`, top: `${top}%`, width: `${w}%`, height: `${h}%`, overflow: 'hidden', borderRadius: 14 * m,
        boxShadow: m > 0 ? `0 0 0 ${2 * m}px var(--vt-border), 0 30px 60px -30px rgba(0, 0, 0, 0.9)` : 'none'}}>
        <Video asset={asset} fit="cover" style={{objectPosition: `${(100 * focus).toFixed(1)}% 50%`}} />
      </div>
    </div>
  );
}
