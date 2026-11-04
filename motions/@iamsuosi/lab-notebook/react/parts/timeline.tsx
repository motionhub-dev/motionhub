import {PEN, drawn, fit, unit, written} from './pens.ts';

export const meta = {
  name: {en: 'Pencil timeline', 'zh-CN': '时间线'},
  purpose: 'steps',
  line: 'A line ruled across the page and ticked at each date, the date written large and what happened in pencil, taking turns above and below the line.',
  fits: 'what happened when; a history in dates; a project\'s stages; a before, a turning point and an after',
  params: {
    events: {type: '{when, text, at?}[]', doc: 'two to six: when is a date or a stage, text a few words; at (a number, all or none) spaces them by real time, otherwise they are even'},
    shown: {type: 'number', default: 99, doc: 'how many events are written so far, with fractions mid-event; the line is drawn first, from 0 to 0.3 of the first'},
    current: {type: 'number', default: -1, doc: 'the index of the event in red, the scene\'s one red thing; -1 for none'},
    width: {type: 'px', default: 1440, doc: 'the line\'s width'},
    height: {type: 'px', default: 520, doc: 'the height, the line at the middle'},
  },
  preview: 'timeline.jpg',
};

type Event = {when: string; text: string; at?: number};

export function Timeline({events, shown = 99, current = -1, width = 1440, height = 520}: {events: Event[]; shown?: number; current?: number; width?: number; height?: number}) {
  const n = events.length || 1, y = height / 2, inset = 90, span = width - 2 * inset, timed = events.length > 1 && events.every((e) => typeof e.at === 'number');
  const lo = timed ? Math.min(...events.map((e) => e.at!)) : 0, hi = timed ? Math.max(...events.map((e) => e.at!)) : 1;
  const x = (e: Event, i: number) => inset + (timed ? ((e.at! - lo) / ((hi - lo) || 1)) * span : n > 1 ? (i / (n - 1)) * span : span / 2);
  const room = Math.min(width * 0.46, (span / Math.max(1, n - 1)) * 1.8);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width, height, fontFamily: 'var(--font-display)'}}>
      <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <path d={`M0 ${y} C ${width * 0.3} ${y - 5}, ${width * 0.6} ${y + 5}, ${width} ${y - 2}`} fill="none" stroke={PEN.ink} strokeWidth={5} strokeLinecap="round" {...drawn(shown / 0.3)} />
        {events.map((e, i) => <path key={i} d={`M${x(e, i)} ${y - 15} L${x(e, i)} ${y + 15}`} stroke={i === current ? PEN.red : PEN.ink} strokeWidth={5} strokeLinecap="round" {...drawn(unit((shown - i) / 0.2))} />)}
      </svg>
      {events.map((e, i) => {
        const p = unit(shown - i), up = i % 2 === 0, pen = i === current ? PEN.red : PEN.ink;
        const cx = Math.max(room / 2, Math.min(width - room / 2, x(e, i)));
        return (
          <div key={i} style={{position: 'absolute', left: cx - room / 2, width: room, textAlign: 'center', ...(up ? {bottom: height - y + 30} : {top: y + 30})}}>
            <div style={{display: 'inline-block', fontSize: fit(e.when, room, 60), lineHeight: 1.15, fontWeight: 600, color: pen, whiteSpace: 'nowrap', ...written(p / 0.4)}}>{e.when}</div>
            <div />
            <div style={{display: 'inline-block', marginTop: 6, fontSize: fit(e.text, room, 38), lineHeight: 1.25, color: i === current ? PEN.red : PEN.pencil, whiteSpace: 'nowrap', ...written((p - 0.4) / 0.6)}}>{e.text}</div>
          </div>
        );
      })}
    </div>
  );
}
