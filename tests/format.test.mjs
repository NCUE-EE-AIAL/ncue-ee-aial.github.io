// Unit tests for src/lib/format.ts (pure helpers used by the page components).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugOf, langOf, normName, isAuthor, initials, youtubeId, toBibtex } from '../src/lib/format.ts';

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
