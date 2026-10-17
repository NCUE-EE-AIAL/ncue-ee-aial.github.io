// Dependency-free image header reader shared by scripts/photo-prep.mjs and tests/photos.test.mjs, so the script and
// the tests cannot disagree. Returns { format, width, height, meta } where meta lists what could leak:
// 'exif', 'gps' (inside EXIF), 'xmp', 'iptc', 'app1'. Handles JPEG, PNG and WebP.
import { readFileSync } from 'node:fs';

/** @param {string | Buffer} input */
export function imageMeta(input) {
  const b = Buffer.isBuffer(input) ? input : readFileSync(input);
  if (b[0] === 0xff && b[1] === 0xd8) return jpeg(b);
  if (b.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return png(b);
  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return webp(b);
  throw new Error('not a JPEG, PNG or WebP file');
}

/** True when an EXIF TIFF block's first IFD points to a GPS IFD (tag 0x8825). */
function hasGps(tiff) {
  if (tiff.length < 8) return false;
  const le = tiff.toString('latin1', 0, 2) === 'II';
  const u16 = (o) => (le ? tiff.readUInt16LE(o) : tiff.readUInt16BE(o));
  const u32 = (o) => (le ? tiff.readUInt32LE(o) : tiff.readUInt32BE(o));
  const ifd = u32(4);
  if (ifd + 2 > tiff.length) return false;
  for (let i = 0, n = u16(ifd); i < n; i++) {
    const e = ifd + 2 + i * 12;
    if (e + 12 > tiff.length) break;
    if (u16(e) === 0x8825) return true;
  }
  return false;
}

function jpeg(b) {
  let off = 2, width = 0, height = 0;
  const meta = [];
  while (off + 4 <= b.length && b[off] === 0xff) {
    const marker = b[off + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { off += 2; continue; }
    if (marker === 0xd9 || marker === 0xda) break; // end of image, or the scan: no headers after it
    const len = b.readUInt16BE(off + 2);
    const seg = b.subarray(off + 4, off + 2 + len);
    if (marker === 0xe1) {
      if (seg.toString('latin1', 0, 4) === 'Exif') {
        meta.push('exif');
        if (hasGps(seg.subarray(6))) meta.push('gps');
      } else if (seg.toString('latin1', 0, 28) === 'http://ns.adobe.com/xap/1.0/') meta.push('xmp');
      else meta.push('app1');
    } else if (marker === 0xed) meta.push('iptc');
    else if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      height = seg.readUInt16BE(1);
      width = seg.readUInt16BE(3);
    }
    off += 2 + len;
  }
  return { format: 'jpeg', width, height, meta };
}

function png(b) {
  let off = 8, width = 0, height = 0;
  const meta = [];
  while (off + 8 <= b.length) {
    const len = b.readUInt32BE(off);
    const type = b.toString('latin1', off + 4, off + 8);
    const data = b.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); }
    else if (type === 'eXIf') meta.push('exif');
    else if (type === 'iTXt' && data.toString('latin1', 0, 17) === 'XML:com.adobe.xmp') meta.push('xmp');
    off += 12 + len;
  }
  return { format: 'png', width, height, meta };
}

function webp(b) {
  let off = 12, width = 0, height = 0;
  const meta = [];
  while (off + 8 <= b.length) {
    const type = b.toString('latin1', off, off + 4);
    const len = b.readUInt32LE(off + 4);
    const d = b.subarray(off + 8, off + 8 + len);
    if (type === 'VP8X') { width = 1 + d.readUIntLE(4, 3); height = 1 + d.readUIntLE(7, 3); }
    else if (type === 'VP8 ' && !width) { width = d.readUInt16LE(6) & 0x3fff; height = d.readUInt16LE(8) & 0x3fff; }
    else if (type === 'VP8L' && !width) { const v = d.readUInt32LE(1); width = (v & 0x3fff) + 1; height = ((v >> 14) & 0x3fff) + 1; }
    else if (type === 'EXIF') meta.push('exif');
    else if (type === 'XMP ') meta.push('xmp');
    off += 8 + len + (len & 1);
  }
  return { format: 'webp', width, height, meta };
}
