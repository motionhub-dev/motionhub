import {CANVAS, project, type View} from './iso.ts';

export const meta = {
  name: {en: 'Works floor', 'zh-CN': '厂区地面'},
  purpose: 'ground',
  line: 'A pale floor of isometric tiles that runs off every edge of the frame; everything in the works stands on its grid.',
  fits: 'every scene, with the same origin and k as the parts standing on it',
  params: {
    origin: {type: '[x, y]', default: '[960, 250]', doc: 'where world [0, 0] lands on the canvas; the same for every component of the scene'},
    k: {type: 'px', default: 46, doc: 'pixels per floor cell; larger is closer'},
    reveal: {type: 'progress', default: 1, doc: '0 to 1: the tiles are laid in a ring spreading from the middle of the frame, for an opening'},
  },
  preview: 21.8,
};

// Every fourth line is a little stronger, as the joints between floor slabs are.
// Lines are cut to the frame above the caption band, so nothing is drawn where no one sees it.
const W = 1920, B = 870;
const clip = (x1: number, y1: number, x2: number, y2: number): string => {
  let t0 = 0, t1 = 1;
  const dx = x2 - x1, dy = y2 - y1;
  for (const [p, q] of [[-dx, x1], [dx, W - x1], [-dy, y1], [dy, B - y1]]) {
    if (p === 0) { if (q < 0) return ''; continue; }
    const r = q / p;
    if (p < 0) t0 = Math.max(t0, r); else t1 = Math.min(t1, r);
    if (t0 > t1) return '';
  }
  return `M${(x1 + t0 * dx).toFixed(1)} ${(y1 + t0 * dy).toFixed(1)}L${(x1 + t1 * dx).toFixed(1)} ${(y1 + t1 * dy).toFixed(1)}`;
};
export function Floor({origin, k, reveal = 1}: {origin?: [number, number]; k?: number; reveal?: number}) {
  const v: View = {origin, k};
  const kk = k ?? 46, span = Math.ceil(2400 / kk);
  const lines: string[] = [], slabs: string[] = [];
  for (let i = -span; i <= span; i++) {
    const [a1, b1] = project(i, -span, 0, v), [a2, b2] = project(i, span, 0, v);
    const [c1, d1] = project(-span, i, 0, v), [c2, d2] = project(span, i, 0, v);
    const seg = clip(a1, b1, a2, b2) + clip(c1, d1, c2, d2);
    (i % 4 === 0 ? slabs : lines).push(seg);
  }
  const R = Math.round(1500 * Math.max(0, Math.min(1, reveal)));
  const mask = `linear-gradient(180deg, #000 0%, #000 72%, transparent 84%)${reveal < 1 ? `, radial-gradient(circle at 960px 430px, #000 ${Math.max(0, R - 260)}px, transparent ${R}px)` : ''}`;
  return (
    <div style={{position: 'absolute', inset: 0, background: 'var(--vt-bg)', overflow: 'hidden'}}>
      {/* the grid fades out before the caption band, where nothing is drawn */}
      <svg {...CANVAS} style={{...CANVAS.style, WebkitMaskImage: mask, maskImage: mask, WebkitMaskComposite: 'source-in', maskComposite: 'intersect'}}>
        <path d={lines.join('')} stroke="var(--vt-border)" strokeWidth={1.4} fill="none" />
        <path d={slabs.join('')} stroke="var(--vt-border)" strokeWidth={2.8} fill="none" />
      </svg>
      {/* a soft light from the upper left, so the floor is not a flat sheet */}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 30% 20%, rgba(255,255,255,0.55), transparent 60%)'}} />
    </div>
  );
}
