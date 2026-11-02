import {useAsset} from '@visotalk/runtime';
import {useZoom} from './board.tsx';

export const meta = {
  name: {en: 'Photograph', 'zh-CN': '照片'},
  purpose: 'data',
  line: 'A real photograph as a print with its holder\'s caption; crop corners close in on the detail named.',
  fits: 'the damage, the place, the sign: licensed and credited',
  params: {
    asset: {type: 'text', doc: 'the id of the image asset declared in <Doc>'},
    w: {type: 'px', doc: 'the print\'s width inside its mount, in board pixels'},
    h: {type: 'px', doc: 'the print\'s height: the image\'s own aspect, never stretched'},
    caption: {type: 'text', default: '', doc: 'what the photograph shows, as its holder\'s caption says it, one or two lines'},
    area: {type: 'box', default: null, doc: 'the detail to mark, as fractions of the image: {x, y, w, h}'},
    crop: {type: 'progress', default: 0, doc: '0 to 1: the four crop corners close in on `area` from the print\'s corners; tween it on the word that names the detail'},
  },
  preview: 24.6,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => { const u = unit(v); return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2; };

export function Photo({asset, w, h, caption = '', area = null, crop = 0}: {asset: string; w: number; h: number; caption?: string; area?: {x: number; y: number; w: number; h: number} | null; crop?: number}) {
  const src = useAsset(asset);
  const z = useZoom();
  const c = ease(crop);
  // the corners travel from the print's own corners to the detail's, so the eye is led in rather than shown a box
  const box = area ? {x: area.x * w * c, y: area.y * h * c, w: w + (area.w * w - w) * c, h: h + (area.h * h - h) * c} : null;
  const arm = Math.min(46, (box?.w ?? 0) * 0.25), sw = 5 / Math.max(z, 0.6);
  return (
    <div style={{padding: '22px 22px 0'}}>
      <div style={{position: 'relative', width: w, height: h, overflow: 'hidden', background: '#000'}}>
        <img src={src} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.88) contrast(1.04)'}} />
        {/* a print's surface: a faint sheen from the lamp above */}
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0) 35%)'}} />
        {box && crop > 0.001 && (
          <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, opacity: unit(crop * 4)}}>
            {[[box.x, box.y, 1, 1], [box.x + box.w, box.y, -1, 1], [box.x, box.y + box.h, 1, -1], [box.x + box.w, box.y + box.h, -1, -1]].map(([x, y, dx, dy], i) => (
              <path key={i} d={`M${x + dx * arm} ${y} H${x} V${y + dy * arm}`} fill="none" stroke="var(--vt-data)" strokeWidth={sw} strokeLinecap="square" />
            ))}
          </svg>
        )}
      </div>
      <div style={{minHeight: 30, padding: '16px 4px 26px', fontFamily: 'var(--vt-display)', fontStyle: 'italic', fontSize: 25, lineHeight: 1.3, color: 'var(--vt-bg)', width: w}}>{caption}</div>
    </div>
  );
}
