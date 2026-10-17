// Pure helpers for the thesis list (src/lib/theses.mjs): master/PhD split, student-name choice, language of a text.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitTheses, studentName, hasCjk, langOfText } from '../src/lib/theses.mjs';
import { AY_MIN, ayMax } from '../src/lib/rules.mjs';

const e = (id, ay, degree = 'master') => ({ id, data: { ay, degree, student: { zh: id } } });

test('splitTheses: master and phd apart, each grouped by ay newest first, input order kept inside a year', () => {
  const list = [e('a', 112), e('b', 114), e('p1', 113, 'phd'), e('c', 112), e('p2', 115, 'phd'), e('d', 114)];
  const { master, phd } = splitTheses(list);
  assert.deepEqual(master.map((g) => g.ay), [114, 112]);
  assert.deepEqual(master.map((g) => g.list.map((x) => x.id)), [['b', 'd'], ['a', 'c']]);
  assert.deepEqual(phd.map((g) => g.ay), [115, 113]);
  assert.deepEqual(phd.map((g) => g.list.map((x) => x.id)), [['p2'], ['p1']]);
});

test('splitTheses: no PhD entries gives an empty phd list; an empty input gives two empty lists', () => {
  assert.deepEqual(splitTheses([e('a', 113)]).phd, []);
  assert.deepEqual(splitTheses([]), { master: [], phd: [] });
});

test('studentName: international names show the same Latin form on both pages', () => {
  const intl = { zh: 'MONICA', en: 'Monica' };
  assert.equal(studentName(intl, 'zh'), 'Monica');
  assert.equal(studentName(intl, 'en'), 'Monica');
});

test('studentName: Chinese names stay Chinese on the zh page; the en page uses student.en when given', () => {
  assert.equal(studentName({ zh: '羅倪可', en: 'Nikola Radakovic' }, 'zh'), '羅倪可');
  assert.equal(studentName({ zh: '羅倪可', en: 'Nikola Radakovic' }, 'en'), 'Nikola Radakovic');
  assert.equal(studentName({ zh: '劉子緒' }, 'en'), '劉子緒');
  assert.equal(studentName({ zh: '劉子緒' }, 'zh'), '劉子緒');
  assert.equal(studentName({ zh: 'MONICA' }, 'zh'), 'MONICA', 'no en recorded: keep the record');
});

test('hasCjk and langOfText', () => {
  assert.equal(hasCjk('Monica'), false);
  assert.equal(hasCjk('使用Volder演算法'), true);
  assert.equal(langOfText('資訊工程學系'), 'zh-Hant-TW');
  assert.equal(langOfText('Nikola Radakovic'), 'en');
});

test('thesis ay range: 95 up to next ROC year', () => {
  assert.equal(AY_MIN, 95);
  assert.equal(ayMax(new Date('2026-10-17')), 117);
  assert.equal(ayMax(new Date('2027-01-01')), 118);
});
