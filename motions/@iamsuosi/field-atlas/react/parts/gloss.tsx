// A name explained, the way a gazetteer explains it: the name in the serif's italic, where the word comes from in spaced capitals under a
// hairline, and what it means, set after a beat so the meaning lands on its own word. A hairline leader can tie it to its place.
import React from 'react';
import {useView, unit} from './geo.ts';

export const meta = {
  name: {en: 'Gloss', 'zh-CN': '地名释义'},
  purpose: 'term',
  line: 'A gazetteer entry on a paper card: a name in italic serif, its origin in spaced capitals, then its meaning on its own beat, with a leader to the place.',
  fits: 'what a place name means (a desert, a river, a strait); a term of geography the narration defines (watershed, isthmus, monsoon)',
  params: {
    word: {type: 'text', doc: 'the name or term, as the map prints it'},
    origin: {type: 'text', doc: 'optional: where the word comes from, a few words (Latin nullus arbor)'},
    meaning: {type: 'text', doc: 'what it means, one short line'},
    x: {type: 'px', default: 1340, doc: 'its left edge'},
    y: {type: 'px', default: 560, doc: 'its top'},
    lon: {type: 'degrees', doc: 'optional: the place the leader points to'},
    lat: {type: 'degrees', doc: 'optional: the place the leader points to'},
    show: {type: 'progress', default: 0, doc: '0 to 1: the name and origin arrive in the first half, the meaning in the second; give it the stretch between the name and its meaning'},
  },
  preview: 17.0,
};

const WIDTH = 480;

export function Gloss({word, origin, meaning, x = 1340, y = 560, lon, lat, show = 0}: {
  word: string; origin?: string; meaning: string; x?: number; y?: number; lon?: number; lat?: number; show?: number;
}) {
  const view = useView();
  const s = unit(show / 0.45), m = unit((show - 0.55) / 0.4);
  if (s <= 0.01) return null;
  let leader: React.ReactNode = null;
  if (lon !== undefined && lat !== undefined) {
    const [px, py, vis] = view.at(lon, lat);
    // from the card's nearer side to the place, drawn out with the card
    const sx = px < x ? x : x + WIDTH, sy = y + 52;
    if (vis) leader = (
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: s}}>
        <path d={`M${sx} ${sy} L${sx + (px - sx) * s} ${sy + (py - sy) * s}`} stroke="var(--color-text)" strokeWidth={1.5} fill="none" />
        <circle cx={px} cy={py} r={4.5 * s} fill="var(--color-text)" />
      </svg>
    );
  }
  return (
    <>
      {leader}
      <div style={{position: 'absolute', left: x, top: y, width: WIDTH, boxSizing: 'border-box', padding: '20px 28px 24px', background: 'color-mix(in srgb, var(--color-panel) 94%, transparent)', boxShadow: '0 1px 2px rgba(34, 38, 43, 0.16)', opacity: s, transform: `translateY(${(1 - s) * 10}px)`, color: 'var(--color-text)'}}>
        <div style={{fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 64, fontWeight: 500, lineHeight: 1.05, letterSpacing: '-0.005em'}}>{word}</div>
        <div style={{height: 1.5, background: 'var(--color-text)', marginTop: 14, transform: `scaleX(${s})`, transformOrigin: 'left'}} />
        {origin && <div style={{fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 600, letterSpacing: '0.12em', whiteSpace: 'nowrap', textTransform: 'uppercase', color: 'var(--color-muted)', marginTop: 14}}>{origin}</div>}
        <div style={{fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 500, lineHeight: 1.15, marginTop: 12, opacity: m, transform: `translateY(${(1 - m) * 6}px)`}}>
          ‘{meaning}’
        </div>
      </div>
    </>
  );
}
