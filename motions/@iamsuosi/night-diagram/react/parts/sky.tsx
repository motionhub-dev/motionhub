import {C, CANVAS, hash} from './night.ts';

export const meta = {
  name: {en: 'Night sky', 'zh-CN': '夜空'},
  purpose: 'ground',
  line: "A deep blue field, lighter at the horizon, with fine stars and a dark land line; a light in the scene pools on it.",
  fits: "every scene",
  params: {
    land: {type: 'number | null', default: 880, doc: 'y of the dark ground, above the caption band; null for open space'},
    stars: {type: 'number', default: 70, doc: 'how many stars, in the upper part of the frame'},
    glow: {type: '[x, y, r] | null', doc: 'where the light is coming from in this scene: a soft pool on the field'},
    light: {type: 'progress', default: 0, doc: 'how strong that pool is now: tween it on the word, spike it for a flash'},
    fade: {type: 'progress', default: 1, doc: 'how much of the land shows: tween it away as the camera leaves the ground'},
    tone: {type: 'string', doc: "the colour of the pool as 'r, g, b'; pale ice by default"},
  },
  preview: 15.6,
};

export function Sky({land = 880, stars = 70, glow, light = 0, fade = 1, tone = '191, 239, 255'}: {land?: number | null; stars?: number; fade?: number; glow?: [number, number, number] | null; light?: number; tone?: string}) {
  const field = `linear-gradient(${C.deep}, ${C.night} 75%, ${C.dusk})`;
  return (
    <div style={{position: 'absolute', inset: 0, background: field}}>
      {glow && light > 0.001 && <div style={{position: 'absolute', inset: 0, opacity: light, background: `radial-gradient(${glow[2]}px ${glow[2] * 0.62}px at ${glow[0]}px ${glow[1]}px, rgba(${tone}, 0.9), rgba(${tone}, 0))`}} />}
      {land != null && <div style={{position: 'absolute', inset: 0, opacity: fade, background: `linear-gradient(transparent ${land}px, ${C.land} ${land}px)`}} />}
      <svg {...CANVAS}>
        {Array.from({length: stars}, (_, i) => <circle key={i} cx={hash(i) * 1920} cy={hash(i + 90) * 460} r={0.8 + hash(i + 7) * 1.6} fill="#CFE2FF" opacity={0.2 + hash(i + 3) * 0.5} />)}
        {land != null && fade > 0.02 && <path opacity={fade} d={`M300 ${land}V${land - 26}H340V${land}ZM460 ${land}V${land - 46}H500V${land}ZM640 ${land}V${land - 16}H700V${land}ZM1180 ${land}V${land - 22}H1216V${land}Z`} fill={C.land} />}
      </svg>
    </div>
  );
}
