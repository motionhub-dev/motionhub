import {useMemo} from 'react';
import {random} from '@visotalk/runtime';
import {SHEET, hazed, unit, useLook} from './stage.tsx';

export const meta = {
  name: {en: 'Parting layer', 'zh-CN': '分开的层'},
  purpose: 'transition',
  line: 'A covering layer (buried ground, cloud) cracks and slides apart to reveal what lies behind.',
  fits: 'ash lifted off a city, rock opened on a fossil, cloud parting on a summit',
  params: {
    shape: {type: 'text', default: 'strata', doc: 'strata (bands of ground in section) or cloud (a billowing bank)'},
    seed: {type: 'text', default: 'a', doc: 'another seed draws other bands and another crack'},
    top: {type: 'px', default: 140, doc: 'where the layer\'s top edge is, at rest'},
    seam: {type: 'px', default: 960, doc: 'where it splits, across'},
    open: {type: 'progress', default: 0, doc: '0 closed, 1 parted'},
    gap: {type: 'px', default: 820, doc: 'how far each half slides when fully open'},
  },
  preview: 35.5,
};

const L = SHEET.x, R = SHEET.x + SHEET.w, B = SHEET.y + SHEET.h;
const r1 = (v: number) => Math.round(v * 10) / 10;
const url = (d: string) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${L} ${SHEET.y} ${SHEET.w} ${SHEET.h}" width="${SHEET.w}" height="${SHEET.h}" preserveAspectRatio="none"><path d="${d}" fill="#fff"/></svg>`)}")`;
const circle = (x: number, y: number, r: number) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 1 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 1 ${r1(-2 * r)} 0Z`;

type Band = {d: string; paint: string};

/** Bands of buried ground in section, alternately ash, pumice and soil, the pumice bands flecked with stones */
function strata(seed: string, top: number): Band[] {
  const g = random(`depth-stage:strata:${seed}`);
  const tones = [30, 14, 22, 38, 10, 26, 18];
  const wave = (y0: number, a: number, f: number, p: number) => { const pts: string[] = []; for (let x = L; x <= R; x += 24) pts.push(`${x} ${r1(y0 + a * Math.sin(x / f + p) + a * 0.4 * Math.sin(x / (f * 0.37) + p * 2))}`); return pts; };
  const bands: Band[] = [];
  let y = top, k = 0, upper = wave(top, 6, 260, g() * 6);
  while (y < B) {
    const thick = k % 2 ? 18 + g() * 40 : 50 + g() * 110, lower = wave(y + thick, 3 + g() * 6, 180 + g() * 220, g() * 6);
    const tone = tones[k % tones.length];
    // ash is a warm grey: the haze's grey with a little of the light in it
    bands.push({d: `M${upper.join('L')}L${[...lower].reverse().join('L')}Z`, paint: `color-mix(in oklab, var(--vt-panel), color-mix(in oklab, ${k % 3 === 1 ? 'var(--vt-text)' : 'var(--vt-grad)'}, var(--vt-data) 18%) ${tone}%)`});
    if (k % 3 === 1) {
      const stones: string[] = [];
      for (let i = 0; i < 90; i++) stones.push(circle(L + g() * SHEET.w, y + 10 + g() * (thick - 20), 1.5 + g() * 4));
      bands.push({d: stones.join(''), paint: 'color-mix(in oklab, var(--vt-panel), var(--vt-text) 38%)'});
    }
    upper = lower; y += thick; k++;
  }
  return bands;
}

/** A billowing bank of cloud, paler toward its foot */
function cloud(seed: string, top: number): Band[] {
  const g = random(`depth-stage:cloud:${seed}`);
  const layers = [0, 1, 2].map(() => [] as string[]);
  for (let i = 0; i < 120; i++) {
    const f = Math.pow(g(), 0.7), r = 60 + g() * 150;
    layers[Math.min(2, Math.floor(f * 3))].push(circle(L + g() * SHEET.w, top + 60 + f * (B - top), r));
  }
  return layers.map((d, i) => ({d: d.join(''), paint: `color-mix(in oklab, var(--vt-panel), var(--vt-grad) ${40 + i * 15}%)`}));
}

/** A shape on the whole sheet, cut to one half of the crack, whose picture slides by `dx` while the element stays put */
function Slid({shape, half, dx, paint}: {shape: string; half: string; dx: number; paint: string}) {
  const at = `${dx}px 0px`;
  return (
    <div style={{position: 'absolute', left: SHEET.x, top: SHEET.y, width: SHEET.w, height: SHEET.h, background: paint,
      WebkitMaskImage: `${shape}, ${half}`, maskImage: `${shape}, ${half}`, WebkitMaskComposite: 'source-in', maskComposite: 'intersect',
      WebkitMaskSize: '100% 100%', maskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: `${at}, ${at}`, maskPosition: `${at}, ${at}`}} />
  );
}

export function Parting({shape = 'strata', seed = 'a', top = 140, seam = 960, open = 0, gap = 820}: {
  shape?: string; seed?: string; top?: number; seam?: number; open?: number; gap?: number;
}) {
  const {fog} = useLook();
  const {bands, left, right, face} = useMemo(() => {
    const g = random(`depth-stage:seam:${seed}`);
    const crack: string[] = [];
    for (let y = SHEET.y; y <= B; y += 34) crack.push(`${r1(seam + (g() - 0.5) * 70)} ${y}`);
    const edge = crack.map((p) => p.split(' ').map(Number));
    return {
      bands: (shape === 'cloud' ? cloud(seed, top) : strata(seed, top)).map((b) => ({...b, mask: url(b.d)})),
      left: url(`M${L} ${SHEET.y}L${crack.join('L')}L${L} ${B}Z`),
      right: url(`M${R} ${SHEET.y}L${crack.join('L')}L${R} ${B}Z`),
      // the cut faces: a dark lip along the crack on each half
      face: [-1, 1].map((side) => url(`M${edge.map(([x, y]) => `${x} ${y}`).join('L')}L${[...edge].reverse().map(([x, y]) => `${r1(x + side * 16)} ${y}`).join('L')}Z`)),
    };
  }, [shape, seed, top, seam]);
  const o = unit(open);
  const shift = Math.round(o * gap);
  // light breaks through the crack before it opens, then floods the gap
  const leak = unit(o * 8) * (1 - 0.5 * unit((o - 0.25) * 2));
  // each half swings toward the camera like a door on its outer edge as it slides
  const swing = (side: number) => ({position: 'absolute' as const, inset: 0, transformOrigin: `${side < 0 ? SHEET.x : SHEET.x + SHEET.w}px 540px`,
    transform: `perspective(1400px) translateZ(${(o * 90).toFixed(1)}px) rotateY(${(-side * o * 16).toFixed(2)}deg)`});
  // each half and each band stays a whole sheet and slides its mask, so the layer is always the ground of the frame, never a card on it
  const half = (mask: string, lip: string, dx: number) => (
    <>
      {bands.map((b, i) => <Slid key={i} shape={b.mask} half={mask} dx={dx} paint={hazed(b.paint, fog)} />)}
      <Slid shape={lip} half={mask} dx={dx} paint="color-mix(in srgb, var(--vt-panel) 75%, transparent)" />
    </>
  );
  return (
    <>
      {leak > 0.01 && <div style={{position: 'absolute', left: SHEET.x, top: SHEET.y, width: SHEET.w, height: SHEET.h, opacity: leak, mixBlendMode: 'screen',
        background: `linear-gradient(90deg, transparent ${seam - SHEET.x - 70 - shift}px, color-mix(in oklab, var(--vt-text), var(--vt-data) 30%) ${seam - SHEET.x}px, transparent ${seam - SHEET.x + 70 + shift}px)`}} />}
      <div style={swing(-1)}>{half(left, face[0], -shift)}</div>
      <div style={swing(1)}>{half(right, face[1], shift)}</div>
    </>
  );
}
