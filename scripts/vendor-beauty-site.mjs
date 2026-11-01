import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const local = process.argv[2] === "--local" ? process.argv[3] : null;
const revision = local ? null : process.argv[2];
if ((!local && !/^[a-f0-9]{40}$/.test(revision || "")) || process.argv.length !== (local ? 4 : 3)) {
  throw new Error("Usage: node scripts/vendor-beauty-site.mjs <full reviewed SHA> | --local <checkout>");
}
const repository = "https://github.com/zavarovkv/beauty-css";
const source = `https://raw.githubusercontent.com/zavarovkv/beauty-css/${revision}/`;
const inputs = [
  "package.json", "LICENSE", "dist/manifest.json", "dist/beauty.css", "dist/beauty.min.css",
  "dist/beauty.prose.css", "dist/beauty.prose.min.css", "src/tokens.css",
  "site/catalog.mjs", "site/assets/specimen.svg",
];
const temporary = await mkdtemp(join(tmpdir(), "beauty-site-"));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
try {
  await Promise.all(inputs.map(async file => {
    let bytes;
    if (local) bytes = await readFile(resolve(local, file));
    else {
      const response = await fetch(new URL(file, source), { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
      bytes = Buffer.from(await response.arrayBuffer());
    }
    await mkdir(dirname(join(temporary, file)), { recursive: true });
    await writeFile(join(temporary, file), bytes);
  }));
  const manifest = JSON.parse(await readFile(join(temporary, "dist/manifest.json"), "utf8"));
  const pkg = JSON.parse(await readFile(join(temporary, "package.json"), "utf8"));
  if (manifest.name !== "beauty-css" || manifest.version !== pkg.version) throw new Error("Unexpected Beauty manifest");
  if (!(await readFile(join(temporary, "LICENSE"), "utf8")).startsWith("MIT License")) throw new Error("Missing MIT license");
  for (const file of inputs.filter(file => file.endsWith(".css") && file.startsWith("dist/"))) {
    if (hash(await readFile(join(temporary, file))) !== manifest.files[file.slice(5)]?.sha256) throw new Error(`CSS checksum mismatch: ${file}`);
  }
  // Import only reviewed specimens, not the independent demo's page shell or builder.
  const { catalog } = await import(pathToFileURL(join(temporary, "site/catalog.mjs")));
  const tokens = new Map();
  const colors = new Map();
  const tokenCSS = await readFile(join(temporary, "src/tokens.css"), "utf8");
  for (const [, name, declaration] of tokenCSS.matchAll(/(--beauty-[\w-]+):\s*([^;]+);/g)) {
    const value = declaration.trim();
    if (!tokens.has(name)) tokens.set(name, value);
    if (/^#[a-f0-9]{6}$/.test(value)) {
      if (!colors.has(name)) colors.set(name, [value, value]);
      else colors.get(name)[1] = value;
    }
  }
  const generated = join(temporary, "generated");
  await mkdir(join(generated, "data"), { recursive: true });
  await mkdir(join(generated, "public/assets"), { recursive: true });
  await cp(join(temporary, "dist"), join(generated, "public/dist"), { recursive: true });
  await cp(join(temporary, "LICENSE"), join(generated, "public/LICENSE"));
  await cp(join(temporary, "site/assets/specimen.svg"), join(generated, "public/assets/specimen.svg"));
  await writeFile(join(generated, "data/catalog.json"), JSON.stringify({
    version: pkg.version, gzip: manifest.files["beauty.min.css"].gzip,
    sections: Object.fromEntries(["ru", "en"].map(lang => [lang, catalog(lang, "/beauty/")])),
    colors: [...colors].map(([name, [light, dark]]) => ({ name, light, dark })),
    tokens: [...tokens].map(([name, value]) => ({ name, value })),
  }, null, 2) + "\n");
  const files = {};
  async function inventory(directory, prefix = "") {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = `${prefix}${entry.name}`;
      if (entry.isDirectory()) await inventory(join(directory, entry.name), `${path}/`);
      else if (entry.isFile()) files[path] = hash(await readFile(join(directory, entry.name)));
      else throw new Error(`Unsupported generated entry: ${path}`);
    }
  }
  await inventory(generated);
  for (const required of ["data/catalog.json", "public/dist/beauty.min.css", "public/LICENSE"]) {
    if (!files[required]) throw new Error(`Missing generated file: ${required}`);
  }
  const moduleRoot = join(root, "beauty");
  await mkdir(moduleRoot, { recursive: true });
  // Only generated specimens and downloads are replaced; Hugo owns page rendering.
  for (const directory of ["public", "data"]) {
    await rm(join(moduleRoot, directory), { recursive: true, force: true });
    await cp(join(generated, directory), join(moduleRoot, directory), { recursive: true });
  }
  await writeFile(join(moduleRoot, "upstream.json"), JSON.stringify({
    repository, revision, ...(local ? { source: "local-development" } : {}),
    version: pkg.version,
    files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))),
  }, null, 2) + "\n");
  console.log(`Vendored Beauty specimens and downloads ${pkg.version}: ${Object.keys(files).length} files`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
