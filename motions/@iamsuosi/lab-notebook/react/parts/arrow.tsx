import {PEN, drawn, unit, type Pen} from './pens.ts';

export const meta = {
  name: {en: 'Curved arrow', 'zh-CN': '弯箭头'},
  purpose: 'link',
  line: 'A hand-drawn arrow that bends from one place on the page to another, its head added when the line arrives.',
  fits: 'this leads to that; a cause and its effect; from a drawing to the formula it explains',
  params: {
    from: {type: '[x, y]', doc: 'where it starts, in px inside the box'},
    to: {type: '[x, y]', doc: 'where it points'},
    bend: {type: 'number', default: 0.25, doc: 'how far it bows, as a share of its length; negative bows the other way'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: how much is drawn'},
    pen: {type: 'ink | red | pencil', default: 'ink', doc: 'which pen'},
  },
  preview: 19.4,
};

export function CurveArrow({from, to, bend = 0.25, draw = 1, pen = 'ink'}: {from: [number, number]; to: [number, number]; bend?: number; draw?: number; pen?: Pen}) {
  const [ax, ay] = from, [bx, by] = to, dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  const cx = (ax + bx) / 2 - (dy / len) * bend * len, cy = (ay + by) / 2 + (dx / len) * bend * len;
  // the head follows the curve's direction where it arrives
  const tx = bx - cx, ty = by - cy, tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl, s = 26;
  const head = `M${(bx - ux * s - uy * s * 0.55).toFixed(1)} ${(by - uy * s + ux * s * 0.55).toFixed(1)} L${bx} ${by} L${(bx - ux * s + uy * s * 0.55).toFixed(1)} ${(by - uy * s - ux * s * 0.55).toFixed(1)}`;
  const body = unit(draw / 0.85), tip = unit((draw - 0.85) / 0.15);
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      <path d={`M${ax} ${ay} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${bx} ${by}`} fill="none" stroke={PEN[pen]} strokeWidth={5} strokeLinecap="round" {...drawn(body)} />
      {tip > 0 && <path d={head} fill="none" stroke={PEN[pen]} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" {...drawn(tip)} />}
    </svg>
  );
}
