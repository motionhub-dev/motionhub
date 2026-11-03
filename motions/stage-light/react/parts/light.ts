// How lit a thing is: 1 is in the light, 0 in the shadow. Things out of the light keep their shape and lose their colour and contrast.
export const unit = (v: number) => Math.max(0, Math.min(1, v));

/** Styles for something at `lit`: dimmer and greyer as it leaves the light */
export const litStyle = (lit: number) => {
  const l = unit(lit);
  return {opacity: 0.38 + 0.62 * l, filter: `saturate(${(0.15 + 0.85 * l).toFixed(2)})`};
};
