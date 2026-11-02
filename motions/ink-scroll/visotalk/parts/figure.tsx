import {TONE, ease, fid, strokeOutline, type Pt} from './ink.ts';

export const meta = {
  name: {en: 'Figure', 'zh-CN': '人物'},
  purpose: 'quote',
  line: 'A person in a few strokes: a pale wash for the robe, loaded strokes for its contour, dark ink for the head.',
  fits: 'the person a story turns on; a traveller on a road; small against the hills, never a portrait',
  params: {
    pose: {type: 'stand | walk', default: 'stand', doc: 'standing still, or walking in the direction it faces'},
    facing: {type: 'left | right', default: 'left', doc: 'which way it looks; on a handscroll a traveller faces left, the way the story goes'},
    carry: {type: 'boolean', default: false, doc: 'a bundle on the back, for someone carrying something a long way'},
    size: {type: 'px', default: 180, doc: 'its height, feet to head'},
    paint: {type: 'progress', default: 1, doc: '0 to 1: painted in the order a painter would: robe, contour, head and feet'},
  },
  preview: 9,
};

const ROBE = {
  stand: 'M50 46 C 36 52, 32 82, 31 120 C 30 150, 27 168, 26 179 C 44 183, 62 183, 76 178 C 74 156, 71 126, 70 98 C 74 104, 78 110, 80 118 C 80 98, 74 68, 60 50 Z',
  walk: 'M50 46 C 36 52, 30 80, 28 120 C 26 150, 22 168, 18 178 C 40 183, 64 181, 82 174 C 76 150, 71 122, 69 94 C 77 99, 85 105, 90 113 C 86 96, 76 70, 62 51 Z',
};
const LINES: Record<'stand' | 'walk', {pts: Pt[]; w: number; tone: number}[]> = {
  stand: [
    {pts: [[48, 50], [37, 74], [33, 118], [28, 178]], w: 7, tone: TONE.thick},
    {pts: [[61, 54], [72, 82], [79, 116]], w: 6, tone: TONE.thick},
    {pts: [[35, 98], [52, 102], [69, 98]], w: 4, tone: TONE.heavy},
  ],
  walk: [
    {pts: [[48, 50], [34, 72], [30, 112], [20, 177]], w: 7, tone: TONE.thick},
    {pts: [[61, 55], [73, 84], [89, 111]], w: 6, tone: TONE.thick},
    {pts: [[33, 97], [52, 101], [68, 96]], w: 4, tone: TONE.heavy},
  ],
};
const FEET: Record<'stand' | 'walk', Pt[][]> = {
  stand: [[[40, 179], [38, 197]], [[58, 179], [60, 197]]],
  walk: [[[32, 177], [24, 196]], [[64, 176], [74, 195]]],
};

export function Figure({pose = 'stand', facing = 'left', carry = false, size = 180, paint = 1}: {pose?: 'stand' | 'walk'; facing?: 'left' | 'right'; carry?: boolean; size?: number; paint?: number}) {
  const id = fid('figure', `${pose}${carry}`), k = size / 200;
  const robe = ease(paint, 0, 0.45), line = (paint - 0.3) / 0.45, head = ease(paint, 0.7, 0.95);
  if (paint <= 0) return null;
  return (
    <svg width={100 * k} height={200 * k} viewBox="0 0 100 200" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <filter id={`${id}-soak`} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" seed="12" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="1.6" result="soft" />
          <feGaussianBlur in="d" stdDeviation="5" result="wide" />
          <feComposite in="soft" in2="wide" operator="arithmetic" k1="0" k2="1.7" k3="-1" k4="0" />
        </filter>
        <filter id={`${id}-wet`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="0.5" />
        </filter>
      </defs>
      <g transform={facing === 'left' ? 'translate(100 0) scale(-1 1)' : undefined}>
        <g opacity={TONE.light * robe} filter={`url(#${id}-soak)`}>
          <path d={ROBE[pose]} fill="var(--vt-text)" />
          {carry && <ellipse cx={24} cy={74} rx={17} ry={22} fill="var(--vt-text)" />}
        </g>
        <g filter={`url(#${id}-wet)`}>
          {LINES[pose].map((l, i) => <path key={i} d={strokeOutline(l.pts, l.w, line * 1.6 - i * 0.3, 40 + i)} fill="var(--vt-text)" fillOpacity={l.tone} />)}
          {carry && <path d={strokeOutline([[48, 54], [32, 62], [22, 90]], 3.5, line * 1.4 - 0.4, 77)} fill="var(--vt-text)" fillOpacity={TONE.heavy} />}
          <g opacity={head}>
            <ellipse cx={55} cy={35} rx={10} ry={11} fill="var(--vt-text)" fillOpacity={TONE.thick} />
            <path d={strokeOutline([[50, 25], [56, 21], [61, 26]], 6, 1, 9)} fill="var(--vt-text)" fillOpacity={TONE.burnt} />
            {FEET[pose].map((f, i) => <path key={i} d={strokeOutline(f, 5, 1, 60 + i)} fill="var(--vt-text)" fillOpacity={TONE.burnt} />)}
          </g>
        </g>
      </g>
    </svg>
  );
}
