import {C, CANVAS, clamp, mix, project, smooth, tone, type Pt, type View} from './earth.ts';

export const meta = {
  name: {en: 'Drawn core', 'zh-CN': '钻芯'},
  purpose: 'term',
  line: "A cylinder drawn straight up out of the block and set down beside it: the same layers, in the hand, to look at.",
  fits: "a soil core, an ice core, a biopsy, a section through anything you could sample",
  params: {
    view: {type: 'View', doc: "the scene's camera"},
    from: {type: '[x, y]', doc: 'where on the top it is drilled'},
    to: {type: '[x, y]', doc: 'the px of its top once it is set down beside the block'},
    bands: {type: '{h, color}[]', doc: "its layers from the top, as the block's"},
    r: {type: 'number', default: 44, doc: 'its radius in px'},
    t: {type: 'progress', default: 0, doc: 'it comes up, and moves across before it has quite stopped rising'},
    gone: {type: 'progress', default: 0, doc: 'it fades away, hole and all'},
  },
  preview: 35.5,
};

export function Core({view, from, to, bands, r = 44, t = 0, gone = 0}: {view: View; from: Pt; to: Pt; bands: Array<{h: number; color: string}>; r?: number; t?: number; gone?: number}) {
  if (t <= 0 || gone >= 1) return null;
  const ground = project(view)(from[0], from[1], 0), total = bands.reduce((a, b) => a + b.h, 0) * view.k;
  const out = smooth(t / 0.6) * total, go = smooth((t - 0.4) / 0.6);
  const x = mix(ground[0], to[0], go), top = mix(ground[1] - out, to[1], go), ry = r * 0.36;
  const length = out;
  let y = top;
  const parts = bands.map((b, i) => {
    const h = Math.min(b.h * view.k, Math.max(0, top + length - y));
    const d = `M${x - r} ${y}V${y + h}A${r} ${ry} 0 0 0 ${x + r} ${y + h}V${y}A${r} ${ry} 0 0 1 ${x - r} ${y}Z`;
    y += h;
    return h > 0 && <g key={i}><path d={d} fill={tone(b.color, 0.92)} /><path d={`M${x + r * 0.35} ${y - h + ry * 0.9}V${y + ry * 0.9}`} stroke={tone(b.color, 0.72)} strokeWidth={r * 0.7} opacity={0.45} /></g>;
  });
  return (
    <svg {...CANVAS} opacity={1 - gone}>
      <ellipse cx={ground[0]} cy={ground[1]} rx={r} ry={ry} fill={C.ink} opacity={clamp(t * 6) * 0.82} />
      {[...parts].reverse()}
      <ellipse cx={x} cy={top} rx={r} ry={ry} fill={tone(bands[0].color, 1.22)} />
    </svg>
  );
}
