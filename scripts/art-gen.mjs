// Generates src/assets/art/*.svg (hand-designed line drawings; geometry computed here, output is plain SVG).
// Usage: node scripts/art-gen.mjs [outDir]   (default src/assets/art; `npm run art`)
// The SVGs are generated: edit this script, not the SVG files. The plate contract is in CONTRIBUTING.md.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = resolve(process.argv[2] ?? `${ROOT}/src/assets/art`);
mkdirSync(OUT, { recursive: true });
const n = (v) => String(Math.round(v * 10) / 10);
const P = (cls, d, extra = '') => `<path class="${cls}"${extra} d="${d}"></path>`;
const C = (cls, x, y, r) => `<circle class="${cls}" cx="${n(x)}" cy="${n(y)}" r="${n(r)}"></circle>`;
const E = (cls, x, y, rx, ry, extra = '') => `<ellipse class="${cls}"${extra} cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}"></ellipse>`;
const R = (cls, x, y, w, h, rx = 0) => `<rect class="${cls}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${rx ? ` rx="${n(rx)}"` : ''}></rect>`;
const G = (attrs, inner) => `<g ${attrs}>${inner}</g>`;
const DRAW = '';
const svg = (w, h, inner, par = 'xMaxYMid meet', vb = `0 0 ${w} ${h}`) =>
  `<svg class="art-svg" viewBox="${vb}" preserveAspectRatio="${par}" focusable="false">${inner}</svg>\n`;
const dots = (w, h) => R('dots', 0, 0, w, h).replace('></rect>', ' mask="url(#art-vignette)"></rect>');
const rad = (d) => (d * Math.PI) / 180;
const files = {};

// Shared patterns: the hero's dot grid and a breadboard / header hole grid.
files.defs = `<svg class="art art-defs" aria-hidden="true" focusable="false" width="0" height="0"><defs>`
  + `<pattern id="art-dots" width="20" height="20" patternUnits="userSpaceOnUse">${C('dot', 10, 10, 1.1)}</pattern>`
  + `<pattern id="art-holes" width="12" height="12" patternUnits="userSpaceOnUse">${R('hole', 3.5, 3.5, 5, 5, 1)}</pattern>`
  + `<radialGradient id="art-fade"><stop class="fade-in" offset="0.5"></stop><stop class="fade-out" offset="1"></stop></radialGradient>`
  + `<mask id="art-vignette" maskContentUnits="objectBoundingBox"><rect class="fade" width="1" height="1"></rect></mask>`
  + `</defs></svg>\n`;

// Research index: a layered network; one route lights up through it, fed by a wave.
{
  const L = [[190, [80, 120, 160]], [265, [40, 80, 120, 160, 200]], [340, [60, 100, 140, 180]], [415, [40, 80, 120, 160, 200]]];
  let web = '';
  for (let i = 0; i < L.length - 1; i++) for (const a of L[i][1]) for (const b of L[i + 1][1]) web += `M${L[i][0]} ${a}L${L[i + 1][0]} ${b}`;
  const lit = new Set(['190,120', '265,80', '340,140', '415,120']);
  let nodes = '';
  for (const [x, ys] of L) for (const y of ys) nodes += C(lit.has(`${x},${y}`) ? 'node lit' : 'node', x, y, 5);
  const outs = L[3][1].map((y) => `M421 ${y}H476`).join('');
  files.research = svg(480, 240, dots(480, 240) + P('web', web) + P('con', outs)
    + P('sig', 'M70 120q7.5-18 15 0t15 0t15 0t15 0t15 0t15 0t15 0t15 0L265 80L340 140L415 120', DRAW) + nodes);
}

// Wavelet and signal analysis: a steady wave with one short transient, over a dyadic time-frequency tiling; the tiles that catch the transient are lit.
{
  const x0 = 120, x1 = 472, T = 300, wide = x1 - x0;
  let d = '';
  for (let x = x0; x <= x1; x += 2) {
    const burst = Math.exp(-(((x - T) / 9) ** 2));
    const y = 66 - 10 * Math.sin((x - x0) / 9) - 34 * burst * Math.sin((x - T) / 1.6);
    d += (x === x0 ? 'M' : 'L') + n(x) + ' ' + n(y);
  }
  const rows = [[16, 112, 28], [8, 144, 20], [4, 168, 14], [2, 186, 10]];
  let tiles = '', lit = '';
  for (const [k, y, h] of rows) {
    const w = wide / k;
    for (let i = 0; i < k; i++) {
      const x = x0 + i * w;
      if (T >= x && T < x + w) lit += R('sig', x + 1, y + 1, w - 2, h - 2, 1);
      else tiles += R('thin', x + 1, y + 1, w - 2, h - 2, 1);
    }
  }
  files['wavelet-signal-analysis'] = svg(480, 240, dots(480, 240)
    + P('dim', `M${T} 24V206`) + P('con', `M${x0} 66H${x1}`)
    + tiles + lit
    + P('sig', d, DRAW) + C('key', T, 24, 3));
}

// Stereo 3D vision: a rectified image pair on shared scanlines; the cube sits 16 px apart (disparity).
{
  const cube = (x, y) => `M${x} ${y}h48v48h-48zm0 0l24-21h48l-24 21m24-21v48l-24 21`;
  const hidden = (x, y) => `M${x} ${y + 48}l24-21h48M${x + 24} ${y + 27}v-48`;
  const scan = [70, 95, 120, 145, 170].map((y) => `M110 ${y}H476`).join('');
  files['stereo-3d-vision'] = svg(480, 240, dots(480, 240)
    + P('con', scan)
    + P('con', 'M222 224L150 182M222 224L290 182M382 224L310 182M382 224L450 182')
    + P('dim', 'M230 224H374')
    + R('ink', 150, 50, 140, 130, 3) + R('ink', 310, 50, 140, 130, 3)
    + P('con', hidden(200, 95) + hidden(344, 95))
    + P('ink', cube(200, 95) + cube(344, 95))
    + P('sig', 'M200 95H344', DRAW) + C('key', 200, 95, 3) + C('key', 344, 95, 3)
    + C('ink paper', 222, 224, 5) + C('ink paper', 382, 224, 5));
}

// Robotic arm: a three-link kinematic sketch with joint angles, reach envelope and a pick-and-place path.
{
  const J1 = [230, 185], J2 = [275, 100], J3 = [365, 85], W = [392, 115];
  const u = [27 / Math.hypot(27, 30), 30 / Math.hypot(27, 30)], p = [-u[1], u[0]];
  const a = [W[0] - p[0] * 10, W[1] - p[1] * 10], b = [W[0] + p[0] * 10, W[1] + p[1] * 10];
  const tipA = [a[0] + u[0] * 14, a[1] + u[1] * 14], tipB = [b[0] + u[0] * 14, b[1] + u[1] * 14];
  const grip = `M${n(J3[0])} ${n(J3[1])}L${n(W[0])} ${n(W[1])}M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}M${n(a[0])} ${n(a[1])}L${n(tipA[0])} ${n(tipA[1])}M${n(b[0])} ${n(b[1])}L${n(tipB[0])} ${n(tipB[1])}`;
  const t1 = Math.atan2(J2[1] - J1[1], J2[0] - J1[0]), t2 = Math.atan2(J3[1] - J2[1], J3[0] - J2[0]);
  const arc = (c, r, from, to) => `M${n(c[0] + r * Math.cos(from))} ${n(c[1] + r * Math.sin(from))}A${r} ${r} 0 0 ${to > from ? 1 : 0} ${n(c[0] + r * Math.cos(to))} ${n(c[1] + r * Math.sin(to))}`;
  const ext = [J2[0] + Math.cos(t1) * 34, J2[1] + Math.sin(t1) * 34];
  const hatch = [0, 1, 2, 3, 4, 5, 6].map((i) => `M${200 + i * 10} 205l-8 9`).join('');
  const env = arc(J1, 200, rad(-112), 0);
  const end = [(tipA[0] + tipB[0]) / 2, (tipA[1] + tipB[1]) / 2];
  files['robotic-arm'] = svg(480, 240, dots(480, 240)
    + P('con', env) + P('con', 'M230 185L250 98L338 62L372 92')
    + P('dim', `M230 185H292${arc(J1, 28, 0, t1)}M${n(J2[0])} ${n(J2[1])}L${n(ext[0])} ${n(ext[1])}${arc(J2, 22, t1, t2)}`)
    + P('ink', `M196 205H268${hatch}M214 205l5-14h22l5 14`)
    + P('ink', `M230 185L275 100L365 85${grip}`)
    + P('sig', `M${n(end[0])} ${n(end[1])}C430 132 446 160 446 196`, DRAW)
    + P('dim', 'M430 204h32') + C('key', 446, 196, 3)
    + C('ink paper', 230, 185, 7) + C('ink paper', 275, 100, 7) + C('ink paper', 365, 85, 6));
}

// Biomedical AI: an ECG over three wavelet-like bands, R peaks marked, one RR interval measured.
{
  const beat = (c) => `H${c - 48}q5-7 10 0H${c - 8}l2 4l6-52l6 64l4-16H${c + 28}q12-16 24 0`;
  const ecg = `M96 92${beat(180)}${beat(300)}${beat(420)}H480`;
  const burst = (c) => `H${c - 8}l2-6l3 12l3-14l3 12l3-7l2 3`;
  const fine = `M110 150${burst(180)}${burst(300)}${burst(420)}H476`;
  const mid = `M110 182${[180, 300, 420].map((c) => `H${c - 20}q10-14 20 0q10 14 20 0`).join('')}H476`;
  const coarse = `M110 212q30-10 60 0t60 0t60 0t60 0t60 0t60 0`;
  files['biomedical-ai'] = svg(480, 240, dots(480, 240)
    + P('dim', 'M180 30V226M300 30V226') + P('thin', 'M180 22v8M300 22v8M180 26H300')
    + P('thin', fine) + P('thin', mid) + P('con', coarse)
    + P('sig', ecg, DRAW) + C('key', 180, 40, 3) + C('key', 300, 40, 3));
}

// Biometrics and security: whorl ridges with breaks, minutiae linked into a graph, a voice envelope beside it.
{
  const cx = 335, cy = 122, tilt = -14;
  let ridges = '';
  const breaks = ['', '48 7', '', '70 9 30 6', '', '120 10', '90 8 40 9', '', '160 12', '60 10 110 8', '', '200 14'];
  for (let i = 0; i < 12; i++) {
    const rx = 7 + 8.6 * i, ry = 10 + 10 * i;
    ridges += E('thin', cx + i * 0.9, cy - i * 0.6, rx, ry, breaks[i] ? ` stroke-dasharray="${breaks[i]}"` : '');
  }
  const pt = (i, deg) => {
    const rx = 7 + 8.6 * i, ry = 10 + 10 * i, t = rad(deg);
    const x = rx * Math.cos(t), y = ry * Math.sin(t), r = rad(tilt);
    return [cx + i * 0.9 + x * Math.cos(r) - y * Math.sin(r), cy - i * 0.6 + x * Math.sin(r) + y * Math.cos(r)];
  };
  const m = [pt(3, -150), pt(6, -40), pt(9, 70), pt(5, 150), pt(10, -100)];
  const graph = `M${m.map((q) => `${n(q[0])} ${n(q[1])}`).join('L')}Z`;
  const bars = [6, 10, 18, 12, 26, 34, 22, 40, 30, 18, 24, 12, 8, 14, 6].map((h, i) => `M${150 + i * 7} ${122 - h / 2}v${h}`).join('');
  files['biometrics-security'] = svg(480, 240, dots(480, 240)
    + G(`transform="rotate(${tilt} ${cx} ${cy})"`, ridges)
    + P('dim', graph) + P('thin', bars)
    + P('sig', 'M140 122H254', DRAW)
    + m.map((q) => C('sig paper', q[0], q[1], 4)).join(''));
}

// International programs: a tilted globe with meridians and parallels, an orbit, and a great-circle route out of Taiwan.
{
  const cx = 330, cy = 122, r = 92, tilt = -18;
  let g = C('ink', cx, cy, r);
  for (const lam of [30, 60]) g += E('thin', cx, cy, r * Math.sin(rad(lam)), r);
  g += P('thin', `M${cx} ${cy - r}V${cy + r}`);
  for (const phi of [-50, -25, 0, 25, 50]) {
    const y = cy - r * Math.sin(rad(phi)), a = r * Math.cos(rad(phi));
    g += E(phi === 0 ? 'thin' : 'con', cx, y, a, a * 0.16);
  }
  const A = [cx + 42, cy - 24], B = [cx - 64, cy + 30];
  files['international-programs'] = svg(480, 240, dots(480, 240)
    + E('con', cx, cy, 146, 42, ` transform="rotate(${tilt + 6} ${cx} ${cy})"`)
    + G(`transform="rotate(${tilt} ${cx} ${cy})"`, g)
    + P('sig', `M${n(A[0])} ${n(A[1])}Q${cx - 40} ${cy - 120} ${n(B[0])} ${n(B[1])}`, DRAW)
    + C('key', A[0], A[1], 3.2) + C('sig', A[0], A[1], 8) + C('key', B[0], B[1], 3));
}

// Publications: daily PV curves under the sun's arc; history in ink, a forecast with its band in signal colour.
{
  const hump = (x0, h, w = 64) => `M${x0} 200C${x0 + w * 0.32} 200 ${x0 + w * 0.3} ${200 - h} ${x0 + w / 2} ${200 - h}S${x0 + w * 0.68} 200 ${x0 + w} 200`;
  const hist = hump(152, 112) + hump(216, 66) + hump(280, 104);
  const fc = `M344 200C364.5 200 363.2 87 376 87S387.5 200 408 200C428.5 200 427.2 107 440 107S451.5 200 472 200`;
  const band = hump(344, 128) + hump(344, 96) + hump(408, 110) + hump(408, 80);
  const ticks = [152, 184, 216, 248, 280, 312, 344, 376, 408, 440, 472].map((x) => `M${x} 200v6`).join('');
  files.publications = svg(480, 240, dots(480, 240)
    + P('con', 'M120 214A190 190 0 0 1 480 214') + C('ink paper', 232, 97.4, 8) + P('thin', 'M245.0 97.4l4.0 0.0M241.2 106.6l2.8 2.8M232.0 110.4l0.0 4.0M222.8 106.6l-2.8 2.8M219.0 97.4l-4.0 0.0M222.8 88.2l-2.8 -2.8M232.0 84.4l-0.0 -4.0M241.2 88.2l2.8 -2.8')
    + P('ink', `M146 24V200H476${ticks}`)
    + P('dim', 'M344 18V206') + P('thin', hist) + P('con', band)
    + P('sig', fc, DRAW) + C('key', 376, 87, 3) + C('key', 440, 107, 3));
}

// Projects: an edge-AI board: QFP chip, camera module, header, mounting holes and routed traces.
{
  const pins = (x, y, dx, _dy, k, step, len) => {
    let d = '';
    for (let i = 0; i < k; i++) d += dx ? `M${x} ${y + i * step}h${len}` : `M${x + i * step} ${y}v${len}`;
    return d;
  };
  const qfp = pins(242, 90, 1, 0, 6, 9, 8) + pins(314, 90, 1, 0, 6, 9, 8) + pins(260, 72, 0, 1, 6, 9, 8) + pins(260, 144, 0, 1, 6, 9, 8);
  files.projects = svg(480, 240, dots(480, 240)
    + R('ink', 166, 28, 290, 186, 12)
    + [[182, 44], [440, 44], [182, 198], [440, 198]].map(([x, y]) => C('thin', x, y, 5)).join('')
    + R('ink paper', 250, 80, 64, 64, 4) + P('ink', qfp) + C('thin', 259, 89, 2.5)
    + R('ink paper', 362, 52, 60, 60, 5) + C('thin', 392, 82, 19) + C('thin', 392, 82, 9)
    + R('holes', 214, 176, 168, 24) + R('thin', 214, 176, 168, 24, 2)
    + P('thin', 'M322 99H340l12-12H362M322 117H346l10 10V164M269 152V164l-8 8H226M287 152V176M197 74H232l10 10V108')
    + P('sig', 'M392 112V136l-12 12H340l-8-8H322', DRAW)
    + C('sig paper', 392, 112, 3) + C('ink paper', 197, 74, 3) + C('ink paper', 226, 172, 3));
}

// People: a valence-arousal plane; speech comes in and lands as a distribution, not a single label.
{
  const cx = 330, cy = 120;
  const scatter = [[352, 84], [376, 92], [361, 104], [384, 78], [344, 99], [371, 70], [392, 101], [356, 116], [338, 82], [399, 86], [366, 61], [329, 104], [405, 70], [347, 66]];
  files.people = svg(480, 240, dots(480, 240)
    + C('con', cx, cy, 34) + C('con', cx, cy, 66) + C('ink', cx, cy, 98)
    + P('dim', `M${cx - 120} ${cy}H${cx + 126}M${cx} ${cy - 112}V${cy + 112}`)
    + G(`transform="rotate(-24 368 88)"`, E('con', 368, 88, 54, 34) + E('thin', 368, 88, 36, 22) + E('sig', 368, 88, 17, 10))
    + scatter.map(([x, y]) => C('dotk', x, y, 1.8)).join('')
    + P('sig', 'M106 120h8l4-6l4 12l4-20l4 30l4-38l4 34l4-24l4 16l4-28l4 36l4-18l4 8l4-4h6L368 88', DRAW)
    + C('key', 368, 88, 3.2));
}

// News: an oscilloscope screen, a triggered and decaying burst, two time cursors.
{
  let tk = '';
  for (let x = 184; x < 450; x += 14) tk += `M${x} 117v6`;
  for (let y = 36; y < 215; y += 14) if (Math.abs(y - 120) > 4) tk += `M307 ${y}h6`;
  const amps = [60, -48, 38, -30, 24, -19, 15, -12, 9, -7, 5, -4, 3, -2];
  const burst = `M176 120H206${amps.map((a) => `q8 ${-a} 16 0`).join('')}H446`;
  files.news = svg(480, 240, dots(480, 240)
    + R('ink', 168, 22, 286, 196, 12) + P('con', 'M168 120H454M310 22V218') + P('thin', tk)
    + P('dim', 'M206 34V206M270 34V206') + P('thin', 'M206 30h64M206 26v8M270 26v8')
    + P('sig', burst, DRAW) + P('key', 'M160 113l8 7l-8 7z'));
}

// Join: a breadboard waiting for parts: a DIP chip across the channel, a resistor, an LED, one jumper wire.
{
  const dipPins = [0, 1, 2, 3, 4].map((i) => `M${290 + i * 10} 104v-6M${290 + i * 10} 146v6`).join('');
  files.join = svg(480, 240, dots(480, 240)
    + R('ink', 156, 36, 300, 178, 8) + P('thin', 'M156 121H456M156 129H456M168 48H444M168 202H444')
    + R('holes', 168, 58, 276, 56) + R('holes', 168, 136, 276, 56)
    + R('ink paper', 280, 104, 60, 42, 3) + P('thin', `M280 120a5 5 0 0 1 0 10${dipPins}`)
    + P('ink', 'M186 80H202M238 80H254') + R('ink paper', 202, 73, 36, 14, 7) + P('thin', 'M211 74v12M219 74v12M227 74v12')
    + P('ink', 'M372 104V90a10 10 0 0 1 20 0V104M376 104v10M388 104v10M396 76l8-8m-5 0h5v5M400 86l8-8m-5 0h5v5')
    + P('sig', 'M190 48C220 4 330 4 354 70', DRAW) + C('key', 190, 48, 3) + C('key', 354, 70, 3)
    + P('thin', 'M340 136C362 136 370 122 382 114'));
}

// 404: a circuit left open. Current leaves the cell and stops at the switch; the lamp stays dark.
{
  files['404'] = svg(480, 300, dots(480, 300)
    + P('ink', 'M126 138H154M140 152V230H380V168M380 132V70H286')
    + P('ink', 'M132 152H148') + P('ink thick', 'M133 150H147')
    + C('ink', 380, 150, 18) + P('thin', 'M367.3 137.3l25.4 25.4M392.7 137.3l-25.4 25.4')
    + P('ink', 'M233 70L276 42') + P('dim', 'M276 42A44 44 0 0 1 280 64')
    + P('ink', 'M260 230V246M246 246H274M251 253H269M256 260H264')
    + P('sig', 'M140 138V70H228', DRAW)
    + C('ink paper', 232, 70, 4) + C('ink paper', 282, 70, 4) + C('key', 232, 70, 2), 'xMidYMid meet', '92 18 336 264');
}

// Grid fillers: an inverting amplifier (small wave in, larger wave out) and a chip fanning out to vias.
{
  files.opamp = svg(320, 180, dots(320, 180)
    + P('ink', 'M130 50V130L200 90Z') + P('thin', 'M138 70h8M138 110h8M142 106v8')
    + P('ink', 'M42 70H64l3-6l6 12l6-12l6 12l6-12l3 6H130M112 70V28H146l3-6l6 12l6-12l6 12l6-12l3 6H222V90H200')
    + P('ink', 'M130 110H104V128M94 128h20M98 134h12M102 140h4')
    + C('ink paper', 112, 70, 2.5) + C('ink paper', 222, 90, 2.5)
    + P('thin', 'M8 70q4-6 8 0t8 0t8 0t8 0')
    + P('sig', 'M222 90H244q6-28 12 0t12 0t12 0t12 0', DRAW), 'xMidYMid meet');
  const out = [
    'M160 62V40l-14-14H104', 'M176 62V40l14-14H232', 'M188 78H212l14-14V40', 'M188 102H212l14 14V146',
    'M176 118V140l14 14H232', 'M160 118V140l-14 14H104', 'M132 102H108l-14 14V146', 'M132 78H108l-14-14V40',
  ];
  const ends = [[104, 26], [232, 26], [226, 40], [226, 146], [232, 154], [104, 154], [94, 146], [94, 40]];
  let pins = '';
  for (let i = 0; i < 6; i++) pins += `M${139 + i * 8.4} 62v-6M${139 + i * 8.4} 118v6M132 ${69 + i * 8.4}h-6M188 ${69 + i * 8.4}h6`;
  files.chip = svg(320, 180, dots(320, 180)
    + P('thin', out.slice(1).join('')) + P('sig', out[0], DRAW)
    + R('ink paper', 132, 62, 56, 56, 4) + P('thin', pins) + C('thin', 141, 71, 2)
    + ends.map(([x, y], i) => C(i ? 'thin paper' : 'sig paper', x, y, 3.5)).join(''), 'xMidYMid meet');
}

// Wide-screen left gutter: an XY-scope graticule with a 3:4 Lissajous figure.
{
  const cx = 190, cy = 190, r = 130;
  let d = '';
  for (let i = 0; i < 180; i++) {
    const t = (i / 180) * 2 * Math.PI;
    d += (i ? 'L' : 'M') + n(cx + r * Math.sin(3 * t + Math.PI / 4)) + ' ' + n(cy + r * Math.sin(4 * t));
  }
  let tk = '';
  for (let k = -6; k <= 6; k++) if (k) tk += 'M' + (cx + k * 25) + ' ' + (cy - 3) + 'v6M' + (cx - 3) + ' ' + (cy + k * 25) + 'h6';
  files.bench = svg(380, 380, dots(380, 380)
    + P('con', 'M' + (cx - 170) + ' ' + cy + 'H' + (cx + 170) + 'M' + cx + ' ' + (cy - 170) + 'V' + (cy + 170))
    + P('thin', tk)
    + P('sig fine', d + 'Z'), 'xMaxYMin meet');
}

const NOTES = {
  defs: 'Shared patterns and the vignette mask, inlined once per page by Base.astro. Colours come from the .art rules in global.css.',
  research: 'Research index: a layered network; one route lights up through it, fed by a wave.',
  'wavelet-signal-analysis': 'Wavelet and signal analysis: a steady wave with one short transient over a dyadic time-frequency tiling; the tiles that catch it are lit.',
  'stereo-3d-vision': 'Stereo 3D vision: a rectified image pair on shared scanlines; the cube sits 16 units apart (disparity).',
  'robotic-arm': 'Robotic arm: a three-link kinematic sketch with joint angles, reach envelope and a pick-and-place path.',
  'biomedical-ai': 'Biomedical AI: an ECG over three wavelet-like bands, R peaks marked, one RR interval measured.',
  'biometrics-security': 'Biometrics and security: whorl ridges with breaks, minutiae linked into a graph, a voice envelope beside it.',
  'international-programs': 'International programs: a tilted globe, an orbit, and a great-circle route out of Taiwan.',
  publications: 'Publications: daily PV curves under the sun arc; history in ink, a forecast with its band in signal colour.',
  projects: 'Projects: an edge-AI board with a QFP chip, camera module, header, mounting holes and routed traces.',
  people: 'People: a valence-arousal plane; speech comes in and lands as a distribution, not a single label.',
  news: 'News: an oscilloscope screen, a triggered and decaying burst, two time cursors.',
  join: 'Join: a breadboard waiting for parts: a DIP chip across the channel, a resistor, an LED, one jumper wire.',
  404: '404: a circuit left open. Current leaves the cell and stops at the switch; the lamp stays dark.',
  opamp: 'Grid filler: an inverting amplifier, small wave in, larger wave out.',
  chip: 'Grid filler: a chip fanning out to vias.',
  bench: 'Wide-screen left gutter: an XY-scope graticule with a 3:4 Lissajous figure.',
};
const fmt = (name, body) => `<!-- ${NOTES[name]} -->\n` + body.trim()
  .replace(/(<svg[^>]*>|<defs>)(?=<)/g, '$1\n')
  .replace(/(<\/(?:path|circle|ellipse|rect|g|pattern|radialGradient|mask|defs)>)(?=<(?!\/))/g, '$1\n') + '\n';
let total = 0;
for (const [name, raw] of Object.entries(files)) {
  const body = fmt(name, raw);
  writeFileSync(`${OUT}/${name}.svg`, body);
  total += Buffer.byteLength(body);
  console.log(name.padEnd(26), Buffer.byteLength(body));
}
console.log('total', total, (total / 1024).toFixed(1) + ' KB');
