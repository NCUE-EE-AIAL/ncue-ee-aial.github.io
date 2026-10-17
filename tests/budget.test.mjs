// Weight budgets for the built site. Each limit has room to grow; if one trips, look at what grew first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
if (!existsSync(join(DIST, 'index.html'))) throw new Error('dist/ is missing: run `npm run build` first');
function files(dir, re) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name), re) : re.test(e.name) ? [join(dir, e.name)] : []);
}
const pages = files(DIST, /\.html$/).map((f) => [f.slice(DIST.length), readFileSync(f, 'utf8')]);
const gz = (s) => gzipSync(s).length;
const KB = 1024;

test('every page is at most 20 KB of gzipped HTML (album pages 32 KB)', () => {
  for (const [where, page] of pages) {
    const limit = where.includes('/lab-life/') ? 32 * KB : 20 * KB;
    assert.ok(gz(page) <= limit, `${where} is ${(gz(page) / KB).toFixed(1)} KB gzipped`);
  }
});

test('the home page needs at most 150 KB of HTML, CSS, JS and preloaded fonts (photos aside)', () => {
  const page = readFileSync(join(DIST, 'index.html'), 'utf8');
  const assets = [...page.matchAll(/(?:href|src)="(\/_astro\/[^"]+\.(?:css|js|woff2))"/g)].map((m) => m[1]);
  const bytes = gz(page) + assets.reduce((n, a) => n + (a.endsWith('.woff2') ? statSync(join(DIST, a)).size : gz(readFileSync(join(DIST, a)))), 0);
  assert.ok(bytes <= 150 * KB, `home needs ${Math.round(bytes / KB)} KB`);
});

test('every <img> has width, height and alt; at most one image per page is high priority', () => {
  for (const [where, page] of pages) {
    for (const tag of page.match(/<img\b[^>]*>/g) ?? []) {
      for (const attr of ['width', 'height', 'alt']) assert.match(tag, new RegExp(`\\b${attr}="`), `${where}: <img> without ${attr}: ${tag.slice(0, 120)}`);
    }
    assert.ok((page.match(/fetchpriority="high"/g) ?? []).length <= 1, `${where}: more than one high-priority image`);
  }
});

test('no generated image in dist/_astro is over 350 KB', () => {
  const dir = join(DIST, '_astro');
  for (const f of existsSync(dir) ? files(dir, /\.(avif|webp|jpe?g|png)$/i) : []) {
    assert.ok(statSync(f).size <= 350 * KB, `${f.slice(DIST.length)} is ${Math.round(statSync(f).size / KB)} KB`);
  }
});
