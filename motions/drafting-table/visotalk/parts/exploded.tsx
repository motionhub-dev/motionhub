import {LINE, bounds, ease, hatchLines, lettering, phase, settle, typed, useSvgId} from './draft.ts';

export const meta = {
  name: {en: 'Exploded view', 'zh-CN': '爆炸图'},
  purpose: 'steps',
  line: 'An assembly pulled apart along its axis, each part clicking into line; it can tilt into an isometric model with thickness.',
  fits: 'what an assembly is made of; the order its parts go in',
  params: {
    items: {type: 'list of {d, w, h, from, to, label?, count?, delay?, depth?, cut?, solid?}', doc: 'each part\'s outline in its own w × h box, centred on the axis; from and to are its top (or left) when assembled and when apart; delay 0 to 0.5 holds it back; depth is its thickness in px (default 36); cut hatches its face as a section; solid false draws a wire (a spring)'},
    axis: {type: 'y | x', default: 'y', doc: 'the direction the parts travel'},
    spread: {type: 'progress', default: 1, doc: '0 assembled, 1 apart'},
    tilt: {type: 'progress', default: 0, doc: '0 a flat elevation, 1 turned to an isometric view where each part shows its thickness'},
    labels: {type: 'progress', default: 1, doc: '0 to 1: the names lettered beside the parts'},
    width: {type: 'px', doc: 'the box\'s width; the axis runs through its middle (axis y) or its middle height (axis x)'},
    height: {type: 'px', doc: 'the box\'s height'},
  },
  preview: 42,
};

export type Item = {d: string; w: number; h: number; from: number; to: number; label?: string; count?: string; delay?: number; depth?: number; cut?: boolean; solid?: boolean};

// the isometric turn at tilt 1: the top tips toward the viewer and the right side comes round, so top and side faces show
const TIP = -22, TURN = -34;
/** A part's sides, seen when the view turns: the sheet lit a little by the white line work */
const WALL = 'color-mix(in srgb, var(--vt-panel2) 72%, var(--vt-text))';

/** One part as a stack of thin slices from its front face to its back: the slices between are the walls a turned view sees */
function Solid({it}: {it: Item}) {
  const id = useSvgId();
  const depth = it.depth ?? 36, n = Math.max(2, Math.round(depth / 2.5)), solid = it.solid ?? true;
  const face = (z: number, front: boolean) => (
    <svg key={z} width={it.w} height={it.h} viewBox={`0 0 ${it.w} ${it.h}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', transform: `translateZ(${z.toFixed(2)}px)`}}>
      {solid && <path d={it.d} fill="var(--vt-panel)" fillRule="evenodd" />}
      {front && it.cut && <>
        <clipPath id={id}><path d={it.d} clipRule="evenodd" /></clipPath>
        <path d={hatchLines(bounds(it.d), 45, 12)} clipPath={`url(#${id})`} stroke={LINE.thin.color} strokeWidth={LINE.thin.width} fill="none" />
      </>}
      <path d={it.d} fill="none" stroke="var(--vt-text)" strokeWidth={front ? 4 : 2.5} strokeLinejoin="round" strokeOpacity={front ? 1 : 0.7} />
    </svg>
  );
  const wall = (z: number) => (
    <svg key={z} width={it.w} height={it.h} viewBox={`0 0 ${it.w} ${it.h}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', transform: `translateZ(${z.toFixed(2)}px)`}}>
      <path d={it.d} fill={solid ? WALL : 'none'} fillRule="evenodd" stroke={WALL} strokeWidth={solid ? 1 : 3.5} />
    </svg>
  );
  return <>{[face(-depth / 2, false), ...Array.from({length: n - 1}, (_, i) => wall(-depth / 2 + (depth * (i + 1)) / n)), face(depth / 2, true)]}</>;
}

export function Exploded({items, axis = 'y', spread = 1, tilt = 0, labels = 1, width, height}: {items: Item[]; axis?: 'y' | 'x'; spread?: number; tilt?: number; labels?: number; width: number; height: number}) {
  const vertical = axis === 'y';
  const mid = vertical ? width / 2 : height / 2;
  const t = ease(tilt), a = (TIP * t * Math.PI) / 180, b = (TURN * t * Math.PI) / 180;
  const place = (it: Item) => {
    const d = it.delay ?? 0;
    const along = it.from + (it.to - it.from) * settle(phase(spread, d, d + 0.5));
    return vertical ? {x: mid - it.w / 2, y: along} : {x: along, y: mid - it.h / 2};
  };
  // where a point of the box's front plane lands once the view is turned (CSS turns about the box's centre)
  const project = (x: number, y: number): [number, number] => {
    const px = x - width / 2, py = y - height / 2;
    return [width / 2 + px * Math.cos(b), height / 2 + py * Math.cos(a) + px * Math.sin(b) * Math.sin(a)];
  };
  const named = items.filter((it) => it.label);
  const reach = Math.max(...items.map((i) => (vertical ? i.w : i.h))) / 2;
  return (
    <>
      <div style={{position: 'absolute', left: 0, top: 0, width, height, transformStyle: 'preserve-3d', transform: `rotateX(${(TIP * t).toFixed(2)}deg) rotateY(${(TURN * t).toFixed(2)}deg)`}}>
        <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <path d={vertical ? `M${mid} 0 V${height}` : `M0 ${mid} H${width}`} stroke={LINE.centre.color} strokeWidth={LINE.centre.width} strokeDasharray={LINE.centre.dash} fill="none" />
        </svg>
        {items.map((it, k) => {
          const p = place(it);
          return <div key={k} style={{position: 'absolute', left: p.x, top: p.y, width: it.w, height: it.h, transformStyle: 'preserve-3d'}}><Solid it={it} /></div>;
        })}
      </div>
      {named.map((it, k) => {
        const p = place(it), write = phase(labels, k / named.length * 0.6, k / named.length * 0.6 + 0.4);
        if (write <= 0) return null;
        const [x, y] = vertical ? project(mid + reach + 40, p.y + it.h / 2) : project(p.x + it.w / 2, mid + reach + 50);
        return (
          <div key={k} style={{position: 'absolute', left: x, top: y, transform: vertical ? 'translate(0, -50%)' : 'translate(-50%, 0)', display: 'flex', alignItems: 'center', gap: 14}}>
            {vertical && <div style={{width: 40 * write, height: 2, background: 'var(--vt-muted)'}} />}
            <div style={{...lettering(32), color: 'var(--vt-text)', ...typed(write)}}>{it.label}{it.count && <span style={{color: 'var(--vt-muted)', marginLeft: '0.5em'}}>{it.count}</span>}</div>
          </div>
        );
      })}
    </>
  );
}
