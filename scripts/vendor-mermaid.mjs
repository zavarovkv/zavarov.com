#!/usr/bin/env node
// Keep Mermaid's ESM entry and lazy-loaded chunks together. The pinned npm
// package supplies every diagram type; browsers fetch only the types in use.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'node_modules/mermaid/dist');
if (!existsSync(source)) {
  console.warn('vendor-mermaid: dependency not installed — skipping');
  process.exit(0);
}
const { version } = JSON.parse(readFileSync(resolve(source, '../package.json'), 'utf8'));
const target = resolve(root, 'static/js/mermaid');
mkdirSync(target, { recursive: true });
cpSync(resolve(source, 'mermaid.esm.min.mjs'), resolve(target, 'mermaid.esm.min.mjs'));
cpSync(resolve(source, 'chunks/mermaid.esm.min'), resolve(target, 'chunks/mermaid.esm.min'), {
  recursive: true,
  filter: (path) => !path.endsWith('.map'),
});
// Remove only the former generated monolithic bundle, never authored assets.
rmSync(resolve(root, 'static/js/mermaid.min.js'), { force: true });
console.log('vendor-mermaid: Mermaid %s ESM entry and chunks copied to static/js/mermaid/', version);
