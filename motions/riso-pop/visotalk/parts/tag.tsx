import {CANVAS, Plate, Screens, easeOut, useSvgId, type Ink, type Pt} from './riso.ts';

export const meta = {
  name: {en: 'Tag', 'zh-CN': '标签'},
  purpose: 'mark',
  line: 'A notched block of one ink with its words knocked out to paper, on a leader to what it names; stamped down, never faded in.',
  fits: 'naming a part as it is said; a feature of a product; a short verdict',
  params: {
    text: {type: 'text', doc: 'two to four words'},
    at: {type: '[x, y]', doc: 'the middle of the tag\'s left edge (the notched end)'},
    point: {type: '[x, y]', default: 'none', doc: 'what it names: a leader runs from the notch to a dot there'},
    ink: {type: "'blue' | 'pink'", default: "'blue'", doc: 'its plate: blue for a name, pink for what the sentence stresses'},
    size: {type: 'px', default: 40, doc: 'the words\' size; the tag fits them'},
    show: {type: 'progress', default: 1, doc: '0 to 1 over about 0.4 s: it is stamped down from a little larger, the leader drawn first'},
    slip: {type: 'progress', default: 0, doc: 'tweened 0 to 1 linearly over about 1.4 s: the plates knock apart and snap back'},
  },
  preview: 41.6,
};

type Props = {text: string; at: Pt; point?: Pt; ink?: Ink; size?: number; show?: number; slip?: number};

export function Tag({text, at, point, ink = 'blue', size = 40, show = 1, slip = 0}: Props) {
  const id = useSvgId();
  if (show <= 0) return null;
  const [x, y] = at, h = Math.round(size * 1.7), w = Math.round(text.length * size * 0.7 + size * 1.6), n = h / 2;
  const lead = point ? easeOut(show / 0.35) : 1, stamp = show < 0.3 ? 0 : 1 + 0.18 * (1 - easeOut((show - 0.3) / 0.7));
  const shape = `M${x} ${y}L${x + n} ${y - n}H${x + w}V${y + n}H${x + n}Z`;
  const at1 = `translate(${x} ${y}) scale(${stamp}) translate(${-x} ${-y})`;
  return (
    <svg {...CANVAS}>
      <Screens />
      <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
        <rect width={1920} height={1080} fill="#fff" />
        <g><text x={x + n + size * 0.45} y={y + size * 0.36} fontSize={size} fill="#000"
          style={{fontFamily: 'var(--vt-sans)', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase'}}>{text}</text>
        <circle cx={x + n * 0.95} cy={y} r={size * 0.14} fill="#000" /></g>
      </mask>
      <Plate ink={ink} slip={slip}>
        {point && <path d={`M${x} ${y}L${x + (point[0] - x) * lead} ${y + (point[1] - y) * lead}`} stroke={`var(--vt-${ink === 'blue' ? 'data' : 'grad'})`} strokeWidth={5} fill="none" />}
        {point && lead >= 1 && <circle cx={point[0]} cy={point[1]} r={11} />}
        {stamp > 0 && <path d={shape} transform={at1} mask={`url(#${id})`} />}
      </Plate>
    </svg>
  );
}
