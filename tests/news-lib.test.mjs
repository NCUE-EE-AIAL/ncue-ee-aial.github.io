// Unit tests for src/lib/news.mjs: which posts the homepage shows.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recentNews } from '../src/lib/news.mjs';

const post = (date) => ({ id: date, data: { date: new Date(`${date}T00:00:00Z`) } });
const NOW = new Date('2026-10-18T12:00:00Z');

test('recentNews keeps posts from the last 12 months, newest first, at most 3', () => {
  const posts = [post('2026-10-01'), post('2026-06-30'), post('2026-01-15'), post('2025-12-24'), post('2025-01-01')];
  assert.deepEqual(recentNews(posts, NOW).map((p) => p.id), ['2026-10-01', '2026-06-30', '2026-01-15']);
});

test('recentNews counts 12 calendar months back from the build date', () => {
  assert.deepEqual(recentNews([post('2025-10-18')], NOW).map((p) => p.id), ['2025-10-18']);
  assert.deepEqual(recentNews([post('2025-10-17')], NOW), []);
});

test('recentNews returns nothing when every post is old, so the homepage drops the column', () => {
  assert.deepEqual(recentNews([post('2024-05-01'), post('2023-01-01')], NOW), []);
});

test('recentNews sorts by date even when the input is not sorted', () => {
  assert.deepEqual(recentNews([post('2026-02-01'), post('2026-09-01')], NOW).map((p) => p.id), ['2026-09-01', '2026-02-01']);
});
