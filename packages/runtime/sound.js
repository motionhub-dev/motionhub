// @motionhub/runtime/sound: a motion's sound, synthesised. A motion describes how its world sounds in react/sound.json (a
// rhythmic bed and a voice for each kind of thing that happens: something lands, moves, draws, counts, cuts or leaves), and
// a reel lists when those things happen (`export const cues`). `renderSound` turns the two into samples, the same every time,
// in any JavaScript engine: a player plays them, a renderer can write them to a file. No React, no Web Audio, no files.

/** The roles a cue can have: what happened in the picture */
export const ROLES = ['land', 'move', 'draw', 'count', 'cut', 'out'];
/** The voices a role can be drawn with, and the instruments a bed can use */
export const VOICES = ['click', 'thump', 'tone', 'pluck', 'swish', 'scratch', 'chime', 'marimba', 'square', 'squares', 'swell', 'keys', 'noise'];
export const KIT = ['kick', 'hat', 'rim', 'bass', 'arp', 'pluck', 'chip', 'pad', 'room'];

const mulberry = (seed) => () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** A synthesiser at `rate` samples a second, with its own seeded noise */
function synth(rate, seed = 7) {
  const rand = mulberry(seed);
  const gauss = () => { let u = 0; while (!u) u = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand()); };
  const n = (s) => Math.max(1, Math.round(s * rate));

  // RBJ biquads, run twice for a steeper slope
  const biquad = (x, type, f) => {
    const w = (2 * Math.PI * Math.min(f, rate * 0.45)) / rate, c = Math.cos(w), a = Math.sin(w) / (2 * Math.SQRT1_2);
    const [b0, b1, b2] = type === 'low' ? [(1 - c) / 2, 1 - c, (1 - c) / 2] : [(1 + c) / 2, -(1 + c), (1 + c) / 2];
    const a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
    const y = new Float32Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
    }
    return y;
  };
  const band = (x, lo, hi) => biquad(biquad(biquad(biquad(x, 'high', lo), 'high', lo), 'low', hi), 'low', hi);
  const noise = (s) => Float32Array.from({length: n(s)}, gauss);
  const env = (len, attack = 0.002, decay = 0.2, curve = 4) => Float32Array.from({length: len}, (_, i) => {
    const t = i / rate;
    return Math.min(1, t / Math.max(attack, 1e-4)) * Math.exp((-curve * t) / Math.max(decay, 1e-4));
  });
  const mul = (x, y) => x.map((v, i) => v * (typeof y === 'number' ? y : y[i] ?? 0));
  const shape = (len, f) => Float32Array.from({length: len}, (_, i) => f(i / Math.max(1, len - 1)));

  const tone = (freq, s, partials = [[1, 1]], decay = 0.6, attack = 0.003, glide = 0) => {
    const len = n(s), out = new Float32Array(len), e = env(len, attack, s * 4, 0);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / rate;
      phase += (2 * Math.PI * freq * (1 - glide * Math.min(t / s, 1))) / rate;
      let v = 0;
      for (const [r, g] of partials) v += g * Math.sin(r * phase) * Math.exp((-t * r) / Math.max(decay, 1e-3));
      out[i] = v * e[i];
    }
    return out;
  };
  const V = {
    click: ({lo = 2000, hi = 8000, len = 0.025}) => { const x = band(noise(len), lo, hi); return mul(x, env(x.length, 0.0005, len * 0.4)); },
    thump: ({freq = 70, len = 0.35, drop = 0.5}) => tone(freq, len, [[1, 1], [2, 0.15]], len * 0.5, 0.001, drop),
    tone: ({freq = 440, len = 0.2, decay = 0.08, partials = [[1, 1], [2, 0.3]]}) => tone(freq, len, partials, decay, 0.0005),
    pluck: ({freq = 440, len = 0.9, bright = 0.5}) => {
      const len_ = n(len), period = Math.max(2, Math.round(rate / freq)), buf = Float32Array.from({length: period}, () => (rand() * 2 - 1) * bright + (rand() * 2 - 1) * (1 - bright) * 0.3);
      const out = new Float32Array(len_);
      for (let i = 0; i < len_; i++) { const k = i % period; out[i] = buf[k]; buf[k] = 0.4985 * (buf[k] + buf[(k + 1) % period]); }
      return out;
    },
    swish: ({lo = 300, hi = 3000, rise = 0.5}, dur) => { const x = band(noise(Math.max(dur, 0.25)), lo, hi); return mul(x, shape(x.length, (t) => (t < rise ? t / rise : (1 - t) / (1 - rise)) ** 1.6)); },
    scratch: ({lo = 1800, hi = 6000}, dur) => {
      const x = band(noise(Math.max(dur, 0.25)), lo, hi);
      let ph = 0;
      return x.map((v, i) => { ph += (2 * Math.PI * (18 + rand() * 22)) / rate; const t = i / x.length; return v * (0.55 + 0.45 * Math.abs(Math.sin(ph))) * Math.min(1, Math.min(t, 1 - t) * 12); });
    },
    chime: ({freq = 1046, len = 1.2}) => tone(freq, len, [[1, 1], [2.76, 0.4], [5.4, 0.2], [8.9, 0.08]], len * 0.45),
    marimba: ({freq = 392, len = 0.6}) => tone(freq, len, [[1, 1], [4, 0.25], [9.2, 0.06]], len * 0.35, 0.001),
    square: ({freq = 880, len = 0.08}) => { const l = n(len), e = env(l, 0.001, len, 2); return Float32Array.from({length: l}, (_, i) => Math.sign(Math.sin((2 * Math.PI * freq * i) / rate)) * e[i] * 0.5); },
    squares: ({freqs = [440, 554, 659], len = 0.06}) => concat(freqs.map((freq) => V.square({freq, len}))),
    swell: ({freq = 110}, dur) => {
      const s = Math.max(dur, 0.6), l = n(s), ph = [rand(), rand(), rand(), rand()].map((v) => v * 6);
      return Float32Array.from({length: l}, (_, i) => {
        const t = i / rate;
        const v = [[1, 1], [1.5, 0.5], [2, 0.35], [3, 0.12]].reduce((a, [r, g], k) => a + Math.sin(2 * Math.PI * freq * r * t + ph[k]) * g, 0);
        return v * Math.sin(Math.PI * Math.min(t / s, 1)) ** 2;
      });
    },
    keys: (_, dur) => {
      const s = Math.max(dur, 0.2), out = new Float32Array(n(s + 0.1));
      for (let t = 0; t < s; t += 0.07 + rand() * 0.04) { const x = V.click({lo: 2500, hi: 8000, len: 0.018}), at = n(t), g = 0.6 + rand() * 0.4; for (let i = 0; i < x.length && at + i < out.length; i++) out[at + i] += x[i] * g; }
      return out;
    },
    noise: ({lo = 300, hi = 3000, len, fade = 'hit'}, dur) => {
      const s = len ?? Math.max(dur, 0.1), x = band(noise(s), lo, hi);
      return mul(x, fade === 'hit' ? env(x.length, 0.002, s * 0.4) : fade === 'out' ? shape(x.length, (t) => 1 - t) : shape(x.length, (t) => Math.sin(Math.PI * t)));
    },
  };
  const concat = (parts) => { const out = new Float32Array(parts.reduce((a, p) => a + p.length, 0)); let at = 0; for (const p of parts) { out.set(p, at); at += p.length; } return out; };
  return {V, n, band, noise, env, tone};
}

const peak = (x) => x.reduce((m, v) => Math.max(m, Math.abs(v)), 1e-9);
const add = (out, x, at, g) => { for (let i = 0; i < x.length && at + i < out.length; i++) if (at + i >= 0) out[at + i] += x[i] * g; };

/** A voice spec (one layer or several) drawn for a cue of `dur` seconds */
function voice(S, spec, dur) {
  const layers = [].concat(spec);
  const parts = layers.map((l) => { const make = S.V[l.voice]; if (!make) throw new Error(`no voice "${l.voice}": one of ${VOICES.join(', ')}`); const x = make(l, dur); return [x, l.gain ?? 1]; });
  const out = new Float32Array(Math.max(...parts.map(([x]) => x.length)));
  for (const [x, g] of parts) add(out, x, 0, g / peak(x));
  return out;
}

/** The bed: a pattern at `bpm` over `seconds`, from the instruments in `kit` (KIT), on the note `root` (Hz) */
function bed(S, rate, seconds, {bpm = 90, root = 147, kit = []}) {
  const out = new Float32Array(Math.ceil((seconds + 1) * rate)), beat = 60 / bpm, scale = [0, 3, 5, 7, 10, 12];
  const put = (x, t, g) => add(out, x, Math.round(t * rate), g);
  const has = (k) => kit.includes(k);
  for (let s = 0; s * beat / 2 < seconds; s++) {
    const t = (s * beat) / 2, on = s % 2 === 0, step = s % 8;
    if (has('kick') && (step === 0 || step === 4)) put(S.V.thump({freq: 55, len: 0.4, drop: 0.6}), t, 0.7);
    if (has('hat') && !on) put(S.V.click({lo: 6000, hi: 14000, len: 0.03}), t, 0.18);
    if (has('rim') && (step === 2 || step === 6)) put(S.V.click({lo: 900, hi: 4000, len: 0.04}), t, 0.35);
    if (has('bass') && step === 0) put(S.tone(root / 2, beat * 3.5, [[1, 1], [2, 0.2]], beat * 3), t, 0.35);
    if (has('arp') && on) put(S.V.marimba({freq: root * 2 ** (scale[(s / 2) % scale.length | 0] / 12) * 2, len: beat}), t, 0.12);
    if (has('pluck') && [0, 3, 6].includes(step)) put(S.V.pluck({freq: root * 2 ** (scale[(s * 5) % scale.length] / 12) * 2, len: beat * 2}), t, 0.2);
    if (has('chip') && on) put(S.V.square({freq: root * 2 ** (scale[(s / 2 | 0) % 4] / 12) * 2, len: beat * 0.4}), t, 0.1);
  }
  if (has('pad')) for (let k = 0; k * beat * 8 < seconds; k++) put(S.V.swell({freq: root * [1, 1.2, 0.84, 1.12][k % 4]}, beat * 8), k * beat * 8, 0.1);
  if (has('room')) put(S.band(S.noise(seconds + 1), 80, 1200), 0, 0.05);
  return out.subarray(0, Math.ceil(seconds * rate));
}

/**
 * The sound of `seconds` with `cues` ([{at, role, dur}]) in the motion's `sound` (react/sound.json: {bpm, root, kit, roles: {land: voice, …}}), as
 * mono samples at `rate`: the cues' voices over the bed, faded in and out at the ends, at a steady loudness. The same input gives the same samples.
 */
export function renderSound({seconds, cues = [], sound, rate = 44100}) {
  const S = synth(rate);
  const len = Math.ceil(seconds * rate), hits = new Float32Array(len + rate * 4);
  for (const c of cues) {
    const spec = sound.roles?.[c.role];
    if (!spec || c.at >= seconds) continue;
    const x = voice(S, spec, c.dur ?? 0);
    add(hits, x, Math.round(c.at * rate), ({land: 0.8, move: 0.9, draw: 0.8, count: 0.8, cut: 0.6, out: 0.5})[c.role] ?? 0.7);
  }
  const b = bed(S, rate, seconds, sound), h = peak(hits.subarray(0, len)), p = peak(b);
  const out = new Float32Array(len), fadeIn = 0.25 * rate, fadeOut = 1.5 * rate;
  for (let i = 0; i < len; i++) {
    let v = (hits[i] / h) * 0.9 + (b[i] / p) * (sound.bed ?? 0.45);
    if (i < fadeIn) v *= i / fadeIn;
    if (i > len - fadeOut) v *= ((len - i) / fadeOut) ** 2;
    out[i] = Math.tanh(v * 1.2) / Math.tanh(1.2);
  }
  const top = peak(out);
  for (let i = 0; i < len; i++) out[i] *= 0.8 / top;
  return out;
}

/** What is wrong with a sound.json, one sentence each */
export function soundIssues(sound) {
  const issues = [];
  if (!sound || typeof sound !== 'object') return ['sound.json is an object: {bpm, root, kit, roles}'];
  if (sound.bpm !== undefined && !(sound.bpm >= 40 && sound.bpm <= 200)) issues.push('bpm is 40 to 200');
  if (sound.root !== undefined && !(sound.root >= 40 && sound.root <= 2000)) issues.push('root is a note in Hz, 40 to 2000');
  for (const k of [].concat(sound.kit ?? [])) if (!KIT.includes(k)) issues.push(`kit has no "${k}": ${KIT.join(', ')}`);
  for (const [role, spec] of Object.entries(sound.roles ?? {})) {
    if (!ROLES.includes(role)) issues.push(`roles has no "${role}": ${ROLES.join(', ')}`);
    for (const l of [].concat(spec)) if (!VOICES.includes(l?.voice)) issues.push(`${role} has no voice "${l?.voice}": ${VOICES.join(', ')}`);
  }
  return issues;
}
