// Unit tests for src/lib/github.ts (build-time GitHub repo metadata). No network: fetch is stubbed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRepoMeta } from '../src/lib/github.ts';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function stubFetch(impl) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return impl(url, init);
  };
  return { calls, restore: () => { globalThis.fetch = original; } };
}

const sample = {
  stargazers_count: 7,
  description: 'Demo repo',
  pushed_at: '2026-09-01T10:00:00Z',
  language: 'Python',
  html_url: 'https://github.com/acme/demo',
};

test('maps the GitHub API response to RepoMeta', async () => {
  const f = stubFetch(() => json(sample));
  try {
    const meta = await getRepoMeta('acme/demo');
    assert.deepEqual(meta, {
      stars: 7,
      description: 'Demo repo',
      pushedAt: '2026-09-01T10:00:00Z',
      language: 'Python',
      htmlUrl: 'https://github.com/acme/demo',
    });
    assert.equal(f.calls[0].url, 'https://api.github.com/repos/acme/demo');
  } finally { f.restore(); }
});

test('returns null when the API answers with an error status', async () => {
  const f = stubFetch(() => json({ message: 'Not Found' }, 404));
  try {
    assert.equal(await getRepoMeta('acme/missing'), null);
  } finally { f.restore(); }
});

test('returns null when the network fails', async () => {
  const f = stubFetch(() => { throw new TypeError('fetch failed'); });
  try {
    assert.equal(await getRepoMeta('acme/offline'), null);
  } finally { f.restore(); }
});

test('sends a bearer token only when GITHUB_TOKEN is set', async () => {
  const saved = process.env.GITHUB_TOKEN;
  const f = stubFetch(() => json(sample));
  try {
    process.env.GITHUB_TOKEN = 'tok123';
    await getRepoMeta('acme/with-token');
    delete process.env.GITHUB_TOKEN;
    await getRepoMeta('acme/no-token');
    const auth = (i) => new Headers(f.calls[i].init?.headers).get('authorization');
    assert.equal(auth(0), 'Bearer tok123');
    assert.equal(auth(1), null);
  } finally {
    f.restore();
    if (saved === undefined) delete process.env.GITHUB_TOKEN; else process.env.GITHUB_TOKEN = saved;
  }
});

test('fetches each repo at most once per build', async () => {
  const f = stubFetch(() => json(sample));
  try {
    await Promise.all([getRepoMeta('acme/cached'), getRepoMeta('acme/cached')]);
    await getRepoMeta('acme/cached');
    assert.equal(f.calls.length, 1);
  } finally { f.restore(); }
});
