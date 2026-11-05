import React from 'react';
import {useTime} from '@motionhub/runtime';
import {type MapEdge, type Placed, type RelationKind, relationPath, pointAt, drawn, nibAt, unit, slant, spaced, useMap, useMetrics, useEdgeFade, useDetail, TYPE} from './geometry.ts';

export const meta = {
  name: {en: 'Relation', 'zh-CN': '关系线'},
  purpose: 'link',
  line: 'A line run on from a term\'s rule; its stroke is the relation, its verb sits in a gap.',
  fits: 'a cause; a stage turning into the next; a part; a fix that blocks',
  params: {
    nodes: {type: 'object', doc: 'the placed terms the relation runs between (inside IdeaMap, the map\'s own)'},
    edge: {type: 'object', doc: '{id, from, to, kind: causes | contributes | leads | part | opposes | prevents, label?, flow? (marks travel along it once ruled), fromSide?, toSide?, labelAt?, draw?, state?: normal | active | dim}'},
  },
  preview: 8.0,
};

/** each kind's stroke: how a reader tells the relations apart without a colour */
export const STROKE: Record<RelationKind, {w: number; dash?: string; cap: 'butt' | 'round'}> = {
  causes: {w: 4.5, cap: 'butt'},
  contributes: {w: 3, dash: '15 11', cap: 'butt'},
  leads: {w: 3, cap: 'butt'},
  part: {w: 5, dash: '0.1 13', cap: 'round'},
  opposes: {w: 12, cap: 'butt'},
  prevents: {w: 3.5, cap: 'butt'},
};

/** the mark at a relation's head, drawn at the origin pointing along +x */
export function Head({kind, color}: {kind: RelationKind; color: string}) {
  if (kind === 'causes') return <path d="M2 0L-28 -13L-21 0L-28 13Z" fill={color} />;
  if (kind === 'contributes') return <path d="M2 0L-22 -10L-17 0L-22 10Z" fill={color} />;
  if (kind === 'leads') return <path d="M-16 -13L0 0L-16 13" fill="none" stroke={color} strokeWidth={3.5} strokeLinejoin="miter" />;
  if (kind === 'part') return <circle cx={-8} cy={0} r={8} fill="var(--color-bg)" stroke={color} strokeWidth={3.5} />;
  return <path d="M0 -18V18" stroke={color} strokeWidth={kind === 'opposes' ? 4 : 5} />;
}

export function Line({d, kind, color}: {d: string; kind: RelationKind; color: string}) {
  const s = STROKE[kind];
  if (kind === 'opposes') return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={s.w} />
      <path d={d} fill="none" stroke="var(--color-bg)" strokeWidth={s.w - 7} />
    </g>
  );
  return <path d={d} fill="none" stroke={color} strokeWidth={s.w} strokeDasharray={s.dash} strokeLinecap={s.cap} />;
}

const COLOR = {normal: 'var(--color-text)', active: 'var(--color-op)', dim: 'var(--color-border)'};
const deg = (a: number) => (a * 180) / Math.PI;

export function Relation({nodes, edge}: {nodes?: Placed[]; edge: MapEdge}) {
  const map = useMap();
  const M = useMetrics();
  const e = edge;
  const draw = unit(e.draw ?? 1);
  const path = relationPath(nodes ?? map?.nodes ?? [], e, M, map?.edges ?? []);
  const lb = path.label;
  const fade = useEdgeFade(lb ? {x0: lb.x - lb.w / 2, y0: lb.y - lb.h / 2, x1: lb.x + lb.w / 2, y1: lb.y + lb.h / 2} : {x0: 0, y0: 0, x1: 0, y1: 0});
  const detail = useDetail();
  const t = useTime();
  if (draw <= 0.001) return null;
  const color = COLOR[e.state ?? 'normal'];
  // a line drawn in reverse starts at its head and runs back to its tail, the nib travelling out to a new term
  const nib = pointAt(path, nibAt(e));
  const head = pointAt(path, 1), start = pointAt(path, 0.0005);
  const lo = e.reverse ? 1 - draw : 0, hi = e.reverse ? 1 : draw;
  const L = path.label;
  // the gap the verb sits in, in path length, so nothing is drawn there
  // the gap stays open while the verb shows at all, and closes once it has faded
  const half = L?.gap && detail > 0.05 ? (L.w / 2 + 6) / path.total : 0;
  const inGap = (t: number) => !!L?.gap && Math.abs(t - L.at) < half;
  // leads to: open chevrons along the line, so the direction of a cycle reads anywhere on it
  const chevrons: {x: number; y: number; a: number}[] = [];
  if (e.kind === 'leads') {
    for (let s = 70; s < path.total - 70; s += 78) {
      if (s < path.total * lo + 60 || s > path.total * hi - 60) continue;
      if (inGap(s / path.total) || Math.abs(s / path.total - (L?.at ?? -1)) < half + 30 / path.total) continue;
      const q = pointAt(path, s / path.total);
      chevrons.push({x: q.x, y: q.y, a: deg(q.angle)});
    }
  }
  // flow: short marks travelling the ruled line at a steady pace, clear of its verb and its two ends
  const marks: {x: number; y: number; a: number}[] = [];
  if (e.flow && draw > 0.999) {
    const gapLen = 110, off = (t * 95) % gapLen;
    for (let s = 40 + off; s < path.total - 50; s += gapLen) {
      if (inGap(s / path.total) || Math.abs(s / path.total - (L?.at ?? -1)) < half + 20 / path.total) continue;
      const q = pointAt(path, s / path.total);
      marks.push({x: q.x, y: q.y, a: deg(q.angle)});
    }
  }
  const labelIn = L ? unit((e.reverse ? draw - (1 - L.at) : draw - L.at) / 0.12) : 0;
  const mask = `vt-gap-${e.id}`;
  return (
    <>
      <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
        {L?.gap && detail > 0.05 && (
          <mask id={mask} maskUnits="userSpaceOnUse" x={-20000} y={-20000} width={40000} height={40000}>
            <rect x={-20000} y={-20000} width={40000} height={40000} fill="#fff" />
            <rect x={L.x - (L.w + 12) / 2} y={L.y - L.h / 2} width={L.w + 12} height={L.h} fill="#000" />
          </mask>
        )}
        <g mask={L?.gap && detail > 0.05 ? `url(#${mask})` : undefined}>
          <Line d={drawn(path, e)} kind={e.kind} color={color} />
        </g>
        {marks.map((m, i) => (
          <rect key={`f${i}`} x={-9} y={-4.5} width={18} height={9} fill="var(--color-op)" transform={`translate(${m.x.toFixed(1)} ${m.y.toFixed(1)}) rotate(${m.a.toFixed(1)})`} />
        ))}
        {chevrons.map((c, i) => (
          <path key={i} d="M-8 -9L4 0L-8 9" transform={`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) rotate(${c.a.toFixed(1)})`} fill="none" stroke={color} strokeWidth={3} />
        ))}
        {e.kind === 'opposes' && (!e.reverse || draw > 0.999) && <g transform={`translate(${start.x.toFixed(1)} ${start.y.toFixed(1)}) rotate(${deg(start.angle + Math.PI).toFixed(1)})`}><Head kind="opposes" color={color} /></g>}
        {draw < 0.999 && !inGap(nibAt(e)) && (
          // the nib of a relation being drawn
          <g transform={`translate(${nib.x.toFixed(1)} ${nib.y.toFixed(1)})`}>
            <circle r={19} fill="var(--color-op)" fillOpacity={0.14} />
            <circle r={8} fill="var(--color-op)" />
          </g>
        )}
        {(draw > 0.999 || e.reverse) && <g transform={`translate(${head.x.toFixed(1)} ${head.y.toFixed(1)}) rotate(${deg(head.angle).toFixed(1)})`}><Head kind={e.kind} color={color} /></g>}
      </svg>
      {L && labelIn > 0.01 && (
        <div style={{position: 'absolute', left: Math.round(L.x - L.w / 2), top: Math.round(L.y - L.h / 2), width: L.w, height: L.h, textAlign: 'center', whiteSpace: 'nowrap', opacity: labelIn * fade * (detail > 0.05 ? detail : 0),
          fontFamily: 'var(--font-display)', fontStyle: slant(e.label!), fontSize: TYPE.label, lineHeight: `${L.h - 4}px`,
          color: e.state === 'active' ? 'var(--color-op)' : e.state === 'dim' ? 'var(--color-border)' : 'var(--color-text)'}}>
          {spaced(e.label!)}
        </div>
      )}
    </>
  );
}
