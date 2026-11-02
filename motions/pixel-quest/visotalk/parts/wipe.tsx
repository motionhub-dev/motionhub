import type {ReactNode} from 'react';
import {C, Screen, W, clamp, steps} from './pixel.ts';

export const meta = {
  name: {en: 'Diamond wipe', 'zh-CN': '菱形转场'},
  purpose: 'transition',
  line: 'Ink diamonds sweep across the world tile by tile, close it, and open on the next stage.',
  fits: 'the cut between two steps; change the world while it is closed',
  params: {
    p: {type: 'progress', default: 0, doc: '0 to 1, linear over about 1.2 s: closed at 0.5 (change the world then), open again at 1'},
    from: {type: 'text', default: 'left', doc: 'where the wave starts: left or centre'},
  },
  preview: 17.25,
};

const TOP = 32, BOTTOM = 222, T = 16;

/** one diamond of radius r (|dx| + |dy| <= r) round a tile's centre, in rows two pixels high, kept between the bar and the earth */
function diamond(cx: number, cy: number, r: number, key: string): ReactNode[] {
  if (r <= 0) return [];
  if (r >= T) return [<rect key={key} x={cx - T / 2} y={cy - T / 2} width={T} height={T} fill={C.ink} />];
  const out: ReactNode[] = [];
  for (let dy = -r; dy < r; dy += 2) {
    const half = r - Math.abs(dy + 1);
    const y0 = Math.max(TOP, cy + dy), y1 = Math.min(BOTTOM, cy + dy + 2);
    const x0 = Math.max(0, cx - half), x1 = Math.min(W, cx + half);
    if (x1 > x0 && y1 > y0) out.push(<rect key={`${key}-${dy}`} x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={C.ink} />);
  }
  return out;
}

export function Wipe({p = 0, from = 'left'}: {p?: number; from?: string}) {
  if (p <= 0 || p >= 1) return null;
  const q = steps(p, 14);
  const cells: ReactNode[] = [];
  const rows = Math.ceil((BOTTOM - TOP) / T), cols = W / T;
  for (let gy = 0; gy < rows; gy++) for (let gx = 0; gx < cols; gx++) {
    const cx = gx * T + T / 2, cy = TOP + gy * T + T / 2;
    // how late this tile is in the wave: a diagonal from the left, or rings from the middle
    const d = from === 'left' ? (gx / cols) * 0.75 + (gy / rows) * 0.25 : Math.min(1, Math.hypot(gx - cols / 2, (gy - rows / 2) * 1.6) / (cols / 2));
    const s = q <= 0.5 ? clamp(q * 2 * 1.7 - d * 0.7) : 1 - clamp((q - 0.5) * 2 * 1.7 - d * 0.7);
    cells.push(...diamond(cx, cy, Math.round(s * T), `${gx}-${gy}`));
  }
  return <Screen>{cells}</Screen>;
}
