#!/usr/bin/env node
// brand/brand.tokens.json as CSS custom properties, with no dependencies.
//
//   node tools/brand.mjs            writes brand/tokens.css
//   node tools/brand.mjs --check    exits 1 when brand/tokens.css is not what the tokens give
//
// Light is the default; dark follows the system's preference unless the page sets data-theme="light", and
// data-theme="dark" forces it. Names are --color-<name>, --font-<name>, --weight-<name>, --size-<name>, --radius-<name>.

import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const GENERIC = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-monospace', 'ui-sans-serif', 'ui-serif']);

const entries = (group) => Object.entries(group ?? {}).filter(([k]) => !k.startsWith('$'));
const stack = (faces) => [].concat(faces).map((f) => (GENERIC.has(f) ? f : `"${f}"`)).join(', ');
const dimension = (v) => `${v.value}${v.unit}`;
const block = (selector, lines) => `${selector} {\n${lines.map((l) => `  ${l}`).join('\n')}\n}\n`;

/** The colours of one theme as custom property declarations. */
export function themeColours(tokens, theme) {
  return entries(tokens.color?.[theme]).map(([name, t]) => `--color-${name}: ${t.$value.hex};`);
}

/** brand.tokens.json as the text of tokens.css. */
export function tokensCss(tokens) {
  const light = [
    'color-scheme: light;',
    ...themeColours(tokens, 'light'),
    ...entries(tokens.font).map(([name, t]) => `--font-${name}: ${stack(t.$value)};`),
    ...entries(tokens.weight).map(([name, t]) => `--weight-${name}: ${t.$value};`),
    ...entries(tokens.size).map(([name, t]) => `--size-${name}: ${dimension(t.$value)};`),
    ...entries(tokens.radius).map(([name, t]) => `--radius-${name}: ${dimension(t.$value)};`),
  ];
  const dark = ['color-scheme: dark;', ...themeColours(tokens, 'dark')];
  return [
    '/* Generated from brand/brand.tokens.json by node tools/brand.mjs: edit the tokens, not this file. */\n',
    block(':root', light),
    `@media (prefers-color-scheme: dark) {\n${block(':root:not([data-theme="light"])', dark).replace(/^/gm, '  ').trimEnd()}\n}\n`,
    block(':root[data-theme="dark"]', dark),
  ].join('\n');
}

/** The WCAG 2 contrast ratio of two #RRGGBB colours. */
export function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const tokens = JSON.parse(readFileSync(resolve(ROOT, 'brand/brand.tokens.json'), 'utf8'));
  const css = tokensCss(tokens), path = resolve(ROOT, 'brand/tokens.css');
  if (process.argv.includes('--check')) {
    const now = (() => { try { return readFileSync(path, 'utf8'); } catch { return ''; } })();
    if (now !== css) { console.error('brand/tokens.css is out of date: node tools/brand.mjs'); process.exitCode = 1; }
    else console.log('brand/tokens.css is up to date');
  } else {
    writeFileSync(path, css);
    console.log('wrote brand/tokens.css');
  }
}
