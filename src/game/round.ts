import type {
  CaseId,
  Construction,
  GrammaticalNumber,
  LexicalItem,
  Person,
  PersonId,
  Polarity,
  SentenceConstruction,
  Tier,
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
  maxTier: Tier = 4,
): PhraseQuestion[] {
  // Only pair a construction with items that actually have the needed form.
  // Gate by tier when a skill mixes tiers, but never gate a curated set down to
  // nothing — a single higher-tier construction (its own skill) must still play.
  const byTier = constructions.filter((c) => c.tier <= maxTier);
  const allowed = byTier.length > 0 ? byTier : constructions;
  const pool: { construction: Construction; item: LexicalItem }[] = [];
  for (const construction of allowed) {
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

// Spelling, grammar apex: type the INFLECTED slot form, not the bare noun. Each
// question pairs an item with a (tier-gated) carrier phrase; the typed target is
// formFor(item, construction) — the sourced case form (e.g. "laatikoissa"),
// never generated. Only single-word forms are used (no spaced counted phrases),
// so the on-screen keyboard stays a single-token drill.

export interface SpellingPhraseQuestion {
  construction: Construction;
  item: LexicalItem;
  /** The sourced inflected form the child types, e.g. "pöydällä". */
  target: string;
}

export function buildSpellingPhraseRound(
  items: readonly LexicalItem[],
  constructions: readonly Construction[],
  questionCount: number,
  maxTier: Tier = 4,
): SpellingPhraseQuestion[] {
  // Tier-gate a mixed set, but never down to nothing (see buildPhraseRound).
  const byTier = constructions.filter((c) => c.tier <= maxTier);
  const allowed = byTier.length > 0 ? byTier : constructions;
  const pool: SpellingPhraseQuestion[] = [];
  for (const construction of allowed) {
    for (const item of items) {
      const target = formFor(item, construction);
      // Single-token forms only — skip any multi-word slot form.
      if (target && !target.includes(' ')) pool.push({ construction, item, target });
    }
  }
  return sample(pool, Math.min(questionCount, pool.length));
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
  maxTier: Tier = 4,
): WordOrderQuestion[] {
  // Tier-gate a mixed set, but never down to nothing (see buildPhraseRound).
  const byTier = constructions.filter((c) => c.tier <= maxTier);
  const allowed = byTier.length > 0 ? byTier : constructions;
  const pool: { construction: Construction; item: LexicalItem }[] = [];
  for (const construction of allowed) {
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

// --- Multi-slot sentences (advanced; content authored later) -------------
//
// Build word-order rounds from `SentenceConstruction` templates that have two+
// inflected slots (recipient + object, adjective+noun object, verb chains, …).
// Every slot's form is looked up from the sourced tables (or PERSONS) — never
// generated; agreement (adjective→noun, verb→subject person) is resolved by
// copying tags, not by rule. Emits the SAME shape the Word Order game renders,
// so no new UI is needed. The templates list is empty today (see
// `src/content/sentences.ts`); this returns [] until content is authored.

export interface SentencePools {
  nouns: readonly LexicalItem[];
  verbs: readonly LexicalItem[];
  adjectives: readonly LexicalItem[];
  numbers: readonly LexicalItem[];
}

/** A normalized "put the words in order" question (shared by phrases + sentences). */
export interface SentenceQuestion {
  /** English gloss shown as a hint. */
  hintEn: string;
  /** The full target sentence (for text-to-speech). */
  sentence: string;
  /** Tokens in correct order. */
  tokens: WordOrderToken[];
  /** Same tokens shuffled for display. */
  shuffled: WordOrderToken[];
  /** Optional item id for SRS crediting (sentences span several words, so none). */
  attemptId?: string;
}

function sentencePool(
  pool: SentencePools,
  which: NonNullable<SentenceConstruction['slots'][number]['pool']>,
): readonly LexicalItem[] {
  switch (which) {
    case 'verbs':
      return pool.verbs;
    case 'adjectives':
      return pool.adjectives;
    case 'numbers':
      return pool.numbers;
    default:
      return pool.nouns;
  }
}

interface SlotPick {
  item?: LexicalItem;
  person?: Person;
  case?: CaseId;
  number?: GrammaticalNumber;
}

/** Narrow a slot's pool to its curated candidate ids, when `pickFrom` is set. */
function candidates(
  from: readonly LexicalItem[],
  pickFrom?: string[],
): readonly LexicalItem[] {
  if (!pickFrom || pickFrom.length === 0) return from;
  const allowed = from.filter((i) => pickFrom.includes(i.id));
  return allowed.length > 0 ? allowed : from;
}

interface ResolvedSentence {
  words: string[];
  picks: Record<string, SlotPick>;
}

/**
 * Resolve one template into its ordered surface words + the concrete picks
 * behind them, choosing a word per slot and looking up every form. Returns null
 * if any slot can't be filled (so the builder simply tries another sample).
 */
function resolveSentenceInternal(
  template: SentenceConstruction,
  pools: SentencePools,
): ResolvedSentence | null {
  const picks: Record<string, SlotPick> = {};

  // 1) Choose a concrete word/pronoun for each slot + its base case/number.
  //    A slot may pin one word (`fixedId`), swap among a curated set
  //    (`pickFrom`), or draw from its whole pool.
  for (const slot of template.slots) {
    if (slot.role === 'pronoun') {
      const person = slot.fixedId
        ? PERSONS.find((p) => p.id === slot.fixedId)
        : sample(PERSONS, 1)[0];
      if (!person) return null;
      picks[slot.id] = { person };
    } else if (slot.role === 'verb') {
      const item = slot.fixedId
        ? pools.verbs.find((i) => i.id === slot.fixedId)
        : sample(candidates(pools.verbs, slot.pickFrom), 1)[0];
      if (!item) return null;
      picks[slot.id] = { item };
    } else {
      const from = sentencePool(pools, slot.pool ?? 'nouns');
      const item = slot.fixedId
        ? from.find((i) => i.id === slot.fixedId)
        : sample(candidates(from, slot.pickFrom), 1)[0];
      if (!item) return null;
      picks[slot.id] = {
        item,
        case: slot.case ?? 'nominative',
        number: slot.number ?? 'singular',
      };
    }
  }

  // 2) Adjectives copy their noun's case + number (agreement).
  for (const slot of template.slots) {
    if (slot.role === 'adjective' && slot.agreesWith) {
      const ref = picks[slot.agreesWith];
      if (ref) {
        picks[slot.id].case = ref.case;
        picks[slot.id].number = ref.number;
      }
    }
  }

  // 3) Compute each slot's surface form.
  const surface: Record<string, string> = {};
  for (const slot of template.slots) {
    const pick = picks[slot.id];
    if (slot.role === 'pronoun') {
      surface[slot.id] = pick.person?.fi ?? '';
    } else if (slot.role === 'verb') {
      if (!pick.item) return null;
      if (slot.verbSlotForm === 'infinitive') {
        surface[slot.id] = pick.item.fi;
      } else {
        const subject = slot.agreesWith ? picks[slot.agreesWith] : undefined;
        const personId = subject?.person?.id ?? '3sg';
        const form = verbForm(
          pick.item,
          slot.tense ?? 'present',
          slot.polarity ?? 'positive',
          personId,
        );
        if (!form) return null;
        surface[slot.id] = form;
      }
    } else {
      if (!pick.item) return null;
      const form = caseFormOf(pick.item, pick.case ?? 'nominative', pick.number ?? 'singular');
      if (!form) return null;
      surface[slot.id] = form;
    }
  }

  // 4) Assemble ordered words; split on spaces so multi-word forms become chips.
  const words: string[] = [];
  for (const tok of template.tokens) {
    const text = 'fixed' in tok ? tok.fixed : surface[tok.slot] ?? '';
    for (const w of text.split(' ').filter(Boolean)) words.push(w);
  }
  return words.length > 0 ? { words, picks } : null;
}

/** Fill `{slotId}` placeholders in the gloss from each pick's English gloss. */
function glossFor(template: SentenceConstruction, picks: Record<string, SlotPick>): string {
  return template.en.replace(/\{(\w+)\}/g, (whole, id: string) => {
    const pick = picks[id];
    if (!pick) return whole;
    return pick.person?.en ?? pick.item?.en ?? whole;
  });
}

/**
 * Resolve one template into its ordered surface words, looking up every form.
 * Returns null if any slot can't be filled.
 */
export function resolveSentenceWords(
  template: SentenceConstruction,
  pools: SentencePools,
): string[] | null {
  return resolveSentenceInternal(template, pools)?.words ?? null;
}

/**
 * Like `resolveSentenceWords`, but also returns the English gloss with any
 * `{slot}` placeholders filled from the words actually picked — so a swapped
 * noun updates the hint shown to the child.
 */
export function resolveSentence(
  template: SentenceConstruction,
  pools: SentencePools,
): { words: string[]; gloss: string } | null {
  const resolved = resolveSentenceInternal(template, pools);
  if (!resolved) return null;
  return { words: resolved.words, gloss: glossFor(template, resolved.picks) };
}

export function buildSentenceRound(
  templates: readonly SentenceConstruction[],
  pools: SentencePools,
  questionCount: number,
  maxTier: Tier = 4,
): SentenceQuestion[] {
  const byTier = templates.filter((t) => t.tier <= maxTier);
  const allowed = byTier.length > 0 ? byTier : templates;
  if (allowed.length === 0) return [];

  const out: SentenceQuestion[] = [];
  let guard = 0;
  while (out.length < questionCount && guard++ < questionCount * 8) {
    const template = sample(allowed, 1)[0];
    if (!template) break;
    const resolved = resolveSentence(template, pools);
    if (!resolved) continue;
    const { words, gloss } = resolved;

    const last = words.length - 1;
    const tokens: WordOrderToken[] = words.map((text, id) => ({
      id,
      text: id === last ? text + (template.punct ?? '') : text,
    }));
    let shuffled = shuffle(tokens);
    while (tokens.length > 1 && shuffled.every((t, i) => t.id === tokens[i].id)) {
      shuffled = shuffle(tokens);
    }

    out.push({
      hintEn: gloss,
      sentence: words.join(' ') + (template.punct ?? ''),
      tokens,
      shuffled,
    });
  }
  return out;
}
