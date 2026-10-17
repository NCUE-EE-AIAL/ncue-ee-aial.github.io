// Unit tests for src/lib/github.ts (build-time GitHub repo metadata). No network: fetch is stubbed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRepoMeta, repoLink } from '../src/lib/github.ts';

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

test('returns null when the API answers with a server error', async () => {
  const f = stubFetch(() => json({ message: 'Server Error' }, 500));
  try {
    assert.equal(await getRepoMeta('acme/broken'), null);
  } finally { f.restore(); }
});

test('marks a repository that does not exist (404) as missing', async () => {
  const f = stubFetch(() => json({ message: 'Not Found' }, 404));
  try {
    assert.deepEqual(await getRepoMeta('acme/deleted'), { missing: true });
  } finally { f.restore(); }
});

test('repoLink: the API URL; the plain repo URL when GitHub was unreachable; nothing for a missing repo', () => {
  assert.equal(repoLink({ ...sample, stars: 1, description: null, pushedAt: null, language: null, htmlUrl: 'https://github.com/acme/demo' }, 'acme/demo'), 'https://github.com/acme/demo');
  assert.equal(repoLink(null, 'acme/demo'), 'https://github.com/acme/demo');
  assert.equal(repoLink({ missing: true }, 'acme/gone'), undefined);
  assert.equal(repoLink(null, undefined), undefined);
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

test('warns with the repo and the reason when metadata is unavailable', async () => {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => { warnings.push(args.join(' ')); };
  const f = stubFetch((url) => (String(url).endsWith('/acme/gone') ? json({ message: 'Not Found' }, 404) : Promise.reject(new TypeError('fetch failed'))));
  try {
    await getRepoMeta('acme/gone');
    await getRepoMeta('acme/unreachable');
    assert.equal(warnings.length, 2);
    assert.match(warnings[0], /acme\/gone/);
    assert.match(warnings[0], /404/);
    assert.match(warnings[1], /acme\/unreachable/);
    assert.match(warnings[1], /fetch failed/);
  } finally {
    f.restore();
    console.warn = originalWarn;
  }
});
