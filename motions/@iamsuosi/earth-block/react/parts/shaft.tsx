import {C, CANVAS, pathOf, project, smooth, tone, type View} from './earth.ts';

export const meta = {
  name: {en: 'Sunk shaft', 'zh-CN': '竖井'},
  purpose: 'mark',
  line: "A pipe sunk from the top down the cut face on the word, with what it brings up rising inside it.",
  fits: "a well, a mine, a pile, a root, a needle: anything that goes down through the layers to reach one",
  params: {
    view: {type: 'View', doc: "the scene's camera"},
    at: {type: '[x, y]', doc: 'where on the top it goes in; on the cut face, y is the cut'},
    to: {type: 'number', doc: 'the height it reaches, below 0'},
    t: {type: 'progress', default: 1, doc: 'it goes down'},
    rise: {type: 'progress', default: 0, doc: 'what it brings up, rising inside it'},
    color: {type: 'string', doc: 'what it brings up'},
  },
  preview: 43.8,
};

export function Shaft({view, at, to, t = 1, rise = 0, color = C.water}: {view: View; at: [number, number]; to: number; t?: number; rise?: number; color?: string}) {
  if (t <= 0) return null;
  const p = project(view), k = smooth(t), head = p(at[0], at[1], 0), foot = p(at[0], at[1], to * k), mouth = p(at[0], at[1], to * k * (1 - smooth(rise)));
  const q = (x: number, y: number, z: number) => p(at[0] + x, at[1] + y, z);
  return (
    <svg {...CANVAS}>
      <path d={`M${head[0]} ${head[1]}L${foot[0]} ${foot[1]}`} stroke={C.ink} strokeWidth={15} />
      <path d={`M${head[0]} ${head[1]}L${foot[0]} ${foot[1]}`} stroke={C.wall} strokeWidth={8} />
      {rise > 0 && <path d={`M${foot[0]} ${foot[1]}L${mouth[0]} ${mouth[1]}`} stroke={color} strokeWidth={8} />}
      {/* its head, a small house on the top against the cut */}
      <g opacity={k}>
        <path d={pathOf([q(0.22, -0.44, 0), q(0.22, 0, 0), q(0.22, 0, 0.34), q(0.22, -0.44, 0.34)])} fill={tone(C.wall, 0.68)} />
        <path d={pathOf([q(-0.22, 0, 0), q(0.22, 0, 0), q(0.22, 0, 0.34), q(-0.22, 0, 0.34)])} fill={tone(C.wall, 0.84)} />
        <path d={pathOf([q(-0.22, -0.44, 0.34), q(0.22, -0.44, 0.34), q(0.22, 0, 0.34), q(-0.22, 0, 0.34)])} fill={C.wall} />
      </g>
    </svg>
  );
}
