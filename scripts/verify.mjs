#!/usr/bin/env node
// Dependency-free static-site sanity checks for Content Pulse.
// Catches the easy ways the app silently breaks: a renamed selector that
// only main.js still references, a moved asset, a stale README example.

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFile(join(ROOT, rel), 'utf8');
const exists = (rel) => existsSync(join(ROOT, rel));

const checks = [];
const check = (name, fn) => checks.push({ name, fn });

check('index.html links resolve to real files', async () => {
  const html = await read('index.html');
  for (const match of html.matchAll(/(?:href|src)="\.\/([^"#?]+)"/g)) {
    if (!exists(match[1])) throw new Error(`missing asset: ${match[1]}`);
  }
});

check('every data-role used in main.js exists in index.html', async () => {
  const [js, html] = await Promise.all([read('js/main.js'), read('index.html')]);
  const roles = new Set([...js.matchAll(/\[data-role="([^"]+)"\]/g)].map((m) => m[1]));
  const missing = [...roles].filter((role) => !html.includes(`data-role="${role}"`));
  if (missing.length) throw new Error(`index.html missing data-role: ${missing.join(', ')}`);
});

check('every data-field used in main.js exists in index.html', async () => {
  const [js, html] = await Promise.all([read('js/main.js'), read('index.html')]);
  const fields = new Set([...js.matchAll(/\[data-field="([^"]+)"\]/g)].map((m) => m[1]));
  const missing = [...fields].filter((field) => !html.includes(`data-field="${field}"`));
  if (missing.length) throw new Error(`index.html missing data-field: ${missing.join(', ')}`);
});

check('README json example parses', async () => {
  const readme = await read('README.md');
  const fence = readme.match(/```json\n([\s\S]*?)```/);
  if (!fence) throw new Error('no ```json fenced block found in README.md');
  JSON.parse(fence[1]);
});

let failed = 0;
for (const { name, fn } of checks) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`fail ${name}\n     ${error.message}`);
  }
}

if (failed) {
  console.error(`\n${failed} of ${checks.length} checks failed`);
  process.exit(1);
}

console.log(`\nall ${checks.length} checks passed`);
