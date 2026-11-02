import {useMemo} from 'react';
import {random} from '@visotalk/runtime';
import {Sheet, SHEET, hazed, unit, useLook} from './stage.tsx';

export const meta = {
  name: {en: 'Cross-section', 'zh-CN': '剖面'},
  purpose: 'steps',
  line: 'The ground cut open: layers laid one on another as they are named, each labelled, burying what stood on the old surface.',
  fits: 'how a city was buried, how strata form, sediment over a fossil',
  params: {
    bands: {type: 'list', doc: 'the layers, oldest first: [{label: \'Pumice\', note: \'18 hours\', depth: 150}], depth in px'},
    base: {type: 'px', default: 830, doc: 'the old surface, down, at rest'},
    built: {type: 'number', default: 0, doc: 'how many layers are laid: tween it on the words, 1.5 is the second half grown'},
    walls: {type: 'number', default: 0, doc: 'how many walls stand on the old surface, to be buried'},
    labelX: {type: 'px', default: 1440, doc: 'where the labels start, across'},
  },
  preview: 22.6,
};

type Band = {label: string; note?: string; depth: number};
const L = SHEET.x, R = SHEET.x + SHEET.w, FOOT = SHEET.y + SHEET.h;
const r1 = (v: number) => Math.round(v * 10) / 10;

export function Section({bands, base = 830, built = 0, walls = 0, labelX = 1440}: {bands: Band[]; base?: number; built?: number; walls?: number; labelX?: number}) {
  const {fog} = useLook();
  // a surface that is not quite level, the same for every frame
  const ripple = useMemo(() => {
    const g = random('depth-stage:section');
    const p = [g() * 6, g() * 6, g() * 6];
    return (x: number, k: number) => 5 * Math.sin(x / 210 + p[k % 3] + k) + 3 * Math.sin(x / 77 + p[(k + 1) % 3]);
  }, []);
  const edge = (y: number, k: number) => { const pts: string[] = []; for (let x = L; x <= R; x += 24) pts.push(`${x} ${r1(y + ripple(x, k))}`); return pts; };
  // the old ground, and the walls that stood on it, drawn as outlines so the layers can be seen to fill around them
  const ground = `M${edge(base, 0).join('L')}L${R} ${FOOT}L${L} ${FOOT}Z`;
  const wallPath = Array.from({length: Math.max(0, Math.round(walls))}, (_, i) => {
    const x = 220 + i * (1100 / Math.max(1, walls)), w = 120 + (i % 3) * 30, h = 150 + (i % 2) * 70;
    return `M${x} ${base}V${base - h}L${x + w / 2} ${base - h - 26}L${x + w} ${base - h}V${base}`;
  }).join('');
  // stones of pumice scattered through a layer, at fractions of its height
  const grains = useMemo(() => { const g = random('depth-stage:section:grains'); return Array.from({length: 160}, () => [g() * 1920, 0.06 + g() * 0.88, 1.5 + Math.round(g() * 3)]); }, []);
  let top = base;
  const layers = bands.map((b, i) => {
    const grown = unit(built - i);
    const y0 = top, y1 = top - b.depth * grown;
    top = top - b.depth * grown;
    return {b, i, grown, y0, y1};
  });
  const tone = (i: number) => i % 2 ? 'color-mix(in oklab, var(--vt-panel), var(--vt-grad) 22%)' : 'color-mix(in oklab, var(--vt-panel), color-mix(in oklab, var(--vt-text), var(--vt-data) 25%) 38%)';
  return (
    <>
      <Sheet d={ground} paint={hazed('var(--vt-panel)', fog * 0.5)} />
      {layers.map(({b, i, grown, y0, y1}) => grown > 0.01 && (
        <Sheet key={`band${i}`} d={`M${edge(y1, i + 1).join('L')}L${[...edge(y0, i)].reverse().join('L')}Z`} paint={hazed(tone(i), fog * 0.6)} />
      ))}
      {layers.map(({i, grown, y0, y1}) => grown > 0.01 && i % 2 === 0 && (
        <Sheet key={`grain${i}`} d={grains.filter(([x, f]) => x >= 0 && f < 1).map(([x, f, r]) => `M${r1(x - r)} ${r1(y0 + (y1 - y0) * f)}a${r} ${r} 0 1 1 ${2 * r} 0a${r} ${r} 0 1 1 ${-2 * r} 0Z`).join('')} paint={hazed('color-mix(in oklab, var(--vt-text), var(--vt-grad) 30%)', fog * 0.6)} opacity={0.35} />
      ))}
      {wallPath && <Sheet d={wallPath} stroke={4} paint={hazed('color-mix(in oklab, var(--vt-text), var(--vt-grad) 40%)', fog * 0.5)} opacity={0.8} />}
      {layers.map(({b, i, grown, y0, y1}) => (
        <div key={`label${i}`} style={{position: 'absolute', left: labelX, top: Math.round((y0 + y1) / 2 - 30), width: 420, opacity: unit(grown * 2.5),
          borderLeft: `2px solid ${hazed('var(--vt-text)', fog * 0.5)}`, paddingLeft: 18}}>
          <div style={{fontFamily: 'var(--vt-sans)', fontSize: 30, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: hazed('var(--vt-text)', fog * 0.5), lineHeight: 1.1}}>{b.label}</div>
          {b.note && <div style={{fontFamily: 'var(--vt-display)', fontStyle: 'italic', fontSize: 34, color: hazed('color-mix(in oklab, var(--vt-text), var(--vt-muted) 40%)', fog * 0.5), lineHeight: 1.15, marginTop: 4}}>{b.note}</div>}
        </div>
      ))}
    </>
  );
}
