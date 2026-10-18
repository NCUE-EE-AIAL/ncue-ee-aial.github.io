// Search and sharing metadata in the built site: JSON-LD, per-page descriptions, sitemap languages, share image.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPng } from './png.mjs';
import { safeJsonLd } from '../src/lib/seo.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
if (!existsSync(join(DIST, 'index.html'))) throw new Error('dist/ is missing: run `npm run build` first');
const subdirs = (rel) => readdirSync(join(ROOT, rel)).filter((d) => statSync(join(ROOT, rel, d)).isDirectory());
const ROUTES = [
  '/', '/research/', ...subdirs('src/content/research').map((a) => `/research/${a}/`), '/publications/', '/projects/',
  '/people/', '/news/', ...subdirs('src/content/news').map((n) => `/news/${n}/`), '/join/',
];
const POSTS = new Set(subdirs('src/content/news').map((n) => `/news/${n}/`));
const zh = (p) => `/zh${p}`;
const html = (route) => readFileSync(join(DIST, route, 'index.html'), 'utf8');
const meta = (page, attr, name) => page.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`))?.[1];
const ldBlocks = (page) => [...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const nodes = (page) => JSON.parse(ldBlocks(page)[0])['@graph'];

test('safeJsonLd cannot close the script element', () => {
  const out = safeJsonLd({ name: '</script><script>alert(1)</script> & more' });
  assert.doesNotMatch(out, /[<>&]/);
  assert.equal(JSON.parse(out).name, '</script><script>alert(1)</script> & more');
});

test('every page has one JSON-LD graph naming the lab inside NCUE EE', () => {
  for (const [route, lang] of ROUTES.flatMap((r) => [[r, 'en'], [zh(r), 'zh']])) {
    const page = html(route);
    assert.equal(ldBlocks(page).length, 1, `${route} needs exactly one ld+json block`);
    const graph = nodes(page);
    const lab = graph.find((n) => n['@type'] === 'ResearchOrganization');
    assert.ok(graph.some((n) => n['@type'] === 'WebSite'), `${route}: no WebSite node`);
    assert.ok(lab, `${route}: no ResearchOrganization node`);
    assert.equal(lab.name, lang === 'en' ? 'AI Application Laboratory' : '人工智慧應用實驗室', route);
    assert.equal(lab.parentOrganization.name, lang === 'en' ? 'Department of Electrical Engineering' : '電機工程學系', route);
    assert.equal(lab.parentOrganization.parentOrganization.name,
      lang === 'en' ? 'National Changhua University of Education' : '國立彰化師範大學', route);
  }
});

test('the People page describes the PI as a Person with the ORCID from the people file', () => {
  const orcid = readFileSync(join(ROOT, 'src/content/people/wen-ren-yang.yaml'), 'utf8').match(/orcid: "([^"]+)"/)[1];
  for (const [route, name] of [['/people/', 'Wen-Ren Yang'], [zh('/people/'), '楊文然']]) {
    const pi = nodes(html(route)).find((n) => n['@type'] === 'Person');
    assert.ok(pi, `${route}: no Person node`);
    assert.equal(pi.name, name);
    assert.ok(pi.sameAs.includes(orcid), `${route}: Person.sameAs lacks ${orcid}`);
  }
});

test('each page has its own meta description', () => {
  for (const lang of ['en', 'zh']) {
    const seen = new Map();
    for (const r of ROUTES) {
      const route = lang === 'en' ? r : zh(r);
      const desc = meta(html(route), 'name', 'description');
      assert.ok(desc, `${route}: no description`);
      // A news post's description is its author's summary: it must be unique, but any length is fine.
      if (lang === 'en' && !POSTS.has(r)) assert.ok(desc.length >= 50 && desc.length <= 160, `${route}: description is ${desc.length} characters (50-160)`);
      assert.ok(!seen.has(desc), `${route} repeats the description of ${seen.get(desc)}`);
      seen.set(desc, route);
    }
  }
});

test('sitemap hreflang codes match the pages\' <html lang>', () => {
  const xml = readdirSync(DIST).filter((f) => /^sitemap-\d+\.xml$/.test(f)).map((f) => readFileSync(join(DIST, f), 'utf8')).join('');
  const codes = new Set([...xml.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1]));
  assert.deepEqual([...codes].sort(), ['en', 'zh-Hant-TW']);
});

test('the share image declares its size, type and alt text', () => {
  const { width, height } = readPng(join(ROOT, 'public/og.png'));
  for (const route of ['/', zh('/'), '/people/']) {
    const page = html(route);
    assert.equal(meta(page, 'property', 'og:image:width'), String(width), route);
    assert.equal(meta(page, 'property', 'og:image:height'), String(height), route);
    assert.equal(meta(page, 'property', 'og:image:type'), 'image/png', route);
    assert.ok((meta(page, 'property', 'og:image:alt') ?? '').length > 20, `${route}: og:image:alt missing`);
  }
});

test('every page links the apple-touch-icon, and the file exists', () => {
  assert.ok(existsSync(join(DIST, 'apple-touch-icon.png')), 'dist/apple-touch-icon.png is missing');
  for (const r of ROUTES) assert.match(html(r), /<link rel="apple-touch-icon" href="\/apple-touch-icon\.png"/, r);
});
