// Scope a content registry (dialogues, scenes, stories, words…) to a list of
// ids, returning a STABLE array per (registry, ids) pair. The games memoize
// their rounds on these arrays, so a fresh `.filter()` per render would rebuild
// the round mid-question; caching by the joined id key keeps the reference put.
// No ids (or an empty list) means "the whole registry".

const cache = new WeakMap<readonly object[], Map<string, readonly object[]>>();

export function byIds<T extends { id: string }>(
  all: readonly T[],
  ids?: readonly string[],
): readonly T[] {
  if (!ids || ids.length === 0) return all;
  let perRegistry = cache.get(all);
  if (!perRegistry) {
    perRegistry = new Map();
    cache.set(all, perRegistry);
  }
  const key = ids.join('|');
  let hit = perRegistry.get(key) as readonly T[] | undefined;
  if (!hit) {
    const wanted = new Set(ids);
    hit = all.filter((x) => wanted.has(x.id));
    perRegistry.set(key, hit);
  }
  return hit;
}
