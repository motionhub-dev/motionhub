import {eyebrow, stage, tag, unit} from './ink.ts';

export const meta = {
  name: {en: 'Figure', 'zh-CN': '数字牌'},
  purpose: 'data',
  line: 'One figure on a tag, counting up on its words, its unit in teal and what it counts above.',
  fits: 'a price, a size or a count the speaker says',
  params: {
    value: {type: 'number', default: 0, doc: 'the number shown: tween it to the figure on its words'},
    decimals: {type: 'number', default: 0, doc: 'digits after the point'},
    prefix: {type: 'text', default: '', doc: 'before the number: a currency sign'},
    unit: {type: 'text', default: '', doc: 'after the number: GB, %, km'},
    label: {type: 'text', default: '', doc: 'what it counts, one short line above'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the tag rises into place'},
  },
  preview: 11.5,
};

export function Figure({value = 0, decimals = 0, prefix = '', unit: suffix = '', label = '', show = 1}: {value?: number; decimals?: number; prefix?: string; unit?: string; label?: string; show?: number}) {
  const rise = stage(show, 0, 1);
  const text = value.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
  return (
    <div style={{...tag, display: 'inline-block', padding: '20px 30px 22px', borderTop: '6px solid var(--vt-data)', opacity: unit(rise * 1.4), transform: `translateY(${(1 - rise) * 24}px)`}}>
      {label && <div style={{...eyebrow, marginBottom: 6}}>{label}</div>}
      <div style={{fontFamily: 'var(--vt-display)', fontWeight: 800, fontSize: 112, lineHeight: 1, color: 'var(--vt-text)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>
        {prefix && <span style={{fontSize: 64, marginRight: 6, color: 'var(--vt-muted)'}}>{prefix}</span>}
        {text}
        {suffix && <span style={{fontSize: 60, marginLeft: 10, color: 'var(--vt-data)'}}>{suffix}</span>}
      </div>
    </div>
  );
}
