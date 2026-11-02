import React from 'react';
import {Wash} from './wash.tsx';

export const meta = {
  name: {en: 'Glaze', 'zh-CN': '罩染'},
  purpose: 'compare',
  line: 'A second transparent colour swept over a dried wash so the two mix on the paper, or lifted off to show the colour beneath.',
  fits: 'a thing that changes: green to gold, day to dusk; what was hidden underneath',
  params: {
    d: {type: 'SVG path data', doc: 'the shape glazed, usually the same as the wash beneath it'},
    width: {type: 'px', doc: 'the box\'s width'},
    height: {type: 'px', doc: 'the box\'s height'},
    pigment: {type: 'token or #hex', default: 'data', doc: 'the glaze\'s colour'},
    strength: {type: '0 to 1', default: 0.6, doc: 'how much of it: a glaze is thinner than the wash under it'},
    glaze: {type: 'progress', default: 1, doc: '0 to 1: the brush sweeps across from `side`, and the glaze dries as it goes'},
    side: {type: 'left | top | [x, y]', default: 'left', doc: 'where the sweep starts: a side, or a point (fractions of the box) it spreads from'},
    reach: {type: '0 to 1', default: 1, doc: 'how far across the shape the sweep goes: 0.6 glazes the top or left part and leaves a dried edge where it stopped'},
    wet: {type: 'boolean', default: false, doc: 'dropped into a wash still wet: the colours bleed into each other with no dried edge between them'},
    lift: {type: 'progress', default: 0, doc: '0 to 1: the glaze lifted off again from `liftFrom`, uncovering the colour beneath'},
    liftFrom: {type: '[x, y]', default: [0.5, 0.2], doc: 'where the lifting starts, as fractions of the box'},
  },
  preview: 30.7,
};

export function Glaze({d, width, height, pigment = 'data', strength = 0.6, glaze = 1, side = 'left', reach = 1, wet = false, lift = 0, liftFrom = [0.5, 0.2]}: {
  d: string; width: number; height: number; pigment?: string; strength?: number; glaze?: number; side?: 'left' | 'top' | [number, number]; reach?: number; wet?: boolean; lift?: number; liftFrom?: [number, number];
}) {
  // the glaze is wet where the brush is and dries behind it
  return <Wash d={d} width={width} height={height} pigment={pigment} strength={strength} paint={glaze * reach} dry={wet ? 0 : Math.min(1, glaze * 1.25)} from={side} granulate={0.7} wobble={12} lift={lift} liftFrom={liftFrom} />;
}
