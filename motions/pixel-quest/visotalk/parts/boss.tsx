import {useDocTime} from '@visotalk/runtime';
import type {ReactNode} from 'react';
import {C, FLOOR, Screen, Sprite, Window, Words, clamp, kept, px, ringPixels, steps, twos, type Art} from './pixel.ts';

export const meta = {
  name: {en: 'Boss', 'zh-CN': '关底首领'},
  purpose: 'compare',
  line: 'The hard part as a horned one-eyed orb with a red HP bar: its shadow warns, it crashes down, flashes on each blow, and goes up in blasts and gold.',
  fits: 'the step people fail at; one a film',
  params: {
    x: {type: 'px', default: 340, doc: 'where it stands, in game pixels (its middle)'},
    name: {type: 'text', default: 'BOSS', doc: 'what the hard part is called, in its window: one to three short words'},
    enter: {type: 'progress', default: 0, doc: '0 to 1 over about 1.6 s: its shadow grows on the floor, it falls and lands at 0.7 in dust and a floor ripple (tween shake on the level then)'},
    hp: {type: 'progress', default: 1, doc: '1 to 0: its HP, in ten red cells; tween it down as the step is mastered'},
    hit: {type: 'progress', default: 0, doc: '0 to 1 over a blow: it flashes white twice and recoils a pixel'},
    defeat: {type: 'progress', default: 0, doc: '0 to 1 over about 2.4 s: blasts break out over it, the world flashes white at 0.5, it dissolves and gold sprays out and bounces'},
  },
  preview: 31.7,
};

// the orb drawn once from a circle: an ink edge, a lit upper left, a shade lower right, two horns, one eye, a jagged mouth, two feet
const ART: Art = (() => {
  const S = 40, R = 15.5, cx = 19.5, cy = 21.5;
  const g: string[][] = Array.from({length: S}, () => Array(S).fill('.'));
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d <= R) g[y][x] = d > R - 1.2 ? 'k' : (x - cx) + (y - cy) > 11 ? 'D' : (x - cx) + (y - cy) < -14 && d > R - 4 ? 'l' : 'c';
  }
  const set = (x: number, y: number, c: string) => { if (y >= 0 && y < S && x >= 0 && x < S) g[y][x] = c; };
  // horns
  for (const [hx, dir] of [[10, -1], [29, 1]] as const) for (let i = 0; i < 6; i++) {
    set(hx + dir * Math.floor(i / 2), 7 - i, 'k'); set(hx + dir * Math.floor(i / 2) - dir, 7 - i, i < 5 ? 'w' : 'k'); set(hx + dir * Math.floor(i / 2) - 2 * dir, 7 - i, 'k');
  }
  // the eye
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const e = ((x - 19.5) / 6.5) ** 2 + ((y - 17.5) / 5) ** 2;
    if (e <= 1) g[y][x] = e > 0.72 ? 'k' : 'w';
  }
  for (let y = 15; y <= 20; y++) for (let x = 19; x <= 22; x++) set(x, y, 'k');
  set(19, 15, 'w');
  // brow
  for (let x = 12; x <= 27; x++) set(x, 11 + (x < 20 ? Math.floor((x - 12) / 3) : Math.floor((27 - x) / 3)), 'k');
  // mouth
  for (let x = 13; x <= 26; x++) { set(x, 27, 'k'); set(x, 28, (x - 13) % 3 === 1 ? 'w' : 'k'); }
  for (let x = 14; x <= 25; x++) set(x, 29, 'k');
  // feet
  for (const fx of [11, 24]) for (let y = 36; y <= 38; y++) for (let x = fx; x < fx + 6; x++) set(x, y, y === 38 || x === fx || x === fx + 5 ? 'k' : 'D');
  return g.map((r) => r.join(''));
})();
const PAL = {k: C.ink, c: C.coral, D: C.coralDark, l: '#FF8A7E', w: C.bone};

// where the blasts break out over the body, and when (as a share of the first half of defeat)
const BLASTS = [[-8, -10, 0], [9, -4, 0.1], [-2, 6, 0.2], [12, -16, 0.3], [-12, 2, 0.38], [3, -20, 0.46], [0, -6, 0.56], [-7, -18, 0.64]];
// the gold that sprays out: launch speeds across and up, in pixels a second
const SPRAY = [[-70, 150], [-40, 190], [-15, 210], [20, 200], [48, 175], [80, 140], [-95, 110], [100, 120], [-55, 230], [62, 220], [-25, 130], [30, 150]];

function blast(x: number, y: number, life: number, key: string): ReactNode[] {
  if (life <= 0 || life >= 1) return [];
  const f = Math.floor(life * 4);   // four drawings: a core, a ring, a broken ring, smoke
  if (f === 0) return [<rect key={`${key}c`} x={x - 8} y={y - 2} width={17} height={5} fill={C.gold} />, <rect key={`${key}d`} x={x - 2} y={y - 8} width={5} height={17} fill={C.gold} />, <rect key={key} x={x - 5} y={y - 5} width={11} height={11} fill={C.bone} />];
  const r = [0, 8, 12, 15][f];
  if (f === 1) return [...ringPixels(r), ...ringPixels(r - 1), ...ringPixels(r - 2)].map(([a, b], i) => <rect key={`${key}-${i}`} x={x + a} y={y + b} width={1} height={1} fill={i % 3 ? C.gold : C.bone} />).concat(<rect key={`${key}k`} x={x - 3} y={y - 3} width={7} height={7} fill={C.coral} />);
  return ringPixels(r).filter(([a, b]) => f < 2 || kept(x + a, y + b, f === 2 ? 0.35 : 0.7)).map(([a, b], i) => <rect key={`${key}-${i}`} x={x + a} y={y + b} width={1} height={1} fill={f === 3 ? C.slate : f === 2 ? C.gold : C.bone} />);
}

export function Boss({x = 340, name = 'BOSS', enter = 0, hp = 1, hit = 0, defeat = 0}: {x?: number; name?: string; enter?: number; hp?: number; hit?: number; defeat?: number}) {
  const t = useDocTime();
  if (enter <= 0 || defeat >= 1) return null;
  const X = px(x);
  const e = steps(enter, 20);
  // 0 to 0.45: only its shadow, growing; 0.45 to 0.7: the fall; then a squash and a bounce
  const shadow = e < 0.7 ? Math.round(4 + (e / 0.7) * 24) : 28;
  const fall = e < 0.45 ? null : e < 0.7 ? [-140, -108, -78, -50, -26, -8][Math.min(5, Math.floor(((e - 0.45) / 0.25) * 6))] : e < 0.8 ? 2 : e < 0.9 ? -5 : 0;
  const landed = e >= 0.7;
  const dust = clamp((e - 0.7) / 0.3);
  const d = steps(defeat, 28);
  const breaking = d > 0 && d < 0.5;
  const flashHit = hit > 0 && (hit < 0.12 || (hit >= 0.24 && hit < 0.36));   // two quick white flashes at the start of a blow, then its own colours
  const flicker = breaking && twos(t) % 2 === 0;
  const recoil = (hit > 0 && hit < 0.36 ? 2 : 0) + (breaking ? (twos(t) % 2 ? 1 : -1) : 0);
  const bob = Math.floor(twos(t) / 6) % 2;   // it breathes a pixel, twice a second
  const cells = Math.ceil(Math.max(0, Math.min(1, hp)) * 10 - 1e-6);
  const wx = 290, wy = 44;
  const fx: ReactNode[] = [];
  if (landed && dust < 1) {
    // dust: two puffs roll out each side and thin by dither; a ripple runs along the floor's grass
    for (const side of [-1, 1]) for (let k = 0; k < 2; k++) {
      const cx = X + side * (18 + Math.round(dust * (28 + k * 16))), cy = FLOOR - 3 - k * 3 - Math.round(dust * 4);
      const r = 3 + k + Math.round(dust * 3);
      for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r && kept(cx + xx, cy + yy, dust * 0.9)) fx.push(<rect key={`d${side}${k}${xx}${yy}`} x={cx + xx} y={cy + yy} width={1} height={1} fill={yy < 0 ? C.fog : C.slate} />);
    }
    const run = Math.round(dust * 150);
    for (const side of [-1, 1]) if (X + side * (24 + run) > 4 && X + side * (24 + run) < 476) fx.push(<rect key={`w${side}`} x={X + side * (24 + run) - 3} y={FLOOR - 2} width={6} height={2} fill={C.grassLit} />, <rect key={`w2${side}`} x={X + side * (24 + run) - 1} y={FLOOR - 3} width={2} height={1} fill={C.grassLit} />);
  }
  if (breaking) BLASTS.forEach(([bx, by, at], i) => fx.push(...blast(X + bx, FLOOR - 20 + by, (d / 0.5 - at) / 0.3, `b${i}`)));
  const sprayT = (d - 0.54) / 0.46 * 2.2;   // seconds of the spray
  if (sprayT > 0) SPRAY.forEach(([vx, vy], i) => {
    let tt = sprayT, y0 = FLOOR - 24, vyy = vy, sx = X + vx * tt;
    let y = y0 - (vyy * tt - 260 * tt * tt);
    if (y > FLOOR - 3) {   // it bounces once on the floor, at a third of its speed, then lies there
      const t1 = (vyy + Math.sqrt(vyy * vyy + 4 * 260 * (y0 - FLOOR + 3))) / (2 * 260);
      tt = sprayT - t1; vyy = vy / 3; sx = X + vx * t1 + vx * 0.4 * tt;
      y = FLOOR - 3 - Math.max(0, vyy * tt - 260 * tt * tt);
    }
    if (sprayT > 1.8 && twos(t) % 2 === 1) return;   // blinking out
    const spin = (twos(t) + i) % 4;
    fx.push(<rect key={`s${i}`} x={Math.round(sx) - (spin === 2 ? 0 : 1)} y={Math.round(y) - 1} width={spin === 2 ? 1 : 3} height={3} fill={C.gold} />, <rect key={`s${i}h`} x={Math.round(sx) - (spin === 2 ? 0 : 1)} y={Math.round(y) - 1} width={1} height={1} fill={C.bone} />);
  });
  return (
    <Screen>
      {d >= 0.5 && d < 0.56 && <rect x={0} y={32} width={480} height={190} fill={C.bone} />}
      {d < 0.56 && <rect x={X - shadow / 2} y={FLOOR} width={shadow} height={2} fill={C.ink} opacity={0.6} />}
      {fall !== null && d < 0.86 && <Sprite art={ART} pal={PAL} x={X - 20 + recoil} y={FLOOR - 39 + fall + (landed ? bob : 0)} dissolve={d > 0.56 ? (d - 0.56) / 0.3 : 0} fill={flashHit || flicker ? C.bone : undefined} />}
      {fx}
      {landed && e >= 1 && d < 0.5 && (
        <g>
          <Window x={wx} y={wy} w={166} h={34} />
          <Words x={wx + 10} y={wy + 15} size={8} weight={700} color={C.coral} outline={null}>{name}</Words>
          <Words x={wx + 10} y={wy + 27} size={8} color={C.fog} outline={null}>HP</Words>
          {Array.from({length: 10}, (_, i) => (
            <g key={i}>
              <rect x={wx + 28 + i * 13} y={wy + 20} width={12} height={7} fill={i < cells ? C.coral : '#1C2433'} />
              {i < cells && <rect x={wx + 28 + i * 13} y={wy + 20} width={12} height={2} fill="#FF8A7E" />}
            </g>
          ))}
        </g>
      )}
    </Screen>
  );
}
