// Home hero (HeroArt.astro): the lab's research topics drawn in turn, one cycle, a pause button.
// Reads the component, global.css and the built home pages in dist/ (run `npm run build` first).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ui } from '../src/i18n/ui.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const DIST = join(ROOT, 'dist');
if (!existsSync(join(DIST, 'index.html'))) throw new Error('dist/ is missing: run `npm run build` first');

const SCENES = ['emotion', 'emg', 'stereo', 'arm', 'power'];
const CSS = read('src/styles/global.css').replace(/\/\*[\s\S]*?\*\//g, '');
const SRC = read('src/components/HeroArt.astro');
const MARKUP = SRC.replace(/^---[\s\S]*?\n---/, '').split('<script')[0];
const SCRIPT = SRC.includes('<script') ? SRC.slice(SRC.indexOf('<script')) : '';

/** The hero block of a built page: `<div class="hero-art">` up to its own `</div>` (it holds no other div). */
function hero(route) {
  const page = readFileSync(join(DIST, route, 'index.html'), 'utf8');
  const m = page.match(/<div class="hero-art"[^>]*>[\s\S]*?<\/div>/);
  assert.ok(m, `no hero art on ${route}`);
  return m[0];
}
/** The illustration itself: the first <svg> of the hero (the button's icon comes after it). */
const art = (block) => block.match(/<svg\b[\s\S]*?<\/svg>/)[0];
const tags = (s) => [...s.matchAll(/<(\w+)\b([^>]*)>/g)]
  .map((m) => ({ name: m[1], attrs: m[2], cls: m[2].match(/\bclass="([^"]*)"/)?.[1].split(/\s+/) ?? [] }));
const scenes = (svg) => svg.split(/(?=<g\b[^>]*\bdata-scene=")/).slice(1)
  .map((part) => ({ name: part.match(/data-scene="([\w-]+)"/)[1], tags: tags(part) }));
/** `{ head, body }` for each top-level block of a stylesheet; call it again on an at-rule's body. */
function blocks(css) {
  const out = [];
  for (let i = 0; ;) {
    const open = css.indexOf('{', i);
    if (open < 0) return out;
    let depth = 0, end = open;
    for (; end < css.length; end++) if (css[end] === '{') depth++; else if (css[end] === '}' && --depth === 0) break;
    out.push({ head: css.slice(i, open).trim(), body: css.slice(open + 1, end) });
    i = end + 1;
  }
}
const TOP = blocks(CSS);
/** Top-level rules (not inside @media or @keyframes) whose selector mentions the hero. */
const heroRules = () => TOP.filter((r) => !r.head.startsWith('@') && /\.hero-(?:art|toggle)\b/.test(r.head));
const keyframesBody = (name) => {
  const k = TOP.find((r) => new RegExp(`^@keyframes\\s+${name}$`).test(r.head));
  assert.ok(k, `missing @keyframes ${name}`);
  return k.body;
};
const LABEL = ui['home.hero.pause'];

test('the hero cycles through the five research scenes, in order', () => {
  for (const route of ['', 'zh']) {
    assert.deepEqual(scenes(art(hero(route))).map((s) => s.name), SCENES, `/${route}`);
  }
});

test('the scene slots tile one 20–30 s cycle, in markup order, and every hero animation runs on it', () => {
  const cycle = Number(CSS.match(/\.hero-art\s*\{[^}]*--cycle:\s*([\d.]+)s/)?.[1]);
  assert.ok(cycle >= 20 && cycle <= 30, `--cycle is ${cycle}s`);
  const slot = cycle / SCENES.length;
  const at = new Map([...CSS.matchAll(/\.scene:nth-child\((\d+)\)\s*\{[^}]*--at:\s*(-?[\d.]+)s/g)].map((m) => [Number(m[1]), Number(m[2])]));
  for (let k = 1; k <= SCENES.length; k++) {
    const start = (((at.get(k) ?? 0) % cycle) + cycle) % cycle; // when scene k starts, in seconds into the cycle
    assert.ok(Math.abs(start - (k - 1) * slot) < 0.01, `scene ${k} (${SCENES[k - 1]}) starts at ${start}s, expected ${(k - 1) * slot}s`);
  }
  // A scene is visible for exactly its slot: hero-slot hides it from 100/N % of the cycle on.
  const frames = [...keyframesBody('hero-slot').matchAll(/([\d.%,\s]+)\{([^}]*)\}/g)].map((m) => ({ at: m[1].split(',').map((p) => parseFloat(p)), body: m[2] }));
  const lastVisible = Math.max(...frames.filter((f) => /visibility:\s*visible/.test(f.body)).flatMap((f) => f.at));
  assert.ok(Math.abs(lastVisible - 100 / SCENES.length) < 0.05, `hero-slot keeps a scene visible to ${lastVisible}%, expected ${100 / SCENES.length}%`);
  const animated = heroRules().filter((r) => /\banimation\s*:/.test(r.body));
  assert.ok(animated.length >= 5, `only ${animated.length} animated hero rules`);
  for (const r of animated) assert.match(r.body, /\banimation\s*:[^;]*var\(--cycle\)[^;]*\binfinite\b/, `${r.head} is off the shared cycle`);
});

/** Frames of a @keyframes block: `{ at: [percentages], body }`. */
const frames = (name) => [...keyframesBody(name).matchAll(/([\d.%,\s]+)\{([^}]*)\}/g)].map((m) => ({ at: m[1].split(',').map((p) => parseFloat(p)), body: m[2] }));
/** For an element keyframe: when the element is complete (first held percentage) and when it is released (last held one). */
const hold = (name) => {
  const f = frames(name).find((x) => x.at.length >= 2 && /opacity:\s*1\b/.test(x.body));
  assert.ok(f, `@keyframes ${name} has no held (opacity 1) frame`);
  return { done: Math.min(...f.at), release: Math.max(...f.at) };
};
const ELEMENT_KEYFRAMES = ['hero-fade', 'hero-draw', 'hero-trace', 'hero-pop'];

test('every element starts late by --at + --dt, finishes before its scene fades, and is released only after the slot ends', () => {
  const cycle = Number(CSS.match(/\.hero-art\s*\{[^}]*--cycle:\s*([\d.]+)s/)?.[1]);
  // 1. The delay rule is what puts scenes 2-5 on their own slot and staggers the elements; without it they show as empty plates.
  const delay = TOP.find((r) => /^\.js \.hero-art :is\(\s*\.fade,\s*\.draw,\s*\.trace,\s*\.pop\s*\)$/.test(r.head));
  assert.ok(delay, 'missing the `.js .hero-art :is(.fade, .draw, .trace, .pop)` rule');
  assert.match(delay.body, /animation-delay:\s*calc\(\s*var\(--at\b[^)]*\)\s*\+\s*var\(--dt\b[^)]*\)\s*\)/, 'the delay rule must be calc(var(--at) + var(--dt))');
  // 2. The latest-starting element (largest --dt) must finish its slowest animation before hero-slot starts to fade the scene.
  const dts = [...CSS.matchAll(/\.hero-art\s+\.t\d+\s*\{[^}]*--dt:\s*([\d.]+)s/g)].map((m) => Number(m[1]));
  assert.ok(dts.length >= 1, 'no .tN { --dt } rules');
  const maxDt = Math.max(...dts);
  const slotFrames = frames('hero-slot');
  const fadeStart = Math.max(...slotFrames.filter((f) => /visibility:\s*visible/.test(f.body) && /opacity:\s*1\b/.test(f.body)).flatMap((f) => f.at)) * cycle / 100;
  const slowest = Math.max(...ELEMENT_KEYFRAMES.map((n) => hold(n).done)) * cycle / 100;
  assert.ok(maxDt + slowest <= fadeStart + 0.01, `the last element (--dt ${maxDt}s) is complete at ${(maxDt + slowest).toFixed(2)}s but the scene fades from ${fadeStart.toFixed(2)}s`);
  // 3. An element is released (reset to hidden) only after its scene's slot is over, so it never blinks away inside the slot.
  const slotEnd = 100 / SCENES.length;
  for (const n of ELEMENT_KEYFRAMES) assert.ok(hold(n).release >= slotEnd, `${n} is released at ${hold(n).release}%, before the slot ends at ${slotEnd}%`);
});

test('each scene speaks the hero language: construction lines, ink, one signal line, key dots', () => {
  const list = scenes(art(hero('')));
  assert.equal(list.length, SCENES.length, `expected ${SCENES.length} scenes, found ${list.length}`);
  for (const s of list) {
    const n = (c) => s.tags.filter((t) => t.cls.includes(c)).length;
    assert.ok(n('con') + n('dim') >= 1, `${s.name}: no construction lines`);
    assert.ok(n('ink') >= 1, `${s.name}: no ink`);
    assert.equal(n('sig'), 1, `${s.name}: expected one signal line`);
    assert.ok(n('key') >= 1, `${s.name}: no key dots`);
  }
});

test('the pause button is a real <button> with aria-pressed and the en / zh label from ui.ts', () => {
  assert.ok(LABEL?.en && LABEL?.zh && LABEL.en !== LABEL.zh, "ui.ts needs 'home.hero.pause' in en and zh");
  for (const [route, label] of [['', LABEL.en], ['zh', LABEL.zh]]) {
    const block = hero(route);
    const buttons = tags(block).filter((t) => t.name === 'button');
    assert.equal(buttons.length, 1, `/${route}: expected one button in the hero`);
    const b = buttons[0].attrs;
    assert.match(b, /\btype="button"/);
    assert.match(b, /\baria-pressed="false"/);
    assert.ok(b.includes(`aria-label="${label}"`), `/${route}: the button is not labelled "${label}"`);
    assert.match(art(block).match(/<svg\b[^>]*>/)[0], /\baria-hidden="true"/, `/${route}: the drawing must be aria-hidden`);
    assert.doesNotMatch(art(block), /<button|<a\b|tabindex/, `/${route}: the drawing holds something focusable`);
    assert.doesNotMatch(block.match(/<div class="hero-art"[^>]*>/)[0], /aria-hidden/, `/${route}: the button must not sit in an aria-hidden box`);
  }
});

test('without JS the hero is a still, fully drawn first scene and the button stays hidden', () => {
  const rules = heroRules();
  const base = rules.find((r) => /^\.hero-toggle$/.test(r.head));
  assert.ok(base, 'missing a .hero-toggle rule');
  assert.match(base.body, /display:\s*none/, 'the button shows without JS');
  assert.ok(rules.some((r) => /^\.js \.hero-toggle$/.test(r.head) && /display:\s*(?!none)\w/.test(r.body)), 'the button never shows with JS');
  for (const r of rules.filter((x) => /\banimation\s*:/.test(x.body))) {
    for (const sel of r.head.split(',')) assert.match(sel.trim(), /^\.js\s/, `${sel.trim()} animates without JS`);
  }
  assert.ok(rules.some((r) => /\.scene\s*\+\s*\.scene|\.scene:not\(:first-child\)/.test(r.head) && /visibility:\s*hidden/.test(r.body)),
    'at rest only the first scene may show');
});

test('pausing freezes the cycle on the current scene, fully drawn; off screen it freezes too', () => {
  const rules = heroRules();
  const paused = rules.filter((r) => /\.hero-art\.is-paused\b/.test(r.head));
  assert.ok(paused.some((r) => /animation-play-state:\s*paused\s*!important/.test(r.body)), 'paused: the cycle keeps running');
  assert.ok(paused.some((r) => /\.draw\b/.test(r.head) && /stroke-dashoffset:\s*0\s*!important/.test(r.body)), 'paused: strokes stay half drawn');
  assert.ok(paused.some((r) => /\.trace\b/.test(r.head) && /stroke-dashoffset:\s*0\s*!important/.test(r.body)), 'paused: the signal stays half drawn');
  assert.ok(paused.some((r) => /\.scene\b/.test(r.head) && /opacity:\s*1\s*!important/.test(r.body)), 'paused: a fading scene stays faded');
  assert.ok(rules.some((r) => /\.hero-art\.is-off\b/.test(r.head) && /animation-play-state:\s*paused\s*!important/.test(r.body)), 'off screen: the cycle keeps running');
  assert.match(SCRIPT, /aria-pressed/, 'the script must flip aria-pressed');
  assert.match(SCRIPT, /['"]is-paused['"]/);
  assert.match(SCRIPT, /IntersectionObserver[\s\S]*['"]is-off['"]/, 'the script must pause the cycle off screen');
});

test('the hero script is first-party, inline and a few lines long', () => {
  assert.ok(SCRIPT, 'HeroArt.astro has no <script>');
  assert.doesNotMatch(SCRIPT, /<script[^>]*\ssrc=|\bimport\b|https?:|\/\/[\w.-]+\.\w/, 'the script must not load anything');
  const lines = SCRIPT.split('\n').filter((l) => l.trim() && !/^\s*(\/\/|<\/?script)/.test(l)).length;
  assert.ok(lines <= 15, `the script has ${lines} lines`);
});

test('the hero art loads nothing, holds no text or raster, and weighs at most 25 KB', () => {
  for (const route of ['', 'zh']) {
    const svg = art(hero(route));
    assert.doesNotMatch(svg, /https?:|\/\/|<image\b|<text\b|<foreignObject\b|<use\b|@import|data:/i, `/${route}`);
    for (const m of svg.matchAll(/(?:href="|url\()([^")]*)/g)) assert.match(m[1], /^#[\w-]+$/, `/${route} points at ${m[1]}`);
    const kb = Buffer.byteLength(svg) / 1024;
    assert.ok(kb <= 25, `/${route}: the hero SVG weighs ${kb.toFixed(1)} KB`);
  }
});

test('the pause button has a visible boundary (3:1 against the plate, WCAG 1.4.11) in the light and the dark theme', () => {
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  // Token sets: light = :root; dark = the data-theme block and the prefers-color-scheme block (checked to agree on these tokens).
  const media = blocks(TOP.find((r) => /^@media\s*\(prefers-color-scheme:\s*dark\)$/.test(r.head)).body).find((r) => /^:root:not\(\[data-theme=.light.\]\)$/.test(r.head));
  const themes = {
    light: TOP.find((r) => r.head === ':root'),
    dark: TOP.find((r) => /^:root\[data-theme=.dark.\]$/.test(r.head)),
    'dark (system)': media,
  };
  const token = (set, name) => hex(set.body.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1] ?? assert.fail(`${name} missing`));
  const varOf = (decl) => decl?.match(/var\(--([\w-]+)\)/)?.[1];
  const toggle = TOP.find((r) => r.head === '.hero-toggle');
  const plate = TOP.find((r) => r.head === '.hero-art');
  const edge = varOf(toggle.body.match(/\bborder(?:-color)?:\s*[^;]*/)?.[0]);
  const ground = varOf(plate.body.match(/\bbackground:\s*[^;]*/)?.[0]);
  assert.ok(edge && ground, 'the toggle border and the plate background must be design tokens');
  for (const [theme, set] of Object.entries(themes)) {
    const r = ratio(token(set, `--${edge}`), token(set, `--${ground}`));
    assert.ok(r >= 3, `${theme}: the toggle's border (--${edge}) on the plate (--${ground}) is ${r.toFixed(2)}:1, needs 3:1`);
  }
});

test('HeroArt closes every element explicitly (compressHTML guard)', () => {
  assert.doesNotMatch(MARKUP, /\/>/);
  assert.doesNotMatch(MARKUP, /<!--/, 'HTML comments in the hero markup');
});
