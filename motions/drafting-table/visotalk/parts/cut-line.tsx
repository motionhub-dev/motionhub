import {ACCENT, LINE, Stroke, lettering, phase} from './draft.ts';

export const meta = {
  name: {en: 'Cutting plane', 'zh-CN': '剖切线'},
  purpose: 'mark',
  line: 'Where the object is cut: a chain line through a view, heavy ends, arrows for the sight and a letter at each end.',
  fits: 'the plane a section is taken on, before its inside is shown',
  params: {
    from: {type: '[x, y]', doc: 'one end, in px inside the box'},
    to: {type: '[x, y]', doc: 'the other end'},
    letter: {type: 'text', default: 'A', doc: 'the section\'s name, at both ends'},
    look: {type: '1 | -1', default: 1, doc: 'which side the arrows point to, the direction the section is seen from'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: the line, then the arrows and letters'},
    accent: {type: 'boolean', default: false, doc: 'in the warm colour, while the cut is the subject'},
  },
  preview: 11.5,
};

type P = [number, number];

export function CutLine({from, to, letter = 'A', look = 1, draw = 1, accent = false}: {from: P; to: P; letter?: string; look?: number; draw?: number; accent?: boolean}) {
  const dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy) || 1;
  const u = [dx / len, dy / len], n = [-u[1] * look, u[0] * look];
  const color = accent ? ACCENT : 'var(--vt-text)';
  const end = (p: P, dir: number) => `M${p[0]} ${p[1]} L${p[0] + u[0] * 34 * dir} ${p[1] + u[1] * 34 * dir}`;
  const marks = phase(draw, 0.7, 1);
  const arrow = (p: P) => {
    const tip: P = [p[0] + n[0] * 54, p[1] + n[1] * 54], back: P = [p[0] + n[0] * 32, p[1] + n[1] * 32];
    return `M${p[0]} ${p[1]} L${back[0]} ${back[1]} M${tip[0]} ${tip[1]} L${back[0] + u[0] * 8} ${back[1] + u[1] * 8} L${back[0] - u[0] * 8} ${back[1] - u[1] * 8} Z`;
  };
  const label = (p: P, dir: number): P => [p[0] + n[0] * 44 - u[0] * 30 * dir, p[1] + n[1] * 44 - u[1] * 30 * dir];
  return (
    <>
      <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <Stroke d={`M${from[0]} ${from[1]} L${to[0]} ${to[1]}`} weight="centre" accent={accent} draw={phase(draw, 0, 0.7)} />
        {marks > 0 && <g opacity={marks}>
          <path d={`${end(from, 1)} ${end(to, -1)}`} stroke={color} strokeWidth={5} strokeLinecap="butt" />
          <path d={`${arrow(from)} ${arrow(to)}`} stroke={color} strokeWidth={LINE.detail.width} fill={color} />
        </g>}
      </svg>
      {marks > 0 && [label(from, 1), label(to, -1)].map(([x, y], k) => (
        <div key={k} style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', ...lettering(32), fontWeight: 700, color, opacity: marks}}>{letter}</div>
      ))}
    </>
  );
}
