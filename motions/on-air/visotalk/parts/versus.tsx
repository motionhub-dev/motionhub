import {eyebrow, stage, tag, wipe} from './ink.ts';

export const meta = {
  name: {en: 'Versus', 'zh-CN': '对垒牌'},
  purpose: 'compare',
  line: 'Two tags across a small "vs"; when the speaker decides, the winner takes the teal edge.',
  fits: 'two products weighed; before and after; the old way and the new',
  params: {
    a: {type: 'text', doc: 'the left one, a few words'},
    b: {type: 'text', doc: 'the right one, a few words'},
    aNote: {type: 'text', default: '', doc: 'one line over the left: a kind, a price, a year'},
    bNote: {type: 'text', default: '', doc: 'one line over the right'},
    winner: {type: 'text', default: '', doc: '"a", "b", or empty when the speaker does not choose'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the left tag opens, then the right'},
    decide: {type: 'progress', default: 0, doc: '0 to 1: the winner\'s edge draws and the other dims'},
    width: {type: 'px', default: 1100, doc: 'both tags together'},
  },
  preview: 44.2,
};

function Side({title, note, open, edge, dim}: {title: string; note: string; open: number; edge: number; dim: boolean}) {
  return (
    <div style={{...tag, ...wipe(open), flex: 1, minWidth: 0, position: 'relative', padding: '20px 28px 24px', boxSizing: 'border-box', opacity: dim ? 0.55 : 1}}>
      <div style={{position: 'absolute', left: 0, top: 0, height: 6, width: `${(100 * edge).toFixed(1)}%`, background: 'var(--vt-data)', borderRadius: '4px 4px 0 0'}} />
      {note && <div style={{...eyebrow, color: edge > 0 ? 'var(--vt-data)' : 'var(--vt-muted)', marginBottom: 8}}>{note}</div>}
      <div style={{fontFamily: 'var(--vt-sans)', fontSize: 48, fontWeight: 700, lineHeight: 1.15, color: dim ? 'var(--vt-muted)' : 'var(--vt-text)'}}>{title}</div>
    </div>
  );
}

export function Versus({a, b, aNote = '', bNote = '', winner = '', show = 1, decide = 0, width = 1100}: {a: string; b: string; aNote?: string; bNote?: string; winner?: string; show?: number; decide?: number; width?: number}) {
  const left = stage(show, 0, 0.6), right = stage(show, 0.35, 1), vs = stage(show, 0.3, 0.6), d = stage(decide, 0, 1);
  return (
    <div style={{width, display: 'flex', alignItems: 'stretch', gap: 18}}>
      <Side title={a} note={aNote} open={left} edge={winner === 'a' ? d : 0} dim={winner === 'b' && d > 0.5} />
      <div style={{alignSelf: 'center', fontFamily: 'var(--vt-mono)', fontSize: 28, fontWeight: 700, color: 'var(--vt-muted)', opacity: vs, letterSpacing: '0.08em'}}>VS</div>
      <Side title={b} note={bNote} open={right} edge={winner === 'b' ? d : 0} dim={winner === 'a' && d > 0.5} />
    </div>
  );
}
