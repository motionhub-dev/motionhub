import {ACCENT, LINE, ease, lettering, phase} from './draft.ts';

export const meta = {
  name: {en: 'Dimension', 'zh-CN': '尺寸标注'},
  purpose: 'data',
  line: 'A size measured out as it is said: extension lines rise, the line runs out to its arrowheads, the figure counts up.',
  fits: 'a diameter, a gap, a length: any size the narration states',
  params: {
    from: {type: '[x, y]', doc: 'one end of what is measured, in px inside the box'},
    to: {type: '[x, y]', doc: 'the other end'},
    offset: {type: 'px', default: 60, doc: 'how far the dimension line stands off the part, on the left of from → to (negative for the other side)'},
    value: {type: 'text', doc: 'the size as lettered: Ø12.7, 3.2, 40 m; its number counts up from zero as the line runs out'},
    measure: {type: 'progress', default: 1, doc: '0 to 1: extension lines, then the dimension line, its figure counting, then the arrowheads'},
    accent: {type: 'boolean', default: false, doc: 'in the warm colour: the one size the scene is about'},
    size: {type: 'px', default: 30, doc: 'the value\'s lettering'},
  },
  preview: 11.5,
};

type P = [number, number];

export function Dimension({from, to, offset = 60, value, measure = 1, accent = false, size = 30}: {from: P; to: P; offset?: number; value: string; measure?: number; accent?: boolean; size?: number}) {
  const dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy) || 1;
  const u = [dx / len, dy / len], n = [u[1], -u[0]];
  const at = (p: P, k: number): P => [p[0] + n[0] * k, p[1] + n[1] * k];
  const ext = ease(phase(measure, 0, 0.3)), run = ease(phase(measure, 0.25, 0.75)), head = phase(measure, 0.75, 0.85), write = phase(measure, 0.25, 0.75);
  const color = accent ? ACCENT : 'var(--vt-text)';
  const a = at(from, offset), b = at(to, offset), mid: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const half = (len / 2) * run;
  const s: P = [mid[0] - u[0] * half, mid[1] - u[1] * half], e: P = [mid[0] + u[0] * half, mid[1] + u[1] * half];
  const sign = Math.sign(offset) || 1;
  const extLine = (p: P) => { const p0 = at(p, 8 * sign), p1 = at(p, (offset + 14 * sign) * ext + 8 * sign * (1 - ext)); return `M${p0[0]} ${p0[1]} L${p1[0]} ${p1[1]}`; };
  const arrow = (tip: P, dir: number) => {
    const back: P = [tip[0] - u[0] * 20 * dir, tip[1] - u[1] * 20 * dir];
    return `M${tip[0]} ${tip[1]} L${back[0] + n[0] * 5.5} ${back[1] + n[1] * 5.5} L${back[0] - n[0] * 5.5} ${back[1] - n[1] * 5.5} Z`;
  };
  // the value reads from the bottom or the right of the sheet, on the side of the line away from the part
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle >= 89.999) angle -= 180;
  else if (angle < -90.001) angle += 180;
  const away = sign * (size * 0.72 + 6);
  const label: P = at(mid, away);
  // the figure counts with the line, in the value's own decimals: Ø0.0 … Ø12.7
  const m = /^(\D*)(\d+(?:\.\d+)?)(.*)$/.exec(value);
  const shown = m && run < 1 ? `${m[1]}${(Number(m[2]) * ease(write)).toFixed((m[2].split('.')[1] ?? '').length)}${m[3]}` : value;
  return (
    <>
      <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {ext > 0 && <path d={`${extLine(from)} ${extLine(to)}`} stroke={LINE.thin.color} strokeWidth={LINE.thin.width} fill="none" />}
        {run > 0 && <path d={`M${s[0]} ${s[1]} L${e[0]} ${e[1]}`} stroke={color} strokeWidth={accent ? 2.5 : 2} fill="none" />}
        {head > 0 && <path d={`${arrow(a, -1)} ${arrow(b, 1)}`} fill={color} opacity={head} />}
      </svg>
      {write > 0 && (
        <div style={{position: 'absolute', left: label[0], top: label[1], transform: `translate(-50%, -50%) rotate(${angle}deg)`}}>
          <div style={{...lettering(size), color, padding: '0 6px', fontVariantNumeric: 'tabular-nums', opacity: phase(write, 0, 0.15)}}>{shown}</div>
        </div>
      )}
    </>
  );
}
