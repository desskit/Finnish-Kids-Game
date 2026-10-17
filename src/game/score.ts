// How a short test's score reads to a child (a checkpoint, a story's
// questions). One or two short of the pass mark is "Melkein! · Almost there";
// further off is "Hyvä yritys! · Good try!", never "almost" at 1 of 9.

/** The right answers a pass needs (`passRatio` of `total`, rounded up). */
export function passMark(total: number, passRatio: number): number {
  // 0.8 × 35 is 28.000000000000004 in floating point: not 29.
  return Math.ceil(passRatio * total - 1e-9);
}

/** Short of the pass mark by no more than a fifth of the questions (at least one). */
export function nearPass(right: number, total: number, passRatio: number): boolean {
  const need = passMark(total, passRatio);
  return right < need && need - right <= Math.max(1, Math.round(total / 5));
}
