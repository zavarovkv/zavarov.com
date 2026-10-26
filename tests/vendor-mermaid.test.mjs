import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { vendorMermaid } from '../scripts/vendor-mermaid.mjs';

test('vendoring replaces stale hashed chunks, omits source maps, and keeps unrelated assets', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'mermaid-vendor-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = join(root, 'node_modules/mermaid/dist');
  const target = join(root, 'static/js/mermaid');
  const chunkPath = 'chunks/mermaid.esm.min';
  for (const dir of [source, target]) await mkdir(join(dir, chunkPath), { recursive: true });
  await writeFile(join(source, '../package.json'), JSON.stringify({ version: 'test' }));
  await writeFile(join(source, 'mermaid.esm.min.mjs'), 'import "./chunks/mermaid.esm.min/current.mjs";');
  await writeFile(join(source, chunkPath, 'current.mjs'), 'export default {};');
  await writeFile(join(source, chunkPath, 'current.mjs.map'), '{}');
  await writeFile(join(target, chunkPath, 'obsolete.mjs'), 'old');
  await writeFile(join(target, 'notes.txt'), 'keep');
  vendorMermaid(root);
  vendorMermaid(root);
  assert.deepEqual(await readdir(join(target, chunkPath)), ['current.mjs']);
  assert.equal(await readFile(join(target, 'notes.txt'), 'utf8'), 'keep');
  assert.equal(await readFile(join(target, 'mermaid.esm.min.mjs'), 'utf8'), await readFile(join(source, 'mermaid.esm.min.mjs'), 'utf8'));
});

test('a missing Mermaid installation fails instead of silently keeping an old generated bundle', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'mermaid-missing-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.throws(() => vendorMermaid(root), { code: 'ENOENT' });
});
