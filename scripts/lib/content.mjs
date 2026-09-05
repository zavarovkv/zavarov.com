import { parse, stringify } from "smol-toml";
import { readdir } from "node:fs/promises";

export function readDocument(text, file = "document") {
  const match = text.match(/^\+\+\+\r?\n([\s\S]*?)\r?\n\+\+\+(?:\r?\n|$)/);
  if (!match) throw new Error(`${file}: expected TOML front matter at the start`);
  try {
    return { data: parse(match[1]), body: text.slice(match[0].length) };
  } catch (error) {
    throw new Error(`${file}: invalid TOML: ${error.message}`, { cause: error });
  }
}

export function writeDocument(data, body) {
  return `+++\n${stringify(data).trimEnd()}\n+++\n${body}`;
}

export async function listMarkdown(dir, prefix = "") {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await listMarkdown(`${dir}/${entry.name}`, name));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(name);
  }
  return files.sort();
}
