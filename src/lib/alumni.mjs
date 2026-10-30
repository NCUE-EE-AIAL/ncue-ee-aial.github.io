/** Alumni list helpers in plain JS, so the People page and node:test can both import them. */

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

const RANK = { phd: 0, master: 1, undergrad: 2, intern: 3 };

/**
 * Everyone who has left the lab, grouped by the year they left, newest first; unknown years last.
 * Sources: alumni people files (end of `years`), earlier stages of current members (`earlier`), interns who are no
 * longer current (`year`), and thesis authors (graduation year = ROC academic year + 1912). A thesis author with a
 * people file of the same Chinese name is listed once, through the people file, which takes the thesis year when it
 * has no `years`. Inside a year: PhD, master's, undergraduates, then interns; people files before thesis records.
 */
export function alumniYears({ people, interns, theses, today }) {
  const thesisYear = new Map(theses.map((t) => [t.data.student.zh, t.data.ay + 1912]));
  const zhNames = new Set(people.map((p) => p.data.name?.zh).filter(Boolean));
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
    entries.push({ key: `thesis:${t.id}`, kind: 'thesis', thesis: t, role: t.data.degree, year: t.data.ay + 1912 });
  }
  for (const it of interns) {
    if (isCurrentIntern(it.data, today)) continue;
    entries.push({ key: `intern:${it.id}`, kind: 'intern', intern: it, role: 'intern', year: it.data.year });
  }
  const years = [...new Set(entries.map((e) => e.year))].sort((a, b) => (b ?? -Infinity) - (a ?? -Infinity));
  return years.map((year) => ({
    year,
    list: entries.filter((e) => e.year === year).sort((a, b) => (RANK[a.role] ?? 9) - (RANK[b.role] ?? 9)),
  }));
}
