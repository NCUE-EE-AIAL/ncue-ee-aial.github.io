// Accessibility guards that read the source: hero motion (WCAG 2.2.2), the click-to-load video, the zh brand name wrap.
// The brand check also reads dist/ (run `npm run build` first).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { youtubeWatchUrl } from '../src/lib/format.ts';
import { ui } from '../src/i18n/ui.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const CSS = read('src/styles/global.css');
const HERO = read('src/components/HeroArt.astro');
const DIST = join(ROOT, 'dist');
if (!existsSync(join(DIST, 'index.html'))) throw new Error('dist/ is missing: run `npm run build` first');

/** `{ head, body }` for each top-level block of a stylesheet (comments dropped); call it again on an at-rule's body. */
function blocks(css) {
  const out = [];
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (let i = 0; ;) {
    const open = src.indexOf('{', i);
    if (open < 0) return out;
    let depth = 0, end = open;
    for (; end < src.length; end++) if (src[end] === '{') depth++; else if (src[end] === '}' && --depth === 0) break;
    out.push({ head: src.slice(i, open).trim(), body: src.slice(open + 1, end) });
    i = end + 1;
  }
}
const TOP = blocks(CSS);
/** Every top-level rule whose selector mentions `.hero-art` (not nested in @media/@keyframes). */
const heroRules = () => TOP.filter((r) => !r.head.startsWith('@') && /\.hero-art\b/.test(r.head));
const keyframes = () => TOP.filter((r) => /^@keyframes\s+hero-/.test(r.head)).map((r) => ({ name: r.head.split(/\s+/)[1], body: r.body }));
const reducedMotion = () => TOP.filter((r) => /^@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/.test(r.head)).flatMap((r) => blocks(r.body));
const animationOf = (body) => body.match(/\banimation\s*:([^;]*)/)?.[1] ?? '';

test('the hero cycles only behind a pause button and a reduced-motion stop (WCAG 2.2.2)', () => {
  const animated = heroRules().filter((r) => /\banimation\s*:/.test(r.body));
  assert.ok(animated.length >= 5, `only ${animated.length} animated hero rules found`);
  const loops = animated.filter((r) => /\binfinite\b/.test(animationOf(r.body)));
  if (loops.length === 0) {
    // Played once, it must hold a fully drawn last frame.
    for (const r of animated) assert.match(animationOf(r.body), /\b(forwards|both)\b/, `${r.head} must hold its final frame (animation-fill-mode)`);
    for (const k of keyframes()) {
      const last = k.body.match(/(?:^|[\s,;{}])100%\s*\{([^}]*)\}/)?.[1] ?? '';
      assert.doesNotMatch(last, /opacity:\s*0\s*(?:;|$)/, `${k.name}: the last frame fades the drawing out`);
      assert.doesNotMatch(last, /stroke-dashoffset:\s*1\b/, `${k.name}: the last frame is not drawn`);
    }
    return;
  }
  // A cycle runs longer than 5 s: it needs a pause button that freezes it, and it must stand still under reduced motion.
  const button = HERO.match(/<button\b[^>]*>/)?.[0] ?? '';
  assert.match(button, /\btype="button"/, 'the hero cycles but has no pause <button>');
  assert.match(button, /\baria-pressed="false"/, 'the pause button must expose its state (aria-pressed)');
  assert.ok(heroRules().some((r) => /\.is-paused\b/.test(r.head) && /animation-play-state:\s*paused\s*!important/.test(r.body)),
    'pressing the button must freeze every hero animation (.is-paused, animation-play-state: paused !important)');
  assert.ok(reducedMotion().some((r) => /\.hero-art \*/.test(r.head) && /animation:\s*none\s*!important/.test(r.body)),
    'reduced motion must stop the cycle (.hero-art * { animation: none !important })');
});

test('under prefers-reduced-motion the hero stands still, fully drawn, without its pause button', () => {
  const rm = reducedMotion();
  assert.ok(rm.length > 0, 'missing reduced-motion block');
  assert.ok(rm.some((r) => /\.hero-art \*/.test(r.head) && /animation:\s*none/.test(r.body)), 'hero animations must stop');
  assert.ok(rm.some((r) => /\.hero-toggle\b/.test(r.head) && /display:\s*none/.test(r.body)), 'the pause button has nothing to pause: hide it');
  // What stands still is the resting state: the rules outside `.js` and the paused/off-screen classes must not hide strokes.
  for (const r of heroRules().filter((x) => !/\.js\b|\.is-/.test(x.head))) {
    assert.doesNotMatch(r.body, /stroke-dashoffset:\s*(?!0\b)/, `${r.head}: undrawn at rest`);
    assert.doesNotMatch(r.body, /(?:^|[;\s])opacity:\s*0\s*(?:;|$)/, `${r.head}: invisible at rest`);
  }
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

const narrow = () => TOP.filter((r) => /^@media\s*\(\s*max-width:\s*860px\s*\)/.test(r.head)).flatMap((r) => blocks(r.body));
const ruleFor = (rules, selector) => rules.filter((r) => r.head.split(',').some((h) => h.trim() === selector)).map((r) => r.body).join(';');

test('without JavaScript the phone menu shows its links and hides the buttons that need a script', () => {
  const links = ruleFor(narrow(), 'html:not(.js) .nav-links');
  assert.match(links, /display:\s*flex/, 'html:not(.js) .nav-links must be shown under 860 px');
  assert.match(links, /position:\s*static/, 'html:not(.js) .nav-links must sit in the header, not drop down');
  assert.match(ruleFor(narrow(), 'html:not(.js) .nav-toggle'), /display:\s*none/, 'the menu button does nothing without JS');
  assert.match(ruleFor(TOP, 'html:not(.js) #theme-toggle'), /display:\s*none/, 'the theme button does nothing without JS');
});

test('every page with the site menu keeps the menu list inside the <nav> labelled Main / 主選單, and the theme button reports its state', () => {
  const pages = (function walk(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []);
  })(DIST).map((f) => [f.slice(DIST.length), readFileSync(f, 'utf8')]).filter(([, page]) => page.includes('id="site-nav"'));
  assert.ok(pages.length >= 1, 'no page has the site menu');
  for (const [where, page] of pages) {
    const label = ui['nav.label'][/<html\b[^>]*\blang="zh/.test(page) ? 'zh' : 'en'];
    const nav = page.match(new RegExp(`<nav\\b[^>]*\\baria-label="${label}"[^>]*>[\\s\\S]*?</nav>`))?.[0];
    assert.ok(nav, `${where}: no <nav aria-label="${label}">`);
    assert.match(nav, /\bid="nav-links"[\s\S]*?<a\b/, `${where}: the menu list belongs inside the <nav>`);
    assert.match(page, /<button id="theme-toggle"[^>]*\baria-pressed="false"/, `${where}: the theme button needs aria-pressed`);
  }
});
