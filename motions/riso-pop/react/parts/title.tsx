import {CANVAS, Plate, Print, Screens, dotsPath, easeOut, unit, type Pt} from './riso.ts';

export const meta = {
  name: {en: 'Poster title', 'zh-CN': '海报标题'},
  purpose: 'title',
  line: 'A big soft heavy title on the blue plate whose letters hit one by one, with a pink sun in a halo of dots printed over its end so those letters turn violet.',
  fits: 'the question a film opens on; a chapter title; the line it ends on',
  params: {
    title: {type: 'text', doc: 'the title, lines split by \\n: two or three short lines'},
    kicker: {type: 'text', default: '', doc: 'a short line above the title, in pink capitals'},
    at: {type: '[x, y]', default: '[150, 250]', doc: 'the baseline of the first title line, at its left'},
    size: {type: 'px', default: 150, doc: 'the title\'s size; lines are 0.96 of it apart'},
    sun: {type: '[cx, cy, r]', default: '[1340, 420, 230]', doc: 'the pink disc; let it cover part of a line, so the overprint shows'},
    blue: {type: 'progress', default: 1, doc: 'the blue plate rolled on, 0 to 1'},
    pink: {type: 'progress', default: 1, doc: 'the pink plate rolled on, 0 to 1, after the blue'},
    type: {type: 'progress', default: 1, doc: 'tweened 0 to 1 linearly over about 1.6 s: the letters hit one after another, each one\'s pink flying in out of register onto its blue and snapping home'},
    slip: {type: 'progress', default: 0, doc: 'tweened 0 to 1 linearly over about 1.4 s: the plates knock apart and snap back'},
  },
  preview: 3.5,
};

type Props = {title: string; kicker?: string; at?: Pt; size?: number; sun?: [number, number, number]; blue?: number; pink?: number; type?: number; slip?: number};

// a letter's own moment in `type`: the letters' windows overlap, so the hits run like a burst, not a typewriter
const WIN = 0.3;
const local = (type: number, i: number, n: number) => unit((type - (i / Math.max(1, n - 1)) * (1 - WIN)) / WIN);
// where a letter's pink lands while it flies in: far right and up, home by 0.85 of its window, then exactly in register
const ghost = (l: number): [number, number] => (l <= 0 || l >= 0.85 ? [0, 0] : [Math.round(70 * (1 - easeOut(l / 0.85))), Math.round(-26 * (1 - easeOut(l / 0.85)))]);

export function Title({title, kicker = '', at = [150, 250], size = 150, sun = [1340, 420, 230], blue = 1, pink = 1, type = 1, slip = 0}: Props) {
  const [x, y] = at, lines = title.split('\n'), lead = size * 0.96, [cx, cy, r] = sun;
  const bottom = y + lead * (lines.length - 1) + size * 0.3;
  const halo = dotsPath('pink', (px, py) => {
    const d = Math.hypot(px - cx, py - cy) / r;
    return d < 1 ? 0 : 0.55 * (1 - (d - 1) / 0.55);
  }, [cx - r * 1.6, cy - r * 1.6, cx + r * 1.6, cy + r * 1.6]);
  // each letter is a tspan, so the line keeps its kerning; a letter's pink is shifted with dx/dy and the next letter shifted back
  const n = lines.join('').length, starts = lines.map((_, i) => lines.slice(0, i).join('').length);
  const letters = (li: number, pinkPass: boolean) => {
    let px = 0, py = 0;
    return [...lines[li]].map((c, j) => {
      const l = local(type, starts[li] + j, n), [ox, oy] = pinkPass ? ghost(l) : [0, 0], shown = pinkPass ? l > 0 && l < 0.85 : l >= 0.4;
      const el = <tspan key={j} dx={ox - px || undefined} dy={oy - py || undefined} fillOpacity={shown ? 1 : 0}>{c}</tspan>;
      px = ox; py = oy;
      return el;
    });
  };
  const typing = type < 1;
  return (
    <svg {...CANVAS}>
      <Screens />
      <Plate ink="blue" print={blue} slip={slip} box={[x - 20, y - size * (kicker ? 1.5 : 1), x + 1500, bottom]}>
        {lines.map((l, i) => <Print key={i} x={x} y={y + i * lead} size={size}>{typing ? letters(i, false) : l}</Print>)}
        {/* a band of blue tint under the last line, the plate's own rule */}
        <rect x={x} y={bottom + 6} width={size * 2.2} height={14} />
      </Plate>
      <Plate ink="pink" print={pink} slip={slip} box={[Math.min(x, cx - r * 1.6), Math.min(y - size * 1.5, cy - r * 1.6), cx + r * 1.6, Math.max(bottom, cy + r * 1.6)]}>
        <path d={halo} />
        <circle cx={cx} cy={cy} r={r} />
        {kicker && <Print x={x + 4} y={y - size * 0.95} size={Math.round(size * 0.24)} face="sans" weight={800} spacing="0.14em">{kicker.toUpperCase()}</Print>}
      </Plate>
      {/* the letters' pink, flying in: its own pass of the pink plate, so it needs no roller */}
      {typing && <Plate ink="pink" slip={slip}>{lines.map((l, i) => <Print key={i} x={x} y={y + i * lead} size={size}>{letters(i, true)}</Print>)}</Plate>}
    </svg>
  );
}
