import { describe, expect, it } from 'vitest';
import { nearPass, passMark } from './score';

describe('score', () => {
  it('the pass mark rounds up, without floating-point slips', () => {
    expect(passMark(9, 0.8)).toBe(8);
    expect(passMark(4, 0.75)).toBe(3);
    expect(passMark(35, 0.8)).toBe(28);
    expect(passMark(10, 0.7)).toBe(7);
  });

  it('only a score close to the pass mark is "almost there"', () => {
    // A 9-question checkpoint needs 8: 6 and 7 are close, 5 is not.
    expect([0, 1, 5, 6, 7, 8, 9].map((r) => nearPass(r, 9, 0.8))).toEqual([false, false, false, true, true, false, false]);
    // A story's 4 questions need 3: 2 is close.
    expect([0, 1, 2, 3, 4].map((r) => nearPass(r, 4, 0.75))).toEqual([false, false, true, false, false]);
  });
});
