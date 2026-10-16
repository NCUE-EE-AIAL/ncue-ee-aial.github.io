#!/usr/bin/env node
// Link checker for the built site. Node >= 22, built-ins only.
//
// Usage: node scripts/check-links.mjs <dir> [--no-external] [--site https://ncue-ee-aial.github.io]
//   <dir>          folder with the built site (usually dist/)
//   --no-external  only check internal links, skip http(s) requests to other sites
//   --site <url>   absolute URLs starting with this origin are treated as internal
// Exit code: 1 if any ERROR (broken internal link/file, external 404/410), else 0.
// Warnings (missing #fragment, external 403/429/5xx/network trouble) never fail the run.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative, posix, extname, sep } from 'node:path';

const args = process.argv.slice(2);
let dir = null;
let external = true;
let site = 'https://ncue-ee-aial.github.io';
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--no-external') external = false;
  else if (a === '--site') site = args[++i];
  else if (a.startsWith('--site=')) site = a.slice(7);
  else if (a === '-h' || a === '--help') usage(0);
  else if (a.startsWith('--')) { console.error(`Unknown option: ${a}`); usage(2); }
  else dir = a;
}
function usage(code) {
  console.error('Usage: node scripts/check-links.mjs <dir> [--no-external] [--site https://ncue-ee-aial.github.io]');
  process.exit(code);
}
if (!dir) usage(2);
if (!site) usage(2);
const root = resolve(dir);
if (!existsSync(root) || !statSync(root).isDirectory()) {
  console.error(`Not a directory: ${dir}`);
  process.exit(2);
}
const siteOrigin = new URL(site).origin;

function walk(d) {
  const out = [];
  for (const name of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, name.name);
    if (name.isDirectory()) out.push(...walk(p));
    else if (name.name.endsWith('.html')) out.push(p);
  }
  return out;
}

// --- extraction -----------------------------------------------------------
const TAGS = new Set(['a', 'link', 'img', 'script', 'source', 'video', 'iframe']);
const tagRe = /<([a-zA-Z][a-zA-Z0-9]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;

function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'");
}

function extract(html) {
  const urls = [];
  const ids = new Set();
  for (const m of html.matchAll(tagRe)) {
    const tag = m[1].toLowerCase();
    const attrs = {};
    for (const a of m[2].matchAll(attrRe)) {
      attrs[a[1].toLowerCase()] = decode(a[2] ?? a[3] ?? a[4] ?? '');
    }
    if (attrs.id) ids.add(attrs.id);
    if (attrs.name && tag === 'a') ids.add(attrs.name);
    if (tag === 'meta') {
      if (attrs.property === 'og:image' && attrs.content) urls.push(attrs.content);
      continue;
    }
    if (!TAGS.has(tag)) continue;
    if (tag === 'link' && /\b(preconnect|dns-prefetch)\b/i.test(attrs.rel || '')) continue;
    for (const k of ['href', 'src', 'poster']) {
      if (attrs[k] !== undefined) urls.push(attrs[k]);
    }
  }
  return { urls, ids };
}

// --- resolution -----------------------------------------------------------
const idCache = new Map(); // file -> Set of ids
function idsOf(file) {
  if (!idCache.has(file)) idCache.set(file, extract(readFileSync(file, 'utf8')).ids);
  return idCache.get(file);
}

function isFile(p) {
  try { return statSync(p).isFile(); } catch { return false; }
}

function toFile(urlPath) {
  // urlPath: decoded, root-relative, no query/fragment, e.g. /zh/people/
  const rel = urlPath.replace(/^\/+/, '');
  const base = join(root, ...rel.split('/'));
  if (!resolve(base).startsWith(root)) return null;
  if (urlPath.endsWith('/') || rel === '') return isFile(join(base, 'index.html')) ? join(base, 'index.html') : null;
  if (extname(rel)) return isFile(base) ? base : null;
  if (isFile(join(base, 'index.html'))) return join(base, 'index.html');
  if (isFile(base + '.html')) return base + '.html';
  return null;
}

const errors = [];
const warnings = [];
const externalUrls = new Map(); // url -> Set(pages)
let internalChecked = 0;
const pages = walk(root);

for (const file of pages) {
  const pageRel = relative(root, file).split(sep).join('/');
  const pageUrlPath = '/' + pageRel;
  const { urls } = extract(readFileSync(file, 'utf8'));
  for (const raw of urls) {
    const url = raw.trim();
    if (!url || url === '#') continue;
    if (/^(mailto:|tel:|javascript:|data:)/i.test(url)) continue;

    let internalPath = null;
    let fragment = '';
    if (/^https?:\/\//i.test(url)) {
      let u;
      try { u = new URL(url); } catch { errors.push(`${pageRel} -> ${url}  (malformed URL)`); continue; }
      if (u.origin === siteOrigin) {
        internalPath = u.pathname;
        fragment = u.hash.slice(1);
      } else {
        if (!externalUrls.has(url)) externalUrls.set(url, new Set());
        externalUrls.get(url).add(pageRel);
        continue;
      }
    } else if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) {
      continue; // some other scheme (ftp:, etc.)
    } else if (url.startsWith('//')) {
      const full = 'https:' + url;
      if (!externalUrls.has(full)) externalUrls.set(full, new Set());
      externalUrls.get(full).add(pageRel);
      continue;
    } else {
      const hashAt = url.indexOf('#');
      const beforeHash = hashAt >= 0 ? url.slice(0, hashAt) : url;
      fragment = hashAt >= 0 ? url.slice(hashAt + 1) : '';
      const pathOnly = beforeHash.split('?')[0];
      internalPath = pathOnly === '' ? pageUrlPath
        : pathOnly.startsWith('/') ? pathOnly
        : posix.join(posix.dirname(pageUrlPath), pathOnly) + (pathOnly.endsWith('/') ? '/' : '');
    }

    internalPath = internalPath.split('?')[0];
    try { internalPath = decodeURIComponent(internalPath); } catch { /* keep as is */ }
    // posix.join drops a trailing slash only when it was not requested; "." / ".." cases end in a dir
    if (/(^|\/)\.\.?$/.test(internalPath)) internalPath += '/';
    internalChecked++;
    const target = toFile(internalPath);
    if (!target) {
      errors.push(`${pageRel} -> ${url}  (file not found)`);
      continue;
    }
    if (fragment && target.endsWith('.html')) {
      let frag = fragment;
      try { frag = decodeURIComponent(fragment); } catch { /* keep */ }
      if (!idsOf(target).has(frag) && !idsOf(target).has(fragment)) {
        warnings.push(`${pageRel} -> ${url}  (no id="${fragment}" in ${relative(root, target).split(sep).join('/')})`);
      }
    }
  }
}

// --- external -------------------------------------------------------------
const UA = 'Mozilla/5.0 (compatible; ncue-aial-link-check/1.0; +https://ncue-ee-aial.github.io)';

async function request(url, method) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Accept: '*/*' },
    });
    res.body?.cancel?.().catch(() => {});
    return { status: res.status };
  } catch (e) {
    return { error: e?.name === 'AbortError' ? 'timeout (10 s)' : (e?.cause?.code || e?.message || String(e)) };
  } finally {
    clearTimeout(timer);
  }
}

async function checkExternal(url) {
  let r = await request(url, 'HEAD');
  if (r.error || r.status === 405 || r.status === 501) r = await request(url, 'GET');
  return r;
}

if (external && externalUrls.size) {
  const queue = [...externalUrls.keys()];
  const worker = async () => {
    while (queue.length) {
      const url = queue.shift();
      const r = await checkExternal(url);
      const where = [...externalUrls.get(url)].slice(0, 3).join(', ') + (externalUrls.get(url).size > 3 ? ', ...' : '');
      if (r.error) warnings.push(`${where} -> ${url}  (${r.error})`);
      else if (r.status === 404 || r.status === 410) errors.push(`${where} -> ${url}  (HTTP ${r.status})`);
      else if (r.status >= 400) warnings.push(`${where} -> ${url}  (HTTP ${r.status})`);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
}

// --- report ---------------------------------------------------------------
errors.sort(); warnings.sort();
console.log(`Link check of ${dir}  (site origin ${siteOrigin})`);
console.log(`  pages scanned:     ${pages.length}`);
console.log(`  internal checked:  ${internalChecked}`);
console.log(`  external checked:  ${external ? externalUrls.size : `0 (skipped, ${externalUrls.size} found)`}`);
if (errors.length) { console.log('\nERRORS'); for (const e of errors) console.log('  ' + e); }
if (warnings.length) { console.log('\nWARNINGS'); for (const w of warnings) console.log('  ' + w); }
console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
