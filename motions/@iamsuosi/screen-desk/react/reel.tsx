// Screen Desk's reel: twenty-odd seconds of its components at a brisk pace, for a player. Not a template: read it for how the parts move.
// One desk under one camera, as in the sample: Kiln (an invented photo app, drawn here in a few greys) set down, three steps ringed and pinned,
// a terminal to check it, a phone in the morning, and the change wiped from before to now.
import type {CSSProperties} from 'react';
import {Easing, useTime} from '@motionhub/runtime';
import {Desk} from './parts/desk.tsx';
import {AppWindow} from './parts/window.tsx';
import {TitleCard} from './parts/title.tsx';
import {Keys} from './parts/keys.tsx';
import {Cursor} from './parts/cursor.tsx';
import {Ring} from './parts/ring.tsx';
import {Step} from './parts/step.tsx';
import {Lift, LIFT_SCALE} from './parts/lift.tsx';
import {Terminal} from './parts/terminal.tsx';
import {Phone} from './parts/phone.tsx';
import {Wipe} from './parts/wipe.tsx';
import {Figure} from './parts/figure.tsx';

export const reel = {seconds: 22, width: 1920, height: 1080};
/** What happens when, for the motion's sound (sound.json): the window lands, keys press, the camera flies control to control, rings draw, toggles click, the phone lands, the change wipes */
export const cues = [
  {at: 0.0, role: 'move', dur: 2.4}, {at: 0.8, role: 'land'}, {at: 1.2, role: 'land'}, {at: 2.8, role: 'draw', dur: 0.8}, {at: 3.6, role: 'cut'},
  {at: 3.7, role: 'move', dur: 1.2}, {at: 5.15, role: 'cut'}, {at: 5.2, role: 'draw', dur: 1.1}, {at: 6.3, role: 'move', dur: 1.2}, {at: 7.3, role: 'draw', dur: 1.1},
  {at: 8.6, role: 'count'}, {at: 9.0, role: 'move', dur: 1.0}, {at: 9.9, role: 'land'}, {at: 10.95, role: 'count'}, {at: 12.3, role: 'move', dur: 1.3},
  {at: 13.4, role: 'land'}, {at: 13.5, role: 'draw', dur: 0.9}, {at: 15.3, role: 'draw', dur: 0.9}, {at: 15.8, role: 'count'}, {at: 16.2, role: 'move', dur: 1.4},
  {at: 17.0, role: 'land'}, {at: 17.4, role: 'count'}, {at: 18.3, role: 'move', dur: 1.3}, {at: 20.0, role: 'count'}, {at: 20.9, role: 'count'},
];

type Ease = (x: number) => number;
const unit = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => { const u = unit(v); return u * u * (3 - 2 * u); };
const backOut = (v: number, c = 1.4) => { const u = unit(v) - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
const fly: Ease = Easing.bezier(0.55, 0, 0.18, 1), crane: Ease = Easing.bezier(0.45, 0, 0.15, 1), lin: Ease = Easing.linear, sine: Ease = Easing.inOutSine;

/** A prop's value at t: `base`, then each move [start, duration, value, easing] in turn, each starting from where the last one ended */
function track(t: number, base: number, ...moves: Array<[number, number, number, Ease?]>) {
  let v = base;
  for (const [a, d, to, e = sine] of moves) {
    if (t <= a) break;
    v = v + (to - v) * e(unit((t - a) / d));
  }
  return v;
}

// Kiln's window on the desk, in desk pixels
const WIN = {x: 300, y: 70, w: 1320, h: 640};
const TOP = WIN.y + 52, SIDE = 280, PANE_X = WIN.x + SIDE + 56, PANE_R = WIN.x + WIN.w - 56;
const navItem = (i: number) => ({x: WIN.x + 16, y: TOP + 96 + i * 56, w: SIDE - 32, h: 48});
const ROW_TOP = TOP + 170, ROW_H = 98;
const row = (i: number) => ({x: PANE_X - 24, y: ROW_TOP + i * ROW_H, w: PANE_R - PANE_X + 48, h: ROW_H});
const CHOOSE = {x: PANE_R - 150, y: ROW_TOP + 23, w: 150, h: 52};
const FIELD = {x: PANE_R - 150 - 16 - 340, y: ROW_TOP + 23, w: 340, h: 52};
const TOGGLE = {x: PANE_R - 80, y: ROW_TOP + ROW_H + 26, w: 80, h: 46};
const PANE = {x: WIN.x + SIDE, y: TOP, w: WIN.w - SIDE, h: WIN.h - 52};
const TERM = {x: 1400, y: 400, w: 1000, h: 440};
const PHONE = {x: 1935, y: 90};

const SETTINGS_NAV = ['General', 'Library', 'Backups', 'Sharing', 'Advanced'];
const LIBRARY_NAV = ['Library', 'Collections', 'Starred', 'Imports', 'Shared'];
const OUTPUT = ['Destination  Backup Drive', 'Schedule  every night, 2:00 AM', 'Library  12,480 photos', '✓ Ready. Next run tonight at 2:00 AM.'];

const text: CSSProperties = {position: 'absolute', fontFamily: 'var(--font-sans)', fontSize: 26, color: 'var(--color-text)'};
const control: CSSProperties = {position: 'absolute', boxSizing: 'border-box', display: 'flex', alignItems: 'center', fontFamily: 'var(--font-sans)', fontSize: 23, borderRadius: 11};

/** a rect in the row Lift raises, where it is drawn while raised, so a ring round it fits */
const lifted = (r: typeof TOGGLE, lift: number) => {
  const e = smooth(lift), k = 1 + (LIFT_SCALE - 1) * e, box = row(1), cx = box.x + box.w / 2, cy = box.y + 6 + (box.h - 12) / 2;
  return {x: cx + (r.x - cx) * k, y: cy + (r.y - cy) * k - 14 * e, w: r.w * k, h: r.h * k};
};

/** The window's content in desk pixels: the library (settings 0), then Settings at General (pane 0) or Backups (pane 1), in the app's greys only */
function Kiln({settings = 0, pane = 0, drive = 0, on = 0, lift = 0, done = 0}: {settings?: number; pane?: number; drive?: number; on?: number; lift?: number; done?: number}) {
  const s = unit(settings), sel = s > 0.5 ? (pane > 0.5 ? 2 : 0) : 0, nav = s > 0.5 ? SETTINGS_NAV : LIBRARY_NAV;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}>
      <div style={{position: 'absolute', left: WIN.x, top: TOP, width: SIDE, height: WIN.h - 52, background: 'var(--color-panel2)', borderRight: '1px solid var(--color-border)', borderBottomLeftRadius: 16}}>
        <div style={{position: 'absolute', left: 28, top: 30, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-sans)', fontSize: 24, fontWeight: 700, color: 'var(--color-text)'}}>
          <div style={{width: 34, height: 34, borderRadius: 9, background: 'var(--color-text)', color: 'var(--color-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19}}>K</div>
          {s > 0.5 ? 'Settings' : 'Kiln'}
        </div>
      </div>
      {nav.map((name, i) => {
        const r = navItem(i), lit = i === sel;
        return <div key={name} style={{...control, left: r.x, top: r.y, width: r.w, height: r.h, padding: '0 16px', fontSize: 24, background: lit ? 'var(--color-panel)' : 'transparent',
          boxShadow: lit ? '0 1px 3px rgba(38,36,30,0.12), 0 0 0 1px rgba(38,36,30,0.05)' : 'none', color: lit ? 'var(--color-text)' : 'var(--color-muted)', fontWeight: lit ? 700 : 400}}>{name}</div>;
      })}
      {s < 0.999 && (
        <div style={{position: 'absolute', left: PANE.x, top: PANE.y, width: PANE.w, height: PANE.h, opacity: 1 - s}}>
          <div style={{...text, left: 40, top: 30, fontSize: 34, fontWeight: 700}}>Library</div>
          <div style={{...text, right: 40, top: 40, fontSize: 22, color: 'var(--color-muted)'}}>12,480 photos</div>
          <div style={{position: 'absolute', left: 40, right: 40, top: 100, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: 146, gap: 14}}>
            {Array.from({length: 12}, (_, i) => <div key={i} style={{borderRadius: 10, background: `linear-gradient(${160 + i * 23}deg, var(--color-panel2) 20%, var(--color-faint) 140%)`}} />)}
          </div>
        </div>
      )}
      {s > 0.001 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: s}}>
          <div style={{...text, left: PANE_X, top: TOP + 44, fontSize: 38, fontWeight: 700}}>{pane > 0.5 ? 'Backups' : 'General'}</div>
          <div style={{...text, left: PANE_X, top: TOP + 100, fontSize: 23, color: 'var(--color-muted)'}}>{pane > 0.5 ? 'Copy your whole library to another drive, on a schedule.' : 'How Kiln opens and imports your photos.'}</div>
          {[0, 1, 2, 3].map((i) => <div key={i} style={{position: 'absolute', left: PANE_X, width: PANE_R - PANE_X, top: row(i).y + ROW_H - 1, height: 1, background: 'var(--color-border)'}} />)}
          {pane > 0.5 ? (
            <>
              <div style={{...text, left: PANE_X, top: row(0).y + 32}}>Destination</div>
              <div style={{...control, left: FIELD.x, top: FIELD.y, width: FIELD.w, height: FIELD.h, padding: '0 16px', background: 'var(--color-panel2)', border: '1px solid var(--color-border)', color: drive > 0.5 ? 'var(--color-text)' : 'var(--color-muted)'}}>
                <span style={{opacity: drive > 0.5 ? unit((drive - 0.5) * 3) : 1}}>{drive > 0.5 ? 'Backup Drive' : 'None chosen'}</span>
              </div>
              <div style={{...control, left: CHOOSE.x, top: CHOOSE.y, width: CHOOSE.w, height: CHOOSE.h, justifyContent: 'center', background: 'var(--color-panel)', border: '1px solid var(--color-faint)', color: 'var(--color-text)'}}>Choose…</div>
              <div style={{position: 'absolute', left: row(1).x, top: row(1).y + 6, width: row(1).w, height: ROW_H - 12}}>
                <Lift lift={lift}>
                  <div style={{position: 'relative', height: ROW_H - 12}}>
                    <div style={{...text, left: 24, top: 16}}>Back up every night</div>
                    <div style={{...text, left: 24, top: 50, fontSize: 20, color: 'var(--color-muted)'}}>Only new and changed photos are copied</div>
                    <div style={{position: 'absolute', left: TOGGLE.x - row(1).x, top: TOGGLE.y - row(1).y - 6, width: TOGGLE.w, height: TOGGLE.h, borderRadius: 23,
                      background: `color-mix(in srgb, var(--color-text) ${Math.round(unit(on) * 100)}%, var(--color-faint))`}}>
                      <div style={{position: 'absolute', top: 4, left: 4 + 34 * unit(on), width: 38, height: 38, borderRadius: 19, background: 'var(--color-panel)', boxShadow: '0 2px 5px rgba(0,0,0,0.22)'}} />
                    </div>
                  </div>
                </Lift>
              </div>
              <div style={{...text, left: PANE_X, top: row(2).y + 32}}>Time</div>
              <div style={{...text, left: PANE_R - 300, width: 300, textAlign: 'right', top: row(2).y + 32}}>2:00 AM</div>
              <div style={{...text, left: PANE_X, top: row(3).y + 32}}>Last backup</div>
              <div style={{...text, left: PANE_R - 300, width: 300, textAlign: 'right', top: row(3).y + 32, color: done > 0.5 ? 'var(--color-good)' : 'var(--color-muted)'}}>{done > 0.5 ? 'Today, 2:00 AM' : 'Never'}</div>
            </>
          ) : (
            [['Open at login', 'On'], ['Import from', 'Pictures folder'], ['Keep originals', 'Always'], ['Appearance', 'Light']].map(([k, v], i) => (
              <div key={k}>
                <div style={{...text, left: PANE_X, top: row(i).y + 32}}>{k}</div>
                <div style={{...text, left: PANE_R - 300, width: 300, textAlign: 'right', top: row(i).y + 32, color: 'var(--color-muted)'}}>{v}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function Reel() {
  const t = useTime();
  // the camera: a crane down to open, then flights from control to control (each with `travel`), and a pull back over the change
  const camX = track(t, 960, [2.2, 1.0, 960], [3.7, 1.2, 660, fly], [6.3, 1.2, 1110, fly], [9.0, 1.0, 1150, fly], [12.3, 1.3, 1900, fly], [16.2, 1.4, 1790, fly], [18.3, 1.3, 1100, fly], [19.9, 1.1, 900]);
  const camY = track(t, 540, [0, 2.4, 460, crane], [2.2, 1.0, 430], [3.7, 1.2, 370, fly], [6.3, 1.2, 392, fly], [9.0, 1.0, 405, fly], [12.3, 1.3, 610, fly], [16.2, 1.4, 500, fly], [18.3, 1.3, 400, fly], [19.9, 1.1, 420]);
  const zoom = track(t, 0.74, [0, 2.4, 0.95, crane], [2.2, 1.0, 1], [3.7, 1.2, 1.38, fly], [6.3, 1.2, 1.42, fly], [12.3, 1.3, 1.35, fly], [16.2, 1.4, 1, fly], [18.3, 1.3, 1.25, fly], [19.9, 1.1, 1.1]);
  const tilt = track(t, 42, [0, 2.4, 12, crane], [2.2, 1.0, 0]);
  const turn = track(t, -8, [0, 2.4, 0, crane]);
  const flights = [[3.7, 1.2], [6.3, 1.2], [12.3, 1.3], [16.2, 1.4], [18.3, 1.3]];
  const travel = flights.reduce((v, [a, d]) => (t > a && t < a + d ? fly(unit((t - a) / d)) : v), 0);

  const land = track(t, 0, [0.1, 0.9, 1, lin]);
  const title = track(t, 0, [0.6, 0.8, 1, lin], [2.2, 0.4, 0]);
  const settings = track(t, 0, [3.4, 0.4, 1]), pane = t > 5.15 ? 1 : 0, drive = track(t, 0, [8.1, 0.5, 1]);
  const lift = track(t, 0, [9.6, 0.9, 1, Easing.outCubic], [11.8, 0.5, 0]), on = track(t, 0, [10.6, 0.35, 1]);
  const term = track(t, 0, [12.6, 0.8, 1, Easing.outQuart], [16.2, 0.5, 0]), phone = track(t, 0, [16.5, 0.9, 1, lin]);
  const wipe = t < 18.4 ? 0 : track(t, 0.002, [18.9, 1.1, 1]);
  const fig = track(t, 0, [19.9, 0.7, 1, lin]);
  const cur = track(t, 0, [4.0, 0.3, 1], [11.9, 0.3, 0]);
  const curX = track(t, 980, [4.3, 0.6, 452, fly], [6.4, 1.0, 1500, fly], [9.8, 0.7, 1540, fly]);
  const curY = track(t, 560, [4.3, 0.6, 360, fly], [6.4, 1.0, 350, fly], [9.8, 0.7, 448, fly]);
  const click = t < 6.3 ? track(t, 0, [5.0, 0.6, 1, lin]) : t < 9.0 ? track(t, 0, [7.9, 0.6, 1, lin]) : track(t, 0, [10.5, 0.6, 1, lin]);
  const nav = navItem(2), toggle = lifted(TOGGLE, lift);
  const ring = (a: number, off: number) => track(t, 0, [a, 1.1, 1, lin], [off, 0.35, 0]);
  const step = (a: number, off: number) => track(t, 0, [a, 0.8, 1, lin], [off, 0.4, 0]);
  const t2 = smooth(term), ph = smooth(phone), ti = smooth(title);
  return (
    <>
      <Desk camX={camX} camY={camY} zoom={zoom} tilt={tilt} turn={turn} travel={travel}>
        {ph > 0.001 && (
          <div style={{position: 'absolute', left: PHONE.x, top: PHONE.y, opacity: unit(phone * 3), transformOrigin: '50% 60%',
            transform: `translateY(${(-120 * (1 - backOut(phone, 1.1))).toFixed(1)}px) scale(${(1 + 0.16 * (1 - backOut(phone, 1.1))).toFixed(4)}) rotate(${(9 * (1 - ph)).toFixed(2)}deg)`}}>
            <Phone time="7:02" date="Wednesday 12 March" app="Kiln" icon="K" title="Backup complete" body="12,480 photos copied to Backup Drive." notify={track(t, 0, [17.3, 0.9, 1, lin])} />
          </div>
        )}

        {/* the window is set down from a little above, larger, to rest */}
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: unit(land * 4), transformOrigin: `${WIN.x + WIN.w / 2}px ${WIN.y + WIN.h / 2}px`,
          transform: land < 0.999 ? `translateY(${(-70 * (1 - backOut(land, 1.1))).toFixed(1)}px) scale(${(1 + 0.08 * (1 - backOut(land, 1.1))).toFixed(4)})` : undefined}}>
          <div style={{position: 'absolute', left: WIN.x, top: WIN.y}}><AppWindow title="Kiln" width={WIN.w} height={WIN.h} /></div>
          <Kiln settings={settings} pane={pane} drive={drive} on={on} lift={lift} done={t > 16.5 ? 1 : 0} />
          {wipe > 0.001 && (
            <Wipe x={PANE.x} y={PANE.y} w={PANE.w} h={PANE.h} wipe={wipe} before="Before" after="Now">
              <div style={{position: 'absolute', left: PANE.x, top: PANE.y, width: PANE.w, height: PANE.h, background: 'var(--color-panel)', borderBottomRightRadius: 16}} />
              <Kiln settings={1} pane={1} />
            </Wipe>
          )}
        </div>

        {/* the terminal swings in on its hinge in front of the window */}
        {t2 > 0.001 && (
          <div style={{position: 'absolute', left: TERM.x, top: TERM.y, opacity: unit(term * 2.5), transformOrigin: '100% 50%',
            transform: t2 < 0.999 ? `perspective(2200px) translateX(${(240 * (1 - t2)).toFixed(1)}px) rotateY(${(-26 * (1 - t2)).toFixed(2)}deg)` : undefined}}>
            <Terminal title="Terminal" prompt="~/Pictures $" command="kiln backup status" typed={track(t, 0, [13.5, 0.9, 1, lin])} output={OUTPUT} shown={track(t, 0, [14.5, 0.25, 1], [14.8, 0.4, 3], [15.2, 0.6, 4, lin])} width={TERM.w} height={TERM.h} />
          </div>
        )}

        {/* the title card is dropped on the desk and rests a little askew */}
        {ti > 0.001 && (
          <div style={{position: 'absolute', left: 120, top: 430, opacity: unit(title * 4), transformOrigin: '30% 60%',
            transform: `translateY(${(-50 * (1 - backOut(title, 1.6))).toFixed(1)}px) scale(${(1 + 0.22 * (1 - backOut(title, 1.6))).toFixed(4)}) rotate(${(-2.2 - 5 * (1 - ti)).toFixed(2)}deg)`}}>
            <TitleCard eyebrow="How to · 3 steps" title={'Back up your photos\nevery night'} icon="K" width={760} />
          </div>
        )}

        {fig > 0.001 && (
          <div style={{position: 'absolute', left: 250, top: 330}}>
            <Figure value={track(t, 12480, [20.1, 0.9, 36, Easing.outQuart])} unit="photos" label="Copied on night two" was="12,480 on night one" show={fig} width={640} />
          </div>
        )}

        {/* the guide's marks: one ring at a time, a capsule pinned for its step */}
        <Ring x={nav.x} y={nav.y} w={nav.w} h={nav.h} draw={ring(5.2, 6.2)} />
        <Ring x={CHOOSE.x} y={CHOOSE.y} w={CHOOSE.w} h={CHOOSE.h} draw={ring(7.3, 9.0)} />
        <Ring x={toggle.x} y={toggle.y} w={toggle.w} h={toggle.h} draw={ring(10.75, 11.8)} />
        <Ring x={TERM.x + 22} y={TERM.y + 52 + 26 + 46 * 4 + 12} w={690} h={46} draw={ring(15.3, 16.2)} />
        <Step x={nav.x - 9} y={nav.y + nav.h / 2} n={1} label="Open Backups" side="left" show={step(5.5, 6.2)} />
        <Step x={CHOOSE.x + CHOOSE.w / 2} y={CHOOSE.y - 9} n={2} label="Choose a drive" side="up" show={step(8.3, 9.0)} />
        <Step x={toggle.x - 9} y={toggle.y + toggle.h / 2} n={3} label="Turn it on" side="left" show={step(11.0, 12.2)} />
        {cur > 0.001 && <Cursor x={curX} y={curY} click={click} />}
      </Desk>

      {/* the shortcut's caps, on the frame rather than the desk */}
      {t > 2.4 && t < 4.2 && (
        <div style={{position: 'absolute', left: 860, top: 760, width: 200, height: 110}}>
          <Keys keys={['⌘', ',']} press={track(t, 0, [2.8, 0.8, 1, lin])} show={track(t, 0, [2.4, 0.4, 1, Easing.outQuart], [3.8, 0.35, 0])} />
        </div>
      )}
    </>
  );
}
