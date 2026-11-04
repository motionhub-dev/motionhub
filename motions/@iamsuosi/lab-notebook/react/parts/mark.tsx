import type {ReactNode} from 'react';
import {PEN, drawn, unit, type Pen} from './pens.ts';

export const meta = {
  name: {en: 'Pen mark', 'zh-CN': '笔迹标记'},
  purpose: 'mark',
  line: 'A ring, an underline, a strike-through, a tick or a cross made with the pen over something already on the page.',
  fits: 'pointing at one word or number; striking what turned out wrong; ticking what holds',
  params: {
    kind: {type: 'ring | underline | strike | tick | cross', default: 'ring', doc: 'what the hand makes'},
    children: {type: 'node', doc: 'what to mark, wrapped: the mark takes its size, so nothing has to be measured. Prefer this'},
    width: {type: 'px', doc: 'without children: the width of what is marked'},
    height: {type: 'px', doc: 'without children: the height of what is marked'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: how much is drawn'},
    pen: {type: 'ink | red | pencil', default: 'red', doc: 'which pen; red only for the scene\'s one result'},
  },
  preview: 'mark.jpg',
};

export type MarkKind = 'ring' | 'underline' | 'strike' | 'tick' | 'cross';

const SHAPES = (w: number, h: number): Record<MarkKind, string> => ({
  ring: `M${w * 0.5} ${-h * 0.15} C ${w * 0.15} ${-h * 0.24}, ${-w * 0.09} ${h * 0.12}, ${-w * 0.05} ${h * 0.55} C ${-w * 0.01} ${h * 1.14}, ${w * 0.78} ${h * 1.22}, ${w * 1.05} ${h * 0.68} C ${w * 1.15} ${h * 0.28}, ${w * 0.82} ${-h * 0.14}, ${w * 0.54} ${-h * 0.13}`,
  underline: `M0 ${h + 6} C ${w * 0.3} ${h + 1}, ${w * 0.6} ${h + 12}, ${w} ${h + 3}`,
  strike: `M${-w * 0.03} ${h * 0.58} C ${w * 0.3} ${h * 0.44}, ${w * 0.65} ${h * 0.6}, ${w * 1.03} ${h * 0.42}`,
  tick: `M0 ${h * 0.55} L${w * 0.36} ${h} L${w} 0`,
  cross: `M0 0 L${w} ${h} M${w} 0 L0 ${h}`,
});

export function Mark({kind = 'ring', width, height, draw = 1, pen = 'red', children}: {kind?: MarkKind; width?: number; height?: number; draw?: number; pen?: Pen; children?: ReactNode}) {
  if (children) {
    // around its children it takes their size, whatever they turn out to be, and is revealed left to right: a dash cannot follow a stretched line
    return (
      <span style={{position: 'relative', display: 'inline-block'}}>
        {children}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', clipPath: `inset(-60% ${((1 - unit(draw)) * 110 - 5).toFixed(1)}% -60% -10%)`}}>
          <path d={SHAPES(100, 100)[kind]} fill="none" stroke={PEN[pen]} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </span>
    );
  }
  return (
    <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <path d={SHAPES(width ?? 0, height ?? 0)[kind]} fill="none" stroke={PEN[pen]} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" {...drawn(draw)} />
    </svg>
  );
}
