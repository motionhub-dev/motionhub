// The eruption column of this sample: a trunk of ash boiling up from the crater and spreading at its top like an umbrella pine, lit from
// below by the vent, with lightning flickering inside it.
import {useMemo} from 'react';
import {random, useDocTime} from '@visotalk/runtime';
import {SHEET, Sheet, Glow, hazed, unit, useLook} from '../../parts/stage.tsx';

const r1 = (v: number) => Math.round(v * 10) / 10;
const circle = (x: number, y: number, r: number) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 1 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 1 ${r1(-2 * r)} 0Z`;

type Billow = {f: number; a: number; dx: number; dy: number; r: number; speed: number; phase: number};

export function Plume({x, base, height, rise}: {x: number; base: number; height: number; rise: number}) {
  const {fog} = useLook();
  const t = useDocTime();
  const k = unit(rise);
  const billows = useMemo(() => {
    const g = random('depth-stage-sample:plume');
    const trunk: Billow[] = Array.from({length: 120}, () => ({f: g(), a: 0, dx: g() - 0.5, dy: g() - 0.5, r: 0.35 + g() * 0.3, speed: 0.6 + g(), phase: g() * 6.28}));
    const crown: Billow[] = Array.from({length: 110}, () => ({f: g(), a: (g() - 0.5) * 2, dx: g() - 0.5, dy: g() - 0.5, r: g(), speed: 0.3 + g() * 0.6, phase: g() * 6.28}));
    return {trunk, crown};
  }, []);
  const top = base - height * k;
  // the column boils: every billow turns over on its own slow cycle, and the whole column keeps climbing
  const trunk = billows.trunk.filter((b) => b.f * height < base - top - 30).map((b) => {
    const f = b.f, w = 26 + 90 * f, roll = t * b.speed + b.phase;
    return circle(x + b.dx * w * 1.1 + 18 * Math.sin(f * 7 + t * 0.3) + Math.sin(roll) * 8, base - f * height * k + b.dy * 10 + Math.cos(roll) * 6, w * b.r * (1 + 0.08 * Math.sin(roll * 1.3)));
  });
  const spread = unit((k - 0.55) / 0.45);
  const crown = billows.crown.filter((_, i) => i < 110 * spread).map((b) => {
    const w = (200 + 220 * spread + 30 * t * 0.2) * b.a, roll = t * b.speed + b.phase;
    return circle(x + w + 40 * spread + Math.sin(roll) * 10, top + 40 + Math.abs(b.a) * 50 + b.dy * 70 * (1 - Math.abs(b.a) * 0.6) + Math.cos(roll) * 6, 22 + b.r * 42 * (1 - Math.abs(b.a) * 0.5));
  });
  const d = [...trunk, ...crown].join('');
  // lightning in the column: short bright forks, now and then, once the column stands
  const g = random(`depth-stage-sample:bolt:${Math.floor(t / 1.7)}`);
  const strike = k > 0.6 && (t % 1.7) < 0.16 ? 1 - (t % 1.7) / 0.16 : 0;
  let bolt = '';
  if (strike > 0) {
    let bx = x + (g() - 0.5) * 160, by = top + 70 + g() * 50;
    bolt = `M${r1(bx)} ${r1(by)}`;
    for (let i = 0; i < 5; i++) {
      bx += (g() - 0.5) * 60; by += 14 + g() * 18; bolt += `L${r1(bx)} ${r1(by)}`;
      if (g() < 0.45) { let fx = bx, fy = by; bolt += `M${r1(fx)} ${r1(fy)}`; for (let j = 0; j < 2; j++) { fx += (g() - 0.3) * 50; fy += 10 + g() * 14; bolt += `L${r1(fx)} ${r1(fy)}`; } bolt += `M${r1(bx)} ${r1(by)}`; }
    }
  }
  return (
    <>
      <Sheet d={d} paint={`linear-gradient(180deg, ${hazed('color-mix(in oklab, var(--vt-panel), var(--vt-grad) 34%)', fog * 0.5)} ${Math.round(top - SHEET.y)}px, ${hazed('color-mix(in oklab, var(--vt-panel), var(--vt-grad) 14%)', fog * 0.4)} ${Math.round(base - height * 0.4 - SHEET.y)}px, color-mix(in oklab, var(--vt-panel), var(--vt-data) 55%) ${Math.round(base - SHEET.y)}px)`} />
      {strike > 0 && <Glow x={x} y={top + 150} r={340} color="color-mix(in oklab, var(--vt-text), var(--vt-op) 40%)" alpha={strike * 0.55} />}
      {strike > 0 && <Sheet d={bolt} stroke={2.5} paint="color-mix(in oklab, var(--vt-text), var(--vt-op) 25%)" opacity={strike} />}
    </>
  );
}
