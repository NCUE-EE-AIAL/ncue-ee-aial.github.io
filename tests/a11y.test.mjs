// Accessibility guards that read the source: hero motion (WCAG 2.2.2), the click-to-load video, the zh brand name wrap.
// The brand check also reads dist/ (run `npm run build` first).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { youtubeWatchUrl } from '../src/lib/format.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const CSS = read('src/styles/global.css');
const DIST = join(ROOT, 'dist');
if (!existsSync(join(DIST, 'index.html'))) throw new Error('dist/ is missing: run `npm run build` first');

/** Every `selector { body }` rule whose selector mentions `.hero-art` (not nested in @media/@keyframes). */
const heroRules = () => [...CSS.matchAll(/(^|\n)(\.hero-art[^{}]*)\{([^{}]*)\}/g)].map((m) => ({ sel: m[2].trim(), body: m[3] }));
const keyframes = () => [...CSS.matchAll(/@keyframes\s+(hero-[\w-]+)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g)].map((m) => ({ name: m[1], body: m[2] }));

test('the hero animation plays once and stays fully drawn (WCAG 2.2.2)', () => {
  const animated = heroRules().filter((r) => /\banimation\s*:/.test(r.body));
  assert.ok(animated.length >= 5, `only ${animated.length} animated hero rules found`);
  for (const r of animated) {
    const decl = r.body.match(/\banimation\s*:([^;]*)/)[1];
    assert.doesNotMatch(decl, /infinite|(?<![\w.])(?:[2-9]|\d{2,})(?![\w.])/, `${r.sel} must not loop`);
    assert.match(decl, /\b(forwards|both)\b/, `${r.sel} must hold its final frame (animation-fill-mode)`);
  }
  const frames = keyframes();
  assert.ok(frames.length >= 5, `only ${frames.length} hero keyframes`);
  for (const k of frames) {
    const last = k.body.match(/(?:^|[\s,;{}])100%\s*\{([^}]*)\}/)?.[1] ?? '';
    assert.doesNotMatch(last, /opacity:\s*0\s*[;}]|opacity:\s*0$/, `${k.name}: the last frame fades the drawing out`);
    assert.doesNotMatch(last, /stroke-dashoffset:\s*1\b/, `${k.name}: the last frame is not drawn`);
  }
});

test('under prefers-reduced-motion the hero is drawn at once, without animation', () => {
  const m = CSS.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/);
  assert.ok(m, 'missing reduced-motion block');
  assert.match(m[1], /\.hero-art \*[^{]*\{[^}]*animation:\s*none/);
  assert.match(m[1], /\.hero-art \.draw\s*\{[^}]*stroke-dashoffset:\s*0/);
});

test('youtubeWatchUrl links to the video on YouTube', () => {
  assert.equal(youtubeWatchUrl('dQw4w9WgXcQ'), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
});

test('click-to-load video: a <noscript> link to YouTube, focus moves to the new iframe, no third-party JS', () => {
  const src = read('src/components/VideoEmbed.astro');
  const markup = src.slice(0, src.indexOf('<script'));
  const script = src.slice(src.indexOf('<script'));
  assert.match(markup, /<noscript>\s*<a\b[^>]*href=\{youtubeWatchUrl\(id\)\}[^>]*>[^<{]*\{[^}]+\}[^<]*<\/a>\s*<\/noscript>/, 'missing <noscript><a href=youtube watch url>');
  assert.match(script, /replaceChildren\(frame\)[\s\S]*frame\.focus\(\)/, 'the iframe must receive focus after it replaces the button');
  assert.doesNotMatch(script, /<script[^>]*\ssrc=|import\s*\(|importScripts|createElement\(\s*['"]script['"]\)/, 'the script must stay first-party and inline');
  assert.doesNotMatch(script.replace(/frame\.src = `https:\/\/www\.youtube-nocookie\.com\/embed\/[^`]*`/, ''), /https?:\/\//, 'nothing but the click-time iframe may name another host');
});

test('the Chinese brand name breaks as 人工智慧 / 應用實驗室, the English one is untouched', () => {
  const brand = (route) => readFileSync(join(DIST, route, 'index.html'), 'utf8').match(/<a class="brand"[\s\S]*?<\/a>/)[0];
  assert.match(brand('zh'), /人工智慧<wbr[^>]*>應用實驗室/);
  assert.doesNotMatch(brand(''), /<wbr/);
  assert.match(brand(''), /AI Application Laboratory/);
  assert.match(CSS, /:lang\(zh\)\s+\.brand\s*\{[^}]*overflow-wrap:\s*normal/, 'zh brand must not break anywhere');
  assert.match(CSS, /\.brand\s*\{[^}]*word-break:\s*keep-all/);
});
