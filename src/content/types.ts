// Content schema.
//
// Finnish word forms come from human-generated, tagged data (Wiktionary via
// kaikki.org, CC BY-SA 4.0) under src/content/data/*.sourced.json. The app
// looks up the correct inflected form BY TAG (case + number) — it never
// generates or inflects Finnish by rule. Carrier phrases below are
// human-authored; only the slot form is filled from the tagged data.

export type Tier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type GrammaticalNumber = 'singular' | 'plural';

export type CaseId =
  | 'nominative'
  | 'genitive'
  | 'partitive'
  | 'inessive'
  | 'elative'
  | 'illative'
  | 'adessive'
  | 'ablative'
  | 'allative'
  | 'essive'
  | 'translative'
  | 'abessive'
  | 'instructive'
  | 'comitative';

export interface Example {
  fi: string;
  en: string;
}

/** A vocabulary word with its full, sourced inflection table and tags. */
export interface LexicalItem {
  /** Stable id used to link constructions to vocabulary. */
  id: string;
  /** Nominative singular (convenience copy of inflections.nominative_singular). */
  fi: string;
  /** English gloss (human-curated, single word). */
  en: string;
  /** Placeholder art — swapped for real artwork in a later session.
   *  Optional: abstract words (e.g. quality adjectives) have no single picture. */
  emoji?: string;
  tier: Tier;
  /** Sourced inflection table, keyed `${case}_${number}` (e.g. "genitive_singular"). */
  inflections: Record<string, string>;
  kotusType?: number;
  group?: string;
  frequencyRank?: number;
  /** Numeric value, for number words (used by counting scenes + grammar rule). */
  value?: number;
  /** Sourced examples (not yet surfaced in the kids UI; pending kid-safety review). */
  examples?: Example[];
  /** Optional recorded-audio path (future). Falls back to TTS when absent. */
  audio?: string;
  /** Theme id the word belongs to (e.g. 'animals') — drives semantic gating. */
  topic?: string;
  /**
   * Hand-curated semantic tags — properties a word has that decide which
   * carrier phrases make SENSE for it, beyond grammar. Today: a place's
   * locative shape, 'surface' (you sit ON it) and/or 'container' (you go IN
   * it) — many places are both. See scripts/build-kids-data.mjs and suitsSlot.
   */
  tags?: string[];
}

/**
 * A high-frequency carrier phrase with ONE inflected slot.
 * The slot's form is looked up from the chosen item's tagged inflection table
 * (case + number) — never generated. Fixed words/punctuation are human-authored.
 *
 * Sentence = [before, <slot form>, after] joined by spaces, then `punct`.
 *   "Tämä on ___."   -> before "Tämä on", case nominative.singular, punct "."
 *   "Pidän ___sta."  -> before "Pidän",   case elative.singular,    punct "."
 *   "___ edessä"     -> after "edessä",   case genitive.singular   (postposition)
 */
export interface Construction {
  id: string;
  /** Fixed words before the slot. */
  before?: string;
  /** Fixed words after the slot (e.g. a postposition like "edessä"). */
  after?: string;
  /** Trailing punctuation, e.g. "." or "?". */
  punct?: string;
  /** English template with the slot marked as ___ , e.g. "This is a ___." */
  en: string;
  tier: Tier;
  /** Grammatical case the slot must take. */
  case: CaseId;
  /** Grammatical number the slot must take. */
  number: GrammaticalNumber;
  /**
   * Semantic gate: theme ids whose words make SENSE in this slot (e.g. the
   * locative carriers only work with places — "Kissa menee äitiin" is
   * grammatical nonsense). Omitted = any noun topic.
   */
  topics?: string[];
  /** Semantic gate, finer grain: specific item ids that read oddly here. */
  excludeIds?: string[];
  /**
   * Semantic gate by word tag: the item must carry ALL of these tags. Used by
   * the locative carriers to match the case to a place's shape — the "on"
   * cases require 'surface', the "in" cases require 'container' (see
   * LexicalItem.tags). Omitted = no tag requirement.
   */
  requiresTags?: string[];
}

export interface Theme {
  id: string;
  fi: string;
  en: string;
  emoji: string;
  items: LexicalItem[];
  /** Carrier phrases usable with this theme's vocabulary (may be empty). */
  constructions: Construction[];
  /** True if these items are countable nouns (enables the Count & Say game). */
  countable?: boolean;
}

export function inflectionKey(c: CaseId, n: GrammaticalNumber): string {
  return `${c}_${n}`;
}

/** The correct sourced form for an item in a construction's slot, if available. */
export function formFor(item: LexicalItem, con: Construction): string | undefined {
  return item.inflections[inflectionKey(con.case, con.number)];
}

/**
 * Whether a word makes SENSE in a construction's slot (the semantic gate on
 * top of the grammatical one). Round builders pair (construction, item) only
 * when this passes, so the capstones can't produce grammatical nonsense like
 * "Minulla on taivas".
 */
export function suitsSlot(item: LexicalItem, con: Construction): boolean {
  if (con.topics && (!item.topic || !con.topics.includes(item.topic))) return false;
  if (con.excludeIds?.includes(item.id)) return false;
  if (con.requiresTags && !con.requiresTags.every((t) => item.tags?.includes(t))) return false;
  return true;
}

/** Assemble the full human-authored sentence using only the sourced slot form. */
export function sentenceFor(item: LexicalItem, con: Construction): string {
  const form = formFor(item, con) ?? item.fi;
  const parts = [con.before, form, con.after].filter(
    (p): p is string => typeof p === 'string' && p.length > 0,
  );
  return parts.join(' ') + (con.punct ?? '');
}

// --- Two-slot counting construction: number + counted noun ---------------
//
// Finnish counting rule: a noun counted by 1 stays in the nominative singular
// (yksi kissa); counted by 2+ it takes the partitive singular (kolme kissaa).
// Both forms come from the sourced inflection table — never generated.

/** The counted-noun form for a given count, looked up by tag. */
export function countingNounForm(noun: LexicalItem, count: number): string {
  const key = count === 1 ? 'nominative_singular' : 'partitive_singular';
  return noun.inflections[key] ?? noun.fi;
}

/** Assemble "kolme kissaa" from a number item + a noun item. */
export function countingPhrase(number: LexicalItem, noun: LexicalItem): string {
  return `${number.fi} ${countingNounForm(noun, number.value ?? 0)}`;
}

// --- Two-slot adjective + noun agreement ---------------------------------
//
// A Finnish attributive adjective AGREES with its noun in case AND number:
// "iso kissa" (nom sg), "isossa kissassa" (iness sg), "punaisen koiran" (gen sg).
// Both words inflect to the same case+number; each form is looked up from its
// own sourced table — never generated. The shared tag is the agreement.

/** Look up an item's form for an arbitrary case + number. */
export function caseFormOf(
  item: LexicalItem,
  c: CaseId,
  n: GrammaticalNumber,
): string | undefined {
  return item.inflections[inflectionKey(c, n)];
}

/** The agreeing adjective + noun forms for a case + number, if both exist. */
export function agreementForms(
  adjective: LexicalItem,
  noun: LexicalItem,
  c: CaseId,
  n: GrammaticalNumber,
): { adjective: string; noun: string } | undefined {
  const a = caseFormOf(adjective, c, n);
  const b = caseFormOf(noun, c, n);
  if (!a || !b) return undefined;
  return { adjective: a, noun: b };
}

/** Assemble e.g. "isossa kissassa" from an adjective + noun + case + number. */
export function agreementPhrase(
  adjective: LexicalItem,
  noun: LexicalItem,
  c: CaseId,
  n: GrammaticalNumber,
): string | undefined {
  const forms = agreementForms(adjective, noun, c, n);
  return forms && `${forms.adjective} ${forms.noun}`;
}

// --- Verb conjugation -----------------------------------------------------
//
// Verb items reuse LexicalItem; their `inflections` are keyed
// `${tense}_active_${polarity}_${person}` (e.g. present_active_positive_1sg →
// "syön", present_active_negative_2sg → "et syö"). Forms are looked up, never
// generated. `fi` holds the infinitive (e.g. "syödä").

export type PersonId = '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl';
export type VerbTense = 'present' | 'past';
export type Polarity = 'positive' | 'negative';

export interface Person {
  id: PersonId;
  fi: string;
  en: string;
}

export const PERSONS: Person[] = [
  { id: '1sg', fi: 'minä', en: 'I' },
  { id: '2sg', fi: 'sinä', en: 'you' },
  { id: '3sg', fi: 'hän', en: 'he/she' },
  { id: '1pl', fi: 'me', en: 'we' },
  { id: '2pl', fi: 'te', en: 'you (plural)' },
  { id: '3pl', fi: 'he', en: 'they' },
];

/** The conjugated verb form for a tense/polarity/person, looked up by tag. */
export function verbForm(
  verb: LexicalItem,
  tense: VerbTense,
  polarity: Polarity,
  person: PersonId,
): string | undefined {
  return verb.inflections[`${tense}_active_${polarity}_${person}`];
}

/** A full clause with pronoun, e.g. "minä syön" / "hän ei syö". */
export function conjugatedClause(
  verb: LexicalItem,
  tense: VerbTense,
  polarity: Polarity,
  person: PersonId,
): string | undefined {
  const p = PERSONS.find((x) => x.id === person);
  const form = verbForm(verb, tense, polarity, person);
  if (!p || !form) return undefined;
  return `${p.fi} ${form}`;
}

// --- Multi-slot sentence templates (advanced; content authored later) -----
//
// A `Construction` has exactly ONE inflected slot. Real sentences often have
// several: a recipient AND an object ("annan koiralle luun"), an adjective+noun
// object that must agree ("näen ison koiran"), or a verb chain ("haluan syödä
// omenan"). `SentenceConstruction` generalizes that: an ordered list of tokens,
// each a fixed word or a slot, where each slot pulls a form from the sourced
// tables (or PERSONS for pronouns) — still NEVER generated.
//
// This is the seam for the hardest chapter. The registry in
// `src/content/sentences.ts` ships EMPTY; authoring templates (manual work) is
// what lights up the chapter. The shape is expected to firm up once the first
// real templates exist, so treat it as v1.

export type SlotRole = 'noun' | 'adjective' | 'verb' | 'pronoun' | 'number';
export type VerbSlotForm = 'conjugated' | 'infinitive';

/** One inflected position in a sentence template. */
export interface SentenceSlot {
  /** Unique within the template, e.g. 'subject', 'object', 'recipient'. */
  id: string;
  role: SlotRole;
  /** noun/adjective/number slots: the case to inflect to (default nominative). */
  case?: CaseId;
  /** noun/adjective/number slots: singular | plural (default singular). */
  number?: GrammaticalNumber;
  /** verb slots: a finite conjugated form, or the dictionary infinitive. */
  verbSlotForm?: VerbSlotForm;
  /** verb slots (conjugated): tense + polarity (person comes from the subject). */
  tense?: VerbTense;
  polarity?: Polarity;
  /**
   * Inflect to AGREE with another slot:
   *  - adjective → its noun (copy case + number),
   *  - conjugated verb → its subject (copy person).
   */
  agreesWith?: string;
  /** Draw the word from this pool. */
  pool?: 'nouns' | 'verbs' | 'adjectives' | 'numbers' | 'pronouns';
  /**
   * Curated candidate ids this slot may swap among — a subset of `pool`,
   * chosen so every option is grammatically AND semantically sensible (e.g. the
   * object of "eat" only varies over foods). The form for whichever word is
   * picked is still looked up from the sourced tables, so the grammar is correct
   * for the whole set. `fixedId` (one pinned word) still takes precedence.
   */
  pickFrom?: string[];
  /** Or pin a specific word/pronoun by id (overrides `pool`/`pickFrom`). */
  fixedId?: string;
}

/** A full sentence with two or more inflected slots. */
export interface SentenceConstruction {
  id: string;
  /**
   * English gloss of the whole sentence, e.g. "I give the dog a bone." May
   * contain `{slotId}` placeholders, substituted with the picked word's English
   * gloss so the hint tracks a swapped noun (e.g. "I see the big {obj}" →
   * "I see the big bear" when `obj` resolves to the bear).
   */
  en: string;
  tier: Tier;
  /** Ordered tokens: a fixed word, or a reference to one of `slots` by id. */
  tokens: Array<{ fixed: string } | { slot: string }>;
  slots: SentenceSlot[];
  punct?: string;
}
