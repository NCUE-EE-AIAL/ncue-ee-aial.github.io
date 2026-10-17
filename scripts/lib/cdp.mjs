// Minimal Chrome DevTools Protocol driver (headless google-chrome) for screenshots and live checks.
// Local dev tool used by scripts/hero-verify.mjs; node built-ins only, nothing here ships with the site.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function launch() {
  const profile = mkdtempSync(join(tmpdir(), 'chrome-profile-'));
  const proc = spawn('google-chrome', [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run',
    '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const t = setTimeout(() => reject(new Error('chrome did not start')), 20000);
    proc.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(t); resolve(m[1]); }
    });
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let seq = 0;
  const pending = new Map();
  const waiters = [];
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    } else if (msg.method) {
      for (const w of [...waiters]) if (w.method === msg.method && (!w.sessionId || w.sessionId === msg.sessionId)) { waiters.splice(waiters.indexOf(w), 1); w.resolve(msg.params); }
    }
  });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const waitFor = (method, sessionId, ms = 20000) => new Promise((resolve, reject) => {
    const w = { method, sessionId, resolve };
    waiters.push(w);
    setTimeout(() => { const i = waiters.indexOf(w); if (i >= 0) { waiters.splice(i, 1); reject(new Error(`timeout waiting for ${method}`)); } }, ms);
  });

  async function newPage({ width = 1280, height = 900, dark = false, reduce = false, js = true, dpr = 1 } = {}) {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const call = (m, p) => send(m, p, sessionId);
    await call('Page.enable');
    await call('Runtime.enable');
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile: width < 600 });
    await call('Emulation.setEmulatedMedia', { features: [
      { name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' },
      { name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' },
    ] });
    if (!js) await call('Emulation.setScriptExecutionDisabled', { value: true });
    const page = {
      call,
      async goto(url) {
        const loaded = waitFor('Page.loadEventFired', sessionId);
        await call('Page.navigate', { url });
        await loaded;
      },
      async eval(expression) {
        const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
        return r.result.value;
      },
      async shot(path, clip) {
        const r = await call('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}), captureBeyondViewport: !!clip });
        writeFileSync(path, Buffer.from(r.data, 'base64'));
        return path;
      },
      async click(selector) {
        // Scroll first: the mouse event goes to viewport coordinates, so a target below the fold (a phone-width page) would be missed.
        const box = await page.eval(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
        for (const type of ['mousePressed', 'mouseReleased']) await call('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
      },
      async key(key, code = key, keyCode = 0) {
        const text = { ' ': ' ', Enter: '\r' }[key];
        await call('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', key, code, windowsVirtualKeyCode: keyCode, ...(text ? { text } : {}) });
        await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode });
      },
      close: () => send('Target.closeTarget', { targetId }),
    };
    return page;
  }

  return {
    newPage,
    async close() { try { ws.close(); } catch {} proc.kill('SIGTERM'); await new Promise((r) => setTimeout(r, 300)); rmSync(profile, { recursive: true, force: true }); },
  };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
