import {CUT_SHADOW, clamp, yOf, type Cam} from './plumb.ts';

export type Band = {from: number; color: string};
export type Floor = {at: number; notch: [number, number]; to: number; color: string};

export const meta = {
  name: {en: 'Cut-paper strata', 'zh-CN': '纸雕分层'},
  purpose: 'ground',
  line: "The whole height of the subject as sheets of cut paper, each with a wavy edge and a soft shadow on the sheet below, darkening as they go, all placed at their true depth.",
  fits: "every scene: the sea, the sky, the Earth's interior, a tall building",
  params: {
    cam: {type: '{at, scale}', doc: 'the camera along the axis; tween at and the logarithm of scale'},
    sky: {type: 'string', doc: 'the colour above the first sheet'},
    bands: {type: '{from, color}[]', doc: 'the sheets from the top, each with the depth it starts at'},
    floor: {type: '{at, notch, to, color}', doc: 'a sheet that ends the subject at depth `at`, with a notch between two x down to depth `to`'},
    clock: {type: 'number', default: 0, doc: 'seconds: tween it linearly so the edges keep stirring'},
  },
  preview: 2,
};

const edge = (cam: Cam, depth: number, i: number, amp: number, clock: number) => Array.from({length: 65}, (_, s) => {
  const x = (s / 64) * 1920;
  return [x, yOf(cam, depth) + amp * (Math.sin(x * 0.0058 + i * 1.9) + 0.6 * Math.sin(x * 0.0131 + i * 3.1 + clock * 0.12) + 0.3 * Math.sin(x * 0.029 + i * 5.3))] as [number, number];
});
/** A straight run between two points, cut by hand: it wanders a little across its own line. */
const cut = (a: [number, number], b: [number, number], seed: number) => Array.from({length: 17}, (_, s): [number, number] => {
  const k = s / 16, bow = Math.sin(k * Math.PI) * (Math.sin(k * 9 + seed * 2.3) + 0.5 * Math.sin(k * 23 + seed)) * 7;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [a[0] + (b[0] - a[0]) * k - ((b[1] - a[1]) / len) * bow, a[1] + (b[1] - a[1]) * k + ((b[0] - a[0]) / len) * bow];
});
const path = (pts: Array<[number, number]>) => 'M' + pts.map(([x, y]) => `${x.toFixed(0)} ${y.toFixed(1)}`).join('L') + 'Z';
const Sheet = ({d, color}: {d: string; color: string}) => (
  <div style={{position: 'absolute', inset: 0, filter: CUT_SHADOW}}><div style={{position: 'absolute', inset: 0, background: color, clipPath: `path('${d}')`}} /></div>
);

export function Strata({cam, sky, bands, floor, clock = 0}: {cam: Cam; sky: string; bands: Band[]; floor?: Floor; clock?: number}) {
  const amp = (i: number) => clamp(cam.scale * ((bands[i + 1]?.from ?? bands[i].from + 1000) - bands[i].from) * 0.03, 1, 15);
  const sheets = bands.map((b, i) => {
    const next = bands[i + 1];
    const low = next ? edge(cam, next.from, i + 1, amp(i + 1), clock).reverse() : [[1920, 1100], [0, 1100]] as Array<[number, number]>;
    return {at: b.from, node: <Sheet key={i} color={b.color} d={path([...edge(cam, b.from, i, amp(i), clock), ...low])} />};
  });
  // deepest first, so that each sheet lies over the next and shades it
  const deep = sheets.filter((s) => floor && s.at >= floor.at).reverse(), shallow = sheets.filter((s) => !floor || s.at < floor.at).reverse();
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: sky}} />
      {deep.map((s) => s.node)}
      {floor && <Sheet color={floor.color} d={path([[-10, yOf(cam, floor.at)], ...cut([floor.notch[0], yOf(cam, floor.at)], [floor.notch[0] + 90, yOf(cam, floor.to)], 1), ...cut([floor.notch[0] + 90, yOf(cam, floor.to)], [floor.notch[1] - 90, yOf(cam, floor.to)], 2), ...cut([floor.notch[1] - 90, yOf(cam, floor.to)], [floor.notch[1], yOf(cam, floor.at)], 3), [1930, yOf(cam, floor.at)], [1930, 1100], [-10, 1100]])} />}
      {shallow.map((s) => s.node)}
    </>
  );
}
