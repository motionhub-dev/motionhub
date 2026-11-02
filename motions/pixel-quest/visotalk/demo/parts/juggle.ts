// The cascade both demo parts draw: where each ball is at a moment. Throw j leaves from hand j % 2 every beat; ball i makes throws i, i + n,
// i + 2n…, so it always leaves from the hand it landed in. In the air: `across` 0 to 1 from the throwing hand to the catching one, `up` the
// arc's height. In a hand: `dwell` 0 to 1, carried from where it was caught (outside) to where it is thrown (inside), so paths cross.
export const BEAT = 0.5;

export type Ball = {from: 0 | 1; across: number; up: number; dwell: number; held: boolean};

export function ballAt(i: number, n: number, t: number): Ball {
  const flight = n === 1 ? 0.8 : n - 0.55;          // in beats
  const b = t / BEAT;
  if (b < i) return {from: (i % 2) as 0 | 1, across: 0, up: 0, dwell: 1, held: true};   // still in the hand, waiting for its first throw
  const k = Math.floor((b - i) / n);                 // its last throw
  const since = b - (i + k * n);
  const from = (((i + k * n) % 2) + 2) % 2 as 0 | 1;
  if (since < flight) {
    const u = since / flight;
    return {from, across: u, up: 4 * u * (1 - u), dwell: 0, held: false};
  }
  const d = (since - flight) / Math.max(0.2, n - flight);
  return {from: (1 - from) as 0 | 1, across: 0, up: -0.06 * Math.sin(d * Math.PI), dwell: d, held: true};
}
