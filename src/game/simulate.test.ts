import { describe, it, expect } from 'vitest';
import { LEARNERS, simulate } from './simulate';

// A model child plays the course day by day on the real engine (simulate.ts).
// The pacing must keep moving them on to new content, bring their weak spots
// back, and keep the review pile in hand — `npm run sim:progress` prints the
// full year; this checks a quarter of one.

describe('months of play (simulated)', () => {
  const [steady, , weak] = LEARNERS;
  const run = (m: (typeof LEARNERS)[number]) => simulate(m, 120, 7, [60, 120]);

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
    const [, d120] = run(steady);
    expect(d120.due).toBeLessThan(d120.words);
    expect(d120.recall).toBeGreaterThan(0.7);
  });
});
