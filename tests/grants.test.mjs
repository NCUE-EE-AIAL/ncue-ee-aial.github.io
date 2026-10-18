// Funded projects on /projects/: every grants file is listed in both languages, ongoing before completed,
// and industry (產學) projects show no partner, number or link. Run `npm run build` first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isOngoing } from '../src/lib/rules.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const DIR = join(ROOT, 'src/content/grants');
if (!existsSync(join(DIST, 'index.html'))) throw new Error('dist/ is missing: run `npm run build` first');
const html = (route) => readFileSync(join(DIST, route, 'index.html'), 'utf8');
const grants = (existsSync(DIR) ? readdirSync(DIR).filter((f) => /\.ya?ml$/.test(f)) : []).map((f) => {
  const y = readFileSync(join(DIR, f), 'utf8');
  return {
    id: f.replace(/\.ya?ml$/, ''),
    en: y.match(/^title:\n\s+en: "([^"]+)"/m)[1],
    zh: y.match(/^title:\n\s+en: "[^"]+"\n\s+zh: "([^"]+)"/m)?.[1],
    end: y.match(/^end: "?(\d{4}-\d{2})"?/m)[1],
    sponsor: y.match(/^sponsor: (\w+)/m)[1],
  };
});
const block = (page, id) => {
  const i = page.indexOf(`id="${id}"`);
  return i < 0 ? '' : page.slice(i, page.indexOf('</section>', i));
};

test('/projects/ lists every grant in both languages, or has no grants section when there are none', () => {
  for (const [route, key] of [['/projects/', 'en'], ['/zh/projects/', 'zh']]) {
    const sec = block(html(route), 'grants');
    if (grants.length === 0) { assert.equal(sec, '', `${route}: empty grants section`); continue; }
    for (const g of grants) assert.ok(sec.includes(`id="${g.id}"`) && sec.includes(g[key] ?? g.en), `${route}: ${g.id} missing`);
  }
});

test('ongoing grants come first; completed ones follow in their own list', () => {
  const page = html('/projects/');
  const ongoing = block(page, 'grants-ongoing');
  const completed = block(page, 'grants-completed');
  for (const g of grants) {
    const where = isOngoing(g.end) ? ongoing : completed;
    assert.ok(where.includes(`id="${g.id}"`), `${g.id} (ends ${g.end}) is in the wrong list`);
  }
  if (ongoing && completed) assert.ok(page.indexOf('id="grants-ongoing"') < page.indexOf('id="grants-completed"'));
});

test('industry projects show no grant number and no link', () => {
  const page = html('/projects/');
  for (const g of grants.filter((x) => x.sponsor === 'industry')) {
    const m = page.match(new RegExp(`<(li|article)[^>]*id="${g.id}"`));
    assert.ok(m, `${g.id} is not on /projects/`);
    const item = page.slice(m.index, page.indexOf(`</${m[1]}>`, m.index));
    // Area chips link to our own research pages; any other link, a number or a GRB link would point at the partner.
    assert.doesNotMatch(item, /class="grant-no"|class="grant-link"|<a (?![^>]*class="chip[" ])/, `${g.id} names its partner or links out`);
  }
});

test('grants come before the code projects, and the Chinese nav says 計畫與專案', () => {
  const page = html('/zh/projects/');
  assert.ok(page.includes('id="code"'), 'no code section');
  if (grants.length > 0) assert.ok(page.indexOf('id="grants"') < page.indexOf('id="code"'));
  assert.match(page, /<a[^>]+href="\/zh\/projects\/"[^>]*>計畫與專案<\/a>/);
});
