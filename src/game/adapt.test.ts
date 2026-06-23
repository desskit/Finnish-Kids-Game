import { describe, it, expect } from 'vitest';
import {
  applyRound,
  difficultyFor,
  windowAccuracy,
  MAX_LEVEL,
  MIN_LEVEL,
  RECENT_WINDOW,
} from './adapt';

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

  it('only unlocks tier-4 content (the partitive-plural apex) at the top level', () => {
    expect(difficultyFor(1).maxTier).toBeLessThan(4);
    expect(difficultyFor(2).maxTier).toBeLessThan(4);
    expect(difficultyFor(3).maxTier).toBeLessThan(4);
    expect(difficultyFor(4).maxTier).toBe(4);
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
