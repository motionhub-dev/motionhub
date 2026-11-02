// The notebook's three pens, by what they mean: ink for what is drawn and said, red for the result that matters, pencil for working and asides.
export type Pen = 'ink' | 'red' | 'pencil';
export const PEN: Record<Pen, string> = {ink: 'var(--vt-text)', red: 'var(--vt-grad)', pencil: 'var(--vt-muted)'};

/** 0 to 1, whatever is passed */
export const unit = (v: number) => Math.max(0, Math.min(1, v));

/** Props for an SVG path drawn by `draw` (0 to 1 of its length): the length is normalised, so any path works without measuring it */
export const drawn = (draw: number) => ({pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - unit(draw)});
