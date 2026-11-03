import { describe, it, expect } from 'vitest';
import { LEARNERS, simulate } from './simulate';

// A model child plays the course day by day on the real engine (simulate.ts).
// The pacing must keep moving them on to new content, bring their weak spots
// back, and keep the review pile in hand — `npm run sim:progress` prints the
// full year; this checks the first half of one.

describe('months of play (simulated)', () => {
  const [steady, older, weak] = LEARNERS;
  const run = (m: (typeof LEARNERS)[number]) => simulate(m, 180, 7, [60, 120, 180]);

  it('keeps moving a steady player on to new units', () => {
    const [d60, d120] = run(steady);
    expect(d60.unit).toBeGreaterThanOrEqual(3);
    expect(d120.unit).toBeGreaterThan(d60.unit);
    expect(d120.courseRounds).toBeGreaterThan(200);
  });

  it('brings weak areas back in the warm-up, not only words due back', () => {
    const [, d120] = run(weak);
    expect(d120.subjectWarmups).toBeGreaterThan(20);
    expect(d120.reviewWarmups).toBeGreaterThan(20);
  });

  it('keeps the review pile in hand and most words remembered', () => {
    // The themes-first order brings in many words early; by six months they have settled.
    const [, d120, d180] = run(steady);
    expect(d120.due).toBeLessThan(d120.words / 4);
    expect(d180.due).toBeLessThan(d180.words / 4);
    expect(d180.recall).toBeGreaterThan(0.7);
    expect(d180.recallSettled).toBeGreaterThan(0.7);
  });

  it('meets the everyday themes first in the younger readers’ order, and the original order for older readers', () => {
    const [, d120, d180] = run(steady);
    for (const id of ['describing', 'likes', 'not-having']) expect(d180.met, id).toContain(id);
    // themes before "my / your"
    expect(d120.met).not.toContain('whose');
    const [, , o180] = run(older);
    for (const id of ['whose', 'owners', 'doing', 'doing-kpt']) expect(o180.met, id).toContain(id);
  });
});
