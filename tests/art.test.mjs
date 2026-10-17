// Background illustrations (src/assets/art/*.svg): decorative only, local, small, legible in both themes.
// Source checks need nothing; the built-page checks read dist/ (run `npm run build` first).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ART = join(ROOT, 'src/assets/art');
const DIST = join(ROOT, 'dist');
const CSS = readFileSync(join(ROOT, 'src/styles/global.css'), 'utf8');
if (!existsSync(join(DIST, 'index.html'))) throw new Error('dist/ is missing: run `npm run build` first');

const svgs = existsSync(ART) ? readdirSync(ART).filter((f) => f.endsWith('.svg')) : [];
const src = (f) => readFileSync(join(ART, f), 'utf8');
function allHtml(dir = DIST) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? allHtml(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []);
}
const rel = (f) => f.slice(DIST.length);
const subdirs = (p) => readdirSync(join(ROOT, p)).filter((d) => statSync(join(ROOT, p, d)).isDirectory());
const INNER = [
  '/research/', ...subdirs('src/content/research').map((a) => `/research/${a}/`), '/publications/', '/projects/',
  '/people/', '/news/', ...subdirs('src/content/news').map((n) => `/news/${n}/`), '/join/',
];

/** The body of the `{ ... }` block whose opening brace is the first one at or after index `at` (handles nesting). */
function bodyFrom(at) {
  const open = CSS.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < CSS.length; i++) {
    if (CSS[i] === '{') depth++;
    else if (CSS[i] === '}' && --depth === 0) return CSS.slice(open + 1, i);
  }
  throw new Error(`unclosed block at ${at}`);
}
/** The body of the first `{ ... }` block that follows `head` in the stylesheet. */
function block(head) {
  const at = CSS.indexOf(head);
  assert.ok(at >= 0, `missing ${head} in global.css`);
  return bodyFrom(at);
}
/** Bodies of every `@media (prefers-color-scheme: dark)` block, however it is spaced. */
const darkMedia = () => [...CSS.matchAll(/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{/g)].map((m) => bodyFrom(m.index));
/** The theme tokens the dark media query gives to :root unless the visitor chose light: matched by regex, not by exact text. */
const autoDark = () => {
  const bodies = darkMedia().map((b) => b.match(/:root:not\(\s*\[\s*data-theme\s*=\s*["']?light["']?\s*\]\s*\)\s*\{([^}]*)\}/)?.[1]).filter((b) => b && /--art-faint/.test(b));
  assert.equal(bodies.length, 1, 'expected one dark @media block that sets :root:not([data-theme=light]) tokens');
  return bodies[0];
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const THEMES = {
  light: block(':root {'),
  dark: block(":root[data-theme='dark'] {"),
  auto: autoDark(),
};
const token = (body, name) => {
  const m = body.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\b`));
  assert.ok(m, `--${name} is not a #rrggbb token here`);
  return m[1];
};
const artTokens = (body) => [...body.matchAll(/--(art-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => `${m[1]}=${m[2]}`);

test('the illustrations are local SVG files inside a 40 KB budget', () => {
  assert.ok(svgs.length >= 10, `only ${svgs.length} SVG files in src/assets/art/`);
  const bytes = svgs.reduce((n, f) => n + statSync(join(ART, f)).size, 0);
  assert.ok(bytes <= 40 * 1024, `art weighs ${(bytes / 1024).toFixed(1)} KB`);
});

test('illustrations load nothing, draw no raster and hold nothing focusable', () => {
  for (const f of svgs) {
    const s = src(f);
    assert.doesNotMatch(s, /\/\/|<image\b|<script\b|<foreignObject\b|<a\b|tabindex|@import|data:/i, f);
    for (const m of s.matchAll(/(?:href="|url\()([^")]*)/g)) assert.match(m[1], /^#[\w-]+$/, `${f} points at ${m[1]}`);
  }
});

test('illustrations take every colour from CSS tokens', () => {
  for (const f of svgs) {
    assert.doesNotMatch(src(f), /(?:fill|stroke|stop-color|color)\s*[=:]\s*["']?\s*(?:#|rgb|hsl)/i, f);
    assert.doesNotMatch(src(f), /\bstyle="/, `${f}: inline style`);
  }
});

test('illustrations close every element explicitly (compressHTML guard)', () => {
  for (const f of svgs) assert.doesNotMatch(src(f), /\/>/, f);
});

test('art tokens exist for light, dark and the theme toggle, under the same names', () => {
  const light = artTokens(THEMES.light).map((t) => t.split('=')[0]);
  assert.ok(light.length >= 3, `only ${light.length} --art-* tokens on :root`);
  assert.deepEqual(artTokens(THEMES.dark).map((t) => t.split('=')[0]).sort(), [...light].sort());
  assert.deepEqual(artTokens(THEMES.auto), artTokens(THEMES.dark));
});

test('body text drawn over the faint art layer still passes AA in both themes', () => {
  for (const theme of ['light', 'dark']) {
    const body = THEMES[theme];
    const under = hex(token(body, 'art-faint'));
    for (const fg of ['text', 'muted', 'accent']) {
      const r = ratio(hex(token(body, fg)), under);
      assert.ok(r >= 4.5, `${theme}: --${fg} over --art-faint is ${r.toFixed(2)}:1`);
    }
  }
});

test('art ignores the pointer, never loops, stays still under reduced motion and is hidden in print', () => {
  assert.match(block('.art {'), /pointer-events:\s*none/);
  for (const m of CSS.matchAll(/([^{}]*\.art\b[^{}]*)\{([^}]*)\}/g)) assert.doesNotMatch(m[2], /infinite/, m[1].trim());
  assert.match(block('@media (prefers-reduced-motion: reduce) {'), /\.art\b[^{]*\{[^}]*animation:\s*none/);
  assert.match(block('@media print {'), /\.art\b[^{]*\{[^}]*display:\s*none/);
});

test('every decorative art layer in the built pages is aria-hidden', () => {
  let n = 0;
  for (const f of allHtml()) {
    for (const m of readFileSync(f, 'utf8').matchAll(/<(\w+)\b([^>]*)>/g)) {
      const cls = m[2].match(/\bclass="([^"]*)"/)?.[1].split(/\s+/) ?? [];
      if (!cls.includes('art')) continue;
      n++;
      assert.match(m[2], /\baria-hidden="true"/, `${rel(f)}: <${m[1]} class="${cls.join(' ')}"> is not aria-hidden`);
    }
  }
  assert.ok(n > 0, 'no art layers in the built pages');
});

test('every inner page has a page-head illustration and the 404 page has its own', () => {
  for (const r of INNER) {
    for (const p of [r, `/zh${r}`]) {
      assert.match(readFileSync(join(DIST, p, 'index.html'), 'utf8'), /<header class="page-head[^>]*>[\s\S]*?class="art art-head\b/, p);
    }
  }
  assert.match(readFileSync(join(DIST, '404.html'), 'utf8'), /class="art art-404\b/);
});

test('inline SVG in the built pages loads nothing from elsewhere', () => {
  for (const f of allHtml()) {
    for (const m of readFileSync(f, 'utf8').matchAll(/<svg\b[\s\S]*?<\/svg>/g)) {
      assert.doesNotMatch(m[0], /(?:href|src)="(?:https?:)?\/\/|url\(\s*["']?(?:https?:)?\/\/|<image\b/, rel(f));
    }
  }
});

const ids = (text) => [...text.matchAll(/\bid="([\w-]+)"/g)].map((m) => m[1]);
const refs = (text) => [...text.matchAll(/url\(\s*["']?#([\w-]+)/g)].map((m) => m[1]);

test('every url(#id) in the plates and in the .art rules has a matching id in the defs plate', () => {
  const defined = new Set(ids(src('defs.svg')));
  assert.ok(defined.size >= 3, `only ${defined.size} ids in defs.svg`);
  const used = new Map();
  for (const f of svgs.filter((x) => x !== 'defs.svg')) for (const r of refs(src(f))) used.set(r, f);
  for (const m of CSS.matchAll(/([^{}]*\.art\b[^{}]*)\{([^}]*)\}/g)) for (const r of refs(m[2])) used.set(r, 'global.css');
  assert.ok(used.size >= 3, `only ${used.size} distinct url(#...) references found`);
  for (const [id, where] of used) assert.ok(defined.has(id), `${where} uses url(#${id}) but defs.svg has no id="${id}"`);
});

test('each built page with art includes the defs plate exactly once', () => {
  let pages = 0;
  for (const f of allHtml()) {
    const page = readFileSync(f, 'utf8');
    const layers = (page.match(/class="art [^"]*"/g) ?? []).filter((c) => !/\bart-defs\b/.test(c)).length;
    if (!layers) continue;
    pages++;
    const defs = (page.match(/class="art art-defs"/g) ?? []).length;
    assert.equal(defs, 1, `${rel(f)} has ${layers} art layers and ${defs} defs plates`);
    for (const id of ids(src('defs.svg'))) assert.equal((page.match(new RegExp(`\\bid="${id}"`, 'g')) ?? []).length, 1, `${rel(f)}: id="${id}" must appear once`);
  }
  assert.ok(pages >= 20, `only ${pages} built pages carry art`);
});

test('the card-grid filler is shown by the grid\'s own width, the same condition that gives it a third column', () => {
  const gap = Number(CSS.match(/\.grid\s*\{[^}]*\bgap:\s*(\d+)px/)[1]);
  for (const n of [2, 3]) {
    const min = Number(CSS.match(new RegExp(`\\.grid-${n}\\s*\\{[^}]*minmax\\(min\\(100%,\\s*(\\d+)px\\)`))[1]);
    const threeCols = 3 * min + 2 * gap; // narrowest grid width that auto-fill gives three columns
    assert.match(CSS, new RegExp(`\\.grid-${n}\\s*[,{][^}]*container-type:\\s*inline-size|\\.grid-${n}[^{}]*,[^{}]*\\{[^}]*container-type:\\s*inline-size`), `.grid-${n} must be a size container`);
    assert.doesNotMatch(CSS, new RegExp(`@media[^{]*\\{\\s*\\.grid-${n} > \\.art-fill`), `.grid-${n} > .art-fill must not depend on the viewport width`);
    const rule = CSS.match(new RegExp(`@container\\s*\\(\\s*min-width:\\s*(\\d+)px\\s*\\)\\s*\\{\\s*\\.grid-${n} > \\.art-fill\\s*\\{[^}]*display:\\s*grid`));
    assert.ok(rule, `missing @container (min-width: ${threeCols}px) { .grid-${n} > .art-fill { display: grid } }`);
    assert.equal(Number(rule[1]), threeCols, `.grid-${n}: three columns need a ${threeCols}px grid`);
  }
});
