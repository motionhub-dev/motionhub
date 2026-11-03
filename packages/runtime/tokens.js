// A motion's tokens.json (W3C design tokens) as values and as CSS custom properties. No React here, so a build script
// can read tokens without it; index.js re-exports both.

const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|math|emoji|ui-[a-z-]+)$/;
const hex = (v) => (typeof v === 'string' ? v : v?.hex ?? `#${(v?.components ?? [0, 0, 0]).map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`);
const color = (v) => (typeof v === 'string' ? v : v?.alpha !== undefined && v.alpha < 1 ? `color-mix(in srgb, ${hex(v)} ${+(v.alpha * 100).toFixed(2)}%, transparent)` : hex(v));
const px = (v) => (typeof v === 'number' ? v : v?.unit === 'rem' ? v.value * 16 : v?.value);
// a spread of 0 is left out, so a shadow works as a text-shadow too
const shadow = (v) => [].concat(v).map((s) => (typeof s === 'string' ? s : `${s.inset ? 'inset ' : ''}${px(s.offsetX) ?? 0}px ${px(s.offsetY) ?? 0}px ${px(s.blur) ?? 0}px${px(s.spread) ? ` ${px(s.spread)}px` : ''} ${color(s.color)}`)).join(', ');
const VALUE = {
  color,
  fontFamily: (v) => [].concat(v).map((f) => (GENERIC.test(f) ? f : `"${f}"`)).join(', '),
  duration: (v) => (v?.unit === 'ms' ? v.value / 1000 : v?.value),
  cubicBezier: (v) => v,
  dimension: px,
  fontWeight: (v) => v,
  number: (v) => v,
  shadow,
};

/**
 * A motion's tokens.json as values, group by group: a color as a CSS colour, a fontFamily as a CSS font stack, a duration in seconds, a cubicBezier as
 * [x1, y1, x2, y2], a dimension in pixels, a shadow as a CSS box-shadow; aliases (`{color.ink}`) resolved. `tokens.color.ink`, `tokens.duration.light`.
 */
export function resolveTokens(dtcg) {
  if (!dtcg) return {};
  const lookup = (path) => path.split('.').reduce((o, k) => o?.[k], dtcg);
  const out = {};
  const walk = (node, path, inherited) => {
    const type = node.$type ?? inherited;
    if ('$value' in node) {
      let value = node.$value, t = type, seen = 0;
      while (typeof value === 'string' && /^\{[^{}]+\}$/.test(value) && seen++ < 8) {
        const target = lookup(value.slice(1, -1));
        value = target?.$value;
        t = t ?? target?.$type;
      }
      const [group, ...rest] = path;
      (out[group] ??= {})[rest.join('-')] = (VALUE[t] ?? ((x) => x))(value);
      return;
    }
    for (const [k, child] of Object.entries(node)) if (!k.startsWith('$') && child && typeof child === 'object') walk(child, [...path, k], type);
  };
  for (const [group, node] of Object.entries(dtcg)) if (!group.startsWith('$') && node && typeof node === 'object') walk(node, [group], node.$type);
  return out;
}

/** Resolved tokens as CSS custom properties, Style Dictionary's way: --color-ink, --font-display, --duration-light (s), --easing-light, --caption-size (px) */
export function tokenVariables(tokens) {
  const vars = {};
  for (const [group, values] of Object.entries(tokens ?? {})) {
    for (const [name, v] of Object.entries(values)) {
      const key = `--${group}-${name}`;
      vars[key] = group === 'duration' && typeof v === 'number' ? `${v}s` : Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === 'number') ? `cubic-bezier(${v.join(', ')})` : typeof v === 'number' && /^(caption|size|space|radius)/.test(group) && !/weight/.test(name) ? `${v}px` : String(v);
    }
  }
  return vars;
}

