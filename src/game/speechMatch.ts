// Generous, deterministic matching of a child's speech against a Finnish target.
// Pure (no browser APIs) so it's trivially unit-testable and shared by the game
// + tests. Child-voice speech recognition is unreliable, and this drill must
// NEVER feel punishing — so the bar is deliberately low: any recognition
// alternative that is exactly, contains, or is a near-miss of the target counts.

/** Lowercase, drop punctuation, collapse whitespace. Keeps Finnish ä/ö/å. */
export function normalizeSpoken(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?;:'"’”“()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Levenshtein edit distance (iterative, two-row). */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Edit-distance tolerance for a target: ~1/4 of its length, at least 1. */
export function matchTolerance(target: string): number {
  return Math.max(1, Math.floor(normalizeSpoken(target).length / 4));
}

/**
 * Does any recognition alternative acceptably match the Finnish target? Accepts
 * an exact match, an alternative that CONTAINS the target (the child said it
 * plus filler), or one within the edit-distance tolerance (mispronunciation /
 * ASR slip). Intentionally lenient — see the module note.
 */
export function matchSpeech(heard: readonly string[], target: string): boolean {
  const t = normalizeSpoken(target);
  if (!t) return false;
  const tol = matchTolerance(target);
  return heard.some((raw) => {
    const h = normalizeSpoken(raw);
    if (!h) return false;
    if (h === t) return true;
    if (h.includes(t)) return true; // said the target plus extra words
    return editDistance(h, t) <= tol;
  });
}
