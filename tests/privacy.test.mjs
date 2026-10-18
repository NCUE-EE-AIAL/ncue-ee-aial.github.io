// The battery sponsor, its partners and the energy centre named after it are never named, on the site or anywhere
// in the repository, file and folder names included (Brian, 2026-10-18).
// The names are kept here only as [length, 32-bit rolling hash, sha256] of the normalised name: out of plain text,
// but not secret (short names can be brute-forced). CONTRIBUTING §5 explains the rule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DENY = [
  [2, 0x83ab3826, '818f7e31ef5ba6c89e25b67f39f57f2f4d16e4e03a41fa6bee04a49c7190f4e5'],
  [2, 0x83ab56fd, 'e6fda1f262d862e55b7003abe4b870504323022ac022ec4d05e2a5221d34c6cf'],
  [6, 0x35fed4c7, 'ae7241a2d33c76bb59116ffb1ea8c9ea878c2c3493eeace2fa4904225a2902b9'],
  [2, 0xf084b324, '8e18e5216240762fbb77b69817c9b0009361b3c6108b314b8f9bd4335e2aefb8'],
  [17, 0x02893deb, 'f4331b13b1ce4ee96e9ec0c020663f70b8ee4d3ce55bf6537b76bed8b9095951'],
  [7, 0xa2b923f0, 'dd69248e82491abc6518cb0a719ccd0672109ffe5da5feeb3a896b9bbf0e1c2a'],
  [19, 0x24c00896, "85422596435a8e7adf8f9b768af13b00fad29578a4fa888b5902b4d508ffbc4f"],
  [19, 0x31c01d00, "3f1e2e1818b88fd05b654df775bcba3f3e13779c99615d409ff539f154c34744"],
];
const TEXT = new Set(['.astro', '.ts', '.mjs', '.js', '.md', '.mdx', '.yaml', '.yml', '.json', '.css', '.html', '.xml', '.svg', '.txt']);
const SKIP = new Set(['node_modules', '.git', '.astro', '.cache']);
const B = 0x01000193;

const normalise = (s) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[øØ]/g, 'o').toLowerCase();
const roll = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(h, B) + s.charCodeAt(i)) >>> 0; return h; };
const sha = (s) => createHash('sha256').update(s).digest('hex');

/** Offsets (in the normalised text) where a denied name starts. Rolling hash first, sha256 to confirm. */
function findDenied(text, deny = DENY) {
  const s = normalise(text);
  const hits = [];
  for (const len of new Set(deny.map((d) => d[0]))) {
    if (s.length < len) continue;
    const want = new Map(deny.filter((d) => d[0] === len).map((d) => [d[1], d[2]]));
    let pow = 1;
    for (let i = 1; i < len; i++) pow = Math.imul(pow, B) >>> 0;
    let h = roll(s.slice(0, len));
    for (let i = 0; ; i++) {
      if (want.has(h) && sha(s.slice(i, i + len)) === want.get(h)) hits.push(i);
      if (i + len >= s.length) break;
      h = (Math.imul((h - Math.imul(s.charCodeAt(i), pow)) >>> 0, B) + s.charCodeAt(i + len)) >>> 0;
    }
  }
  return hits;
}

/** Paths under root, relative to it, whose name (any file or folder) or text content names a denied word. */
function deniedPaths(root, deny = DENY) {
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory() && SKIP.has(e.name)) return [];
    const named = findDenied(e.name, deny).length > 0;
    if (e.isDirectory()) return named ? [p, ...walk(p)] : walk(p);
    return named || (TEXT.has(extname(e.name)) && findDenied(readFileSync(p, 'utf8'), deny).length > 0) ? [p] : [];
  });
  return walk(root).map((p) => relative(root, p)).sort();
}

test('the scanner finds a denied name across case, accents and position', () => {
  const zebra = [[5, roll('zebra'), sha('zebra')]];
  assert.deepEqual(findDenied('A ZÉBRA crossed', zebra), [2]);
  assert.deepEqual(findDenied('zebra', zebra), [0]);
  assert.deepEqual(findDenied('no stripes here', zebra), []);
});

test('the scanner checks file and folder names too, photos included', () => {
  const zebra = [[5, roll('zebra'), sha('zebra')]];
  const dir = mkdtempSync(join(tmpdir(), 'privacy-'));
  try {
    mkdirSync(join(dir, 'albums', '2027-03-zebra-visit'), { recursive: true });
    writeFileSync(join(dir, 'albums', '2027-03-zebra-visit', 'index.yaml'), 'title: a visit\n');
    writeFileSync(join(dir, 'albums', 'Zebra-Tour.jpg'), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
    writeFileSync(join(dir, 'notes.md'), 'A ZÉBRA crossed\n');
    writeFileSync(join(dir, 'clean.md'), 'no stripes here\n');
    assert.deepEqual(deniedPaths(dir, zebra), ['albums/2027-03-zebra-visit', 'albums/Zebra-Tour.jpg', 'notes.md']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('no file in the repository or in dist/ names the battery sponsor or its partners', () => {
  const found = deniedPaths(ROOT);
  assert.deepEqual(found, [], `remove the sponsor's or partner's name from these files or file names: ${found.join(', ')}`);
});
