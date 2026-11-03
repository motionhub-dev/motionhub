import {C, CANVAS, DISPLAY, MONO, SANS, pathOf, settle, tone, type Pt} from './earth.ts';

export const meta = {
  name: {en: 'Measured slabs', 'zh-CN': '等厚量板'},
  purpose: 'compare',
  line: "Square slabs of one thickness, each with an area true to its number, so a hundred times more looks a hundred times bigger.",
  fits: "two or three quantities whose ratio is the point",
  params: {
    items: {type: '{value, label, color, at}[]', doc: "each slab's number, name, colour and px on the frame"},
    unit: {type: 'string', default: "''", doc: 'after the number'},
    scale: {type: 'number', default: 60, doc: 'px of slab per square root of the value: the same for all of them'},
    source: {type: 'string', doc: 'where the numbers come from'},
    sourceAt: {type: '[x, y]', doc: 'the source, in px'},
    t: {type: 'progress', default: 1, doc: 'they are laid down'},
  },
  preview: 49.5,
};

export function Slabs({items, unit = '', scale = 60, source, sourceAt, t = 1}: {items: Array<{value: number; label: string; color: string; at: Pt}>; unit?: string; scale?: number; source?: string; sourceAt?: Pt; t?: number}) {
  const k = settle(t), thick = 26;
  return (
    <>
      <svg {...CANVAS}>
        {items.map(({value, color, at}, i) => {
          const s = Math.sqrt(value) * scale * k, w = s * 0.866, h = s * 0.5, [x, y] = at;
          const T: Pt = [x, y - h], R: Pt = [x + w, y], B: Pt = [x, y + h], L: Pt = [x - w, y];
          const dn = ([a, b]: Pt): Pt => [a, b + thick * k];
          return <g key={i}>
            <path d={pathOf([R, B, dn(B), dn(R)])} fill={tone(color, 0.68)} />
            <path d={pathOf([L, B, dn(B), dn(L)])} fill={tone(color, 0.84)} />
            <path d={pathOf([T, R, B, L])} fill={color} />
          </g>;
        })}
      </svg>
      {items.map(({value, label, at}, i) => {
        const s = Math.sqrt(value) * scale;
        return <div key={i} style={{position: 'absolute', left: at[0] - 230, width: 460, top: at[1] + s * 0.5 + thick + 14, textAlign: 'center', opacity: k}}>
          <div style={{fontFamily: DISPLAY, fontSize: 84, fontWeight: 800, lineHeight: '92px', color: C.ink, fontVariantNumeric: 'tabular-nums'}}>{value}{unit}</div>
          <div style={{fontFamily: SANS, fontSize: 30, lineHeight: '38px', color: C.read}}>{label}</div>
        </div>;
      })}
      {source && sourceAt && <div style={{position: 'absolute', left: sourceAt[0], top: sourceAt[1], opacity: k, fontFamily: MONO, fontSize: 26, color: C.read}}>{source}</div>}
    </>
  );
}
