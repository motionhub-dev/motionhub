// A figure in the map's margin, the way an atlas annotates a plate: a large serif number that counts to its value, its unit, a line saying
// what it measures, and an optional hairline leader to the place it is about. A second figure beside it is the comparison.
import React from 'react';
import {useView, unit} from './geo.ts';

export const meta = {
  name: {en: 'Margin note', 'zh-CN': '边注数字'},
  purpose: 'data',
  line: 'A figure in the margin: a large serif number counting up, its unit and what it measures, with a leader to its place.',
  fits: 'a distance, a duration, a population or a date about a place; a pair that contrasts (usual against this one)',
  params: {
    value: {type: 'number', doc: 'the figure now: tween it from 0 to count up'},
    digits: {type: 'number', default: 0, doc: 'decimal places shown'},
    unit: {type: 'text', doc: 'the unit, after the number'},
    label: {type: 'text', doc: 'what it measures, one short line'},
    x: {type: 'px', default: 120, doc: 'its left edge'},
    y: {type: 'px', default: 420, doc: 'its top'},
    lon: {type: 'degrees', doc: 'optional: the place the leader points to'},
    lat: {type: 'degrees', doc: 'optional: the place the leader points to'},
    accent: {type: 'boolean', default: false, doc: 'the figure that matters, in red; the other stays ink'},
    show: {type: 'progress', default: 0, doc: 'its entrance'},
  },
  preview: 34.5,
};

export function Note({value, digits = 0, unit: u, label, x = 120, y = 420, lon, lat, accent = false, show = 0}: {
  value: number; digits?: number; unit?: string; label: string; x?: number; y?: number; lon?: number; lat?: number; accent?: boolean; show?: number;
}) {
  const view = useView();
  const s = unit(show);
  if (s <= 0.01) return null;
  const shown = value.toLocaleString('en-US', {minimumFractionDigits: digits, maximumFractionDigits: digits});
  let leader: React.ReactNode = null;
  if (lon !== undefined && lat !== undefined) {
    const [px, py, vis] = view.at(lon, lat);
    if (vis) leader = (
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: s}}>
        <path d={`M${x + 360} ${y + 64} L${x + 360 + (px - x - 360) * s} ${y + 64 + (py - y - 64) * s}`} stroke="var(--vt-text)" strokeWidth={1.5} fill="none" />
      </svg>
    );
  }
  return (
    <>
      {leader}
      <div style={{position: 'absolute', left: x, top: y, width: 340, padding: '18px 26px 22px', background: 'color-mix(in srgb, var(--vt-panel) 93%, transparent)', boxShadow: '0 1px 2px rgba(34, 38, 43, 0.16)', borderLeft: `4px solid ${accent ? 'var(--vt-data)' : 'var(--vt-text)'}`, opacity: unit(s / 0.4), transform: `translateY(${(1 - s) * 10}px)`, fontFamily: 'var(--vt-sans)', color: 'var(--vt-text)'}}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 12, whiteSpace: 'nowrap'}}>
          <span style={{fontFamily: 'var(--vt-display)', fontSize: 104, lineHeight: 1, fontWeight: 500, color: accent ? 'var(--vt-data)' : 'var(--vt-text)', fontVariantNumeric: 'tabular-nums lining-nums'}}>{shown}</span>
          {u && <span style={{fontSize: 34, fontWeight: 600}}>{u}</span>}
        </div>
        <div style={{fontSize: 28, lineHeight: 1.25, marginTop: 10, color: 'var(--vt-muted)'}}>{label}</div>
      </div>
    </>
  );
}
