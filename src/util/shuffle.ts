/** Fisher–Yates shuffle (returns a new array). Pure presentation logic. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Random sample of up to n items, no repeats. */
export function sample<T>(arr: readonly T[], n: number): T[] {
  return shuffle(arr).slice(0, Math.max(0, n));
}

/**
 * Weighted sample of up to n items, no repeats (Efraimidis–Spirakis: each item
 * draws key = U^(1/weight); the n largest keys win). An item with weight 3 is
 * ~3× as likely per draw as weight 1, but NOTHING is ever excluded — that's
 * the contract the familiarity bias relies on (favor seen words, keep unseen
 * words flowing). No `weightOf` = plain uniform sample.
 */
export function weightedSample<T>(
  arr: readonly T[],
  n: number,
  weightOf?: (item: T) => number,
): T[] {
  if (!weightOf) return sample(arr, n);
  return arr
    .map((item) => ({ item, key: Math.random() ** (1 / Math.max(weightOf(item), 1e-6)) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, Math.max(0, n))
    .map((x) => x.item);
}
