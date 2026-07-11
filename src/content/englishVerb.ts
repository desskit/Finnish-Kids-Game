import type { EnglishMorph, PersonId, Polarity, VerbTense } from './types';

// A grammatical English gloss for a conjugated verb, so the Conjugate game's
// hint reflects the ACTUAL tense + polarity being tested — a past-tense answer
// ("rakasti") reads as "he/she loved", not a present-looking "he love".
//
// The inflected English forms are SOURCED (item.english, from AGID) — never
// rule-generated. This function only assembles them with the parts of grammar
// that are genuinely regular: negation via do-support (doesn't/didn't + base),
// and the suppletive copula "be".

export function englishVerbClause(
  pronounEn: string,
  verbEn: string,
  morph: EnglishMorph | undefined,
  tense: VerbTense,
  polarity: Polarity,
  person: PersonId,
): string {
  const third = person === '3sg';
  const firstSg = person === '1sg';
  const negative = polarity === 'negative';
  const past = tense === 'past';

  // Copula "be" — suppletive; use am/is/are, was/were and their negatives.
  if (verbEn === 'be') {
    if (past) {
      const wasWere = firstSg || third ? 'was' : 'were';
      return `${pronounEn} ${wasWere}${negative ? "n't" : ''}`;
    }
    const amIsAre = firstSg ? 'am' : third ? 'is' : 'are';
    if (negative) return `${pronounEn} ${firstSg ? 'am not' : third ? "isn't" : "aren't"}`;
    return `${pronounEn} ${amIsAre}`;
  }

  // Negation is regular do-support over the BASE verb (correct for every verb).
  if (negative) {
    const aux = past ? "didn't" : third ? "doesn't" : "don't";
    return `${pronounEn} ${aux} ${verbEn}`;
  }
  // Positive: use the sourced inflected form (natural "loved" / "ate" / "goes").
  if (past) return `${pronounEn} ${morph?.past ?? verbEn}`;
  return `${pronounEn} ${third ? morph?.thirdSg ?? `${verbEn}s` : verbEn}`;
}
