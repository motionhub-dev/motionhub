import {TONE, ease, strokeOutline} from './ink.ts';

export const meta = {
  name: {en: 'Era mark', 'zh-CN': '纪年'},
  purpose: 'data',
  line: 'A date on the line of time: a short dark stroke, the year in figures and the place in a column below.',
  fits: 'each stop of a history or a journey; a reign, a founding, an invention',
  params: {
    year: {type: 'text', doc: 'the year in figures, as it is said (105, 751, about 1150)'},
    unit: {type: 'text', default: '年', doc: 'written small after the figures'},
    place: {type: 'text', default: '', doc: 'where, written as a column under the year'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the stroke, then the year, then the place'},
    size: {type: 'px', default: 64, doc: 'the figures\' size; the place is about half of it'},
  },
  preview: 27,
};

export function Era({year, unit = '年', place = '', show = 1, size = 64}: {year: string; unit?: string; place?: string; show?: number; size?: number}) {
  const tick = ease(show, 0, 0.35), figures = ease(show, 0.25, 0.65), where = ease(show, 0.55, 1);
  const soak = (p: number, tone = 1) => ({opacity: p * tone, filter: p < 1 ? `blur(${((1 - p) * 3).toFixed(2)}px)` : undefined});
  return (
    <div style={{position: 'absolute', left: 0, top: 0, display: 'flex', alignItems: 'flex-start', gap: size * 0.28}}>
      <svg width={24} height={size * 1.6} viewBox={`0 0 24 ${size * 1.6}`} style={{overflow: 'visible', flex: 'none'}}>
        <path d={strokeOutline([[12, 0], [11, size * 0.8], [12, size * 1.6]], 9, tick, 31)} fill="var(--vt-text)" fillOpacity={TONE.thick} />
      </svg>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: size * 0.2, color: 'var(--vt-text)'}}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: size * 0.08, whiteSpace: 'nowrap', ...soak(figures)}}>
          <span style={{fontFamily: 'var(--vt-sans)', fontSize: size, fontWeight: 500, lineHeight: 1, opacity: TONE.burnt, fontVariantNumeric: 'oldstyle-nums'}}>{year}</span>
          <span style={{fontFamily: 'var(--vt-display)', fontSize: size * 0.46, opacity: TONE.thick}}>{unit}</span>
        </div>
        {place && <div style={{writingMode: 'vertical-rl', fontFamily: 'var(--vt-display)', fontSize: Math.round(size * 0.52), letterSpacing: '0.14em', lineHeight: 1.2, marginLeft: size * 0.06, ...soak(where, TONE.thick)}}>{place}</div>}
      </div>
    </div>
  );
}
