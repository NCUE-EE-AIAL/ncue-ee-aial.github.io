#!/usr/bin/env node
// Finds papers by Wen-Ren Yang that the site does not list yet and writes one unverified content file for each.
// Sources (free, no API key): his ORCID record and a Crossref author search; Crossref supplies the details.
// The weekly workflow (.github/workflows/pubs-sync.yml) runs this and opens a pull request for a person to check.
//   node scripts/pubs-sync.mjs [--dry-run]
// A paper the lab does not want listed goes into scripts/pubs-sync-ignore.txt (one DOI per line), so it is not
// suggested again. Node >= 22, built-ins only.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUBS = join(ROOT, 'src/content/publications');
const IGNORE = join(ROOT, 'scripts/pubs-sync-ignore.txt');
const MAILTO = 'ncueaial@gmail.com'; // Crossref's "polite pool": identifies the caller, nothing else.
const PI = 'Wen-Ren Yang';
// IEEE Xplore sometimes spells him "Wen-Reng Yang" (see 2026-pv-ess-digital-twin.yaml).
const SPELLINGS = ['wenrenyang', 'wenrengyang'];

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** A Crossref author is the PI: full name in either spelling, or "W.-R. Yang" / "W. R. Yang". */
export function isPi(author) {
  const given = author.given ?? '';
  const family = author.family ?? '';
  if (SPELLINGS.includes(norm(`${given}${family}`))) return true;
  return norm(family) === 'yang' && /^w\.?[\s-]*r\.?$/i.test(given.trim());
}

const TYPES = {
  'journal-article': 'journal', 'proceedings-article': 'conference', 'dissertation': 'thesis', 'posted-content': 'preprint',
};

/** Crossref work -> the fields of a publications/*.yaml file, or null if the PI is not an author. */
export function fromCrossref(w, today) {
  const authors = (w.author ?? []).map((a) => (a.name ?? [a.given, a.family].filter(Boolean).join(' ')).trim()).filter(Boolean);
  if (!(w.author ?? []).some(isPi)) return null;
  const year = (w.issued?.['date-parts']?.[0]?.[0]) ?? (w.created?.['date-parts']?.[0]?.[0]);
  const title = (w.title?.[0] ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (!year || !title || !authors.length) return null;
  const container = w['container-title']?.[0] ?? w.institution?.[0]?.name ?? w.publisher ?? '';
  const venue = [container, w.volume && `vol. ${w.volume}`, w.issue && `no. ${w.issue}`, w.page && `pp. ${w.page.replace('-', '–')}`]
    .filter(Boolean).join(', ');
  const doi = w.DOI.toLowerCase();
  return {
    title, authors, venue: venue || 'Unknown venue', year, type: TYPES[w.type] ?? 'other', doi,
    url: `https://doi.org/${doi}`,
    source: `Auto-imported from Crossref (https://api.crossref.org/works/${doi}) on ${today}. Not checked yet: open the publisher page, fix title/venue/authors and the research areas, then set verified: true with the page you opened.`,
  };
}

const q = (s) => JSON.stringify(s);
/** The YAML text for one paper, in the same layout as the hand-written files. */
export function toYaml(p) {
  return [
    'title:', `  en: ${q(p.title)}`,
    'authors:', ...p.authors.map((a) => `  - ${q(a)}`),
    `venue: ${q(p.venue)}`, `year: ${p.year}`, `type: ${p.type}`, `doi: ${q(p.doi)}`, `url: ${q(p.url)}`,
    'verified: false', `source: ${q(p.source)}`, '',
  ].join('\n');
}

/** File name like the existing ones: <year>-<first few title words>.yaml */
export function fileName(p, taken) {
  const words = p.title.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/[\s-]+/)
    .filter((w) => w.length > 2 && !['the', 'and', 'for', 'with', 'using', 'based', 'from'].includes(w)).slice(0, 4);
  const base = `${p.year}-${words.join('-') || 'paper'}`;
  let name = `${base}.yaml`;
  for (let i = 2; taken.has(name); i++) name = `${base}-${i}.yaml`;
  return name;
}

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': `ncue-aial-site (mailto:${MAILTO})` } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function main() {
  const dry = process.argv.includes('--dry-run');
  const today = new Date().toISOString().slice(0, 10);
  const files = readdirSync(PUBS).filter((f) => /\.ya?ml$/.test(f));
  const texts = files.map((f) => readFileSync(join(PUBS, f), 'utf8'));
  const known = new Set(texts.flatMap((t) => [...t.matchAll(/^doi:\s*"?([^"\n]+)"?/gm)].map((m) => m[1].trim().toLowerCase())));
  const knownTitles = new Set(texts.flatMap((t) => [...t.matchAll(/^\s+en:\s*"(.+)"\s*$/gm)].map((m) => norm(m[1]))));
  const ignored = new Set(existsSync(IGNORE)
    ? readFileSync(IGNORE, 'utf8').split('\n').map((l) => l.replace(/#.*/, '').trim().toLowerCase()).filter(Boolean) : []);

  const person = readFileSync(join(ROOT, 'src/content/people/wen-ren-yang.yaml'), 'utf8');
  const orcid = person.match(/orcid:\s*"https:\/\/orcid\.org\/([\d-]{19})"/)?.[1];

  const dois = new Set();
  if (orcid) {
    try {
      const works = await getJson(`https://pub.orcid.org/v3.0/${orcid}/works`);
      for (const g of works.group ?? []) for (const id of g['external-ids']?.['external-id'] ?? []) {
        if (id['external-id-type'] === 'doi') dois.add(id['external-id-value'].toLowerCase());
      }
    } catch (e) { console.warn(`ORCID: ${e.message}`); }
  }
  const byDoi = new Map();
  for (const name of [PI, 'Wen-Reng Yang']) {
    const url = `https://api.crossref.org/works?query.author=${encodeURIComponent(name)}&rows=100&mailto=${MAILTO}`;
    for (const w of (await getJson(url)).message.items) if ((w.author ?? []).some(isPi)) byDoi.set(w.DOI.toLowerCase(), w);
  }
  for (const d of dois) {
    if (byDoi.has(d) || known.has(d) || ignored.has(d)) continue;
    try { byDoi.set(d, (await getJson(`https://api.crossref.org/works/${encodeURIComponent(d)}?mailto=${MAILTO}`)).message); }
    catch (e) { console.warn(`Crossref ${d}: ${e.message}`); }
  }

  const taken = new Set(files);
  const added = [];
  for (const [doi, w] of [...byDoi].sort()) {
    if (known.has(doi) || ignored.has(doi)) continue;
    const p = fromCrossref(w, today);
    if (!p || knownTitles.has(norm(p.title))) continue;
    const name = fileName(p, taken);
    taken.add(name);
    added.push(`${name}: ${p.title} (${p.year}, doi ${doi})`);
    if (!dry) writeFileSync(join(PUBS, name), toYaml(p));
  }
  console.log(added.length ? `New papers:\n${added.map((a) => `- ${a}`).join('\n')}` : 'No new papers.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
