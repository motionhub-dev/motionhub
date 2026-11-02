import {ease, fid, hash} from './ink.ts';

export const meta = {
  name: {en: 'Seal', 'zh-CN': '印章'},
  purpose: 'close',
  line: 'A square vermilion seal pressed on the word that concludes: carved characters, uneven paste, a faint bleed of red.',
  fits: 'the verdict or the moral of the story; the one figure the film was about; the end of the scroll, once',
  params: {
    text: {type: 'text', doc: 'two to four characters, read down the right column first, as a seal is'},
    stamp: {type: 'progress', default: 1, doc: '0 to 1: pressed down, then lifted to leave the print; tween it over half a second on the concluding word'},
    size: {type: 'px', default: 150, doc: 'the side of the seal'},
    carve: {type: 'white | red', default: 'white', doc: 'white: the characters cut away, paper showing through the red; red: the characters themselves in red inside a red border'},
  },
  preview: 48,
};

export function Seal({text, stamp = 1, size = 150, carve = 'white'}: {text: string; stamp?: number; size?: number; carve?: 'white' | 'red'}) {
  const chars = [...text].slice(0, 4), n = chars.length, seed = hash(text) % 997, id = fid('seal', text + carve);
  // two columns for three or four characters, read right column first; one column for one or two
  const cols = n > 2 ? 2 : 1, rows = Math.ceil(n / cols), w = cols === 1 && n === 2 ? size * 0.62 : size, h = size;
  const pad = size * 0.1, cw = (w - pad * 2) / cols, ch = (h - pad * 2) / rows;
  const cells = chars.map((c, i) => ({c, x: w - pad - cw * (Math.floor(i / rows) + 0.5), y: pad + ch * ((i % rows) + 0.5)}));
  // pressed in with a little overshoot, then held; the paper drinks a halo of red after it is lifted
  const press = ease(stamp, 0, 0.4), settle = ease(stamp, 0.4, 0.7), bleed = ease(stamp, 0.55, 1);
  const scale = 1.28 - 0.31 * press + 0.03 * settle, rot = -2.4 + 0.6 * press;
  if (stamp <= 0) return null;
  const glyphs = (fill: string) => cells.map((g) => (
    <text key={g.x + ':' + g.y} x={g.x} y={g.y} dominantBaseline="central" textAnchor="middle" fill={fill}
      style={{fontFamily: '"Noto Serif SC", serif', fontWeight: 900, fontSize: Math.min(cw, ch) * 0.92}}>{g.c}</text>
  ));
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: press,
      transform: `rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`, transformOrigin: '50% 50%'}}>
      <defs>
        <filter id={`${id}-worn`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={size * 0.035} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* the paste: dense on the whole, thin in places, with flecks where none took */}
        <filter id={`${id}-paste`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed={seed + 3} result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2.05" result="a" />
          <feComposite in="SourceGraphic" in2="a" operator="in" />
        </filter>
        <mask id={`${id}-cut`} maskUnits="userSpaceOnUse" x={-10} y={-10} width={w + 20} height={h + 20}>
          <g filter={`url(#${id}-worn)`}>
            {carve === 'white'
              ? <><rect x={0} y={0} width={w} height={h} rx={size * 0.04} fill="#fff" />{glyphs('#000')}</>
              : <><rect x={size * 0.03} y={size * 0.03} width={w - size * 0.06} height={h - size * 0.06} rx={size * 0.05} fill="none" stroke="#fff" strokeWidth={size * 0.06} />{glyphs('#fff')}</>}
          </g>
        </mask>
      </defs>
      <rect x={-6} y={-6} width={w + 12} height={h + 12} rx={size * 0.1} fill="var(--vt-grad)" opacity={0.1 * bleed} style={{filter: `blur(${(size * 0.05).toFixed(1)}px)`}} />
      <g filter={`url(#${id}-paste)`}>
        <rect x={-4} y={-4} width={w + 8} height={h + 8} fill="var(--vt-grad)" mask={`url(#${id}-cut)`} opacity={0.94} />
      </g>
    </svg>
  );
}
