import {Video} from '@visotalk/runtime';
import {RED, ink, label, plate, rise, slide, slot, stage} from './package.ts';

export const meta = {
  name: {en: 'Picture in picture', 'zh-CN': '画中画'},
  purpose: 'transition',
  line: 'A second clip swings open in a framed window as someone or somewhere is mentioned, named on its strap.',
  fits: 'someone mentioned who is not in the shot; a place',
  params: {
    asset: {type: 'text', doc: 'the second clip\'s video asset id (muted: the recording is the sound)'},
    start: {type: 'number', default: 0, doc: 'the scene second at which the clip\'s first frame would show'},
    name: {type: 'text', default: '', doc: 'the strap under the window: who or what it shows'},
    role: {type: 'text', default: '', doc: 'a line beside the name: a title, a place'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the line draws, the window opens, the strap pushes on; back to 0 closes it'},
  },
  preview: 18.4,
};

/** The window fills the part's box but its last 34 px, where the strap hangs off its bottom-left corner: for a 4:3 window 424 wide, h={352}. */
export function Pip({asset, start = 0, name = '', role = '', show = 1}: {asset: string; start?: number; name?: string; role?: string; show?: number}) {
  const line = stage(show, 0, 0.3), open = stage(show, 0.2, 0.7), strap = stage(show, 0.55, 0.9), type = stage(show, 0.65, 1);
  if (show <= 0) return null;
  const half = ((1 - open) * 50).toFixed(2), swing = ((1 - open) * 58).toFixed(2);
  return (
    <div style={{position: 'absolute', inset: 0, perspective: 1400}}>
      <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 34, clipPath: `inset(${half}% 0 ${half}% 0)`, transform: `rotateY(-${swing}deg)`, transformOrigin: 'right center', background: '#000', boxShadow: '0 30px 60px -24px rgba(0, 0, 0, 0.95)', outline: '3px solid var(--vt-text)', outlineOffset: -3}}>
        <Video asset={asset} start={start} fit="cover" />
        <div style={{position: 'absolute', left: 0, right: 0, top: `${half}%`, height: 6, background: RED}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 'calc(50% - 17px)', height: 4, marginTop: -2, background: RED, transform: `scaleX(${line.toFixed(3)})`, transformOrigin: 'left', opacity: 1 - open}} />
      {name && (
        <div style={{position: 'absolute', left: 0, bottom: 0, display: 'flex', alignItems: 'stretch'}}>
          <div style={{width: 12, background: RED, transform: `scaleY(${strap.toFixed(3)})`, transformOrigin: 'bottom', zIndex: 1}} />
          <div data-vt-camera="" style={slot}><div data-vt-camera="" style={{overflow: 'hidden', ...plate, ...slide(show, 0.6, 0.88), padding: '8px 20px 7px'}}>
            <div style={{fontFamily: 'var(--vt-sans)', fontWeight: 800, fontSize: 36, lineHeight: 1.1, whiteSpace: 'nowrap', ...rise(type)}}>{name}</div>
          </div></div>
          {role && <div data-vt-camera="" style={slot}><div style={{...ink, ...slide(show, 0.72, 0.96), height: '100%', padding: '0 18px', display: 'flex', alignItems: 'center'}}>
            <span style={{...label, fontSize: 34, fontWeight: 700, whiteSpace: 'nowrap'}}>{role}</span>
          </div></div>}
        </div>
      )}
    </div>
  );
}
