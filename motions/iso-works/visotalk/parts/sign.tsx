import {CANVAS, boxFaces, easeOut, faceText, hue, tones, type Role, type View} from './iso.ts';

export const meta = {
  name: {en: 'Sign', 'zh-CN': '立牌'},
  purpose: 'mark',
  line: 'A white board on a post, standing on the floor in the plane of the works, with a chip of its role\'s colour, a short name and a figure.',
  fits: 'naming a quantity beside a stack; a reading at a station (per hour, per day); the key that says what one cube is',
  params: {
    at: {type: '[x, y]', doc: 'the floor cell its post stands on; the board runs along +x from there'},
    width: {type: 'cells', default: 4, doc: 'the board\'s width'},
    title: {type: 'text', default: '', doc: 'the small line: what is counted'},
    figure: {type: 'text', default: '', doc: 'the large line: the number and its unit'},
    role: {type: 'role', default: 'process', doc: 'the colour of its chip: whose figure it is'},
    lift: {type: 'cells', default: 1.2, doc: 'the height of the post under the board'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the post rises and the board unrolls up from it'},
    dim: {type: 'progress', default: 0, doc: '0 to 1: its chip greyed while it is not the subject'},
  },
  preview: 32.8,
};

export type SignProps = {at: [number, number]; width?: number; title?: string; figure?: string; role?: Role; lift?: number; show?: number; dim?: number} & View;

/** The sign's drawing, for components that carry one (a stack's tally) */
export function SignBoard({at: [x, y], width = 4, title = '', figure = '', role = 'process', lift = 1.2, show = 1, dim = 0, origin, k}: SignProps) {
  const v: View = {origin, k}, kk = k ?? 46;
  // the board is never narrower than its words: a world unit along a face is k pixels, and Hanken Grotesk runs about 0.56 em a character
  width = Math.max(width, figure.length * 0.56 * 0.98 + 0.7, title.length * 0.52 * 0.7 + 1.3);
  const s = easeOut(show);
  if (s <= 0) return null;
  const H = (figure ? 2.05 : 1.1) * Math.max(0.01, (s - 0.25) / 0.75), post = lift * Math.min(1, s / 0.25);
  const board = boxFaces({x, y, z: post, w: width, d: 0.1, h: Math.max(0, H)}, v), tb = tones('var(--vt-panel)');
  const p = boxFaces({x: x + 0.3, y: y - 0.05, z: 0, w: 0.16, d: 0.16, h: post}, v), tp = tones('var(--vt-muted)');
  const chip = boxFaces({x: x + 0.25, y: y + 0.1, z: post + H - 0.7, w: 0.5, d: 0.01, h: 0.5}, v);
  const textOn = s > 0.85;
  return (
    <g>
      <polygon points={p.left} style={{fill: tp.left}} /><polygon points={p.right} style={{fill: tp.right}} />
      {H > 0 && <><polygon points={board.left} style={{fill: tb.left, stroke: 'var(--vt-border)', strokeWidth: 1.5}} /><polygon points={board.right} style={{fill: tb.right}} /><polygon points={board.top} style={{fill: tb.top}} /></>}
      {textOn && <>
        <polygon points={chip.left} style={{fill: hue(role, dim)}} />
        <text transform={faceText('left', x + 0.95, y + 0.1, post + H - 0.68, v)} fontSize={Math.round(kk * 0.7)} style={{fill: 'var(--vt-text)', fontFamily: 'var(--vt-sans)', fontWeight: 600}}>{title}</text>
        {figure && <text transform={faceText('left', x + 0.25, y + 0.1, post + 0.28, v)} fontSize={Math.round(kk * 0.98)} style={{fill: 'var(--vt-text)', fontFamily: 'var(--vt-display)', fontWeight: 800, fontVariantNumeric: 'tabular-nums'}}>{figure}</text>}
      </>}
    </g>
  );
}

export function Sign(props: SignProps) {
  return <svg {...CANVAS}><SignBoard {...props} /></svg>;
}
