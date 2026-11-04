import {Box} from './formula.tsx';
import {PEN, drawn, fit, unit, written} from './pens.ts';

export const meta = {
  name: {en: 'Facing columns', 'zh-CN': '左右对照'},
  purpose: 'compare',
  line: 'Two headings either side of a pencil line down the page, what differs written row by row across it, the verdict in red underneath.',
  fits: 'this against that; before and after; myth and fact; two choices, feature by feature',
  params: {
    left: {type: 'text', doc: 'the left heading'},
    right: {type: 'text', doc: 'the right heading'},
    rows: {type: '{left, right, ring?}[]', doc: 'two to five rows, a few words a side; ring is left or right, to ring that side in pencil'},
    shown: {type: 'number', default: 99, doc: 'how much is written: 0 to 1 the headings and the line, then one more for each row, with fractions mid-row; tween it on the words'},
    rings: {type: 'progress', default: 1, doc: '0 to 1: how much of the rows\' rings is drawn'},
    verdict: {type: 'text', default: '', doc: 'what the comparison comes to, the scene\'s one red thing'},
    conclude: {type: 'progress', default: 1, doc: '0 to 1: how much of the verdict is written'},
    box: {type: 'progress', default: 0, doc: '0 to 1: how much of a red box around the verdict is drawn'},
    width: {type: 'px', default: 1400, doc: 'the width of both columns'},
    height: {type: 'px', default: 560, doc: 'the height, verdict included: the rows share what is left'},
  },
  preview: 24.9,
};

export function Versus({left, right, rows, shown = 99, rings = 1, verdict = '', conclude = 1, box = 0, width = 1400, height = 560}: {left: string; right: string; rows: {left: string; right: string; ring?: 'left' | 'right'}[]; shown?: number; rings?: number; verdict?: string; conclude?: number; box?: number; width?: number; height?: number}) {
  const mid = width / 2, col = mid - 44, foot = verdict ? 100 : 0, head = 84, row = Math.min(150, (height - head - foot) / (rows.length || 1)), bottom = head + row * rows.length;
  // one size for all the rows, so a long one does not stand apart
  const size = Math.min(44, row * 0.56, ...rows.flatMap((r) => [fit(r.left, col, 44), fit(r.right, col, 44)]));
  const lead = Math.min(52, fit(left, col, 52), fit(right, col, 52));
  const cell = (text: string, side: 'left' | 'right', y: number, s: number, p: number, weight = 500, ring = false) => (
    <div style={{position: 'absolute', top: y, ...(side === 'left' ? {left: 0} : {left: mid + 44}), fontSize: s, lineHeight: `${s * 1.5}px`, fontWeight: weight, color: PEN.ink, whiteSpace: 'nowrap', ...written(p)}}>
      {text}
      {ring && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', clipPath: `inset(-60% ${((1 - unit(rings)) * 110 - 5).toFixed(1)}% -60% -10%)`}}>
          <path d="M50 -15 C 15 -24, -8 12, -5 55 C -1 114, 78 122, 105 68 C 115 28, 82 -14, 54 -13" fill="none" stroke={PEN.pencil} strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
    </div>
  );
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width, height, fontFamily: 'var(--font-display)'}}>
      {cell(left, 'left', 0, lead, unit(shown), 600)}
      {cell(right, 'right', 0, lead, unit(shown), 600)}
      <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <path d={`M${mid} 6 L${mid + 3} ${bottom}`} fill="none" stroke={PEN.pencil} strokeWidth={3} strokeLinecap="round" {...drawn(shown)} />
        <path d={`M0 ${head - 4} L${width} ${head}`} fill="none" stroke={PEN.pencil} strokeWidth={3} strokeLinecap="round" {...drawn(shown)} />
      </svg>
      {rows.map((r, i) => {
        const p = unit(shown - 1 - i), y = head + row * i + (row - size * 1.5) / 2;
        return (
          <div key={i}>
            {cell(r.left, 'left', y, size, p * 2, 500, r.ring === 'left')}
            {cell(r.right, 'right', y, size, p * 2 - 1, 500, r.ring === 'right')}
          </div>
        );
      })}
      {verdict && (
        <div style={{position: 'absolute', left: 0, width, top: bottom + 16, display: 'flex', justifyContent: 'center'}}>
          <div style={{position: 'relative', padding: '4px 20px', fontSize: fit(verdict, width - 48, 54), lineHeight: 1.3, fontWeight: 600, color: PEN.red, whiteSpace: 'nowrap'}}>
            <span style={{display: 'block', ...written(conclude)}}>{verdict}</span>
            {box > 0 && <Box progress={box} />}
          </div>
        </div>
      )}
    </div>
  );
}
