import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { readDocument, writeDocument } from "./content.mjs";
import { assertProtectedContent } from "./protected-content.mjs";

// Whitespace is part of Markdown and code semantics. Normalize only line endings.
export function sourceHash(text) {
  return createHash("sha256").update(text.replace(/\r\n/g, "\n")).digest("hex");
}

export function assertPreserved(original, result, file) {
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
  const original = readDocument(source, file);
  const result = readDocument(translated, file);
  assertPreserved(original, result, file);
  assertProtectedContent(original.body, result.body, file);
  return writeDocument({ ...result.data, source_hash: sourceHash(source) }, result.body);
}

export function matchesSourceHash(source, stored, baseline) {
  const hash = sourceHash(source);
  // A fixed migration snapshot keeps unchanged legacy translations without
  // rewriting EN files or paying to translate them again. Never compare a new
  // source using the old whitespace-insensitive algorithm.
  return stored === hash || Boolean(baseline && stored === baseline.legacy_hash && hash === baseline.source_hash);
}
