// The brand: its tokens are complete in both themes, every text colour reads on every ground, tokens.css is what the
// tokens give, and the logo files use the brand's colours only.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {contrast, tokensCss} from '../tools/brand.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const tokens = JSON.parse(readFileSync(join(ROOT, 'brand/brand.tokens.json'), 'utf8'));
const hex = (theme) => Object.fromEntries(Object.entries(tokens.color[theme]).filter(([k]) => !k.startsWith('$')).map(([k, t]) => [k, t.$value.hex]));
const light = hex('light'), dark = hex('dark');

test('both themes name the same colours, each a DTCG colour whose components agree with its hex', () => {
  assert.deepEqual(Object.keys(light).sort(), Object.keys(dark).sort());
  for (const theme of ['light', 'dark']) {
    for (const [name, t] of Object.entries(tokens.color[theme]).filter(([k]) => !k.startsWith('$'))) {
      const {colorSpace, components, hex: h} = t.$value;
      assert.equal(colorSpace, 'srgb', name);
      assert.match(h, /^#[0-9A-F]{6}$/, name);
      components.forEach((c, i) => assert.ok(Math.abs(c * 255 - parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16)) < 0.6, `${theme}.${name} component ${i}`));
    }
  }
});

test('text reads on every ground at WCAG AA, the mark, a like and the accent stand out at 3:1, and text reads on the accent', () => {
  for (const [theme, c] of [['light', light], ['dark', dark]]) {
    for (const ground of ['bg', 'surface', 'surface-2', 'header', 'header-surface']) {
      for (const ink of ['text', 'text-2', 'muted']) assert.ok(contrast(c[ink], c[ground]) >= 4.5, `${theme} ${ink} on ${ground}: ${contrast(c[ink], c[ground]).toFixed(2)}`);
      for (const ink of ['mark', 'like', 'accent']) assert.ok(contrast(c[ink], c[ground]) >= 3, `${theme} ${ink} on ${ground}: ${contrast(c[ink], c[ground]).toFixed(2)}`);
    }
    assert.ok(contrast(c['on-accent'], c.accent) >= 4.5, `${theme} on-accent on accent: ${contrast(c['on-accent'], c.accent).toFixed(2)}`);
    assert.ok(contrast(c['on-code'], c.code) >= 4.5, `${theme} on-code on code: ${contrast(c['on-code'], c.code).toFixed(2)}`);
  }
});

test('brand/tokens.css is what the tokens give', () => {
  const css = readFileSync(join(ROOT, 'brand/tokens.css'), 'utf8');
  assert.equal(css, tokensCss(tokens), 'run node tools/brand.mjs');
  assert.match(css, /--color-bg: #FCFCFA;/);
  assert.match(css, /--color-header: #F4F3F0;/);
  assert.match(css, /--font-ui: "Inter", "Noto Sans SC",/);
  assert.match(css, /:root\[data-theme="dark"\] \{[^}]*--color-bg: #1A1714;/);
});

test('the logo, favicon and share card use the brand\'s colours only, and need no font', () => {
  const allowed = new Set([...Object.values(light), ...Object.values(dark)]);
  for (const dir of ['logo', 'favicon', 'social']) {
    for (const file of readdirSync(join(ROOT, 'brand', dir)).filter((f) => f.endsWith('.svg'))) {
      const svg = readFileSync(join(ROOT, 'brand', dir, file), 'utf8');
      assert.match(svg, /^<svg [^>]*viewBox="/, file);
      assert.match(svg, /aria-label="motionhub"/, file);
      assert.doesNotMatch(svg, /<text\b|font-family|<script\b|href=/, file);
      for (const [h] of svg.matchAll(/#[0-9A-Fa-f]{6}\b/g)) assert.ok(allowed.has(h.toUpperCase()), `${file}: ${h}`);
    }
  }
});
