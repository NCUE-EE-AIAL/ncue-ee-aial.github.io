// Generates src/assets/project-art/<project slug>.svg: one small diagram per project, read left to right as
// input → method → output. Shown at the top of the project's card (ProjectArt.astro), drawn in the hero's
// grammar: --text ink, --muted construction, one --accent signal. Colours come from .project-art in global.css.
// Usage: node scripts/project-art-gen.mjs [outDir]   (default src/assets/project-art; `npm run project-art`)
// The SVGs are generated: edit this script, not the SVG files. tests/project-art.test.mjs checks the output.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = resolve(process.argv[2] ?? `${ROOT}/src/assets/project-art`);
mkdirSync(OUT, { recursive: true });
const W = 320, H = 140;
const n = (v) => String(Math.round(v * 10) / 10);
// `draw` marks a stroke that is redrawn when the card is hovered (pathLength="1" lets CSS dash it in one unit).
const P = (cls, d) => `<path class="${cls}"${/\bdraw\b/.test(cls) ? ' pathLength="1"' : ''} d="${d}"></path>`;
const C = (cls, x, y, r) => `<circle class="${cls}"${/\bdraw\b/.test(cls) ? ' pathLength="1"' : ''} cx="${n(x)}" cy="${n(y)}" r="${n(r)}"></circle>`;
const R = (cls, x, y, w, h, rx = 0) => `<rect class="${cls}"${/\bdraw\b/.test(cls) ? ' pathLength="1"' : ''} x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${rx ? ` rx="${n(rx)}"` : ''}></rect>`;
const svg = (inner) => `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" focusable="false">${inner}</svg>\n`;
/** A flow arrow from x1 to x2 at height y. */
const arrow = (x1, x2, y) => P('thin', `M${x1} ${y}H${x2}m-5-4l5 4l-5 4`);
/** A polyline through points [[x, y], ...]. */
const line = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${n(x)} ${n(y)}`).join('');
/** A sampled curve y = f(x) from x0 to x1. */
const curve = (x0, x1, f, step = 2) => { const p = []; for (let x = x0; x <= x1 + 1e-9; x += step) p.push([x, f(x)]); return line(p); };
/** Seeded noise so the drawings are the same on every run. */
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
/** A spiky speech-like burst between x0 and x1 around y. */
const voice = (x0, x1, y, amp) => { seed = 11; let d = `M${x0} ${y}`; for (let x = x0 + 3, s = 1; x <= x1; x += 3, s = -s) { const env = Math.sin(((x - x0) / (x1 - x0)) * Math.PI); d += `L${x} ${n(y + s * amp * env * (0.35 + 0.65 * rnd()))}`; } return d; };
/** One ECG beat of width w starting at x, baseline y. */
const beat = (x, y, w, h) => `M${n(x)} ${y}h${n(w * 0.18)}q${n(w * 0.05)}-${n(h * 0.12)} ${n(w * 0.1)} 0h${n(w * 0.08)}l${n(w * 0.03)} ${n(h * 0.12)}l${n(w * 0.04)}-${n(h)}l${n(w * 0.04)} ${n(h * 1.2)}l${n(w * 0.03)}-${n(h * 0.32)}h${n(w * 0.12)}q${n(w * 0.08)}-${n(h * 0.28)} ${n(w * 0.16)} 0h${n(w * 0.12)}`;
/** A head-and-shoulders bust centred at x, head centre y. */
const bust = (cls, x, y, r) => C(cls, x, y, r) + P(cls, `M${n(x - r * 1.6)} ${n(y + r * 2.9)}c${n(r * 0.3)}-${n(r * 1.2)} ${n(r * 0.9)}-${n(r * 1.7)} ${n(r * 1.6)}-${n(r * 1.7)}s${n(r * 1.3)} ${n(r * 0.5)} ${n(r * 1.6)} ${n(r * 1.7)}`);
/** Camera-frame corner marks around a box. */
const corners = (x, y, w, h, k = 8) => P('con', `M${x} ${y + k}V${y}H${x + k}M${x + w - k} ${y}H${x + w}V${y + k}M${x + w} ${y + h - k}V${y + h}H${x + w - k}M${x + k} ${y + h}H${x}V${y + h - k}`);
/** A stack of k layer blocks (a network), left edge x. */
const layers = (x, y, k, w = 10, h = 52, gap = 6) => { let s = ''; for (let i = 0; i < k; i++) { const hh = h - Math.abs(i - (k - 1) / 2) * 10; s += R('ink paper draw', x + i * (w + gap), y - hh / 2, w, hh, 2); } return s; };
/** Text lines (a transcript or a table row) at x, y. */
const textLines = (x, y, ws, gap = 9) => P('thin', ws.map((w, i) => `M${x} ${y + i * gap}h${w}`).join(''));
/** An open hand, wrist at (x, y). */
const hand = (cls, x, y, s = 1) => {
  const f = (dx, len, tilt) => `M${n(x + dx * s)} ${n(y - 26 * s)}l${n(tilt * s)}-${n(len * s)}`;
  return P(cls, `M${n(x - 12 * s)} ${n(y)}V${n(y - 26 * s)}H${n(x + 12 * s)}V${n(y)}` + f(-9, 20, -3) + f(-3, 26, -1) + f(3, 26, 1) + f(9, 20, 3)
    + `M${n(x - 12 * s)} ${n(y - 12 * s)}l-${n(9 * s)}-${n(12 * s)}`);
};
const files = {};

// ASL to English with T5: hand keypoints → one linear projection → the T5 encoder-decoder → English text.
{
  const kp = [[34, 92], [31, 64], [40, 58], [48, 58], [56, 62], [26, 72]];
  files['asl-t5-linear-projection'] = svg(
    hand('ink draw', 40, 100) + kp.map(([x, y]) => C('key', x, y, 2.4)).join('')
    + arrow(70, 94, 72)
    + P('ink paper draw', 'M100 52L128 60V84L100 92Z') + P('thin', 'M108 62v20M116 64v16')
    + arrow(134, 156, 72)
    + R('ink paper draw', 162, 46, 40, 52, 4) + R('ink paper draw', 210, 46, 40, 52, 4) + P('sig draw', 'M202 72H210')
    + textLines(168, 58, [28, 22, 26, 18], 10) + textLines(216, 58, [28, 22, 26, 18], 10)
    + arrow(256, 274, 72)
    + P('sig draw', 'M280 64h30M280 74h24M280 84h28'));
}

// Face attendance: a face in the camera frame → a trained recognizer → the roll, ticked.
{
  const rows = [0, 1, 2, 3].map((i) => 40 + i * 18);
  files['attendance-management'] = svg(
    corners(18, 30, 72, 80) + bust('ink draw', 54, 60, 13)
    + P('sig', 'M38 46h32v30h-32z')
    + arrow(98, 122, 70)
    + R('ink paper draw', 128, 44, 56, 52, 6) + C('thin', 156, 64, 9) + P('thin', 'M140 86h32')
    + arrow(190, 214, 70)
    + R('ink paper draw', 220, 30, 84, 80, 4) + P('thin', rows.map((y) => `M230 ${y + 8}h44`).join('') + 'M220 48h84')
    + rows.slice(1).map((y, i) => (i === 2 ? C('thin', 290, y + 8, 4) : P('sig draw', `M285 ${y + 8}l4 4l7-8`))).join(''));
}

// BEES: smart meters on two campus buildings → a month of load → a forecast that carries the daily shape on.
{
  const day = (x) => 96 - 22 * Math.max(0, Math.sin(((x - 110) / 34) * Math.PI)) - 4 * Math.sin(x / 5);
  files['bees-energy'] = svg(
    R('ink paper draw', 16, 46, 30, 64, 2) + R('ink paper draw', 52, 62, 30, 48, 2)
    + P('thin', 'M22 58h6M34 58h6M22 72h6M34 72h6M22 86h6M34 86h6M58 74h6M70 74h6M58 88h6M70 88h6M10 110H90')
    + C('ink paper', 46, 40, 7) + P('sig', 'M46 40l3-4')
    + arrow(96, 116, 76)
    + P('con', 'M122 110H306M122 40V110M240 34V112')
    + P('ink draw', curve(122, 240, day)) + P('sig draw', curve(240, 306, day))
    + P('con', curve(240, 306, (x) => day(x) - 8) + curve(240, 306, (x) => day(x) + 8))
    + C('key', 240, day(240), 3));
}

// Campus BESS: solar and a battery container → an edge device (DWT, coding) → an LSTM forecast.
{
  let cells = '';
  for (let i = 0; i < 4; i++) cells += R('thin', 20 + i * 15, 82, 11, 22, 1);
  files['bess-edge-ai'] = svg(
    P('ink draw', 'M18 56L30 34H78L66 56Z') + P('thin', 'M24 45H72M42 34L36 56M54 34L48 56M66 34L60 56M42 56V70')
    + R('ink paper draw', 14, 72, 70, 40, 3) + cells
    + arrow(90, 114, 78)
    + R('ink paper draw', 120, 52, 60, 52, 6) + R('thin', 136, 64, 28, 28, 2)
    + P('thin', 'M142 64v-6M150 64v-6M158 64v-6M142 98v-6M150 98v-6M158 98v-6')
    + P('sig draw', 'M128 116h6l3-6 4 12 3-6h40')
    + arrow(186, 208, 78)
    + P('con', 'M214 110H306M214 40V110')
    + P('ink draw', curve(214, 262, (x) => 82 - 16 * Math.sin((x - 214) / 10) * Math.exp(-(x - 214) / 120)))
    + P('sig draw', curve(262, 306, (x) => 82 - 16 * Math.sin((x - 214) / 10) * Math.exp(-(x - 214) / 120)))
    + C('key', 262, 82 - 16 * Math.sin(4.8) * Math.exp(-0.4), 3));
}

// ECG on a microcontroller: heartbeats → wavelet detail bands → a tiny ANN on the board → beat classes.
{
  files['ecg-wavelet-nn'] = svg(
    P('sig draw', beat(10, 70, 46, 34) + beat(56, 70, 46, 34) + 'h4')
    + arrow(108, 128, 70)
    + P('thin', curve(134, 196, (x) => 46 + 6 * Math.sin((x - 134) / 2.2) * Math.exp(-(((x - 165) / 8) ** 2)), 1.5))
    + P('thin', curve(134, 196, (x) => 70 + 8 * Math.sin((x - 134) / 4.5) * Math.exp(-(((x - 165) / 14) ** 2))))
    + P('thin', curve(134, 196, (x) => 94 + 7 * Math.sin((x - 134) / 9))) + P('con', 'M165 34V106')
    + arrow(202, 222, 70)
    + R('ink paper draw', 228, 40, 48, 60, 4) + P('thin', 'M228 52h-6M228 64h-6M228 76h-6M228 88h-6M276 52h6M276 64h6M276 76h6M276 88h6')
    + C('thin', 242, 56, 3) + C('thin', 242, 84, 3) + C('thin', 262, 70, 3) + P('thin', 'M245 57l14 12M245 83l14-12')
    + C('key', 300, 58, 4) + C('ink', 300, 82, 4));
}

// EchoMind: speech and its transcript → a bidirectional Mamba stack → a distribution on the valence-arousal plane.
{
  let marks = '';
  seed = 3;
  for (let i = 0; i < 16; i++) { const a = rnd() * 2 * Math.PI, r = 4 + rnd() * 14; marks += C('mark', 268 + r * Math.cos(a) * 1.2, 52 + r * Math.sin(a) * 0.8, 1.4); }
  files['echomind-mamba-va-ser'] = svg(
    P('ink draw', 'M18 40a8 8 0 0 1 16 0v14a8 8 0 0 1-16 0zM12 50a14 14 0 0 0 28 0M26 64v8M20 72h12')
    + P('sig draw', voice(46, 110, 50, 16)) + textLines(46, 88, [56, 40, 48])
    + arrow(116, 136, 70)
    + layers(142, 70, 4) + P('thin', 'M142 104h58m-5-4l5 4l-5 4M200 36h-58m5-4l-5 4l5 4')
    + arrow(212, 230, 70)
    + P('con', 'M236 70H308M272 26V114') + C('thin', 272, 70, 36)
    + P('ink draw', 'M285 52a17 11 0 1 1-34 0a17 11 0 1 1 34 0') + P('thin', 'M293 52a25 17 0 1 1-50 0a25 17 0 1 1 50 0')
    + marks + C('key', 268, 52, 3));
}

// Invigilation: a classroom from above → segmentation regions and a face box → one flag for the proctor.
{
  let desks = '';
  for (const [x, y] of [[22, 34], [62, 34], [22, 78], [62, 78]]) desks += R('thin', x, y, 30, 18, 2) + C('ink draw', x + 15, y + 28, 6);
  files['invigilation-semantic'] = svg(
    corners(12, 22, 92, 100) + desks
    + arrow(110, 132, 70)
    + R('ink paper draw', 138, 30, 80, 80, 4) + P('con', 'M138 70C160 60 180 84 218 66M178 30C170 56 190 90 178 110')
    + bust('ink', 196, 52, 8) + P('sig', 'M184 40h24v24h-24z')
    + arrow(224, 246, 70)
    + P('ink draw', 'M262 92h40l-20-36z') + P('sig draw', 'M282 70v10') + C('key', 282, 86, 2));
}

// PatrolBot: the car holds a straight course (IMU + PID) while its time-of-flight sensor watches the wall.
{
  files.patrolbot = svg(
    P('ink', 'M8 22H312') + P('con', 'M8 30H312')
    + P('con', 'M18 92H300') + P('sig draw', curve(18, 168, (x) => 92 + 10 * Math.exp(-(x - 18) / 40) * Math.cos((x - 18) / 12)))
    + R('ink paper draw', 176, 72, 62, 40, 8) + R('ink paper', 182, 64, 14, 8, 2) + R('ink paper', 218, 64, 14, 8, 2)
    + R('ink paper', 182, 112, 14, 8, 2) + R('ink paper', 218, 112, 14, 8, 2)
    + R('thin', 198, 84, 18, 16, 2) + P('thin', 'M238 92h10')
    + P('con', 'M207 72V36') + P('sig', 'M207 72l-10-40M207 72l10-40') + C('key', 207, 30, 2.6)
    + P('ink', 'M252 92h40m-8-6l8 6l-8 6'));
}

// Sign language translation: signing on video → recognised gloss → text and speech.
{
  files['sign-language-translation'] = svg(
    R('ink paper draw', 14, 26, 96, 88, 6) + R('thin', 22, 34, 80, 72, 3) + hand('ink draw', 62, 98, 0.95)
    + P('con', 'M30 52c10-8 22-10 30-4') + C('key', 30, 52, 2.2)
    + arrow(118, 142, 70)
    + R('ink paper draw', 148, 52, 22, 14, 3) + R('ink paper draw', 176, 52, 22, 14, 3) + R('ink paper draw', 204, 52, 22, 14, 3)
    + P('thin', 'M148 82h78')
    + arrow(234, 254, 70)
    + P('sig draw', 'M262 46h44M262 56h34') + P('ink', 'M264 82h8l10-8v28l-10-8h-8z')
    + P('sig draw', 'M288 77a7 7 0 0 1 0 10M294 71a15 15 0 0 1 0 22M300 65a23 23 0 0 1 0 34'));
}

// Two-step biometrics: a face (VGG16) then a voice (ResCNN); both must agree before the door opens.
{
  files['two-step-auth'] = svg(
    corners(10, 32, 56, 70) + bust('ink draw', 38, 56, 11)
    + arrow(72, 90, 66)
    + R('ink paper draw', 96, 44, 40, 44, 5) + textLines(104, 56, [24, 18, 22], 8)
    + arrow(142, 160, 66)
    + P('sig draw', voice(166, 222, 66, 18))
    + arrow(228, 246, 66)
    + layers(252, 66, 2, 9, 40, 5)
    + C('ink draw', 296, 66, 15) + P('sig draw', 'M289 66l5 5l9-10'));
}

const NOTES = {
  'asl-t5-linear-projection': 'ASL translation: hand keypoints, one linear projection, the T5 encoder-decoder, English text.',
  'attendance-management': 'Face attendance: a face in the camera frame, a trained recognizer, the roll with ticks.',
  'bees-energy': 'BEES: meters on two campus buildings, a month of load, a forecast with its band.',
  'bess-edge-ai': 'Campus BESS: solar and a battery container, an edge device, an LSTM forecast.',
  'ecg-wavelet-nn': 'ECG on a microcontroller: heartbeats, wavelet detail bands, a small network on the board, beat classes.',
  'echomind-mamba-va-ser': 'EchoMind: speech and transcript, a bidirectional Mamba stack, a distribution on the valence-arousal plane.',
  'invigilation-semantic': 'Invigilation: a classroom from above, segmentation regions and a face box, one flag.',
  patrolbot: 'PatrolBot: the car settles onto a straight course beside a wall it measures.',
  'sign-language-translation': 'Sign language translation: signing on video, recognised glosses, text and speech.',
  'two-step-auth': 'Two-step biometrics: face, then voice; both must agree.',
};
const fmt = (name, body) => `<!-- ${NOTES[name]} -->\n` + body.trim()
  .replace(/(<svg[^>]*>)(?=<)/, '$1\n')
  .replace(/(<\/(?:path|circle|rect)>)(?=<(?!\/))/g, '$1\n') + '\n';
let total = 0;
for (const [name, raw] of Object.entries(files)) {
  const body = fmt(name, raw);
  writeFileSync(`${OUT}/${name}.svg`, body);
  total += Buffer.byteLength(body);
  console.log(name.padEnd(28), Buffer.byteLength(body));
}
console.log('total', total, (total / 1024).toFixed(1) + ' KB');
