export const meta = {
  name: {en: 'Conduit', 'zh-CN': '导管'},
  purpose: 'link',
  line: 'A hairline route drawn from its first point, then green packets travelling along it.',
  fits: 'the path between tiles; a bus the tiles hang from; the one route the sentence follows',
  params: {
    points: {type: '[x, y][]', doc: 'the corners of the route, in frame pixels'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: how much of the route is drawn, from the first point'},
    flow: {type: 'number', default: 0, doc: 'how many lengths the lead packet has travelled; the fraction keeps the packets moving'},
    packets: {type: 'number', default: 4, doc: 'how many packets ride the drawn route'},
    gap: {type: 'px', default: 92, doc: 'the space between packets, in pixels'},
    line: {type: 'boolean', default: true, doc: 'draw the hairline; false rides packets along a route already drawn'},
  },
  preview: 4.2,
};

type Pt = [number, number];

const lengthOf = (pts: Pt[]) => pts.reduce((n, p, i) => (i === 0 ? 0 : n + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])), 0);

function pointAt(pts: Pt[], dist: number): {at: Pt; angle: number} {
  let left = Math.max(0, dist);
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const len = Math.hypot(bx - ax, by - ay);
    if (left <= len || i === pts.length - 1) {
      const t = len === 0 ? 0 : Math.min(1, left / len);
      return {at: [ax + (bx - ax) * t, ay + (by - ay) * t], angle: Math.atan2(by - ay, bx - ax) * 180 / Math.PI};
    }
    left -= len;
  }
  return {at: pts[pts.length - 1], angle: 0};
}

export function Conduit({points, draw = 1, flow = 0, packets = 4, gap = 92, line = true}: {points: Pt[]; draw?: number; flow?: number; packets?: number; gap?: number; line?: boolean}) {
  if (!points || points.length < 2) return null;
  const len = lengthOf(points);
  if (len < 1) return null;
  const shown = Math.max(0, Math.min(1, draw)) * len;
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const frac = flow - Math.floor(flow);
  const lead = frac * shown;
  const dots = [];
  const count = Math.max(0, Math.round(packets));
  for (let i = 0; i < count; i++) {
    const at = lead - i * gap;
    if (at < 10 || at > shown - 8) continue;
    const {at: [x, y], angle} = pointAt(points, at);
    dots.push(
      <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})`}>
        <rect x={-16} y={-8} width={32} height={16} rx={6} fill="var(--color-data)" opacity={i === 0 ? 0.32 : 0.18} />
        <rect x={-10} y={-5} width={20} height={10} rx={4} fill="var(--color-data)" opacity={i === 0 ? 1 : 0.75} />
      </g>,
    );
  }
  const head = line && shown > 2 && shown < len - 1 ? pointAt(points, shown).at : null;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      {line && <path d={d} fill="none" stroke="var(--color-grad)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${shown} ${len}`} />}
      {head && <circle cx={head[0]} cy={head[1]} r={5} fill="var(--color-grad)" />}
      {dots}
    </svg>
  );
}
