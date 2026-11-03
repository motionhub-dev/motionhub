import {CANVAS, type Role, type View} from './iso.ts';
import {StackDrawing} from './stack.tsx';

export const meta = {
  name: {en: 'Stacks side by side', 'zh-CN': '对比方块柱'},
  purpose: 'compare',
  line: 'Two to four stacks of one cube in a row across the frame, on one baseline, each with its sign; one unit for all, so heights compare honestly.',
  fits: 'then and now; this site against that one; the shares of a whole counted in the same unit',
  params: {
    at: {type: '[x, y]', doc: 'the floor cell of the first (left) stack'},
    items: {type: '{label, value, role?}[]', doc: 'what each stack counts and how much; value in the same unit for all'},
    per: {type: 'number', doc: 'what one cube stands for, the same for every stack'},
    unit: {type: 'text', default: '', doc: 'what is counted, after each figure'},
    grow: {type: 'number', default: 99, doc: 'the stacks filled so far, in order: 0.5 is the first half full, 1 the first whole, 2 the second whole; a stack and its sign appear when it starts to fill'},
    focus: {type: 'number', default: -1, doc: 'the stack the sentence is about; the others grey'},
    footprint: {type: '[a, b]', default: '[2, 2]', doc: 'cubes along x and y in one layer'},
    spacing: {type: 'cells', default: 7, doc: 'from one stack to the next: each is that far along +x and back along -y, so all stand on one line of the screen'},
  },
  preview: 44.2,
};

type Item = {label: string; value: number; role?: Role};
type Props = {at: [number, number]; items: Item[]; per: number; unit?: string; grow?: number; focus?: number; footprint?: [number, number]; spacing?: number} & View;

export function Stacks({at: [x, y], items, per, unit = '', grow = 99, focus = -1, footprint = [2, 2], spacing = 7, origin, k}: Props) {
  return (
    <svg {...CANVAS}>
      {/* equal steps along +x and -y keep x + y, and so the screen baseline, the same for every stack: heights compare directly */}
      {/* drawn right to left, so each sign stands in front of the stack to its right */}
      {items.map((it, i) => ({it, i})).reverse().map(({it, i}) => grow <= i ? null : (
        <StackDrawing key={i} at={[x + i * spacing, y - i * spacing]} count={it.value / per} fill={Math.max(0, Math.min(1, grow - i))} per={per} unit={unit} title={it.label} footprint={footprint}
          role={it.role ?? 'store'} dim={focus >= 0 && focus !== i ? 0.85 : 0} origin={origin} k={k} />
      ))}
    </svg>
  );
}
