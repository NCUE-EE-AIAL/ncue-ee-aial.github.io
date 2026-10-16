// Structural checks over the built site in dist/. Run `npm run build` first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const SITE = 'https://ncue-ee-aial.github.io';
if (!existsSync(join(DIST, 'index.html'))) throw new Error('dist/ is missing: run `npm run build` first');

const subdirs = (rel) => readdirSync(join(ROOT, rel)).filter((d) => statSync(join(ROOT, rel, d)).isDirectory());
const AREAS = subdirs('src/content/research');
const NEWS = subdirs('src/content/news');
const ROUTES = [
  '/', '/research/', ...AREAS.map((a) => `/research/${a}/`), '/publications/', '/projects/',
  '/people/', '/news/', ...NEWS.map((n) => `/news/${n}/`), '/join/',
];
const zh = (p) => `/zh${p}`;
const file = (route) => join(DIST, route, 'index.html');
const html = (route) => readFileSync(file(route), 'utf8');
function allHtml(dir = DIST) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? allHtml(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []);
}
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const section = (page, id) => {
  const start = page.indexOf(`id="${id}"`);
  assert.ok(start >= 0, `missing id="${id}"`);
  return page.slice(start);
};

test('every English route is built', () => {
  for (const r of ROUTES) assert.ok(existsSync(file(r)), `missing ${r}`);
});

test('every Chinese route is built under /zh/', () => {
  for (const r of ROUTES) assert.ok(existsSync(file(zh(r))), `missing ${zh(r)}`);
});

test('at least 20 pages plus a sitemap listing them', () => {
  const pages = allHtml().filter((f) => f.endsWith('index.html'));
  assert.ok(pages.length >= 20, `only ${pages.length} pages`);
  assert.ok(existsSync(join(DIST, 'sitemap-index.xml')), 'missing sitemap-index.xml');
  const urls = readdirSync(DIST).filter((f) => /^sitemap-\d+\.xml$/.test(f))
    .map((f) => readFileSync(join(DIST, f), 'utf8')).join('');
  for (const r of ROUTES) {
    assert.ok(urls.includes(`<loc>${SITE}${r}</loc>`), `sitemap lacks ${r}`);
    assert.ok(urls.includes(`<loc>${SITE}${zh(r)}</loc>`), `sitemap lacks ${zh(r)}`);
  }
});

test('<html lang> matches the locale', () => {
  for (const r of ROUTES) {
    assert.match(html(r), /<html lang="en"/, r);
    assert.match(html(zh(r)), /<html lang="zh-Hant-TW"/, zh(r));
  }
});

test('hreflang alternates and the language switch point at the same page', () => {
  for (const r of ROUTES) {
    const en = html(r), cn = html(zh(r));
    for (const page of [en, cn]) {
      assert.match(page, new RegExp(`hreflang="en" href="${escape(SITE + r)}"`), r);
      assert.match(page, new RegExp(`hreflang="zh-Hant-TW" href="${escape(SITE + zh(r))}"`), r);
    }
    assert.match(en, new RegExp(`<a href="${escape(zh(r))}" hreflang="zh-Hant-TW"`), `switch on ${r}`);
    assert.match(cn, new RegExp(`<a href="${escape(r)}" hreflang="en"`), `switch on ${zh(r)}`);
  }
});

test('every page has exactly one <h1>', () => {
  for (const f of allHtml()) {
    const n = (readFileSync(f, 'utf8').match(/<h1[\s>]/g) ?? []).length;
    assert.equal(n, 1, `${f.slice(DIST.length)} has ${n} <h1>`);
  }
});

test('no external images, no third-party scripts, no preloaded video', () => {
  for (const f of allHtml()) {
    const page = readFileSync(f, 'utf8');
    const where = f.slice(DIST.length);
    assert.doesNotMatch(page, /<img[^>]+src="(https?:)?\/\//, `external <img> in ${where}`);
    assert.doesNotMatch(page, /<script[^>]+src="(https?:)?\/\//, `third-party <script> in ${where}`);
    assert.doesNotMatch(page, /<iframe/, `<iframe> in initial HTML of ${where}`);
  }
});

test('home page weighs under 300 KB of HTML + CSS + JS', () => {
  const page = html('/');
  const assets = [...page.matchAll(/(?:href|src)="(\/_astro\/[^"]+\.(?:css|js))"/g)].map((m) => m[1]);
  const bytes = Buffer.byteLength(page) + assets.reduce((n, a) => n + statSync(join(DIST, a)).size, 0);
  assert.ok(bytes < 300 * 1024, `home is ${Math.round(bytes / 1024)} KB`);
});

test('home hero art exists and motion is switched off under prefers-reduced-motion', () => {
  const page = html('/');
  assert.match(page, /class="hero-art/);
  const css = [...page.matchAll(/href="(\/_astro\/[^"]+\.css)"/g)]
    .map((m) => readFileSync(join(DIST, m[1]), 'utf8')).join('') + page;
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('project cards show GitHub stars fetched at build time', () => {
  for (const r of ['/projects/', zh('/projects/')]) {
    assert.ok((html(r).match(/class="stars"/g) ?? []).length >= 1, `no stars on ${r}`);
  }
});

test('publications are grouped by year, newest first, each with BibTeX', () => {
  const page = html('/publications/');
  const years = [...page.matchAll(/data-year="(\d{4})"/g)].map((m) => Number(m[1]));
  assert.ok(years.length >= 1, 'no year groups');
  assert.deepEqual(years, [...years].sort((a, b) => b - a));
  const pubs = (page.match(/class="pub"/g) ?? []).length;
  assert.equal((page.match(/data-bibtex="/g) ?? []).length, pubs);
});

test('unverified publications carry a visible "to verify" mark', () => {
  for (const r of ['/publications/', zh('/publications/')]) {
    for (const m of html(r).matchAll(/<li class="pub"[^>]*data-verified="false"[\s\S]*?<\/li>/g)) {
      assert.match(m[0], /chip-warn/, `unmarked unverified entry on ${r}`);
    }
  }
});

test('Kuan-Wei Chen is listed under Alumni with his two papers', () => {
  const alumni = section(html('/people/'), 'alumni');
  const card = section(alumni, 'kuan-wei-chen');
  const end = card.indexOf('</article>');
  const body = card.slice(0, end);
  assert.match(body, /Kuan-Wei Chen/);
  assert.match(body, /Two-step Authentication/);
  assert.match(body, /Emotion as a Distribution/);
});

test('the PI email is on the People and Join pages; students show no email', () => {
  for (const r of ['/people/', '/join/', zh('/people/'), zh('/join/')]) {
    assert.match(html(r), /mailto:wry87c@cc\.ncue\.edu\.tw/, r);
  }
  const people = html('/people/');
  const mails = [...people.matchAll(/mailto:([^"?]+)/g)].map((m) => m[1]);
  for (const m of mails) assert.ok(['wry87c@cc.ncue.edu.tw', 'ncueaial@gmail.com'].includes(m), `unexpected ${m}`);
});

test('Join has a facilities section and Research links to it', () => {
  const join = section(html('/join/'), 'facilities');
  for (const name of ['RTX 4090', 'X299', 'Arty A7-100T', 'Grove Vision AI']) assert.match(join, new RegExp(name));
  assert.match(html('/research/'), /href="\/join\/#facilities"/);
  assert.match(html(zh('/research/')), /href="\/zh\/join\/#facilities"/);
});

test('research pages and Join end with the visit-or-write call to action', () => {
  for (const r of [...AREAS.map((a) => `/research/${a}/`), '/join/']) {
    assert.match(html(r), /Interested\? Visit the lab or write to us\./, r);
    assert.match(html(zh(r)), /有興趣？歡迎來實驗室看看，或寫信給我們/, zh(r));
  }
});

test('research area pages list their related projects and publications', () => {
  const page = html('/research/biometrics-security/');
  assert.match(page, /github\.com\/NCUE-EE-AIAL\/Two-step-Authentication-Multi-biometric-System/);
  assert.match(page, /Two-step Authentication: Multi-biometric System/);
});

test('removed content stays removed', () => {
  for (const f of allHtml()) assert.doesNotMatch(readFileSync(f, 'utf8'), /ShuffleSRNet|Gorden/, f.slice(DIST.length));
});

test('the 404 page is bilingual', () => {
  const page = readFileSync(join(DIST, '404.html'), 'utf8');
  assert.match(page, /Page not found/);
  assert.match(page, /找不到頁面/);
});
