import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
  "scripts/build-site.mjs", "site/catalog.mjs", "site/assets/site.css",
  "site/assets/theme.js", "site/assets/specimen.svg",
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
  // Reviewed upstream builder uses Node built-ins only; no npm install or CSS rebuild.
  execFileSync(process.execPath, [join(temporary, "scripts/build-site.mjs")], {
    cwd: temporary,
    env: { ...process.env, SITE_BASE_URL: "https://zavarov.com/beauty/", SITE_DEFAULT_LANGUAGE: "ru" },
    stdio: "inherit",
  });
  const files = {};
  async function inventory(directory, prefix = "") {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = `${prefix}${entry.name}`;
      if (entry.isDirectory()) await inventory(join(directory, entry.name), `${path}/`);
      else if (entry.isFile()) files[path] = hash(await readFile(join(directory, entry.name)));
      else throw new Error(`Unsupported generated entry: ${path}`);
    }
  }
  await inventory(join(temporary, "_site"));
  for (const required of ["index.html", "en/index.html", "LICENSE", "sitemap.xml"]) {
    if (!files[required]) throw new Error(`Missing generated file: ${required}`);
  }
  const moduleRoot = join(root, "beauty");
  await mkdir(moduleRoot, { recursive: true });
  // Only generated files in this dedicated module are replaced.
  const staged = await mkdtemp(join(moduleRoot, ".staging-"));
  try {
    await cp(join(temporary, "_site"), staged, { recursive: true });
    await rm(join(moduleRoot, "public"), { recursive: true, force: true });
    await rename(staged, join(moduleRoot, "public"));
  } finally {
    await rm(staged, { recursive: true, force: true });
  }
  await writeFile(join(moduleRoot, "upstream.json"), JSON.stringify({
    repository, revision, ...(local ? { source: "local-development" } : {}),
    version: pkg.version, baseURL: "https://zavarov.com/beauty/", defaultLanguage: "ru",
    files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))),
  }, null, 2) + "\n");
  console.log(`Vendored Beauty site ${pkg.version}: ${Object.keys(files).length} files`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
