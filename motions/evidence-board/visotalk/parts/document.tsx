import React from 'react';

export const meta = {
  name: {en: 'Document', 'zh-CN': '原始文件'},
  purpose: 'quote',
  line: 'The source in its own words, timestamped rows for a transcript; the line that matters is highlighted as it is said.',
  fits: 'a transcript line, a report\'s sentence, a clause of a law; quoted exactly, cut with …',
  params: {
    issuer: {type: 'text', doc: 'who issued it, small capitals: "National Aeronautics and Space Administration"'},
    title: {type: 'text', doc: 'its title, as printed: "Report of Apollo 13 Review Board"'},
    rows: {type: 'list', doc: 'the text: [{at?, by?, text}]; `at` a timestamp or item letter in the mono face, `by` a speaker; wrap the words to mark in [[ and ]]'},
    mark: {type: 'number', default: 0, doc: '0 to the number of marked passages: from 0 to 1 the highlighter sweeps the first passage at a hand\'s pace, from 1 to 2 the second; tween one step over 0.6 to 1.2 s on the words it marks'},
    size: {type: 'px', default: 30, doc: 'the body size in board pixels: 28 to 34, read pushed in at zoom 1.5 or more'},
  },
  preview: 14.8,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));

type Row = {at?: string; by?: string; text: string};
type Piece = {text: string; pass: number};

/** Split a row into plain text (pass -1) and its marked passages, [[like this]], numbered from `first` in reading order */
function pieces(text: string, first: number): Piece[] {
  const out: Piece[] = [];
  const re = /\[\[(.+?)\]\]/g;
  let last = 0, n = first, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({text: text.slice(last, m.index), pass: -1});
    out.push({text: m[1], pass: n++});
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({text: text.slice(last), pass: -1});
  return out;
}

/** One marked word with the space after it: the highlighter laid behind it, left to right, as far as `fill`; the words of a passage abut into one stroke */
function Marked({word, fill, first, last}: {word: string; fill: number; first: boolean; last: boolean}) {
  const f = unit(fill);
  return (
    <span style={{position: 'relative'}}>
      {f > 0.001 && (
        <span style={{position: 'absolute', left: first ? '-0.1em' : '-3px', top: '0.1em', height: '1.02em', width: `calc(${(f * 100).toFixed(1)}% + ${last ? (0.12 * f).toFixed(3) + 'em' : '3px'})`,
          background: 'var(--vt-data)', borderRadius: `${first ? '0.14em' : '0'} ${last && f > 0.99 ? '0.2em' : '0'} ${last && f > 0.99 ? '0.12em' : '0'} ${first ? '0.1em' : '0'}`}} />
      )}
      <span style={{position: 'relative'}}>{word}</span>
      {/* the highlighter itself, its chisel tip on the stroke's front edge while it moves */}
      {f > 0.001 && f < 0.999 && (
        <span style={{position: 'absolute', left: `calc(${(f * 100).toFixed(1)}% - 0.08em)`, top: '-1.35em', width: '0.62em', height: '2.5em', transformOrigin: '50% 100%', transform: 'rotate(28deg)',
          background: 'linear-gradient(180deg, #3A3936 0%, #2A2927 72%, var(--vt-data) 72%, var(--vt-data) 100%)', borderRadius: '0.12em 0.12em 0.02em 0.22em', boxShadow: '0.12em 0.18em 0.3em rgba(0, 0, 0, 0.35)'}} />
      )}
    </span>
  );
}

export function Document({issuer, title, rows, mark = 0, size = 30}: {issuer: string; title: string; rows: Row[]; mark?: number; size?: number}) {
  // number the passages through the whole document, and count each one's words, so each sweep runs through them at one pace
  let count = 0;
  const parsed = rows.map((r) => { const ps = pieces(r.text, count); count += ps.filter((p) => p.pass >= 0).length; return ps; });
  const total: number[] = Array(count).fill(0), seen: number[] = Array(count).fill(0);
  for (const ps of parsed) for (const p of ps) if (p.pass >= 0) total[p.pass] += (p.text.match(/\S+\s*/g) ?? []).length;
  const hasTimes = rows.some((r) => r.at);
  return (
    <div style={{padding: '46px 48px 54px', fontFamily: 'var(--vt-display)', color: 'var(--vt-bg)'}}>
      <div style={{fontFamily: 'var(--vt-sans)', fontSize: 17, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.62}}>{issuer}</div>
      <div style={{fontSize: size * 1.35, fontWeight: 600, lineHeight: 1.12, marginTop: 10, letterSpacing: '-0.01em'}}>{title}</div>
      <div style={{height: 2, background: 'var(--vt-bg)', opacity: 0.8, margin: '20px 0 24px'}} />
      <div style={{display: 'grid', gridTemplateColumns: hasTimes ? 'max-content max-content 1fr' : '1fr', columnGap: 18, rowGap: size * 0.55, alignItems: 'baseline'}}>
        {rows.map((r, i) => (
          <React.Fragment key={i}>
            {hasTimes && (r.at || r.by) && <span style={{fontFamily: 'var(--vt-mono)', fontSize: size * 0.68, opacity: 0.6}}>{r.at ?? ''}</span>}
            {hasTimes && (r.at || r.by) && <span style={{fontFamily: 'var(--vt-sans)', fontSize: size * 0.62, fontWeight: 700, letterSpacing: '0.08em', opacity: 0.7}}>{r.by ?? ''}</span>}
            <span style={{fontSize: size, lineHeight: 1.42, gridColumn: hasTimes && !(r.at || r.by) ? '1 / -1' : undefined}}>
              {parsed[i].map((p, j) => p.pass < 0 ? <React.Fragment key={j}>{p.text}</React.Fragment> : (
                <React.Fragment key={j}>
                  {/* a word and the space after it are one stroke, so the mark runs on across a phrase */}
                  {(p.text.match(/\s*\S+\s*/g) ?? []).map((w, k) => {
                    const n = seen[p.pass]++;
                    const fill = (mark - p.pass) * total[p.pass] - n;
                    return <Marked key={k} word={w} fill={fill} first={n === 0} last={n === total[p.pass] - 1} />;
                  })}
                </React.Fragment>
              ))}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
