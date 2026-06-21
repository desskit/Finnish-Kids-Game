import type { CaseId, Construction, GrammaticalNumber, LexicalItem } from '../content/types';
import { caseFormOf, formFor } from '../content/types';
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
