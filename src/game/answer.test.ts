import { describe, it, expect } from 'vitest';
import { answerMatches, readyToJudge, typeAt } from './answer';

describe('typed answers', () => {
  it('ignore case, punctuation and spacing — but never the letters', () => {
    expect(answerMatches('kissa', 'Kissa')).toBe(true);
    expect(answerMatches('Minulla on kissa', 'Minulla on kissa.')).toBe(true);
    expect(answerMatches('  minulla  on   kissa ', 'Minulla on kissa.')).toBe(true);
    expect(answerMatches('Hei Eero', 'Hei, Eero!')).toBe(true);
    expect(answerMatches('tuli', 'tuuli')).toBe(false);
    expect(answerMatches('paiva', 'päivä')).toBe(false);
  });

  it('match an ä typed as "a" + combining ¨ (some keyboards send that)', () => {
    const decomposed = 'päivä';
    expect(decomposed).not.toBe('päivä');
    expect(answerMatches(decomposed, 'päivä')).toBe(true);
    expect(readyToJudge(decomposed, 'päivä')).toBe(true);
  });

  it('wait until there are as many letters as the answer has', () => {
    expect(readyToJudge('kiss', 'kissa')).toBe(false);
    expect(readyToJudge('kissa', 'kissa.')).toBe(true);
  });

  it('type an ä / ö key at the cursor', () => {
    expect(typeAt({ selectionStart: 1, selectionEnd: 1 }, 'pivä', 'ä')).toEqual({ value: 'päivä', caret: 2 });
    expect(typeAt(null, 'p', 'ö')).toEqual({ value: 'pö', caret: 2 });
    expect(typeAt({ selectionStart: 0, selectionEnd: 3 }, 'abcd', 'ä')).toEqual({ value: 'äd', caret: 1 });
  });
});
