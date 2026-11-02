import {random} from '@visotalk/runtime';

export const meta = {
  name: {en: 'Stage', 'zh-CN': '舞台'},
  purpose: 'ground',
  line: 'A dark matte stage with one soft pool of light that moves to whatever the narration is about.',
  fits: 'every scene; tween the light to the subject on the word that names it (props spotX, spotY, spotR: x and y would move the whole stage)',
  params: {
    spotX: {type: 'px', default: 960, doc: 'the light\'s centre, across the canvas'},
    spotY: {type: 'px', default: 470, doc: 'the light\'s centre, down the canvas'},
    spotR: {type: 'px', default: 620, doc: 'the light\'s radius; smaller is a tighter spot'},
  },
  preview: 0.5,
};

// a fine grain over the dark, so gradients do not band in a video
const GRAIN = (() => {
  const g = random('stage-light:grain');
  return Array.from({length: 760}, () => `M${Math.round(g() * 1916)} ${Math.round(g() * 876)}h1.5`).join('');
})();

export function Stage({spotX = 960, spotY = 470, spotR = 620}: {spotX?: number; spotY?: number; spotR?: number}) {
  return (
    <div style={{position: 'absolute', inset: 0, background: 'var(--vt-bg)', overflow: 'hidden'}}>
      {/* the pool of light, warm at its heart */}
      <div style={{position: 'absolute', inset: 0,
        background: `radial-gradient(${Math.round(spotR)}px ${Math.round(spotR * 0.78)}px at ${Math.round(spotX)}px ${Math.round(spotY)}px, color-mix(in srgb, var(--vt-grad) 17%, transparent), color-mix(in srgb, var(--vt-grad) 6%, transparent) 55%, transparent 100%)`}} />
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(130% 120% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />
      {/* the grain stops above the caption band, which a drawing may not reach */}
      <svg width={1920} height={880} style={{position: 'absolute', left: 0, top: 0}}><path d={GRAIN} stroke="#ffffff" strokeOpacity={0.05} strokeWidth={1.5} /></svg>
    </div>
  );
}
