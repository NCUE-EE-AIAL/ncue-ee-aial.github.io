/**
 * Build-time GitHub repository metadata for project cards.
 * Reads process.env.GITHUB_TOKEN when present (set in .github/workflows/deploy.yml);
 * without it the public API allows 60 requests/hour, enough for a local build.
 * Any failure returns null and the card falls back to its YAML fields.
 */
export interface RepoMeta {
  stars: number;
  description: string | null;
  pushedAt: string | null;
  language: string | null;
  htmlUrl: string;
}

const cache = new Map<string, Promise<RepoMeta | null>>();

/** `ownerRepo` is "owner/name". Each repo is fetched at most once per build. */
export function getRepoMeta(ownerRepo: string): Promise<RepoMeta | null> {
  let pending = cache.get(ownerRepo);
  if (!pending) {
    pending = fetchRepoMeta(ownerRepo);
    cache.set(ownerRepo, pending);
  }
  return pending;
}

async function fetchRepoMeta(ownerRepo: string): Promise<RepoMeta | null> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ncue-aial-website-build',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`https://api.github.com/repos/${ownerRepo}`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.warn(`[github] ${ownerRepo}: HTTP ${res.status}; the project card shows its YAML fields only`);
      return null;
    }
    const j = await res.json();
    return {
      stars: j.stargazers_count ?? 0,
      description: j.description ?? null,
      pushedAt: j.pushed_at ?? null,
      language: j.language ?? null,
      htmlUrl: j.html_url ?? `https://github.com/${ownerRepo}`,
    };
  } catch (err) {
    console.warn(`[github] ${ownerRepo}: ${err instanceof Error ? err.message : String(err)}; the project card shows its YAML fields only`);
    return null;
  }
}
