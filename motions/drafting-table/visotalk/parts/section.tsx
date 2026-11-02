import {ACCENT, LINE, bounds, hatchLines, phase, unit, useSvgId} from './draft.ts';

export const meta = {
  name: {en: 'Section hatch', 'zh-CN': '剖面线'},
  purpose: 'mark',
  line: 'A solid cut through: a warm edge sweeps across it and leaves 45° hatching.',
  fits: 'a housing\'s wall, a beam, the ground under a foundation',
  params: {
    d: {type: 'SVG path data', doc: 'the cut material, holes as inner paths (even-odd)'},
    cut: {type: 'progress', default: 1, doc: '0 to 1: how far the cutting edge has swept across the material, left to right'},
    angle: {type: 'degrees', default: 45, doc: '45 or 135: neighbouring parts are hatched the opposite way'},
    spacing: {type: 'px', default: 14, doc: 'between hatch lines'},
    width: {type: 'px', doc: 'the box\'s width'},
    height: {type: 'px', doc: 'the box\'s height'},
  },
  preview: 11.5,
};

export function Section({d, cut = 1, angle = 45, spacing = 14, width, height}: {d: string; cut?: number; angle?: number; spacing?: number; width: number; height: number}) {
  const id = useSvgId();
  const c = unit(cut);
  if (c <= 0) return null;
  // hatch lines across the material's box, then clipped to the material and to the sweep
  const box = bounds(d);
  const lines = hatchLines(box, angle, spacing);
  const edge = box[0] + (box[2] - box[0]) * c;
  const glow = phase(c, 0, 0.04) * (1 - phase(c, 0.96, 1));
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <clipPath id={`${id}m`}><path d={d} clipRule="evenodd" /></clipPath>
        <clipPath id={`${id}s`}><rect x={box[0] - 10} y={box[1] - 10} width={edge - box[0] + 10} height={box[3] - box[1] + 20} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}s)`}>
        <g clipPath={`url(#${id}m)`}>
          <path d={lines} stroke={LINE.thin.color} strokeWidth={LINE.thin.width} fill="none" />
        </g>
      </g>
      {glow > 0 && <g clipPath={`url(#${id}m)`}><rect x={edge - 2} y={box[1]} width={4} height={box[3] - box[1]} fill={ACCENT} opacity={glow} /></g>}
    </svg>
  );
}
