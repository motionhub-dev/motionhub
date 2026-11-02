// The locator an atlas prints in a corner of a close plate: a small globe turned to where the camera is, with the frame's own footprint
// drawn on it in red. It comes in once the camera is close, so a viewer never loses where on the Earth the town is.
import React, {useMemo} from 'react';
import {useView, makeView, WORLD, band, unit, type View} from './geo.ts';

export const meta = {
  name: {en: 'Locator', 'zh-CN': '位置小图'},
  purpose: 'mark',
  line: 'A small globe in a corner, turned to where the camera is, with the frame\'s footprint in red; it shows once the camera is close.',
  fits: 'every close view (a town, a valley, a coast); the moment a zoom lands',
  params: {
    x: {type: 'px', default: 1660, doc: 'its centre, across'},
    y: {type: 'px', default: 250, doc: 'its centre, down'},
    r: {type: 'px', default: 120, doc: 'its radius'},
    zoom: {type: 'number', default: 0, doc: 'how close the small globe is: 0 is the whole hemisphere filling the disc; more crops closer'},
    show: {type: 'progress', default: 1, doc: 'its opacity; it also waits for the main camera to be close'},
  },
  preview: 27.0,
};

export function Locator({x = 1660, y = 250, r = 120, zoom = 0, show = 1}: {x?: number; y?: number; r?: number; zoom?: number; show?: number}) {
  const main = useView();
  const a = unit(show) * band(main.zoom, 3.4, 4.4);
  // the small globe's own camera: the main camera's centre, at the locator's zoom, sized to its radius
  const scale = r / (0.44 * 1080);
  const mini: View = useMemo(() => makeView(main.lon, main.lat, zoom, 960, 540), [main.lon, main.lat, zoom]);
  if (a <= 0.01) return null;
  const land = WORLD.countries.filter(mini.sees).map(mini.path).join('');
  // the frame's corners and edges under the main camera, drawn on the small globe
  const edge: string[] = [];
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= 40; i++) pts.push([1920 * (i / 40), 0]);
  for (let i = 0; i <= 24; i++) pts.push([1920, 1080 * (i / 24)]);
  for (let i = 40; i >= 0; i--) pts.push([1920 * (i / 40), 1080]);
  for (let i = 24; i >= 0; i--) pts.push([0, 1080 * (i / 24)]);
  for (const [px, py] of pts) {
    const g = main.under(px, py);
    if (!g) continue;
    const [mx, my] = mini.at(g[0], g[1]);
    edge.push(`${edge.length ? 'L' : 'M'}${mx.toFixed(1)} ${my.toFixed(1)}`);
  }
  const R = mini.k;
  return (
    <div style={{position: 'absolute', left: x - r - 14, top: y - r - 14, width: 2 * r + 28, height: 2 * r + 28, opacity: a}}>
      <svg width={2 * r + 28} height={2 * r + 28} viewBox={`${960 - (r + 14) / scale} ${540 - (r + 14) / scale} ${(2 * r + 28) / scale} ${(2 * r + 28) / scale}`}>
        <defs><clipPath id="fa-locator"><circle cx={960} cy={540} r={r / scale} /></clipPath></defs>
        <circle cx={960} cy={540} r={(r + 8) / scale} fill="var(--vt-panel)" stroke="var(--vt-border)" strokeWidth={1 / scale} />
        <g clipPath="url(#fa-locator)">
        <circle cx={960} cy={540} r={R} fill="var(--vt-panel2)" />
        <path d={land} fill="var(--vt-panel)" stroke="var(--vt-op)" strokeWidth={1.4 / scale} strokeLinejoin="round" />
        <circle cx={960} cy={540} r={R} fill="none" stroke="var(--vt-text)" strokeWidth={2 / scale} />
        </g>
        <circle cx={960} cy={540} r={r / scale} fill="none" stroke="var(--vt-text)" strokeWidth={1.6 / scale} />
        {edge.length > 2 && <path d={edge.join('') + 'Z'} fill="color-mix(in srgb, var(--vt-data) 20%, transparent)" stroke="var(--vt-data)" strokeWidth={3.5 / scale} strokeLinejoin="round" />}
        {edge.length > 2 && <circle cx={960} cy={540} r={5 / scale} fill="var(--vt-data)" />}
      </svg>
    </div>
  );
}
