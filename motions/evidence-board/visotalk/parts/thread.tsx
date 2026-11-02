import {useZoom} from './board.tsx';

export const meta = {
  name: {en: 'Red thread', 'zh-CN': '红线'},
  purpose: 'link',
  line: 'A red thread run between two cards as the link is said, tacked at each end, slack, then taut.',
  fits: 'the photo that shows what the call reported; the finding that explains the photo',
  params: {
    from: {type: 'point', doc: 'the first pin, [x, y] in board pixels (pinAt from card.tsx)'},
    to: {type: 'point', doc: 'the second pin, [x, y] in board pixels'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: run out from `from` by 0.6, then pulled taut with a twang; tween it over 1.2 to 1.6 s on the words that say the link'},
    slack: {type: 'px', default: 60, doc: 'how far the thread hangs while it is being run, before it is pulled taut (40 to 90)'},
    pulse: {type: 'progress', default: 0, doc: '0 to 1: a glint runs along the thread from its first end to its second, as an argument is traced back through the case'},
    tacks: {type: 'boolean', default: true, doc: 'a small steel tack at each end, so a thread can be made fast at a card\'s corner rather than its pin; false where it ends on a pin'},
  },
  preview: 21.5,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => 1 - (1 - unit(v)) ** 2.4;

export function Thread({from, to, draw = 1, slack = 60, pulse = 0, tacks = true}: {from: [number, number]; to: [number, number]; draw?: number; slack?: number; pulse?: number; tacks?: boolean}) {
  const z = useZoom();
  const d = unit(draw);
  if (d <= 0.001) return null;
  const run = ease(d / 0.6);
  // pulled taut, it twangs: it snaps past straight, bows back, and settles in a few quick swings
  const u = unit((d - 0.6) / 0.4);
  const twang = u > 0 ? 1 - Math.exp(-4 * u) * Math.cos(u * Math.PI * 4.5) : 0;
  const [x0, y0] = from, [x1, y1] = to;
  // a thread hangs under its own weight: the control point drops by the slack, and rises nearly straight when pulled taut
  const sag = slack * (1 - 0.88 * twang);
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + sag;
  const len = Math.hypot(x1 - x0, y1 - y0) + sag * 1.4;
  const minX = Math.min(x0, x1, mx) - 30, minY = Math.min(y0, y1) - 30;
  const W = Math.max(x0, x1, mx) - minX + 30, H = Math.max(y0, y1, my) - minY + 30;
  const path = `M${x0 - minX} ${y0 - minY} Q${mx - minX} ${my - minY} ${x1 - minX} ${y1 - minY}`;
  const sw = Math.max(3.2, 2.6 / z);
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: minX, top: minY, overflow: 'visible', pointerEvents: 'none'}}>
      {/* the thread's shadow on the felt, a little below and soft */}
      <path d={path} transform="translate(3 7)" fill="none" stroke="#000" strokeOpacity={0.45} strokeWidth={sw * 1.4} strokeLinecap="round" strokeDasharray={`${len} ${len}`} strokeDashoffset={len * (1 - run)} style={{filter: 'blur(2px)'}} />
      <path d={path} fill="none" stroke="var(--vt-op)" strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${len} ${len}`} strokeDashoffset={len * (1 - run)} />
      {/* its twist: a fine lighter strand along it, short dashes */}
      <path d={path} fill="none" stroke="var(--vt-grad)" strokeOpacity={0.35} strokeWidth={sw * 0.35} strokeDasharray={`${4 / z} ${7 / z}`} strokeLinecap="round" opacity={run > 0.999 ? 1 : 0} />
      {/* a glint running along it: the eye led from one source to the next */}
      {pulse > 0.001 && pulse < 0.999 && (
        <path d={path} fill="none" stroke="#FFF1D6" strokeWidth={sw * 1.15} strokeLinecap="round" strokeDasharray={`${(len * 0.12).toFixed(1)} ${(len * 2).toFixed(1)}`} strokeDashoffset={(-len * (pulse * 1.12 - 0.12)).toFixed(1)}
          style={{filter: `drop-shadow(0 0 ${(6 / z).toFixed(1)}px rgba(255, 120, 90, 0.9))`}} />
      )}
      {/* the tacks it is made fast to: the first as it starts, the second as it arrives */}
      {tacks && [[x0, y0, 1], [x1, y1, unit((run - 0.97) / 0.03)]].map(([x, y, o], i) => o > 0.01 && (
        <g key={i} opacity={o}>
          <circle cx={x - minX + 1.5} cy={y - minY + 2.5} r={8} fill="#000" fillOpacity={0.45} />
          <circle cx={x - minX} cy={y - minY} r={8} fill="var(--vt-muted)" />
          <circle cx={x - minX - 2} cy={y - minY - 2.5} r={3} fill="var(--vt-text)" />
        </g>
      ))}
    </svg>
  );
}
