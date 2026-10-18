// Prepares photos for this public repository. Phone photos carry GPS and camera data: every photo goes through
// here before `git add`.
//   npm run photos -- <files or folders> --out <folder> [--group | --headshot]
// Output: JPEG, long edge at most 1600 px (2000 with --group, for the yearly group photo), quality 80 (lowered
// step by step if needed to stay under 400 KB), no metadata, sRGB, lowercase file names (IMG_1234.JPG → img-1234.jpg).
// --headshot: a 240×240 WebP for public/images/people/, cropped around the most salient part of the photo.
import sharp from 'sharp';
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { imageMeta } from './lib/imagemeta.mjs';

const args = process.argv.slice(2);
const at = args.indexOf('--out');
const HEADSHOT = args.includes('--headshot');
if (at < 0 || !args[at + 1] || (HEADSHOT && args.includes('--group'))) {
  console.error('usage: npm run photos -- <files or folders> --out <folder> [--group | --headshot]');
  process.exit(2);
}
const out = args[at + 1];
const MAX_EDGE = args.includes('--group') ? 2000 : 1600;
const MAX_BYTES = 400 * 1024;
const SMALL = 1200;
const inputs = args.filter((a, i) => i !== at && i !== at + 1 && a !== '--group' && a !== '--headshot');
const files = inputs
  .flatMap((p) => (statSync(p).isDirectory() ? readdirSync(p).sort().map((f) => join(p, f)) : [p]))
  .filter((f) => /\.(jpe?g|png|webp|heic|heif|tiff?)$/i.test(f));
const slug = (f) => basename(f, extname(f)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'photo';

mkdirSync(out, { recursive: true });
const names = new Set();
let failed = 0;
for (const f of files) {
  if (/\.hei[cf]$/i.test(f)) {
    console.error(`${f}: HEIC cannot be read here; export it as JPEG first (iPhone: Settings → Camera → Formats → Most Compatible)`);
    failed++;
    continue;
  }
  const name = `${slug(f)}.${HEADSHOT ? 'webp' : 'jpg'}`;
  if (names.has(name)) {
    console.error(`${f}: another input also becomes ${name}; rename one of them`);
    failed++;
    continue;
  }
  names.add(name);
  let quality = 80;
  let buf;
  for (;;) {
    // sharp writes no metadata unless asked to, and converts embedded colour profiles to sRGB.
    const img = sharp(f).autoOrient();
    buf = HEADSHOT
      ? await img.resize(240, 240, { fit: 'cover', position: sharp.strategy.attention }).webp({ quality }).toBuffer()
      : await img.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true, progressive: true }).toBuffer();
    if (buf.length <= MAX_BYTES || quality <= 60) break;
    quality -= 5;
  }
  const m = imageMeta(buf);
  if (buf.length > MAX_BYTES) { console.error(`${f}: still ${Math.round(buf.length / 1024)} KB at quality ${quality}; crop it or choose another photo`); failed++; continue; }
  if (m.meta.length > 0) { console.error(`${f}: the output still carries ${m.meta.join(', ')}; not written`); failed++; continue; }
  writeFileSync(join(out, name), buf);
  const edge = Math.max(m.width, m.height);
  console.log(`${join(out, name)}  ${m.width}×${m.height}  ${Math.round(buf.length / 1024)} KB${!HEADSHOT && edge < SMALL ? `  (small: long edge ${edge} px)` : ''}`);
}
process.exit(failed > 0 ? 1 : 0);
