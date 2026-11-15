export const meta = {
  name: {en: 'Stages', 'zh-CN': '阶段'},
  purpose: 'steps',
  line: 'Named stages in a row. The current one is underlined in green; connectors fill as the line moves on.',
  fits: 'the steps of a request, a deploy or a job, in order',
  params: {
    items: {type: 'text[]', doc: 'the stage names, in order'},
    shown: {type: 'number', default: null, doc: 'how many stages have arrived; all of them without one'},
    current: {type: 'number', default: -1, doc: 'the stage underlined in green, counting from 0'},
    width: {type: 'px', default: 1500, doc: 'the row\'s width'},
  },
  preview: 15.2,
};

export function Stages({items, shown = null, current = -1, width = 1500}: {items: string[]; shown?: number | null; current?: number; width?: number}) {
  const n = shown == null ? items.length : Math.max(0, Math.min(items.length, Math.floor(shown)));
  return (
    <div style={{width, display: 'flex', alignItems: 'flex-end'}}>
      {items.map((label, i) => {
        const on = i < n;
        const here = i === current;
        return (
          <div key={label} style={{display: 'flex', alignItems: 'flex-end', flex: i < items.length - 1 ? 1 : '0 0 auto', minWidth: 0}}>
            <div style={{opacity: on ? 1 : 0.28, transform: `translateY(${on ? 0 : 10}px)`}}>
              <div style={{fontFamily: 'var(--font-mono)', fontSize: 16, letterSpacing: '0.16em', color: here ? 'var(--color-data)' : 'var(--color-grad)'}}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{marginTop: 8, fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 40, letterSpacing: '-0.03em', color: 'var(--color-text)', whiteSpace: 'nowrap'}}>{label}</div>
              <div style={{marginTop: 12, height: 3, width: here ? 72 : 28, borderRadius: 2, background: here ? 'var(--color-data)' : 'transparent'}} />
            </div>
            {i < items.length - 1 && (
              <div style={{flex: 1, height: 2, margin: '0 18px 1px', background: 'var(--color-faint)', position: 'relative'}}>
                <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: i < current ? '100%' : '0%', background: 'var(--color-grad)'}} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
