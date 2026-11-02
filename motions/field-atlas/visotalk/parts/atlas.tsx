// The map every Field Atlas component is drawn on, and the camera that moves over it: one orthographic projection from the globe to a
// town (geo.ts), land and water in quiet tones, coasts lined with water as an engraved atlas lines them, a graticule, borders, lakes and
// rivers, and two instruments in the frame's corners that come from the same camera: the scale bar and the credit.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useDocTime} from '@visotalk/runtime';
import {WORLD, ViewContext, makeView, along, band, unit, W, H, type Feature, type LonLat, type View} from './geo.ts';

export const meta = {
  name: {en: 'Atlas', 'zh-CN': '地图'},
  purpose: 'ground',
  line: 'An editorial map under one camera that turns the globe and zooms in log space from the Earth to a town, its scale bar following; everything else is drawn on it.',
  fits: 'the whole film, as a part of <Doc>, so the camera never cuts; tween lon, lat and zoom, or follow a route',
  params: {
    lon: {type: 'degrees', default: -30, doc: 'the longitude at the centre of the frame'},
    lat: {type: 'degrees', default: 25, doc: 'the latitude at the centre of the frame'},
    zoom: {type: 'number', default: 0, doc: '0 is the whole globe; each step doubles the scale (about 3 is a continent, 6 a country, 9 a city); tween it linearly'},
    follow: {type: '[lon, lat][]', doc: 'a route the camera rides: the same points as the Route it follows'},
    followAt: {type: 'progress', default: 0, doc: 'how far along `follow` the camera is: tween it with the Route\'s draw'},
    followMix: {type: 'progress', default: 0, doc: '0 keeps the camera at lon, lat; 1 puts it on the route; tween it to pick the route up and set it down'},
    detail: {type: 'progress', default: 0, doc: 'fades out the vendored borders and rivers, for a close view where the work draws its own finer ones (Layer)'},
    grid: {type: 'progress', default: 1, doc: 'how strongly the graticule shows'},
    scale: {type: 'progress', default: 1, doc: 'the scale bar\'s opacity'},
    under: {type: 'node', doc: 'what is drawn on the land below the borders and rivers: Regions'},
  },
  preview: 40.6,
};

/** A step of the graticule that keeps about six lines across the frame */
function gridStep(view: View): number {
  const across = (W / view.k) / (Math.PI / 180);         // degrees across the frame at the centre
  for (const s of [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30]) if (across / s <= 9) return s;
  return 30;
}

function graticule(step: number): Feature[] {
  const lines: Feature[] = [];
  const RAD = Math.PI / 180, fine = Math.min(step, 2);
  const meridian = (lo: number) => { const pts: number[] = []; for (let la = -80; la <= 80.001; la += fine / 2) pts.push(lo * RAD, la * RAD); return pts; };
  const parallel = (la: number) => { const pts: number[] = []; for (let lo = -180; lo <= 180.001; lo += fine) pts.push(lo * RAD, la * RAD); return pts; };
  for (let lo = -180; lo < 180; lo += step) lines.push({id: `m${lo}`, name: '', rings: [Float64Array.from(meridian(lo))], lines: true, lon: lo * RAD, lat: 0, reach: Math.PI / 2});
  for (let la = -80; la <= 80; la += step) lines.push({id: `p${la}`, name: '', rings: [Float64Array.from(parallel(la))], lines: true, lon: 0, lat: la * RAD, reach: Math.PI});
  return lines;
}

/** The graticule near the camera only: at a close zoom a whole meridian is thousands of points, almost all off screen */
function nearGrid(view: View, step: number): Feature[] {
  if (step >= 2) return graticule(step);
  const RAD = Math.PI / 180, span = Math.max(step * 8, (W / view.k) / RAD * 1.2);
  const lo0 = Math.floor((view.lon - span) / step) * step, la0 = Math.floor((view.lat - span / 2) / step) * step;
  const out: Feature[] = [];
  for (let lo = lo0; lo <= view.lon + span; lo += step) {
    const pts: number[] = [];
    for (let la = la0; la <= view.lat + span / 2; la += step / 8) pts.push(lo * RAD, la * RAD);
    out.push({id: `m${lo}`, name: '', rings: [Float64Array.from(pts)], lines: true, lon: lo * RAD, lat: view.lat * RAD, reach: span * RAD});
  }
  for (let la = la0; la <= view.lat + span / 2; la += step) {
    const pts: number[] = [];
    for (let lo = lo0; lo <= view.lon + span; lo += step / 8) pts.push(lo * RAD, la * RAD);
    out.push({id: `p${la}`, name: '', rings: [Float64Array.from(pts)], lines: true, lon: view.lon * RAD, lat: la * RAD, reach: span * RAD});
  }
  return out;
}

const join = (view: View, list: Feature[]) => list.filter(view.sees).map(view.path).join('');

/** A nice length for the scale bar: 1, 2 or 5 times a power of ten, between about 150 and 380 px */
function niceKm(pxPerKm: number): number {
  const target = 240 / pxPerKm, p = Math.pow(10, Math.floor(Math.log10(target)));
  const n = target / p;
  return (n < 1.6 ? 1 : n < 3.5 ? 2 : 5) * p;
}

function ScaleBar({view, alpha}: {view: View; alpha: number}) {
  if (alpha <= 0.01) return null;
  const km = niceKm(view.pxPerKm), w = Math.round(km * view.pxPerKm);
  const label = km >= 1 ? km.toLocaleString('en-US') : String(km);
  const seg = w / 4;
  return (
    <div data-vt-instrument="scale" style={{position: 'absolute', left: 96, top: 792, opacity: alpha, fontFamily: 'var(--vt-sans)', color: 'var(--vt-text)'}}>
      <svg width={w + 2} height={14} style={{display: 'block', overflow: 'visible'}}>
        {[0, 1, 2, 3].map((i) => <rect key={i} x={1 + i * seg} y={1} width={seg} height={10} fill={i % 2 ? 'var(--vt-panel)' : 'var(--vt-text)'} />)}
        <rect x={1} y={1} width={w} height={10} fill="none" stroke="var(--vt-text)" strokeWidth={1.4} />
      </svg>
      <div style={{position: 'relative', height: 36, width: w + 140, fontSize: 26, fontWeight: 500, letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums'}}>
        <span style={{position: 'absolute', left: 0, top: 4}}>0</span>
        <span style={{position: 'absolute', left: w, top: 4, transform: 'translateX(-50%)', whiteSpace: 'nowrap'}}>{label}<span style={{marginLeft: 6, color: 'var(--vt-muted)'}}>km</span></span>
      </div>
    </div>
  );
}

export function Atlas({lon = -30, lat = 25, zoom = 0, follow, followAt = 0, followMix = 0, detail = 0, grid = 1, scale = 1, under, children}: {
  lon?: number; lat?: number; zoom?: number; follow?: LonLat[]; followAt?: number; followMix?: number; detail?: number; grid?: number; scale?: number;
  under?: React.ReactNode; children?: React.ReactNode;
}) {
  const t = useDocTime();
  // the camera is never locked off: the frame drifts a few pixels, slowly, so a held map is still alive
  const cx = W / 2 + Math.sin(t * 0.21) * 5, cy = H / 2 + Math.cos(t * 0.17) * 3;
  let clon = lon, clat = lat;
  if (follow && followMix > 0) {
    const [flon, flat] = along(follow, followAt), m = unit(followMix);
    clon = lon + (flon - lon) * m; clat = lat + (flat - lat) * m;
  }
  const view = useMemo(() => makeView(clon, clat, zoom, cx, cy), [clon, clat, zoom, cx, cy]);
  const step = gridStep(view);

  const land = join(view, WORLD.countries);
  const lakes = join(view, WORLD.lakes);
  const fine = 1 - unit(detail);
  const rivers = fine > 0.01 ? join(view, WORLD.rivers) : '';
  const borders = join(view, WORLD.borders);
  const provinces = fine > 0.01 ? join(view, WORLD.provinces) : '';
  const lines = join(view, nearGrid(view, step));

  // the globe reads as a ball only while it is small in the frame: its shading and rim go as the camera comes down to the ground
  const globe = 1 - band(zoom, 0.6, 1.8);
  const R = view.k, X = view.cx, Y = view.cy;
  const sphere = `M${X - R} ${Y}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0Z`;
  const shadow = `M${X + 10 - R} ${Y + 16}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0Z`;
  return (
    <ViewContext.Provider value={view}>
      <div data-vt-camera="" style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: 'var(--vt-bg)'}}>
        <Paint ops={[
          globe > 0.01 && {d: shadow, fill: 'var(--vt-text)', alpha: 0.07 * globe},
          {d: sphere, fill: 'var(--vt-panel2)'},
          {d: lines, stroke: 'var(--vt-op)', width: 1, alpha: 0.32 * unit(grid)},
          // water lining: the coast drawn twice in wide pale strokes under the land, as an engraved atlas rules the sea along the shore
          {d: land, stroke: 'var(--vt-op)', width: 18, alpha: 0.1},
          {d: land, stroke: 'var(--vt-op)', width: 7, alpha: 0.16},
          {d: land, fill: 'var(--vt-panel)'},
        ]} />
        {under && <div style={{position: 'absolute', inset: 0}}>{under}</div>}
        <Paint ops={[
          {d: land, stroke: 'var(--vt-op)', width: 1.1, alpha: 0.75},
          {d: lakes, fill: 'var(--vt-panel2)', stroke: 'var(--vt-op)', width: 0.9},
          rivers !== '' && {d: rivers, stroke: 'var(--vt-op)', width: 1.3, alpha: 0.7 * fine},
          provinces !== '' && {d: provinces, stroke: 'var(--vt-border)', width: 1, dash: [5, 4], alpha: 0.85 * fine},
          {d: borders, stroke: 'var(--vt-border)', width: 1.6},
          globe > 0.01 && {d: sphere, shade: [X - 0.24 * R, Y - 0.36 * R, 1.5 * R], alpha: globe},
          globe > 0.01 && {d: sphere, stroke: 'var(--vt-text)', width: 1.4, alpha: 0.55 * globe},
        ]} />
        <div style={{position: 'absolute', inset: 0}}>{children}</div>
        <ScaleBar view={view} alpha={unit(scale) * band(zoom, 1.1, 1.6)} />
        <div style={{position: 'absolute', right: 84, top: 794, padding: '4px 12px', background: 'color-mix(in srgb, var(--vt-panel) 92%, transparent)', fontFamily: 'var(--vt-sans)', fontSize: 25, letterSpacing: '0.06em', color: 'var(--vt-muted)'}}>Map data: Natural Earth</div>
      </div>
    </ViewContext.Provider>
  );
}

/** One stroke or fill of the map: an SVG path, its colour (a theme variable or any CSS colour), and how it is drawn */
export type PaintOp = {
  d: string; fill?: string; stroke?: string; width?: number; alpha?: number; dash?: number[]; shade?: [number, number, number];
  /** a radial gradient filling the path: centre, radius and its stops (offset, CSS colour) */
  radial?: {x: number; y: number; r: number; stops: Array<[number, string]>};
  /** the path moved by this many px, and softened by a blur: a lifted piece of paper and its shadow */
  dx?: number; dy?: number; blur?: number;
};

/**
 * The map's vector layers are painted on a canvas the size of the frame, so the land is the picture's backdrop (it runs under the caption,
 * as a map must) while names and figures stay in HTML above it, where qa reads them. Colours resolve once through the page's own CSS.
 */
export function Paint({ops, opacity = 1, blend}: {ops: Array<PaintOp | false>; opacity?: number; blend?: 'multiply' | 'screen'}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colours = useRef(new Map<string, string>());
  useLayoutEffect(() => {
    const canvas = ref.current, ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const css = (c: string) => {
      let v = colours.current.get(c);
      if (!v) { canvas.style.color = c; v = getComputedStyle(canvas).color; colours.current.set(c, v); }
      return v;
    };
    ctx.clearRect(0, 0, W, H);
    for (const op of ops) {
      if (!op || !op.d || (op.alpha ?? 1) <= 0.005) continue;
      const path = new Path2D(op.d);
      ctx.globalAlpha = Math.min(1, op.alpha ?? 1);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.setLineDash(op.dash ?? []);
      ctx.setTransform(1, 0, 0, 1, op.dx ?? 0, op.dy ?? 0);
      ctx.filter = op.blur ? `blur(${op.blur}px)` : 'none';
      if (op.radial) {
        const {x, y, r, stops} = op.radial, g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, r));
        for (const [o, c] of stops) g.addColorStop(o, css(c));
        ctx.fillStyle = g; ctx.fill(path);
      }
      if (op.shade) {
        const [x, y, r] = op.shade, g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(0.55, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(20,24,28,0.16)');
        ctx.fillStyle = g; ctx.fill(path);
      }
      if (op.fill) { ctx.fillStyle = css(op.fill); ctx.fill(path); }
      if (op.stroke) { ctx.strokeStyle = css(op.stroke); ctx.lineWidth = op.width ?? 1; ctx.stroke(path); }
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = 'none';
  });
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity, mixBlendMode: blend}} />;
}

/** A work's own finer geography for a close view, drawn like the map's: `kind` river, border, lake or land */
export function Layer({data, kind, opacity = 1}: {data: Feature[]; kind: 'river' | 'border' | 'province' | 'lake' | 'land'; opacity?: number}) {
  const view = React.useContext(ViewContext);
  if (opacity <= 0.01) return null;
  const d = join(view, data);
  const look: Record<string, Omit<PaintOp, 'd'>> = {
    river: {stroke: 'var(--vt-op)', width: 3.4},
    border: {stroke: 'var(--vt-border)', width: 2},
    province: {stroke: 'var(--vt-border)', width: 1.6, dash: [7, 5]},
    lake: {fill: 'var(--vt-panel2)', stroke: 'var(--vt-op)', width: 1},
    land: {fill: 'var(--vt-panel)', stroke: 'var(--vt-op)', width: 1},
  };
  return <Paint ops={[{d, ...look[kind]}]} opacity={opacity} />;
}
