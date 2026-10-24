// Security and privacy guards: the built pages load nothing from other origins, and the repository holds no
// local AI-assistant settings, secrets or machine paths. The built-site checks read dist/ (run `npm run build` first).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
if (!existsSync(join(DIST, 'index.html'))) throw new Error('dist/ is missing: run `npm run build` first');

function allHtml(dir = DIST) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? allHtml(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []);
}
const pages = allHtml().map((f) => [f.slice(DIST.length), readFileSync(f, 'utf8')]);

test('every page carries the Content-Security-Policy meta tag near the top of <head>', () => {
  for (const [path, html] of pages) {
    const m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
    assert.ok(m, `${path}: no CSP meta tag`);
    assert.ok(html.indexOf(m[0]) < html.indexOf('<script'), `${path}: the CSP must come before the first script`);
    assert.match(m[1], /default-src 'self'/);
    assert.match(m[1], /object-src 'none'/);
    assert.match(m[1], /base-uri 'self'/);
  }
});

test('pages load scripts, styles, images and frames only from this site', () => {
  for (const [path, html] of pages) {
    for (const [, tag, url] of html.matchAll(/<(script|img|iframe|link|source|video|audio)\b[^>]*?\s(?:src|srcset)="(https?:)?\/\//g)) {
      assert.fail(`${path}: <${tag}> loads from another origin${url ? '' : ' (protocol-relative URL)'}`);
    }
    for (const [tag] of html.matchAll(/<link\b[^>]*rel="(?:stylesheet|preload|modulepreload)"[^>]*>/g)) {
      assert.doesNotMatch(tag, /href="(https?:)?\/\//, `${path}: ${tag} points at another origin`);
    }
  }
});

test('links that open a new tab cannot reach back into this page', () => {
  for (const [path, html] of pages) {
    for (const [tag] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
      assert.match(tag, /rel="[^"]*\bnoopener\b/, `${path}: ${tag} needs rel="noopener"`);
    }
  }
});

const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean);
const TEXT = new Set(['.astro', '.ts', '.mjs', '.js', '.md', '.mdx', '.yaml', '.yml', '.json', '.css', '.html', '.xml', '.svg', '.txt', '']);

test('no local assistant settings, env files or keys are committed', () => {
  const bad = tracked.filter((p) =>
    /(^|\/)\.claude\//.test(p) || /(^|\/)CLAUDE(\.local)?\.md$/i.test(p) ||
    /(^|\/)\.env(\.(?!example$)[^/]+)?$/.test(p) || /\.(pem|key|p12|pfx)$/i.test(p) || /(^|\/)id_(rsa|ed25519)/.test(p));
  assert.deepEqual(bad, []);
});

test('no machine paths, assistant session links or access tokens in committed text', () => {
  const PATTERNS = [
    [/(?:\/home\/[a-z][\w-]*\/|\/Users\/[A-Za-z][\w.-]*\/|[A-Z]:\\Users\\[A-Za-z])/, 'a local home-folder path'],
    [/claude\.ai\/code\/(?:session|project)/, 'a link to a private assistant session'],
    [/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sk-ant-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/, 'an access token'],
  ];
  const self = 'tests/security.test.mjs';
  for (const p of tracked) {
    if (p === self || p === 'package-lock.json' || !TEXT.has(extname(p))) continue;
    const text = readFileSync(join(ROOT, p), 'utf8');
    for (const [re, what] of PATTERNS) assert.doesNotMatch(text, re, `${p} contains ${what}`);
  }
});
