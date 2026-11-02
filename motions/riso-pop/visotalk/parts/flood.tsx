import {CANVAS, H, Plate, Screens, W, dotsPath, offset, unit, type Ink} from './riso.ts';

export const meta = {
  name: {en: 'Ink flood', 'zh-CN': '满版覆墨'},
  purpose: 'transition',
  line: "One ink floods the sheet from a shape, a fringe of dots ahead of its edge, until everything beneath is overprinted; next scene it ebbs into that scene's first shape.",
  fits: 'a reaction spreading; a close-up opening into a whole; one shape becoming the next',
  params: {
    from: {type: '[x, y, r]', doc: 'the circle it starts as'},
    to: {type: '[x, y, r]', doc: 'the circle it ends as: a radius past 2,300 covers the frame'},
    t: {type: 'progress', default: 1, doc: '0 to 1: from one circle to the other (ease it in when it floods, out when it ebbs)'},
    ink: {type: "'blue' | 'pink'", default: "'pink'", doc: 'the plate'},
  },
  preview: 19.4,
};

type C3 = [number, number, number];

// the disc, cut to the frame: a polygon whose points are held inside the canvas (in the plate's own place, which sits off register), so nothing is drawn where no one sees it
const disc = (cx: number, cy: number, r: number, [ox, oy]: [number, number]) => {
  let d = '';
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2, x = Math.min(W - ox, Math.max(-ox, cx + Math.cos(a) * r)), y = Math.min(H - oy, Math.max(-oy, cy + Math.sin(a) * r));
    d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + 'Z';
};

export function Flood({from, to, t = 1, ink = 'pink'}: {from: C3; to: C3; t?: number; ink?: Ink}) {
  const k = unit(t), cx = from[0] + (to[0] - from[0]) * k, cy = from[1] + (to[1] - from[1]) * k, r = from[2] + (to[2] - from[2]) * k;
  if (r <= 1) return null;
  // the fringe: dots that thin out over a band ahead of the edge, wider while the ink is moving fast
  const band = Math.min(260, 40 + r * 0.25);
  const fringe = dotsPath(ink, (px, py) => {
    const d = Math.hypot(px - cx, py - cy) - r;
    return d < 0 || d > band ? 0 : 0.7 * (1 - d / band);
  }, [Math.max(10, cx - r - band), Math.max(10, cy - r - band), Math.min(W - 10, cx + r + band), Math.min(H - 10, cy + r + band)]);
  return (
    <svg {...CANVAS}>
      <Screens />
      <Plate ink={ink}>
        <path d={disc(cx, cy, r, offset(ink))} />
        <path d={fringe} />
      </Plate>
    </svg>
  );
}
