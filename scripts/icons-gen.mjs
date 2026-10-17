// Generates public/apple-touch-icon.png (180×180) from public/favicon.svg.
// Usage: node scripts/icons-gen.mjs [outDir]   (default: public/; tests write to a temp dir and compare bytes)
// iOS rounds the corners itself, so the tile is drawn full-bleed (no rx) and opaque.
import sharp from 'sharp';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const out = process.argv[2] ?? join(ROOT, 'public');
const SIZE = 180;
const svg = readFileSync(join(ROOT, 'public/favicon.svg'), 'utf8').replace(/ rx="[^"]*"/, '');
const png = await sharp(Buffer.from(svg), { density: (72 * SIZE) / 32 })
  .resize(SIZE, SIZE)
  .flatten({ background: '#1a56db' })
  .png({ compressionLevel: 9, palette: false })
  .toBuffer();
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'apple-touch-icon.png'), png);
