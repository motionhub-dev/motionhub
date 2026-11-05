import React from 'react';
import {Sheet} from './sheet.tsx';
import {Term} from './term.tsx';
import {Relation} from './relation.tsx';
import {type Layout, type View, type MapEdge, type MapNode, MapContext, useLaidOut, cameraFor, grown} from './geometry.ts';

export const meta = {
  name: {en: 'Idea map', 'zh-CN': '概念图'},
  purpose: 'steps',
  line: 'A map laid out from its terms and relations (flow, down, cycle), grown line before term, under a camera.',
  fits: 'a cycle; a chain of causes; a hierarchy; a root-cause review; a process',
  params: {
    nodes: {type: 'object', doc: 'the terms (see Term), in reading order; x, y, rank or order on one override the layout'},
    edges: {type: 'object', doc: 'the relations (see Relation)'},
    layout: {type: 'text', default: 'flow', doc: 'flow: columns by rank, left to right (a chain, a fan-in, a tree); down: rows by rank, top to bottom (a hierarchy, a cascade, a timeline read downwards); cycle: the terms in order clockwise round two rows; none: each node gives x and y'},
    grow: {type: 'number', doc: 'how far the map has grown, in steps, in the terms\' order: each step rules the line that reaches the next term, then stands it (a new cause is reached by a line run back out of the map), or rules a line between standing terms. Tween it a step on each word that names a term; leave it out to drive show and draw yourself'},
    views: {type: 'object', doc: 'the shots: each a list of term ids to frame, \'all\', or {ids, grow: [left, top, right, bottom]} to take in a figure or a bracket beside them; the camera fits them with the type kept readable'},
    view: {type: 'number', default: 0, doc: 'which view, tweened: 1.5 is halfway from the second to the third'},
    camX: {type: 'px', default: 960, doc: 'without views: where the camera looks, across'},
    camY: {type: 'px', default: 480, doc: 'without views: where the camera looks, down'},
    zoom: {type: 'number', default: 1, doc: 'without views: the camera\'s zoom'},
    ride: {type: 'text', doc: 'the id of a relation the camera rides, its head kept in frame as it is drawn'},
    rideMix: {type: 'progress', default: 0, doc: '0 to 1: how far the camera has handed over to the relation\'s head (tween up as the line starts, down after it arrives)'},
    rideZoom: {type: 'number', default: 1.3, doc: 'the zoom while riding'},
    lead: {type: 'px', default: 0, doc: 'how far ahead of the head the camera looks, so the next term comes into view first'},
    speed: {type: 'px', default: 0, doc: 'how far the sheet\'s crosses streak while riding (0 at rest, 60 to 100 at full speed)'},
  },
  preview: 39.2,
};

type Props = {
  nodes: MapNode[]; edges: MapEdge[]; layout?: Layout; grow?: number; views?: View[]; view?: number;
  camX?: number; camY?: number; zoom?: number; ride?: string; rideMix?: number; rideZoom?: number; lead?: number; speed?: number;
  children?: React.ReactNode;
};

/** The map on the sheet. Anything given as children is drawn in map pixels under the same camera and can find the terms with useMap(). */
export function IdeaMap({nodes: nodes0, edges: edges0, layout = 'flow', grow, views, view = 0, camX, camY, zoom, ride, rideMix = 0, rideZoom, lead = 0, speed = 0, children}: Props) {
  const {nodes, edges} = grow === undefined ? {nodes: nodes0, edges: edges0} : grown(nodes0, edges0, grow);
  const map = useLaidOut(nodes, edges, layout);
  const cam = cameraFor(map, {views, view, camX, camY, zoom, ride, rideMix, rideZoom, lead});
  const m = ride ? Math.min(1, rideMix * 2) : 0;
  const smear: [number, number] = [Math.cos(cam.angle) * speed * m, Math.sin(cam.angle) * speed * m];
  return (
    <MapContext.Provider value={map}>
      <Sheet camX={cam.camX} camY={cam.camY} zoom={cam.zoom} smear={smear}>
        {map.edges.map((x) => <Relation key={x.id} edge={x} />)}
        {map.nodes.map((n) => <Term key={n.id} node={n} />)}
        {children}
      </Sheet>
    </MapContext.Provider>
  );
}
