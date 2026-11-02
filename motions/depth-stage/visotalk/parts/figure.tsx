import {hazed, unit, useLook} from './stage.tsx';

export const meta = {
  name: {en: 'Figure in depth', 'zh-CN': '景深数字'},
  purpose: 'data',
  line: 'A large light serif figure with its unit and label, on the plane of what it measures, counting up as it is said.',
  fits: 'the height of a column, a depth, a distance, a span of years',
  params: {
    x: {type: 'px', default: 180, doc: 'its left edge, at rest'},
    y: {type: 'px', default: 240, doc: 'the top of the figure, at rest'},
    value: {type: 'number', default: 0, doc: 'the figure shown now: tween it to count'},
    decimals: {type: 'number', default: 0, doc: 'digits after the point'},
    prefix: {type: 'text', default: '', doc: 'before the figure, such as a tilde or a sign'},
    unit: {type: 'text', default: '', doc: 'after the figure, smaller: km, m, hours'},
    label: {type: 'text', default: '', doc: 'one short line under it'},
    size: {type: 'px', default: 210, doc: 'the figure\'s height'},
    show: {type: 'progress', default: 1, doc: '0 lost in the haze, 1 in focus'},
  },
  preview: 15.0,
};

export function Figure({x = 180, y = 240, value = 0, decimals = 0, prefix = '', unit: suffix = '', label = '', size = 210, show = 1}: {
  x?: number; y?: number; value?: number; decimals?: number; prefix?: string; unit?: string; label?: string; size?: number; show?: number;
}) {
  const {fog} = useLook();
  const s = unit(show);
  const text = value.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 1200, opacity: s, filter: s < 0.99 ? `blur(${((1 - s) * 14).toFixed(1)}px)` : 'none'}}>
      <div style={{fontFamily: 'var(--vt-display)', fontSize: size, fontWeight: 300, lineHeight: 0.9, fontVariantNumeric: 'lining-nums tabular-nums',
        color: hazed('var(--vt-text)', fog * 0.6), whiteSpace: 'nowrap', textShadow: '0 2px 30px rgba(6, 9, 16, 0.5)'}}>
        {prefix}{text}<span style={{fontSize: size * 0.32, fontWeight: 400, marginLeft: size * 0.08, color: hazed('var(--vt-data)', fog * 0.5)}}>{suffix}</span>
      </div>
      {label && <div style={{fontFamily: 'var(--vt-sans)', fontSize: 34, fontWeight: 500, letterSpacing: '0.02em', marginTop: 22, color: hazed('color-mix(in oklab, var(--vt-text), var(--vt-muted) 40%)', fog * 0.5)}}>{label}</div>}
    </div>
  );
}
