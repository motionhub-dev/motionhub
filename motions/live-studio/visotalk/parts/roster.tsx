import {RED, ink, label, plate, rise, slide, slot, stage, unit, wipe} from './package.ts';

export const meta = {
  name: {en: 'Roster', 'zh-CN': '名单条'},
  purpose: 'steps',
  line: 'A roll call: per name, a red number drops and the plate shoots out.',
  fits: 'a crew, a panel, a line-up',
  params: {
    title: {type: 'text', default: '', doc: 'the red tab over the list: CREW, PANEL, FINALISTS'},
    names: {type: 'list', doc: 'the names, surnames or as they are known'},
    roles: {type: 'list', default: [], doc: 'a short line beside each: a role, a team, a country'},
    shown: {type: 'number', default: 0, doc: 'straps open: tween it from n to n + 1 on each name'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the tab; back to 0 pulls the whole roll off'},
  },
  preview: 35,
};

/** A box about 640 wide and 110 a name, on the free side of the shot; the roll hangs from its top-left corner. */
export function Roster({title = '', names, roles = [], shown = 0, show = 1}: {title?: string; names: string[]; roles?: string[]; shown?: number; show?: number}) {
  const t1 = stage(show, 0, 1);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, filter: 'drop-shadow(0 10px 18px rgba(0, 0, 0, 0.6))'}}>
      {title && <div style={{...wipe(t1, 'bottom'), background: RED, padding: '8px 18px 6px', ...label, fontSize: 38, fontWeight: 900, color: '#FFFFFF', marginBottom: 2}}>{title}</div>}
      <div style={{display: 'grid', gridTemplateColumns: '64px auto auto', rowGap: 10}}>
        {names.map((n, i) => {
          const p = Math.min(unit(shown - i), t1);
          const type = stage(p, 0.3, 0.8);
          return [
            <div key={`n${i}`} style={{...slide(p, 0, 0.35, 'top'), background: RED, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', ...label, fontSize: 48, fontWeight: 900, color: '#FFFFFF'}}>{i + 1}</div>,
            <div key={`p${i}`} data-vt-camera="" style={slot}><div data-vt-camera="" style={{overflow: 'hidden', ...plate, ...slide(p, 0.1, 0.6), padding: '6px 24px 4px', height: '100%', boxSizing: 'border-box'}}>
              <div style={{...label, fontSize: 64, fontWeight: 800, lineHeight: '72px', letterSpacing: '0.02em', whiteSpace: 'nowrap', ...rise(type)}}>{n}</div>
            </div></div>,
            <div key={`r${i}`} data-vt-camera="" style={slot}><div style={{...ink, ...slide(p, 0.3, 0.8), padding: '0 22px', height: '100%', display: 'flex', alignItems: 'center', opacity: roles[i] ? 1 : 0}}>
              <span style={{fontFamily: 'var(--vt-sans)', fontWeight: 600, fontSize: 30, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{roles[i] ?? ''}</span>
            </div></div>,
          ];
        })}
      </div>
    </div>
  );
}
