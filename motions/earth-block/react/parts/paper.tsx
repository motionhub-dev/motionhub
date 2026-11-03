import {C, MONO} from './earth.ts';

export const meta = {
  name: {en: 'Plate paper', 'zh-CN': '图版纸'},
  purpose: 'ground',
  line: "A pale textbook plate with a fine dot lattice and no floor, and a line of small print for what is drawn out of scale.",
  fits: "every scene",
  params: {
    note: {type: 'string', doc: "the plate's small print, low on the left: what is drawn out of scale"},
  },
  preview: 2,
};

export function Paper({note}: {note?: string}) {
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: C.paper}} />
      <div style={{position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${C.dot} 1.8px, transparent 2px)`, backgroundSize: '50px 50px'}} />
      {note && <div style={{position: 'absolute', left: 80, top: 846, fontFamily: MONO, fontSize: 26, color: C.read}}>{note}</div>}
    </>
  );
}
