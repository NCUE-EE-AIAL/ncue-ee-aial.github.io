/** Alumni list helpers in plain JS, so the People page and node:test can both import them. */
import { hasCjk } from './theses.mjs';

/** Last year of a closed span such as "2023–2025" (or a single "2024"); undefined for an open span ("2025–") or none. */
export function endYear(years) {
  const m = String(years ?? '').match(/^\s*(?:\d{4}\s*[–-]\s*)?(\d{4})\s*$/);
  return m ? Number(m[1]) : undefined;
}

/** An intern (entry data) is current through `until` when given, otherwise through the end of their `year`. */
export function isCurrentIntern(intern, today) {
  if (intern.until) return today.toISOString().slice(0, 10) <= intern.until.toISOString().slice(0, 10);
  return intern.year === today.getUTCFullYear();
}

/** ui key of the role tag on an alumnus: PhD and master's alumni are graduates (碩士畢業生); other roles keep their label. */
export function alumniRoleKey(role) {
  return role === 'phd' || role === 'master' ? `people.alumni.role.${role}` : `people.role.${role}`;
}

const RANK = { phd: 0, master: 1, undergrad: 2, intern: 3 };
const byRank = (a, b) => (RANK[a.role] ?? 9) - (RANK[b.role] ?? 9);

/**
 * Everyone who has left the lab, grouped by the year they left. Returns
 * - `years`: `{ year, list }` newest first;
 * - `undatedInterns`: past interns without a `year` (from the old lab site), in intern order;
 * - `undated`: everyone else without a year;
 * - `counts`: `{ phd, master, undergrad, intern }` over all of them; `from`: the earliest year (undefined when none).
 * Sources: alumni people files (end of `years`), earlier stages of current members (`earlier`), interns who are no
 * longer current (`year`), and thesis authors (graduation year = ROC academic year + 1912). A thesis author with a
 * people file of the same Chinese name is listed once, through the people file, which takes the thesis year when it
 * has no `years`. An intern whose `thesis` names one of the theses (a TEEP/IIPP intern who stayed for a degree) is
 * listed once, as that thesis author, with the intern record as `intern`. Inside a year: PhD, master's,
 * undergraduates, then interns; people files before thesis records.
 */
export function alumniYears({ people, interns, theses, today }) {
  const thesisYear = new Map(theses.map((t) => [t.data.student.zh, t.data.ay + 1912]));
  const zhNames = new Set(people.map((p) => p.data.name?.zh).filter(Boolean));
  const thesisIds = new Set(theses.map((t) => t.id));
  const stayedOn = new Map(interns.filter((it) => thesisIds.has(it.data.thesis?.id)).map((it) => [it.data.thesis.id, it]));
  const entries = [];
  for (const p of people) {
    if (p.data.role === 'pi') continue;
    if (p.data.alumni) {
      const year = endYear(p.data.years) ?? thesisYear.get(p.data.name?.zh);
      entries.push({ key: `person:${p.id}`, kind: 'person', person: p, role: p.data.role, year });
    } else {
      p.data.earlier.forEach((s, i) => entries.push({
        key: `earlier:${p.id}:${i}`, kind: 'earlier', person: p, role: s.role, year: endYear(s.years), nowRole: p.data.role,
      }));
    }
  }
  for (const t of theses) {
    if (zhNames.has(t.data.student.zh)) continue;
    entries.push({ key: `thesis:${t.id}`, kind: 'thesis', thesis: t, role: t.data.degree, year: t.data.ay + 1912, intern: stayedOn.get(t.id) });
  }
  for (const it of interns) {
    if (isCurrentIntern(it.data, today) || stayedOn.get(it.data.thesis?.id) === it) continue;
    entries.push({ key: `intern:${it.id}`, kind: 'intern', intern: it, role: 'intern', year: it.data.year });
  }
  const dated = entries.filter((e) => e.year !== undefined);
  const years = [...new Set(dated.map((e) => e.year))].sort((a, b) => b - a)
    .map((year) => ({ year, list: dated.filter((e) => e.year === year).sort(byRank) }));
  const counts = { phd: 0, master: 0, undergrad: 0, intern: 0 };
  for (const e of entries) if (e.role in counts) counts[e.role] += 1;
  return {
    years,
    undatedInterns: entries.filter((e) => e.year === undefined && e.kind === 'intern'),
    undated: entries.filter((e) => e.year === undefined && e.kind !== 'intern').sort(byRank),
    counts,
    from: years.at(-1)?.year,
  };
}

const initialsOf = (s) => { const w = s.trim().split(/\s+/).filter(Boolean); return w.length ? ((w[0][0] ?? '') + (w.length > 1 ? w.at(-1)[0] : '')).toUpperCase() : ''; };

/**
 * Text for a round avatar without a photo, from a name `{ en?, zh? }`: on the zh page the first character of the
 * Chinese name (the surname) when it is a Chinese character, otherwise initials (first and last word); on the en page
 * initials of the English name, falling back to the first Chinese character.
 */
export function avatarText(name, lang) {
  const en = name?.en?.trim() ?? '';
  const zh = name?.zh?.trim() ?? '';
  const han = zh && hasCjk([...zh][0]) ? [...zh][0] : '';
  if (lang === 'zh') return han || initialsOf(en || zh);
  return initialsOf(en) || han || initialsOf(zh);
}
