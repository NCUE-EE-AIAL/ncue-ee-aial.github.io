// The AIAL "signal monogram" (triangle pulse + impulse = "Ai") in the header, favicon and social card.
// Reads dist/: run `npm run build` first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPng } from './png.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
if (!existsSync(join(DIST, 'index.html'))) throw new Error('dist/ is missing: run `npm run build` first');
const PULSE = 'M5 24.5H6.5L12 7.5L17.5 24.5H27';
const IMPULSE = 'M22.5 24.5V14.5';
const header = (route) => {
  const page = readFileSync(join(DIST, route, 'index.html'), 'utf8');
  const m = page.match(/<header class="nav"[\s\S]*?<\/header>/);
  assert.ok(m, `no header on ${route}`);
  return m[0];
};

test('header brand shows the signal monogram, not the old "AI" text tile', () => {
  for (const route of ['/', '/zh/', '/people/', '/zh/join/']) {
    const h = header(route);
    const brand = h.match(/<a class="brand"[\s\S]*?<\/a>/)[0];
    assert.match(brand, /<svg[^>]*class="brand-mark"[^>]*data-logo="aial-signal"/, route);
    assert.ok(brand.includes(PULSE) && brand.includes(IMPULSE), `${route}: mark paths missing`);
    assert.match(brand, /<svg[^>]*aria-hidden="true"/, route);
    assert.doesNotMatch(brand, />AI<\/span>/, `${route}: old AI tile still there`);
    assert.match(brand.replace(/<svg[\s\S]*?<\/svg>/, '').replace(/<wbr[^>]*>/g, ''), /AI Application Laboratory|人工智慧應用實驗室/, `${route}: lab name text`);
  }
});

test('header mark takes its colours from the theme tokens, no hard-coded blue', () => {
  const brand = header('/').match(/<a class="brand"[\s\S]*?<\/a>/)[0];
  assert.doesNotMatch(brand, /#1a56db|#2f6fe0/i);
  const css = readFileSync(join(ROOT, 'src/styles/global.css'), 'utf8');
  assert.match(css, /\.brand-tile\s*\{[^}]*var\(--accent-strong\)/);
});

test('favicon is the signal monogram on the site-blue tile', () => {
  const svg = readFileSync(join(DIST, 'favicon.svg'), 'utf8');
  assert.ok(svg.includes(PULSE) && svg.includes(IMPULSE), 'mark paths missing');
  assert.match(svg, /viewBox="0 0 32 32"/);
  assert.match(svg, /#1a56db/i);
  assert.doesNotMatch(svg, /<text/);
  assert.doesNotMatch(svg, /\/>/, 'self-closing tag in favicon.svg');
  assert.match(header('/') + readFileSync(join(DIST, 'index.html'), 'utf8'), /rel="icon" href="\/favicon\.svg"/);
});

test('og.png is 1200x630 and carries the new mark, not the old "AI" text', () => {
  const png = readPng(join(ROOT, 'public/og.png'));
  assert.equal(png.width, 1200);
  assert.equal(png.height, 630);
  const near = (p, q) => p.every((v, i) => Math.abs(v - q[i]) < 40);
  const white = [255, 255, 255], blue = [26, 86, 219];
  // tile occupies (72,113)-(128,169); impulse dot sits above where the old "AI" letters were
  assert.ok(near(png.at(111, 129), white), 'impulse dot missing');
  assert.ok(near(png.at(116, 156), white), 'baseline missing');
  assert.ok(near(png.at(100, 120), blue), 'tile background missing');
});

test('the mark files reference no external resources', () => {
  for (const f of ['public/favicon.svg', 'dist/favicon.svg']) {
    const svg = readFileSync(join(ROOT, f), 'utf8');
    assert.doesNotMatch(svg, /https?:\/\/(?!www\.w3\.org\/2000\/svg)|<image|<script/, f);
  }
  assert.ok(statSync(join(ROOT, 'public/og.png')).size < 400_000, 'og.png unexpectedly large');
});
