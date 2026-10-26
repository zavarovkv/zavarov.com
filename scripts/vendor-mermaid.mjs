#!/usr/bin/env node
// Keep Mermaid's ESM entry and lazy-loaded chunks together. The pinned npm
// package supplies every diagram type; browsers fetch only the types in use.
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function vendorMermaid(root = resolve(dirname(fileURLToPath(import.meta.url)), '..')) {
  const source = resolve(root, 'node_modules/mermaid/dist');
  const { version } = JSON.parse(readFileSync(resolve(source, '../package.json'), 'utf8'));
  const target = resolve(root, 'static/js/mermaid');
  const chunkPath = 'chunks/mermaid.esm.min';
  const chunks = new Set(readdirSync(resolve(source, chunkPath)));
  mkdirSync(target, { recursive: true });
  cpSync(resolve(source, 'mermaid.esm.min.mjs'), resolve(target, 'mermaid.esm.min.mjs'));
  cpSync(resolve(source, chunkPath), resolve(target, chunkPath), {
    recursive: true,
    filter: (path) => !path.endsWith('.map'),
  });
  // This directory is generated. Upgrades must not keep obsolete hashed chunks.
  for (const entry of readdirSync(resolve(target, chunkPath), { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.mjs') && !chunks.has(entry.name)) {
      rmSync(resolve(target, chunkPath, entry.name));
    }
  }
  // Remove only the former generated monolithic bundle, never authored assets.
  rmSync(resolve(root, 'static/js/mermaid.min.js'), { force: true });
  console.log('vendor-mermaid: Mermaid %s ESM entry and chunks copied to static/js/mermaid/', version);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  vendorMermaid();
}
