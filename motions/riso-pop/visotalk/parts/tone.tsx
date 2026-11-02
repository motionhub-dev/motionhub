import {useDocTime} from '@visotalk/runtime';
import {CANVAS, Plate, Print, Screens, dotsPath, unit, type Ink, type Pt} from './riso.ts';

export const meta = {
  name: {en: 'Halftone plume', 'zh-CN': '网点烟羽'},
  purpose: 'data',
  line: 'Something that spreads, in halftone dots only: a plume runs out along a curve, its dots swelling thick at the heart and thinning to paper, its lumps drifting.',
  fits: 'a gas or heat rising; a population spreading; a rumour fanning out',
  params: {
    from: {type: '[x, y]', doc: 'where it starts'},
    to: {type: '[x, y]', doc: 'where it heads'},
    bend: {type: 'px', default: 120, doc: 'how far the path bows to the right of the straight line (negative: to the left)'},
    width: {type: '[start, end]', default: '[60, 260]', doc: 'its half-width where it starts and where it ends'},
    ink: {type: "'blue' | 'pink'", default: "'pink'", doc: 'the plate it is printed on'},
    density: {type: '0 to 1', default: 0.75, doc: 'the tone at its heart once grown: 0.75 nearly solid, 0.3 a light haze'},
    grow: {type: 'progress', default: 1, doc: '0 to 1: it runs out from the source to its end and its dots swell to full size'},
    rise: {type: 'px a second', default: 36, doc: 'how fast its lumps roll along it while it is on screen, so the cloud is never still (0: a still cloud)'},
    view: {type: '[scale, x, y]', default: '[1, 0, 0]', doc: 'a camera over it: scaled about the frame\'s middle, then moved; at a large scale each dot is a disc (dots past the frame are not drawn)'},
    label: {type: 'text', default: '', doc: 'a word printed beside its end, in the same ink'},
    slip: {type: 'progress', default: 0, doc: 'tweened 0 to 1 linearly over about 1.4 s: the plates knock apart and snap back'},
  },
  preview: 23.8,
};

type Props = {from: Pt; to: Pt; bend?: number; width?: [number, number]; ink?: Ink; density?: number; grow?: number; label?: string; rise?: number; view?: [number, number, number]; slip?: number};

export function Tone({from, to, bend = 120, width = [60, 260], ink = 'pink', density = 0.75, grow = 1, rise = 36, label = '', view = [1, 0, 0], slip = 0}: Props) {
  const now = useDocTime();
  if (grow <= 0) return null;
  const [x0, y0] = from, [x1, y1] = to, len = Math.hypot(x1 - x0, y1 - y0), nx = (y1 - y0) / len, ny = -(x1 - x0) / len;
  const cx = (x0 + x1) / 2 - nx * bend, cy = (y0 + y1) / 2 - ny * bend;
  // the path sways a little side to side as smoke does, and its width breathes, so it reads as a drifting cloud and not a beam
  const N = 40, spine = Array.from({length: N + 1}, (_, i) => {
    const s = i / N, a = (1 - s) ** 2, b = 2 * (1 - s) * s, c = s * s, sway = Math.sin(s * Math.PI * 2.4 + 0.6) * 38 * s;
    return {x: a * x0 + b * cx + c * x1 + nx * sway, y: a * y0 + b * cy + c * y1 + ny * sway, s, w: (width[0] + (width[1] - width[0]) * Math.sqrt(s)) * (1 + 0.22 * Math.sin(s * 11 + 1.3))};
  });
  const head = Math.min(1, grow * 1.25), swell = unit((grow - 0.1) / 0.9);
  // puffs: a sum of slow waves on the sheet, so the dots gather in lumps and thin out between them
  // the lumps drift along the path from its source, so the dots swell and thin in place as the gas moves through them
  const sx = (x1 - x0) / len, sy = (y1 - y0) / len, run = now * rise;
  const puff = (qx: number, qy: number) => puffAt(qx - sx * run, qy - sy * run);
  const puffAt = (px: number, py: number) => 0.5 + 0.5 * (Math.sin(px * 0.021 + 1.8 * Math.sin(py * 0.017)) * 0.5 + Math.sin(py * 0.026 + 1.6 * Math.sin(px * 0.013 + 1)) * 0.35 + Math.sin(px * 0.031 - py * 0.024 + 2 * Math.sin(px * 0.009)) * 0.15);
  const field = (px: number, py: number) => {
    let best = 0;
    for (const p of spine) {
      if (p.s > head) break;
      const d = Math.hypot(px - p.x, py - p.y) / p.w;
      if (d >= 1.15) continue;
      const edge = unit((head - p.s) / 0.12), body = unit(1 - d * d);
      best = Math.max(best, density * body * (1 - 0.3 * p.s) * edge);
    }
    // the lumps eat the edges more than the heart
    const q = puff(px, py);
    return unit(best * (0.55 + 0.75 * q) - (1 - q) * 0.12) * (0.35 + 0.65 * swell);
  };
  // the field dies to nothing well inside this box, so no dot is ever cut by it; the box stops at the frame and above the captions
  const pad = Math.max(...width) * 1.6 + 60, xs = spine.map((p) => p.x), ys = spine.map((p) => p.y);
  // what the camera sees, in the plume's own place, kept a dot's radius inside the frame
  const [vs, vx, vy] = view, wx = (sx0: number) => (sx0 - vx - 960) / vs + 960, wy = (sy0: number) => (sy0 - vy - 540) / vs + 540, m = 10;
  const box: [number, number, number, number] = [Math.max(wx(0) + m, Math.min(...xs) - pad), Math.max(wy(0) + m, Math.min(...ys) - pad), Math.min(wx(1920) - m, Math.max(...xs) + pad), Math.min(wy(860) - m, Math.max(...ys) + pad)];
  const end = spine[N];
  return (
    <svg {...CANVAS}>
      <Screens />
      <Plate ink={ink} slip={slip}>
        <path d={box[2] > box[0] && box[3] > box[1] ? dotsPath(ink, field, box) : ''}
          transform={vs !== 1 || vx || vy ? `translate(${vx + 960} ${vy + 540}) scale(${vs}) translate(-960 -540)` : undefined} />
        {label && grow >= 0.9 && <Print x={end.x + width[1] * 0.75} y={end.y + 14} size={44} face="sans" weight={800}>{label}</Print>}
      </Plate>
    </svg>
  );
}
