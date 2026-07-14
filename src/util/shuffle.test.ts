import { describe, it, expect } from 'vitest';
import { shuffle, sample, weightedSample } from './shuffle';

const base = [1, 2, 3, 4, 5, 6, 7, 8];

describe('shuffle', () => {
  it('returns a new array of the same length', () => {
    const out = shuffle(base);
    expect(out).not.toBe(base);
    expect(out).toHaveLength(base.length);
  });

  it('preserves the multiset across many runs', () => {
    for (let i = 0; i < 50; i++) {
      expect([...shuffle(base)].sort((a, b) => a - b)).toEqual(base);
    }
  });

  it('does not mutate its input', () => {
    const copy = [...base];
    shuffle(base);
    expect(base).toEqual(copy);
  });
});

describe('sample', () => {
  it('draws n distinct elements from the array', () => {
    for (let i = 0; i < 50; i++) {
      const out = sample(base, 3);
      expect(out).toHaveLength(3);
      expect(new Set(out).size).toBe(3);
      out.forEach((x) => expect(base).toContain(x));
    }
  });

  it('caps at the array length when n is larger', () => {
    expect(sample(base, 100)).toHaveLength(base.length);
  });

  it('returns an empty array for n <= 0', () => {
    expect(sample(base, 0)).toEqual([]);
    expect(sample(base, -5)).toEqual([]);
  });
});

describe('weightedSample', () => {
  const base = ['a', 'b', 'c', 'd', 'e'];

  it('falls back to a uniform sample without a weight function', () => {
    const out = weightedSample(base, 3);
    expect(out).toHaveLength(3);
    expect(new Set(out).size).toBe(3);
  });

  it('never repeats and never invents items', () => {
    for (let r = 0; r < 200; r++) {
      const out = weightedSample(base, 3, (x) => (x === 'a' ? 5 : 1));
      expect(out).toHaveLength(3);
      expect(new Set(out).size).toBe(3);
      out.forEach((x) => expect(base).toContain(x));
    }
  });

  it('biases toward heavy items without ever excluding light ones', () => {
    let aFirst = 0;
    const seen = new Set<string>();
    for (let r = 0; r < 500; r++) {
      const out = weightedSample(base, 1, (x) => (x === 'a' ? 3 : 1));
      if (out[0] === 'a') aFirst++;
      seen.add(out[0]);
    }
    // weight 3 vs four weight-1 items → a wins ~3/7 ≈ 43% of single draws.
    expect(aFirst).toBeGreaterThan(500 * 0.3);
    expect(aFirst).toBeLessThan(500 * 0.6);
    expect(seen.size).toBe(base.length); // everything still surfaces
  });
});
