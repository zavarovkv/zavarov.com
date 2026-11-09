import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { packFonts, unpackFonts } from '../scripts/prepare-site-fonts.mjs';

const files = Object.fromEntries(['regular.otf', 'italic.otf', 'bold.otf'].map(name => [name, Buffer.from(`OTTO-test-fixture-${name}`)]));
const manifest = Object.fromEntries(Object.entries(files).map(([name, bytes]) => [name, createHash('sha256').update(bytes).digest('hex')]));

test('private fonts survive secret chunking without changing bytes', () => {
  const parts = packFonts(files, manifest);
  assert.equal(parts.length, 4);
  assert.ok(parts.every(p => p.length > 0 && p.length <= 47000));
  assert.deepEqual(unpackFonts(parts, manifest), files);
});

test('missing secrets and unrecognized font bytes fail before publication', () => {
  const parts = packFonts(files, manifest);
  assert.throws(() => unpackFonts(parts.slice(1), manifest));
  assert.throws(() => unpackFonts([...parts.slice(0, 3), ''], manifest));
  assert.throws(() => unpackFonts(['..', ...parts.slice(1)], manifest));
  assert.throws(() => unpackFonts(parts, { ...manifest, 'regular.otf': 'wrong' }), /verification failed/);
  assert.throws(() => packFonts({ ...files, '../unexpected.otf': files['bold.otf'] }, manifest));
});
