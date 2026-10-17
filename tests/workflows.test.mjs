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
