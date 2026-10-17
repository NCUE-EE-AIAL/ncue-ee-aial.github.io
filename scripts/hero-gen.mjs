// Generates src/components/HeroArt.astro: five line-drawn research scenes on a 440x360 plate.
// Usage: node scripts/hero-gen.mjs [outFile]   (default src/components/HeroArt.astro; `npm run hero`)
// The component is generated: edit this script, not HeroArt.astro. The cycle timing it relies on (--cycle, --at, the
// hero-slot and release percentages in src/styles/global.css) is described in CONTRIBUTING.md, "首頁動畫（hero）".
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = resolve(process.argv[2] ?? `${ROOT}src/components/HeroArt.astro`);

// ---------- helpers ----------
const f = (n) => { const r = Math.round(n * 10) / 10; return Object.is(r, -0) ? '0' : String(r); };
const pt = (p) => `${f(p.x)} ${f(p.y)}`;
const isDrawn = (cls) => /\b(draw|trace)\b/.test(cls);
const klass = (cls) => (cls ? ` class="${cls}"` : '');
const P = (cls, d) => `<path${klass(cls)}${isDrawn(cls) ? ' pathLength="1"' : ''} d="${d}"></path>`;
const C = (cls, x, y, r) => `<circle${klass(cls)} cx="${f(x)}" cy="${f(y)}" r="${f(r)}"></circle>`;
const G = (cls, ...kids) => `<g class="${cls}">${kids.join('')}</g>`;
function rng(seed) { // mulberry32
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gauss = (x, mu, s) => Math.exp(-((x - mu) ** 2) / (2 * s * s));
/** Full ellipse as two arcs (rotation baked in: no transform attribute). */
function ellipse(cx, cy, rx, ry, rot = 0) {
  const a = (rot * Math.PI) / 180, dx = rx * Math.cos(a), dy = rx * Math.sin(a);
  return `M${f(cx + dx)} ${f(cy + dy)}A${f(rx)} ${f(ry)} ${f(rot)} 1 1 ${f(cx - dx)} ${f(cy - dy)}A${f(rx)} ${f(ry)} ${f(rot)} 1 1 ${f(cx + dx)} ${f(cy + dy)}`;
}
/** Polyline with relative steps (compact). */
function poly(points) {
  let d = `M${pt(points[0])}`;
  for (let i = 1; i < points.length; i++) d += `l${f(points[i].x - points[i - 1].x)} ${f(points[i].y - points[i - 1].y)}`;
  return d.replace(/ -/g, '-');
}
/** Smooth curve through points (Catmull-Rom as cubic Beziers). */
function smooth(points, tension = 1) {
  let d = `M${pt(points[0])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] ?? p2;
    const c1 = { x: p1.x + ((p2.x - p0.x) / 6) * tension, y: p1.y + ((p2.y - p0.y) / 6) * tension };
    const c2 = { x: p2.x - ((p3.x - p1.x) / 6) * tension, y: p2.y - ((p3.y - p1.y) / 6) * tension };
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
}
/** Upright cylinder outline: full top ellipse, then the sides and the front of the bottom rim. */
function cylinder(cx, top, bottom, rx, ry) {
  return `${ellipse(cx, top, rx, ry)}M${f(cx - rx)} ${f(top)}V${f(bottom)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(bottom)}V${f(top)}`;
}
const target = (x, y, t) => C(`ring pop ${t}`, x, y, 7) + C(`key pop ${t}`, x, y, 2.6);

// ---------- 1. speech emotion: a voice waveform lands in valence-arousal space ----------
function emotion() {
  const c = { x: 296, y: 156 }, R = 100, mode = { x: 342, y: 110 };
  const rand = rng(7);
  const pts = [];
  const env = (x) => 19 * gauss(x, 104, 6) + 27 * gauss(x, 134, 8) + 14 * gauss(x, 166, 6) + 7 * gauss(x, 184, 4);
  for (let i = 0, x = 88; x <= 194; i++, x += 2.4) pts.push({ x, y: c.y + (i % 2 ? 1 : -1) * (0.8 + env(x) * (0.55 + 0.45 * rand())) });
  pts.push({ x: 196, y: c.y });
  const voice = poly(pts) + `C246 ${c.y} 288 ${mode.y} ${pt(mode)}`;
  // samples drawn around the mode with the contours' orientation
  const r2 = rng(11), samples = [];
  for (let i = 0; i < 18; i++) {
    const u = Math.sqrt(-2 * Math.log(r2() + 1e-9)) * Math.cos(2 * Math.PI * r2()), v = Math.sqrt(-2 * Math.log(r2() + 1e-9)) * Math.sin(2 * Math.PI * r2());
    const a = (-34 * Math.PI) / 180, x = u * 22, y = v * 12;
    samples.push(C('mark', mode.x + x * Math.cos(a) - y * Math.sin(a), mode.y + x * Math.sin(a) + y * Math.cos(a), 1.6));
  }
  return [
    P('dim fade', `M${c.x - R} ${c.y}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0`),
    P('con fade', `M178 ${c.y}H414M${c.x} 38V274`),
    P('dim fade t6', ellipse(262, 198, 18, 10, 24)),
    P('ink draw t1', 'M50 146a10 10 0 0 1 20 0v20a10 10 0 0 1-20 0zM42 158v4a18 18 0 0 0 36 0v-4M60 180v18M48 198h24'),
    P('thin draw t2', 'M55 150h10M55 156h10M55 162h10'),
    P('sig trace t3', voice),
    C('key pop t7', 196, c.y, 3.2),
    P('dim fade t6', ellipse(mode.x, mode.y, 46, 27, -34)),
    P('thin draw t7', ellipse(mode.x, mode.y, 30, 17, -34)),
    P('ink draw t8', ellipse(mode.x, mode.y, 15, 8.5, -34)),
    G('fade t8', ...samples),
    target(mode.x, mode.y, 't10'),
  ];
}

// ---------- 2. EMG: three bursts over a muscle; the last one's envelope changes ----------
function emg() {
  const base = 100, rand = rng(23);
  const env = (x) => 24 * gauss(x, 96, 11) + 31 * gauss(x, 212, 13) + 18 * gauss(x, 312, 11) + 25 * gauss(x, 352, 9);
  const pts = [];
  for (let i = 0, x = 34; x <= 402; i++) {
    const a = env(x), late = x > 296;
    pts.push({ x, y: base + (i % 2 ? 1 : -1) * (1.2 + a * (0.2 + 0.8 * rand())) });
    x += late ? 3.4 : 2.2; // the late burst slows down: fatigue shifts the spectrum
  }
  const top = [], bottom = [];
  for (let x = 34; x <= 402; x += 8) { top.push({ x, y: base - 3 - env(x) * 1.02 }); bottom.push({ x, y: base + 3 + env(x) * 1.02 }); }
  // the muscle: a spindle of fibres converging on two tendons; the outer fibres are its outline
  const L = { x: 78, y: 238 }, Rt = { x: 336, y: 232 };
  const fibre = (h, k = 1) => `M${pt(L)}C${f(132)} ${f(L.y - h)} ${f(262)} ${f(Rt.y - h * k)} ${pt(Rt)}`;
  const outline = fibre(54, 0.9) + fibre(-46, 0.9).replace(/^M[^C]*/, '').replace(/^C/, 'M' + pt(L) + 'C');
  const inner = [30, 12, -8, -26].map((h) => fibre(h, 0.92)).join('');
  // the electrodes sit on the upper contour of the belly
  const onTop = (x) => { // invert the Bezier x(t) numerically
    let lo = 0, hi = 1;
    const bx = (t) => (1 - t) ** 3 * L.x + 3 * (1 - t) ** 2 * t * 132 + 3 * (1 - t) * t * t * 262 + t ** 3 * Rt.x;
    for (let k = 0; k < 40; k++) { const t = (lo + hi) / 2; bx(t) < x ? (lo = t) : (hi = t); }
    const t = lo; return (1 - t) ** 3 * L.y + 3 * (1 - t) ** 2 * t * (L.y - 54) + 3 * (1 - t) * t * t * (Rt.y - 54 * 0.9) + t ** 3 * Rt.y;
  };
  const e1 = { x: 154, y: onTop(154) - 8 }, e2 = { x: 266, y: onTop(266) - 8 };
  const hump = { x: 352, y: base - 3 - env(352) * 1.02 };
  return [
    P('con fade', `M${e1.x} ${f(e1.y - 9)}V132M${e2.x} ${f(e2.y - 9)}V132`),
    P('ink draw t1', outline + `M34 ${L.y + 2}L${pt(L)}M${pt(Rt)}L384 ${Rt.y - 3}`),
    P('thin draw t2', inner),
    P('ink draw t2', `M${e1.x - 8} ${f(e1.y)}a8 8 0 1 0 16 0a8 8 0 1 0-16 0M${e2.x - 8} ${f(e2.y)}a8 8 0 1 0 16 0a8 8 0 1 0-16 0`),
    C('key pop t3', e1.x, e1.y, 2.6), C('key pop t3', e2.x, e2.y, 2.6),
    P('sig trace t3', poly(pts)),
    P('ink draw t7', smooth(top)),
    P('dim fade t7', smooth(bottom)),
    C('key pop t5', 96, base - 3 - env(96) * 1.02, 3.2),
    C('key pop t7', 212, base - 3 - env(212) * 1.02, 3.2),
    target(hump.x, hump.y, 't10'),
  ];
}

// ---------- 3. stereo 3D: two cameras triangulate a point on a cube (the original hero, lowered 20) ----------
function stereo() {
  const y = (v) => v + 20;
  const cam = (x) => `M${x - 10} ${y(236)}l3-5h14l3 5M${x - 22} ${y(236)}h44a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4h-44a4 4 0 0 1-4-4v-20a4 4 0 0 1 4-4z`;
  return [
    P('con fade', `M110 ${y(250)}L40 ${y(70)}M110 ${y(250)}L262 ${y(60)}M330 ${y(250)}L178 ${y(60)}M330 ${y(250)}L400 ${y(70)}`),
    P('dim fade', `M136 ${y(250)}H304`),
    P('thin fade', `M76 ${y(215)}H144M296 ${y(215)}H364`),
    G('sig', P('draw t1', `M110 ${y(250)}L220 ${y(120)}`), P('draw t1', `M330 ${y(250)}L220 ${y(120)}`)),
    P('dim fade t6', `M190 ${y(150)}L220 ${y(124)}H280M220 ${y(124)}V${y(64)}`),
    P('ink draw t4', `M190 ${y(90)}H250V${y(150)}H190ZM190 ${y(90)}L220 ${y(64)}H280L250 ${y(90)}M280 ${y(64)}V${y(124)}L250 ${y(150)}`),
    C('key pop t3', 139.6, y(215), 3.2), C('key pop t3', 300.4, y(215), 3.2),
    G('ink body fade', P('', cam(110)), C('', 110, y(250), 8.5), C('', 110, y(250), 3), P('', cam(330)), C('', 330, y(250), 8.5), C('', 330, y(250), 3)),
    target(220, y(120), 't8'),
  ];
}

// ---------- 4. robotic arm: a motion study of pick, carry, place ----------
function arm() {
  const S = { x: 190, y: 250 }, L1 = 100, L2 = 92, table = 296;
  const elbows = (W) => {
    const dx = W.x - S.x, dy = W.y - S.y, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const b = Math.acos(Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
    return [a - b, a + b].map((th) => ({ x: S.x + L1 * Math.cos(th), y: S.y + L1 * Math.sin(th) }));
  };
  const up = (W) => elbows(W).sort((p, q) => p.y - q.y)[0];
  const left = (W) => elbows(W).sort((p, q) => p.x - q.x)[0];
  const capsule = (A, B, h) => {
    const len = Math.hypot(B.x - A.x, B.y - A.y), n = { x: -(B.y - A.y) / len * h, y: (B.x - A.x) / len * h };
    return `M${pt({ x: A.x + n.x, y: A.y + n.y })}L${pt({ x: B.x + n.x, y: B.y + n.y })}A${h} ${h} 0 0 1 ${pt({ x: B.x - n.x, y: B.y - n.y })}L${pt({ x: A.x - n.x, y: A.y - n.y })}A${h} ${h} 0 0 1 ${pt({ x: A.x + n.x, y: A.y + n.y })}`;
  };
  const gripper = (W) => `M${f(W.x)} ${f(W.y + 6.5)}V${f(W.y + 14)}M${f(W.x - 18)} ${f(W.y + 36)}V${f(W.y + 14)}H${f(W.x + 18)}V${f(W.y + 36)}`;
  const box = (cx) => `M${cx - 15} ${table - 30}h30v30h-30zM${cx - 15} ${table - 24}h30`;
  const W0 = { x: 72, y: 244 }, W1 = { x: 206, y: 98 }, W2 = { x: 334, y: 244 };
  const E0 = up(W0), E1 = left(W1), E2 = up(W2);
  const ghost = (E, W) => `M${pt(S)}L${pt(E)}L${pt(W)}` + gripper(W);
  const ctrl = { x: 2 * W1.x - (W0.x + W2.x) / 2, y: 2 * W1.y - (W0.y + W2.y) / 2 };
  const reach = L1 + L2, arc = (deg) => pt({ x: S.x + reach * Math.cos((deg * Math.PI) / 180), y: S.y + reach * Math.sin((deg * Math.PI) / 180) });
  const a1 = Math.atan2(E2.y - S.y, E2.x - S.x), r = 26;
  return [
    P('con fade', `M${arc(-152)}A${reach} ${reach} 0 0 1 ${arc(-28)}`),
    P('thin draw', `M36 ${table}H372`),
    P('con fade t1', `M${W2.x - 24} ${table + 7}v-7M${W2.x + 24} ${table + 7}v-7`),
    P('ink draw t1', `M${S.x - 28} ${table}L${S.x - 20} 276H${S.x + 20}L${S.x + 28} ${table}M${S.x - 12} 276V264H${S.x + 12}V276`),
    G('fade t1', P('dim', ghost(E0, W0) + box(W0.x)), C('thin', E0.x, E0.y, 4), C('thin', W0.x, W0.y, 4)),
    P('sig trace t3', `M${pt(W0)}Q${pt(ctrl)} ${pt(W2)}`),
    C('key pop t3', W0.x, W0.y, 3.2),
    G('fade t5', P('dim', ghost(E1, W1)), C('thin', E1.x, E1.y, 4), C('thin', W1.x, W1.y, 4)),
    C('key pop t6', W1.x, W1.y, 3.2),
    P('ink draw t6', capsule(S, E2, 8) + capsule(E2, W2, 6.5)),
    P('ink draw t7', gripper(W2)),
    P('ink draw t8', box(W2.x)),
    G('ink body fade t6', C('', S.x, S.y, 10), C('', E2.x, E2.y, 8), C('', W2.x, W2.y, 6.5)),
    P('con fade t8', `M${S.x + r} ${S.y}A${r} ${r} 0 0 0 ${f(S.x + r * Math.cos(a1))} ${f(S.y + r * Math.sin(a1))}`),
    target(W2.x, W2.y, 't10'),
  ];
}

// ---------- 5. power: a 1 F supercapacitor, battery cells, a charge/discharge curve ----------
function power() {
  const top = 250, bottom = 318, gcd = [{ x: 48, y: bottom }];
  for (let k = 0; k < 4; k++) {
    const x0 = 48 + k * 80;
    gcd.push({ x: x0 + 40, y: top });
    if (k < 3) gcd.push({ x: x0 + 40, y: top + 10 }, { x: x0 + 80, y: bottom });
  }
  const cells = [226, 264, 302];
  return [
    P('con fade', `M44 236V${bottom}H376M44 ${top}H376`),
    P('thin draw', 'M92 214H340'),
    P('ink draw t1', cylinder(150, 84, 206, 30, 8) + 'M140 84V60M160 84V60'),
    P('thin draw t2', 'M120 98A30 8 0 0 0 180 98M174 106V198'),
    P('ink draw t3', 'M133 142l6-5v26M157 137v26M157 137h11M157 149h8'),
    P('ink draw t2', cells.map((x) => cylinder(x, 136, 209.5, 15, 4.5) + `M${x - 6} 136v-6h12v6M${x - 15} 146A15 4.5 0 0 0 ${x + 15} 146`).join('')),
    P('thin draw t4', 'M220 130H308'),
    P('dim fade t3', 'M160 60C192 36 226 76 226 124'),
    P('sig trace t3', poly(gcd)),
    C('key pop t5', 88, top, 3.2), C('key pop t6', 168, top, 3.2), C('key pop t8', 248, top, 3.2),
    target(328, top, 't10'),
  ];
}

const SCENES = { emotion, emg, stereo, arm, power };
const scenes = Object.entries(SCENES).map(([name, fn]) => `      <g class="scene" data-scene="${name}">\n        ${fn().join('\n        ')}\n      </g>`).join('\n');

const astro = `---
/**
 * Home hero illustration: the lab's research topics, drawn in turn with one pen.
 * Five scenes share one 28 s cycle, 5.6 s each, in this order: speech emotion recognition, EMG muscle fatigue,
 * stereo 3D vision, a robotic arm carrying a box, a 1 F supercapacitor with battery cells and a charge/discharge curve.
 * In a scene the construction lines fade in, the ink draws, the signal line traces and the key dots pop
 * (.fade / .draw / .trace / .pop, delayed by .t1-.t10 in 0.3 s steps); then it fades out for the next one.
 * CSS does the drawing (.hero-art in global.css). A new or moved scene needs its --at offset and the hero-slot window
 * there; tests/hero.test.mjs checks that the slots tile the cycle. Without JS, and under prefers-reduced-motion,
 * the first scene stands still, fully drawn. The button pauses the cycle on the current scene, fully drawn (WCAG 2.2.2).
 * Evocative drawings, not diagrams of the lab's systems: no text but the unit "1 F", drawn as strokes.
 * The waveforms and the arm's poses were computed once (seeded noise, inverse kinematics); edit them as plain SVG.
 */
import { t, type Locale } from '../i18n/utils';
interface Props { lang: Locale }
const { lang } = Astro.props;
const pause = t('home.hero.pause', lang);
---
<div class="hero-art">
  <svg viewBox="0 0 440 360" aria-hidden="true" focusable="false">
    <defs>
      <pattern id="hero-dots" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle class="dot" cx="10" cy="10" r="1"></circle>
      </pattern>
    </defs>
    <rect width="440" height="360" fill="url(#hero-dots)"></rect>
    <g class="scenes">
${scenes}
    </g>
  </svg>
  <button class="hero-toggle" type="button" aria-pressed="false" aria-label={pause} title={pause}>
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path class="i-pause" d="M9 6v12M15 6v12"></path><path class="i-play" d="M8 5.5v13l11-6.5z"></path></svg>
  </button>
</div>
<script>
  // Pause button (WCAG 2.2.2) and an off-screen pause: the script only flips classes; CSS does the drawing.
  const art = document.querySelector('.hero-art');
  const button = art?.querySelector('.hero-toggle');
  if (art && button) {
    button.addEventListener('click', () => {
      const paused = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(paused));
      art.classList.toggle('is-paused', paused);
    });
    new IntersectionObserver(([entry]) => art.classList.toggle('is-off', !entry.isIntersecting)).observe(art);
  }
</script>
`;
writeFileSync(OUT, astro);
const svg = astro.slice(astro.indexOf('<svg'), astro.indexOf('</svg>') + 6);
console.log(`wrote ${OUT}: art SVG ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`);
