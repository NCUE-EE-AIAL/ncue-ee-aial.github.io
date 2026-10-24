// Project diagrams (src/assets/project-art/<project>.svg): generated, local, small, coloured by CSS, one per project.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ART = join(ROOT, 'src/assets/project-art');
const GEN = join(ROOT, 'scripts/project-art-gen.mjs');
const svgs = readdirSync(ART).filter((f) => f.endsWith('.svg'));
const src = (f) => readFileSync(join(ART, f), 'utf8');
const CLASSES = new Set(['ink', 'thin', 'con', 'sig', 'key', 'mark', 'paper', 'draw']);

test('scripts/project-art-gen.mjs reproduces src/assets/project-art exactly', () => {
  const out = mkdtempSync(join(tmpdir(), 'project-art-'));
  try {
    execFileSync(process.execPath, [GEN, out], { stdio: 'pipe' });
    assert.deepEqual(readdirSync(out).sort(), [...svgs].sort(), 'the generator and src/assets/project-art must hold the same files');
    for (const f of svgs) assert.equal(readFileSync(join(out, f), 'utf8'), src(f), `${f} differs from the generator output`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test('every drawing belongs to a project', () => {
  const projects = new Set(readdirSync(join(ROOT, 'src/content/projects')).map((f) => f.replace(/\.ya?ml$/, '')));
  for (const f of svgs) assert.ok(projects.has(f.replace(/\.svg$/, '')), `${f} has no src/content/projects/ file`);
});

test('the drawings stay inside a 24 KB budget, load nothing and take every colour from CSS', () => {
  const bytes = svgs.reduce((n, f) => n + statSync(join(ART, f)).size, 0);
  assert.ok(bytes <= 24 * 1024, `project art weighs ${(bytes / 1024).toFixed(1)} KB`);
  for (const f of svgs) {
    const s = src(f);
    assert.doesNotMatch(s, /\/\/|<image\b|<script\b|<foreignObject\b|<a\b|tabindex|data:|\bid="|\bstyle="/i, f);
    assert.doesNotMatch(s, /(?:fill|stroke|stop-color|color)\s*[=:]\s*["']?\s*(?:#|rgb|hsl)/i, f);
    assert.doesNotMatch(s, /\/>/, `${f}: close every element explicitly (compressHTML guard)`);
    for (const m of s.matchAll(/\bclass="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) assert.ok(CLASSES.has(c), `${f}: unknown class "${c}"`);
  }
});

test('project cards show their drawing, hidden from assistive technology', () => {
  const page = join(ROOT, 'dist/projects/index.html');
  if (!existsSync(page)) throw new Error('dist/ is missing: run `npm run build` first');
  const html = readFileSync(page, 'utf8');
  for (const f of svgs) {
    const id = f.replace(/\.svg$/, '');
    const at = html.search(new RegExp(`<article[^>]*\\bid="${id}"`));
    assert.ok(at >= 0, `no card for ${id}`);
    assert.match(html.slice(at, html.indexOf('</article>', at)), /<div class="project-art" aria-hidden="true">\s*<svg/, `${id}: no diagram on its card`);
  }
});

test('package.json exposes `npm run project-art`', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['project-art'], 'node scripts/project-art-gen.mjs');
});
