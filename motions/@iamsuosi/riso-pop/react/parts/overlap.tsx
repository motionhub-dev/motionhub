import {CANVAS, Plate, Print, Screens, blob, dotsPath, easeOut, unit, type Ink} from './riso.ts';

export const meta = {
  name: {en: 'Overprint', 'zh-CN': '叠印'},
  purpose: 'compare',
  line: 'Two things, one in each ink, kept apart by a wall in a frame; the wall breaks, they slide together, and violet appears where they overlap, with the name of what they make.',
  fits: 'two ingredients that react; two groups and what they share',
  params: {
    box: {type: '[x, y, w, h]', default: '[360, 190, 1200, 560]', doc: 'the frame (a cell, a room, a market) the two are kept in'},
    left: {type: 'text', doc: 'what the blue one is'},
    right: {type: 'text', doc: 'what the pink one is'},
    both: {type: 'text', default: '', doc: 'what appears where they overlap, printed in both inks, so it reads violet'},
    frame: {type: 'text', default: '', doc: 'a small name for the frame, at its top left'},
    meet: {type: 'progress', default: 0, doc: '0 to 1: the wall breaks in the first quarter, then the two slide together; `both` is printed, all at once, at 0.9'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the frame and the wall roll on with the blue plate, then the pink one is printed'},
    slip: {type: 'progress', default: 0, doc: 'tweened 0 to 1 linearly over about 1.4 s: the plates knock apart and snap back'},
  },
  preview: 18.6,
};

type Props = {box?: [number, number, number, number]; left: string; right: string; both?: string; frame?: string; meet?: number; show?: number; slip?: number};

export function Overlap({box = [360, 190, 1200, 560], left, right, both = '', frame = '', meet = 0, show = 1, slip = 0}: Props) {
  const [x, y, w, h] = box, cx = x + w / 2, cy = y + h * 0.6, r = h * 0.27;
  const brk = easeOut(meet / 0.25), slide = easeOut((meet - 0.15) / 0.85);
  const lx = x + w * 0.26 + w * 0.16 * slide, rx = x + w * 0.74 - w * 0.16 * slide;
  // the wall: a bar from the frame's top to its bottom, its middle torn away as it breaks
  const gap = h * 0.62 * brk, top = y + 24, bot = y + h - 24, mid = cy;
  const wall = `M${cx - 9} ${top}H${cx + 9}V${mid - gap / 2}H${cx - 9}Z M${cx - 9} ${mid + gap / 2}H${cx + 9}V${bot}H${cx - 9}Z`;
  // each ink's thing: a solid body with a rim of dots that thins away from it
  const rim = (ink: Ink, bx: number, seed: number) => dotsPath(ink, (px, py) => {
    const d = Math.hypot(px - bx, py - cy) / r;
    return d < 0.92 ? 0 : 0.6 * (1 - (d - 0.92) / 0.42) + 0.04 * Math.sin(seed + px * 0.02);
  }, [bx - r * 1.5, cy - r * 1.5, bx + r * 1.5, cy + r * 1.5]);
  const blue = unit(show / 0.6), pink = unit((show - 0.5) / 0.5), word = meet >= 0.9 ? 1 : 0;
  const lab = Math.round(Math.min(46, h * 0.075));
  return (
    <svg {...CANVAS}>
      <Screens />
      <Plate ink="blue" print={blue} slip={slip} box={[x, y, x + w, y + h]}>
        {/* the frame is a band of ink, its inside bare paper, so the two things are the only tone in it */}
        <path d={`M${x + 36} ${y}H${x + w - 36}A36 36 0 0 1 ${x + w} ${y + 36}V${y + h - 36}A36 36 0 0 1 ${x + w - 36} ${y + h}H${x + 36}A36 36 0 0 1 ${x} ${y + h - 36}V${y + 36}A36 36 0 0 1 ${x + 36} ${y}Z`
          + `M${x + 50} ${y + 14}H${x + w - 50}A36 36 0 0 1 ${x + w - 14} ${y + 50}V${y + h - 50}A36 36 0 0 1 ${x + w - 50} ${y + h - 14}H${x + 50}A36 36 0 0 1 ${x + 14} ${y + h - 50}V${y + 50}A36 36 0 0 1 ${x + 50} ${y + 14}Z`} fillRule="evenodd" />
        {brk < 1 && <path d={wall} />}
        <path d={blob(lx, cy, r * 0.92, 2)} />
        <path d={rim('blue', lx, 1)} />
        <Print x={x + w * 0.26} y={y + 86} size={lab} face="sans" weight={800} anchor="middle">{left}</Print>
        <Print x={x + w * 0.74} y={y + 86} size={lab} face="sans" weight={800} anchor="middle">{right}</Print>
        {frame && <Print x={x + 34} y={y - 22} size={34} face="sans" weight={700} spacing="0.12em">{frame.toUpperCase()}</Print>}
        {both && word > 0 && <g><Print x={cx} y={y + h + 74} size={lab + 26} face="display" anchor="middle">{both}</Print></g>}
      </Plate>
      <Plate ink="pink" print={pink} slip={slip} box={[x, y, x + w, y + h]}>
        <path d={blob(rx, cy, r * 0.92, 5)} />
        <path d={rim('pink', rx, 4)} />
        {both && word > 0 && <g><Print x={cx} y={y + h + 74} size={lab + 26} face="display" anchor="middle">{both}</Print></g>}
      </Plate>
    </svg>
  );
}
