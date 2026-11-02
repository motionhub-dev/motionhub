import {litStyle} from './light.ts';

export const meta = {
  name: {en: 'Numeral', 'zh-CN': '大数字'},
  purpose: 'data',
  line: 'One figure set very large in the condensed face, counting up to its value, with its unit and what it counts.',
  fits: 'a count, a price or a size that the scene is about; two of them side by side, one in the light',
  params: {
    value: {type: 'number', doc: 'the figure; tween it to count'},
    decimals: {type: 'number', default: 0, doc: 'digits after the point'},
    prefix: {type: 'text', default: '', doc: 'before it: $'},
    unit: {type: 'text', default: '', doc: 'after it, smaller: billion'},
    label: {type: 'text', default: '', doc: 'what it counts, small, under it'},
    size: {type: 'px', default: 240, doc: 'the figure\'s height'},
    lit: {type: 'progress', default: 1, doc: '1 in the light, 0 in the shadow'},
    accent: {type: 'boolean', default: false, doc: 'the figure in the light\'s colour: the one figure a scene is about'},
  },
  preview: 6,
};

export function Numeral({value, decimals = 0, prefix = '', unit = '', label = '', size = 240, lit = 1, accent = false}: {value: number; decimals?: number; prefix?: string; unit?: string; label?: string; size?: number; lit?: number; accent?: boolean}) {
  const shown = value.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
  return (
    <div style={{...litStyle(lit), color: accent ? 'var(--vt-data)' : 'var(--vt-text)'}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: Math.round(size * 0.05), fontFamily: 'var(--vt-display)', fontWeight: 800, lineHeight: 0.9, fontVariantNumeric: 'tabular-nums'}}>
        {prefix && <span style={{fontSize: Math.round(size * 0.55)}}>{prefix}</span>}
        <span style={{fontSize: size, letterSpacing: '-0.01em'}}>{shown}</span>
        {unit && <span style={{fontSize: Math.round(size * 0.3), fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em'}}>{unit}</span>}
      </div>
      {label && <div style={{fontFamily: 'var(--vt-sans)', fontSize: 30, color: 'var(--vt-muted)', marginTop: Math.round(size * 0.1), letterSpacing: '0.02em'}}>{label}</div>}
    </div>
  );
}
