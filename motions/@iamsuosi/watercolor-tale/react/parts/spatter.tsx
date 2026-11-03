import React from 'react';
import {ease, rng, unit, type Pt} from './paint.ts';
import {Wash, usePigment} from './wash.tsx';

export const meta = {
  name: {en: 'Spatter', 'zh-CN': '甩笔溅色'},
  purpose: 'transition',
  line: 'A loaded brush flicked: drops fly on an arc, land and spread into small wet spots.',
  fits: 'many small things arriving at once: seeds, rain, the first red; a flourish',
  params: {
    from: {type: '[x, y]', doc: 'where the brush was flicked, in px inside the box'},
    to: {type: '[x, y]', doc: 'the middle of where the drops land'},
    width: {type: 'px', doc: 'the box\'s width'},
    height: {type: 'px', doc: 'the box\'s height'},
    pigment: {type: 'token or #hex', default: 'grad', doc: 'the colour on the brush'},
    count: {type: 'number', default: 28, doc: 'how many drops'},
    spread: {type: 'px', default: 160, doc: 'how widely they scatter round `to`, more along the flick than across it'},
    size: {type: 'px', default: 12, doc: 'the largest drop\'s radius once it has spread; most are smaller'},
    flick: {type: 'progress', default: 1, doc: '0 to 1: the drops leave the brush (the first quarter), fly and land one after another; tween it on the word, about 1.2 s'},
    seed: {type: 'number', default: 1, doc: 'another throw of the same flick'},
  },
  preview: 30.7,
};

export function Spatter({from, to, width, height, pigment = 'grad', count = 28, spread = 160, size = 12, flick = 1, seed = 1}: {
  from: Pt; to: Pt; width: number; height: number; pigment?: string; count?: number; spread?: number; size?: number; flick?: number; seed?: number;
}) {
  const c = usePigment(pigment), colour = `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`;
  if (flick <= 0) return null;
  const r = rng(seed * 101 + count), dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const drops = Array.from({length: count}, (_, i) => {
    // along the flick the drops string out; across it they stay close; big drops are few
    const a = (r() - 0.5) * 2, b = (r() - 0.5) * 2, big = r() ** 3;
    const at: Pt = [to[0] + ux * a * spread + -uy * b * spread * 0.45, to[1] + uy * a * spread + ux * b * spread * 0.45];
    return {at, rad: size * (0.25 + 0.75 * big), leave: (i / count) * 0.25 + r() * 0.05, arc: (r() - 0.3) * 0.25 * len};
  });
  const flying: React.ReactNode[] = [], landed: string[] = [];
  drops.forEach((dp, i) => {
    const k = unit((flick - dp.leave) / 0.5);
    if (k <= 0) return;
    if (k < 1) {
      // in flight: a small fast drop on a shallow arc, stretched along its way
      const e = 1 - (1 - k) ** 2, x = from[0] + (dp.at[0] - from[0]) * e - uy * dp.arc * Math.sin(Math.PI * e), y = from[1] + (dp.at[1] - from[1]) * e + ux * dp.arc * Math.sin(Math.PI * e);
      const ang = (Math.atan2(dp.at[1] - from[1], dp.at[0] - from[0]) * 180) / Math.PI;
      flying.push(<ellipse key={i} cx={x} cy={y} rx={dp.rad * 0.55 * (1.6 - e * 0.6)} ry={dp.rad * 0.4} transform={`rotate(${ang.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`} fill={colour} opacity={0.85} />);
    } else {
      // landed: the drop spreads into the paper over the next moments
      const g = ease(unit((flick - dp.leave - 0.5) / 0.3), 0, 1) * 0.6 + 0.4, rr = dp.rad * g;
      landed.push(`M${(dp.at[0] + rr).toFixed(1)} ${dp.at[1].toFixed(1)} A${rr.toFixed(1)} ${rr.toFixed(1)} 0 1 0 ${(dp.at[0] - rr).toFixed(1)} ${dp.at[1].toFixed(1)} A${rr.toFixed(1)} ${rr.toFixed(1)} 0 1 0 ${(dp.at[0] + rr).toFixed(1)} ${dp.at[1].toFixed(1)} Z`);
    }
  });
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width, height}}>
      {landed.length > 0 && <Wash d={landed.join(' ')} name={`spatter-${seed}-${count}`} width={width} height={height} pigment={pigment} strength={0.85} paint={1} dry={ease(flick, 0.6, 1)} granulate={0.3} wobble={2} />}
      <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', mixBlendMode: 'multiply'}}>{flying}</svg>
    </div>
  );
}
