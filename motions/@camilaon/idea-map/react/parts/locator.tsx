import React from 'react';
import {type Layout, type View, type MapEdge, type MapNode, useLaidOut, cameraFor, grown, relationPath, drawn, FRAME_X, FRAME_Y} from './geometry.ts';

export const meta = {
  name: {en: 'Locator', 'zh-CN': '全图定位'},
  purpose: 'transition',
  line: 'The whole map in miniature, the frame a red box moving over it.',
  fits: 'a ride along a line; a close look at a large map',
  params: {
    nodes: {type: 'object', doc: 'the map\'s terms, as given to IdeaMap'},
    edges: {type: 'object', doc: 'the map\'s relations'},
    layout: {type: 'text', default: 'flow', doc: 'the map\'s layout'},
    grow: {type: 'number', doc: 'as given to IdeaMap'},
    views: {type: 'object', doc: 'the map\'s views, so the box follows the same camera'},
    view: {type: 'number', default: 0, doc: 'the map\'s view'},
    camX: {type: 'px', doc: 'a camera set by hand, as given to IdeaMap (without views), across'},
    camY: {type: 'px', doc: 'as given to IdeaMap, down'},
    zoom: {type: 'number', doc: 'as given to IdeaMap'},
    ride: {type: 'text', doc: 'the relation the camera rides'},
    rideMix: {type: 'progress', default: 0, doc: 'as given to IdeaMap'},
    rideZoom: {type: 'number', default: 1.3, doc: 'as given to IdeaMap'},
    lead: {type: 'px', default: 0, doc: 'as given to IdeaMap'},
    corner: {type: 'text', default: 'top', doc: 'top (in the band above the map, in place of the key) or bottom, on the right'},
    show: {type: 'progress', default: 1, doc: '0 to 1: fades in'},
  },
  preview: 32.0,
};

// small enough to sit in the band above the map, where the key is when there is no locator
const W = 270, H = 152, PAD = 16;

export function Locator({nodes: nodes0, edges: edges0, layout = 'flow', grow, views, view = 0, camX, camY, zoom, ride, rideMix = 0, rideZoom, lead = 0, corner = 'top', show = 1}: {
  nodes: MapNode[]; edges: MapEdge[]; layout?: Layout; grow?: number; views?: View[]; view?: number; camX?: number; camY?: number; zoom?: number; ride?: string; rideMix?: number; rideZoom?: number; lead?: number; corner?: 'top' | 'bottom'; show?: number;
}) {
  const {nodes, edges} = grow === undefined ? {nodes: nodes0, edges: edges0} : grown(nodes0, edges0, grow);
  const map = useLaidOut(nodes, edges, layout);
  if (show <= 0.001) return null;
  const cam = cameraFor(map, {views, view, camX, camY, zoom, ride, rideMix, rideZoom, lead});
  // what the frame shows, in map pixels
  const fw = 1920 / cam.zoom, fh = 900 / cam.zoom;
  const fx = cam.camX - FRAME_X / cam.zoom, fy = cam.camY - FRAME_Y / cam.zoom;
  // the bounds: the whole map, grown or not, so the miniature holds still
  const xs = [...map.nodes.flatMap((n) => [n.x - 40, n.x + n.box.w + 40]), fx, fx + fw];
  const ys = [...map.nodes.flatMap((n) => [n.y - n.box.above, n.y + n.box.depth]), fy, fy + fh];
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const k = Math.min((W - 2 * PAD) / (x1 - x0), (H - 2 * PAD) / (y1 - y0));
  const ox = (W - (x1 - x0) * k) / 2 - x0 * k, oy = (H - (y1 - y0) * k) / 2 - y0 * k;
  return (
    <div style={{position: 'absolute', right: 96, top: corner === 'top' ? 52 : 846 - H, width: W, height: H, boxSizing: 'border-box', border: '2px solid var(--color-text)', background: 'var(--color-panel)', opacity: show, overflow: 'hidden'}}>
      <svg width={W - 4} height={H - 4} style={{position: 'absolute', left: 0, top: 0}}>
        <g transform={`translate(${ox.toFixed(1)} ${oy.toFixed(1)}) scale(${k.toFixed(4)})`}>
          {map.edges.filter((e) => (e.draw ?? 1) > 0.001).map((e) => (
            <path key={e.id} d={drawn(relationPath(map.nodes, e, map.M, map.edges), e)} fill="none" stroke={e.state === 'active' ? 'var(--color-op)' : 'var(--color-muted)'} strokeWidth={2.2 / k} />
          ))}
          {map.nodes.filter((n) => (n.show ?? 1) > 0.001).map((n) => (
            <rect key={n.id} x={n.x} y={n.y - 3 / k} width={n.box.w * Math.min(1, (n.show ?? 1) / 0.45)} height={6 / k} fill={n.state === 'active' || n.state === 'root' ? 'var(--color-op)' : 'var(--color-text)'} />
          ))}
          <rect x={fx} y={fy} width={fw} height={fh} fill="var(--color-op)" fillOpacity={0.08} stroke="var(--color-op)" strokeWidth={3 / k} />
        </g>
      </svg>
    </div>
  );
}
