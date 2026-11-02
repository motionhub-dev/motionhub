// A name on the map, set by the atlas's rules for what it names: a town is a dot and its name in the serif, a country or a state is
// spaced small capitals over its land, water is the serif in italic and in the water's own blue, and the place the film is about is a red
// ring. A name belongs to a range of zoom: it fades in as the camera comes close enough for it and out when the camera is too close.
import React from 'react';
import {useView, band, unit, W, H} from './geo.ts';

export const meta = {
  name: {en: 'Place', 'zh-CN': '地名'},
  purpose: 'mark',
  line: 'A name set by kind: a town as a dot and serif name, a country or state in spaced capitals, water in blue italic, the place that matters in a red ring; shown in a range of zoom.',
  fits: 'every name the narration says, on its word; towns along a route; the point where two things meet',
  params: {
    lon: {type: 'degrees', doc: 'where it is'},
    lat: {type: 'degrees', doc: 'where it is'},
    name: {type: 'text', doc: 'the name as the atlas prints it'},
    note: {type: 'text', doc: 'optional: a second line in small type (a date, a population, a height)'},
    kind: {type: "'town' | 'country' | 'region' | 'water' | 'point'", default: 'town', doc: 'what it names, which decides how it is set'},
    side: {type: "'right' | 'left' | 'above' | 'below'", default: 'right', doc: 'where the name sits from a town or a point'},
    size: {type: 'px', doc: 'the name\'s size; each kind has its own default'},
    zoomIn: {type: 'number', default: -9, doc: 'the zoom from which it shows (it fades in over the next third of a step)'},
    zoomOut: {type: 'number', default: 99, doc: 'the zoom past which it fades away again'},
    show: {type: 'progress', default: 0, doc: 'its entrance, on the word that names it'},
    ripple: {type: 'progress', default: 0, doc: 'a point only: 0 to 1 sends three red rings out from it, on the word that lands it'},
  },
  preview: 22.4,
};

const DEFAULT = {town: 36, country: 32, region: 30, water: 36, point: 40} as const;

export function Place({lon, lat, name, note, kind = 'town', side = 'right', size, zoomIn = -9, zoomOut = 99, show = 0, ripple = 0}: {
  lon: number; lat: number; name: string; note?: string; kind?: keyof typeof DEFAULT; side?: 'right' | 'left' | 'above' | 'below'; size?: number; zoomIn?: number; zoomOut?: number; show?: number; ripple?: number;
}) {
  const view = useView();
  const a = unit(show) * band(view.zoom, zoomIn, zoomIn + 0.3) * (1 - band(view.zoom, zoomOut, zoomOut + 0.3));
  if (a <= 0.01) return null;
  const [x, y, vis] = view.at(lon, lat);
  if (!vis || x < -400 || x > 2320 || y < -200 || y > 1280) return null;
  // a centred name (a country, a state, a sea) fades as the camera carries it toward the frame's edge, so no name is ever cut off
  const wide = kind === 'country' || kind === 'region' || kind === 'water';
  // a town's name hides before it reaches the frame's edge or the caption band below y 820
  const room = wide ? band(Math.min(x, W - x), 300, 360) * band(Math.min(y, H - y), 90, 120) : band(Math.min(x, W - x), 150, 210) * band(y, 50, 80) * band(H - y, 260, 300);
  if (a * room <= 0.01) return null;
  const s = size ?? DEFAULT[kind];
  const spaced = kind === 'country' || kind === 'region';
  const text: React.CSSProperties = {
    fontFamily: spaced ? 'var(--vt-sans)' : 'var(--vt-display)', fontSize: s, lineHeight: 1.1, whiteSpace: 'nowrap',
    fontWeight: spaced ? 600 : kind === 'point' ? 600 : 500, fontStyle: kind === 'water' ? 'italic' : 'normal',
    letterSpacing: spaced ? '0.24em' : kind === 'water' ? '0.12em' : '0.005em', textTransform: spaced ? 'uppercase' : 'none',
    color: kind === 'water' ? 'var(--vt-op)' : spaced ? 'var(--vt-muted)' : 'var(--vt-text)',
    // a paper halo, as an atlas knocks the lines out behind a name, so it reads over borders and fills
    textShadow: kind === 'water' ? 'none' : '0 0 2px var(--vt-panel), 0 0 4px var(--vt-panel), 0 0 7px var(--vt-panel)',
  };
  const small: React.CSSProperties = {fontFamily: 'var(--vt-sans)', fontSize: Math.max(28, Math.round(s * 0.78)), fontStyle: 'normal', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'none', color: 'var(--vt-muted)', marginTop: 4};
  const label = <div style={text}>{name}{note && <div style={small}>{note}</div>}</div>;
  if (kind === 'country' || kind === 'region' || kind === 'water') {
    return <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) translateY(${(1 - unit(show)) * 6}px)`, opacity: a * room, textAlign: 'center'}}>{label}</div>;
  }
  const mark = kind === 'point' ? 30 : 14;
  const gap = kind === 'point' ? 34 : 14;
  const pos: Record<string, React.CSSProperties> = {
    right: {left: x + gap, top: y, transform: 'translateY(-50%)'},
    left: {left: x - gap, top: y, transform: 'translate(-100%, -50%)', textAlign: 'right'},
    above: {left: x, top: y - gap, transform: 'translate(-50%, -100%)', textAlign: 'center'},
    below: {left: x, top: y + gap, transform: 'translateX(-50%)', textAlign: 'center'},
  };
  const grow = 0.6 + 0.4 * unit(show);
  return (
    <>
      {kind === 'point' && ripple > 0 && ripple < 1 && (
        <svg width={2} height={2} style={{position: 'absolute', left: x - 1, top: y - 1, overflow: 'visible', opacity: a}}>
          {[0, 0.18, 0.36].map((d) => {
            const p = unit((ripple - d) / 0.64), e = 1 - Math.pow(1 - p, 3);
            return p > 0 && p < 1 ? <circle key={d} cx={1} cy={1} r={24 + e * 230} fill="none" stroke="var(--vt-data)" strokeWidth={3 * (1 - p) + 0.6} opacity={0.85 * (1 - p)} /> : null;
          })}
        </svg>
      )}
      <svg width={mark * 2} height={mark * 2} style={{position: 'absolute', left: x - mark, top: y - mark, overflow: 'visible', opacity: a}}>
        {kind === 'point'
          ? <g transform={`translate(${mark} ${mark}) scale(${grow})`}><circle r={mark - 6} fill="none" stroke="var(--vt-panel)" strokeWidth={8} /><circle r={mark - 6} fill="none" stroke="var(--vt-data)" strokeWidth={4} /><circle r={4} fill="var(--vt-data)" /></g>
          : <g transform={`translate(${mark} ${mark})`}><circle r={7.5} fill="var(--vt-panel)" stroke="var(--vt-text)" strokeWidth={2.6} /><circle r={3} fill="var(--vt-text)" /></g>}
      </svg>
      <div style={{position: 'absolute', opacity: a, ...pos[side]}}>{label}</div>
    </>
  );
}
