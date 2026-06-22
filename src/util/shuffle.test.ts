import { describe, it, expect } from 'vitest';
import { shuffle, sample } from './shuffle';

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
