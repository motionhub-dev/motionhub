// Kiln, an invented photo library app, drawn for Screen Desk's sample. Every coordinate here is in desk pixels, so the sample's camera, rings and pins can name them.
import {Lift} from '../../parts/lift.tsx';

const unit = (v: number) => Math.max(0, Math.min(1, v));

// the window on the desk
export const WIN = {x: 300, y: 70, w: 1320, h: 640};
const TOP = WIN.y + 52;              // the top of the window's content, under its title bar
const SIDE = 280;                    // the sidebar's width
const PANE_X = WIN.x + SIDE + 56;    // where the pane's text starts
const PANE_R = WIN.x + WIN.w - 56;   // where its controls end

const NAV_TOP = TOP + 96;
const NAV_H = 56;
export const navItem = (i: number) => ({x: WIN.x + 16, y: NAV_TOP + i * NAV_H, w: SIDE - 32, h: 48});

const ROW_TOP = TOP + 170;
const ROW_H = 98;
export const row = (i: number) => ({x: PANE_X - 24, y: ROW_TOP + i * ROW_H, w: PANE_R - PANE_X + 48, h: ROW_H});
// the controls a ring is drawn round
export const CHOOSE = {x: PANE_R - 150, y: ROW_TOP + 23, w: 150, h: 52};
export const FIELD = {x: PANE_R - 150 - 16 - 340, y: ROW_TOP + 23, w: 340, h: 52};
export const TOGGLE = {x: PANE_R - 80, y: ROW_TOP + ROW_H + 26, w: 80, h: 46};
export const TIME = {x: PANE_R - 210, y: ROW_TOP + 2 * ROW_H + 23, w: 210, h: 52};

const SETTINGS_NAV = ['General', 'Library', 'Backups', 'Sharing', 'Advanced'];
const LIBRARY_NAV = ['Library', 'Collections', 'Starred', 'Imports', 'Shared'];

// the library's photographs: soft invented landscapes, not pictures of anything real
const PHOTOS = [
  ['#C9D6E3', '#8FA7BC', '#5F7385'], ['#EAD9C6', '#C9A88A', '#8C6E57'], ['#D3E0D2', '#9DB59B', '#62785F'], ['#E3D7E6', '#B6A3BE', '#7E6C88'],
  ['#E8E2D0', '#C3B78F', '#857A55'], ['#CFE0E4', '#8DB2BA', '#567A82'], ['#E9D3CF', '#C99A92', '#8E615A'], ['#DADCE3', '#A6AAB8', '#6C7080'],
  ['#D8E3D8', '#A9BFA4', '#6F8A6A'], ['#E6DFD3', '#BFAE95', '#86765F'], ['#D5DCE8', '#97A6C2', '#5E6D8C'], ['#E8DCCB', '#CFB08A', '#946F48'],
];

function Photo({c, i}: {c: string[]; i: number}) {
  // one painted box (sky, sun and two ridges as gradients), so nothing of it is measured past the frame when the camera has moved on
  const h1 = 44 + ((i * 37) % 16), h2 = 64 + ((i * 53) % 12), sun = 18 + ((i * 29) % 60);
  return (
    <div style={{width: '100%', height: '100%', borderRadius: 10, background: [
      `radial-gradient(circle at ${sun}% 24%, rgba(255,255,255,0.85) 0 7%, transparent 7.6%)`,
      `radial-gradient(90% 60% at 80% ${h2 + 52}%, ${c[2]} 0 98%, transparent 99%)`,
      `radial-gradient(85% 60% at 25% ${h1 + 50}%, ${c[1]} 0 98%, transparent 99%)`,
      `linear-gradient(180deg, #FFFFFF 0%, ${c[0]} 70%)`,
    ].join(', ')}} />
  );
}

function Toggle({on, left, top}: {on: number; left: number; top: number}) {
  const o = unit(on);
  return (
    <div style={{position: 'absolute', left, top, width: TOGGLE.w, height: TOGGLE.h, borderRadius: 23,
      background: `color-mix(in srgb, var(--vt-text) ${Math.round(o * 100)}%, #D9D7D1)`}}>
      <div style={{position: 'absolute', top: 4, left: 4 + 34 * o, width: 38, height: 38, borderRadius: 19, background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.22)'}} />
    </div>
  );
}

const label = {position: 'absolute' as const, fontFamily: 'var(--vt-sans)', fontSize: 26, color: 'var(--vt-text)'};
const control = {position: 'absolute' as const, boxSizing: 'border-box' as const, display: 'flex', alignItems: 'center', fontFamily: 'var(--vt-sans)', fontSize: 23, borderRadius: 11};

/**
 * The window's content. `settings` crosses from the library (0) to Settings (1); `pane` from General (0) to Backups (1);
 * `drive` fills the destination; `on` turns the nightly backup on; `lift` raises its row; `done` records the first backup.
 */
export function Kiln({settings = 0, pane = 0, drive = 0, on = 0, lift = 0, done = 0}: {settings?: number; pane?: number; drive?: number; on?: number; lift?: number; done?: number}) {
  const s = unit(settings);
  const nav = s > 0.5 ? SETTINGS_NAV : LIBRARY_NAV;
  const sel = s > 0.5 ? (pane > 0.5 ? 2 : 0) : 0;
  const d = unit(drive);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}>
      {/* sidebar */}
      <div style={{position: 'absolute', left: WIN.x, top: TOP, width: SIDE, height: WIN.h - 52, background: 'var(--vt-panel2)', borderRight: '1px solid var(--vt-border)', borderBottomLeftRadius: 16}}>
        <div style={{position: 'absolute', left: 28, top: 30, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--vt-sans)', fontSize: 24, fontWeight: 700, color: 'var(--vt-text)'}}>
          <div style={{width: 34, height: 34, borderRadius: 9, background: 'var(--vt-text)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19}}>K</div>
          {s > 0.5 ? 'Settings' : 'Kiln'}
        </div>
      </div>
      {nav.map((name, i) => {
        const r = navItem(i);
        const on = i === sel;
        return (
          <div key={name} style={{...control, left: r.x, top: r.y, width: r.w, height: r.h, padding: '0 16px', fontSize: 24,
            background: on ? 'var(--vt-panel)' : 'transparent', boxShadow: on ? '0 1px 3px rgba(38,36,30,0.12), 0 0 0 1px rgba(38,36,30,0.05)' : 'none',
            color: on ? 'var(--vt-text)' : 'var(--vt-muted)', fontWeight: on ? 700 : 400}}>{name}</div>
        );
      })}

      {/* the library */}
      {s < 0.999 && (
        <div style={{position: 'absolute', left: WIN.x + SIDE, top: TOP, width: WIN.w - SIDE, height: WIN.h - 52, opacity: 1 - s}}>
          <div style={{position: 'absolute', left: 40, top: 30, fontFamily: 'var(--vt-sans)', fontSize: 34, fontWeight: 700, color: 'var(--vt-text)'}}>Library</div>
          <div style={{position: 'absolute', right: 40, top: 40, fontFamily: 'var(--vt-sans)', fontSize: 22, color: 'var(--vt-muted)'}}>12,480 photos</div>
          <div style={{position: 'absolute', left: 40, right: 40, top: 100, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: 146, gap: 14}}>
            {PHOTOS.map((c, i) => <Photo key={i} c={c} i={i} />)}
          </div>
        </div>
      )}

      {/* Settings: General, then Backups */}
      {s > 0.001 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: s}}>
          <div style={{position: 'absolute', left: PANE_X, top: TOP + 44, fontFamily: 'var(--vt-sans)', fontSize: 38, fontWeight: 700, color: 'var(--vt-text)'}}>{pane > 0.5 ? 'Backups' : 'General'}</div>
          <div style={{position: 'absolute', left: PANE_X, top: TOP + 100, fontFamily: 'var(--vt-sans)', fontSize: 23, color: 'var(--vt-muted)'}}>
            {pane > 0.5 ? 'Copy your whole library to another drive, on a schedule.' : 'How Kiln opens and imports your photos.'}
          </div>
          {pane > 0.5 ? (
            <>
              {[0, 1, 2, 3].map((i) => <div key={i} style={{position: 'absolute', left: PANE_X, width: PANE_R - PANE_X, top: row(i).y + ROW_H - 1, height: 1, background: 'var(--vt-border)'}} />)}
              <div style={{...label, left: PANE_X, top: row(0).y + 32}}>Destination</div>
              <div style={{...control, left: FIELD.x, top: FIELD.y, width: FIELD.w, height: FIELD.h, padding: '0 16px', gap: 12, background: 'var(--vt-panel2)', border: '1px solid var(--vt-border)',
                color: d > 0.5 ? 'var(--vt-text)' : 'var(--vt-muted)'}}>
                <div style={{flex: 'none', position: 'relative', width: 22, height: 13, border: '2px solid currentColor', borderRadius: 4}}><div style={{position: 'absolute', right: 3, top: 4.5, width: 4, height: 4, borderRadius: 2, background: 'currentColor'}} /></div>
                <span style={{opacity: d > 0.5 ? unit((d - 0.5) * 3) : 1}}>{d > 0.5 ? 'Backup Drive' : 'None chosen'}</span>
              </div>
              <div style={{...control, left: CHOOSE.x, top: CHOOSE.y, width: CHOOSE.w, height: CHOOSE.h, justifyContent: 'center', background: 'var(--vt-panel)', border: '1px solid var(--vt-faint)', color: 'var(--vt-text)'}}>Choose…</div>

              <div style={{position: 'absolute', left: row(1).x, top: row(1).y + 6, width: row(1).w, height: ROW_H - 12}}>
                <Lift lift={lift}>
                  <div style={{position: 'relative', height: ROW_H - 12}}>
                    <div style={{...label, left: 24, top: 16}}>Back up every night</div>
                    <div style={{...label, left: 24, top: 50, fontSize: 20, color: 'var(--vt-muted)'}}>Only new and changed photos are copied</div>
                    <Toggle on={on} left={TOGGLE.x - row(1).x} top={TOGGLE.y - row(1).y - 6} />
                  </div>
                </Lift>
              </div>

              <div style={{...label, left: PANE_X, top: row(2).y + 32}}>Time</div>
              <div style={{...control, left: TIME.x, top: TIME.y, width: TIME.w, height: TIME.h, padding: '0 16px', justifyContent: 'space-between', background: 'var(--vt-panel)', border: '1px solid var(--vt-faint)', color: 'var(--vt-text)'}}>
                <span>2:00 AM</span><div style={{width: 9, height: 9, marginTop: -5, borderRight: '2px solid currentColor', borderBottom: '2px solid currentColor', transform: 'rotate(45deg)'}} />
              </div>
              <div style={{...label, left: PANE_X, top: row(3).y + 32}}>Last backup</div>
              <div style={{...label, left: PANE_R - 300, width: 300, textAlign: 'right', top: row(3).y + 32, color: done > 0.5 ? 'var(--vt-good)' : 'var(--vt-muted)'}}>{done > 0.5 ? 'Today, 2:00 AM' : 'Never'}</div>
            </>
          ) : (
            <>
              {[['Open at login', 'On'], ['Import from', 'Pictures folder'], ['Keep originals', 'Always'], ['Appearance', 'Light']].map(([k, v], i) => (
                <div key={k}>
                  <div style={{position: 'absolute', left: PANE_X, width: PANE_R - PANE_X, top: row(i).y + ROW_H - 1, height: 1, background: 'var(--vt-border)'}} />
                  <div style={{...label, left: PANE_X, top: row(i).y + 32}}>{k}</div>
                  <div style={{...label, left: PANE_R - 300, width: 300, textAlign: 'right', top: row(i).y + 32, color: 'var(--vt-muted)'}}>{v}</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
