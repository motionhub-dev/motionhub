export const meta = {
  name: {en: 'Split', 'zh-CN': '对照'},
  purpose: 'compare',
  line: 'Two figures on one baseline: the one left behind in mute, the one that matters in green.',
  fits: 'before and after; a target against a reading; two regions, one of them the point',
  params: {
    beforeLabel: {type: 'text', doc: 'the kicker of the figure being left behind'},
    before: {type: 'text', doc: 'that figure, already formatted'},
    nowLabel: {type: 'text', doc: 'the kicker of the figure that matters'},
    now: {type: 'text', doc: 'that figure; pass it as it counts'},
    unit: {type: 'text', default: '', doc: 'after each figure: ms, %, req'},
    width: {type: 'px', default: 760, doc: 'the pair\'s width'},
  },
  preview: 12,
};

export function Split({beforeLabel, before, nowLabel, now, unit = '', width = 760}: {beforeLabel: string; before: string; nowLabel: string; now: string; unit?: string; width?: number}) {
  const figure = (label: string, value: string, live: boolean) => (
    <div>
      <div style={{fontFamily: 'var(--font-mono)', fontSize: 18, letterSpacing: '0.16em', textTransform: 'uppercase', color: live ? 'var(--color-data)' : 'var(--color-muted)'}}>{label}</div>
      <div style={{marginTop: 10, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 112, lineHeight: 0.9, letterSpacing: '-0.045em', fontVariantNumeric: 'tabular-nums', color: live ? 'var(--color-text)' : 'var(--color-muted)'}}>
        {value}
        {unit && <span style={{marginLeft: 10, fontSize: 32, letterSpacing: '0.02em', color: live ? 'var(--color-data)' : 'var(--color-faint)'}}>{unit}</span>}
      </div>
    </div>
  );
  return (
    <div style={{width, display: 'grid', gridTemplateColumns: '1fr 1px 1fr', columnGap: 36, alignItems: 'end'}}>
      {figure(beforeLabel, before, false)}
      <div style={{height: 132, background: 'var(--color-border)'}} />
      {figure(nowLabel, now, true)}
    </div>
  );
}
