// Structural checks over the built site in dist/. Run `npm run build` first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isAuthor } from '../src/lib/format.ts';

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

test('home hero art exists and motion is switched off under prefers-reduced-motion', () => {
  const page = html('/');
  assert.match(page, /class="hero-art/);
  const css = [...page.matchAll(/href="(\/_astro\/[^"]+\.css)"/g)]
    .map((m) => readFileSync(join(DIST, m[1]), 'utf8')).join('') + page;
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

// Needs the GitHub API during the build: without a token, 60 requests/hour (about 8 local builds). CI passes GITHUB_TOKEN.
test('project cards show GitHub stars fetched at build time', { skip: !process.env.GITHUB_TOKEN && 'set GITHUB_TOKEN to check live repo stats' }, () => {
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

test('editor TODO comments in Markdown never reach the built HTML', () => {
  for (const f of allHtml()) assert.doesNotMatch(readFileSync(f, 'utf8'), /<!--[\s\S]*?TODO/, f.slice(DIST.length));
});

test('the 404 page is bilingual', () => {
  const page = readFileSync(join(DIST, '404.html'), 'utf8');
  assert.match(page, /Page not found/);
  assert.match(page, /找不到頁面/);
});

test('people photos: alt text has no stray space, the PI photo (LCP) is eager, the rest lazy', () => {
  const imgs = (route) => [...html(route).matchAll(/<img[^>]*class="avatar"[^>]*>/g)].map((m) => m[0]);
  const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
  for (const [route, alt] of [['/zh/people/', '照片：楊文然'], ['/people/', 'Portrait of Wen-Ren Yang']]) {
    const list = imgs(route);
    const pi = list.find((t) => attr(t, 'src').includes('wen-ren-yang'));
    assert.ok(pi, `${route}: PI photo missing`);
    assert.equal(attr(pi, 'alt'), alt);
    assert.equal(attr(pi, 'loading'), 'eager', `${route}: PI photo must not be lazy`);
    const rest = list.filter((t) => t !== pi);
    assert.ok(rest.length > 0);
    for (const t of rest) assert.equal(attr(t, 'loading'), 'lazy', `${route}: ${attr(t, 'src')} should stay lazy`);
  }
});

test('every publication entry bolds the PI exactly once, whatever spelling it uses', () => {
  const PI = 'Wen-Ren Yang';
  for (const r of ['/publications/', zh('/publications/')]) {
    const entries = [...html(r).matchAll(/<li class="pub"[^>]*>[\s\S]*?<\/li>/g)].map((m) => m[0]);
    assert.ok(entries.length >= 30, `${r}: only ${entries.length} entries`);
    for (const e of entries) {
      const id = e.match(/ id="([^"]+)"/)?.[1] ?? e.slice(0, 60);
      const authors = e.match(/<p class="pub-authors">([\s\S]*?)<\/p>/)[1];
      const bold = [...authors.matchAll(/<strong class="me">([^<]*)<\/strong>/g)].map((m) => m[1]);
      const plain = authors.replace(/<strong class="me">[^<]*<\/strong>/g, '').split(',').map((x) => x.trim()).filter(Boolean);
      assert.equal(bold.filter((b) => isAuthor(PI, [b])).length, 1, `${r} ${id}: PI bolded ${bold.filter((b) => isAuthor(PI, [b])).length} times in "${authors}"`);
      assert.deepEqual(plain.filter((p) => isAuthor(PI, [p])), [], `${r} ${id}: PI left plain in "${authors}"`);
    }
  }
});

test('home shows only news from the last 12 months and no empty-state placeholders', () => {
  const home = html('/');
  const split = home.slice(home.indexOf('class="section container split'));
  const row = split.slice(0, split.indexOf('</section>'));
  assert.doesNotMatch(row, /class="muted"/, 'the home page must not show "no posts" placeholders');
  const col = row.indexOf('aria-labelledby="news-h"');
  if (col < 0) return; // no recent news: the column is gone, which is the point
  const cutoff = new Date(); cutoff.setUTCMonth(cutoff.getUTCMonth() - 12); cutoff.setUTCDate(cutoff.getUTCDate() - 7); // a week of slack for stale dist/
  const dates = [...row.slice(col).matchAll(/<time datetime="([\d-]+)"/g)].map((m) => new Date(`${m[1]}T00:00:00Z`));
  assert.ok(dates.length >= 1 && dates.length <= 3, `${dates.length} news items on the home page`);
  for (const d of dates) assert.ok(d >= cutoff, `home shows a post from ${d.toISOString().slice(0, 10)}`);
});

test('/news/ groups posts under one heading per year', () => {
  const years = new Set(NEWS.flatMap((n) => readdirSync(join(ROOT, 'src/content/news', n))
    .map((f) => readFileSync(join(ROOT, 'src/content/news', n, f), 'utf8').match(/^date: (\d{4})/m)?.[1]).filter(Boolean)));
  for (const r of ['/news/', zh('/news/')]) {
    const heads = [...html(r).matchAll(/<h2 class="news-year" id="ny(\d{4})">/g)].map((m) => m[1]);
    assert.deepEqual(heads, [...years].sort().reverse(), r);
  }
});

test('a post written in one language appears on both sites, tagged with its language', () => {
  const single = NEWS.filter((n) => readdirSync(join(ROOT, 'src/content/news', n)).length === 1);
  if (single.length === 0) return; // none today; the rule is unit-tested via pickLocalized
  for (const n of single) {
    const only = readdirSync(join(ROOT, 'src/content/news', n))[0].replace('.md', '');
    const other = only === 'en' ? zh(`/news/${n}/`) : `/news/${n}/`;
    assert.match(html(other), new RegExp(`<h1[^>]*lang="${only === 'en' ? 'en' : 'zh-Hant-TW'}"`), other);
  }
});

test('alumni cards show where the person went; other cards never do', () => {
  const people = html('/people/');
  for (const f of readdirSync(join(ROOT, 'src/content/people'))) {
    const y = readFileSync(join(ROOT, 'src/content/people', f), 'utf8');
    const id = f.replace(/\.ya?ml$/, '');
    const card = people.slice(people.indexOf(`id="${id}"`));
    const body = card.slice(0, card.indexOf('</article>'));
    if (/^destination:/m.test(y)) {
      assert.match(y, /^alumni: true/m, `${f}: destination without alumni: true`);
      assert.match(body, /class="destination"/, `${id}: destination not shown`);
    } else assert.doesNotMatch(body, /class="destination"/, `${id}: unexpected destination`);
  }
});

test('every honour file is listed on People; with none, there is no honours section', () => {
  const dir = join(ROOT, 'src/content/honors');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)) : [];
  for (const r of ['/people/', zh('/people/')]) {
    const page = html(r);
    if (files.length === 0) { assert.doesNotMatch(page, /id="honors"/, r); continue; }
    const list = section(page, 'honors');
    for (const f of files) {
      const title = readFileSync(join(dir, f), 'utf8').match(/^\s+en: "([^"]+)"/m)[1];
      assert.ok(list.includes(escape(title).replace(/\\/g, '')) || r.startsWith('/zh'), `${r}: honour "${title}" missing`);
    }
  }
});

test('smart-grid-energy: an area in both languages, on the PI card, with its papers and the BESS project', () => {
  for (const r of ['/research/smart-grid-energy/', zh('/research/smart-grid-energy/')]) assert.ok(existsSync(file(r)), `missing ${r}`);
  for (const r of ['/people/', zh('/people/')]) {
    assert.match(section(html(r), 'pi'), new RegExp(`href="${r.startsWith('/zh') ? '/zh' : ''}/research/smart-grid-energy/"`), `${r}: PI card lacks the area`);
  }
  const page = html('/research/smart-grid-energy/');
  assert.match(page, /Flywheel energy storage system for voltage sag compensation/);
  assert.match(page, /Battery Energy Storage System/i);
});

test('the research folders and AREA_SLUGS in the schema name the same areas', () => {
  const slugs = [...readFileSync(join(ROOT, 'src/content.config.ts'), 'utf8').match(/AREA_SLUGS = \[([^\]]+)\]/)[1].matchAll(/'([\w-]+)'/g)].map((m) => m[1]);
  assert.deepEqual([...slugs].sort(), [...AREAS].sort());
});

test('home has an About section whose numbers match the content folders', () => {
  const count = (dir, re) => readdirSync(join(ROOT, 'src/content', dir)).filter((f) => !re || re.test(readFileSync(join(ROOT, 'src/content', dir, f), 'utf8'))).length;
  const want = { theses: count('theses', /^degree: master/m), papers: count('publications'), code: count('projects', /^repo:/m) };
  const grantsDir = join(ROOT, 'src/content/grants');
  const grantCount = existsSync(grantsDir) ? readdirSync(grantsDir).length : 0;
  for (const r of ['/', zh('/')]) {
    const about = section(html(r), 'about');
    const block = about.slice(0, about.indexOf('</section>'));
    assert.match(block, /<h2 id="about-h">/, r);
    assert.ok((block.match(/<p>/g) ?? []).length >= 1, `${r}: no introduction text`);
    for (const [k, n] of Object.entries(want)) {
      assert.match(block, new RegExp(`data-stat="${k}"[^>]*>\\s*<span class="stat-n">${n}</span>`), `${r}: ${k} should read ${n}`);
    }
    assert.equal(/data-stat="grants"/.test(block), grantCount >= 3, `${r}: the grants number shows only from 3 grants`);
    const groupDir = join(ROOT, 'src/content/group-photos');
    if (!existsSync(groupDir) || readdirSync(groupDir).length === 0) assert.doesNotMatch(block, /<figure/, `${r}: a figure without a group photo`);
  }
  assert.ok(html('/').indexOf('id="about"') < html('/').indexOf('id="areas-h"'), 'About comes right after the hero');
});

test('/join/ lists every FAQ file as a <details>, grouped by audience', () => {
  const dir = join(ROOT, 'src/content/faq');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)) : [];
  for (const r of ['/join/', zh('/join/')]) {
    const page = html(r);
    if (files.length === 0) { assert.doesNotMatch(page, /id="faq"/, r); continue; }
    const faq = section(page, 'faq');
    const block = faq.slice(0, faq.indexOf('</section>'));
    assert.equal((block.match(/<details class="faq"/g) ?? []).length, files.length, `${r}: one <details> per FAQ file`);
    const audiences = new Set(files.map((f) => readFileSync(join(dir, f), 'utf8').match(/^audience: (\w+)/m)[1]));
    assert.equal((block.match(/<h3 class="faq-audience"/g) ?? []).length, audiences.size, `${r}: one heading per audience`);
  }
});

test('the contact card links a map of the campus and NCUE\'s own directions page', () => {
  for (const r of ['/join/', zh('/join/')]) {
    const card = section(html(r), 'contact');
    assert.match(card, /href="https:\/\/www\.google\.com\/maps\/search\/\?api=1&amp;query=[^"]+"/, `${r}: no map link`);
    assert.match(card, /href="https:\/\/www\.ncue\.edu\.tw\/p\/412-1000-870\.php\?Lang=zh-tw"/, `${r}: no directions link`);
    assert.match(card, /500208/, `${r}: the address needs the 6-digit postcode`);
  }
});

test('with a group photo, About shows the newest as a sized <picture> with AVIF and WebP, captioned with its year', () => {
  const dir = join(ROOT, 'src/content/group-photos');
  const years = existsSync(dir) ? readdirSync(dir).map((f) => f.match(/^(\d{4})\.ya?ml$/)?.[1]).filter(Boolean).sort() : [];
  if (years.length === 0) return; // none yet: the figure-free case is checked in the About test
  for (const r of ['/', zh('/')]) {
    const about = section(html(r), 'about');
    const fig = about.slice(about.indexOf('<figure'), about.indexOf('</figure>'));
    assert.match(fig, /<source[^>]+type="image\/avif"/, `${r}: no AVIF source`);
    assert.match(fig, /<source[^>]+type="image\/webp"/, `${r}: no WebP source`);
    assert.match(fig, /<img[^>]+width="\d+"[^>]*height="\d+"|<img[^>]+height="\d+"[^>]*width="\d+"/, `${r}: the photo has no size`);
    assert.match(fig, new RegExp(`<figcaption[^>]*>[^<]*${years.at(-1)}`), `${r}: caption lacks the year ${years.at(-1)}`);
  }
});
