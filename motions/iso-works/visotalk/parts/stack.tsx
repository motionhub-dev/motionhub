import {CANVAS, boxFaces, hue, tones, unit, type Role, type View} from './iso.ts';
import {SignBoard} from './sign.tsx';

export const meta = {
  name: {en: 'Stack', 'zh-CN': '方块柱'},
  purpose: 'data',
  line: 'A quantity as cubes you can count, dropping onto a pallet layer by layer while its sign counts what they stand for.',
  fits: 'how many per hour or per day; a stock that builds up; a total of equal units',
  params: {
    at: {type: '[x, y]', doc: 'the floor cell of the pallet\'s back corner'},
    count: {type: 'number', default: 0, doc: 'the quantity, in cubes (41.6 is 416,000 at 10,000 a cube): the sign shows count × per, and the stack one cube per whole unit, rounded'},
    fill: {type: 'progress', default: 1, doc: '0 to 1, tweened on the words: the cubes drop in one after another and the sign counts up with them; at 1 every cube has landed'},
    per: {type: 'number', default: 1, doc: 'what one cube stands for, so the sign reads count × per'},
    unit: {type: 'text', default: '', doc: 'what is counted, after the figure on the sign (parcels)'},
    title: {type: 'text', default: '', doc: 'the sign\'s small line (per hour); no sign when both title and unit are empty'},
    footprint: {type: '[a, b]', default: '[3, 3]', doc: 'cubes along x and along y in one layer'},
    role: {type: 'role', default: 'store', doc: 'the cubes\' colour'},
    dim: {type: 'progress', default: 0, doc: '0 to 1: greyed while it is not the subject'},
  },
  preview: 32.8,
};

const S = 0.82, STEP = 0.96, DROP = 3.2;

/** A count as the sign shows it while it runs: whole, and to three significant figures, so it reads as a number and not as noise (135,637 → 136,000) */
const fmt = (n: number) => {
  const step = n >= 1000 ? 10 ** (Math.floor(Math.log10(n)) - 2) : 1;
  return (Math.round(n / step) * step).toLocaleString('en-US');
};

export type StackProps = {at: [number, number]; count?: number; fill?: number; per?: number; unit?: string; title?: string; footprint?: [number, number]; role?: Role; dim?: number; sign?: boolean} & View;

export function StackDrawing({at: [x, y], count = 0, fill = 1, per = 1, unit: what = '', title = '', footprint: [a, b] = [3, 3], role = 'store', dim = 0, sign = true, origin, k}: StackProps) {
  const v: View = {origin, k};
  // the cubes are the count rounded; n runs from 0 to that many as fill goes to 1, and cube i drops while n passes from i to i + 1
  const total = Math.round(Math.max(0, count)), n = total * unit(fill), whole = Math.ceil(n);
  const tn = tones(hue(role, dim)), pallet = tones('var(--vt-panel2)');
  const cubes = Array.from({length: whole}, (_, i) => {
    const layer = Math.floor(i / (a * b)), j = i % (a * b);
    // each cube falls the last stretch with a quick ease-in and lands; the one in flight is the fraction of the count
    const f = unit(n - i), fall = (1 - f) ** 2 * DROP;
    // once down it squashes and springs back while the next cube falls
    const g = n - i - 1, squash = g > 0 && g < 1.2 ? 0.2 * Math.sin(Math.PI * g / 1.2) * (1 - g / 1.2) * 2 : 0;
    const cx = x + 0.1 + (j % a) * STEP, cy = y + 0.1 + Math.floor(j / a) * STEP;
    return {i, cx, cy, z: 0.22 + layer * STEP + fall, squash, order: layer * 100 + cx + cy};
  }).sort((p, q) => p.order - q.order);
  const pf = boxFaces({x: x - 0.06, y: y - 0.06, w: a * STEP + 0.12, d: b * STEP + 0.12, h: 0.2}, v);
  const label = sign && (title || what);
  return (
    <g>
      <polygon points={pf.left} style={{fill: pallet.left}} /><polygon points={pf.right} style={{fill: pallet.right}} /><polygon points={pf.top} style={{fill: pallet.top}} />
      {cubes.map((c) => {
        const sq = c.squash, f = boxFaces({x: c.cx - sq * S / 2, y: c.cy - sq * S / 2, z: c.z, w: S * (1 + sq), d: S * (1 + sq), h: S * (1 - sq)}, v);
        // a hairline in the cube's own dark tone keeps neighbours apart without drawing an outline round the stack
        return <g key={c.i} style={{stroke: tn.right, strokeWidth: 1, strokeLinejoin: 'round'}}><polygon points={f.left} style={{fill: tn.left}} /><polygon points={f.right} style={{fill: tn.right}} /><polygon points={f.top} style={{fill: tn.top}} /></g>;
      })}
      {label && <SignBoard at={[x + a * STEP + 0.7, y + b * STEP - 0.1]} width={4.2} title={title} figure={`${fmt(Math.max(0, count) * unit(fill) * per)}${what ? ` ${what}` : ''}`} role={role} dim={dim} lift={0.3} origin={origin} k={k} />}
    </g>
  );
}

export function Stack(props: StackProps) {
  return <svg {...CANVAS}><StackDrawing {...props} /></svg>;
}
