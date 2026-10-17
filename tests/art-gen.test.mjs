// The background plates are generated: scripts/art-gen.mjs must reproduce src/assets/art/*.svg byte for byte.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ART = join(ROOT, 'src/assets/art');
const GEN = join(ROOT, 'scripts/art-gen.mjs');

test('scripts/art-gen.mjs reproduces src/assets/art exactly', () => {
  assert.ok(existsSync(GEN), 'scripts/art-gen.mjs is missing');
  const out = mkdtempSync(join(tmpdir(), 'art-gen-'));
  try {
    execFileSync(process.execPath, [GEN, out], { stdio: 'pipe' });
    const made = readdirSync(out).sort();
    const committed = readdirSync(ART).filter((f) => f.endsWith('.svg')).sort();
    assert.deepEqual(made, committed, 'the generator and src/assets/art must hold the same set of files');
    for (const f of committed) {
      assert.equal(readFileSync(join(out, f), 'utf8'), readFileSync(join(ART, f), 'utf8'), `${f} differs from the generator output`);
    }
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test('package.json exposes `npm run art`', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.art, 'node scripts/art-gen.mjs');
});
