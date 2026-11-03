import {C, Screen, Words, kept, px, ringPixels, steps} from './pixel.ts';

export const meta = {
  name: {en: 'Clear burst', 'zh-CN': '通关迸发'},
  purpose: 'transition',
  line: 'A ring of gold pixels bursts, sparks fly, the word hops in; a level up adds a pillar of light.',
  fits: 'the word that finishes a step',
  params: {
    x: {type: 'px', default: 240, doc: 'the middle of the burst, in game pixels'},
    y: {type: 'px', default: 120, doc: 'its height, in game pixels'},
    burst: {type: 'progress', default: 0, doc: '0 to 1: the ring opens and fades by dither, the sparks fly, the word lands; tween it over about 1.2 s, linear'},
    word: {type: 'text', default: 'CLEAR!', doc: 'the word that lands: CLEAR!, DONE!, LEVEL UP!'},
    beam: {type: 'progress', default: 0, doc: '0 to 1 over about 1.6 s, for a level up: a pillar of light drops from the sky onto the point, sparks rise in it, and it narrows away'},
  },
  preview: 23.9,
};

const DIRS = [[1, 0], [0.7, -0.7], [0, -1], [-0.7, -0.7], [-1, 0], [-0.7, 0.7], [0, 1], [0.7, 0.7]];

// the pillar's half-width, drawing by drawing: it slams down wide, holds, and narrows to a thread
const BEAM = [2, 10, 14, 12, 11, 12, 11, 12, 11, 10, 8, 6, 4, 2, 1, 0];

function Beam({x, y, p}: {x: number; y: number; p: number}) {
  const i = Math.min(BEAM.length - 1, Math.floor(steps(p, BEAM.length) * BEAM.length));
  const half = BEAM[i];
  if (half <= 0) return null;
  const top = 32, foot = y + 32;
  const drop = i === 0 ? foot - 60 : top;   // the first drawing is the light still falling
  const out = [
    <rect key="g" x={x - half} y={drop} width={half * 2} height={foot - drop} fill={C.gold} />,
    <rect key="w" x={x - Math.max(1, half - 3)} y={drop} width={Math.max(1, half - 3) * 2} height={foot - drop} fill={C.bone} />,
  ];
  // dithered edges one pixel wider, and a pool of light on the floor
  for (let yy = drop; yy < foot; yy++) for (const sx of [-half - 1, half]) if (kept(x + sx, yy, 0.5)) out.push(<rect key={`e${sx}-${yy}`} x={x + sx} y={yy} width={1} height={1} fill={C.gold} />);
  out.push(<rect key="pool" x={x - half - 8} y={foot - 1} width={half * 2 + 16} height={2} fill={C.gold} />, <rect key="pool2" x={x - half - 4} y={foot} width={half * 2 + 8} height={1} fill={C.goldDark} />);
  // sparks rising inside it, a pixel every drawing
  for (let k = 0; k < 9; k++) {
    const yy = foot - 6 - ((k * 23 + i * 9) % (foot - top - 8));
    const xx = x + ((k * 7) % (half * 2 + 1)) - half;
    out.push(<rect key={`s${k}`} x={xx} y={yy} width={k % 3 ? 1 : 2} height={k % 3 ? 2 : 2} fill={k % 2 ? C.bone : '#FFE596'} />);
  }
  return <>{out}</>;
}

export function Clear({x = 240, y = 120, burst = 0, word = 'CLEAR!', beam = 0}: {x?: number; y?: number; burst?: number; word?: string; beam?: number}) {
  if ((burst <= 0 || burst >= 1) && (beam <= 0 || beam >= 1)) return null;
  if (burst <= 0 || burst >= 1) return <Screen><Beam x={px(x)} y={px(y)} p={beam} /></Screen>;
  const b = steps(burst, 14);   // fourteen drawings
  const ring = b < 0.57 ? Math.round(8 + (b / 0.57) * 40) : 0;
  const fade = Math.max(0, (b - 0.2) / 0.37);   // the ring thins out by dither as it grows
  const X = px(x), Y = px(y);
  const sparks = b < 0.7 ? DIRS.map(([dx, dy], i) => {
    const d = 12 + Math.round(b * 90);
    const k = i % 2 ? 2 : 4;
    return <g key={i}><rect x={X + Math.round(dx * d) - k / 2} y={Y + Math.round(dy * d) - k / 2} width={k} height={k} fill={i % 2 ? C.bone : C.gold} /><rect x={X + Math.round(dx * (d - 8)) - 1} y={Y + Math.round(dy * (d - 8)) - 1} width={2} height={2} fill={C.goldDark} /></g>;
  }) : null;
  const letters = [...word];
  return (
    <Screen>
      {beam > 0 && beam < 1 && <Beam x={X} y={Y} p={beam} />}
      {ring > 0 && [0, 1].flatMap((k) => ringPixels(Math.round(ring / 2) - k).filter(([a, c]) => kept(X + a * 2, Y + c * 2, fade)).map(([a, c], i) => <rect key={`${k}-${i}`} x={X + a * 2 - 1} y={Y + c * 2 - 1} width={2} height={2} fill={k === 0 ? C.gold : C.goldDark} />))}
      {sparks}
      {b < 0.15 && Array.from({length: 13}, (_, j) => { const half = 6 - Math.abs(j - 6); return <rect key={`f${j}`} x={X - half} y={Y - 6 + j} width={half * 2 + 1} height={1} fill={Math.abs(j - 6) < 3 ? C.bone : C.gold} />; })}
      {letters.map((ch, i) => {
        const start = 0.12 + i * 0.04;
        if (b < start) return null;
        const k = Math.min(3, Math.floor((b - start) / 0.04));
        const hop = [-10, -14, -6, 0][k];
        const adv = word.length > 7 ? 22 : 26, width = letters.length * adv;
        if (ch === ' ') return null;
        return <Words key={i} x={Math.max(26, Math.min(454 - width, X - width / 2)) + i * adv + adv / 2} y={Y - 36 + hop} size={24} weight={700} anchor="middle" color={C.gold} outline={C.ink} drop={C.goldDark}>{ch}</Words>;
      })}
    </Screen>
  );
}
