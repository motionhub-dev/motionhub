import {seededRandom} from '@motionhub/runtime';

// The notebook's three pens, by what they mean: ink for what is drawn and said, red for the result that matters, pencil for working and asides.
export type Pen = 'ink' | 'red' | 'pencil';
export const PEN: Record<Pen, string> = {ink: 'var(--color-text)', red: 'var(--color-grad)', pencil: 'var(--color-muted)'};

/** 0 to 1, whatever is passed */
export const unit = (v: number) => Math.max(0, Math.min(1, v));

/** Props for an SVG path drawn by `draw` (0 to 1 of its length): the length is normalised, so any path works without measuring it */
export const drawn = (draw: number) => ({pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - unit(draw)});

/** Style for words written left to right by `write` (0 to 1): nothing shows at 0. Give it to an element as wide as its words, so the time goes on the words. */
export const written = (write: number) => (write <= 0 ? {visibility: 'hidden' as const} : {clipPath: `inset(-25% ${((1 - unit(write)) * 100).toFixed(1)}% -25% -4%)`});

/** A line's width in the hand, in ems, a little generous: Shantell Sans is wide in its figures and capitals */
export function ems(text: string) {
  return [...String(text)].reduce((sum, c) => sum + (c.codePointAt(0)! > 0x2e7f ? 1 : c === ' ' ? 0.32 : c === '%' ? 1 : /[0-9]/.test(c) ? 0.68 : /[A-Z]/.test(c) ? 0.72 : 0.6), 0);
}

/** The size at which a line of the hand fits `width`, never above `size`: the same part carries a short word or a long phrase, in any script. A line too long grows small, not off the page. */
export const fit = (text: string, width: number, size: number) => Math.min(size, width / (ems(text) || 1));

/** A rectangle as a hand draws it, a little out of true; the seed keeps it the same in every frame and engine */
export function handBox(x: number, y: number, w: number, h: number, seed: string | number) {
  const r = seededRandom(seed), j = () => (r() - 0.5) * 5;
  return `M${(x + j()).toFixed(1)} ${(y + j()).toFixed(1)} L${(x + w + j()).toFixed(1)} ${(y + j()).toFixed(1)} L${(x + w + j()).toFixed(1)} ${(y + h + j()).toFixed(1)} L${(x + j()).toFixed(1)} ${(y + h + j()).toFixed(1)} Z`;
}
