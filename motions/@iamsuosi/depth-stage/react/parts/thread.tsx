import {hazed, unit, useLook} from './stage.tsx';

export const meta = {
  name: {en: 'Thread between places', 'zh-CN': '两地连线'},
  purpose: 'link',
  line: 'A dashed hairline arcing from one place to another on one plane, a spark leading it, a ring where it lands and its words at the top of the arc.',
  fits: 'what travelled from one place to the next (ash on the wind, a road, a message, a cause and what it caused); how far apart two things are',
  params: {
    from: {type: '[x, y]', doc: 'where it leaves, at rest'},
    to: {type: '[x, y]', doc: 'where it lands, at rest'},
    bend: {type: 'px', default: 160, doc: 'how high the arc rises above the straight line between them'},
    label: {type: 'text', default: '', doc: 'its words, a few, set at the top of the arc'},
    warm: {type: 'boolean', default: false, doc: 'the spark and the ring in the one warm colour, when the thread is what the sentence is about'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: the arc draws from `from`, the ring lands, then the words'},
  },
  preview: 4.0,
};

export function Thread({from, to, bend = 160, label = '', warm = false, draw = 1}: {
  from: [number, number]; to: [number, number]; bend?: number; label?: string; warm?: boolean; draw?: number;
}) {
  const {fog} = useLook();
  const d = unit(draw), line = unit(d / 0.7), land = unit((d - 0.6) / 0.2), words = unit((d - 0.7) / 0.3);
  if (d <= 0) return null;
  // a quadratic arc whose top stands `bend` above the middle of the line between the two places
  const [x1, y1] = from, [x2, y2] = to;
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 - bend * 2;
  const at = (t: number): [number, number] => [(1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t * t * x2, (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t * t * y2];
  const [hx, hy] = at(line), [tx, ty] = at(0.5);
  const ink = hazed('var(--color-text)', fog * 0.5), spark = warm ? hazed('var(--color-data)', fog * 0.4) : ink;
  // the drawn part of the arc, as fine steps from its start to the spark
  const steps = Math.max(2, Math.ceil(line * 60));
  const drawn = Array.from({length: steps + 1}, (_, i) => at((i / steps) * line)).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  return (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <path d={drawn} fill="none" stroke={ink} strokeWidth={2} strokeDasharray="10 9" opacity={0.85} />
        <circle cx={x1} cy={y1} r={5} fill={ink} />
        {line < 1 && <circle cx={hx} cy={hy} r={6} fill={spark} style={{filter: `drop-shadow(0 0 8px ${spark})`}} />}
        {land > 0 && <circle cx={x2} cy={y2} r={8 + 4 * (1 - land)} fill="none" stroke={spark} strokeWidth={2.5} opacity={land} />}
        {land > 0 && <circle cx={x2} cy={y2} r={3} fill={spark} opacity={land} />}
      </svg>
      <div style={{position: 'absolute', left: tx - 400, width: 800, top: ty - 74, textAlign: 'center', opacity: words,
        filter: words < 0.99 ? `blur(${((1 - words) * 8).toFixed(1)}px)` : 'none', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 40,
        color: ink, textShadow: '0 2px 30px rgba(6, 9, 16, 0.55)', whiteSpace: 'nowrap'}}>{label}</div>
    </>
  );
}
