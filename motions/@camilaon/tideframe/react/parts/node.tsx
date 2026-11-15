export const meta = {
  name: {en: 'Node', 'zh-CN': '节点'},
  purpose: 'mark',
  line: 'A tile on the schematic: an index, a pip, a name, a role and a load bar. Live is green.',
  fits: 'a service, a queue, a region, a model, a stage of a pipeline',
  params: {
    index: {type: 'text', doc: 'a short index: 01'},
    name: {type: 'text', doc: 'the tile\'s name'},
    role: {type: 'text', default: '', doc: 'what it does, one short line'},
    live: {type: 'boolean', default: false, doc: 'the tile the sentence is about: green pip, green edge, green load'},
    load: {type: 'progress', default: 0, doc: 'how full the load bar is, 0 to 1'},
    arrive: {type: 'progress', default: 1, doc: '0 off to the right, 1 in place'},
    width: {type: 'px', default: 320, doc: 'the tile\'s width'},
  },
  preview: 4.2,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));

export function Node({index, name, role = '', live = false, load = 0, arrive = 1, width = 320}: {index: string; name: string; role?: string; live?: boolean; load?: number; arrive?: number; width?: number}) {
  const a = unit(arrive);
  const fill = unit(load);
  return (
    <div style={{width, boxSizing: 'border-box', padding: '18px 22px 16px', borderRadius: 16, background: 'var(--color-panel2)', border: `1.5px solid ${live ? 'var(--color-data)' : 'var(--color-border)'}`, color: 'var(--color-text)', opacity: a, transform: `translateX(${((1 - a) * 28).toFixed(1)}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{fontFamily: 'var(--font-mono)', fontSize: 16, letterSpacing: '0.16em', color: live ? 'var(--color-data)' : 'var(--color-grad)'}}>{index}</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <span style={{width: 10, height: 10, borderRadius: 5, background: live ? 'var(--color-data)' : 'var(--color-faint)', boxShadow: live ? '0 0 0 5px color-mix(in srgb, var(--color-data) 28%, transparent)' : 'none'}} />
          <span style={{fontFamily: 'var(--font-mono)', fontSize: 14, letterSpacing: '0.14em', textTransform: 'uppercase', color: live ? 'var(--color-data)' : 'var(--color-muted)'}}>{live ? 'live' : 'idle'}</span>
        </div>
      </div>
      <div style={{marginTop: 12, fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 40, letterSpacing: '-0.03em', lineHeight: 1}}>{name}</div>
      {role && <div style={{marginTop: 6, fontFamily: 'var(--font-sans)', fontSize: 22, color: 'var(--color-muted)'}}>{role}</div>}
      <div style={{marginTop: 16, height: 3, borderRadius: 2, background: 'var(--color-faint)'}}>
        <div style={{height: 3, width: `${(fill * 100).toFixed(1)}%`, borderRadius: 2, background: live ? 'var(--color-data)' : 'var(--color-border)'}} />
      </div>
    </div>
  );
}
