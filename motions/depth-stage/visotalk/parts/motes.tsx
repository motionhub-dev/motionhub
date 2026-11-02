import {useMemo} from 'react';
import {random, useDocTime} from '@visotalk/runtime';
import {Plane, SHEET, unit} from './stage.tsx';

export const meta = {
  name: {en: 'Motes in the air', 'zh-CN': '空气里的微粒'},
  purpose: 'ground',
  line: 'Dust, falling ash or rising embers on several depths: near ones soft discs of light, far ones fine specks, so the air shows the depth.',
  fits: 'dust in a low sun, ash after an eruption, sparks over a fire, snow',
  params: {
    kind: {type: 'text', default: 'dust', doc: 'dust (drifts), ash (falls) or embers (rise, warm, flickering)'},
    seed: {type: 'text', default: 'a', doc: 'another seed scatters them differently'},
    near: {type: 'px', default: -200, doc: 'the depth of the nearest motes'},
    far: {type: 'px', default: 2400, doc: 'the depth of the farthest motes'},
    count: {type: 'number', default: 26, doc: 'motes on each of the four depths'},
    amount: {type: 'progress', default: 1, doc: '0 clear air, 1 all of them'},
  },
  preview: 14.6,
};

const DEPTHS = 4;

/** One depth's motes as one painted sheet of soft discs, so the whole cloud is ground the picture stands on, not ink on it */
function Layer({kind, seed, count, amount, size}: {kind: string; seed: string; count: number; amount: number; size: number}) {
  const t = useDocTime();
  const motes = useMemo(() => {
    const g = random(`depth-stage:motes:${kind}:${seed}`);
    return Array.from({length: count}, () => ({x: g() * SHEET.w, y: g() * SHEET.h, r: 0.5 + g(), speed: 0.5 + g(), phase: g() * 6.28, warm: g()}));
  }, [kind, seed, count]);
  const fall = kind === 'ash' ? 1 : kind === 'embers' ? -1.6 : 0.08;
  const discs = motes.map((m) => {
    const sway = Math.sin(t * 0.5 * m.speed + m.phase) * 40;
    const x = (((m.x + sway + t * 14 * m.speed) % SHEET.w) + SHEET.w) % SHEET.w;
    const y = (((m.y + t * 70 * fall * m.speed) % SHEET.h) + SHEET.h) % SHEET.h;
    const flick = kind === 'embers' ? 0.55 + 0.45 * Math.sin(t * 9 * m.speed + m.phase) : 1;
    const r = Math.max(1.2, size * m.r * (kind === 'embers' ? 1.4 : 1));
    const color = kind === 'embers'
      ? `color-mix(in srgb, color-mix(in oklab, var(--vt-data), var(--vt-text) ${Math.round(m.warm * 50)}%) ${Math.round(85 * flick)}%, transparent)`
      : kind === 'ash'
        ? 'color-mix(in srgb, color-mix(in oklab, var(--vt-grad), var(--vt-text) 30%) 60%, transparent)'
        : `color-mix(in srgb, color-mix(in oklab, var(--vt-text), var(--vt-data) ${Math.round(m.warm * 40)}%) 55%, transparent)`;
    return `radial-gradient(circle ${r.toFixed(1)}px at ${x.toFixed(0)}px ${y.toFixed(0)}px, ${color}, transparent)`;
  });
  return <div style={{position: 'absolute', left: SHEET.x, top: SHEET.y, width: SHEET.w, height: SHEET.h, opacity: unit(amount), background: discs.join(', ')}} />;
}

export function Motes({kind = 'dust', seed = 'a', near = -200, far = 2400, count = 26, amount = 1}: {
  kind?: string; seed?: string; near?: number; far?: number; count?: number; amount?: number;
}) {
  if (amount <= 0.01) return null;
  return (
    <>
      {Array.from({length: DEPTHS}, (_, i) => {
        const z = near + ((far - near) * i) / (DEPTHS - 1);
        // a nearer mote is drawn larger; the lens then turns it into a disc of soft light
        return <Plane key={i} z={z}><Layer kind={kind} seed={`${seed}:${i}`} count={count} amount={amount} size={i === 0 ? 9 : i === 1 ? 5 : 3} /></Plane>;
      })}
    </>
  );
}
