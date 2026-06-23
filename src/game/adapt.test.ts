import { describe, it, expect } from 'vitest';
import {
  applyRound,
  difficultyFor,
  windowAccuracy,
  promoteThreshold,
  minRoundsToPromote,
  MAX_LEVEL,
  MIN_LEVEL,
  RECENT_WINDOW,
} from './adapt';

/** Fold a streak of identical-accuracy rounds, stopping at the FIRST level move. */
function runStreak(start: number, accuracy: number, rounds: number, maxLevel?: number) {
  let level = start;
  let recent: number[] = [];
  let used = 0;
  for (let i = 0; i < rounds; i++) {
    const out = applyRound(level, recent, accuracy, maxLevel);
    used++;
    const changed = out.level !== level;
    level = out.level;
    recent = out.recent;
    if (changed) return { level, recent, roundsToChange: used };
  }
  return { level, recent, roundsToChange: used };
}

/** Fold a long streak through ALL rounds (multiple promotions), return the end level. */
function finalLevel(start: number, accuracy: number, rounds: number, maxLevel?: number): number {
  let level = start;
  let recent: number[] = [];
  for (let i = 0; i < rounds; i++) {
    const out = applyRound(level, recent, accuracy, maxLevel);
    level = out.level;
    recent = out.recent;
  }
  return level;
}

describe('difficultyFor', () => {
  it('clamps out-of-range levels into 1..MAX_LEVEL', () => {
    expect(difficultyFor(0).level).toBe(MIN_LEVEL);
    expect(difficultyFor(-5).level).toBe(MIN_LEVEL);
    expect(difficultyFor(99).level).toBe(MAX_LEVEL);
    expect(difficultyFor(Number.NaN).level).toBe(MIN_LEVEL);
  });

  it('keeps option count tappable (<= 4) and ramps the real difficulty levers', () => {
    const l1 = difficultyFor(1);
    const l3 = difficultyFor(3);
    const l4 = difficultyFor(4);
    expect(l1.optionCount).toBeLessThanOrEqual(4);
    expect(l3.optionCount).toBeLessThanOrEqual(4);
    expect(l4.optionCount).toBeLessThanOrEqual(4);
    // Harder level => allows higher-tier phrases, larger counts, more verb forms.
    expect(l3.maxTier).toBeGreaterThanOrEqual(l1.maxTier);
    expect(l3.maxCount).toBeGreaterThan(l1.maxCount);
    expect(l3.verbCombos.length).toBeGreaterThan(l1.verbCombos.length);
    expect(l4.maxTier).toBeGreaterThan(l3.maxTier);
    expect(l4.maxCount).toBeGreaterThan(l3.maxCount);
    expect(l4.verbCombos.length).toBeGreaterThan(l3.verbCombos.length);
  });

  it('introduces negative then past verb forms as the level rises', () => {
    expect(difficultyFor(1).verbCombos).toEqual([
      { tense: 'present', polarity: 'positive' },
    ]);
    expect(difficultyFor(2).verbCombos.map((c) => c.polarity)).toContain('negative');
    expect(difficultyFor(3).verbCombos.some((c) => c.tense === 'past')).toBe(true);
    expect(difficultyFor(4).verbCombos.some((c) => c.tense === 'past' && c.polarity === 'negative')).toBe(
      true,
    );
  });

  it('only unlocks tier-4 content (the partitive-plural apex) by level 4', () => {
    expect(difficultyFor(1).maxTier).toBeLessThan(4);
    expect(difficultyFor(2).maxTier).toBeLessThan(4);
    expect(difficultyFor(3).maxTier).toBeLessThan(4);
    expect(difficultyFor(4).maxTier).toBe(4);
  });

  it('extends the table to 8 levels, one new tier + bigger counts per step', () => {
    expect(MAX_LEVEL).toBe(8);
    // L1–L4 preserved exactly.
    expect(difficultyFor(1)).toMatchObject({ maxTier: 2, maxCount: 5, optionCount: 3 });
    expect(difficultyFor(4)).toMatchObject({ maxTier: 4, maxCount: 12 });
    // L5–L8 unlock one locative case per level (maxTier 5..8) with larger counts.
    expect(difficultyFor(5).maxTier).toBe(5);
    expect(difficultyFor(6).maxTier).toBe(6);
    expect(difficultyFor(7).maxTier).toBe(7);
    expect(difficultyFor(8).maxTier).toBe(8);
    const counts = [5, 6, 7, 8].map((l) => difficultyFor(l).maxCount);
    expect(counts).toEqual([14, 16, 18, 20]);
    // Option count stays tappable at every level.
    for (let l = 1; l <= MAX_LEVEL; l++) expect(difficultyFor(l).optionCount).toBeLessThanOrEqual(4);
  });
});

describe('steepening promotion', () => {
  it('raises the promotion bar with level (0.85 early → 0.95 at the top)', () => {
    expect(promoteThreshold(1)).toBeCloseTo(0.85);
    expect(promoteThreshold(4)).toBeCloseTo(0.91);
    expect(promoteThreshold(8)).toBeCloseTo(0.95);
    // Never above the cap.
    expect(promoteThreshold(99)).toBeCloseTo(0.95);
  });

  it('needs more sustained rounds to promote near the top (2 early → 5 at the top)', () => {
    expect(minRoundsToPromote(1)).toBe(2);
    expect(minRoundsToPromote(2)).toBe(2);
    expect(minRoundsToPromote(7)).toBe(5);
    expect(minRoundsToPromote(8)).toBe(5);
  });

  it('lets a strong kid promote in ~2 rounds at the bottom', () => {
    const r = runStreak(1, 1, 10);
    expect(r.level).toBe(2);
    expect(r.roundsToChange).toBe(2);
  });

  it('makes the top rungs a grind: needs ~5 sustained near-perfect rounds at L7', () => {
    // Four perfect rounds is not enough at L7 (needs 5).
    expect(runStreak(7, 1, 4, 8).level).toBe(7);
    // The fifth perfect round finally cracks it.
    expect(runStreak(7, 1, 5, 8).level).toBe(8);
    // 0.9 accuracy is below the 0.95 top bar — it never promotes off L7.
    expect(runStreak(7, 0.9, 8, 8).level).toBe(7);
  });

  it('keeps demotion a fast, level-independent safety net', () => {
    // A weak streak drops within 2 rounds at the bottom of the ladder…
    expect(runStreak(2, 0.4, 10).roundsToChange).toBe(2);
    expect(runStreak(2, 0.4, 10).level).toBe(1);
    // …and just as fast at the top.
    expect(runStreak(8, 0.4, 10, 8).roundsToChange).toBe(2);
    expect(runStreak(8, 0.4, 10, 8).level).toBe(7);
  });
});

describe('per-node maxLevel cap', () => {
  it('never promotes a node past its own ceiling, even on a perfect streak', () => {
    // A depth-4 node caps at 4 no matter how long the kid aces it.
    expect(finalLevel(1, 1, 40, 4)).toBe(4);
  });

  it('clamps a level above the cap back down to the cap', () => {
    expect(applyRound(7, [], 0.7, 4).level).toBe(4);
  });

  it('lets a deep node climb past the old ceiling of 4 up to its own depth', () => {
    expect(finalLevel(1, 1, 40, 8)).toBe(8);
  });
});

describe('applyRound', () => {
  it('does not change level before MIN_ROUNDS, even on a perfect score', () => {
    const out = applyRound(1, [], 1);
    expect(out.level).toBe(1);
    expect(out.recent).toEqual([1]);
  });

  it('promotes after sustained high accuracy and resets the window', () => {
    const out = applyRound(1, [0.9], 1); // window avg = 0.95 >= 0.85
    expect(out.level).toBe(2);
    expect(out.recent).toEqual([]);
  });

  it('demotes after sustained low accuracy and resets the window', () => {
    const out = applyRound(2, [0.4], 0.4); // window avg = 0.4 <= 0.5
    expect(out.level).toBe(1);
    expect(out.recent).toEqual([]);
  });

  it('never promotes past MAX_LEVEL or demotes below MIN_LEVEL', () => {
    expect(applyRound(MAX_LEVEL, [1, 1, 1], 1).level).toBe(MAX_LEVEL);
    expect(applyRound(MIN_LEVEL, [0, 0, 0], 0).level).toBe(MIN_LEVEL);
  });

  it('holds steady on middling accuracy', () => {
    const out = applyRound(2, [0.7], 0.7); // 0.7 is between thresholds
    expect(out.level).toBe(2);
    expect(out.recent).toEqual([0.7, 0.7]);
  });

  it('caps the rolling window at RECENT_WINDOW entries', () => {
    let recent: number[] = [];
    for (let i = 0; i < RECENT_WINDOW + 3; i++) {
      // 0.7 keeps it between thresholds so the window never resets here.
      recent = applyRound(2, recent, 0.7).recent;
    }
    expect(recent.length).toBe(RECENT_WINDOW);
  });

  it('clamps accuracy into 0..1', () => {
    expect(applyRound(1, [], 5).recent).toEqual([1]);
    expect(applyRound(1, [], -5).recent).toEqual([0]);
  });
});

describe('windowAccuracy', () => {
  it('averages the window and treats empty/undefined as 0', () => {
    expect(windowAccuracy([0.5, 1])).toBeCloseTo(0.75);
    expect(windowAccuracy([])).toBe(0);
    expect(windowAccuracy(undefined)).toBe(0);
  });
});
