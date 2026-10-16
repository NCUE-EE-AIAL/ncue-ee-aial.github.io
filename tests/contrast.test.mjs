// WCAG AA (4.5:1) for white text drawn on the accent fills, read from the design tokens in both themes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const over = (fg, alpha, bg) => fg.map((v, i) => v * alpha + bg[i] * (1 - alpha));
const WHITE = [255, 255, 255];
// --accent-strong appears once for light, twice for dark (data-theme and prefers-color-scheme).
const fills = [...css.matchAll(/--accent-strong:\s*(#[0-9a-fA-F]{6})/g)].map((m) => hex(m[1]));

test('white text on the accent fill passes AA in both themes', () => {
  assert.equal(fills.length, 3);
  for (const fill of fills) assert.ok(ratio(WHITE, fill) >= 4.5, `white on ${fill}: ${ratio(WHITE, fill).toFixed(2)}`);
});

test('the count badge on a selected filter passes AA in both themes', () => {
  const m = css.match(/\.filters input:checked \+ label \.count\s*\{[^}]*background:\s*rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  assert.ok(m, 'selected-filter .count background not found');
  const [r, g, b, a] = m.slice(1).map(Number);
  for (const fill of fills) {
    const bg = over([r, g, b], a, fill);
    assert.ok(ratio(WHITE, bg) >= 4.5, `count badge over ${fill}: ${ratio(WHITE, bg).toFixed(2)}`);
  }
});
