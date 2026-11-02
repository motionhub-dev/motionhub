// The material of On Air: solid ink tags over someone else's picture. A tag is opaque enough to read on any shot and small enough to leave the shot be.
export const unit = (v: number) => Math.max(0, Math.min(1, v));
/** The part of a 0–1 progress that falls between `a` and `b`, eased out: one stage of a component's entrance */
export const stage = (p: number, a: number, b: number) => {
  const t = unit((p - a) / (b - a));
  return 1 - (1 - t) ** 3;
};
/** A tag's ground: ink, nearly opaque, with a short shadow so it sits on the footage rather than in it */
export const tag = {
  background: 'color-mix(in srgb, var(--vt-panel) 90%, transparent)',
  borderRadius: 4,
  boxShadow: '0 12px 28px -14px rgba(0, 0, 0, 0.85)',
} as const;
/** The small spaced label over a tag's main line */
export const eyebrow = {fontFamily: 'var(--vt-mono)', fontSize: 26, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--vt-data)'} as const;
/** A wipe that uncovers its content from the left as `p` goes from 0 to 1 */
export const wipe = (p: number) => ({clipPath: `inset(-40px ${(100 * (1 - unit(p))).toFixed(2)}% -40px -40px)`});
