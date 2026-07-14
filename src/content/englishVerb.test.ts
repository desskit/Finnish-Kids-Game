import { describe, it, expect } from 'vitest';
import { englishVerbClause } from './englishVerb';
import type { EnglishMorph } from './types';

const love: EnglishMorph = { thirdSg: 'loves', past: 'loved', pastParticiple: 'loved', gerund: 'loving' };
const eat: EnglishMorph = { thirdSg: 'eats', past: 'ate', pastParticiple: 'eaten', gerund: 'eating' };
const go: EnglishMorph = { thirdSg: 'goes', past: 'went', pastParticiple: 'gone', gerund: 'going' };

describe('englishVerbClause', () => {
  it('present positive uses the sourced 3rd-person form; base elsewhere', () => {
    expect(englishVerbClause('I', 'love', love, 'present', 'positive', '1sg')).toBe('I love');
    expect(englishVerbClause('he/she', 'love', love, 'present', 'positive', '3sg')).toBe('he/she loves');
    expect(englishVerbClause('he/she', 'go', go, 'present', 'positive', '3sg')).toBe('he/she goes');
  });

  it("present negative: doesn't / don't + base", () => {
    expect(englishVerbClause('he/she', 'love', love, 'present', 'negative', '3sg')).toBe("he/she doesn't love");
    expect(englishVerbClause('I', 'love', love, 'present', 'negative', '1sg')).toBe("I don't love");
  });

  it('past positive uses the SOURCED natural past (not the emphatic "did love")', () => {
    expect(englishVerbClause('he/she', 'love', love, 'past', 'positive', '3sg')).toBe('he/she loved');
    expect(englishVerbClause('he/she', 'eat', eat, 'past', 'positive', '3sg')).toBe('he/she ate');
    expect(englishVerbClause('they', 'go', go, 'past', 'positive', '3pl')).toBe('they went');
  });

  it("past negative: didn't + base", () => {
    expect(englishVerbClause('he/she', 'eat', eat, 'past', 'negative', '3sg')).toBe("he/she didn't eat");
  });

  it('handles the copula "be" (no morph needed)', () => {
    expect(englishVerbClause('I', 'be', undefined, 'present', 'positive', '1sg')).toBe('I am');
    expect(englishVerbClause('he/she', 'be', undefined, 'present', 'positive', '3sg')).toBe('he/she is');
    expect(englishVerbClause('they', 'be', undefined, 'present', 'positive', '3pl')).toBe('they are');
    expect(englishVerbClause('he/she', 'be', undefined, 'present', 'negative', '3sg')).toBe("he/she isn't");
    expect(englishVerbClause('he/she', 'be', undefined, 'past', 'positive', '3sg')).toBe('he/she was');
    expect(englishVerbClause('they', 'be', undefined, 'past', 'negative', '3pl')).toBe("they weren't");
  });
});
