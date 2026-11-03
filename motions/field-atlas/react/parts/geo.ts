// Field Atlas's geography: the vendored map (assets/world.json, Natural Earth, public domain) decoded once, and the one camera every
// component draws through. The camera is an orthographic globe: at zoom 0 the whole Earth fills the frame's height, each step of zoom
// doubles the scale, so tweening `zoom` linearly is a zoom in log space (continent to city at an even pace), and the same projection holds
// from the globe to a street with no change of map. A point behind the globe is folded onto its rim for areas and dropped for lines.
import {createContext, useContext} from 'react';
import world from '../assets/world.json';

export type LonLat = [number, number];
export type Ring = Float64Array;                       // lon, lat pairs in radians
export type Feature = {id: string; name: string; country?: string; rings: Ring[]; lines: boolean; lon: number; lat: number; reach: number};

export const RAD = Math.PI / 180;
export const EARTH_KM = 6371;
export const W = 1920, H = 1080;
/** The globe's radius on screen at zoom 0 */
export const R0 = 0.44 * H;

type Topo = {transform: {scale: [number, number]; translate: [number, number]}; arcs: number[][][]; objects: Record<string, {geometries: Array<{type: string; arcs: unknown; properties: Record<string, string>}>}>};

/** TopoJSON arcs, delta-decoded into lon/lat degrees */
function decodeArcs(t: Topo): number[][][] {
  const [sx, sy] = t.transform.scale, [tx, ty] = t.transform.translate;
  return t.arcs.map((arc) => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
  });
}

/** A ring or a line from its arc indices (a negative index is the arc reversed, `~i`) */
function stitch(arcs: number[][][], ids: number[]): Ring {
  const pts: number[] = [];
  ids.forEach((i, n) => {
    const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
    a.forEach((p, j) => { if (n > 0 && j === 0) return; pts.push(p[0] * RAD, p[1] * RAD); });
  });
  return Float64Array.from(pts);
}

/** Where a feature is, and how far it reaches from there (radians), so the camera skips what it cannot see */
function extent(rings: Ring[]): {lon: number; lat: number; reach: number} {
  let x = 0, y = 0, z = 0, n = 0;
  for (const r of rings) for (let i = 0; i < r.length; i += 2) { const c = Math.cos(r[i + 1]); x += c * Math.cos(r[i]); y += c * Math.sin(r[i]); z += Math.sin(r[i + 1]); n++; }
  const lon = Math.atan2(y, x), lat = Math.atan2(z, Math.hypot(x, y));
  let reach = 0;
  for (const r of rings) for (let i = 0; i < r.length; i += 2) reach = Math.max(reach, arc(lon, lat, r[i], r[i + 1]));
  return {lon, lat, reach};
}

/** The angle between two points on the sphere, in radians */
export function arc(l1: number, p1: number, l2: number, p2: number): number {
  return Math.acos(Math.max(-1, Math.min(1, Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos(l2 - l1))));
}

function layer(t: Topo, arcs: number[][][], name: string): Feature[] {
  return (t.objects[name]?.geometries ?? []).map((g) => {
    const lines = g.type === 'LineString' || g.type === 'MultiLineString';
    const parts: number[][] = g.type === 'Polygon' ? (g.arcs as number[][]) : g.type === 'MultiPolygon' ? (g.arcs as number[][][]).flat() : g.type === 'LineString' ? [g.arcs as number[]] : (g.arcs as number[][]);
    const rings = parts.map((ids) => stitch(arcs, ids));
    return {id: g.properties.id ?? g.properties.name ?? '', name: g.properties.name ?? '', country: g.properties.country, rings, lines, ...extent(rings)};
  });
}

/** The borders between two areas of one layer: the arcs two of its features share, drawn once */
function shared(t: Topo, arcs: number[][][], name: string): Feature[] {
  const uses = new Map<number, number>();
  for (const g of t.objects[name]?.geometries ?? []) {
    const ids = (g.type === 'Polygon' ? (g.arcs as number[][]).flat() : (g.arcs as number[][][]).flat(2)) as number[];
    for (const i of new Set(ids.map((i) => (i < 0 ? ~i : i)))) uses.set(i, (uses.get(i) ?? 0) + 1);
  }
  const rings = [...uses].filter(([, n]) => n > 1).map(([i]) => stitch(arcs, [i]));
  return rings.map((r, i) => ({id: `${name}-${i}`, name: '', rings: [r], lines: true, ...extent([r])}));
}

const TOPO = world as unknown as Topo;
const ARCS = decodeArcs(TOPO);

/** The map every Field Atlas film is drawn from */
export const WORLD = {
  countries: layer(TOPO, ARCS, 'countries'),
  regions: layer(TOPO, ARCS, 'regions'),
  lakes: layer(TOPO, ARCS, 'lakes'),
  rivers: layer(TOPO, ARCS, 'rivers'),
  borders: shared(TOPO, ARCS, 'countries'),
  provinces: shared(TOPO, ARCS, 'regions'),
};

/** Features of a work's own, from GeoJSON-like coordinates in degrees: [[lon, lat], …] per ring or line */
export function features(items: Array<{id: string; name?: string; coords: LonLat[][]; lines?: boolean}>): Feature[] {
  return items.map((f) => {
    const rings = f.coords.map((c) => Float64Array.from(c.flatMap(([lo, la]) => [lo * RAD, la * RAD])));
    return {id: f.id, name: f.name ?? '', rings, lines: !!f.lines, ...extent(rings)};
  });
}

/** Look a feature up by its id (ISO 3166 code: `USA`, `US-IL`) or its name */
export function find(id: string): Feature | undefined {
  return WORLD.regions.find((f) => f.id === id || f.name === id) ?? WORLD.countries.find((f) => f.id === id || f.name === id);
}

export type View = {
  lon: number; lat: number; zoom: number;
  /** px per radian of the globe: R0 at zoom 0 */
  k: number;
  cx: number; cy: number;
  /** px per km at the centre of the frame */
  pxPerKm: number;
  /** screen x, y of a point in degrees, and whether it faces the camera */
  at: (lon: number, lat: number) => [number, number, boolean];
  /** the point in degrees under a screen position, or null off the globe */
  under: (x: number, y: number) => LonLat | null;
  /** whether a feature can be on screen */
  sees: (f: Feature) => boolean;
  /** an SVG path for a feature (areas folded onto the rim, lines broken behind it) */
  path: (f: Feature) => string;
};

export function makeView(lon: number, lat: number, zoom: number, cx = W / 2, cy = H / 2): View {
  const k = R0 * Math.pow(2, zoom);
  const l0 = lon * RAD, p0 = lat * RAD, s0 = Math.sin(p0), c0 = Math.cos(p0);
  // the angle from the centre to the frame's farthest corner: anything farther than that plus its own reach is off screen
  const corner = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
  const view = corner >= k ? Math.PI / 2 : Math.asin(corner / k);
  const r = (v: number) => Math.round(v * 10) / 10;

  const raw = (l: number, p: number): [number, number, number] => {
    const cp = Math.cos(p), dl = l - l0;
    return [k * cp * Math.sin(dl), -k * (c0 * Math.sin(p) - s0 * cp * Math.cos(dl)), s0 * Math.sin(p) + c0 * cp * Math.cos(dl)];
  };
  const at = (lo: number, la: number): [number, number, boolean] => {
    const [x, y, c] = raw(lo * RAD, la * RAD);
    return [cx + x, cy + y, c >= 0];
  };
  const under = (x: number, y: number): LonLat | null => {
    const px = (x - cx) / k, py = -(y - cy) / k, rho = Math.hypot(px, py);
    if (rho > 1) return null;
    const c = Math.asin(rho), sc = Math.sin(c), cc = Math.cos(c);
    const p = rho === 0 ? p0 : Math.asin(cc * s0 + (py * sc * c0) / rho);
    const l = l0 + Math.atan2(px * sc, rho * c0 * cc - py * s0 * sc);
    return [((l / RAD + 540) % 360) - 180, p / RAD];
  };
  const sees = (f: Feature) => arc(l0, p0, f.lon, f.lat) - f.reach < Math.min(Math.PI / 2, view) + 0.02;
  const path = (f: Feature) => {
    let d = '';
    for (const ring of f.rings) {
      let pen = false;
      for (let i = 0; i < ring.length; i += 2) {
        let [x, y, c] = raw(ring[i], ring[i + 1]);
        if (c < 0) {
          if (f.lines) { pen = false; continue; }
          const n = Math.hypot(x, y) || 1;                     // fold onto the rim
          x = (x / n) * k; y = (y / n) * k;
        }
        d += `${pen ? 'L' : 'M'}${r(cx + x)} ${r(cy + y)}`;
        pen = true;
      }
      if (!f.lines && pen) d += 'Z';
    }
    return d;
  };
  return {lon, lat, zoom, k, cx, cy, pxPerKm: k / EARTH_KM, at, under, sees, path};
}

export const ViewContext = createContext<View>(makeView(0, 20, 0));
/** The camera the nearest Atlas draws through */
export const useView = () => useContext(ViewContext);

export const unit = (v: number) => Math.max(0, Math.min(1, v));
/** 0 below `a`, 1 above `b`, smooth between: for what fades in or out with the zoom */
export const band = (v: number, a: number, b: number) => { const t = unit((v - a) / (b - a)); return t * t * (3 - 2 * t); };

/** The point a fraction `t` of the way along a line of points in degrees, by distance on the sphere */
export function along(path: LonLat[], t: number): LonLat {
  if (path.length < 2) return path[0] ?? [0, 0];
  const legs = path.slice(1).map((b, i) => arc(path[i][0] * RAD, path[i][1] * RAD, b[0] * RAD, b[1] * RAD));
  let left = unit(t) * legs.reduce((s, l) => s + l, 0);
  for (let i = 0; i < legs.length; i++) {
    if (left <= legs[i] || i === legs.length - 1) {
      const f = legs[i] ? Math.min(1, left / legs[i]) : 0;
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f];
    }
    left -= legs[i];
  }
  return path[path.length - 1];
}

/** The first fraction `t` of a line of points, ending exactly at the point `along` gives */
export function lead(path: LonLat[], t: number): LonLat[] {
  if (t >= 1) return path;
  if (t <= 0 || path.length < 2) return [];
  const legs = path.slice(1).map((b, i) => arc(path[i][0] * RAD, path[i][1] * RAD, b[0] * RAD, b[1] * RAD));
  let left = t * legs.reduce((s, l) => s + l, 0);
  const out: LonLat[] = [path[0]];
  for (let i = 0; i < legs.length; i++) {
    if (left <= legs[i]) { const f = legs[i] ? left / legs[i] : 0; out.push([path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f]); break; }
    out.push(path[i + 1]);
    left -= legs[i];
  }
  return out;
}
