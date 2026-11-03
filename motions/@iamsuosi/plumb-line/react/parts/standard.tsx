import {CANVAS, CUT_SHADOW, glide, yOf, type Cam} from './plumb.ts';

export const meta = {
  name: {en: 'Thing for scale', 'zh-CN': '比例参照'},
  purpose: 'compare',
  line: "Something everybody knows the size of, cut from pale paper and raised to its true height on the same axis as everything else.",
  fits: "a mountain in a trench, a skyscraper in the twilight zone, a person against a dinosaur",
  params: {
    cam: {type: '{at, scale}', doc: "the scene's camera"},
    x: {type: 'number', doc: 'its middle, in px'},
    base: {type: 'number', doc: 'the depth it stands on'},
    height: {type: 'number', doc: 'its true height, in the axis units'},
    width: {type: 'number', default: 260, doc: 'its width in px; only the height is to scale'},
    color: {type: 'string', default: "'#C9D6E4'", doc: 'its paper'},
    t: {type: 'progress', default: 1, doc: 'it rises to its height'},
  },
  preview: 34,
};

export function Standard({cam, x, base, height, width = 260, color = '#C9D6E4', t = 1}: {cam: Cam; x: number; base: number; height: number; width?: number; color?: string; t?: number}) {
  if (t <= 0) return null;
  const foot = yOf(cam, base), top = yOf(cam, base - height * glide(t)), w = width / 2;
  return (
    <svg {...CANVAS}>
      <path style={{filter: CUT_SHADOW}} d={`M${x - w} ${foot}L${x - w * 0.42} ${foot + (top - foot) * 0.46}L${x - w * 0.22} ${foot + (top - foot) * 0.6}L${x} ${top}L${x + w * 0.3} ${foot + (top - foot) * 0.62}L${x + w * 0.5} ${foot + (top - foot) * 0.4}L${x + w} ${foot}Z`} fill={color} />
    </svg>
  );
}
