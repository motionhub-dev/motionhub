import {RED, ink, label, plate, slide, slot, stage, unit, wipe} from './package.ts';

export const meta = {
  name: {en: 'Score bar', 'zh-CN': '比分数据条'},
  purpose: 'data',
  line: 'A board in the free column: rows tick up as said, the one that matters in red; a row can wait as a question and win with a badge.',
  fits: 'times, prices or scores read out; a figure held back',
  params: {
    title: {type: 'text', doc: 'what is measured, on the red tab: FLIGHT TIME, PRICE, POINTS'},
    labels: {type: 'list', doc: 'one short label per row, as said'},
    values: {type: 'list', doc: 'one number per row, on one scale (minutes for a time)'},
    notes: {type: 'list', default: [], doc: 'text after each figure, or empty: "+", "est."'},
    format: {type: 'text', default: 'number', doc: 'number, or hm to show minutes as h:mm'},
    shown: {type: 'number', default: 0, doc: 'rows opened: tween it from n to n + 1 on a row\'s figure; a fraction is that row growing and ticking'},
    ask: {type: 'number', default: -1, doc: 'a row that stays a question (its figure "?") until `reveal`'},
    reveal: {type: 'progress', default: 0, doc: '0 to 1: the asked row grows and ticks to its figure'},
    focus: {type: 'number', default: -1, doc: 'the row in the channel red'},
    badge: {type: 'text', default: '', doc: 'a word slammed beside the focus row\'s label when it wins: FASTEST, WINNER, RECORD'},
    win: {type: 'progress', default: 0, doc: '0 to 1 over about 0.8 s: the focus row flashes white and its badge slams down'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the tab and the board push on; back to 0 pulls it off'},
  },
  preview: 48.4,
};

const fmt = (v: number, format: string) => {
  if (format !== 'hm') return Math.round(v).toLocaleString('en-US');
  const m = Math.round(v);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
};

/** A column about 440 wide on the free side of the shot, a row about 104 high, hanging from the box's top; the bars are on one scale, the largest value filling the track. */
export function Scorebar({title, labels, values, notes = [], format = 'number', shown = 0, ask = -1, reveal = 0, focus = -1, badge = '', win = 0, show = 1}: {title: string; labels: string[]; values: number[]; notes?: string[]; format?: string; shown?: number; ask?: number; reveal?: number; focus?: number; badge?: string; win?: number; show?: number}) {
  const tab = stage(show, 0, 0.45), board = stage(show, 0.25, 1);
  const max = Math.max(...values.map(Number), 1);
  const flash = win <= 0 || win >= 1 ? 0 : win < 0.12 ? win / 0.12 * 0.9 : 0.9 * Math.max(0, 1 - (win - 0.12) / 0.5);
  const slam = stage(win, 0.08, 0.3);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, right: 0, filter: 'drop-shadow(0 12px 22px rgba(0, 0, 0, 0.6))'}}>
      <div style={{display: 'inline-flex', ...wipe(tab, 'bottom')}}>
        <div style={{background: RED, padding: '8px 18px 6px', ...label, fontSize: 38, fontWeight: 900, color: '#FFFFFF'}}>{title}</div>
      </div>
      <div style={{...ink, ...wipe(board), borderTop: `4px solid ${RED}`}}>
        {labels.map((name, i) => {
          const asked = i === ask;
          const open = unit(shown - i);
          if (open <= 0) return null;
          const grow = asked ? stage(reveal, 0, 1) : stage(open, 0.15, 1);
          const v = Number(values[i] ?? 0) * grow;
          const lit = i === focus;
          return (
            <div key={i} data-vt-camera="" style={{...slot, overflow: open >= 1 ? 'visible' : 'hidden', borderTop: i ? '1px solid var(--vt-border)' : 'none'}}>
            <div style={{padding: '12px 0 12px 20px', position: 'relative', ...slide(open, 0, 0.55)}}>
              {lit && flash > 0 && <div style={{position: 'absolute', inset: 0, background: 'var(--vt-text)', opacity: flash}} />}
              <div style={{display: 'flex', alignItems: 'center', gap: 12, position: 'relative'}}>
              <div style={{fontFamily: 'var(--vt-sans)', fontWeight: 700, fontSize: 30, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap', marginBottom: 6, color: lit ? 'var(--vt-text)' : 'var(--vt-muted)'}}>{name}</div>
              {lit && badge && slam > 0 && <div style={{...label, fontSize: 32, fontWeight: 900, color: '#FFFFFF', background: RED, padding: '4px 8px 2px', marginBottom: 6, whiteSpace: 'nowrap', flex: 'none', opacity: unit(slam * 3), transform: `scale(${(1 + (1 - slam) * 0.8).toFixed(3)}) rotate(-5deg)`, transformOrigin: 'left center'}}>{badge}</div>}
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 16, position: 'relative'}}>
                <div style={{flex: 1, height: 18, background: 'var(--vt-panel2)', position: 'relative'}}>
                  <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${((v / max) * 100).toFixed(2)}%`, background: lit ? RED : 'var(--vt-muted)'}}>
                    {grow > 0.01 && grow < 0.99 && <div style={{position: 'absolute', right: 0, top: -4, bottom: -4, width: 6, background: 'var(--vt-text)'}} />}
                  </div>
                </div>
                <div style={{...(lit ? plate : {}), width: 170, flex: 'none', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 18px', boxSizing: 'border-box'}}>
                  <span style={{fontFamily: 'var(--vt-display)', fontWeight: 800, fontSize: 62, lineHeight: 1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: lit ? 'var(--vt-bg)' : 'var(--vt-text)'}}>
                    {asked && reveal <= 0 ? '?' : fmt(v, format)}
                    {notes[i] && (!asked || reveal >= 1) && <span style={{color: lit ? RED : 'var(--vt-muted)', marginLeft: 2}}>{notes[i]}</span>}
                  </span>
                </div>
              </div>
            </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
