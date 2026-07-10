import { describe, it, expect } from 'vitest';
import { englishVerbClause } from './englishVerb';

describe('englishVerbClause', () => {
  it('present positive: base form, with 3rd-person -s', () => {
    expect(englishVerbClause('I', 'love', 'present', 'positive', '1sg')).toBe('I love');
    expect(englishVerbClause('he/she', 'love', 'present', 'positive', '3sg')).toBe('he/she loves');
    expect(englishVerbClause('they', 'eat', 'present', 'positive', '3pl')).toBe('they eat');
    // -es / -ies spelling rules
    expect(englishVerbClause('he/she', 'watch', 'present', 'positive', '3sg')).toBe('he/she watches');
    expect(englishVerbClause('he/she', 'cry', 'present', 'positive', '3sg')).toBe('he/she cries');
  });

  it("present negative: doesn't / don't + base", () => {
    expect(englishVerbClause('he/she', 'love', 'present', 'negative', '3sg')).toBe(
      "he/she doesn't love",
    );
    expect(englishVerbClause('I', 'love', 'present', 'negative', '1sg')).toBe("I don't love");
  });

  it('past reflects the tense (never a present-looking gloss)', () => {
    // The bug: "rakasti" (he loved) must NOT read as present "he love".
    expect(englishVerbClause('he/she', 'love', 'past', 'positive', '3sg')).toBe('he/she did love');
    expect(englishVerbClause('he/she', 'love', 'past', 'negative', '3sg')).toBe(
      "he/she didn't love",
    );
  });

  it('handles the copula "be" without do-support', () => {
    expect(englishVerbClause('I', 'be', 'present', 'positive', '1sg')).toBe('I am');
    expect(englishVerbClause('he/she', 'be', 'present', 'positive', '3sg')).toBe('he/she is');
    expect(englishVerbClause('they', 'be', 'present', 'positive', '3pl')).toBe('they are');
    expect(englishVerbClause('he/she', 'be', 'present', 'negative', '3sg')).toBe("he/she isn't");
    expect(englishVerbClause('he/she', 'be', 'past', 'positive', '3sg')).toBe('he/she was');
    expect(englishVerbClause('they', 'be', 'past', 'negative', '3pl')).toBe("they weren't");
  });

  it('handles irregular 3sg "have"', () => {
    expect(englishVerbClause('he/she', 'have', 'present', 'positive', '3sg')).toBe('he/she has');
    expect(englishVerbClause('he/she', 'have', 'past', 'positive', '3sg')).toBe('he/she did have');
  });
});
