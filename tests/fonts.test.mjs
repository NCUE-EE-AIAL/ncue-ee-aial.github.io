// The site loads nothing from other origins: Inter is self-hosted (SIL OFL 1.1) and preloaded once per page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const SITE = 'https://ncue-ee-aial.github.io';
if (!existsSync(join(DIST, 'index.html'))) throw new Error('dist/ is missing: run `npm run build` first');
function allHtml(dir = DIST) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? allHtml(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []);
}
const pages = allHtml().map((f) => [f.slice(DIST.length), readFileSync(f, 'utf8')]);

test('no page references Google Fonts', () => {
  for (const [where, page] of pages) assert.doesNotMatch(page, /fonts\.(googleapis|gstatic)\.com/, where);
});

test('each page preloads exactly one self-hosted woff2 of at most 120 KB', () => {
  for (const [where, page] of pages) {
    const hrefs = [...page.matchAll(/<link rel="preload" href="([^"]+)" as="font"/g)].map((m) => m[1]);
    assert.equal(hrefs.length, 1, `${where} preloads ${hrefs.length} fonts`);
    assert.match(hrefs[0], /^\/_astro\/fonts\/[^/]+\.woff2$/, where);
    const file = join(DIST, hrefs[0]);
    assert.ok(existsSync(file), `${where}: ${hrefs[0]} is not in dist/`);
    assert.ok(statSync(file).size <= 120 * 1024, `${hrefs[0]} is ${statSync(file).size} bytes`);
  }
});

test('the font licence ships beside the font', () => {
  assert.ok(existsSync(join(ROOT, 'src/assets/fonts/inter-latin-wght.woff2')));
  assert.match(readFileSync(join(ROOT, 'src/assets/fonts/OFL.txt'), 'utf8'), /SIL Open Font License, Version 1\.1/);
});

test('no stylesheet, preload, preconnect, icon or script comes from another origin', () => {
  const RES = new Set(['stylesheet', 'preload', 'preconnect', 'dns-prefetch', 'icon', 'apple-touch-icon', 'modulepreload', 'manifest']);
  for (const [where, page] of pages) {
    for (const tag of page.match(/<link\b[^>]*>/g) ?? []) {
      const rel = tag.match(/\brel="([^"]+)"/)?.[1] ?? '';
      const href = tag.match(/\bhref="([^"]+)"/)?.[1] ?? '';
      if (!rel.split(/\s+/).some((r) => RES.has(r))) continue;
      assert.ok(!/^(https?:)?\/\//.test(href) || href.startsWith(SITE), `${where}: ${rel} from ${href}`);
    }
    assert.doesNotMatch(page, /<script\b[^>]*\bsrc="(https?:)?\/\//, `${where}: third-party script`);
  }
});
