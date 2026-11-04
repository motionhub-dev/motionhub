import {PEN, drawn, ems, fit, handBox, unit, written} from './pens.ts';

export const meta = {
  name: {en: 'Ruled-off bar', 'zh-CN': '拆分条'},
  purpose: 'data',
  line: 'One long bar standing for a whole, ruled off piece by piece as each share is named, what is left at the end in red.',
  fits: 'what a price is made of; where the money goes; what is left after costs; the shares of a whole',
  params: {
    total: {type: 'text', default: '', doc: 'the whole, written in pencil above the bar: a $5.00 latte'},
    parts: {type: '{label, value, display?}[]', doc: 'two to seven shares in order, all of the same measure; the bar is their sum, or `whole` when given'},
    whole: {type: 'number', doc: 'what the full bar stands for, when the parts do not add up to it; the rest of the bar is left empty'},
    left: {type: 'number', default: -1, doc: 'the index of the share in red, the scene\'s one red thing; by default the last'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: the bar, then each share in turn; tween it across the words that name them'},
    width: {type: 'px', default: 1440, doc: 'the bar\'s width'},
    height: {type: 'px', default: 460, doc: 'the height, labels included'},
  },
  preview: 'breakdown.jpg',
};

type Part = {label: string; value: number; display?: string};

export function Breakdown({total = '', parts, whole, left = -1, draw = 1, width = 1440, height = 460}: {total?: string; parts: Part[]; whole?: number; left?: number; draw?: number; width?: number; height?: number}) {
  const n = parts.length || 1, sum = whole ?? parts.reduce((s, p) => s + Math.max(0, p.value), 0), red = left >= 0 ? left : parts.length - 1;
  const bar = Math.min(110, height * 0.24), y = (height - bar) / 2, full = unit(draw / 0.2);
  let run = 0;
  const pieces = parts.map((p) => { const from = run; run += sum > 0 ? (Math.max(0, p.value) / sum) * width : 0; return {from, to: run}; });
  // labels take turns above and below; on each side they are moved apart just enough not to touch, as a hand would write them
  const room = (p: Part) => Math.max(ems(p.display ?? String(p.value)) * 46, ems(p.label) * 34) + 8;
  const placed = parts.map((p, i) => (pieces[i].from + pieces[i].to) / 2);
  for (const side of [0, 1]) {
    const on = parts.map((_, i) => i).filter((i) => i % 2 === side);
    on.forEach((i, k) => { if (k) placed[i] = Math.max(placed[i], placed[on[k - 1]] + (room(parts[on[k - 1]]) + room(parts[i])) / 2 + 12); });
    [...on].reverse().forEach((i, k, back) => { placed[i] = Math.min(placed[i], k ? placed[back[k - 1]] - (room(parts[back[k - 1]]) + room(parts[i])) / 2 - 12 : width - room(parts[i]) / 2); });
    on.forEach((i) => { placed[i] = Math.max(room(parts[i]) / 2, placed[i]); });
  }
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width, height, fontFamily: 'var(--font-display)', fontWeight: 500}}>
      <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {parts.map((p, i) => {
          const q = unit((draw - 0.2) / 0.8 * n - i), {from, to} = pieces[i], isRed = i === red;
          return (
            <g key={i}>
              <path d={handBox(from, y, to - from, bar, p.label + i)} fill={isRed ? 'var(--color-grad)' : 'var(--color-data)'} fillOpacity={isRed ? q * 0.55 : q * 0.24} stroke="none" />
              {/* the rule that closes this share, and a short lead to its label, above and below in turn */}
              {i < parts.length - 1 && <path d={`M${to} ${y} L${to + 1} ${y + bar}`} stroke={PEN.ink} strokeWidth={4} strokeLinecap="round" {...drawn(q)} />}
              <path d={i % 2 ? `M${(from + to) / 2} ${y + bar + 4} L${(from + to) / 2} ${y + bar + 24}` : `M${(from + to) / 2} ${y - 4} L${(from + to) / 2} ${y - 24}`} stroke={isRed ? PEN.red : PEN.pencil} strokeWidth={3} strokeLinecap="round" {...drawn(q)} />
            </g>
          );
        })}
        <path d={handBox(0, y, width, bar, 'whole')} fill="none" stroke={PEN.ink} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" {...drawn(full)} />
      </svg>
      {total && <div style={{position: 'absolute', left: 0, bottom: height - y + 134, fontSize: 40, color: PEN.pencil, whiteSpace: 'nowrap', ...written(full)}}>{total}</div>}
      {parts.map((p, i) => {
        const q = unit((draw - 0.2) / 0.8 * n - i), up = i % 2 === 0, isRed = i === red, value = p.display ?? String(p.value), w = room(p);
        return (
          <div key={i} style={{position: 'absolute', left: placed[i] - w / 2, width: w, textAlign: 'center', ...(up ? {bottom: height - y + 28} : {top: y + bar + 28})}}>
            <div style={{display: 'inline-block', whiteSpace: 'nowrap', fontSize: fit(value, w, 46), lineHeight: 1.15, fontWeight: 600, color: isRed ? PEN.red : PEN.ink, ...written(q * 2)}}>{value}</div>
            <div />
            <div style={{display: 'inline-block', whiteSpace: 'nowrap', fontSize: fit(p.label, w, 34), lineHeight: 1.2, color: isRed ? PEN.red : PEN.pencil, ...written(q * 2 - 1)}}>{p.label}</div>
          </div>
        );
      })}
    </div>
  );
}
