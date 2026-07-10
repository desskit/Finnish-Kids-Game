import type { PersonId, Polarity, VerbTense } from './types';

// A grammatical English gloss for a conjugated verb, so the Conjugate game's
// hint reflects the ACTUAL tense + polarity being tested — a past-tense answer
// ("rakasti") reads as "he/she did love", not the present-looking "he love".
//
// English tense/polarity is carried by do-support (does / doesn't / did /
// didn't + base verb), which is correct for every verb, so we never need
// irregular past forms. The only verb that resists do-support is the copula
// "be", which is special-cased. Positive present uses the natural inflected
// form (adds -s in the 3rd person singular).
//
// Note: positive PAST uses the emphatic "did love" (always correct) rather than
// the natural "loved", since natural past would need per-verb irregular data.

const IRREGULAR_3SG: Record<string, string> = { have: 'has', do: 'does', go: 'goes' };

function thirdPersonS(base: string): string {
  if (IRREGULAR_3SG[base]) return IRREGULAR_3SG[base];
  if (/(s|sh|ch|x|z|o)$/.test(base)) return base + 'es';
  if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + 'ies';
  return base + 's';
}

export function englishVerbClause(
  pronounEn: string,
  verbEn: string,
  tense: VerbTense,
  polarity: Polarity,
  person: PersonId,
): string {
  const third = person === '3sg';
  const firstSg = person === '1sg';
  const negative = polarity === 'negative';
  const past = tense === 'past';

  // Copula "be" — no do-support; use am/is/are, was/were and their negatives.
  if (verbEn === 'be') {
    if (past) {
      const wasWere = firstSg || third ? 'was' : 'were';
      return `${pronounEn} ${wasWere}${negative ? "n't" : ''}`;
    }
    const amIsAre = firstSg ? 'am' : third ? 'is' : 'are';
    if (negative) return `${pronounEn} ${firstSg ? 'am not' : third ? "isn't" : "aren't"}`;
    return `${pronounEn} ${amIsAre}`;
  }

  if (negative) {
    const aux = past ? "didn't" : third ? "doesn't" : "don't";
    return `${pronounEn} ${aux} ${verbEn}`;
  }
  if (past) return `${pronounEn} did ${verbEn}`; // emphatic, but always correct + clearly past
  return `${pronounEn} ${third ? thirdPersonS(verbEn) : verbEn}`;
}
