// A word on a form: a little rolled strip of pale clay with the name pressed into it, held out from the form on a short coil that ends in a dot
// on what it names. It is DOM over the canvas, placed where the world's camera sees the point, so it follows the form as the camera moves.
import {unit, useWorld} from './world.tsx';

export const meta = {
  name: {en: 'Clay tag', 'zh-CN': '黏土标签'},
  purpose: 'term',
  line: 'A strip of pale clay with a word pressed in, on a short coil from a dot on what it names; it pops on with a squash.',
  fits: 'naming a part, a term the narration defines, a small note',
  params: {
    x: {type: 'number', default: 0, doc: 'the point it names, across (clay units)'},
    y: {type: 'number', default: 0, doc: 'the point it names, up'},
    z: {type: 'number', default: 0, doc: 'the point it names, towards the camera'},
    dx: {type: 'px', default: 120, doc: 'where the strip sits from the point, across the frame'},
    dy: {type: 'px', default: -110, doc: 'where the strip sits from the point, down the frame (negative is up)'},
    text: {type: 'text', doc: 'one to four words'},
    note: {type: 'text', default: '', doc: 'a smaller line under it'},
    dot: {type: 'text', default: 'text', doc: 'the colour token of the dot and the coil'},
    show: {type: 'progress', default: 1, doc: '0 hidden, 1 on: the coil reaches out, then the strip pops on'},
  },
  preview: 8.2,
};

export function Tag({x = 0, y = 0, z = 0, dx = 120, dy = -110, text, note = '', dot = 'text', show = 1}: {
  x?: number; y?: number; z?: number; dx?: number; dy?: number; text: string; note?: string; dot?: string; show?: number;
}) {
  const w = useWorld();
  const p = w.project(x, y, z);
  const s = unit(show);
  if (s <= 0) return null;
  const reach = unit(s / 0.45), pop = unit((s - 0.35) / 0.65);
  // the strip lands on the end of the coil: squashed wide on contact, then tall, then round
  const sy = pop < 1 ? 0.55 + 0.45 * pop + 0.18 * Math.sin(pop * Math.PI * 2) * (1 - pop) : 1;
  const sx = 1 / Math.sqrt(Math.max(0.3, sy));
  const ex = p.x + dx * reach, ey = p.y + dy * reach;
  const right = dx >= 0;
  const ink = `var(--vt-${dot}, ${dot})`;
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <path d={`M ${p.x.toFixed(1)} ${p.y.toFixed(1)} Q ${(p.x + dx * reach * 0.15).toFixed(1)} ${(p.y + dy * reach * 0.75).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`}
          fill="none" stroke="rgba(70, 40, 30, 0.18)" strokeWidth="9" strokeLinecap="round" transform="translate(3 6)" />
        <path d={`M ${p.x.toFixed(1)} ${p.y.toFixed(1)} Q ${(p.x + dx * reach * 0.15).toFixed(1)} ${(p.y + dy * reach * 0.75).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`}
          fill="none" stroke={ink} strokeWidth="7" strokeLinecap="round" />
        <circle cx={p.x} cy={p.y} r={11 * unit(s * 4)} fill={ink} stroke="var(--vt-panel2)" strokeWidth="4" />
      </svg>
      {pop > 0 && (
        <div style={{position: 'absolute', left: right ? ex - 14 : undefined, right: right ? undefined : 1920 - ex - 14, top: ey - 38,
          transform: `scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`, transformOrigin: right ? '0% 100%' : '100% 100%',
          background: 'var(--vt-panel2)', borderRadius: 24, padding: note ? '10px 26px 12px' : '12px 26px 14px', whiteSpace: 'nowrap',
          boxShadow: '0 6px 0 var(--vt-border), 0 16px 26px rgba(70, 40, 30, 0.22)', opacity: unit(pop * 4)}}>
          <div style={{fontFamily: 'var(--vt-display)', fontSize: 40, fontWeight: 600, lineHeight: 1.1, color: 'var(--vt-text)'}}>{text}</div>
          {note && <div style={{fontFamily: 'var(--vt-sans)', fontSize: 32, fontWeight: 500, lineHeight: 1.2, color: 'var(--vt-muted)', marginTop: 2}}>{note}</div>}
        </div>
      )}
    </div>
  );
}
