import {CANVAS, Plate, Screens, W, type Ink} from './riso.ts';

export const meta = {
  name: {en: 'Sheet', 'zh-CN': '纸张'},
  purpose: 'ground',
  line: 'Warm duplicator paper with tooth and fibres, registration targets and a colour bar; a second layer over everything shows paper through the ink as pinholes and mottling.',
  fits: 'every scene: the ground under all parts, and the grain over them (layer="grain")',
  params: {
    layer: {type: "'ground' | 'grain'", default: "'ground'", doc: 'ground: the paper, under everything; grain: the ink\'s pinholes and uneven density, over everything'},
    marks: {type: 'boolean', default: true, doc: 'the registration targets and the colour bar along the top edge'},
    slip: {type: 'progress', default: 0, doc: 'knocks the marks out of register with an accent elsewhere, so the whole sheet feels the knock'},
  },
  preview: 4.3,
};

// the paper's tooth and fibres: one tile, drawn once and repeated by the browser
const TOOTH = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420"><filter id="t" x="0" y="0" width="100%" height="100%">'
  + '<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="11" stitchTiles="stitch"/>'
  + '<feColorMatrix type="matrix" values="0 0 0 0 0.42 0 0 0 0 0.37 0 0 0 0 0.3 0 0 0 -0.9 0.5"/></filter>'
  + '<filter id="f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.09" numOctaves="2" seed="5" stitchTiles="stitch"/>'
  + '<feColorMatrix type="matrix" values="0 0 0 0 0.5 0 0 0 0 0.45 0 0 0 0 0.36 0 0 0 -0.8 0.42"/></filter>'
  + '<rect width="420" height="420" filter="url(#t)"/><rect width="420" height="420" filter="url(#f)" opacity="0.5"/></svg>')}")`;
// paper showing through ink: speckles of the paper's own colour, laid on with `lighten`, so they change ink and leave bare paper as it is
const PINHOLES = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><filter id="p" x="0" y="0" width="100%" height="100%">'
  + '<feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="2" seed="23" stitchTiles="stitch"/>'
  + '<feColorMatrix type="matrix" values="0 0 0 0 0.953 0 0 0 0 0.933 0 0 0 0 0.890 0 0 0 9 -5.6"/></filter>'
  + '<rect width="512" height="512" filter="url(#p)"/></svg>')}")`;
// the drum's uneven inking: slow clouds and streaks along the feed, a little paler where the drum ran dry
const MOTTLE = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><filter id="m" x="0" y="0" width="100%" height="100%">'
  + '<feTurbulence type="fractalNoise" baseFrequency="0.0028 0.011" numOctaves="3" seed="7"/>'
  + '<feColorMatrix type="matrix" values="0 0 0 0 0.953 0 0 0 0 0.933 0 0 0 0 0.890 0 0 0 1.5 -0.62"/></filter>'
  + '<rect width="1920" height="1080" filter="url(#m)"/></svg>')}")`;

const Target = ({x, y}: {x: number; y: number}) => (
  <g>
    <circle cx={x} cy={y} r={11} fill="none" stroke="currentColor" strokeWidth={2.2} />
    <path d={`M${x - 20} ${y - 1.1}h40v2.2h-40zM${x - 1.1} ${y - 20}h2.2v40h-2.2z`} />
  </g>
);

export function Paper({layer = 'ground', marks = true, slip = 0}: {layer?: 'ground' | 'grain'; marks?: boolean; slip?: number}) {
  if (layer === 'grain') {
    return (
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        <div style={{position: 'absolute', inset: 0, backgroundImage: MOTTLE, mixBlendMode: 'lighten', opacity: 0.42}} />
        <div style={{position: 'absolute', inset: 0, backgroundImage: PINHOLES, mixBlendMode: 'lighten', opacity: 0.75}} />
      </div>
    );
  }
  const plate = (ink: Ink) => (
    <Plate ink={ink} slip={slip}>
      <g color={`var(--vt-${ink === 'blue' ? 'data' : 'grad'})`}>
        <Target x={64} y={62} /><Target x={W - 64} y={62} />
      </g>
    </Plate>
  );
  return (
    <div style={{position: 'absolute', inset: 0, background: 'var(--vt-bg)', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, backgroundImage: TOOTH, opacity: 0.55}} />
      {/* a faint warmth toward the edges, as a sheet off the stack is never evenly lit */}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(130% 110% at 50% 42%, transparent 55%, rgba(150, 120, 80, 0.10))'}} />
      {marks && (
        <svg {...CANVAS}>
          <Screens />
          {plate('blue')}{plate('pink')}
          {/* the colour bar: each ink alone, then the two over each other */}
          <Plate ink="blue" slip={slip}><rect x={1676} y={50} width={30} height={24} /><rect x={1748} y={50} width={30} height={24} /></Plate>
          <Plate ink="pink" slip={slip}><rect x={1712} y={50} width={30} height={24} /><rect x={1748} y={50} width={30} height={24} /></Plate>
        </svg>
      )}
    </div>
  );
}
