import {RED, ink, label, plate, rise, slide, slot, stage} from './package.ts';

export const meta = {
  name: {en: 'Locator', 'zh-CN': '地点条'},
  purpose: 'mark',
  line: 'A place super: red bar, place on a white plate, region and date beneath.',
  fits: 'footage from elsewhere; a dateline',
  params: {
    place: {type: 'text', doc: 'the place, in capitals, a few words'},
    line: {type: 'text', default: '', doc: 'beneath: the region, the country and the date'},
    show: {type: 'progress', default: 1, doc: '0 to 1 over about 1 s: bar, plate shooting out from it, then the strip; back to 0 pulls it off'},
  },
  preview: 41.6,
};

/** A box about 760 × 130 in the top-left corner, under the title-safe line (y 54 or more). */
export function Locator({place, line = '', show = 1}: {place: string; line?: string; show?: number}) {
  const sq = stage(show, 0, 0.25), type = stage(show, 0.3, 0.65);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, display: 'flex', alignItems: 'stretch', filter: 'drop-shadow(0 10px 18px rgba(0, 0, 0, 0.55))'}}>
      <div style={{width: 12, background: RED, transform: `scaleY(${sq.toFixed(3)})`, transformOrigin: 'top', zIndex: 1}} />
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch'}}>
        <div data-vt-camera="" style={slot}>
          <div data-vt-camera="" style={{overflow: 'hidden', ...plate, ...slide(show, 0.1, 0.48), padding: '8px 22px 6px'}}>
            <div style={{...label, fontSize: 50, fontWeight: 800, lineHeight: '56px', whiteSpace: 'nowrap', ...rise(type)}}>{place}</div>
          </div>
        </div>
        {line && <div data-vt-camera="" style={slot}>
          <div style={{...ink, ...slide(show, 0.3, 0.7, 'top'), padding: '8px 22px 9px'}}>
            <div style={{fontFamily: 'var(--vt-sans)', fontWeight: 600, fontSize: 30, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{line}</div>
          </div>
        </div>}
      </div>
    </div>
  );
}
