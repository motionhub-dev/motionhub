import {useDocTime} from '@visotalk/runtime';
import {C, Screen as Px, Sprite, Words, LABEL, TEXT, px, steps, twos, type Art} from './pixel.ts';

export const meta = {
  name: {en: 'Device screen', 'zh-CN': '设备屏幕'},
  purpose: 'steps',
  line: 'A pixel phone or monitor with an app on screen; a gold pointer clicks the row the step names and pins its number.',
  fits: 'a tutorial step on a device: tap Start, open Settings',
  params: {
    device: {type: 'text', default: 'phone', doc: 'phone or monitor'},
    x: {type: 'px', default: 320, doc: 'the device\'s left edge, in game pixels'},
    y: {type: 'px', default: 44, doc: 'its top edge, in game pixels'},
    app: {type: 'text', default: '', doc: 'the app\'s name in its title bar'},
    big: {type: 'text', default: '', doc: 'one large readout at the top of the screen: a time, a figure, a short word'},
    rows: {type: 'list', default: [], doc: 'the screen\'s rows: buttons, menu items or lines of a terminal, a few words each'},
    step: {type: 'number', default: 0, doc: 'the row the step points at, from 1; 0 for none'},
    n: {type: 'number', default: 1, doc: 'the step\'s number on its badge'},
    press: {type: 'progress', default: 0, doc: '0 to 1: the pointer walks in, clicks at 0.7 (the row lights gold) and the badge pins on'},
    show: {type: 'progress', default: 0, doc: '0 to 1: the device drops in and its screen switches on'},
  },
  preview: 42.3,
};

// the hand pointer, 10 × 12, the fingertip at its top left (2, 0)
const HAND: Art = [
  '.kk.......',
  'kwwk......',
  'kwwk......',
  'kwwkkk....',
  'kwwkwwkk..',
  'kwwkwwkwk.',
  'kwwwwwwwwk',
  'kwwwwwwwwk',
  '.kwwwwwwwk',
  '.kwwwwwwk.',
  '..kwwwwwk.',
  '..kkkkkkk.',
];

export function DeviceScreen({device = 'phone', x = 320, y = 44, app = '', big = '', rows = [], step = 0, n = 1, press = 0, show = 0}: {device?: string; x?: number; y?: number; app?: string; big?: string; rows?: string[]; step?: number; n?: number; press?: number; show?: number}) {
  const t = useDocTime();
  if (show <= 0) return null;
  const phone = device !== 'monitor';
  const W = phone ? 112 : 200, sx = 8, top = phone ? 14 : 8;
  const bigH = big ? 34 : 0;
  const H = top + 16 + bigH + rows.length * 18 + (phone ? 22 : 10);
  const fall = [-30, -18, -8, 0, -3, 0][Math.min(5, Math.floor(steps(show, 6) * 6))];
  const on = show >= 1;
  const X = px(x), Y = px(y) + fall;
  const sw = W - sx * 2;
  const rowY = (i: number) => Y + top + 16 + bigH + i * 18;
  const p = steps(press, 10);
  const target = step > 0 ? {x: X + sx + sw - 30, y: rowY(step - 1) + 9} : null;
  const lit = target && p >= 0.7;
  const hx = target ? Math.round(target.x + 60 * (1 - Math.min(1, p / 0.6))) : 0;
  const hy = target ? Math.round(target.y + 50 * (1 - Math.min(1, p / 0.6))) + (p >= 0.6 && p < 0.8 ? 1 : 0) : 0;
  return (
    <Px>
      {/* the body: ink edge, slate shell, a lighter rim on top */}
      <rect x={X - 1} y={Y + 2} width={W + 2} height={H - 4} fill={C.ink} />
      <rect x={X + 2} y={Y - 1} width={W - 4} height={H + 2} fill={C.ink} />
      <rect x={X} y={Y} width={W} height={H} fill={C.ink} />
      <rect x={X + 1} y={Y + 1} width={W - 2} height={H - 2} fill="#2B344A" />
      <rect x={X + 2} y={Y + 1} width={W - 4} height={1} fill="#46526C" />
      {phone && <rect x={X + W / 2 - 8} y={Y + 5} width={16} height={2} fill={C.ink} />}
      {phone && <rect x={X + W / 2 - 6} y={Y + H - 12} width={12} height={4} fill={C.ink} />}
      {!phone && <g><rect x={X + W / 2 - 10} y={Y + H} width={20} height={10} fill="#2B344A" /><rect x={X + W / 2 - 28} y={Y + H + 10} width={56} height={4} fill="#2B344A" /><rect x={X + W / 2 - 28} y={Y + H + 14} width={56} height={1} fill={C.ink} /></g>}
      {/* the screen */}
      <rect x={X + sx - 1} y={Y + top - 1} width={sw + 2} height={H - top - (phone ? 22 : 10) + 2} fill={C.ink} />
      <rect x={X + sx} y={Y + top} width={sw} height={H - top - (phone ? 22 : 10)} fill={on ? '#141B28' : '#0E131C'} />
      {on && (
        <g>
          <rect x={X + sx} y={Y + top} width={sw} height={12} fill="#243049" />
          <Words x={X + sx + 5} y={Y + top + 9} size={8} weight={700} font={LABEL} color={C.fog} outline={null}>{app}</Words>
          {big && <Words x={X + W / 2} y={Y + top + 16 + 26} size={24} weight={700} anchor="middle" color={C.bone} outline={null}>{big}</Words>}
          {rows.map((r, i) => {
            const isStep = step === i + 1;
            const ry = rowY(i);
            return (
              <g key={i}>
                <rect x={X + sx + 4} y={ry} width={sw - 8} height={15} fill={isStep && lit ? C.gold : '#243049'} />
                <rect x={X + sx + 4} y={ry + 14} width={sw - 8} height={1} fill={isStep && lit ? C.goldDark : C.ink} />
                <Words x={X + W / 2} y={ry + 11} size={12} font={TEXT} anchor="middle" color={isStep && lit ? C.ink : C.bone} outline={null}>{r}</Words>
                {isStep && lit && (
                  <g>
                    {[[-1, -1], [sw - 7, -1], [-1, 15], [sw - 7, 15]].map(([dx, dy], k) => <rect key={k} x={X + sx + 4 + dx} y={ry + dy} width={2} height={1} fill={C.bone} />)}
                  </g>
                )}
              </g>
            );
          })}
        </g>
      )}
      {on && target && p > 0 && (
        <g>
          {lit && (
            <g>
              <rect x={X - 13} y={target.y - 8} width={15} height={15} fill={C.ink} />
              <rect x={X - 12} y={target.y - 7} width={13} height={13} fill={C.gold} />
              <Words x={X - 6} y={target.y + 3} size={8} weight={700} anchor="middle" color={C.ink} outline={null}>{String(n)}</Words>
              <rect x={X + 1} y={target.y - 1} width={sx + 3} height={2} fill={C.gold} />
            </g>
          )}
          <Sprite art={HAND} pal={{k: C.ink, w: C.bone}} x={hx - 2} y={hy} />
          {lit && p < 1 && twos(t) % 2 === 0 && [[-5, -3], [5, -3], [0, -6]].map(([dx, dy], k) => <rect key={k} x={target.x + dx} y={target.y + dy - 2} width={2} height={2} fill={C.gold} />)}
        </g>
      )}
    </Px>
  );
}
