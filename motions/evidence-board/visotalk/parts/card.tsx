import React from 'react';

export const meta = {
  name: {en: 'Pinned card', 'zh-CN': '钉上的卡片'},
  purpose: 'term',
  line: 'A card set down on the board, pressed in by one pin, its source tag slid out from under its edge.',
  fits: 'every source: a page, a transcript, a photograph, a figure',
  params: {
    x: {type: 'px', doc: 'the card\'s left edge, in board pixels'},
    y: {type: 'px', doc: 'the card\'s top edge, in board pixels'},
    w: {type: 'px', doc: 'the card\'s width'},
    rot: {type: 'degrees', default: 0, doc: 'how the card hangs, -2.5 to 2.5; a card read in a push-in hangs within 1.5'},
    pin: {type: 'progress', default: 1, doc: '0 to 1: set down from above by 0.55, pressed in by 0.7, its tag out by 1; tween it on the word that names the source'},
    tag: {type: 'text', default: '', doc: 'the source, as its holder names it: "NASA · Air-to-ground transcript"; empty for a claim, which has none'},
    date: {type: 'text', default: '', doc: 'the date of the source, in the mono face: "13 APR 1970"'},
    pinX: {type: 'number', default: 0.5, doc: 'where along the top edge the pin goes, 0 to 1: move it off a word a thread would cross'},
    focus: {type: 'progress', default: 0, doc: '0 to 1: the camera\'s focus leaves this card: it blurs and darkens while another card is read (tween it with the push-in, back to 0 with the pull-back)'},
    hang: {type: 'progress', default: 0, doc: '0 to 1: the card slips and swings down on its one pin, then settles crooked: a claim the record has just disproved'},
    paper: {type: 'text', default: 'paper', doc: '"paper" for a page, "print" for a photograph\'s white mount, "slip" for an aged sheet, "none" when the content draws its own (a torn slip)'},
  },
  preview: 8.6,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => 1 - (1 - unit(v)) ** 3;
const backOut = (v: number, c = 1.6) => { const u = unit(v) - 1; return 1 + (c + 1) * u * u * u + c * u * u; };

/** Where a card's pin stands, in board pixels, given its `pinX` and `rot`: a thread starts and ends here */
export const pinAt = (x: number, w: number, y: number, pinX = 0.5, rot = 0): [number, number] => {
  // the card turns about the middle of its top edge, so a pin off the middle rises or falls with it
  const a = (rot * Math.PI) / 180, dx = w * (pinX - 0.5);
  return [x + w / 2 + dx * Math.cos(a) - 16 * Math.sin(a), y + dx * Math.sin(a) + 16 * Math.cos(a)];
};

const SURFACE: Record<string, string> = {paper: 'var(--vt-panel)', print: 'color-mix(in srgb, var(--vt-panel) 45%, white)', slip: 'var(--vt-panel2)'};

export function Card({x, y, w, rot = 0, pin = 1, pinX = 0.5, focus = 0, hang = 0, tag = '', date = '', paper = 'paper', children}: {x: number; y: number; w: number; rot?: number; pin?: number; pinX?: number; focus?: number; hang?: number; tag?: string; date?: string; paper?: string; children?: React.ReactNode}) {
  const p = unit(pin);
  if (p <= 0.001) return null;
  const down = ease(p / 0.5);                // flown in from in front of the board and laid on it
  const press = unit((p - 0.55) / 0.15);     // the pin goes in
  const out = backOut((p - 0.7) / 0.3, 1.2); // the tag slides out from under the bottom edge
  const lift = 1 - down;
  // paper lands in air: once down, its free edge lifts and falls back twice before it lies flat
  const settle = unit((p - 0.42) / 0.4);
  const flutter = settle > 0 && settle < 1 ? 7 * Math.exp(-4.5 * settle) * Math.sin(settle * Math.PI * 4.2) : 0;
  // hanging from one pin: it drops past where it rests, swings back, and settles crooked
  const h = unit(hang);
  const swing = h > 0 ? (pinX > 0.5 ? -1 : 1) * 17 * (1 - Math.exp(-4.2 * h) * Math.cos(h * Math.PI * 3.4)) : 0;
  const f = unit(focus);
  // the shadow is long and soft while the card is held above the board, short and tight once it lies on it
  const shadow = `0 ${(6 + 34 * lift).toFixed(1)}px ${(10 + 46 * lift).toFixed(1)}px rgba(0, 0, 0, ${(0.55 - 0.2 * lift).toFixed(2)}), 0 1px 2px rgba(0, 0, 0, 0.5)`;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, opacity: unit(p * 5), transformOrigin: '50% 0%',
      transform: `perspective(1600px) translate(${(-90 * lift).toFixed(1)}px, ${(-150 * lift).toFixed(1)}px) scale(${(1 + 0.16 * lift).toFixed(4)}) rotate(${(rot - 7 * lift).toFixed(2)}deg) rotateX(${(-38 * lift + flutter).toFixed(2)}deg) rotateY(${(14 * lift).toFixed(2)}deg)`,
      filter: f > 0.01 ? `blur(${(7 * f).toFixed(2)}px) brightness(${(1 - 0.5 * f).toFixed(3)})` : undefined}}>
    <div style={{position: 'relative', transformOrigin: `${(w * pinX).toFixed(1)}px 16px`, transform: swing ? `rotate(${swing.toFixed(2)}deg)` : undefined}}>
      {/* the source tag: a dark printed label tucked under the card's bottom edge, slid out to the left */}
      {out > 0.001 && tag && (
        <div style={{position: 'absolute', left: 22, bottom: 0, transform: `translateY(${(56 * out - 4).toFixed(1)}px)`, display: 'flex', alignItems: 'center', gap: 14,
          padding: '9px 16px 9px 14px', background: 'color-mix(in srgb, var(--vt-bg) 45%, black)', color: 'var(--vt-text)', boxShadow: '0 6px 10px -4px rgba(0, 0, 0, 0.7)', whiteSpace: 'nowrap'}}>
          <span style={{width: 7, height: 7, borderRadius: 4, background: 'var(--vt-text)', opacity: 0.85}} />
          <span style={{fontFamily: 'var(--vt-sans)', fontSize: 23, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase'}}>{tag}</span>
          {date && <span style={{fontFamily: 'var(--vt-mono)', fontSize: 22, color: 'var(--vt-muted)', letterSpacing: '0.04em'}}>{date}</span>}
        </div>
      )}
      {paper === 'none' ? (
        // content with its own surface (a torn slip) casts the same shadow from its own outline
        <div style={{position: 'relative', filter: `drop-shadow(0 ${(5 + 30 * lift).toFixed(1)}px ${(5 + 18 * lift).toFixed(1)}px rgba(0, 0, 0, 0.6))`}}>{children}</div>
      ) : (
        <div style={{position: 'relative', background: SURFACE[paper] ?? SURFACE.paper, boxShadow: shadow, color: 'var(--vt-bg)'}}>
          {/* the paper's own light: a little brighter where the overhead lamp falls */}
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(172deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 40%, rgba(60, 45, 20, 0.07) 100%)', pointerEvents: 'none'}} />
          {children}
        </div>
      )}
    </div>
      {/* the pin: a plain steel head, pressed in with a small bounce */}
      {press > 0.001 && (
        <div style={{position: 'absolute', left: w * pinX - 13, top: 3, width: 26, height: 26, borderRadius: 13, opacity: unit(press * 3),
          transform: `translateY(${(-18 * (1 - ease(press))).toFixed(1)}px) scale(${(1.5 - 0.5 * backOut(press, 2)).toFixed(3)})`,
          background: 'radial-gradient(circle at 36% 32%, #FFFFFF 0%, #C9CCD0 28%, #6E7379 70%, #3D4146 100%)',
          boxShadow: `${(3 + 5 * (1 - press)).toFixed(1)}px ${(4 + 7 * (1 - press)).toFixed(1)}px ${(4 + 6 * (1 - press)).toFixed(1)}px rgba(0, 0, 0, 0.55)`}} />
      )}
    </div>
  );
}
