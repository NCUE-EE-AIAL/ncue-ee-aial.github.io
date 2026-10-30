// Pure helpers for the alumni lists on People (src/lib/alumni.mjs): end year of a span, current interns, alumni by year.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { endYear, isCurrentIntern, alumniYears } from '../src/lib/alumni.mjs';

const person = (id, data) => ({ id, data: { role: 'master', alumni: false, earlier: [], ...data } });
const intern = (id, data) => ({ id, data: { name: id, program: 'TEEP', ...data } });
const thesis = (id, zh, ay, degree = 'master') => ({ id, data: { student: { zh }, ay, degree } });
const OCT_2026 = new Date('2026-10-31T00:00:00Z');

test('endYear: the last year of a closed span; an open span or no span gives undefined', () => {
  assert.equal(endYear('2023–2025'), 2025);
  assert.equal(endYear('2015-2017'), 2017);
  assert.equal(endYear('2024'), 2024);
  assert.equal(endYear('2025–'), undefined);
  assert.equal(endYear(undefined), undefined);
  assert.equal(endYear('soon'), undefined);
});

test('isCurrentIntern: this year counts as current until the year ends; an until date wins', () => {
  assert.equal(isCurrentIntern(intern('a', { year: 2026 }).data, OCT_2026), true);
  assert.equal(isCurrentIntern(intern('a', { year: 2026 }).data, new Date('2027-01-01T00:00:00Z')), false);
  assert.equal(isCurrentIntern(intern('a', { year: 2025 }).data, OCT_2026), false);
  assert.equal(isCurrentIntern(intern('a', {}).data, OCT_2026), false);
  const until = new Date('2026-08-31T00:00:00Z');
  assert.equal(isCurrentIntern(intern('a', { year: 2026, until }).data, new Date('2026-08-31T12:00:00Z')), true);
  assert.equal(isCurrentIntern(intern('a', { year: 2026, until }).data, OCT_2026), false);
});

test('alumniYears: alumni by end year, earlier stages of current members, past interns, thesis authors at ay + 1912', () => {
  const groups = alumniYears({
    people: [
      person('pi', { role: 'pi' }),
      person('gorden', { role: 'undergrad', alumni: true, years: '2023–2025', name: { en: 'Kuan-Wei Chen', zh: '陳冠維' } }),
      person('brian', { years: '2025–', earlier: [{ role: 'undergrad', years: '2023–2025' }], name: { en: 'Ting-Yi Lin', zh: '林庭毅' } }),
      person('current', { years: '2025–', name: { en: 'Now Here' } }),
    ],
    interns: [intern('sneha', { year: 2026 }), intern('old', { year: 2024 }), intern('aman', {})],
    theses: [thesis('t1', '劉某某', 113), thesis('t2', '王某某', 105)],
    today: OCT_2026,
  });
  assert.deepEqual(groups.map((g) => g.year), [2025, 2024, 2017, undefined]);
  const y2025 = groups[0].list;
  assert.deepEqual(y2025.map((e) => e.key), ['thesis:t1', 'person:gorden', 'earlier:brian:0']);
  const brian = y2025.find((e) => e.kind === 'earlier');
  assert.equal(brian.role, 'undergrad');
  assert.equal(brian.nowRole, 'master');
  assert.deepEqual(groups[1].list.map((e) => e.key), ['intern:old']);
  assert.deepEqual(groups[3].list.map((e) => e.key), ['intern:aman']);
  const all = groups.flatMap((g) => g.list.map((e) => e.key));
  assert.ok(!all.includes('intern:sneha'), 'a current intern is not an alumnus');
  assert.ok(!all.includes('person:current') && !all.includes('person:pi'));
});

test('alumniYears: inside a year, master before undergrad before interns; people before thesis records of the same role', () => {
  const [g] = alumniYears({
    people: [
      person('u', { role: 'undergrad', alumni: true, years: '2024–2025', name: { en: 'U' } }),
      person('m', { role: 'master', alumni: true, years: '2023–2025', name: { en: 'M' } }),
    ],
    interns: [intern('i', { year: 2025 })],
    theses: [thesis('t', '某某', 113)],
    today: OCT_2026,
  });
  assert.deepEqual(g.list.map((e) => e.key), ['person:m', 'thesis:t', 'person:u', 'intern:i']);
});

test('alumniYears: a thesis author with a people file is listed once; a person without years takes the thesis year', () => {
  const groups = alumniYears({
    people: [
      person('johnson', { alumni: true, years: '2023–2025', name: { en: 'Zi-Xu Liu', zh: '劉子緒' } }),
      person('bill', { alumni: true, name: { en: 'Ming-Tung Chiu', zh: '邱明東' } }),
    ],
    interns: [],
    theses: [thesis('t113', '劉子緒', 113), thesis('t105', '邱明東', 105)],
    today: OCT_2026,
  });
  const keys = groups.flatMap((g) => g.list.map((e) => `${g.year}:${e.key}`));
  assert.deepEqual(keys, ['2025:person:johnson', '2017:person:bill']);
});

test('alumniYears: nothing in, nothing out', () => {
  assert.deepEqual(alumniYears({ people: [], interns: [], theses: [], today: OCT_2026 }), []);
});
