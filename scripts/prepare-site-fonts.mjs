import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const names = ['regular.otf', 'italic.otf', 'bold.otf'];
const partCount = 4;
const partSize = 47000; // Below GitHub's 48 KB per-secret limit.

function validate(files, manifest) {
  if (Object.keys(files).sort().join() !== [...names].sort().join()) throw new Error('Unexpected font bundle entries');
  for (const name of names) {
    const bytes = files[name];
    if (!Buffer.isBuffer(bytes) || bytes.toString('ascii', 0, 4) !== 'OTTO' ||
        createHash('sha256').update(bytes).digest('hex') !== manifest[name]) {
      throw new Error(`Font verification failed: ${name}`);
    }
  }
  return files;
}

export function packFonts(files, manifest) {
  validate(files, manifest);
  const json = JSON.stringify(Object.fromEntries(names.map(name => [name, files[name].toString('base64')])));
  const encoded = gzipSync(json).toString('base64');
  if (encoded.length > partCount * partSize) throw new Error('Font bundle exceeds configured secret capacity');
  // Balanced chunks keep all four secrets non-empty.
  const size = Math.ceil(encoded.length / partCount);
  return Array.from({ length: partCount }, (_, i) => encoded.slice(i * size, (i + 1) * size));
}

export function unpackFonts(parts, manifest) {
  if (parts.length !== partCount || parts.some(p => typeof p !== 'string' || !p.length || p.length > partSize)) {
    throw new Error('All four ALS_STORY_PART secrets must be present');
  }
  const encoded = parts.join('');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error('Invalid font bundle encoding');
  const entries = JSON.parse(gunzipSync(Buffer.from(encoded, 'base64'), { maxOutputLength: 1024 * 1024 }));
  if (!entries || typeof entries !== 'object' || Array.isArray(entries)) throw new Error('Invalid font bundle');
  const files = {};
  for (const [name, value] of Object.entries(entries)) {
    if (!names.includes(name) || typeof value !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
      throw new Error('Unexpected font bundle entries');
    }
    files[name] = Buffer.from(value, 'base64');
  }
  return validate(files, manifest);
}

async function main() {
  const manifest = JSON.parse(await readFile(join(root, 'scripts/als-story-manifest.json'), 'utf8'));
  const directory = join(root, 'assets/private-fonts/als-story');
  if (process.argv[2] === '--pack' && process.argv.length === 3) {
    const files = Object.fromEntries(await Promise.all(names.map(async name => [name, await readFile(join(directory, name))])));
    const parts = packFonts(files, manifest);
    const output = join(root, '.local/font-secrets');
    await mkdir(output, { recursive: true, mode: 0o700 });
    for (const [i, part] of parts.entries()) await writeFile(join(output, `part-${i + 1}`), part, { mode: 0o600 });
    console.log('Prepared four secret files in .local/font-secrets (contents are not printed).');
  } else if (process.argv[2] === '--restore' && process.argv.length === 3) {
    const parts = Array.from({ length: partCount }, (_, i) => process.env[`ALS_STORY_PART_${i + 1}`]);
    const files = unpackFonts(parts, manifest); // Validate the entire set before writing anything.
    await mkdir(directory, { recursive: true });
    for (const name of names) await writeFile(join(directory, name), files[name]);
    console.log('Verified and restored the three licensed site fonts.');
  } else throw new Error('Usage: node scripts/prepare-site-fonts.mjs --pack | --restore');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(() => { console.error('Site font preparation failed. Check the command, private files, manifest and four secrets.'); process.exitCode = 1; });
}
