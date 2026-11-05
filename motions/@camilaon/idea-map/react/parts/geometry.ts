// The map's geometry, shared by every component: text measured in the motion's own faces, how much room a term takes,
// where the map's terms go (a layout from the nodes and edges alone), the path a relation takes and where its verb sits,
// and where the camera looks. A relation leaves and arrives along a rule or square to it, so the line reads as the underline running on.
import React from 'react';
import {useTokens} from '@motionhub/runtime';

export type Side = 'l' | 'r' | 't' | 'b';
export type NodeKind = 'concept' | 'event' | 'action' | 'figure' | 'quote' | 'picture';
export type NodeState = 'normal' | 'active' | 'dim' | 'root' | 'struck';
export type RelationKind = 'causes' | 'contributes' | 'leads' | 'part' | 'opposes' | 'prevents';
export type Layout = 'flow' | 'down' | 'cycle' | 'none';

export type MapNode = {
  id: string;
  term: string;
  gloss?: string;
  index?: string;
  figure?: string;
  size?: number;
  kind?: NodeKind;
  state?: NodeState;
  tag?: string; // a label set in a tab above the term (the root's)
  show?: number; // 0 to 1: the rule draws, then the term stands up on it
  x?: number; // where the rule starts, in map pixels: set by the layout unless given
  y?: number; // the rule's height: the term stands on it
  rank?: number; // flow: the column, counted from the left (by default, one past the furthest term that points to it)
  order?: number; // flow: the place in its column, from the top
  beside?: {of: string; side: Side}; // left out of the layout and set beside another term, clear of it: a cause above a stage of a cycle, a part below its whole
  glyph?: string; // a line pictogram drawn stroke by stroke on the rule before the term (see GLYPHS in glyphs.ts)
  image?: string; // a picture standing on the rule before the term, framed in a hairline (an asset the document resolves)
  items?: string[]; // two to four short points ruled under the gloss, each drawn in turn
  strike?: number; // 0 to 1: how far a struck term's line has run across it (by default it runs as the term arrives)
  act?: 'multiply' | 'burst' | 'spin' | 'pulse' | 'fill'; // what the term's pictogram does once drawn (see Pictogram)
  actAt?: number; // 0 to 1: how far the act has gone
};

export type MapEdge = {
  id: string;
  from: string;
  to: string;
  kind: RelationKind;
  label?: string;
  fromSide?: Side;
  toSide?: Side;
  labelAt?: number; // 0 to 1 along the path; by default the verb sits on the straight run out of the first term
  draw?: number; // 0 to 1
  reverse?: boolean; // drawn from its head back to its tail: a line run out from the map to a new term that points into it
  flow?: boolean; // once ruled, marks travel along it in its direction: something passing, spreading, being made
  state?: 'normal' | 'active' | 'dim';
};

type V = [number, number];

// ------------------------------------------------------------------ measuring

export type Face = 'sans' | 'display' | 'mono';
export type Metrics = {width: (s: string, face: Face, size: number, weight?: number, italic?: boolean, spacing?: number) => number};
const STACKS: Record<Face, string> = {sans: '"Hanken Grotesk", "Noto Sans SC", sans-serif', display: '"Newsreader", "Noto Serif SC", serif', mono: '"JetBrains Mono", "Noto Sans SC", monospace'};
const HAN = /[\u3400-\u9fff\uf900-\ufaff]/;
const WIDE = /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef\u3000-\u303f]/;
/** Chinese has no italic: a slanted Han face is a synthetic oblique, so words in it stand upright */
export const slant = (s: string) => (HAN.test(s) ? 'normal' : 'italic');
export const isHan = (s: string) => HAN.test(s);
/** a thin space between Chinese and Latin letters or digits, as Chinese is set, unless one is there already */
export const spaced = (s: string) => s
  .replace(/([\u3400-\u9fff\uf900-\ufaff])([A-Za-z0-9])/g, '$1\u2009$2')
  .replace(/([A-Za-z0-9%])([\u3400-\u9fff\uf900-\ufaff])/g, '$1\u2009$2');
/** letter spacing of a term: Latin is set a little tight at display size, Chinese a little open */
export const termSpacing = (s: string, size: number) => (HAN.test(s) ? size * 0.02 : size * (size > 60 ? -0.02 : -0.01));

let ctx: CanvasRenderingContext2D | null | undefined;
const cache = new Map<string, number>();
const listeners = new Set<() => void>();
let version = 0;
const bump = () => { version++; cache.clear(); listeners.forEach((f) => f()); };
function subscribe(f: () => void) {
  listeners.add(f);
  if (typeof document !== 'undefined' && document.fonts && listeners.size === 1) document.fonts.addEventListener('loadingdone', bump);
  return () => { listeners.delete(f); };
}

/** a generous guess, used only before a face has loaded */
function estimate(s: string, size: number) {
  let em = 0;
  for (const ch of s) em += WIDE.test(ch) ? 1 : ch === ' ' ? 0.28 : /[A-Z0-9mwMW]/.test(ch) ? 0.68 : 0.56;
  return em * size;
}

function measure(s: string, font: string, spacing: number, size: number) {
  const key = `${font}|${spacing}|${s}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (typeof document === 'undefined') return estimate(s, size);
  ctx ??= document.createElement('canvas').getContext('2d');
  if (!ctx) return estimate(s, size);
  ctx.font = font;
  (ctx as unknown as {letterSpacing: string}).letterSpacing = `${spacing}px`;
  if (document.fonts && !document.fonts.check(font, s)) {
    document.fonts.load(font, s).then(bump, () => {});
    return estimate(s, size);
  }
  const w = ctx.measureText(s).width;
  cache.set(key, w);
  return w;
}

/** text measured in the motion's faces; a component re-renders when a face finishes loading */
export function useMetrics(): Metrics {
  const font = (useTokens()?.font ?? {}) as Record<string, string>;
  const v = React.useSyncExternalStore(subscribe, () => version, () => 0);
  return React.useMemo(() => ({
    width: (s: string, face: Face, size: number, weight = 400, italic = false, spacing = 0) =>
      measure(s, `${italic ? 'italic ' : ''}${weight} ${size}px ${font[face] ?? STACKS[face]}`, spacing, size),
  }), [font.sans, font.display, font.mono, v]);
}

// closing punctuation never starts a line, opening punctuation never ends one
const NO_START = /^[\uff0c\u3002\u3001\uff1b\uff1a\uff01\uff1f\uff09\u300d\u300f\u201d\u2019\u3009\u300b\u3011.,;:!?)%]/;
let seg: {segment: (s: string) => Iterable<{segment: string}>} | null | undefined;
/** Chinese split into words (Intl.Segmenter), so a line breaks between words, never inside one */
function hanWords(s: string): string[] {
  if (seg === undefined) {
    const I = (globalThis as unknown as {Intl: {Segmenter?: new (l: string, o: {granularity: string}) => {segment: (s: string) => Iterable<{segment: string}>}}}).Intl;
    seg = I.Segmenter ? new I.Segmenter('zh', {granularity: 'word'}) : null;
  }
  if (!seg) return s.match(/[\s\S]/gu) ?? [s];
  const out: string[] = [];
  for (const {segment} of seg.segment(s)) {
    if (out.length && NO_START.test(segment)) out[out.length - 1] += segment; else out.push(segment);
  }
  return out;
}

/** a line of text broken to fit `max` px: at spaces, and between Chinese words */
export function wrap(s: string, max: number, w: (t: string) => number): string[] {
  if (HAN.test(s)) {
    const lines: string[] = [];
    let line = '';
    for (const p of hanWords(s)) {
      if (line.trim() && w((line + p).trimEnd()) > max) { lines.push(line.trimEnd()); line = p.trimStart(); } else line += p;
    }
    if (line.trim()) lines.push(line.trimEnd());
    return lines;
  }
  const parts = s.match(/[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef\u3000-\u303f][\uff0c\u3002\u3001\uff1b\uff1a\uff01\uff1f\uff09\u300d\u300f\u201d]?|[^\s\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef\u3000-\u303f]+\s*|\s+/g) ?? [s];
  const lines: string[] = [];
  let line = '';
  for (const p of parts) {
    if (line && w((line + p).trimEnd()) > max) {
      lines.push(line.trimEnd()); line = p.trimStart();
    } else line += p;
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

/** wrapped, then narrowed as long as it keeps the same number of lines, so no line is left with one word */
export function balanced(s: string, max: number, w: (t: string) => number): string[] {
  let lines = wrap(s, max, w);
  if (lines.length < 2) return lines;
  let lo = max * 0.5, hi = max;
  for (let i = 0; i < 8; i++) {
    const mid = (lo + hi) / 2;
    if (wrap(s, mid, w).length === lines.length) hi = mid; else lo = mid;
  }
  lines = wrap(s, hi, w);
  return lines;
}

// ------------------------------------------------------------------ a term's room

export const TYPE = {
  term: 60, event: 80,
  gloss: 40, glossLine: 50, glossMax: 480,
  index: 30, figure: 34,
  label: 42, labelLine: 52,
};
export const GAP = 18; // between a rule's end and the line that runs on from it

export type Box = {s: number; termW: number; indent: number; w: number; above: number; depth: number; gloss: string[]; weight: number; face: Face; italic: boolean; lead: number};
/** the room a node's picture takes before its words: a glyph, or a framed image */
export const GLYPH = 64, PICTURE = 120, IMAGE = {w: 240, h: 160};
export const ITEM = {size: 36, line: 50};

export function nodeBox(n: MapNode, M: Metrics, glossMax: number = TYPE.glossMax): Box {
  const kind = n.kind ?? 'concept';
  const s = n.size ?? (kind === 'event' ? TYPE.event : kind === 'figure' ? 104 : kind === 'quote' ? 54 : kind === 'picture' ? 46 : TYPE.term);
  const face: Face = kind === 'quote' ? 'display' : 'sans';
  const italic = kind === 'quote' && !HAN.test(n.term);
  const weight = kind === 'event' ? 700 : kind === 'quote' ? 400 : 600;
  // the picture before the words, then the open box of an action
  // a picture term carries its pictogram above its word, not before it
  const lead = n.image ? IMAGE.w + 22 : n.glyph && kind !== 'picture' ? GLYPH + 12 : 0;
  const indent = lead + (kind === 'action' ? 28 : 0);
  const term = spaced(n.term);
  const termW = M.width(term, face, s, weight, italic, face === 'sans' ? termSpacing(term, s) : 0);
  const gw = (t: string) => M.width(t, 'display', TYPE.gloss, HAN.test(t) ? 500 : 400, slant(t) === 'italic');
  const gloss = n.gloss ? balanced(spaced(n.gloss), Math.max(termW, glossMax), gw) : [];
  const figW = n.figure ? M.width(spaced(n.figure), 'mono', TYPE.figure, 700) : 0;
  const itemsW = (n.items ?? []).map((t) => M.width(spaced(t), 'sans', ITEM.size, 400) + 44);
  const indexW = n.index || n.tag ? M.width(spaced((n.tag ?? n.index)!), 'mono', TYPE.index, 700, false, TYPE.index * 0.08) + (n.tag ? 24 : 0) : 0;
  const picW = kind === 'picture' ? PICTURE * (n.act === 'multiply' ? 2 : 1) : 0;
  const w = Math.ceil(indent + Math.max(termW, figW, indexW, picW, ...gloss.map(gw), ...itemsW) + 24);
  const words = Math.round(s * 1.15 + 12 + (n.index || n.tag ? TYPE.index + 18 : 0));
  const above = kind === 'picture' ? words + PICTURE + 14 : Math.max(words, n.image ? IMAGE.h + 6 : 0);
  const depth = Math.round(16 + gloss.length * TYPE.glossLine + (n.figure ? TYPE.figure + 18 : 0) + (n.items?.length ? n.items.length * ITEM.line + 10 : 0));
  return {s, termW, indent, w, above, depth, gloss, weight, face, italic, lead};
}

export type Placed = MapNode & {x: number; y: number; box: Box};

// ------------------------------------------------------------------ layout

const GAPX = 110, GAPY = 70;
const labelWidth = (e: MapEdge, M: Metrics) => (e.label ? M.width(e.label, 'display', TYPE.label, 400, slant(e.label) === 'italic') + 28 : 0);
// the straight run out of a term that holds a verb: the verb and some line on each side of it
const LEG_PAD = 30;
const legFor = (lw: number) => lw + 2 * LEG_PAD;

/** sides a relation leaves and enters by, from where its two terms are */
function sidesFor(a: Placed, b: Placed): [Side, Side] {
  if (a.x + a.box.w < b.x) return ['r', 'l'];
  if (b.x + b.box.w < a.x) return ['l', 'r'];
  return b.y > a.y ? ['b', 't'] : ['t', 'b'];
}

/**
 * Where every term goes, from the nodes and edges alone.
 * `flow`: columns by rank (a term sits one column past the furthest term that points to it), ordered to keep lines short and level:
 * a chain, a fan-in, a tree, a root-cause review. `cycle`: the terms in order clockwise round two rows, top left to right and back
 * along the bottom. `none`: every node gives its own x and y. A node's own x, y, rank or order overrides the layout.
 * The result is centred on (960, 470) of the map.
 */
export function layoutMap(nodes: MapNode[], edges: MapEdge[], M: Metrics, layout: Layout = 'flow'): {nodes: Placed[]; edges: MapEdge[]} {
  // glosses are wrapped narrower, in more lines, before a map is let run wider than the frame holds at a readable zoom
  let out = layoutWith(nodes, edges, M, layout, TYPE.glossMax);
  const fits = (m: typeof out) => layout === 'none' || (viewWidth(m) <= 1680 / 0.88 && viewHeight(m) <= 645 / 0.88);
  // aim for a map that fits the frame at full size: glosses wrap narrower before the camera has to pull back
  const wide = (m: typeof out) => viewWidth(m) <= 1500;
  for (const g of [380, 300]) {
    if (wide(out)) break;
    out = layoutWith(nodes, edges, M, layout, g);
  }
  // and a flow still too wide wraps into rows, like lines of text: the line runs down from the end of a row to the start of the next
  // only into rows that fit the frame's height too; when none do, the map stays one row wide and the camera shows it in views
  if (layout === 'flow' && !wide(out)) {
    const ranks = new Set(out.nodes.filter((n) => !n.beside).map((n) => n.x)).size;
    for (let cols = ranks - 1; cols >= 2; cols--) {
      for (const g of [380, 300]) {
        const w = layoutWith(nodes, edges, M, layout, g, cols);
        if (fits(w)) return w;
      }
    }
  }
  return out;
}

function viewHeight(m: {nodes: Placed[]}) {
  const b = bounds(m.nodes.filter((n) => !n.beside));
  return b.y1 - b.y0;
}

function viewWidth(m: {nodes: Placed[]}) {
  const b = bounds(m.nodes.filter((n) => !n.beside));
  return b.x1 - b.x0;
}

function layoutWith(nodes: MapNode[], edges: MapEdge[], M: Metrics, layout: Layout, glossMax: number, cols = 0): {nodes: Placed[]; edges: MapEdge[]} {
  const boxes = new Map(nodes.map((n) => [n.id, nodeBox(n, M, glossMax)]));
  const pos = new Map<string, V>();
  const all = nodes;
  nodes = nodes.filter((n) => !n.beside);
  const ids = new Set(nodes.map((n) => n.id));
  const es = edges.filter((e) => ids.has(e.from) && ids.has(e.to));
  const sideOf = new Map<string, [Side, Side]>();

  if (layout === 'cycle') {
    const n = nodes.length, top = nodes.slice(0, Math.ceil(n / 2)), bottom = nodes.slice(top.length);
    const col = new Map<string, number>();
    top.forEach((x, i) => col.set(x.id, i));
    bottom.forEach((x, j) => col.set(x.id, top.length - 1 - j));
    const cols = top.length;
    const colW = Array.from({length: cols}, (_, c) => Math.max(0, ...nodes.filter((x) => col.get(x.id) === c).map((x) => boxes.get(x.id)!.w)));
    const gap = Array.from({length: cols}, () => GAPX);
    const ring = nodes.map((x, i) => [x, nodes[(i + 1) % n]] as const);
    for (const [a, b] of ring) {
      const e = es.find((x) => x.from === a.id && x.to === b.id);
      const ca = col.get(a.id)!, cb = col.get(b.id)!;
      if (e && ca !== cb) gap[Math.min(ca, cb)] = Math.max(gap[Math.min(ca, cb)], labelWidth(e, M) + 2 * LEG_PAD + 40);
      const ta = top.includes(a), tb = top.includes(b);
      let s: [Side, Side];
      if (ta && tb) s = ['r', 'l'];
      else if (!ta && !tb) s = ['l', 'r'];
      else if (ta) s = ['r', 'r'];
      else s = ['l', 'l'];
      if (e) sideOf.set(e.id, s);
    }
    const xs: number[] = [];
    let x = 0;
    for (let c = 0; c < cols; c++) { xs.push(x); x += colW[c] + gap[c]; }
    const topDepth = Math.max(...top.map((t) => boxes.get(t.id)!.depth));
    const botAbove = bottom.length ? Math.max(...bottom.map((t) => boxes.get(t.id)!.above)) : 0;
    const y1 = topDepth + 130 + botAbove;
    top.forEach((t) => pos.set(t.id, [xs[col.get(t.id)!], 0]));
    bottom.forEach((t) => pos.set(t.id, [xs[col.get(t.id)!], y1]));
  } else if (layout === 'flow' || layout === 'down') {
    const preds = new Map<string, string[]>(nodes.map((n) => [n.id, []]));
    const succs = new Map<string, string[]>(nodes.map((n) => [n.id, []]));
    for (const e of es) { preds.get(e.to)!.push(e.from); succs.get(e.from)!.push(e.to); }
    const rank = new Map<string, number>();
    const visiting = new Set<string>();
    const rankOf = (id: string): number => {
      const given = nodes.find((n) => n.id === id)!.rank;
      if (given !== undefined) return given;
      if (rank.has(id)) return rank.get(id)!;
      if (visiting.has(id)) return 0; // a cycle: the edge back is drawn, not ranked
      visiting.add(id);
      const r = Math.max(-1, ...preds.get(id)!.filter((p) => !visiting.has(p)).map(rankOf)) + 1;
      visiting.delete(id);
      rank.set(id, r);
      return r;
    };
    for (const n of nodes) rank.set(n.id, rankOf(n.id));
    // a term nothing points to sits just before the first term it points to, not at the far left
    for (const n of nodes) {
      if (n.rank !== undefined || preds.get(n.id)!.length) continue;
      const ss = succs.get(n.id)!.map((x) => rank.get(x)!);
      if (ss.length) rank.set(n.id, Math.max(0, Math.min(...ss) - 1));
    }
    const R = Math.max(...rank.values()) + 1;
    const byRank: string[][] = Array.from({length: R}, () => []);
    nodes.forEach((n) => byRank[rank.get(n.id)!].push(n.id));
    const given = (id: string) => nodes.find((n) => n.id === id)!.order;
    // order within a column: by the mean place of the terms that point to it, then of those it points to
    const place = new Map<string, number>();
    byRank.forEach((c) => c.forEach((id, i) => place.set(id, given(id) ?? i)));
    const sweep = (c: string[], near: Map<string, string[]>) => {
      const key = (id: string) => {
        if (given(id) !== undefined) return given(id)!;
        const ps = near.get(id)!.filter((p) => place.has(p) && rank.get(p) !== rank.get(id));
        return ps.length ? ps.reduce((s, p) => s + place.get(p)!, 0) / ps.length : place.get(id)!;
      };
      c.sort((a, b) => key(a) - key(b) || place.get(a)! - place.get(b)!);
      c.forEach((id, i) => place.set(id, i));
    };
    for (let k = 0; k < 2; k++) {
      for (let r = 1; r < R; r++) sweep(byRank[r], preds);
      for (let r = R - 2; r >= 0; r--) sweep(byRank[r], succs);
    }
    // columns: as wide as their widest term, apart by the longest verb that crosses the gap
    const colW = byRank.map((c) => Math.max(0, ...c.map((id) => boxes.get(id)!.w)));
    const gap = byRank.map(() => GAPX);
    for (const e of es) {
      const ra = rank.get(e.from)!, rb = rank.get(e.to)!;
      if (ra !== rb) gap[Math.min(ra, rb)] = Math.max(gap[Math.min(ra, rb)], legFor(labelWidth(e, M)) + 110);
    }
    let x = 0;
    const xs = byRank.map((_, r) => { const v = x; x += colW[r] + gap[r]; return v; });
    // rows: each term level with the mean of the terms that point to it, packed without overlap
    const ys = new Map<string, number>();
    byRank.forEach((c) => {
      const want = c.map((id) => {
        const ps = preds.get(id)!.filter((p) => ys.has(p));
        return ps.length ? ps.reduce((s, p) => s + ys.get(p)!, 0) / ps.length : NaN;
      });
      const y: number[] = [];
      c.forEach((id, i) => {
        const b = boxes.get(id)!;
        const min = i === 0 ? -Infinity : y[i - 1] + boxes.get(c[i - 1])!.depth + GAPY + b.above;
        const w = Number.isNaN(want[i]) ? (i === 0 ? 0 : min) : want[i];
        y.push(Math.max(min, w));
      });
      // shift the column so it sits, on average, where it wants to (or centred, when nothing points to it)
      const wanted = want.map((w, i) => (Number.isNaN(w) ? null : w - y[i])).filter((v): v is number => v !== null);
      const shift = wanted.length ? wanted.reduce((s, v) => s + v, 0) / wanted.length : -((y[0] - boxes.get(c[0])!.above) + (y[y.length - 1] + boxes.get(c[c.length - 1])!.depth)) / 2;
      c.forEach((id, i) => ys.set(id, y[i] + shift));
    });
    if (layout === 'down') {
      // ranks as rows, top to bottom; each term under the mean of the terms that point to it, packed without overlap
      const xsD = new Map<string, number>();
      let top = 0;
      byRank.forEach((c) => {
        const want = c.map((id) => {
          const ps = preds.get(id)!.filter((p) => xsD.has(p));
          return ps.length ? ps.reduce((s, p) => s + xsD.get(p)! + boxes.get(p)!.w / 2, 0) / ps.length - boxes.get(id)!.w / 2 : NaN;
        });
        const x: number[] = [];
        c.forEach((id, i) => {
          const min = i === 0 ? -Infinity : x[i - 1] + boxes.get(c[i - 1])!.w + GAPX;
          x.push(Math.max(min, Number.isNaN(want[i]) ? (i === 0 ? 0 : min) : want[i]));
        });
        const wanted = want.map((w, i) => (Number.isNaN(w) ? null : w - x[i])).filter((v): v is number => v !== null);
        const shift = wanted.length ? wanted.reduce((s, v) => s + v, 0) / wanted.length : -(x[x.length - 1] + boxes.get(c[c.length - 1])!.w - x[0]) / 2;
        const above = Math.max(...c.map((id) => boxes.get(id)!.above)), depth = Math.max(...c.map((id) => boxes.get(id)!.depth));
        c.forEach((id, i) => { xsD.set(id, x[i] + shift); pos.set(id, [x[i] + shift, top + above]); });
        top += above + depth + 130;
      });
      for (const e of es) if (rank.get(e.from)! !== rank.get(e.to)!) sideOf.set(e.id, rank.get(e.from)! < rank.get(e.to)! ? ['b', 't'] : ['t', 'b']);
    } else if (cols > 0 && R > cols) {
      // rows of `cols` columns, each column as wide as its widest term in any row, each row under the last
      const cw = Array.from({length: cols}, (_, c) => Math.max(...byRank.filter((_, r) => r % cols === c).map((_, i) => colW[c + i * cols] ?? 0)));
      const cx: number[] = [];
      let x2 = 0;
      for (let c = 0; c < cols; c++) { cx.push(x2); x2 += cw[c] + Math.max(...byRank.map((_, r) => (r % cols === c ? gap[r] : 0))); }
      let top = 0;
      for (let row = 0; row * cols < R; row++) {
        const rs = byRank.slice(row * cols, row * cols + cols).flat();
        const y0 = Math.min(...rs.map((id) => ys.get(id)! - boxes.get(id)!.above));
        const y1 = Math.max(...rs.map((id) => ys.get(id)! + boxes.get(id)!.depth));
        rs.forEach((id) => pos.set(id, [cx[rank.get(id)! % cols], ys.get(id)! - y0 + top]));
        top += y1 - y0 + 150;
      }
      for (const e of es) if (Math.floor(rank.get(e.from)! / cols) !== Math.floor(rank.get(e.to)! / cols)) sideOf.set(e.id, ['b', 't']);
    } else nodes.forEach((n) => pos.set(n.id, [xs[rank.get(n.id)!], ys.get(n.id)!]));
  } else {
    nodes.forEach((n) => pos.set(n.id, [n.x ?? 0, n.y ?? 0]));
  }

  // the terms set beside others, in an order that finds each one's neighbour placed
  const left = all.filter((n) => n.beside);
  for (let guard = 0; left.length && guard < 50; guard++) {
    for (let i = 0; i < left.length; i++) {
      const n = left[i], of = pos.get(n.beside!.of);
      if (!of) continue;
      const a = boxes.get(n.beside!.of)!, b = boxes.get(n.id)!;
      const e = edges.find((x) => (x.from === n.id && x.to === n.beside!.of) || (x.to === n.id && x.from === n.beside!.of));
      const gx = Math.max(GAPX, e?.label ? legFor(labelWidth(e, M)) + 110 : 0), gy = 120;
      const side = n.beside!.side;
      let at: V = side === 'l' ? [of[0] - gx - b.w, of[1]] : side === 'r' ? [of[0] + a.w + gx, of[1]] : side === 't' ? [of[0], of[1] - a.above - gy - b.depth] : [of[0], of[1] + a.depth + gy + b.above];
      // clear of every term already placed: moved on, the way it was set, until it overlaps none
      const step: V = side === 'l' ? [-60, 0] : side === 'r' ? [60, 0] : side === 't' ? [0, -60] : [0, 60];
      const hits = (p: V) => [...pos.entries()].some(([id, q]) => {
        const c = boxes.get(id)!;
        return p[0] < q[0] + c.w + 40 && p[0] + b.w + 40 > q[0] && p[1] - b.above < q[1] + c.depth + 30 && p[1] + b.depth + 30 > q[1] - c.above;
      });
      for (let k = 0; k < 40 && hits(at); k++) at = [at[0] + step[0], at[1] + step[1]];
      pos.set(n.id, at);
      left.splice(i--, 1);
    }
  }
  nodes = all;
  // centre the map on (960, 470), then let a node's own x and y win
  let placed: Placed[] = nodes.map((n) => ({...n, x: pos.get(n.id)?.[0] ?? 0, y: pos.get(n.id)?.[1] ?? 0, box: boxes.get(n.id)!}));
  if (layout !== 'none') {
    const b = bounds(placed);
    const dx = 960 - (b.x0 + b.x1) / 2, dy = 470 - (b.y0 + b.y1) / 2;
    placed = placed.map((p) => ({...p, x: Math.round(p.x + dx), y: Math.round(p.y + dy)}));
  }
  placed = placed.map((p) => ({...p, x: nodes.find((n) => n.id === p.id)!.x ?? p.x, y: nodes.find((n) => n.id === p.id)!.y ?? p.y}));
  const at = new Map(placed.map((p) => [p.id, p]));
  const out = edges.map((e) => {
    const a = at.get(e.from), b = at.get(e.to);
    if (!a || !b) return e;
    const s = sideOf.get(e.id) ?? sidesFor(a, b);
    return {...e, fromSide: e.fromSide ?? s[0], toSide: e.toSide ?? s[1]};
  });
  return {nodes: placed, edges: out};
}

/** the box round some placed terms, words included, in map pixels */
export function bounds(nodes: Placed[]) {
  if (!nodes.length) return {x0: 0, y0: 0, x1: 1920, y1: 900};
  return {
    x0: Math.min(...nodes.map((n) => n.x - 30)),
    x1: Math.max(...nodes.map((n) => n.x + n.box.w + 30)),
    y0: Math.min(...nodes.map((n) => n.y - n.box.above)),
    y1: Math.max(...nodes.map((n) => n.y + n.box.depth)),
  };
}

// ------------------------------------------------------------------ the camera

export const FRAME_X = 960;
export const FRAME_Y = 480;
/** where the map is drawn on the frame: under the band of the running head and the key, above the captions; it fades out over 50 px at the top and 40 at the bottom */
export const MAP_TOP = 200, MAP_BOTTOM = 900;
export type Cam = {camX: number; camY: number; zoom: number};
export const CameraContext = React.createContext<Cam | null>(null);

/**
 * How much of a block of words (its box in map pixels) to show where the camera has it: words carried into the fading bands
 * at the top and bottom of the map, or to the frame's sides, fade out with it and are gone before they are cut.
 */
/** How much of a term's small words (gloss, index, verb) to show at the camera's zoom: pulled back below the readable zoom,
 * only the terms and their lines stay, as a map shows less as it shows more */
export function useDetail() {
  const cam = React.useContext(CameraContext);
  return cam ? unit((cam.zoom - 0.76) / (READABLE - 0.76)) : 1;
}
export const READABLE = 0.8;

export function useEdgeFade(b: {x0: number; y0: number; x1: number; y1: number}) {
  const cam = React.useContext(CameraContext);
  if (!cam) return 1;
  const sx = (x: number) => FRAME_X + (x - cam.camX) * cam.zoom, sy = (y: number) => FRAME_Y + (y - cam.camY) * cam.zoom;
  const ramp = (v: number, from: number, to: number) => unit((v - from) / (to - from));
  const f = Math.min(ramp(sy(b.y0), MAP_TOP - 50, MAP_TOP), ramp(sy(b.y1), MAP_BOTTOM, MAP_BOTTOM - 40), ramp(sx(b.x0), 24, 90), ramp(sx(b.x1), 1896, 1830));
  return f < 0.3 ? 0 : f;
}
// the part of the frame a fitted map uses: clear of the running head and the key above, and of the captions below
const FIT = {x0: 120, x1: 1800, y0: 215, y1: 860};

/** the camera that fits a box into the frame, its zoom kept between `min` and `max` so the type stays readable */
// a view is fitted at 0.8 or more, where the type is readable on a phone; one that cannot be goes down to 0.55 rather than lose
// its ends: below 0.8 only terms and lines show (useDetail), and at 0.55 a term is still about 33 px
export function fitCamera(b: {x0: number; y0: number; x1: number; y1: number}, min = 0.55, max = 1.25): Cam {
  const zoom = Math.max(min, Math.min(max, (FIT.x1 - FIT.x0) / (b.x1 - b.x0), (FIT.y1 - FIT.y0) / (b.y1 - b.y0)));
  const cx = (FIT.x0 + FIT.x1) / 2, cy = (FIT.y0 + FIT.y1) / 2;
  return {camX: (b.x0 + b.x1) / 2 - (cx - FRAME_X) / zoom, camY: (b.y0 + b.y1) / 2 - (cy - FRAME_Y) / zoom, zoom};
}

// ------------------------------------------------------------------ a relation's path

export type Path = {pts: V[]; len: number[]; total: number; label?: {x: number; y: number; w: number; h: number; at: number; gap: boolean}};

const unitV = (v: V): V => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

export function port(n: Placed, side: Side): {p: V; out: V} {
  const {w, above, depth} = n.box;
  const x = n.x + Math.min(48, w / 2);
  if (side === 'l') return {p: [n.x - GAP, n.y], out: [-1, 0]};
  if (side === 'r') return {p: [n.x + w + GAP, n.y], out: [1, 0]};
  if (side === 't') return {p: [x, n.y - above - 14], out: [0, -1]};
  return {p: [x, n.y + depth + 14], out: [0, 1]};
}

/**
 * The relation's path: a straight run out of the first term (the underline running on, and the place its verb is set),
 * a curve, and a straight run into the second. The verb sits in a gap cut in a straight run, or beside the line where it turns,
 * never on the stroke.
 */
export function relationPath(nodes: Placed[], e: MapEdge, M: Metrics, all: MapEdge[] = []): Path {
  const a = nodes.find((n) => n.id === e.from), b = nodes.find((n) => n.id === e.to);
  if (!a || !b) throw new Error(`relation ${e.id}: no node ${!a ? e.from : e.to}`);
  const [sa, sb] = [e.fromSide ?? sidesFor(a, b)[0], e.toSide ?? sidesFor(a, b)[1]];
  const A = port(a, sa), B = port(b, sb);
  const lw = labelWidth(e, M), lh = TYPE.labelLine;
  const pts: V[] = [];
  const line = (p: V, q: V, n: number) => { for (let i = pts.length ? 1 : 0; i <= n; i++) pts.push([p[0] + ((q[0] - p[0]) * i) / n, p[1] + ((q[1] - p[1]) * i) / n]); };
  const level = Math.abs(A.p[1] - B.p[1]) < 2 && A.out[0] * B.out[0] < 0 && (B.p[0] - A.p[0]) * A.out[0] > 0;
  const plumb = Math.abs(A.p[0] - B.p[0]) < 2 && A.out[1] * B.out[1] < 0 && (B.p[1] - A.p[1]) * A.out[1] > 0;
  const horizontal = sa === 'l' || sa === 'r';
  // the verb sits on the run out of the first term, unless another labelled line leaves by the same port: then on the run into the second
  const side = (x: MapEdge, end: 'from' | 'to') => (end === 'from' ? x.fromSide : x.toSide);
  const shared = (end: 'from' | 'to', sd: Side) => all.some((x) => x.id !== e.id && x.label && x[end] === e[end] && side(x, end) === sd);
  const atEnd = !!e.label && e.labelAt === undefined && sa !== sb && shared('from', sa) && (sb === 'l' || sb === 'r') && !shared('to', sb);
  let legA = 0, legB = 0;
  // a line between rows (out of the bottom of one term into the top of another, far apart across) is ruled square:
  // down into the gap between them, along it, and down into the second, with rounded corners
  const vertical = (sa === 'b' && sb === 't') || (sa === 't' && sb === 'b');
  if (vertical && Math.abs(A.p[0] - B.p[0]) > 120 && (B.p[1] - A.p[1]) * A.out[1] > 60) {
    const mid = (A.p[1] + B.p[1]) / 2, dir = Math.sign(B.p[0] - A.p[0]), dy = Math.sign(B.p[1] - A.p[1]);
    const r = Math.min(40, Math.abs(mid - A.p[1]) - 4);
    const arc = (cx: number, cy: number, a0: number, a1: number) => { if (a1 - a0 > Math.PI) a1 -= 2 * Math.PI; if (a0 - a1 > Math.PI) a1 += 2 * Math.PI; for (let i = 1; i <= 10; i++) { const a = a0 + ((a1 - a0) * i) / 10; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
    line(A.p, [A.p[0], mid - dy * r], 20);
    // turn from travelling along y to along x, then back
    const c1: V = [A.p[0] + dir * r, mid - dy * r];
    arc(c1[0], c1[1], Math.atan2(0 - 0, -dir), Math.atan2(dy, 0));
    line(pts[pts.length - 1], [B.p[0] - dir * r, mid], 60);
    const c2: V = [B.p[0] - dir * r, mid + dy * r];
    arc(c2[0], c2[1], Math.atan2(-dy, 0), Math.atan2(0, dir));
    line(pts[pts.length - 1], B.p, 20);
  } else if (level || plumb) line(A.p, B.p, 120);
  else {
    legA = e.label && horizontal && sa !== sb && e.labelAt === undefined && !atEnd ? legFor(lw) : 26;
    legB = atEnd ? legFor(lw) : 26;
    const P1: V = [A.p[0] + A.out[0] * legA, A.p[1] + A.out[1] * legA];
    const P2: V = [B.p[0] + B.out[0] * legB, B.p[1] + B.out[1] * legB];
    const d = Math.hypot(P2[0] - P1[0], P2[1] - P1[1]);
    const k = Math.max(70, Math.min(380, d * 0.45));
    const c1: V = [P1[0] + A.out[0] * k, P1[1] + A.out[1] * k];
    const c2: V = [P2[0] + B.out[0] * k, P2[1] + B.out[1] * k];
    line(A.p, P1, 12);
    for (let i = 1; i <= 120; i++) {
      const t = i / 120, u = 1 - t;
      pts.push([
        u * u * u * P1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * P2[0],
        u * u * u * P1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * P2[1],
      ]);
    }
    for (let i = 1; i <= 12; i++) pts.push([P2[0] + ((B.p[0] - P2[0]) * i) / 12, P2[1] + ((B.p[1] - P2[1]) * i) / 12]);
  }
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const path: Path = {pts, len, total: len[len.length - 1]};
  if (e.label) {
    if (legA > 26 || legB > 26) {
      const at = legA > 26 ? (legA / 2) / path.total : 1 - (legB / 2 + 6) / path.total;
      const c = pointAt(path, at);
      path.label = {x: c.x, y: c.y, w: lw, h: lh, at, gap: true};
    } else {
      const at = e.labelAt ?? 0.5;
      const c = pointAt(path, at);
      const dir: V = [Math.cos(c.angle), Math.sin(c.angle)];
      if (Math.abs(dir[0]) > 0.97) {
        path.label = {x: c.x, y: c.y, w: lw, h: lh, at, gap: true};
      } else {
        // beside the line, on the side away from the two terms; a U-turn's verb sits inside it, in the band between the rows
        let nrm: V = unitV([-dir[1], dir[0]]);
        const mid: V = [(a.x + a.box.w / 2 + b.x + b.box.w / 2) / 2, (a.y + b.y) / 2];
        if (((c.x - mid[0]) * nrm[0] + (c.y - mid[1]) * nrm[1] < 0) !== (sa === sb)) nrm = [-nrm[0], -nrm[1]];
        const off = Math.abs(nrm[0]) * (lw / 2) + Math.abs(nrm[1]) * (lh / 2) + 14;
        let L = {x: c.x + nrm[0] * off, y: c.y + nrm[1] * off, w: lw, h: lh, at, gap: false};
        // inside a U-turn only if the band there is clear of every term (a picture above a word may fill it); outside otherwise
        const hit = (q: typeof L) => nodes.some((n) => q.x + q.w / 2 > n.x - 10 && q.x - q.w / 2 < n.x + n.box.w + 10 && q.y + q.h / 2 > n.y - n.box.above && q.y - q.h / 2 < n.y + n.box.depth);
        if (sa === sb && hit(L)) L = {...L, x: c.x - nrm[0] * off, y: c.y - nrm[1] * off};
        path.label = L;
      }
    }
  }
  return path;
}

/** the point at fraction t of the path's length, and the direction of travel there in radians */
export function pointAt(path: Path, t: number): {x: number; y: number; angle: number} {
  const L = Math.max(0, Math.min(1, t)) * path.total;
  let i = 1;
  while (i < path.len.length - 1 && path.len[i] < L) i++;
  const [x0, y0] = path.pts[i - 1], [x1, y1] = path.pts[i];
  const seg = path.len[i] - path.len[i - 1] || 1;
  const f = (L - path.len[i - 1]) / seg;
  return {x: x0 + (x1 - x0) * f, y: y0 + (y1 - y0) * f, angle: Math.atan2(y1 - y0, x1 - x0)};
}

/** the path up to fraction t, as an svg path */
/** the part of the path between fractions a and b, as an svg path */
export function span(path: Path, a: number, b: number) {
  const A = Math.max(0, Math.min(1, a)) * path.total, B = Math.max(0, Math.min(1, b)) * path.total;
  const s0 = pointAt(path, a);
  let d = `M${s0.x.toFixed(1)} ${s0.y.toFixed(1)}`;
  for (let i = 1; i < path.pts.length; i++) if (path.len[i] > A && path.len[i] < B) d += `L${path.pts[i][0].toFixed(1)} ${path.pts[i][1].toFixed(1)}`;
  const e = pointAt(path, b);
  return d + `L${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
}
/** the drawn part of a relation: from its tail, or from its head when it is drawn in reverse */
export const drawn = (path: Path, e: MapEdge) => (e.reverse ? span(path, 1 - unit(e.draw ?? 1), 1) : partial(path, e.draw ?? 1));
/** where the nib of a relation being drawn is, as a fraction of its path */
export const nibAt = (e: MapEdge) => (e.reverse ? 1 - unit(e.draw ?? 1) : unit(e.draw ?? 1));

export function partial(path: Path, t: number) {
  const L = Math.max(0, Math.min(1, t)) * path.total;
  let d = `M${path.pts[0][0].toFixed(1)} ${path.pts[0][1].toFixed(1)}`;
  for (let i = 1; i < path.pts.length && path.len[i] <= L; i++) d += `L${path.pts[i][0].toFixed(1)} ${path.pts[i][1].toFixed(1)}`;
  const end = pointAt(path, t);
  return d + `L${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}

export const unit = (v: number) => Math.max(0, Math.min(1, v));
export const ease = (v: number) => {
  const t = unit(v);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};

// ------------------------------------------------------------------ the laid-out map, shared with what is drawn on it

export type MapState = {nodes: Placed[]; edges: MapEdge[]; M: Metrics; at: (id: string) => Placed | undefined};
export const MapContext = React.createContext<MapState | null>(null);
/** the map a component sits on, inside IdeaMap */
export const useMap = () => React.useContext(MapContext);

export function useLaidOut(nodes: MapNode[], edges: MapEdge[], layout: Layout = 'flow'): MapState {
  const M = useMetrics();
  // the layout depends on the words and the shape, not on how far each term has grown, so it holds still as the map is drawn
  const shape = JSON.stringify([nodes.map(({show, state, ...n}) => n), edges.map(({draw, state, ...e}) => e), layout]);
  const laid = React.useMemo(() => layoutMap(nodes, edges, M, layout), [shape, M]);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const eById = new Map(edges.map((e) => [e.id, e]));
  const placed = laid.nodes.map((p) => ({...p, show: byId.get(p.id)?.show, state: byId.get(p.id)?.state}));
  const out = laid.edges.map((e) => ({...e, draw: eById.get(e.id)?.draw, state: eById.get(e.id)?.state}));
  const at = (id: string) => placed.find((n) => n.id === id);
  return {nodes: placed, edges: out, M, at};
}

/** the box round some terms and the relations among them, verbs included */
export type View = string[] | 'all' | {ids: string[] | 'all'; grow?: [number, number, number, number]};
export function viewBounds(map: MapState, view: View) {
  const ids = Array.isArray(view) || view === 'all' ? view : view.ids;
  const g = !Array.isArray(view) && view !== 'all' ? view.grow ?? [0, 0, 0, 0] : [0, 0, 0, 0];
  const b = viewBox(map, ids);
  return {x0: b.x0 - g[0], y0: b.y0 - g[1], x1: b.x1 + g[2], y1: b.y1 + g[3]};
}
function viewBox(map: MapState, ids: string[] | 'all') {
  const has = (id: string) => ids === 'all' || ids.includes(id);
  const b = bounds(map.nodes.filter((n) => has(n.id)));
  for (const e of map.edges) {
    if (!has(e.from) && !has(e.to)) continue;
    const p = relationPath(map.nodes, e, map.M, map.edges);
    if (!has(e.from) || !has(e.to)) {
      // a line out of the view: only its verb, when it sits by a term in the view
      const near = p.label && p.label.gap && (p.label.at < 0.5 ? has(e.from) : has(e.to));
      if (near && p.label) { b.x0 = Math.min(b.x0, p.label.x - p.label.w / 2 - 10); b.x1 = Math.max(b.x1, p.label.x + p.label.w / 2 + 10); }
      continue;
    }
    for (const [x, y] of p.pts) { b.x0 = Math.min(b.x0, x - 24); b.x1 = Math.max(b.x1, x + 24); b.y0 = Math.min(b.y0, y - 24); b.y1 = Math.max(b.y1, y + 24); }
    if (p.label) { b.x0 = Math.min(b.x0, p.label.x - p.label.w / 2 - 10); b.x1 = Math.max(b.x1, p.label.x + p.label.w / 2 + 10); b.y0 = Math.min(b.y0, p.label.y - p.label.h / 2); b.y1 = Math.max(b.y1, p.label.y + p.label.h / 2); }
  }
  return b;
}

/**
 * Where the camera looks: a view (the terms to frame, or 'all') chosen by a number a document tweens (1.5 is halfway from the
 * second view to the third), or a camera set by hand, then handed over to the head of a relation being ridden.
 */
export function cameraFor(map: MapState, o: {views?: View[]; view?: number; camX?: number; camY?: number; zoom?: number; ride?: string; rideMix?: number; rideZoom?: number; lead?: number}): Cam & {angle: number} {
  let cam: Cam = {camX: o.camX ?? 960, camY: o.camY ?? 480, zoom: o.zoom ?? 1};
  if (o.views?.length) {
    const fitOf = (v: View) => fitCamera(viewBounds(map, v));
    const k = Math.max(0, Math.min(o.views.length - 1, o.view ?? 0));
    const i = Math.floor(k), f = ease(k - i);
    const A = fitOf(o.views[i]), B = fitOf(o.views[Math.min(o.views.length - 1, i + 1)]);
    // zoom moves in proportion, so a zoom out and back in feel the same
    const z = A.zoom * (B.zoom / A.zoom) ** f;
    cam = {camX: A.camX + (B.camX - A.camX) * f, camY: A.camY + (B.camY - A.camY) * f, zoom: z};
  }
  let angle = 0;
  const e = o.ride ? map.edges.find((x) => x.id === o.ride) : undefined;
  if (e && (o.rideMix ?? 0) > 0) {
    const path = relationPath(map.nodes, e, map.M, map.edges);
    const q0 = pointAt(path, e.reverse ? Math.max(0, nibAt(e) - (o.lead ?? 0) / path.total) : Math.min(1, nibAt(e) + (o.lead ?? 0) / path.total));
    const q = e.reverse ? {...q0, angle: q0.angle + Math.PI} : q0;
    const m = ease(o.rideMix ?? 0);
    const rz = o.rideZoom ?? 1.3;
    cam = {camX: cam.camX + (q.x - cam.camX) * m, camY: cam.camY + (q.y - cam.camY) * m, zoom: cam.zoom * (rz / cam.zoom) ** m};
    angle = q.angle;
  }
  return {...cam, angle};
}

// ------------------------------------------------------------------ growing the map in order

export type Step = {node?: string; edges: {id: string; reverse: boolean}[]};

/**
 * The order a map grows in, from its terms' order: each step stands one term, ruling first the line that reaches it from a term
 * already standing (drawn from that term's side, so a new cause is reached by a line run back out of the map), or rules a line
 * between two terms already standing (a cycle closing). A line always comes before the term it reaches.
 */
export function growSteps(nodes: MapNode[], edges: MapEdge[]): Step[] {
  const standing = new Set<string>(), ruled = new Set<string>();
  const steps: Step[] = [];
  for (const n of nodes) {
    const reach = edges.filter((e) => !ruled.has(e.id) && ((e.to === n.id && standing.has(e.from)) || (e.from === n.id && standing.has(e.to))));
    // one line reaches the new term; any others between it and the map are ruled as their own steps after it
    const first = reach[0];
    steps.push({node: n.id, edges: first ? [{id: first.id, reverse: first.from === n.id}] : []});
    if (first) ruled.add(first.id);
    standing.add(n.id);
    for (const e of reach.slice(1)) { steps.push({edges: [{id: e.id, reverse: e.from === n.id}]}); ruled.add(e.id); }
  }
  for (const e of edges) if (!ruled.has(e.id) && standing.has(e.from) && standing.has(e.to)) steps.push({edges: [{id: e.id, reverse: false}]});
  return steps;
}

/**
 * The map grown to `grow` steps: step k runs from k to k + 1; its line is ruled over the first 0.7 of it and its term stands
 * from 0.55, as the line arrives. A term or line the growth does not reach keeps its own `show` or `draw`.
 */
export function grown(nodes: MapNode[], edges: MapEdge[], grow: number): {nodes: MapNode[]; edges: MapEdge[]} {
  const steps = growSteps(nodes, edges);
  const show = new Map<string, number>(), draw = new Map<string, {d: number; reverse: boolean}>();
  steps.forEach((s, k) => {
    const lined = s.edges.length > 0 && !!s.node;
    s.edges.forEach((e) => draw.set(e.id, {d: unit(lined ? (grow - k) / 0.7 : grow - k), reverse: e.reverse}));
    if (s.node) show.set(s.node, unit(lined ? (grow - k - 0.55) / 0.45 : grow - k));
  });
  return {
    nodes: nodes.map((n) => (show.has(n.id) ? {...n, show: show.get(n.id)} : n)),
    edges: edges.map((e) => (draw.has(e.id) ? {...e, draw: draw.get(e.id)!.d, reverse: draw.get(e.id)!.reverse} : e)),
  };
}
