export const meta = {
  name: {en: 'Date rail', 'zh-CN': '日期轨'},
  purpose: 'steps',
  line: 'A steel wire along the foot of the board with a dated clip under each source.',
  fits: 'the days of an event; the order the sources came in',
  params: {
    x: {type: 'px', doc: 'the rail\'s left end, in board pixels'},
    y: {type: 'px', doc: 'the rail\'s height on the board'},
    w: {type: 'px', doc: 'the rail\'s length'},
    stops: {type: 'list', doc: '[{at, date, label}]: `at` the board x of the clip (under its card), `date` in the mono face, `label` two to four words'},
    draw: {type: 'progress', default: 1, doc: '0 to 1: the wire is strung left to right; each clip appears as the wire reaches it'},
  },
  preview: 58.2,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));

export function DateRail({x, y, w, stops, draw = 1}: {x: number; y: number; w: number; stops: Array<{at: number; date: string; label: string}>; draw?: number}) {
  const d = unit(draw);
  const reach = x + w * d;
  return (
    <div style={{position: 'absolute', left: 0, top: 0}}>
      {/* the wire: a bright edge over a dark one, with its shadow on the felt */}
      <div style={{position: 'absolute', left: x, top: y + 6, width: w * d, height: 4, background: 'rgba(0, 0, 0, 0.5)', filter: 'blur(2px)'}} />
      <div style={{position: 'absolute', left: x, top: y, width: w * d, height: 4, borderRadius: 2, background: 'linear-gradient(180deg, var(--vt-text) 0%, var(--vt-muted) 100%)'}} />
      {stops.map((s, i) => {
        const on = unit((reach - s.at) / 80);
        if (on <= 0.001) return null;
        return (
          <div key={i} style={{position: 'absolute', left: s.at - 250, top: y - 14, width: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: on, transform: `translateY(${(8 * (1 - on)).toFixed(1)}px)`}}>
            {/* a small black clip on the wire */}
            <div style={{width: 20, height: 32, background: 'color-mix(in srgb, var(--vt-bg) 45%, black)', borderRadius: 3, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.6)', borderTop: '2px solid var(--vt-faint)'}} />
            <div style={{fontFamily: 'var(--vt-mono)', fontSize: 58, color: 'var(--vt-text)', marginTop: 16, letterSpacing: '0.04em', whiteSpace: 'nowrap'}}>{s.date}</div>
            <div style={{fontFamily: 'var(--vt-sans)', fontSize: 42, color: 'var(--vt-text)', opacity: 0.75, marginTop: 4, whiteSpace: 'nowrap'}}>{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}
