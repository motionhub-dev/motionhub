import {lengthOf, oval, pathOf, stroke, wobble, type Pt} from './pencil-path.ts';

export const meta = {
  name: {en: 'Pencil mark', 'zh-CN': '红笔记号'},
  purpose: 'mark',
  line: 'A red-pencil circle, underline, box, tick or cross, drawn stroke by stroke as the narration questions what is under it.',
  fits: 'circling the figure that matters; underlining the clause that decides; ticking what holds and crossing what does not',
  params: {
    kind: {type: 'circle | underline | box | tick | cross', default: 'circle', doc: 'which mark'},
    draw: {type: 'progress', default: 0, doc: '0 to 1: how much of the mark is drawn; tween it on the word'},
    width: {type: 'px', doc: 'the width of what is marked'},
    height: {type: 'px', doc: 'the height of what is marked'},
    x: {type: 'px', default: 0, doc: 'left of the marked area, inside the parent'},
    y: {type: 'px', default: 0, doc: 'top of the marked area, inside the parent'},
    seed: {type: 'text', default: 'mark', doc: 'a different seed gives a different hand'},
  },
  preview: 4.8,
};

type Kind = 'circle' | 'underline' | 'box' | 'tick' | 'cross';

/** The strokes of a mark around a w × h area, in the order a hand makes them */
function strokes(kind: Kind, w: number, h: number, seed: string): Pt[][] {
  const pad = Math.max(10, Math.min(w, h) * 0.12);
  switch (kind) {
    case 'circle': return [wobble(oval(w / 2, h / 2, w / 2 + pad * 1.4, h / 2 + pad, seed), seed, 4)];
    case 'underline': return [wobble(stroke([-pad * 0.4, h + 10], [w + pad * 0.6, h + 4], seed), seed, 2.5)];
    case 'box': return [[-pad, -pad, w + pad, -pad], [w + pad, -pad, w + pad, h + pad], [w + pad, h + pad, -pad, h + pad], [-pad, h + pad, -pad, -pad]]
      .map(([ax, ay, bx, by], i) => wobble(stroke([ax + (i % 2) * 6, ay], [bx + 8, by + (i % 2 ? 6 : -4)], `${seed}:${i}`, 0.015), `${seed}:${i}`, 2));
    case 'tick': return [wobble([...stroke([0, h * 0.55], [w * 0.35, h], `${seed}:a`), ...stroke([w * 0.35, h], [w, 0], `${seed}:b`).slice(1)], seed, 2)];
    case 'cross': return [wobble(stroke([0, 0], [w, h], `${seed}:a`), `${seed}:a`, 2), wobble(stroke([w, 0], [0, h], `${seed}:b`), `${seed}:b`, 2)];
  }
}

export function PencilMark({kind = 'circle', draw = 0, width, height, x = 0, y = 0, seed = 'mark'}: {kind?: Kind; draw?: number; width: number; height: number; x?: number; y?: number; seed?: string}) {
  const lines = strokes(kind, width, height, seed);
  const lengths = lines.map(lengthOf), total = lengths.reduce((a, b) => a + b, 0);
  let left = Math.max(0, Math.min(1, draw)) * total;
  const m = 60; // room for the mark outside the area
  return (
    <svg width={width + 2 * m} height={height + 2 * m} viewBox={`${-m} ${-m} ${width + 2 * m} ${height + 2 * m}`}
      style={{position: 'absolute', left: x - m, top: y - m, overflow: 'visible', pointerEvents: 'none'}}>
      {lines.map((pts, i) => {
        const len = lengths[i], shown = Math.max(0, Math.min(len, left));
        left -= len;
        if (shown <= 0) return null;
        const d = pathOf(pts);
        return (
          <g key={i} fill="none" stroke="var(--vt-grad)" strokeLinecap="round" strokeLinejoin="round">
            {/* the pencil's body and the lighter grain beside it */}
            <path d={d} strokeWidth={5.5} strokeOpacity={0.9} strokeDasharray={len} strokeDashoffset={len - shown} />
            <path d={d} strokeWidth={2} strokeOpacity={0.45} strokeDasharray={len} strokeDashoffset={len - shown} transform="translate(1.6 -1.2)" />
          </g>
        );
      })}
    </svg>
  );
}
