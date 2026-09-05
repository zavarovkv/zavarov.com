import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { readDocument, writeDocument } from "./content.mjs";

// Whitespace is part of Markdown and code semantics. Normalize only line endings.
export function sourceHash(text) {
  return createHash("sha256").update(text.replace(/\r\n/g, "\n")).digest("hex");
}

export function assertPreserved(source, translated, file) {
  const original = readDocument(source, file);
  const result = readDocument(translated, file);
  const before = { ...original.data };
  const after = { ...result.data };
  for (const key of ["title", "description", "source_hash"]) {
    delete before[key];
    delete after[key];
  }
  if (!isDeepStrictEqual(before, after)) {
    throw new Error(`${file}: translation changed preserved front matter`);
  }
  const { data, body } = result;
  if (typeof data.title !== "string" || !data.title.trim()) {
    throw new Error(`${file}: translation must have a non-empty title`);
  }
  if (data.description !== undefined && typeof data.description !== "string") {
    throw new Error(`${file}: description must be a string`);
  }
  if (!body.trim() && original.body.trim()) {
    throw new Error(`${file}: translation body is empty`);
  }
}

export function prepareTranslation(source, translated, file) {
  assertPreserved(source, translated, file);
  const { data, body } = readDocument(translated, file);
  return writeDocument({ ...data, source_hash: sourceHash(source) }, body);
}

export function isCurrent(source, translated, baseline) {
  const stored = readDocument(translated).data.source_hash;
  const hash = sourceHash(source);
  // A fixed migration snapshot keeps unchanged legacy translations without
  // rewriting EN files or paying to translate them again. Never compare a new
  // source using the old whitespace-insensitive algorithm.
  return stored === hash || Boolean(baseline && stored === baseline.legacy_hash && hash === baseline.source_hash);
}
