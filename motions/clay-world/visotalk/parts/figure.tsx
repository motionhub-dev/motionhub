// A figure in thick clay numerals that counts up as it is said, its unit pressed on smaller beside it and a short line under it; it drops
// on and lands with a squash, like the clay letters of a title.
import {unit} from './world.tsx';

export const meta = {
  name: {en: 'Clay figure', 'zh-CN': '黏土数字'},
  purpose: 'data',
  line: 'A large figure in rounded clay numerals that drops on with a squash and counts up, with its unit and a short line.',
  fits: 'how long, how many, how big: the one figure a sentence turns on',
  params: {
    x: {type: 'px', default: 160, doc: 'its left edge'},
    y: {type: 'px', default: 180, doc: 'the top of the figure'},
    value: {type: 'number', default: 0, doc: 'the figure shown now: tween it to count'},
    decimals: {type: 'number', default: 0, doc: 'digits after the point'},
    unit: {type: 'text', default: '', doc: 'after the figure, smaller: days, kg, times'},
    label: {type: 'text', default: '', doc: 'one short line under it'},
    size: {type: 'px', default: 200, doc: 'the figure\'s height'},
    color: {type: 'text', default: 'data', doc: 'the clay of the numerals: a colour token'},
    show: {type: 'progress', default: 1, doc: '0 none, 1 landed'},
  },
  preview: 17.8,
};

export function Figure({x = 160, y = 180, value = 0, decimals = 0, unit: suffix = '', label = '', size = 200, color = 'data', show = 1}: {
  x?: number; y?: number; value?: number; decimals?: number; unit?: string; label?: string; size?: number; color?: string; show?: number;
}) {
  const s = unit(show);
  if (s <= 0) return null;
  const text = value.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
  const ink = `var(--vt-${color})`;
  const side = `color-mix(in oklab, ${ink}, #2a140c 32%)`;
  const fall = Math.min(1, s / 0.45), q = Math.max(0, (s - 0.45) / 0.55);
  const yy = (1 - fall * fall) * -size * 0.8;
  const sq = s < 0.45 ? 1.1 : 1 - 0.26 * Math.sin(Math.min(1, q * 2.4) * Math.PI) * Math.exp(-2.5 * q);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 1200}}>
      <div style={{display: 'inline-block', transform: `translateY(${yy.toFixed(1)}px) scale(${(1 / Math.sqrt(sq)).toFixed(3)}, ${sq.toFixed(3)})`, transformOrigin: '30% 90%',
        opacity: unit(s * 6), fontFamily: 'var(--vt-display)', fontSize: size, fontWeight: 700, lineHeight: 0.95, color: ink, whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums', textShadow: `0 ${Math.round(size * 0.045)}px 0 ${side}, 0 ${Math.round(size * 0.1)}px ${Math.round(size * 0.12)}px rgba(70, 40, 30, 0.26)`}}>
        {text}{suffix && <span style={{fontSize: size * 0.34, fontWeight: 600, marginLeft: size * 0.1, color: 'var(--vt-text)', textShadow: '0 4px 0 color-mix(in oklab, var(--vt-text), #000 30%), 0 8px 14px rgba(70, 40, 30, 0.22)'}}>{suffix}</span>}
      </div>
      {label && <div style={{fontFamily: 'var(--vt-sans)', fontSize: 38, fontWeight: 500, marginTop: 18, color: 'var(--vt-text)', opacity: unit((s - 0.5) * 3)}}>{label}</div>}
    </div>
  );
}
