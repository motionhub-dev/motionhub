import {LENS, Plane, hazed, unit, useLook} from './stage.tsx';

export const meta = {
  name: {en: 'Mileposts into the depth', 'zh-CN': '纵深里程桩'},
  purpose: 'steps',
  line: 'Slender posts, each a date or a stage, one behind another into the haze; the camera dollies past them as they are counted.',
  fits: 'centuries passing, the stages of a journey, distances along a route, eras of a history',
  params: {
    items: {type: 'list', doc: 'the posts, nearest first: [{label: \'AD 500\', note: \'…\'}]'},
    z: {type: 'px', default: 600, doc: 'the depth of the nearest post'},
    step: {type: 'px', default: 900, doc: 'the depth between one post and the next'},
    foot: {type: 'px', default: 760, doc: 'where a post stands, down, at rest'},
    spread: {type: 'px', default: 380, doc: 'how far either side of the middle the posts stand, alternately'},
    shown: {type: 'number', default: 99, doc: 'how many posts stand, nearest first: tween it to raise them one by one'},
  },
  preview: 26.7,
};

type Item = {label: string; note?: string};

function Post({x, foot, label, note, rise, k}: {x: number; foot: number; label: string; note?: string; rise: number; k: number}) {
  const {fog, grow} = useLook();
  const h = 300;
  const up = unit(rise);
  const top = foot - h * up;
  // a label the camera is about to pass fades before it fills the frame
  const read = up * unit((1.45 - grow * k) / 0.3);
  // the post itself dissolves into the haze before its foot reaches the captions
  const stand = up * unit((1.55 - grow * k) / 0.25);
  // drawn at its true size for its depth, so the row of posts converges on the horizon
  return (
    <div style={{position: 'absolute', inset: 0, transform: `scale(${k.toFixed(4)})`, transformOrigin: '960px 540px'}}>
      <div style={{position: 'absolute', left: x - 3, top, width: 6, height: Math.max(0, foot + 6 - top), opacity: 0.9 * stand, background: hazed('var(--vt-text)', 0.25 + fog * 0.6)}} />
      <div style={{position: 'absolute', left: x - 9, top: top - 3, width: 18, height: 3, opacity: stand, background: hazed('var(--vt-data)', fog * 0.5)}} />
      <div style={{position: 'absolute', left: x - 400, top: top - 150, width: 800, textAlign: 'center', opacity: read}}>
        <div style={{fontFamily: 'var(--vt-display)', fontSize: 76, fontWeight: 400, lineHeight: 1, color: hazed('var(--vt-text)', fog * 0.6), whiteSpace: 'nowrap'}}>{label}</div>
        {note && <div style={{fontFamily: 'var(--vt-sans)', fontSize: 40, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 12, opacity: unit((grow * k - 0.62) / 0.2), color: hazed('var(--vt-muted)', fog * 0.6), whiteSpace: 'nowrap'}}>{note}</div>}
      </div>
    </div>
  );
}

export function Mileposts({items, z = 600, step = 900, foot = 760, spread = 380, shown = 99}: {
  items: Item[]; z?: number; step?: number; foot?: number; spread?: number; shown?: number;
}) {
  return (
    <>
      {items.map((it, i) => (
        <Plane key={i} z={z + i * step}>
          <Post x={960 + (i % 2 ? spread : -spread)} foot={foot} label={it.label} note={it.note} rise={unit(shown - i)} k={(LENS + z) / (LENS + z + i * step)} />
        </Plane>
      ))}
    </>
  );
}
