import {CANVAS, boxFaces, faceText, springOut, hue, tones, unit, type Role, type View} from './iso.ts';

export const meta = {
  name: {en: 'Plaque', 'zh-CN': '铭牌'},
  purpose: 'title',
  line: 'A long low block standing on the floor with the title cut into its front face and a short line above it in a role\'s colour; it rises from the floor like the buildings.',
  fits: 'the question a film opens on; the name of the system about to be built; the result stated at the end',
  params: {
    at: {type: '[x, y]', doc: 'the floor cell of its back-left corner; its face runs along +x'},
    width: {type: 'cells', default: 14, doc: 'its length along x'},
    height: {type: 'cells', default: 3.4, doc: 'its height'},
    title: {type: 'text', doc: 'the title: a few words'},
    kicker: {type: 'text', default: '', doc: 'the short line above the title'},
    role: {type: 'role', default: 'process', doc: 'the colour of the kicker and the band along its top'},
    rise: {type: 'progress', default: 1, doc: '0 to 1, tweened linearly: it springs up from the floor, and the words are cut in as it lands'},
  },
  preview: 5.8,
};

type Props = {at: [number, number]; width?: number; height?: number; title: string; kicker?: string; role?: Role; rise?: number} & View;

export function Plaque({at: [x, y], width = 14, height = 3.4, title, kicker = '', role = 'process', rise = 1, origin, k}: Props) {
  const v: View = {origin, k}, kk = k ?? 46;
  const r = springOut(rise);
  if (r <= 0) return null;
  const h = height * r, f = boxFaces({x, y, w: width, d: 1, h}, v), t = tones('var(--vt-panel)');
  const band = boxFaces({x, y, z: h, w: width, d: 1, h: 0.2}, v), tb = tones(hue(role));
  const words = unit((rise - 0.7) / 0.3);
  return (
    <svg {...CANVAS}>
      <polygon points={f.left} style={{fill: t.left, stroke: 'var(--vt-border)', strokeWidth: 1.5}} />
      <polygon points={f.right} style={{fill: t.right}} />
      <polygon points={f.top} style={{fill: t.top}} />
      <polygon points={band.left} style={{fill: tb.left}} /><polygon points={band.right} style={{fill: tb.right}} /><polygon points={band.top} style={{fill: tb.top}} />
      <g opacity={words}>
        {kicker && <text transform={faceText('left', x + 0.6, y + 1, h - 0.95, v)} fontSize={Math.round(kk * 0.62)} letterSpacing="0.08em"
          style={{fill: hue(role), fontFamily: 'var(--vt-sans)', fontWeight: 700, textTransform: 'uppercase'}}>{kicker}</text>}
        <text transform={faceText('left', x + 0.55, y + 1, 0.75, v)} fontSize={Math.round(kk * 1.55)}
          style={{fill: 'var(--vt-text)', fontFamily: 'var(--vt-display)', fontWeight: 800, letterSpacing: '-0.01em'}}>{title}</text>
      </g>
    </svg>
  );
}
