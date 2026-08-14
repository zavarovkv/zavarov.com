#!/usr/bin/env node
// Copies Mermaid's minified bundle out of node_modules into static/js/ so Hugo
// can serve it from our own domain (params.mermaidSrc in config.toml).
//
// Why a copy step instead of committing the file: at ~3 MB it would land in git
// history on every version bump. Why a copy step instead of loading it from a
// CDN at runtime: a pinned dependency is reviewed when it changes, is verified
// by npm against the integrity hash in package-lock.json, and cannot change
// under a page that is already deployed.
//
// Runs automatically via the postinstall hook, so `npm ci` (CI) and
// `npm install` (local) both produce it. Idempotent — safe to re-run.
//
// To bump: npm install -D mermaid@<ver> --save-exact, then render a page with
// mermaid = true and check the diagrams still draw. Older 11.x releases fail
// silently on modern syntax (animated edges, S@{ shape: ... }), and the reverse
// is possible too, which is exactly why the version is pinned.

import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'node_modules/mermaid/dist/mermaid.min.js');
const dest = resolve(root, 'static/js/mermaid.min.js');

if (!existsSync(src)) {
  // Not an error: `npm ci --omit=dev` legitimately has no mermaid. Anything
  // that needs the file (a Hugo build of a page with mermaid = true) will make
  // the absence obvious, so don't fail the install over it.
  console.warn('vendor-mermaid: %s not found — skipping', src);
  process.exit(0);
}

const bytes = readFileSync(src);
const sha384 = createHash('sha384').update(bytes).digest('base64');
const { version } = JSON.parse(
  readFileSync(resolve(root, 'node_modules/mermaid/package.json'), 'utf8'),
);

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);

console.log(
  'vendor-mermaid: mermaid %s -> static/js/mermaid.min.js (%d KB, sha384-%s)',
  version,
  Math.round(bytes.length / 1024),
  sha384,
);
