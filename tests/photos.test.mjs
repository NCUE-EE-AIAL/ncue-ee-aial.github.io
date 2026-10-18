// Photos go into a public repository: no EXIF, XMP or GPS, at most 400 KB, resized. scripts/photo-prep.mjs
// (`npm run photos`) makes them so; this test checks every committed photo and that the script removes GPS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { imageMeta } from '../scripts/lib/imagemeta.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const IMG = /\.(jpe?g|png|webp|avif|heic|heif|tiff?|gif)$/i;
function images(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? images(join(dir, e.name)) : IMG.test(e.name) ? [join(dir, e.name)] : []);
}
const committed = [...images(join(ROOT, 'src/content')), ...images(join(ROOT, 'public/images'))];
const maxEdge = (f) => (f.includes('/public/images/people/') ? 800 : f.includes('/src/content/group-photos/') ? 2000 : 1600);
const fix = (f) => (f.includes('/public/images/people/') ? '`npm run photos -- <photo> --out public/images/people --headshot`' : '`npm run photos`');

test('committed photos are JPEG, PNG or WebP without EXIF, XMP or GPS', () => {
  for (const f of committed) {
    const where = f.slice(ROOT.length);
    assert.match(f, /\.(jpe?g|png|webp)$/i, `${where}: run it through ${fix(f)}`);
    assert.deepEqual(imageMeta(f).meta, [], `${where} carries metadata: run it through ${fix(f)}`);
  }
});

test('committed photos are at most 400 KB and within their size limit', () => {
  for (const f of committed) {
    const { width, height } = imageMeta(f);
    assert.ok(statSync(f).size <= 400 * 1024, `${f.slice(ROOT.length)} is ${Math.round(statSync(f).size / 1024)} KB`);
    assert.ok(Math.max(width, height) <= maxEdge(f), `${f.slice(ROOT.length)} is ${width}×${height}: run it through ${fix(f)}`);
  }
});

test('the checker flags a phone photo with GPS, and photo-prep removes it', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'photo-prep-'));
  try {
    const raw = join(dir, 'IMG_0042.JPG');
    await sharp({ create: { width: 2400, height: 1600, channels: 3, background: '#7a8c9e' } })
      .withExif({ IFD0: { Make: 'TestPhone' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '24/1 4/1 30/1' } })
      .jpeg().toFile(raw);
    assert.ok(imageMeta(raw).meta.includes('gps'), 'the checker must see the GPS block');
    execFileSync(process.execPath, [join(ROOT, 'scripts/photo-prep.mjs'), raw, '--out', join(dir, 'out')], { stdio: 'pipe' });
    const out = join(dir, 'out', 'img-0042.jpg');
    const m = imageMeta(out);
    assert.deepEqual(m.meta, []);
    assert.equal(Math.max(m.width, m.height), 1600);
    assert.ok(readFileSync(out).length <= 400 * 1024);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('photo-prep --headshot makes the 240×240 WebP that People cards use, without GPS', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'photo-prep-'));
  try {
    const raw = join(dir, 'IMG_0043.JPG');
    await sharp({ create: { width: 900, height: 600, channels: 3, background: '#9e8c7a' } })
      .withExif({ IFD0: { Make: 'TestPhone' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '24/1 4/1 30/1' } })
      .jpeg().toFile(raw);
    execFileSync(process.execPath, [join(ROOT, 'scripts/photo-prep.mjs'), raw, '--out', join(dir, 'out'), '--headshot'], { stdio: 'pipe' });
    const m = imageMeta(join(dir, 'out', 'img-0043.webp'));
    assert.equal(m.format, 'webp');
    assert.deepEqual([m.width, m.height], [240, 240]);
    assert.deepEqual(m.meta, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('package.json exposes `npm run photos`', () => {
  assert.equal(JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts.photos, 'node scripts/photo-prep.mjs');
});
