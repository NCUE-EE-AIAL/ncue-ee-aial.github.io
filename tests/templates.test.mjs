// GitHub issue forms list the research areas by slug; they must match src/content/research/ (deferred minor v1 #10).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const AREAS = readdirSync(join(ROOT, 'src/content/research')).filter((d) => statSync(join(ROOT, 'src/content/research', d)).isDirectory());

test('every issue form that offers research areas offers exactly the existing ones', () => {
  const dir = join(ROOT, '.github/ISSUE_TEMPLATE');
  const forms = readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).map((f) => [f, readFileSync(join(dir, f), 'utf8')]).filter(([, y]) => /id: areas/.test(y));
  assert.ok(forms.length > 0, 'no issue form lists research areas');
  for (const [f, y] of forms) {
    const start = y.indexOf('id: areas');
    const end = y.indexOf('- type:', start);
    const offered = [...y.slice(start, end < 0 ? undefined : end).matchAll(/- label: "([\w-]+) \(/g)].map((m) => m[1]);
    assert.deepEqual([...offered].sort(), [...AREAS].sort(), `${f} lists ${offered.join(', ')}`);
  }
});
