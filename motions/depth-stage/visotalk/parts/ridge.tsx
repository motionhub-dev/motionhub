import {useMemo} from 'react';
import {random} from '@visotalk/runtime';
import {Sheet, SHEET, hazed, unit, useLight, useLook} from './stage.tsx';

export const meta = {
  name: {en: 'Silhouette layer', 'zh-CN': '剪影层'},
  purpose: 'ground',
  line: 'One flat silhouette of the land (hills, peaks, a volcano, a town, trees, boughs), paled and softened by its depth.',
  fits: 'the far mountains, the middle town and the near trees of a place; three to five of them, each on its own plane, make the depth',
  params: {
    shape: {type: 'text', default: 'hills', doc: 'hills, peaks, cone (a volcano), town, trees, bank (a low near slope) or canopy (near boughs hanging in from a top corner)'},
    seed: {type: 'text', default: 'a', doc: 'another seed draws another outline of the same kind'},
    top: {type: 'px', default: 520, doc: 'the height of the outline\'s highest point, at rest'},
    relief: {type: 'px', default: 220, doc: 'how far the outline falls below its top'},
    at: {type: 'px', default: 960, doc: 'where a cone\'s summit or a town\'s centre stands, across; for a canopy, left of 960 hangs it from the left'},
    mist: {type: 'progress', default: 0.5, doc: 'valley mist rising from the layer\'s foot'},
    rim: {type: 'progress', default: 0, doc: 'light caught along the top edge, from the light behind'},
  },
  preview: 7.6,
};

const LEFT = SHEET.x, RIGHT = SHEET.x + SHEET.w, FOOT = SHEET.y + SHEET.h;
const r1 = (v: number) => Math.round(v * 10) / 10;

/** Smooth value noise, the same for the same seed */
function noise(seed: string) {
  const g = random(`depth-stage:${seed}`);
  const knots = Array.from({length: 64}, () => g());
  const at = (x: number) => {
    const i = Math.floor(x), f = x - i, s = (1 - Math.cos(f * Math.PI)) / 2;
    const a = knots[((i % 64) + 64) % 64], b = knots[(((i + 1) % 64) + 64) % 64];
    return a + (b - a) * s;
  };
  return (x: number, octaves = 3) => {
    let sum = 0, amp = 1, norm = 0;
    for (let o = 0; o < octaves; o++) { sum += amp * at(x * 2 ** o + o * 17.3); norm += amp; amp *= 0.5; }
    return sum / norm;
  };
}

/** An outline as a list of points from the left edge of the sheet to the right */
function profile(shape: string, seed: string, top: number, relief: number, at: number): Array<[number, number]> {
  const n = noise(`${shape}:${seed}`);
  const pts: Array<[number, number]> = [];
  for (let x = LEFT; x <= RIGHT; x += 10) {
    let y: number;
    if (shape === 'peaks') {
      const ridged = 1 - Math.abs(2 * n(x / 520, 4) - 1);
      y = top + relief * (1 - ridged) * 0.9 + relief * 0.1 * n(x / 60, 2);
    } else if (shape === 'cone') {
      // a stratovolcano: concave flanks, a notch of a crater, an older broken rim on one side
      const flank = (cx: number, summit: number, w: number) => { const dx = Math.max(0, Math.abs(x - cx) - 52); return summit + relief * (1 - Math.exp(-dx / w)); };
      y = Math.min(flank(at, top, 380), flank(at - 360, top + relief * 0.3, 300));
      if (Math.abs(x - at) < 52) y = top + 8 + 6 * Math.cos((x - at) / 52 * Math.PI / 2);
      y += relief * 0.035 * (n(x / 40, 2) - 0.5) * Math.min(1, Math.abs(x - at) / 120);
      y = Math.min(y, top + relief + 40 * n(x / 300));
    } else {
      y = top + relief * (1 - n(x / 640, 3)) * 0.8;
    }
    pts.push([x, y]);
  }
  return pts;
}

const line = (pts: Array<[number, number]>) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r1(x)} ${r1(y)}`).join('');
const rect = (x: number, y: number, w: number, h: number) => `M${r1(x)} ${r1(y)}h${r1(w)}v${r1(h)}h${r1(-w)}Z`;
const ellipse = (cx: number, cy: number, rx: number, ry: number) => `M${r1(cx - rx)} ${r1(cy)}a${r1(rx)} ${r1(ry)} 0 1 1 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 1 ${r1(-2 * rx)} 0Z`;

/** A town on a low rise: houses with low roofs, now and then a temple front, cypresses and umbrella pines between them.
 *  Returns its shapes and its skyline, so light can catch the roofline alone. */
function town(seed: string, top: number, relief: number, at: number) {
  const g = random(`depth-stage:town:${seed}`);
  const ground = (x: number) => top + relief - 40 * Math.exp(-(((x - at) / 900) ** 2));
  const STEP = 4, sky: number[] = [];
  for (let x = LEFT; x <= RIGHT; x += STEP) sky.push(ground(x));
  const raise = (x0: number, x1: number, y: (x: number) => number) => {
    for (let i = Math.max(0, Math.ceil((x0 - LEFT) / STEP)); i < sky.length && LEFT + i * STEP <= x1; i++) sky[i] = Math.min(sky[i], y(LEFT + i * STEP));
  };
  const parts: string[] = [];
  const edge: Array<[number, number]> = [];
  for (let x = LEFT; x <= RIGHT; x += 20) edge.push([x, ground(x)]);
  parts.push(`${line(edge)}L${RIGHT} ${FOOT}L${LEFT} ${FOOT}Z`);
  const box = (x: number, y: number, w: number, h: number) => { parts.push(rect(x, y, w, h)); raise(x, x + w, () => y); };
  const gable = (x0: number, x1: number, y: number, peak: number) => {
    parts.push(`M${r1(x0)} ${r1(y)}L${r1((x0 + x1) / 2)} ${r1(y - peak)}L${r1(x1)} ${r1(y)}Z`);
    raise(x0, x1, (x) => y - peak * (1 - Math.abs(2 * (x - x0) / (x1 - x0) - 1)));
  };
  {
    let x = LEFT;
    while (x < RIGHT) {
      const near = Math.exp(-(((x - at) / 760) ** 2));   // the town is densest at its centre
      const kind = g();
      const base = ground(x) + 6;
      if (kind < 0.06 && near > 0.4) {             // a temple front: podium, columns, beam, pediment
        const w = 150 + g() * 60, h = 70 + g() * 26, cols = 6;
        box(x, base - 16, w, 22);
        for (let c = 0; c < cols; c++) parts.push(rect(x + 10 + c * ((w - 30) / (cols - 1)), base - 16 - h, 10, h));
        box(x + 2, base - 16 - h - 14, w - 4, 15);
        gable(x, x + w, base - 16 - h - 13, w * 0.17);
        x += w + 14;
      } else if (kind < 0.16) {                            // a cypress
        const h = 70 + g() * 80;
        parts.push(ellipse(x + 11, base - h / 2, 11, h / 2));
        raise(x, x + 22, (px) => base - h / 2 - (h / 2) * Math.sqrt(Math.max(0, 1 - ((px - x - 11) / 11) ** 2)));
        x += 22 + g() * 10;
      } else if (kind < 0.23) {                            // an umbrella pine
        const h = 80 + g() * 50, w = 100 + g() * 60, ry = 16 + g() * 8;
        parts.push(rect(x + w / 2 - 3, base - h, 6, h));
        parts.push(ellipse(x + w / 2, base - h, w / 2, ry));
        raise(x, x + w, (px) => base - h - ry * Math.sqrt(Math.max(0, 1 - ((px - x - w / 2) / (w / 2)) ** 2)));
        x += w + 6;
      } else if (g() < 0.35 + 0.65 * near) {               // a house
        const w = 40 + g() * 56, h = (22 + g() * 46) * (0.6 + 0.5 * near);
        box(x, base - h, w, h + 8);
        if (g() < 0.6) gable(x - 3, x + w + 3, base - h, w * 0.16);
        x += w + (g() < 0.5 ? 0 : 3 + g() * 8);
      } else x += 16 + g() * 30;
    }
  }
  return {fill: parts.join(''), edge: sky.map((y, i) => `${i ? 'L' : 'M'}${LEFT + i * STEP} ${r1(y)}`).join('')};
}

/** Near foliage hanging into the frame from one top corner (the side `at` is nearer), on a few tapering boughs */
function canopy(seed: string, top: number, relief: number, at: number) {
  const g = random(`depth-stage:canopy:${seed}`);
  const side = at < 960 ? -1 : 1, edge = side < 0 ? -40 : 1960;
  const parts: string[] = [];
  for (let b = 0; b < 4; b++) {
    const reach = 260 + g() * 520, y = top - 160 + g() * relief * 0.6, sag = 30 + g() * 80;
    const x1 = edge - side * reach, w0 = 22 - b * 3;
    parts.push(`M${r1(edge)} ${r1(y - w0)}Q${r1((edge + x1) / 2)} ${r1(y + sag - w0)} ${r1(x1)} ${r1(y + sag * 0.6)}Q${r1((edge + x1) / 2)} ${r1(y + sag + w0)} ${r1(edge)} ${r1(y + w0)}Z`);
    for (let c = 0; c < 7; c++) {
      const f = 0.35 + g() * 0.7, cx = edge - side * reach * f, cy = y + sag * f * 0.8 - 30 - g() * 40;
      const rx = 70 + g() * 90, ry = 22 + g() * 26;
      parts.push(ellipse(cx, cy, rx, ry));
      for (let k = 0; k < 4; k++) parts.push(ellipse(cx - rx * 0.8 + (k + 0.5) * (rx * 0.4), cy + ry * 0.6, rx * 0.22, ry * 0.55));
    }
  }
  return parts.join('');
}

/** A low near bank across the foot of the frame, with tufts of grass along its crest */
function bank(seed: string, top: number, relief: number) {
  const g = random(`depth-stage:bank:${seed}`);
  const n = noise(`bank:${seed}`);
  const ground = (x: number) => top + relief * (1 - n(x / 900, 2));
  const edge: Array<[number, number]> = [];
  for (let x = LEFT; x <= RIGHT; x += 16) edge.push([x, ground(x)]);
  const parts = [`${line(edge)}L${RIGHT} ${FOOT}L${LEFT} ${FOOT}Z`];
  for (let x = LEFT; x < RIGHT; x += 6 + g() * 14) {
    const y = ground(x) + 4, h = 10 + g() * 34 * (g() < 0.15 ? 2.2 : 1), lean = (g() - 0.5) * 18;
    parts.push(`M${r1(x - 2.5)} ${r1(y)}L${r1(x + lean)} ${r1(y - h)}L${r1(x + 2.5)} ${r1(y)}Z`);
  }
  return parts.join('');
}

/** A forest edge: stacked conifers along a rolling ground */
function trees(seed: string, top: number, relief: number) {
  const g = random(`depth-stage:trees:${seed}`);
  const n = noise(`trees:${seed}`);
  const ground = (x: number) => top + relief * (0.55 + 0.45 * n(x / 700));
  const parts: string[] = [];
  const edge: Array<[number, number]> = [];
  for (let x = LEFT; x <= RIGHT; x += 20) edge.push([x, ground(x)]);
  parts.push(`${line(edge)}L${RIGHT} ${FOOT}L${LEFT} ${FOOT}Z`);
  for (let x = LEFT; x < RIGHT; x += 26 + g() * 34) {
    const base = ground(x) + 10, h = (ground(x) - top) * (0.6 + g() * 0.8) + 40, w = h * (0.28 + g() * 0.08);
    const tiers = 4;
    for (let k = 0; k < tiers; k++) {
      const y0 = base - (h * k) / (tiers + 0.5), y1 = base - h * (k + 1.6) / (tiers + 0.5), half = (w / 2) * (1 - k / (tiers + 1));
      parts.push(`M${r1(x - half)} ${r1(y0)}L${r1(x)} ${r1(y1)}L${r1(x + half)} ${r1(y0)}Z`);
    }
    parts.push(rect(x - 3, base - 12, 6, 30));
  }
  return parts.join('');
}

export function Ridge({shape = 'hills', seed = 'a', top = 520, relief = 220, at = 960, mist = 0.5, rim = 0}: {
  shape?: string; seed?: string; top?: number; relief?: number; at?: number; mist?: number; rim?: number;
}) {
  const {fog} = useLook();
  const light = useLight();
  const {fill, edge} = useMemo(() => {
    if (shape === 'town') return town(seed, top, relief, at);
    if (shape === 'trees') { const d = trees(seed, top, relief); return {fill: d, edge: d}; }
    if (shape === 'canopy') { const d = canopy(seed, top, relief, at); return {fill: d, edge: d}; }
    if (shape === 'bank') { const d = bank(seed, top, relief); return {fill: d, edge: d}; }
    const pts = profile(shape, seed, top, relief, at);
    return {fill: `${line(pts)}L${RIGHT} ${FOOT}L${LEFT} ${FOOT}Z`, edge: line(pts)};
  }, [shape, seed, top, relief, at]);
  // the body darkens toward its top edge and fades into the valley mist at its foot
  const y0 = top - SHEET.y, y1 = top + relief + 260 - SHEET.y;
  const paint = `linear-gradient(180deg, ${hazed('var(--vt-panel)', fog)} ${y0}px, ${hazed('var(--vt-panel)', fog + unit(mist) * (1 - fog) * 0.55)} ${y1}px)`;
  return (
    <>
      <Sheet d={fill} paint={paint} />
      {/* haze between the eye and a far layer is lit by the low light: warmer on the side the light is on */}
      <Sheet d={fill} paint={`radial-gradient(1100px 700px at ${Math.round(light.x - SHEET.x)}px ${Math.round(light.y + 160 - SHEET.y)}px, color-mix(in oklab, var(--vt-data), var(--vt-grad) 40%), transparent 100%)`} opacity={fog * light.glow * 0.55} />
      {rim > 0 && <Sheet d={edge} stroke={3} paint="color-mix(in oklab, var(--vt-data), var(--vt-text) 45%)" opacity={unit(rim) * (1 - 0.7 * fog)} />}
    </>
  );
}
