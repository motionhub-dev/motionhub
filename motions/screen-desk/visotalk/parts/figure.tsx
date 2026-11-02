import {RESTING} from './window.tsx';

export const meta = {
  name: {en: 'Figure card', 'zh-CN': '数字卡'},
  purpose: 'data',
  line: 'A white card on the desk: one large figure counting to its value, what it counts, and the figure it replaces struck through.',
  fits: 'what a feature buys: minutes saved, files not copied, a price; one figure a card',
  params: {
    value: {type: 'number', default: 0, doc: 'the figure now; tween it to count'},
    unit: {type: 'text', default: '', doc: 'after the figure, small: "min", "MB", "photos"'},
    label: {type: 'text', doc: 'what it counts, a few words'},
    was: {type: 'text', default: '', doc: 'the figure it replaces, struck through, with its own few words'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the card is set down from above'},
    width: {type: 'px', default: 600, doc: 'the card\'s width in desk pixels'},
  },
  preview: 50.4,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));
const backOut = (t: number) => { const c = 1.5; const u = unit(t) - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
const grouped = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export function Figure({value = 0, unit: suffix = '', label, was = '', show = 1, width = 600}: {value?: number; unit?: string; label: string; was?: string; show?: number; width?: number}) {
  const s = unit(show);
  return (
    <div style={{width, boxSizing: 'border-box', padding: '34px 40px 38px', borderRadius: 22, background: 'var(--vt-panel)', boxShadow: RESTING, fontFamily: 'var(--vt-sans)', color: 'var(--vt-text)',
      opacity: unit(s * 4), transformOrigin: '30% 70%', transform: `translateY(${(-60 * (1 - backOut(s))).toFixed(1)}px) scale(${(1 + 0.2 * (1 - backOut(s))).toFixed(4)}) rotate(${(1.6 - 4 * (1 - s)).toFixed(2)}deg)`}}>
      <div style={{fontFamily: 'var(--vt-mono)', fontSize: 22, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--vt-data)'}}>{label}</div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 14}}>
        <div style={{fontSize: 150, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums'}}>{grouped(value)}</div>
        {suffix && <div style={{fontSize: 40, fontWeight: 700, color: 'var(--vt-muted)'}}>{suffix}</div>}
      </div>
      {was && <div style={{marginTop: 18, fontSize: 30, color: 'var(--vt-muted)'}}><span style={{textDecoration: 'line-through', textDecorationThickness: 3}}>{was.split(' ')[0]}</span> {was.split(' ').slice(1).join(' ')}</div>}
    </div>
  );
}
