// Browser check of the built home hero: live checks (pause button, freeze, off-screen pause, keyboard, reduced motion, no JS)
// and screenshots of every scene at 1280 and 390 px, light and dark.
// Usage: npm run build && npm run verify:hero   (or: node scripts/hero-verify.mjs [distDir] [checks|shots|all])
// LOCAL DEV TOOL, not run in CI (nor by `npm test`): it needs google-chrome and python3 on the PATH.
// Exit code 1 if any check fails. Screenshots go to a fresh temp directory whose path is printed at the end.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, sleep } from './lib/cdp.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = resolve(process.argv[2] ?? join(ROOT, 'dist'));
const MODE = process.argv[3] ?? 'all';
if (!existsSync(join(DIST, 'index.html'))) { console.error(`${DIST}/index.html is missing: run \`npm run build\` first`); process.exit(2); }
const OUT = mkdtempSync(join(tmpdir(), 'hero-verify-'));
const PORT = await new Promise((res) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); }); });
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', DIST], { stdio: 'ignore' });
await sleep(700);
const BASE = `http://127.0.0.1:${PORT}`;
const log = [];
const check = (ok, msg) => { log.push(`${ok ? 'PASS' : 'FAIL'} ${msg}`); console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); };

const STATE = `(() => {
  const art = document.querySelector('.hero-art');
  const scenes = [...art.querySelectorAll('.scene')];
  // A scene shows when it is visible and not transparent. At the cycle's first 2.8 ms the last scene sits on its
  // 20% keyframe: visibility:visible at opacity ~1e-15, which no one can see (seen at load once fonts stopped blocking render).
  const visible = scenes.filter((s) => getComputedStyle(s).visibility === 'visible' && parseFloat(getComputedStyle(s).opacity) > 0.01);
  const cur = visible[0];
  const strokes = cur ? [...cur.querySelectorAll('.draw, .trace')].map((e) => parseFloat(getComputedStyle(e).strokeDashoffset)) : [];
  const op = (e) => { let o = 1; for (let n = e; n && n !== art; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o; };
  const opac = cur ? [...cur.querySelectorAll('.draw, .trace, .fade, .pop')].map(op) : [];
  const btn = art.querySelector('.hero-toggle');
  const anims = art.getAnimations({ subtree: true });
  return {
    visible: visible.map((s) => s.dataset.scene), maxOffset: Math.max(0, ...strokes), minOpacity: Math.min(1, ...opac),
    button: btn ? { display: getComputedStyle(btn).display, pressed: btn.getAttribute('aria-pressed'), label: btn.getAttribute('aria-label') } : null,
    classes: art.className, anims: anims.length, playStates: [...new Set(anims.map((a) => a.playState))],
    times: anims.slice(0, 3).map((a) => Math.round(a.currentTime)), height: Math.round(art.getBoundingClientRect().height),
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
  };
})()`;
const heroClip = `(() => { const r = document.querySelector('.hero').getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; })()`;
const artClip = `(() => { const r = document.querySelector('.hero-art').getBoundingClientRect(); return { x: r.x + scrollX - 8, y: r.y + scrollY - 8, width: r.width + 16, height: r.height + 16 }; })()`;
const seek = (ms) => `(() => { for (const a of document.querySelector('.hero-art').getAnimations({ subtree: true })) { a.pause(); a.currentTime = ${ms}; } })()`;
const frame = 'new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))';

const browser = await launch();
try {
  if (MODE !== 'shots') {
    // 1. Live: pause button by mouse, state, freeze, resume.
    let p = await browser.newPage({ width: 1280, height: 900 });
    await p.goto(`${BASE}/`);
    let s = await p.eval(STATE);
    check(s.anims > 50 && s.playStates.join() === 'running', `en 1280: ${s.anims} hero animations running`);
    check(s.button?.display === 'grid' && s.button.pressed === 'false' && s.button.label === 'Pause animation', `en: button shown, aria-pressed=false, label "${s.button?.label}"`);
    check(s.visible.length === 1 && s.visible[0] === 'emotion', `at load exactly one scene shows: ${s.visible}`);
    check(s.overflowX <= 0, `1280: no horizontal overflow (${s.overflowX})`);
    await sleep(7000); // into scene 2, mid-draw
    s = await p.eval(STATE);
    check(s.visible.join() === 'emg', `after 7 s the EMG scene shows: ${s.visible}`);
    await p.click('.hero-toggle');
    await p.eval(frame);
    const paused = await p.eval(STATE);
    check(paused.button.pressed === 'true' && /is-paused/.test(paused.classes), 'click: aria-pressed=true, .is-paused');
    check(paused.playStates.join() === 'paused', `click: every hero animation paused (${paused.playStates})`);
    check(paused.maxOffset === 0 && paused.minOpacity === 1, `paused: current scene fully drawn (max dashoffset ${paused.maxOffset}, min opacity ${paused.minOpacity})`);
    await p.shot(`${OUT}/paused-en-1280-light.png`, await p.eval(heroClip));
    await sleep(2500);
    const later = await p.eval(STATE);
    check(later.visible.join() === paused.visible.join() && later.times.join() === paused.times.join(), `paused 2.5 s: still ${later.visible}, clock frozen at ${later.times[0]} ms`);
    await p.click('.hero-toggle');
    await p.eval(frame);
    s = await p.eval(STATE);
    check(s.button.pressed === 'false' && !/is-paused/.test(s.classes) && s.playStates.join() === 'running', 'second click: aria-pressed=false, running again');
    // 2. Off screen: IntersectionObserver pauses, scrolling back resumes.
    await p.eval('window.scrollTo(0, 4000)');
    await sleep(600);
    s = await p.eval(STATE);
    check(/is-off/.test(s.classes) && s.playStates.join() === 'paused', `scrolled away: .is-off, animations ${s.playStates}`);
    await p.eval('window.scrollTo(0, 0)');
    await sleep(600);
    s = await p.eval(STATE);
    check(!/is-off/.test(s.classes) && s.playStates.join() === 'running', `scrolled back: running (${s.playStates})`);
    await p.close();

    // 3. Keyboard: Tab reaches the button, Space and Enter toggle it; focus ring screenshot.
    p = await browser.newPage({ width: 1280, height: 900 });
    await p.goto(`${BASE}/zh/`);
    let tabs = 0, onButton = false;
    for (; tabs < 40 && !onButton; tabs++) {
      await p.key('Tab', 'Tab', 9);
      onButton = await p.eval(`document.activeElement?.classList.contains('hero-toggle') ?? false`);
    }
    check(onButton, `zh: Tab reaches the pause button after ${tabs} presses`);
    await p.key(' ', 'Space', 32);
    await p.eval(frame);
    s = await p.eval(STATE);
    check(s.button.pressed === 'true' && s.button.label === '暫停動畫', `zh: Space pauses (aria-pressed=${s.button.pressed}), label "${s.button.label}"`);
    check(s.button.pressed === 'true', `zh: aria-pressed=true before the paused screenshot`);
    await p.shot(`${OUT}/focus-paused-zh-1280-light.png`, await p.eval(artClip));
    await p.key('Enter', 'Enter', 13);
    await p.eval(frame);
    s = await p.eval(STATE);
    check(s.button.pressed === 'false', `zh: Enter resumes (aria-pressed=${s.button.pressed})`);
    await p.close();

    // 4. Reduced motion: still first scene, fully drawn, no button.
    for (const width of [1280, 390]) {
      p = await browser.newPage({ width, height: 900, reduce: true });
      await p.goto(`${BASE}/`);
      await sleep(1500);
      s = await p.eval(STATE);
      check(s.anims === 0 && s.button.display === 'none' && s.visible.join() === 'emotion' && s.maxOffset === 0 && s.minOpacity === 1,
        `reduced motion ${width}: ${s.anims} animations, button ${s.button.display}, scene ${s.visible}, drawn ${s.maxOffset === 0 && s.minOpacity === 1}`);
      await p.shot(`${OUT}/reduced-motion-en-${width}-light.png`, await p.eval(artClip));
      await p.close();
    }
    // 5. No JS: still first scene, no button.
    for (const width of [1280, 390]) {
      p = await browser.newPage({ width, height: 900, js: false });
      await p.goto(`${BASE}/`);
      await sleep(1200);
      await p.call('Emulation.setScriptExecutionDisabled', { value: false });
      s = await p.eval(STATE);
      check(s.anims === 0 && s.button.display === 'none' && s.visible.join() === 'emotion' && s.maxOffset === 0 && s.minOpacity === 1,
        `no JS ${width}: ${s.anims} animations, button ${s.button.display}, scene ${s.visible}, drawn ${s.maxOffset === 0 && s.minOpacity === 1}`);
      await p.shot(`${OUT}/no-js-en-${width}-light.png`, await p.eval(artClip));
      await p.close();
    }
  }

  if (MODE !== 'checks') {
    // 6. Screenshots: / and /zh/, 1280 and 390, light and dark, one moment in each scene, plus paused.
    const sheets = [];
    for (const lang of ['en', 'zh']) for (const width of [1280, 390]) for (const theme of ['light', 'dark']) {
      const p = await browser.newPage({ width, height: width > 600 ? 820 : 900, dark: theme === 'dark' });
      await p.goto(`${BASE}${lang === 'zh' ? '/zh/' : '/'}`);
      await p.eval('document.fonts.ready');
      const files = [], heights = new Set();
      for (let k = 0; k < 5; k++) {
        await p.eval(seek(Math.round((k * 5.6 + (k % 2 ? 2.2 : 4.2)) * 1000))); // odd scenes mid-draw, even scenes fully drawn
        await p.eval(frame);
        const st = await p.eval(STATE);
        heights.add(st.height);
        if (st.overflowX > 0) check(false, `${lang} ${width}: horizontal overflow ${st.overflowX}px`);
        files.push(await p.shot(`${OUT}/${lang}-${width}-${theme}-scene${k + 1}.png`, await p.eval(width > 600 ? heroClip : artClip)));
      }
      await p.eval(seek(Math.round((2 * 5.6 + 1.0) * 1000)));
      await p.click('.hero-toggle');
      await p.eval(frame);
      const pausedState = await p.eval(STATE);
      check(pausedState.button.pressed === 'true' && pausedState.playStates.join() === 'paused', `${lang} ${width} ${theme}: pause click took effect (aria-pressed=${pausedState.button.pressed}, ${pausedState.playStates})`);
      files.push(await p.shot(`${OUT}/${lang}-${width}-${theme}-paused-scene3.png`, await p.eval(width > 600 ? heroClip : artClip)));
      check(heights.size === 1, `${lang} ${width} ${theme}: hero height constant across scenes (${[...heights]})`);
      if (width < 600) await p.shot(`${OUT}/${lang}-${width}-${theme}-page.png`);
      await p.close();
      sheets.push({ name: `${lang}-${width}-${theme}`, files });
    }
    writeFileSync(`${OUT}/sheets.json`, JSON.stringify(sheets));
  }
} finally {
  await browser.close();
  server.kill();
  writeFileSync(join(OUT, 'verify-log.txt'), log.join('\n') + '\n');
  const failed = log.filter((l) => l.startsWith('FAIL')).length;
  console.log(`\n${log.length - failed} passed, ${failed} failed; screenshots and log in ${OUT}`);
  if (failed) process.exitCode = 1;
}
