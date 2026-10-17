// Master's theses advised: the content collection (src/content/theses/) and its section on the built People pages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ayLabel } from '../src/lib/format.ts';
import { AY_MIN, ayMax } from '../src/lib/rules.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(ROOT, 'src/content/theses');
const DIST = join(ROOT, 'dist');
const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith('.yaml')).sort() : [];
const read = (f) => readFileSync(join(DIR, f), 'utf8');
const field = (text, name) => text.match(new RegExp(`^${name}: *(.+?) *$`, 'm'))?.[1];
const unq = (s) => s?.replace(/^"(.*)"$/, '$1');
const theses = files.map((f) => {
  const text = read(f);
  return { f, text, degree: field(text, 'degree'), ay: Number(field(text, 'ay')), url: unq(field(text, 'url')), zh: unq(field(text, '  zh')) };
});

// The expected count is whatever the directory holds (78 when this test was written), so a new thesis needs no test edit.
const MASTER = theses.filter((t) => t.degree === 'master').length;
const PHD = theses.filter((t) => t.degree === 'phd').length;

test('the collection has at least 78 files, each named <ay>-<handle id>.yaml', () => {
  assert.ok(files.length >= 78, `${files.length} files`);
  assert.equal(MASTER + PHD, files.length, 'every file has degree master or phd');
  for (const t of theses) assert.equal(t.f, `${t.ay}-${t.url?.split('/').pop()}.yaml`, t.f);
});

test('every thesis url is https://hdl.handle.net/11296/<id>, none twice, ay within the schema range', () => {
  for (const t of theses) {
    assert.match(t.url ?? '', /^https:\/\/hdl\.handle\.net\/11296\/[a-z0-9]+$/, t.f);
    assert.ok(Number.isInteger(t.ay) && t.ay >= AY_MIN && t.ay <= ayMax(), `${t.f}: ay ${t.ay}`);
  }
  assert.equal(new Set(theses.map((t) => t.url)).size, theses.length, 'duplicate url');
});

test('ayLabel: zh "113 學年度", en "2024–25"', () => {
  assert.equal(ayLabel(113, 'zh'), '113 學年度');
  assert.equal(ayLabel(113, 'en'), '2024–25');
  assert.equal(ayLabel(114, 'en'), '2025–26');
  assert.equal(ayLabel(95, 'en'), '2006–07');
  assert.equal(ayLabel(88, 'en'), '1999–00');
});

if (!existsSync(join(DIST, 'index.html'))) throw new Error('dist/ is missing: run `npm run build` first');
const page = (route) => readFileSync(join(DIST, route, 'index.html'), 'utf8');
const thesesOf = (html) => {
  const start = html.indexOf('id="theses"');
  assert.ok(start >= 0, 'no id="theses" section');
  return html.slice(start, html.indexOf('</section>', start));
};
const linksIn = (html) => [...html.matchAll(/<a [^>]*href="(https:\/\/hdl\.handle\.net\/11296\/[^"]+)"/g)].map((m) => m[1]);
const labels = { '/people/': (y) => ayLabel(y, 'en'), '/zh/people/': (y) => ayLabel(y, 'zh') };
const masters = theses.filter((t) => t.degree === 'master');
const years = [...new Set(masters.map((t) => t.ay))].sort((a, b) => b - a);

for (const route of ['/people/', '/zh/people/']) {
  test(`${route}: the theses section has one link per master's thesis in the directory, grouped newest year first`, () => {
    const sec = thesesOf(page(route));
    assert.equal(linksIn(sec).length, MASTER);
    assert.equal(new Set(linksIn(sec)).size, MASTER);
    assert.match(sec, new RegExp(`<span class="count">${MASTER}</span>`));
    const heads = [...sec.matchAll(/<h3[^>]*class="thesis-year"[^>]*>([^<]+)<\/h3>/g)].map((m) => m[1].trim());
    assert.deepEqual(heads, years.map(labels[route]));
    // the links inside each group are that year's theses
    const groups = sec.split(/<h3[^>]*class="thesis-year"/).slice(1);
    years.forEach((y, i) => {
      const want = masters.filter((t) => t.ay === y).map((t) => t.url).sort();
      assert.deepEqual(linksIn(groups[i]).sort(), want, `${route} ${y}`);
    });
  });

  test(`${route}: the three newest year groups are open, the older ones sit inside one <details>`, () => {
    const sec = thesesOf(page(route));
    const open = sec.indexOf('<details'), close = sec.indexOf('</details>');
    assert.ok(open > 0 && close > open, 'no <details>');
    assert.equal((sec.match(/<details/g) ?? []).length, 1);
    assert.ok(!/<details[^>]* open/.test(sec), 'details must start closed');
    const before = sec.slice(0, open), inside = sec.slice(open, close);
    const newest = years.slice(0, 3).map(labels[route]), older = years.slice(3).map(labels[route]);
    for (const l of newest) assert.ok(before.includes(l) && !inside.includes(l), `${l} must be outside <details>`);
    for (const l of older) assert.ok(inside.includes(l) && !before.includes(l), `${l} must be inside <details>`);
    const nOlder = masters.filter((t) => t.ay < years[2]).length;
    assert.equal(linksIn(inside).length, nOlder);
    assert.equal(linksIn(before).length, MASTER - nOlder);
    const summary = inside.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1] ?? '';
    assert.ok(summary.includes(String(nOlder)), `summary lacks ${nOlder}: ${summary}`);
    assert.match(summary, route === '/people/' ? /Show earlier theses/ : /顯示更早的論文/);
  });
}

const item = (html, needle) => {
  const sec = thesesOf(html);
  const lis = [...sec.matchAll(/<li[^>]*>[\s\S]*?<\/li>/g)].map((m) => m[0]).filter((li) => li.includes(needle));
  assert.equal(lis.length, 1, `${needle}: ${lis.length} items`);
  return lis[0];
};

test('co-advisor note: 蔣豪耘 is "co-advised with 陳良瑞" / 「共同指導：陳良瑞」; a sole-advisor thesis has none', () => {
  assert.match(item(page('/people/'), '蔣豪耘'), /co-advised with (?:<span[^>]*>)?陳良瑞/);
  assert.match(item(page('/zh/people/'), '蔣豪耘'), /共同指導：陳良瑞/);
  assert.ok(!/co-advised|共同指導/.test(item(page('/zh/people/'), '劉子緒')));
});

test('student names: the en page shows "Nikola Radakovic", the zh page 羅倪可; titles follow the page language', () => {
  const en = item(page('/people/'), 'Nikola Radakovic'), zhItem = item(page('/zh/people/'), '羅倪可');
  assert.ok(!en.includes('羅倪可'));
  assert.ok(en.includes('Novel Synchronous Motor Torque Control by Using Volder’s Algorithm'));
  assert.ok(zhItem.includes('使用Volder演算法於同步馬達扭力控制') && !zhItem.includes('Radakovic'));
  assert.ok(zhItem.includes('資訊工程學系') && en.includes('資訊工程學系'), 'dept shown');
  assert.ok(item(page('/people/'), 'Varsha Krishnamurthy').includes('Multimodal Fusion for a Photovoltaic System Power Quality Analysis'));
  assert.ok(!item(page('/people/'), '劉子緒').includes('電機工程學系'), 'no dept for the default department');
});

test('a thesis without an English title falls back to the Chinese one on the en page', () => {
  assert.ok(item(page('/people/'), '陳銘裕').includes('自動化磨邊倒角機拋光輪監控系統之研究'));
});

test('thesis section guards: no images, scripts or mail addresses inside', () => {
  for (const route of ['/people/', '/zh/people/']) {
    const sec = thesesOf(page(route));
    assert.ok(!/<img|<script|mailto:|@/.test(sec), route);
  }
});

// Language of parts (WCAG 3.1.2): text in another language than the page carries its own lang attribute.
const textOf = (html) => html.replace(/<[^>]+>/g, '');
const withoutLang = (html, lang) => html.replace(new RegExp(`<(\\w+)\\b[^>]*\\slang="${lang}"[^>]*>[\\s\\S]*?</\\1>`, 'g'), '');
const openTag = (li, needle) => li.match(new RegExp(`<[^<>]*>(?=[^<]*${needle})`))?.[0] ?? '';

test('/people/: every Chinese run in the theses section sits inside lang="zh-Hant-TW"', () => {
  const rest = textOf(withoutLang(thesesOf(page('/people/')), 'zh-Hant-TW'));
  assert.ok(!/\p{Script=Han}/u.test(rest), `untagged Chinese: ${rest.match(/.{0,20}\p{Script=Han}+.{0,10}/u)?.[0]}`);
  const li = item(page('/people/'), '劉子緒');
  assert.match(openTag(li, '劉子緒'), /lang="zh-Hant-TW"/, 'student name');
  assert.match(openTag(item(page('/people/'), '蔣豪耘'), '陳良瑞'), /lang="zh-Hant-TW"/, 'co-advisor');
  assert.match(openTag(item(page('/people/'), 'Nikola Radakovic'), '資訊工程學系'), /lang="zh-Hant-TW"/, 'dept');
  assert.match(openTag(item(page('/people/'), '陳銘裕'), '自動化磨邊倒角機'), /lang="zh-Hant-TW"/, 'fallback title');
  assert.ok(!/lang="zh-Hant-TW"[^>]*>Nikola/.test(page('/people/')), 'Latin name must not be tagged zh');
});

test('/zh/people/: a Latin-script student name carries lang="en"', () => {
  for (const name of ['Monica', 'Varsha Krishnamurthy']) {
    assert.match(openTag(item(page('/zh/people/'), name), name), /lang="en"/, name);
  }
  assert.ok(!/lang="en"[^>]*>羅倪可/.test(page('/zh/people/')));
});

test('international students: the same Latin name on both pages, never the recorded capitals', () => {
  for (const route of ['/people/', '/zh/people/']) {
    const html = thesesOf(page(route));
    for (const name of ['Monica', 'Varsha Krishnamurthy']) assert.ok(item(page(route), name), `${route} ${name}`);
    assert.ok(!/MONICA|VARSHA KRISHNAMURTHY/.test(html), `${route} shows the all-caps record`);
  }
});

test('PhD dissertations: a separate section appears only when a phd thesis exists', () => {
  for (const [route, heading] of [['/people/', 'PhD dissertations advised'], ['/zh/people/', '指導博士論文']]) {
    const html = page(route);
    assert.equal(html.includes(heading), PHD > 0, `${route} ${heading} vs ${PHD} phd files`);
    assert.equal(html.includes('id="phd-theses"'), PHD > 0, route);
  }
});
