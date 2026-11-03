import {C, DISPLAY, EDGE, MONO, SANS, clamp, yOf, type Cam} from './plumb.ts';

export const meta = {
  name: {en: 'Depth card', 'zh-CN': '深度卡'},
  purpose: 'data',
  line: "A strip of cream card pinned down the right of the frame, with true ticks that slide as the camera moves and each zone's name beside its span.",
  fits: "every scene: it is what makes the picture a measurement",
  params: {
    cam: {type: '{at, scale}', doc: "the scene's camera"},
    ticks: {type: '{at, label}[]', doc: 'marks on the axis, the ones that matter most first; one that would crowd the last is dropped'},
    zones: {type: '{name, note, from, to}[]', doc: 'named spans; a span too thin on screen hides its words'},
    note: {type: 'string', doc: "the card's small print at its foot: what is not to scale"},
  },
  preview: 15.5,
};

export function Gauge({cam, ticks, zones, note}: {cam: Cam; ticks: Array<{at: number; label: string}>; zones: Array<{name: string; note?: string; from: number; to: number}>; note?: string}) {
  let last = -100;
  return (
    <div style={{position: 'absolute', left: EDGE, top: 0, width: 350, height: 1080, background: C.card, boxShadow: '-8px 0 18px rgba(4, 12, 30, 0.4)', overflow: 'hidden'}}>
      {ticks.map((t, i) => {
        const y = yOf(cam, t.at);
        if (y < 62 || y > 985 || Math.abs(y - last) < 42) return null;
        last = y;
        return <div key={i}>
          <div style={{position: 'absolute', left: 0, top: y - 2, width: 46, height: 4, background: C.ink}} />
          <div style={{position: 'absolute', left: 60, top: y - 18, fontFamily: MONO, fontSize: 28, lineHeight: '36px', color: C.ink, whiteSpace: 'nowrap'}}>{t.label}</div>
        </div>;
      })}
      {zones.map((z, i) => {
        const a = Math.max(yOf(cam, z.from), 0), b = Math.min(yOf(cam, z.to), 900), span = b - a;
        const name = clamp((span - 90) / 40), note = clamp((span - 150) / 10);
        if (name <= 0) return null;
        return <div key={i} style={{position: 'absolute', left: 60, width: 280, top: (a + b) / 2 - 36, opacity: name}}>
          <div style={{fontFamily: DISPLAY, fontSize: 38, fontWeight: 700, lineHeight: '44px', color: C.ink}}>{z.name}</div>
          {z.note && <div style={{fontFamily: SANS, fontSize: 28, lineHeight: '36px', color: C.read, opacity: note}}>{z.note}</div>}
        </div>;
      })}
      {note && <div style={{position: 'absolute', left: 24, right: 16, bottom: 44, fontFamily: MONO, fontSize: 28, lineHeight: '36px', color: C.read, background: C.card}}>{note}</div>}
    </div>
  );
}
