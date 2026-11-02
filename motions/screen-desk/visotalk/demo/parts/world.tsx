// The sample's one desk: the Kiln window, the terminal, the phone and the guide's marks, all in desk pixels under one camera.
import {useProp} from '@visotalk/runtime';
import {Desk} from '../../parts/desk.tsx';
import {AppWindow} from '../../parts/window.tsx';
import {Terminal} from '../../parts/terminal.tsx';
import {Phone} from '../../parts/phone.tsx';
import {TitleCard} from '../../parts/title.tsx';
import {Ring} from '../../parts/ring.tsx';
import {Step} from '../../parts/step.tsx';
import {Cursor} from '../../parts/cursor.tsx';
import {Wipe} from '../../parts/wipe.tsx';
import {Figure} from '../../parts/figure.tsx';
import {LIFT_SCALE} from '../../parts/lift.tsx';
import {Kiln, WIN, navItem, row, CHOOSE, TOGGLE, TIME} from './kiln.tsx';

const unit = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => { const u = unit(v); return u * u * (3 - 2 * u); };
const backOut = (v: number, c = 1.4) => { const u = unit(v) - 1; return 1 + (c + 1) * u * u * u + c * u * u; };

export const TERM = {x: 1400, y: 400, w: 1000, h: 440};
export const PHONE = {x: 1935, y: 90};
const TITLE = {x: 120, y: 430};
const FIGURE = {x: 250, y: 330};
// the Backups pane, which the before-and-after wipes across
const PANE = {x: WIN.x + 280, y: WIN.y + 52, w: WIN.w - 280, h: WIN.h - 52};

const OUTPUT = [
  'Destination  Backup Drive',
  'Schedule  every night, 2:00 AM',
  'Library  12,480 photos',
  '✓ Ready. Next run tonight at 2:00 AM.',
];

// a rect in the row that Lift raises, where it is drawn while raised (Lift scales it about the row's centre and moves it up)
const lifted = (r: {x: number; y: number; w: number; h: number}, lift: number) => {
  const e = smooth(lift), k = 1 + (LIFT_SCALE - 1) * e;
  const box = row(1), cx = box.x + box.w / 2, cy = box.y + 6 + (box.h - 12) / 2;
  return {x: cx + (r.x - cx) * k, y: cy + (r.y - cy) * k - 14 * e, w: r.w * k, h: r.h * k};
};

export function World() {
  const p = (name: string, base: number) => useProp(name, base);
  const camX = p('camX', 960), camY = p('camY', 470), zoom = p('zoom', 0.9), tilt = p('tilt', 12), turn = p('turn', 0), travel = p('travel', 0);
  const land = p('land', 1);
  const title = p('title', 0), term = p('term', 0), phone = p('phone', 0);
  const lift = p('lift', 0);
  const nav = navItem(2);
  const toggle = lifted(TOGGLE, lift);
  const r = {r1: p('r1', 0), r2: p('r2', 0), r3: p('r3', 0), r4: p('r4', 0), r5: p('r5', 0)};
  const s = {s1: p('s1', 0), s2: p('s2', 0), s3: p('s3', 0)};
  const cur = p('cur', 0), curX = p('curX', 1180), curY = p('curY', 620), click = p('click', 0);
  const notify = p('notify', 0), typed = p('typed', 0), shown = p('shown', 0);
  const settings = p('settings', 0), pane = p('pane', 0), drive = p('drive', 0), on = p('on', 0), done = p('done', 0);
  const wipe = p('wipe', 0), fig = p('fig', 0), figValue = p('figValue', 12480);
  const t = smooth(term), ph = smooth(phone), ti = smooth(title);
  return (
    <Desk camX={camX} camY={camY} zoom={zoom} tilt={tilt} turn={turn} travel={travel}>
      {/* the phone, face up to the right of the screen */}
      {ph > 0.001 && (
        // set down from above: it comes in large and turned, and lands with a small bounce
        <div style={{position: 'absolute', left: PHONE.x, top: PHONE.y, opacity: unit(phone * 3), transformOrigin: '50% 60%',
          transform: `translateY(${(-120 * (1 - backOut(phone, 1.1))).toFixed(1)}px) scale(${(1 + 0.16 * (1 - backOut(phone, 1.1))).toFixed(4)}) rotate(${(9 * (1 - ph)).toFixed(2)}deg)`}}>
          <Phone time="7:02" date="Wednesday 12 March" app="Kiln" icon="K" title="Backup complete" body="12,480 photos copied to Backup Drive." notify={notify} />
        </div>
      )}

      {/* the window is set down on the desk at the start: from a little above, larger, to rest */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: unit(land * 4), transformOrigin: `${WIN.x + WIN.w / 2}px ${WIN.y + WIN.h / 2}px`,
        transform: land < 0.999 ? `translateY(${(-70 * (1 - backOut(land, 1.1))).toFixed(1)}px) scale(${(1 + 0.08 * (1 - backOut(land, 1.1))).toFixed(4)})` : undefined}}>
        <div style={{position: 'absolute', left: WIN.x, top: WIN.y}}><AppWindow title="Kiln" width={WIN.w} height={WIN.h} /></div>
        <Kiln settings={settings} pane={pane} drive={drive} on={on} lift={lift} done={done} />
        {wipe > 0.001 && (
          <Wipe x={PANE.x} y={PANE.y} w={PANE.w} h={PANE.h} wipe={wipe} before="Before" after="Now">
            {/* the pane as it was before the three steps */}
            <div style={{position: 'absolute', left: PANE.x, top: PANE.y, width: PANE.w, height: PANE.h, background: 'var(--vt-panel)', borderBottomRightRadius: 16}} />
            <Kiln settings={1} pane={1} />
          </Wipe>
        )}
      </div>

      {/* the terminal slides onto the desk in front of the window */}
      {t > 0.001 && (
        // swung in from the right on its hinge, like a window brought forward
        <div style={{position: 'absolute', left: TERM.x, top: TERM.y, opacity: unit(term * 2.5), transformOrigin: '100% 50%',
          transform: t < 0.999 ? `perspective(2200px) translateX(${(240 * (1 - t)).toFixed(1)}px) rotateY(${(-26 * (1 - t)).toFixed(2)}deg)` : undefined}}>
          <Terminal title="Terminal" prompt="~/Pictures $" command="kiln backup status" typed={typed} output={OUTPUT} shown={shown} width={TERM.w} height={TERM.h} />
        </div>
      )}

      {/* the title card lies on the desk in front of the window */}
      {ti > 0.001 && (
        // dropped onto the desk: it falls large and turned, lands with a bounce and rests a little askew
        <div style={{position: 'absolute', left: TITLE.x, top: TITLE.y, opacity: unit(title * 4), transformOrigin: '30% 60%',
          transform: `translateY(${(-50 * (1 - backOut(title, 1.6))).toFixed(1)}px) scale(${(1 + 0.22 * (1 - backOut(title, 1.6))).toFixed(4)}) rotate(${(-2.2 - 5 * (1 - ti)).toFixed(2)}deg)`}}>
          <TitleCard eyebrow="How to · 3 steps" title={'Back up your photos\nevery night'} icon="K" width={760} />
        </div>
      )}

      {fig > 0.001 && (
        <div style={{position: 'absolute', left: FIGURE.x, top: FIGURE.y}}>
          <Figure value={figValue} unit="photos" label="Copied on night two" was="12,480 on night one" show={fig} width={640} />
        </div>
      )}

      {/* the guide's marks */}
      <Ring x={nav.x} y={nav.y} w={nav.w} h={nav.h} draw={r.r1} />
      <Ring x={CHOOSE.x} y={CHOOSE.y} w={CHOOSE.w} h={CHOOSE.h} draw={r.r2} />
      <Ring x={toggle.x} y={toggle.y} w={toggle.w} h={toggle.h} draw={r.r3} />
      <Ring x={TIME.x} y={TIME.y} w={TIME.w} h={TIME.h} draw={r.r4} />
      <Ring x={TERM.x + 22} y={TERM.y + 52 + 26 + 46 * 4 + 12} w={690} h={46} draw={r.r5} />
      <Step x={nav.x - 9} y={nav.y + nav.h / 2} n={1} label="Open Backups" side="left" show={s.s1} />
      <Step x={CHOOSE.x + CHOOSE.w / 2} y={CHOOSE.y - 9} n={2} label="Choose a drive" side="up" show={s.s2} />
      <Step x={toggle.x - 9} y={toggle.y + toggle.h / 2} n={3} label="Turn it on" side="left" show={s.s3} />
      {cur > 0.001 && <Cursor x={curX} y={curY} click={click} />}
    </Desk>
  );
}
