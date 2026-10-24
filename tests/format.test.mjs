// Unit tests for src/lib/format.ts (pure helpers used by the page components).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { slugOf, langOf, pickLocalized, formatYm, normName, isAuthor, initials, youtubeId, toBibtex, toIeee } from '../src/lib/format.ts';

test('slugOf / langOf split a localized entry id', () => {
  assert.equal(slugOf('biomedical-ai/en'), 'biomedical-ai');
  assert.equal(langOf('biomedical-ai/zh'), 'zh');
  assert.equal(slugOf('kuan-wei-chen'), 'kuan-wei-chen');
});

test('isAuthor matches the spellings used across papers', () => {
  const authors = ['Kuan Wei Chen', 'Ting Yi Lin', 'Wen Ren Yang'];
  assert.ok(isAuthor('Wen-Ren Yang', authors));
  assert.ok(isAuthor('Kuan-Wei Chen', ['Tingyi Lin', 'Kuanwei Chen']));
  assert.ok(!isAuthor('Wen-Ren Yang', ['Wen-Ren Yao']));
  assert.equal(normName('Ting-Yi Lin'), 'tingyilin');
});

test('initials uses the first and last word', () => {
  assert.equal(initials('Wen-Ren Yang'), 'WY');
  assert.equal(initials('Bran'), 'B');
  assert.equal(initials('Suraj Muccu'), 'SM');
});

test('youtubeId accepts the usual YouTube URL shapes and rejects others', () => {
  assert.equal(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1s'), 'dQw4w9WgXcQ');
  assert.equal(youtubeId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(youtubeId('https://www.youtube.com/embed/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(youtubeId('https://youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(youtubeId('https://vimeo.com/123456'), null);
  assert.equal(youtubeId('https://www.youtube.com/watch?v=short'), null);
  assert.equal(youtubeId('not a url'), null);
});

test('toBibtex writes an inproceedings entry for a conference paper', () => {
  const bib = toBibtex({
    title: 'Two-step Authentication: Multi-biometric System Using Voice and Facial Recognition',
    authors: ['Kuan Wei Chen', 'Ting Yi Lin', 'Wen Ren Yang'],
    venue: 'ICETA 2024 & friends',
    year: 2024,
    type: 'conference',
    doi: '10.1049/icp.2024.4141',
  });
  assert.match(bib, /^@inproceedings\{chen2024twostep,\n/);
  assert.match(bib, /\n  title = \{\{Two-step Authentication: Multi-biometric System Using Voice and Facial Recognition\}\},\n/);
  assert.match(bib, /\n  author = \{Kuan Wei Chen and Ting Yi Lin and Wen Ren Yang\},\n/);
  assert.match(bib, /\n  booktitle = \{ICETA 2024 \\& friends\},\n/);
  assert.match(bib, /\n  doi = \{10\.1049\/icp\.2024\.4141\}\n\}$/);
});

test('toBibtex picks the entry type and venue field from the publication type', () => {
  const base = { title: 'Emotion as a Distribution', authors: ['Tingyi Lin'], venue: 'V', year: 2026 };
  assert.match(toBibtex({ ...base, type: 'journal' }), /^@article\{lin2026emotion,[\s\S]*journal = \{V\}/);
  assert.match(toBibtex({ ...base, type: 'preprint', url: 'https://arxiv.org/abs/2609.05755' }),
    /^@misc\{[\s\S]*howpublished = \{V\}[\s\S]*url = \{https:\/\/arxiv\.org\/abs\/2609\.05755\}/);
  assert.match(toBibtex({ ...base, type: 'thesis' }), /^@mastersthesis\{[\s\S]*school = \{V\}/);
});

test('isAuthor finds the PI under every spelling used in src/content/publications', () => {
  const dir = new URL('../src/content/publications/', import.meta.url);
  const names = new Set();
  for (const f of readdirSync(dir)) {
    const body = readFileSync(new URL(f, dir), 'utf8').split(/^authors:\s*$/m)[1]?.split(/^\S/m)[0] ?? '';
    for (const m of body.matchAll(/^\s+-\s*["']?(.+?)["']?\s*$/gm)) if (/\b(Yang|Y\.?)\b/.test(m[1])) names.add(m[1]);
  }
  const variants = ['Wen-Ren Yang', 'Wen Ren Yang', 'W. R. Yang', 'W.-R. Yang', 'WenRen Yang', 'wen-ren yang'];
  for (const v of variants) assert.ok(isAuthor('Wen-Ren Yang', [v]), `${v} should match`);
  for (const dataName of names) {
    if (['K. Y. Huang', 'N. Y. Chu', 'T. Y. Guo', 'Z. Y. He', 'Wen-Xun Yang'].includes(dataName)) continue;
    assert.ok(isAuthor('Wen-Ren Yang', [dataName]), `the data spells the PI "${dataName}"`);
  }
});

test('isAuthor does not over-match: other people and ambiguous initials stay plain', () => {
  for (const other of ['Wen-Xun Yang', 'W. X. Yang', 'R. W. Yang', 'W. Yang', 'W. R. Yao', 'K. Y. Huang', 'Wen-Ren Yao', 'Ren Yang']) {
    assert.ok(!isAuthor('Wen-Ren Yang', [other]), `${other} must not match`);
  }
  assert.ok(isAuthor('Kuan-Wei Chen', ['K.-W. Chen']));
  assert.ok(!isAuthor('Kuan-Wei Chen', ['K. Y. Chen']));
});

test('pickLocalized keeps one entry per folder: the page language, else en, else whatever exists', () => {
  const ids = (list) => list.map((e) => e.id).sort();
  const both = [{ id: 'a/en' }, { id: 'a/zh' }];
  assert.deepEqual(ids(pickLocalized(both, 'zh')), ['a/zh']);
  assert.deepEqual(ids(pickLocalized(both, 'en')), ['a/en']);
  assert.deepEqual(ids(pickLocalized([{ id: 'b/en' }], 'zh')), ['b/en']);
  assert.deepEqual(ids(pickLocalized([{ id: 'c/zh' }], 'en')), ['c/zh'], 'a zh-only post must still appear on the English site');
  assert.deepEqual(ids(pickLocalized([{ id: 'c/zh' }, { id: 'd/en' }, { id: 'd/zh' }], 'en')), ['c/zh', 'd/en']);
});

test('formatYm writes a YYYY-MM month for each language', () => {
  assert.equal(formatYm('2026-08', 'en'), 'Aug 2026');
  assert.equal(formatYm('2027-07', 'zh'), '2027 年 7 月');
  assert.equal(formatYm('2014-03', 'en'), 'Mar 2014');
});

test('toIeee writes an IEEE-style reference with initials and the right joiners', () => {
  const base = { title: 'Two-step Authentication', venue: 'ICETA 2024', year: 2024, type: 'conference', doi: '10.1049/icp.2024.4141' };
  assert.equal(toIeee({ ...base, authors: ['Kuan Wei Chen', 'Ting-Yi Lin', 'Wen-Ren Yang'] }),
    'K. W. Chen, T.-Y. Lin, and W.-R. Yang, "Two-step Authentication," in ICETA 2024, doi: 10.1049/icp.2024.4141.');
  assert.equal(toIeee({ ...base, type: 'journal', venue: 'IEEE Access', doi: undefined, authors: ['Guan-June Chu', 'Wen-Ren Yang'] }),
    'G.-J. Chu and W.-R. Yang, "Two-step Authentication," IEEE Access, 2024.');
});
