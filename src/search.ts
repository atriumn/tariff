import Fuse from "fuse.js";
import type { ModelEntry } from "./pricing.js";

let fuse: Fuse<{ key: string }> | null = null;
let lastKeys: string[] = [];

function buildIndex(models: Record<string, ModelEntry>): Fuse<{ key: string }> {
  const keys = Object.keys(models);

  // Only rebuild if keys changed
  if (fuse && keys.length === lastKeys.length && keys[0] === lastKeys[0]) {
    return fuse;
  }

  lastKeys = keys;
  const items = keys.map((key) => ({ key }));
  fuse = new Fuse(items, {
    keys: ["key"],
    threshold: 0.4,
    includeScore: true,
  });

  return fuse;
}

export function fuzzyMatch(
  query: string,
  models: Record<string, ModelEntry>,
): ModelEntry | null {
  // Try exact match first
  if (models[query]) {
    return models[query];
  }

  // Try case-insensitive exact match
  const lowerQuery = query.toLowerCase();
  for (const [key, entry] of Object.entries(models)) {
    if (key.toLowerCase() === lowerQuery) {
      return entry;
    }
  }

  // Fuzzy search
  const index = buildIndex(models);
  const results = index.search(query);

  if (results.length > 0) {
    return models[results[0].item.key];
  }

  return null;
}

export function fuzzyMatchMultiple(
  query: string,
  models: Record<string, ModelEntry>,
  limit = 5,
): ModelEntry[] {
  const index = buildIndex(models);
  const results = index.search(query, { limit });
  return results.map((r) => models[r.item.key]);
}
