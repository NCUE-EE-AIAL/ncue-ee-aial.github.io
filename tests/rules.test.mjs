// Content rules shared by the schema (src/content.config.ts) and the tests: src/lib/rules.mjs is plain JS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isLocalPhoto, sponsorEra, GRANT_NO, PARTNER_RE, ymNow, isOngoing } from '../src/lib/rules.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PEOPLE = join(ROOT, 'src/content/people');

test('isLocalPhoto accepts only images under /images/people/', () => {
  for (const ok of ['/images/people/erik.webp', '/images/people/a-b.jpg', '/images/people/a.JPEG', '/images/people/a.png', '/images/people/a.avif']) {
    assert.ok(isLocalPhoto(ok), ok);
  }
  for (const bad of [
    'https://example.com/images/people/a.webp', 'http://x.org/a.jpg', '//cdn.example.com/images/people/a.png',
    '/images/people/a.gif', '/images/people/a.svg', '/images/people/', '/images/people/a', '/images/other/a.webp',
    'images/people/a.webp', '/images/people/../x.webp', '/images/people/sub/a.webp', '/images/people/a.webp?x=1', '', '/images/people/a b.webp',
  ]) assert.ok(!isLocalPhoto(bad), `should reject ${JSON.stringify(bad)}`);
});

test('every photo in src/content/people/*.yaml follows the rule and exists under public/', () => {
  let n = 0;
  for (const f of readdirSync(PEOPLE).filter((x) => /\.ya?ml$/.test(x))) {
    const m = readFileSync(join(PEOPLE, f), 'utf8').match(/^photo:\s*["']?([^"'\n#]+?)["']?\s*(?:#.*)?$/m);
    if (!m) continue;
    n++;
    assert.ok(isLocalPhoto(m[1]), `${f}: ${m[1]} is not a local people photo`);
    assert.ok(existsSync(join(ROOT, 'public', m[1])), `${f}: public${m[1]} does not exist`);
  }
  assert.ok(n >= 3, `only ${n} photos found`);
});

test('the people schema uses the rule with a clear error message', () => {
  const cfg = readFileSync(join(ROOT, 'src/content.config.ts'), 'utf8');
  assert.match(cfg, /from '\.\/lib\/rules\.mjs'/);
  assert.match(cfg, /photo:\s*z\.string\(\)\.refine\(isLocalPhoto,\s*\{\s*error:\s*'[^']*\/images\/people\/[^']*',?\s*\}\)\.optional\(\)/);
});

test('sponsorEra names the agency of a grant by its start month (NSC → MOST 2014-03 → NSTC 2022-07)', () => {
  assert.deepEqual(sponsorEra('2013-08'), ['nsc']);
  assert.deepEqual(sponsorEra('2014-02'), ['nsc']);
  assert.deepEqual(sponsorEra('2014-03').sort(), ['most', 'nsc']);
  assert.deepEqual(sponsorEra('2014-04'), ['most']);
  assert.deepEqual(sponsorEra('2022-06'), ['most']);
  assert.deepEqual(sponsorEra('2022-07').sort(), ['most', 'nstc']);
  assert.deepEqual(sponsorEra('2022-08'), ['nstc']);
});

test('GRANT_NO accepts NSC/MOST/NSTC numbers without the agency prefix', () => {
  for (const ok of ['112-2221-E-018-009-MY2', '108-2622-E-018-002-CC3', '99-2221-E-018-012', '113-2637-E-018-001']) assert.match(ok, GRANT_NO, ok);
  for (const bad of ['MOST 108-2221-E-018-010', '108-2221-E-18-010', '108/2221/E/018/010', '']) assert.doesNotMatch(bad, GRANT_NO, bad);
});

test('PARTNER_RE catches company names in industry projects, not ordinary words', () => {
  for (const name of ['某某能源股份有限公司', '某某科技有限公司', 'Acme Co., Ltd.', 'Example Corp', 'Example Inc.']) assert.match(name, PARTNER_RE, name);
  for (const word of ['Battery energy storage for campus microgrids', 'Industry cooperation on edge AI', '校內儲能系統的 AI 與邊緣運算']) assert.doesNotMatch(word, PARTNER_RE, word);
});

test('a grant is ongoing through its last month', () => {
  const now = new Date('2026-10-18T12:00:00Z');
  assert.equal(ymNow(now), '2026-10');
  assert.equal(isOngoing('2027-07', now), true);
  assert.equal(isOngoing('2026-10', now), true);
  assert.equal(isOngoing('2026-09', now), false);
});
