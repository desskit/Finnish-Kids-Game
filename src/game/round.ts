import type {
  CaseId,
  Construction,
  GrammaticalNumber,
  LexicalItem,
  PersonId,
  Polarity,
  VerbTense,
} from '../content/types';
import { caseFormOf, conjugatedClause, formFor, PERSONS, verbForm } from '../content/types';
import { sample, shuffle } from '../util/shuffle';

// Round builders. These ONLY select, shuffle, and pair existing human-generated
// content — the Finnish slot forms come from the sourced inflection tables via
// formFor(); nothing here generates or inflects Finnish.

export interface ListenQuestion {
  target: LexicalItem;
  options: LexicalItem[];
}

export function buildListenRound(
  items: readonly LexicalItem[],
  questionCount: number,
  optionCount: number,
): ListenQuestion[] {
  const targets = sample(items, Math.min(questionCount, items.length));
  return targets.map((target) => {
    const distractors = sample(
      items.filter((i) => i.id !== target.id),
      optionCount - 1,
    );
    return { target, options: shuffle([target, ...distractors]) };
  });
}

export interface PhraseQuestion {
  construction: Construction;
  /** The correct item; its slot form is formFor(item, construction). */
  item: LexicalItem;
  /** Candidate items; each tile shows formFor(option, construction). */
  options: LexicalItem[];
}

export function buildPhraseRound(
  items: readonly LexicalItem[],
  constructions: readonly Construction[],
  questionCount: number,
  optionCount: number,
): PhraseQuestion[] {
  // Only pair a construction with items that actually have the needed form.
  const pool: { construction: Construction; item: LexicalItem }[] = [];
  for (const construction of constructions) {
    for (const item of items) {
      if (formFor(item, construction)) pool.push({ construction, item });
    }
  }

  const chosen = sample(pool, Math.min(questionCount, pool.length));
  return chosen.map(({ construction, item }) => {
    const distractors = sample(
      items.filter((i) => i.id !== item.id && formFor(i, construction)),
      optionCount - 1,
    );
    return { construction, item, options: shuffle([item, ...distractors]) };
  });
}

// --- Review (spaced repetition) ------------------------------------------
//
// Listen-and-tap over a caller-chosen set of due items (see src/game/srs.ts).
// The targets are already selected/ordered by the scheduler, so this only pairs
// each with distractors drawn from the whole reviewable pool. Selection order is
// preserved (not reshuffled) so the most-overdue items come first.

export interface ReviewQuestion {
  target: LexicalItem;
  options: LexicalItem[];
}

export function buildReviewRound(
  targets: readonly LexicalItem[],
  pool: readonly LexicalItem[],
  optionCount: number,
): ReviewQuestion[] {
  return targets.map((target) => {
    const distractors = sample(
      pool.filter((i) => i.id !== target.id),
      optionCount - 1,
    );
    return { target, options: shuffle([target, ...distractors]) };
  });
}

// --- Spelling --------------------------------------------------------------
//
// Drill: hear/see a word, type it. Just a selection of targets — no slot
// lookup needed since the child types item.fi directly (already the
// sourced nominative singular form).

export function buildSpellingRound(
  items: readonly LexicalItem[],
  questionCount: number,
): LexicalItem[] {
  return sample(items, Math.min(questionCount, items.length));
}

// --- Word order ----------------------------------------------------------
//
// Drill: tokenize a full carrier-phrase sentence (before words + slot form +
// after words, punctuation attached to the last token) into chips; the child
// taps them back into order. The slot form is looked up via formFor() —
// never generated. Reuses the same construction+item data as Build a Phrase.

export interface WordOrderToken {
  /** Position in the correct sentence order (0-based). */
  id: number;
  text: string;
}

export interface WordOrderQuestion {
  construction: Construction;
  item: LexicalItem;
  /** Tokens in correct order. */
  tokens: WordOrderToken[];
  /** Same tokens, shuffled for display; the child taps them back into order. */
  shuffled: WordOrderToken[];
  /** The full sentence, for replay/speech. */
  sentence: string;
}

export function buildWordOrderRound(
  items: readonly LexicalItem[],
  constructions: readonly Construction[],
  questionCount: number,
): WordOrderQuestion[] {
  const pool: { construction: Construction; item: LexicalItem }[] = [];
  for (const construction of constructions) {
    for (const item of items) {
      if (formFor(item, construction)) pool.push({ construction, item });
    }
  }

  const chosen = sample(pool, Math.min(questionCount, pool.length));
  return chosen.map(({ construction, item }) => {
    const form = formFor(item, construction)!;
    const words = [
      ...(construction.before?.split(' ') ?? []),
      form,
      ...(construction.after?.split(' ') ?? []),
    ];
    const sentence = words.join(' ') + (construction.punct ?? '');
    const last = words.length - 1;
    const tokens: WordOrderToken[] = words.map((text, id) => ({
      id,
      text: id === last ? text + (construction.punct ?? '') : text,
    }));
    let shuffled = shuffle(tokens);
    // A shuffle that lands back in the original order isn't much of a puzzle.
    while (tokens.length > 1 && shuffled.every((t, i) => t.id === tokens[i].id)) {
      shuffled = shuffle(tokens);
    }
    return { construction, item, tokens, shuffled, sentence };
  });
}

// --- Two-slot counting: number + counted noun ---------------------------

export interface CountingQuestion {
  number: LexicalItem; // the target count word
  noun: LexicalItem; // the target counted noun
  numberOptions: LexicalItem[];
  nounOptions: LexicalItem[];
}

export function buildCountingRound(
  numbers: readonly LexicalItem[],
  nouns: readonly LexicalItem[],
  questionCount: number,
  optionCount: number,
  maxCount: number,
): CountingQuestion[] {
  const counts = numbers.filter((n) => {
    const v = n.value ?? 0;
    return v >= 1 && v <= maxCount;
  });

  const out: CountingQuestion[] = [];
  for (let i = 0; i < questionCount; i++) {
    const number = sample(counts, 1)[0];
    const noun = sample(nouns, 1)[0];
    if (!number || !noun) break;
    const numberOptions = shuffle([
      number,
      ...sample(
        counts.filter((n) => n.id !== number.id),
        optionCount - 1,
      ),
    ]);
    const nounOptions = shuffle([
      noun,
      ...sample(
        nouns.filter((x) => x.id !== noun.id),
        optionCount - 1,
      ),
    ]);
    out.push({ number, noun, numberOptions, nounOptions });
  }
  return out;
}

// --- Two-slot adjective + noun agreement --------------------------------
//
// Drill: the adjective is shown in a target case (the context); the learner
// picks the noun form that AGREES (same case). Distractors are the same noun in
// other cases, so the skill being practised is the agreement itself. All forms
// are looked up from the sourced tables — never generated. (Not wired into the
// UI yet; this just produces exercise data for a later activity.)

const AGREEMENT_CASES: CaseId[] = [
  'nominative',
  'genitive',
  'partitive',
  'inessive',
  'illative',
  'adessive',
  'allative',
];

export interface AgreementOption {
  caseId: CaseId;
  form: string;
  correct: boolean;
}

export interface AgreementQuestion {
  adjective: LexicalItem;
  noun: LexicalItem;
  case: CaseId;
  number: GrammaticalNumber;
  /** Adjective in the target case — the given context, e.g. "isossa". */
  adjForm: string;
  /** Correct, agreeing noun form, e.g. "kissassa". */
  answer: string;
  /** Shuffled noun forms across cases; exactly one agrees. */
  options: AgreementOption[];
}

export function buildAgreementRound(
  adjectives: readonly LexicalItem[],
  nouns: readonly LexicalItem[],
  questionCount: number,
  optionCount: number,
  number: GrammaticalNumber = 'singular',
): AgreementQuestion[] {
  const out: AgreementQuestion[] = [];
  let guard = 0;
  while (out.length < questionCount && guard++ < questionCount * 8) {
    const adjective = sample(adjectives, 1)[0];
    const noun = sample(nouns, 1)[0];
    if (!adjective || !noun) break;

    const nounCases = AGREEMENT_CASES.filter((c) => caseFormOf(noun, c, number));
    const targetCandidates = nounCases.filter((c) => caseFormOf(adjective, c, number));
    if (!targetCandidates.length || nounCases.length < optionCount) continue;

    const targetCase = sample(targetCandidates, 1)[0];
    const adjForm = caseFormOf(adjective, targetCase, number)!;
    const answer = caseFormOf(noun, targetCase, number)!;
    const distractorCases = sample(
      nounCases.filter((c) => c !== targetCase),
      optionCount - 1,
    );

    const options = shuffle<AgreementOption>([
      { caseId: targetCase, form: answer, correct: true },
      ...distractorCases.map((c) => ({
        caseId: c,
        form: caseFormOf(noun, c, number)!,
        correct: false,
      })),
    ]);

    out.push({ adjective, noun, case: targetCase, number, adjForm, answer, options });
  }
  return out;
}

// --- Verb conjugation by person ------------------------------------------
//
// Drill: given a pronoun (e.g. "minä") and a verb, pick the correctly
// conjugated form. Distractors are the same verb in other persons, so the skill
// is the personal ending. Forms are looked up, never generated. (Not wired into
// the UI yet.)

export interface ConjugationOption {
  person: PersonId;
  form: string;
  correct: boolean;
}

export interface ConjugationQuestion {
  verb: LexicalItem;
  tense: VerbTense;
  polarity: Polarity;
  person: PersonId;
  /** Subject pronoun shown as the prompt, e.g. "minä". */
  pronoun: string;
  pronounEn: string;
  /** Correct conjugated form, e.g. "syön". */
  answer: string;
  /** Full clause, e.g. "minä syön". */
  clause: string;
  /** Shuffled forms of the same verb in different persons; one is correct. */
  options: ConjugationOption[];
}

export const DEFAULT_CONJUGATION_COMBOS: { tense: VerbTense; polarity: Polarity }[] = [
  { tense: 'present', polarity: 'positive' },
];

export function buildConjugationRound(
  verbs: readonly LexicalItem[],
  questionCount: number,
  optionCount: number,
  combos: { tense: VerbTense; polarity: Polarity }[] = DEFAULT_CONJUGATION_COMBOS,
): ConjugationQuestion[] {
  const out: ConjugationQuestion[] = [];
  let guard = 0;
  while (out.length < questionCount && guard++ < questionCount * 8) {
    const verb = sample(verbs, 1)[0];
    const combo = sample(combos, 1)[0];
    if (!verb || !combo) break;

    const persons = PERSONS.filter((p) => verbForm(verb, combo.tense, combo.polarity, p.id));
    if (persons.length < optionCount) continue;

    const target = sample(persons, 1)[0];
    const answer = verbForm(verb, combo.tense, combo.polarity, target.id)!;
    const clause = conjugatedClause(verb, combo.tense, combo.polarity, target.id)!;
    const distractors = sample(
      persons.filter((p) => p.id !== target.id),
      optionCount - 1,
    );

    const options = shuffle<ConjugationOption>([
      { person: target.id, form: answer, correct: true },
      ...distractors.map((p) => ({
        person: p.id,
        form: verbForm(verb, combo.tense, combo.polarity, p.id)!,
        correct: false,
      })),
    ]);

    out.push({
      verb,
      tense: combo.tense,
      polarity: combo.polarity,
      person: target.id,
      pronoun: target.fi,
      pronounEn: target.en,
      answer,
      clause,
      options,
    });
  }
  return out;
}
