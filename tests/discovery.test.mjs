// Ways people and search engines find the lab's work: news RSS, site search, paper metadata, the weekly paper sync.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rssFeed } from '../src/lib/rss.mjs';
import { isPi, fromCrossref, toYaml, fileName } from '../scripts/pubs-sync.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
if (!existsSync(join(DIST, 'index.html'))) throw new Error('dist/ is missing: run `npm run build` first');
const html = (route) => readFileSync(join(DIST, route, 'index.html'), 'utf8');
const pubCount = readdirSync(join(ROOT, 'src/content/publications')).filter((f) => /\.ya?ml$/.test(f)).length;

test('rssFeed escapes text and lists every item', () => {
  const xml = rssFeed({ title: 'A & B', description: 'd', home: 'https://x/', self: 'https://x/rss.xml', language: 'en',
    items: [{ title: '<New> site', summary: 's', url: 'https://x/news/a/', date: new Date('2026-10-17') }] });
  assert.match(xml, /<title>A &amp; B<\/title>/);
  assert.match(xml, /<title>&lt;New&gt; site<\/title>/);
  assert.match(xml, /<pubDate>Sat, 17 Oct 2026 00:00:00 GMT<\/pubDate>/);
});

test('both languages have a news feed, linked from every page', () => {
  for (const [file, home] of [['rss.xml', '/'], ['zh/rss.xml', '/zh/']]) {
    const xml = readFileSync(join(DIST, file), 'utf8');
    assert.match(xml, /^<\?xml/);
    assert.ok((xml.match(/<item>/g) ?? []).length >= 1, `${file} has no items`);
    assert.match(html(home), new RegExp(`<link rel="alternate" type="application/rss\\+xml"[^>]+href="/${file}"`));
  }
});

test('the site search page and its index are built, and pages mark what to index', () => {
  for (const r of ['/search/', '/zh/search/']) assert.match(html(r), /src="\/pagefind\/pagefind-ui\.js"/, r);
  assert.ok(existsSync(join(DIST, 'pagefind/pagefind-ui.js')), 'pagefind did not run after astro build');
  assert.match(html('/'), /<main id="main" data-pagefind-body/);
  assert.doesNotMatch(readFileSync(join(DIST, '404.html'), 'utf8'), /data-pagefind-body/);
});

test('the Publications page describes every paper as a ScholarlyArticle and offers IEEE and BibTeX copies', () => {
  for (const r of ['/publications/', '/zh/publications/']) {
    const page = html(r);
    const ld = JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(ld['@graph'].filter((n) => n['@type'] === 'ScholarlyArticle').length, pubCount, r);
    assert.equal((page.match(/data-ieee="/g) ?? []).length, pubCount, r);
  }
});

test('search verification and page counting stay off until their codes are filled in', () => {
  const ui = readFileSync(join(ROOT, 'src/i18n/ui.ts'), 'utf8');
  const page = html('/');
  if (/verification: \{ google: '', bing: '' \}/.test(ui)) assert.doesNotMatch(page, /google-site-verification|msvalidate/);
  if (/goatcounter: '',/.test(ui)) assert.doesNotMatch(page, /goatcounter/);
});

test('pubs-sync recognises the PI in every spelling Crossref uses, and nobody else', () => {
  assert.ok(isPi({ given: 'Wen-Ren', family: 'Yang' }));
  assert.ok(isPi({ given: 'Wen-Reng', family: 'Yang' }));
  assert.ok(isPi({ given: 'W.-R.', family: 'Yang' }));
  assert.ok(!isPi({ given: 'Wen-Xun', family: 'Yang' }));
  assert.ok(!isPi({ given: 'Wen', family: 'Yang' }));
});

test('pubs-sync turns a Crossref record into an unverified content file', () => {
  const w = {
    DOI: '10.1109/TIM.2011.2179824', type: 'journal-article', title: ['Discrete Wavelet Transform and <i>Neural</i> Networks'],
    author: [{ given: 'Wen-Ren', family: 'Yang' }, { given: 'Chau-Shing', family: 'Wang' }],
    issued: { 'date-parts': [[2012, 5]] }, 'container-title': ['IEEE Transactions on Instrumentation and Measurement'],
    volume: '61', issue: '5', page: '1245-1253',
  };
  const p = fromCrossref(w, '2026-10-24');
  assert.equal(p.title, 'Discrete Wavelet Transform and Neural Networks');
  assert.equal(p.venue, 'IEEE Transactions on Instrumentation and Measurement, vol. 61, no. 5, pp. 1245–1253');
  assert.equal(p.type, 'journal');
  assert.equal(fileName(p, new Set()), '2012-discrete-wavelet-transform-neural.yaml');
  assert.equal(fileName(p, new Set(['2012-discrete-wavelet-transform-neural.yaml'])), '2012-discrete-wavelet-transform-neural-2.yaml');
  const yaml = toYaml(p);
  assert.match(yaml, /^verified: false$/m);
  assert.match(yaml, /^doi: "10\.1109\/tim\.2011\.2179824"$/m);
  assert.equal(fromCrossref({ ...w, author: [{ given: 'Wen-Xun', family: 'Yang' }] }, '2026-10-24'), null);
});
