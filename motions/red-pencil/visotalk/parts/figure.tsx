export const meta = {
  name: {en: 'Printed figure', 'zh-CN': '印刷数字'},
  purpose: 'data',
  line: 'One quantity set large in the page face, with its unit and a small-capitals line saying what it counts.',
  fits: 'the price as advertised; the total a reader is meant to remember; a number the pencil is about to question',
  params: {
    value: {type: 'number', doc: 'the quantity; tween it to count'},
    decimals: {type: 'number', default: 0, doc: 'digits after the point'},
    prefix: {type: 'text', default: '', doc: 'before the number, set smaller: $'},
    unit: {type: 'text', default: '', doc: 'after the number, set smaller: a month'},
    label: {type: 'text', default: '', doc: 'what it counts, under it'},
    size: {type: 'px', default: 180, doc: 'the number size'},
  },
  preview: 3.2,
};

export function Figure({value, decimals = 0, prefix = '', unit = '', label = '', size = 180}: {value: number; decimals?: number; prefix?: string; unit?: string; label?: string; size?: number}) {
  const shown = value.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
  return (
    <div style={{fontFamily: 'var(--vt-sans)', color: 'var(--vt-text)'}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: Math.round(size * 0.06), fontVariantNumeric: 'tabular-nums lining-nums', lineHeight: 1}}>
        {prefix && <span style={{fontSize: Math.round(size * 0.5), fontWeight: 500}}>{prefix}</span>}
        <span style={{fontSize: size, fontWeight: 600, letterSpacing: '-0.02em'}}>{shown}</span>
        {unit && <span style={{fontSize: Math.round(size * 0.24), fontStyle: 'italic', color: 'var(--vt-muted)'}}>{unit}</span>}
      </div>
      {label && <div style={{fontSize: 24, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--vt-muted)', marginTop: 18}}>{label}</div>}
    </div>
  );
}
