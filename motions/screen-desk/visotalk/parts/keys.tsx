export const meta = {
  name: {en: 'Keys', 'zh-CN': '按键'},
  purpose: 'term',
  line: 'White keycaps pressed down in turn as the shortcut is said, outside the camera.',
  fits: 'a shortcut: ⌘ , for settings, Ctrl C to stop, Return to run',
  params: {
    keys: {type: 'list', doc: 'the keys, in the order they are pressed: ["⌘", ","] or ["Ctrl", "C"]'},
    press: {type: 'progress', default: 0, doc: '0 to 1: the caps go down one after another, then come back up together'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the caps rise into view'},
  },
  preview: 9.6,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));

export function Keys({keys, press = 0, show = 1}: {keys: string[]; press?: number; show?: number}) {
  const s = unit(show);
  const p = unit(press);
  const n = keys.length;
  return (
    <div style={{display: 'flex', gap: 16, alignItems: 'flex-end', opacity: s, transform: `translateY(${(24 * (1 - s)).toFixed(1)}px)`}}>
      {keys.map((k, i) => {
        // each cap goes down in its own slice of the first 70%, and all come up in the last 30%
        const down = unit((p * 0.7 * n - i * 0.7) / 0.5) * (1 - unit((p - 0.72) / 0.28));
        const wide = k.length > 1;
        return (
          <div key={i} style={{position: 'relative', width: wide ? 132 : 92, height: 92}}>
            <div style={{position: 'absolute', inset: 0, top: 8, borderRadius: 18, background: '#CFCDC6'}} />
            <div style={{position: 'absolute', left: 0, right: 0, top: 6 * down, height: 86, borderRadius: 18, background: '#FFFFFF',
              boxShadow: `0 ${(2 + 8 * (1 - down)).toFixed(1)}px ${(6 + 10 * (1 - down)).toFixed(1)}px -4px rgba(38, 36, 30, 0.35), inset 0 -3px 0 rgba(38, 36, 30, 0.06)`,
              outline: down > 0.5 ? '3px solid var(--vt-data)' : 'none', outlineOffset: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--vt-sans)', fontSize: wide ? 30 : 42, fontWeight: 700, color: 'var(--vt-text)'}}>{k}</div>
          </div>
        );
      })}
    </div>
  );
}
