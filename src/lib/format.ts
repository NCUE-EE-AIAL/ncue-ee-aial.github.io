/** Pure helpers shared by the page components. No Astro imports, so node:test can load this file. */

/** Localized entries have ids like "biomedical-ai/en": the folder name is the URL slug. */
export function slugOf(id: string): string {
  return id.split('/')[0];
}

export function langOf(id: string): string {
  return id.split('/')[1] ?? 'en';
}

/** "Wen-Ren Yang", "Wen Ren Yang" and "WenRen Yang" all become "wenrenyang". */
export function normName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

/** "W.-R. Yang" -> ["W", "R", "Yang"]; "Wen-Ren Yang" -> ["Wen", "Ren", "Yang"]. */
const nameParts = (name: string) => name.split(/[\s.\-]+/).filter(Boolean);

/** `abbr` is `full` with every given name cut to its initial: "W. R. Yang" and "W.-R. Yang" for "Wen-Ren Yang". */
function isInitialsOf(abbr: string, full: string): boolean {
  const a = nameParts(abbr);
  const f = nameParts(full);
  if (f.length < 2 || a.length !== f.length) return false;
  if (normName(a[a.length - 1]) !== normName(f[f.length - 1])) return false;
  return a.slice(0, -1).every((w, i) => w.length === 1 && w.toLowerCase() === f[i][0].toLowerCase());
}

/** The same person: equal after normName, or one is the other written with initials. "Wen-Xun Yang" is not "Wen-Ren Yang". */
export function sameName(a: string, b: string): boolean {
  const n = normName(a);
  if (n && n === normName(b)) return true;
  return isInitialsOf(a, b) || isInitialsOf(b, a);
}

export function isAuthor(name: string, authors: readonly string[]): boolean {
  return authors.some((a) => sameName(name, a));
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** The 11-character video id of a YouTube URL, or null for anything else. */
export function youtubeId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www|m)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = u.pathname.slice(1);
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = u.pathname === '/watch'
      ? u.searchParams.get('v')
      : (u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] ?? null);
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

/** The video's page on YouTube (for the no-JavaScript fallback link). */
export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export type PubType = 'journal' | 'conference' | 'thesis' | 'preprint' | 'other';
export interface BibInput {
  title: string;
  authors: readonly string[];
  venue: string;
  year: number;
  type: PubType;
  doi?: string;
  url?: string;
}

const ENTRY: Record<PubType, string> = {
  journal: 'article', conference: 'inproceedings', thesis: 'mastersthesis', preprint: 'misc', other: 'misc',
};
const VENUE_FIELD: Record<PubType, string> = {
  journal: 'journal', conference: 'booktitle', thesis: 'school', preprint: 'howpublished', other: 'howpublished',
};
const STOP = new Set(['with', 'from', 'using', 'that', 'this', 'into', 'toward', 'towards', 'based']);
const esc = (s: string) => s.replace(/([&%$#_])/g, '\\$1');

/** Key like "chen2024twostep": first author's family name, year, first significant title word. */
function bibKey(p: BibInput): string {
  const family = (p.authors[0] ?? 'anon').trim().split(/\s+/).pop()!.toLowerCase().replace(/[^a-z]/g, '');
  const word = p.title.split(/\s+/)
    .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .find((w) => w.length > 3 && !STOP.has(w)) ?? '';
  return `${family}${p.year}${word}`;
}

export function toBibtex(p: BibInput): string {
  const fields: [string, string][] = [
    ['title', `{${esc(p.title)}}`],
    ['author', esc(p.authors.join(' and '))],
    [VENUE_FIELD[p.type], esc(p.venue)],
    ['year', String(p.year)],
  ];
  if (p.doi) fields.push(['doi', p.doi]);
  if (p.url) fields.push(['url', p.url]);
  return `@${ENTRY[p.type]}{${bibKey(p)},\n${fields.map(([k, v]) => `  ${k} = {${v}}`).join(',\n')}\n}`;
}

/** ROC academic year as a label: zh "113 學年度", en "2024–25" (ay + 1911, then the last two digits of ay + 1912). */
export function ayLabel(ay: number, lang: 'en' | 'zh'): string {
  return lang === 'zh' ? `${ay} 學年度` : `${ay + 1911}–${String(ay + 1912).slice(-2)}`;
}
