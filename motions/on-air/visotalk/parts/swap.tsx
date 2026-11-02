import {stage, tag} from './ink.ts';

export const meta = {
  name: {en: 'Swap', 'zh-CN': '划改'},
  purpose: 'compare',
  line: 'What one would assume, struck through, and what is true written after it in teal.',
  fits: 'a "looks the same, but" turn; a belief corrected; an old price replaced',
  params: {
    from: {type: 'text', doc: 'what is assumed'},
    to: {type: 'text', doc: 'what is so'},
    strike: {type: 'progress', default: 0, doc: '0 to 1: the line runs through the first'},
    turn: {type: 'progress', default: 0, doc: '0 to 1: the second is written out beside it'},
  },
  preview: 16.5,
};

export function Swap({from, to, strike = 0, turn = 0}: {from: string; to: string; strike?: number; turn?: number}) {
  const s = stage(strike, 0, 1), t = stage(turn, 0, 1);
  const word = {fontFamily: 'var(--vt-sans)', fontSize: 48, fontWeight: 700, whiteSpace: 'nowrap'} as const;
  return (
    <div style={{...tag, display: 'inline-flex', alignItems: 'center', gap: 22, padding: '16px 28px'}}>
      <span style={{...word, position: 'relative', color: t > 0 ? 'var(--vt-muted)' : 'var(--vt-text)'}}>
        {from}
        <span style={{position: 'absolute', left: -4, top: '52%', height: 5, width: `calc(${(100 * s).toFixed(1)}% + 8px)`, background: 'var(--vt-bad)'}} />
      </span>
      {t > 0 && <span style={{...word, color: 'var(--vt-data)'}}>→ {to.slice(0, Math.ceil(t * to.length))}</span>}
    </div>
  );
}
