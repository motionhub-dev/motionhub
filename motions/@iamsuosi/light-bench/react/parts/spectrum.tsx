import {WAVES, indexOf} from './optics.ts';

export const meta = {
  name: {en: 'Index card', 'zh-CN': '折射率读数'},
  purpose: 'data',
  line: "A thin row of three colours, each with its wavelength and the refractive index the trace really used.",
  fits: "showing the numbers behind what a beam does",
  params: {
    at: {type: '[x, y]', doc: 'its top left, in px'},
    source: {type: 'string', doc: 'where the figures come from'},
    show: {type: 'progress', default: 1, doc: 'it arrives'},
  },
  preview: 8.6,
};

export function Spectrum({at, source, show = 1}: {at: [number, number]; source?: string; show?: number}) {
  if (show <= 0) return null;
  return (
    <div style={{position: 'absolute', left: at[0], top: at[1], opacity: show, transform: `translateY(${(1 - show) * 8}px)`, fontFamily: 'var(--font-mono)', color: '#B9C2CE', fontSize: 28, lineHeight: '36px'}}>
      <div style={{display: 'flex', gap: 8}}>
        {WAVES.filter((_, i) => i === 0 || i === 3 || i === 6).map((w) => {
          return <div key={w.nm} style={{width: 150}}>
            <div style={{height: 10, background: w.css, marginBottom: 8}} />
            <div style={{color: '#FFFFFF', fontSize: 40, lineHeight: '48px', fontWeight: 700, fontVariantNumeric: 'tabular-nums'}}>{indexOf(w.nm).toFixed(2)}</div>
            <div>{w.nm} nm</div>
          </div>;
        })}
      </div>
      {source && <div style={{marginTop: 6}}>{source}</div>}
    </div>
  );
}
