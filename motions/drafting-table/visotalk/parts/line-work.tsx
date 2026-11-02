import {Stroke, phase, type Weight} from './draft.ts';

export const meta = {
  name: {en: 'Line work', 'zh-CN': '线稿'},
  purpose: 'steps',
  line: 'A drawing laid down in drafting order, a nib at the head of each line: centre lines, outlines, detail.',
  fits: 'a mechanism, a beam and its supports, a plan: whatever the explanation draws',
  params: {
    layers: {type: 'list of {d, weight, solid?, accent?}', doc: 'SVG path data in drafting order; weight is outline, detail, thin, centre or hidden; solid fills the shape with the sheet so it hides what is behind'},
    draw: {type: 'progress', default: 1, doc: '0 to 1 across all the layers in order; tween it to the share each word draws'},
    width: {type: 'px', doc: 'the box\'s width'},
    height: {type: 'px', doc: 'the box\'s height'},
  },
  preview: 11.5,
};

export type Layer = {d: string; weight?: Weight; solid?: boolean; accent?: boolean};

export function LineWork({layers, draw = 1, width, height}: {layers: Layer[]; draw?: number; width: number; height: number}) {
  const n = layers.length;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {layers.map((l, k) => (
        // each layer starts a little before the last one ends, as a hand reaches for the next line
        <Stroke key={k} d={l.d} weight={l.weight ?? 'outline'} solid={l.solid} accent={l.accent} draw={phase(draw, k / n - (k ? 0.15 / n : 0), (k + 1) / n)} />
      ))}
    </svg>
  );
}
