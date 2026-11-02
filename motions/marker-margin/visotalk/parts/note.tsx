import {random} from '@visotalk/runtime';
import {INK, KEY, hand, stage, unit, type Ink} from './marker.ts';

export const meta = {
  name: {en: 'Note', 'zh-CN': '手写字'},
  purpose: 'term',
  line: 'A few words written by hand beside the thing, one underlined the moment it is said.',
  fits: 'a name or a place the shot shows; the word that matters',
  params: {
    text: {type: 'text', doc: 'two to five words; a line break with \\n'},
    write: {type: 'progress', default: 0, doc: '0 to 1: the words are written, letter by letter; about 0.07 s a letter'},
    mark: {type: 'text', default: '', doc: 'the word (or words) in the text to underline'},
    under: {type: 'progress', default: 0, doc: '0 to 1: the underline runs under the marked words; tween it on the spoken word, in about 0.35 s'},
    size: {type: 'px', default: 64, doc: 'the letters\' size'},
    tilt: {type: 'number', default: -2, doc: 'degrees the line leans by'},
    seed: {type: 'text', default: 'note', doc: 'another seed is another hand'},
  },
  preview: 2.6,
};

/** One letter at a time: a letter arrives in a quarter of its slot, with a small drop, as a pen puts it down */
export function Writing({text, write, ink = 'white', size = 64, mark = '', under = 0, seed = 'note'}: {text: string; write: number; ink?: Ink; size?: number; mark?: string; under?: number; seed?: string}) {
  const chars = [...text].filter((c) => c !== '\n').length || 1;
  const at = mark ? text.indexOf(mark) : -1;
  const r = random(`${seed}:hand`);
  let n = 0;
  const letter = (c: string, key: string) => {
    if (c === '\n') return <br key={key} />;
    const k = unit(write * chars * 1.15 - n++), lift = (r() - 0.5) * size * 0.06;
    return <span key={key} style={{display: 'inline-block', opacity: unit(k * 3), transform: `translateY(${(lift + (1 - unit(k * 2)) * size * 0.08).toFixed(1)}px)`}}>{c === ' ' ? ' ' : c}</span>;
  };
  const run = (s: string, from: number) => [...s].map((c, i) => letter(c, `${from + i}`));
  return (
    <div style={{...hand, fontSize: size, color: INK[ink]}}>
      {at < 0 ? run(text, 0) : [
        ...run(text.slice(0, at), 0),
        <span key="mark" style={{position: 'relative', display: 'inline-block'}}>
          {run(mark, at)}
          <Underline draw={under} weight={Math.max(7, size * 0.13)} seed={seed} />
        </span>,
        ...run(text.slice(at + mark.length), at + mark.length),
      ]}
    </div>
  );
}

/** A marker line under whatever box it sits in, rising a little to the right as a quick underline does */
export function Underline({draw, weight = 9, double = false, seed = 'under'}: {draw: number; weight?: number; double?: boolean; seed?: string}) {
  if (draw <= 0) return null;
  const r = random(`${seed}:under`), y0 = weight * 1.4 + r() * 4, y1 = y0 - 5 - r() * 4, sag = 3 + r() * 3, gap = weight * 1.6, h = weight * 5;
  const lines = [`M-3 ${y0.toFixed(1)} Q 50 ${(y0 + sag).toFixed(1)} 104 ${y1.toFixed(1)}`];
  if (double) lines.push(`M6 ${(y0 + gap).toFixed(1)} Q 52 ${(y0 + gap + sag).toFixed(1)} 98 ${(y1 + gap - 1).toFixed(1)}`);
  const parts = lines.length;
  return (
    // stretched across the words: the run is 0–100 wide, the height in px, so the stroke keeps its weight and pathLength still measures the run
    <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" style={{position: 'absolute', left: 0, top: '80%', width: '100%', height: h, overflow: 'visible', pointerEvents: 'none'}}>
      {lines.map((d, i) => {
        const shown = stage(draw, i / parts, (i + 1) / parts);
        if (shown <= 0) return null;
        const dash = {pathLength: 1, strokeDasharray: `${shown.toFixed(4)} 2`, fill: 'none', strokeLinecap: 'round' as const};
        return (
          <g key={i}>
            <path d={d} stroke={KEY} strokeWidth={weight + 6} {...dash} />
            <path d={d} stroke={INK.marker} strokeWidth={weight} {...dash} />
          </g>
        );
      })}
    </svg>
  );
}

export function Note({text, write = 0, mark = '', under = 0, size = 64, tilt = -2, seed = 'note'}: {text: string; write?: number; mark?: string; under?: number; size?: number; tilt?: number; seed?: string}) {
  return (
    // room above for the lean and the letters' bounce, so the words stay inside the part
    <div style={{position: 'absolute', left: size * 0.15, top: size * 0.3, transform: `rotate(${tilt}deg)`, transformOrigin: 'left center'}}>
      <Writing text={text} write={write} size={size} mark={mark} under={under} seed={seed} />
    </div>
  );
}
