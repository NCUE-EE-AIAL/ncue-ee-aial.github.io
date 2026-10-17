// Content rules shared by the schema (src/content.config.ts) and the tests: src/lib/rules.mjs is plain JS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isLocalPhoto } from '../src/lib/rules.mjs';

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
