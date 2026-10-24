// The deploy workflow is the last gate before the live site: it runs the same checks as pull requests,
// because content edited on github.com can land on main without a pull request.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const deploy = readFileSync(join(ROOT, '.github/workflows/deploy.yml'), 'utf8');

test('deploy builds, tests and checks links before it uploads the site', () => {
  const steps = ['npm ci', 'npm run build', 'npm test', 'scripts/check-links.mjs dist --no-external', 'actions/upload-pages-artifact@'];
  let at = -1;
  for (const step of steps) {
    const i = deploy.indexOf(step);
    assert.ok(i > at, `deploy.yml must run "${step}" after the step before it`);
    at = i;
  }
  assert.doesNotMatch(deploy, /withastro\/action/, 'withastro/action builds without running the tests');
  assert.match(deploy, /needs: build/);
  assert.match(deploy, /actions\/deploy-pages@/);
  assert.match(deploy, /GITHUB_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/, 'the build needs the token for GitHub stats');
});

test('deploy rebuilds weekly so date-based content stays current', () => {
  assert.match(deploy, /schedule:\s*\n\s*- cron: '17 21 \* \* 0'/);
  assert.match(deploy, /workflow_dispatch:/);
});

test('the weekly paper sync and link check run on a schedule with only the permissions they need', () => {
  const sync = readFileSync(join(ROOT, '.github/workflows/pubs-sync.yml'), 'utf8');
  assert.match(sync, /node scripts\/pubs-sync\.mjs/);
  assert.match(sync, /permissions:\n  contents: write\n  pull-requests: write\n/);
  const links = readFileSync(join(ROOT, '.github/workflows/links-weekly.yml'), 'utf8');
  assert.match(links, /node scripts\/check-links\.mjs dist >/, 'the weekly run must check outside links too (no --no-external)');
  assert.match(links, /permissions:\n  contents: read\n  issues: write\n/);
  for (const y of [sync, links]) {
    assert.match(y, /schedule:\s*\n\s*- cron: /);
    assert.match(y, /workflow_dispatch:/);
  }
});
