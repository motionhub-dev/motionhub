import {Digits, RED, Sheen, ink, label, plate, slide, slot, stage, wipe} from './package.ts';

export const meta = {
  name: {en: 'Stat block', 'zh-CN': '大数字'},
  purpose: 'data',
  line: 'One figure on a white plate, its digits spinning into place as it is said.',
  fits: 'the figure a story turns on',
  params: {
    value: {type: 'number', default: 0, doc: 'the figure: tween it to its value on its words; the digits roll'},
    places: {type: 'number', default: 1, doc: 'how many digits the board has'},
    unit: {type: 'text', default: '', doc: 'after the figure, in capitals: MONTHS, KM, %'},
    tab: {type: 'text', default: '', doc: 'the red tab: what the figure is'},
    note: {type: 'text', default: '', doc: 'the ink strip below: what it means'},
    show: {type: 'progress', default: 1, doc: '0 to 1: tab, plate, strip push on'},
  },
  preview: 52.4,
};

/** A box about 520 × 330; the block hugs its top-left corner. */
export function Readout({value = 0, places = 1, unit = '', tab = '', note = '', show = 1}: {value?: number; places?: number; unit?: string; tab?: string; note?: string; show?: number}) {
  const t1 = stage(show, 0, 0.3);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', filter: 'drop-shadow(0 12px 22px rgba(0, 0, 0, 0.6))'}}>
      {tab && <div style={{...wipe(t1, 'bottom'), position: 'relative', alignSelf: 'flex-start', background: RED, padding: '8px 18px 6px', ...label, fontSize: 38, fontWeight: 900, color: '#FFFFFF'}}>{tab}<Sheen p={(show - 0.7) / 0.3} /></div>}
      <div data-vt-camera="" style={slot}><div style={{...plate, ...slide(show, 0.15, 0.5), display: 'flex', alignItems: 'flex-end', gap: 16, padding: '14px 30px 16px 22px', borderLeft: `12px solid ${RED}`}}>
        <Digits value={value} places={places} style={{fontFamily: 'var(--vt-display)', fontWeight: 900, fontSize: 160, lineHeight: 1}} />
        {unit && <span style={{...label, fontSize: 64, fontWeight: 800, paddingBottom: 10}}>{unit}</span>}
      </div></div>
      {note && <div data-vt-camera="" style={slot}><div style={{...ink, ...slide(show, 0.35, 0.7, 'top'), padding: '10px 24px 11px 34px'}}>
        <div style={{fontFamily: 'var(--vt-sans)', fontWeight: 600, fontSize: 30, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{note}</div>
      </div></div>}
    </div>
  );
}
