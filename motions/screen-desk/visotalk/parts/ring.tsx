import {useZoom} from './desk.tsx';

export const meta = {
  name: {en: 'Ring', 'zh-CN': '圈'},
  purpose: 'mark',
  line: 'A blue ring drawn round the named control by a glowing head, one pulse when closed, the same weight at any zoom.',
  fits: 'a button, a menu item, a field, a toggle, a line of output; one ring at a time',
  params: {
    x: {type: 'px', doc: 'the control\'s left edge, in desk pixels'},
    y: {type: 'px', doc: 'the control\'s top edge, in desk pixels'},
    w: {type: 'px', doc: 'the control\'s width'},
    h: {type: 'px', doc: 'the control\'s height'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: the ring is drawn clockwise from its top left by 0.7, then pulses once; tween it back to 0 to take it away'},
  },
  preview: 25.8,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));
const DRAWN = 0.7;   // the share of `draw` that draws the stroke; the rest is the pulse

/** The point `l` along a rounded rect's outline, clockwise from the start of its top edge */
function along(l: number, x0: number, y0: number, W: number, H: number, r: number): [number, number] {
  const segs: Array<[number, (u: number) => [number, number]]> = [
    [W - 2 * r, (u) => [x0 + r + u, y0]],
    [Math.PI * r / 2, (u) => { const a = -Math.PI / 2 + u / r; return [x0 + W - r + r * Math.cos(a), y0 + r + r * Math.sin(a)]; }],
    [H - 2 * r, (u) => [x0 + W, y0 + r + u]],
    [Math.PI * r / 2, (u) => { const a = u / r; return [x0 + W - r + r * Math.cos(a), y0 + H - r + r * Math.sin(a)]; }],
    [W - 2 * r, (u) => [x0 + W - r - u, y0 + H]],
    [Math.PI * r / 2, (u) => { const a = Math.PI / 2 + u / r; return [x0 + r + r * Math.cos(a), y0 + H - r + r * Math.sin(a)]; }],
    [H - 2 * r, (u) => [x0, y0 + H - r - u]],
    [Math.PI * r / 2, (u) => { const a = Math.PI + u / r; return [x0 + r + r * Math.cos(a), y0 + r + r * Math.sin(a)]; }],
  ];
  for (const [len, at] of segs) { if (l <= len) return at(l); l -= len; }
  return [x0 + r, y0];
}

export function Ring({x, y, w, h, draw = 1}: {x: number; y: number; w: number; h: number; draw?: number}) {
  const z = useZoom();
  const d = unit(draw);
  if (d <= 0.001) return null;
  const stroke = unit(d / DRAWN);
  const pulse = unit((d - DRAWN) / (1 - DRAWN));
  const pad = 9 / z;                 // the gap between the control and the ring, the same on screen at any zoom
  const sw = 4.5 / z;
  const W = w + pad * 2, H = h + pad * 2;
  const r = Math.min(H / 2, 14 / z + Math.min(w, h) * 0.12);
  const len = 2 * (W + H - 4 * r) + 2 * Math.PI * r;
  const m = 30 / z;                  // room in the svg for the halo, the head's glow and the pulse
  const path = `M ${m + r} ${m} H ${m + W - r} A ${r} ${r} 0 0 1 ${m + W} ${m + r} V ${m + H - r} A ${r} ${r} 0 0 1 ${m + W - r} ${m + H} H ${m + r} A ${r} ${r} 0 0 1 ${m} ${m + H - r} V ${m + r} A ${r} ${r} 0 0 1 ${m + r} ${m}`;
  const e = 1 - (1 - stroke) ** 3;  // the head starts fast and settles as it closes
  const [hx, hy] = along(len * e, m, m, W, H, r);
  const halo = unit(stroke * 1.6 - 0.6);
  const grow = (pulse * 20) / z;     // the pulse spreads 20 screen pixels outward
  return (
    <svg width={W + m * 2} height={H + m * 2} style={{position: 'absolute', left: x - pad - m, top: y - pad - m, overflow: 'visible', pointerEvents: 'none'}}>
      <path d={path} fill="var(--vt-data)" fillOpacity={0.07 * halo} stroke="var(--vt-grad)" strokeWidth={sw * 3.2} strokeOpacity={0.85 * halo} strokeLinejoin="round" />
      {pulse > 0.001 && pulse < 0.999 && (
        <rect x={m - grow} y={m - grow} width={W + grow * 2} height={H + grow * 2} rx={r + grow} fill="none" stroke="var(--vt-data)" strokeWidth={sw * (1 - pulse * 0.6)} strokeOpacity={0.55 * (1 - pulse)} />
      )}
      <path d={path} fill="none" stroke="var(--vt-data)" strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${len} ${len}`} strokeDashoffset={len * (1 - e)} />
      {stroke < 0.999 && (
        <g>
          <circle cx={hx} cy={hy} r={13 / z} fill="var(--vt-data)" opacity={0.18} />
          <circle cx={hx} cy={hy} r={7 / z} fill="var(--vt-data)" opacity={0.35} />
          <circle cx={hx} cy={hy} r={4 / z} fill="#FFFFFF" stroke="var(--vt-data)" strokeWidth={2.5 / z} />
        </g>
      )}
    </svg>
  );
}
