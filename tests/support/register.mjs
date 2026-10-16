// Test-only: lets node:test import .ts files (this Node build has no built-in type stripping).
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

registerHooks({
  load(url, context, nextLoad) {
    if (!url.endsWith('.ts')) return nextLoad(url, context);
    const { outputText } = ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
      fileName: url,
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });
    return { format: 'module', source: outputText, shortCircuit: true };
  },
});
