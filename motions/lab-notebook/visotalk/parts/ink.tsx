import {PEN, drawn, type Pen} from './pens.ts';

export const meta = {
  name: {en: 'Ink line', 'zh-CN': '墨线'},
  purpose: 'steps',
  line: 'Any line, shape or diagram as SVG path data, drawn with the pen as the narration describes it.',
  fits: 'a vessel, a molecule, a circuit, a graph\'s curve: whatever the explanation draws',
  params: {
    d: {type: 'SVG path data', doc: 'what to draw, in px inside the box; several shapes in one path draw one after another'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: how much is drawn; tween it on the word'},
    width: {type: 'px', doc: 'the box\'s width'},
    height: {type: 'px', doc: 'the box\'s height'},
    pen: {type: 'ink | red | pencil', default: 'ink', doc: 'which pen: ink draws, red marks the result, pencil is working'},
    weight: {type: 'px', default: 5, doc: 'the stroke'},
    fill: {type: 'colour', default: 'none', doc: 'a fill that appears once the outline is drawn (a wash): a token, as var(--vt-…)'},
  },
  preview: 3.8,
};

export function Ink({d, draw = 1, width, height, pen = 'ink', weight = 5, fill = 'none'}: {d: string; draw?: number; width: number; height: number; pen?: Pen; weight?: number; fill?: string}) {
  const color = PEN[pen];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {fill !== 'none' && <path d={d} fill={fill} fillOpacity={Math.max(0, draw - 0.85) / 0.15 * 0.35} stroke="none" />}
      <path d={d} fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" {...drawn(draw)} />
      {/* the nib's feathered edge, a hair off the line */}
      {pen !== 'pencil' && <path d={d} fill="none" stroke={color} strokeWidth={Math.max(1, weight * 0.35)} strokeOpacity={0.35} strokeLinecap="round" transform="translate(1.4 1)" {...drawn(draw)} />}
    </svg>
  );
}
