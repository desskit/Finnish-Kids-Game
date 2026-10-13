// Words never offered as choices in the same question. Each group is two
// words for nearly the same thing, each with its own picture: ankka (a
// farmyard duck) and sorsa (a wild duck, a mallard). Their English is nearly
// the same too, so a question about one never shows the other as a choice,
// and the two never stand side by side as wrong answers.

export const NEVER_TOGETHER: readonly (readonly string[])[] = [['duck', 'wild-duck']];

const RIVALS = new Map<string, Set<string>>();
for (const group of NEVER_TOGETHER) {
  for (const a of group) {
    for (const b of group) {
      if (a === b) continue;
      if (!RIVALS.has(a)) RIVALS.set(a, new Set());
      RIVALS.get(a)!.add(b);
    }
  }
}

/** Whether two words must never share a question. */
export function rivals(a: string, b: string): boolean {
  return RIVALS.get(a)?.has(b) ?? false;
}

/** `pool` without the words that mustn't share a question with `id`. */
export function apartFrom<T extends { id: string }>(id: string, pool: readonly T[]): T[] {
  return RIVALS.has(id) ? pool.filter((i) => !rivals(id, i.id)) : [...pool];
}
