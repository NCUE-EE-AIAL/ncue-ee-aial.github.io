// The hero is generated: scripts/hero-gen.mjs must reproduce src/components/HeroArt.astro byte for byte.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const GEN = join(ROOT, 'scripts/hero-gen.mjs');

test('scripts/hero-gen.mjs reproduces src/components/HeroArt.astro exactly', () => {
  assert.ok(existsSync(GEN), 'scripts/hero-gen.mjs is missing');
  const dir = mkdtempSync(join(tmpdir(), 'hero-gen-'));
  try {
    const out = join(dir, 'HeroArt.astro');
    execFileSync(process.execPath, [GEN, out], { stdio: 'pipe' });
    assert.equal(readFileSync(out, 'utf8'), readFileSync(join(ROOT, 'src/components/HeroArt.astro'), 'utf8'), 'HeroArt.astro differs from the generator output: edit the generator, then run `npm run hero`');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('package.json exposes `npm run hero` and `npm run verify:hero`, and the browser check ships with its driver', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.hero, 'node scripts/hero-gen.mjs');
  assert.equal(pkg.scripts['verify:hero'], 'node scripts/hero-verify.mjs');
  for (const f of ['scripts/hero-verify.mjs', 'scripts/lib/cdp.mjs']) assert.ok(existsSync(join(ROOT, f)), `${f} is missing`);
});

test('the browser check is a documented local tool that scrolls to the pause button and asserts it is pressed before a paused screenshot', () => {
  const verify = readFileSync(join(ROOT, 'scripts/hero-verify.mjs'), 'utf8');
  const cdp = readFileSync(join(ROOT, 'scripts/lib/cdp.mjs'), 'utf8');
  assert.match(verify.split('\n').slice(0, 12).join('\n'), /google-chrome[\s\S]*not run in CI|not run in CI[\s\S]*google-chrome/i, 'the header must say it needs google-chrome and is not run in CI');
  assert.match(cdp, /async click\([^)]*\)\s*\{[\s\S]*?scrollIntoView[\s\S]*?getBoundingClientRect/, 'click() must scroll the target into view before measuring it');
  // every paused screenshot is preceded by an aria-pressed="true" assertion
  const lines = verify.split('\n');
  const shots = lines.map((l, i) => (/shot\([^)]*paused/.test(l) ? i : -1)).filter((i) => i >= 0);
  assert.ok(shots.length >= 2, 'expected paused screenshots in the check');
  for (const i of shots) {
    const before = lines.slice(Math.max(0, i - 6), i).join('\n');
    assert.match(before, /check\([^\n]*pressed === 'true'/, `line ${i + 1}: a paused screenshot without a preceding aria-pressed="true" check`);
  }
});
