import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
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

test('the H1 font has a separate verified bundle and cannot satisfy body font secrets', () => {
  const sourdineFiles = {'medium.otf': Buffer.from('OTTO-test-fixture-sourdine-medium')};
  const sourdineManifest = {'medium.otf': createHash('sha256').update(sourdineFiles['medium.otf']).digest('hex')};
  const parts = packFonts(sourdineFiles, sourdineManifest, 'als-sourdine');
  assert.equal(parts.length, 2);
  assert.ok(parts.every(p => p.length > 0 && p.length <= 47000));
  assert.deepEqual(unpackFonts(parts, sourdineManifest, 'als-sourdine'), sourdineFiles);
  assert.throws(() => unpackFonts(parts.slice(1), sourdineManifest, 'als-sourdine'), /All 2/);
  assert.throws(() => unpackFonts(parts, {'medium.otf':'wrong'}, 'als-sourdine'), /verification failed/);
  assert.throws(() => unpackFonts(parts, manifest), /All 4/);
  assert.throws(() => packFonts(files, manifest, 'als-sourdine'), /Unexpected font bundle entries/);
  assert.throws(() => packFonts(sourdineFiles, sourdineManifest, '../unexpected'), /Unknown site font profile/);
});

test('the quotation font round-trips independently and rejects missing or mismatched parts', () => {
  const quoteFiles = {'regular.otf': Buffer.from('OTTO-test-fixture-mirta-regular')};
  const quoteManifest = {'regular.otf': createHash('sha256').update(quoteFiles['regular.otf']).digest('hex')};
  const parts = packFonts(quoteFiles, quoteManifest, 'als-mirta');
  assert.equal(parts.length, 2);
  assert.deepEqual(unpackFonts(parts, quoteManifest, 'als-mirta'), quoteFiles);
  assert.throws(() => unpackFonts(parts.slice(1), quoteManifest, 'als-mirta'), /All 2/);
  assert.throws(() => unpackFonts(parts, {'regular.otf': 'wrong'}, 'als-mirta'), /verification failed/);
  assert.throws(() => unpackFonts(parts, manifest, 'als-sourdine'), /Unexpected font bundle entries/);
});

// The checked bundle contains ALSStory-Bold with OS/2 usWeightClass = 700.
test('ALS Story registers the verified Bold face at 700', () => {
  const config = readFileSync(new URL('../config/fonts/als-story.toml', import.meta.url), 'utf8');
  assert.match(config, /^boldWeight = 700$/m);
  assert.match(config, /^titleWeight = 700$/m);
  assert.match(config, /source = "private-fonts[/]als-story[/]bold[.]otf"\nweight = 700/m);
  assert.doesNotMatch(config, /^boldWeight = 600$/m);
});
