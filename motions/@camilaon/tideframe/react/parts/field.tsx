import {seededRandom} from '@motionhub/runtime';

export const meta = {
  name: {en: 'Field', 'zh-CN': '潮场'},
  purpose: 'ground',
  line: 'A tide-navy field with a square grid, a soft cyan pool above and a low green wash.',
  fits: 'every scene, behind the schematic, the board and the type',
  params: {
    wash: {type: 'progress', default: 0.85, doc: 'how strong the low green wash is, 0 to 1'},
    drift: {type: 'px', default: 0, doc: 'slides the grid sideways; a few pixels over a scene, never a pan'},
  },
  preview: 4.2,
};

const GRAIN = (() => {
  const g = seededRandom('tideframe:grain');
  return Array.from({length: 840}, () => `M${Math.round(g() * 1920)} ${Math.round(g() * 880)}h1`).join('');
})();

const grid = (drift: number) => {
  const step = 64;
  const shift = ((drift % step) + step) % step;
  const parts: string[] = [];
  for (let x = -step; x <= 1920 + step; x += step) parts.push(`M${(x + shift).toFixed(1)} 0V900`);
  for (let y = step; y <= 900; y += step) parts.push(`M0 ${y}H1920`);
  return parts.join('');
};

export function Field({wash = 0.85, drift = 0}: {wash?: number; drift?: number}) {
  const w = Math.max(0, Math.min(1, wash));
  return (
    <div style={{position: 'absolute', inset: 0, background: 'var(--color-bg)', overflow: 'hidden'}}>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <path d={grid(drift)} stroke="var(--color-faint)" strokeOpacity={0.45} strokeWidth={1} />
        <path d={GRAIN} stroke="#ffffff" strokeOpacity={0.04} strokeWidth={1} />
      </svg>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(70% 48% at 12% 0%, color-mix(in srgb, var(--color-grad) 18%, transparent), transparent 60%)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 560, height: 300, opacity: w, background: 'linear-gradient(180deg, transparent, color-mix(in srgb, var(--color-data) 16%, transparent), transparent)'}} />
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(130% 110% at 50% 42%, transparent 52%, rgba(0,0,0,0.42) 100%)'}} />
    </div>
  );
}
