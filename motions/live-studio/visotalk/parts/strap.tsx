import {RED, Sheen, ink, label, plate, rise, slide, slot, stage} from './package.ts';

export const meta = {
  name: {en: 'Name strap', 'zh-CN': '人名条'},
  purpose: 'term',
  line: 'Lower-third name strap: a red bar, the white plate shoots out from behind it, the role strip follows.',
  fits: 'a host or guest; two in a shot, one each',
  params: {
    name: {type: 'text', doc: 'the name, as it is spelled'},
    role: {type: 'text', default: '', doc: 'the strip beneath: a title, an organisation, a place'},
    tag: {type: 'text', default: '', doc: 'a short red tab on top: HOST, GUEST, LIVE'},
    side: {type: 'text', default: 'left', doc: 'left or right: which edge of the box the bar stands on, toward the frame\'s edge'},
    show: {type: 'progress', default: 1, doc: '0 to 1 over about 1.2 s: bar, plate, name, role, tab, glint; back to 0 pulls it off'},
  },
  preview: 3.8,
};

/** A box about 640 × 190 on the lower third; the strap hugs its `side` and its bottom. */
export function Strap({name, role = '', tag = '', side = 'left', show = 1}: {name: string; role?: string; tag?: string; side?: string; show?: number}) {
  const right = side === 'right';
  const from = right ? 'right' : 'left';
  const bar = stage(show, 0, 0.22), type = stage(show, 0.25, 0.55), tab = stage(show, 0.45, 0.62);
  return (
    <div style={{position: 'absolute', bottom: 0, [right ? 'right' : 'left']: 0, display: 'flex', flexDirection: right ? 'row-reverse' : 'row', alignItems: 'stretch', filter: 'drop-shadow(0 10px 18px rgba(0, 0, 0, 0.55))'}}>
      <div style={{width: 12, background: RED, transform: `scaleY(${bar.toFixed(3)})`, transformOrigin: 'bottom', zIndex: 1}} />
      <div style={{display: 'flex', flexDirection: 'column', alignItems: right ? 'flex-end' : 'flex-start'}}>
        {tag && <div data-vt-camera="" style={slot}>
          <div style={{...slide(tab, 0, 1, 'bottom'), position: 'relative', background: RED, padding: '6px 14px 5px', ...label, fontSize: 36, color: '#FFFFFF'}}>{tag}<Sheen p={(show - 0.66) / 0.3} /></div>
        </div>}
        <div data-vt-camera="" style={slot}>
          <div data-vt-camera="" style={{...plate, ...slide(show, 0.08, 0.42, from), overflow: 'hidden', padding: '12px 28px 10px'}}>
            <div style={{fontFamily: 'var(--vt-sans)', fontWeight: 800, fontSize: 52, lineHeight: 1.12, letterSpacing: '-0.01em', whiteSpace: 'nowrap', ...rise(type)}}>{name}</div>
          </div>
        </div>
        {role && <div data-vt-camera="" style={slot}>
          <div style={{...ink, ...slide(show, 0.22, 0.56, from), padding: '9px 28px 10px'}}>
            <div style={{fontFamily: 'var(--vt-sans)', fontWeight: 600, fontSize: 30, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{role}</div>
          </div>
        </div>}
      </div>
    </div>
  );
}
