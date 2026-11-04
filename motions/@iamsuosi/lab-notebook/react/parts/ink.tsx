import {PEN, drawn, unit, type Pen} from './pens.ts';

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
    weight: {type: 'px', default: 5, doc: 'the stroke; 3 for pencil'},
    fill: {type: 'colour', default: 'none', doc: 'a fill that appears once the outline is drawn (a wash): a token, as var(--color-…)'},
    wash: {type: 'number', default: 0.35, doc: 'how strong the fill is, 0 to 1; 1 for a solid dot'},
  },
  preview: 3.8,
};

export function Ink({d, draw = 1, width, height, pen = 'ink', weight = pen === 'pencil' ? 3 : 5, fill = 'none', wash = 0.35}: {d: string; draw?: number; width: number; height: number; pen?: Pen; weight?: number; fill?: string; wash?: number}) {
  const color = PEN[pen];
  // each shape starts when the last has finished, each in the same share of the time; a path using a relative `m` is drawn as one
  const shapes = /m/.test(d) ? [d] : d.match(/M[^M]*/g) ?? [d];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {fill !== 'none' && <path d={d} fill={fill} fillOpacity={(Math.max(0, draw - 0.85) / 0.15) * wash} stroke="none" />}
      {shapes.map((shape, i) => {
        const p = unit(draw * shapes.length - i);
        return (
          <g key={i}>
            <path d={shape} fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" {...drawn(p)} />
            {/* the nib's feathered edge, a hair off the line */}
            {pen !== 'pencil' && <path d={shape} fill="none" stroke={color} strokeWidth={Math.max(1, weight * 0.35)} strokeOpacity={0.35} strokeLinecap="round" transform="translate(1.4 1)" {...drawn(p)} />}
          </g>
        );
      })}
    </svg>
  );
}
