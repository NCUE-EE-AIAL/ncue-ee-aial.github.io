// public/apple-touch-icon.png is generated from public/favicon.svg by scripts/icons-gen.mjs (`npm run icons`).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPng } from './png.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const GEN = join(ROOT, 'scripts/icons-gen.mjs');
const ICON = join(ROOT, 'public/apple-touch-icon.png');

test('scripts/icons-gen.mjs reproduces public/apple-touch-icon.png exactly', () => {
  assert.ok(existsSync(GEN), 'scripts/icons-gen.mjs is missing');
  const out = mkdtempSync(join(tmpdir(), 'icons-gen-'));
  try {
    execFileSync(process.execPath, [GEN, out], { stdio: 'pipe' });
    assert.ok(readFileSync(join(out, 'apple-touch-icon.png')).equals(readFileSync(ICON)), 'apple-touch-icon.png differs from the generator output');
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test('the apple-touch-icon is a full-bleed 180×180 square in the logo blue', () => {
  const { width, height, at } = readPng(ICON);
  assert.deepEqual([width, height], [180, 180]);
  assert.deepEqual(at(0, 0), [0x1a, 0x56, 0xdb], 'corners must be logo blue: iOS rounds the corners itself');
  assert.deepEqual(at(179, 179), [0x1a, 0x56, 0xdb]);
});

test('package.json exposes `npm run icons` and pins sharp', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.icons, 'node scripts/icons-gen.mjs');
  assert.match(pkg.dependencies?.sharp ?? pkg.devDependencies?.sharp ?? '', /^\d+\.\d+\.\d+$/, 'sharp must be pinned to an exact version');
});
