import {C, SANS, MONO, glide, smooth} from './night.ts';

export const meta = {
  name: {en: 'Reading card', 'zh-CN': '读数卡'},
  purpose: 'data',
  line: "A dark glass card with one measured number: what it is, the figure rolling up, a comparison, and its source.",
  fits: "the one number a scene is about; one on screen at a time",
  params: {
    at: {type: '[x, y]', doc: 'its top left'},
    label: {type: 'string', doc: 'what is measured'},
    value: {type: 'number', doc: 'the figure'},
    unit: {type: 'string', default: "''", doc: 'printed after the figure'},
    prefix: {type: 'string', default: "''", doc: 'printed before the figure: about, up to'},
    note: {type: 'string', doc: 'what to compare it with'},
    source: {type: 'string', doc: 'where it comes from, small'},
    color: {type: 'string', doc: 'the colour of the figure: the same as what it measures'},
    show: {type: 'progress', default: 1, doc: 'the card arrives'},
    roll: {type: 'progress', default: 1, doc: 'the figure counts up to its value'},
  },
  preview: 17.5,
};

const group = (v: number) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export function Reading({at, label, value, unit = '', prefix = '', note, source, color = C.ink, show = 1, roll = 1}: {at: [number, number]; label: string; value: number; unit?: string; prefix?: string; note?: string; source?: string; color?: string; show?: number; roll?: number}) {
  const k = glide(show);
  if (k <= 0) return null;
  return (
    <div style={{position: 'absolute', left: at[0], top: at[1], padding: '22px 30px', borderRadius: 14, background: 'rgba(5, 10, 32, 0.86)', border: `2px solid ${C.line}`, fontFamily: SANS, opacity: k, transform: `translateY(${(1 - k) * 18}px)`, whiteSpace: 'nowrap'}}>
      <div style={{fontSize: 30, color: C.read}}>{label}</div>
      <div style={{fontSize: 104, fontWeight: 800, lineHeight: 1.1, color, fontVariantNumeric: 'tabular-nums'}}>
        {prefix && <span style={{fontSize: 56, fontWeight: 600, marginRight: 14}}>{prefix}</span>}{group(value * smooth(roll))}{unit && <span style={{fontSize: 64, fontWeight: 700, marginLeft: 8}}>{unit}</span>}
      </div>
      {note && <div style={{fontSize: 28, color: C.read}}>{note}</div>}
      {source && <div style={{fontFamily: MONO, fontSize: 28, color: C.read, marginTop: 8}}>{source}</div>}
    </div>
  );
}
