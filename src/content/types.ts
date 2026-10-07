// Content schema.
//
// Finnish word forms come from human-generated, tagged data (Wiktionary via
// kaikki.org, CC BY-SA 4.0) under src/content/data/*.sourced.json. The app
// looks up the correct inflected form BY TAG (case + number) — it never
// generates or inflects Finnish by rule. Carrier phrases below are
// human-authored; only the slot form is filled from the tagged data.

import { LIKED_AS_A_KIND, NOT_COUNTABLE } from './semantics';

export type Tier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

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
/**
 * Sourced English inflected forms for a word (from AGID; see scripts/agid.mjs).
 * Only the fields relevant to the word's part of speech are present.
 */
export interface EnglishMorph {
  /** Noun plural, e.g. "cats", "children", "fish". */
  plural?: string;
  /** Verb 3rd-person-singular present, e.g. "eats", "goes", "is". */
  thirdSg?: string;
  /** Verb simple past, e.g. "ate", "went", "loved". */
  past?: string;
  /** Verb past participle, e.g. "eaten", "gone", "loved". */
  pastParticiple?: string;
  /** Verb present participle / gerund, e.g. "eating", "going". */
  gerund?: string;
  /** Adjective comparative, e.g. "bigger", "better". */
  comparative?: string;
  /** Adjective superlative, e.g. "biggest", "best". */
  superlative?: string;
}

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
  /**
   * Sourced ENGLISH morphology (from the vendored AGID database via the build) —
   * so English glosses are looked up, never rule-generated. Nouns carry `plural`;
   * verbs carry `past/pastParticiple/gerund/thirdSg`; adjectives carry
   * `comparative/superlative`. Numbers have none.
   */
  english?: EnglishMorph;
  kotusType?: number;
  /** Adjectives: the sourced comparison degrees (dictionary headwords),
   *  e.g. { comparative: 'isompi', superlative: 'isoin' }. */
  degrees?: { comparative: string; superlative: string };
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
  /**
   * Semantic gate, tightest grain: ONLY these item ids fit the slot. Used
   * where the sensible set is a short curated list rather than a topic — e.g.
   * the mass-noun partitive "Ostan maitoa" only works for divisible foods.
   * Omitted = no allow-list (the other gates still apply).
   */
  onlyIds?: string[];
  /**
   * Possessive carriers ("Tämä on minun ___." → "kirjani"): the slot takes the
   * sourced POSSESSIVE form for this possessor (in `case`, singular) instead
   * of the plain case form. See `possessiveForm`.
   */
  possessor?: PossessorId;
  /**
   * Per-word English overrides for the gloss (`englishSentenceFor`), where the
   * Finnish idiom doesn't map word-for-word: "Minulla on nälkä" is "I'm
   * hungry", not "I have a hunger". English meta-text only.
   */
  glossById?: Record<string, string>;
  /**
   * Whole English sentences for words where English changes more than the
   * noun phrase: "Kissa menee puuhun" is "The cat goes up the tree", "Menen
   * bussiin" is "I'm getting on the bus". Checked before `glossById`.
   */
  sentenceById?: Record<string, string>;
  /**
   * Verb carriers ("Haluan ___." → "Haluan leikkiä"): the slot takes a VERB in
   * its basic (infinitive) form — the sourced dictionary form itself. `case`
   * is then just 'nominative' (unmarked).
   */
  verb?: 'infinitive';
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
  if (con.verb) return item.topic === 'verbs' ? item.fi : undefined;
  if (con.possessor) return item.inflections[`poss_${con.possessor}_${con.case}_singular`];
  return item.inflections[inflectionKey(con.case, con.number)];
}

/** The English word for an item in a construction (honours `glossById`). */
export function glossFor(item: LexicalItem, con: Construction): string {
  return con.glossById?.[item.id] ?? item.en;
}

/**
 * Whether a word makes SENSE in a construction's slot (the semantic gate on
 * top of the grammatical one). Round builders pair (construction, item) only
 * when this passes, so the capstones can't produce grammatical nonsense like
 * "Minulla on taivas".
 */
// Words that only fill carriers which ask for them BY NAME (via `topics` or
// `onlyIds`): days and seasons, feelings-as-nouns, adjectives and numbers. A
// generic carrier ("Minulla on ___", "Näen ___n") never takes them — so
// "Minulla on maanantai" or "Näen punaisen" can't be assembled even if a pool
// ever mixed them in. The one exception: a thing-describing adjective is a
// fine predicate after "Tämä on / Onko tämä" ("Tämä on punainen.") — but not a
// feeling, which needs a living subject ("Tämä on iloinen" is wrong).
const OPT_IN_TOPICS = ['time', 'states', 'adjectives', 'numbers', 'verbs'];
const PREDICATE_CARRIERS = ['this-is', 'is-this'];
const FEELING_ADJECTIVES = [
  'happy',
  'sad',
  'angry',
  'tired',
  'hungry',
  'thirsty',
  'sick',
  'calm',
  'proud',
  'kind',
  'cute',
];

export function suitsSlot(item: LexicalItem, con: Construction): boolean {
  const predicate =
    item.topic === 'adjectives' && PREDICATE_CARRIERS.includes(con.id) && !FEELING_ADJECTIVES.includes(item.id);
  if (
    item.topic &&
    OPT_IN_TOPICS.includes(item.topic) &&
    !predicate &&
    !con.topics?.includes(item.topic) &&
    !con.onlyIds?.includes(item.id)
  ) {
    return false;
  }
  if (con.topics && (!item.topic || !con.topics.includes(item.topic))) return false;
  if (con.excludeIds?.includes(item.id)) return false;
  if (con.requiresTags && !con.requiresTags.every((t) => item.tags?.includes(t))) return false;
  if (con.onlyIds && !con.onlyIds.includes(item.id)) return false;
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

// Article overrides for the "a ___" carrier templates. Most nouns just need
// "a"/"an" (picked by first letter, below); a small, hand-maintained set
// needs something else in plain English: mass nouns take no article at all
// ("This is water.", not "a water"), and a few nature words are conventionally
// unique referents ("This is the sun.", not "a sun").
const DEFINITE_ARTICLE_IDS = new Set(['sun', 'moon', 'sky', 'sea']);
// Uncountable things take no "a" — "This is soup", "I buy rice" — plus a few
// words that are uncountable in English only.
const NO_ARTICLE_IDS = new Set([
  ...NOT_COUNTABLE.filter((id) => !DEFINITE_ARTICLE_IDS.has(id)),
  'bread',
  'cheese',
  'hair',
]);
// Carriers about liking something: English talks about a KIND of food or
// pastime without "the" ("I like pizza", "I love chocolate").
const LIKING_CARRIERS = new Set(['i-like', 'i-love', 'i-dont-like', 'i-like-tykkaan', 'i-dont-like-tykkaa']);

function englishArticleFor(item: LexicalItem): string {
  // A describing word after "is" takes no article: "This is red", not "a red".
  if (item.topic === 'adjectives') return '';
  if (NO_ARTICLE_IDS.has(item.id)) return '';
  if (DEFINITE_ARTICLE_IDS.has(item.id)) return 'the';
  return /^[aeiou]/i.test(item.en) ? 'an' : 'a';
}

/**
 * The English side of a carrier phrase with its blank filled in (e.g.
 * "This is a ___." + the "dog" item -> "This is a dog."), for narrating the
 * prompt aloud. Never reveals the Finnish form — this is the same English
 * gloss already shown as on-screen text. Templates with a baked-in "a ___"
 * get the item's own article substituted in (see `englishArticleFor`) so
 * "This is a ___." + rain doesn't come out as "This is a rain."; any other
 * placeholder (e.g. "the ___", "___s") is filled in as-is.
 */
// Family members a child calls by name — "Grandpa", not "the grandfather".
export const FAMILY_NAMES: Record<string, string> = {
  mother: 'Mom',
  father: 'Dad',
  grandmother: 'Grandma',
  grandfather: 'Grandpa',
};

export function englishSentenceFor(item: LexicalItem, con: Construction): string {
  const sentence = con.sentenceById?.[item.id];
  if (sentence) return sentence;
  const override = con.glossById?.[item.id];
  // An override is the whole noun phrase ("at the station", "school"), so it
  // also replaces any article baked into the template.
  if (override) return con.en.replace(/(?:a |the )?___s?/, override);
  // "Where is Mom?", not "Where is the mom?".
  const name = FAMILY_NAMES[item.id];
  if (name && /(?:a |the )___(?!s)/.test(con.en)) return con.en.replace(/(?:a |the )___/, name);
  // Plural predicatives ("These are ___s.", "Where are the ___s?") use the
  // SOURCED plural — so "fish"/"child" become "fish"/"children", not "fishs".
  if (con.en.includes('___s')) {
    return con.en.replace('___s', item.english?.plural ?? `${item.en}s`);
  }
  if (con.en.includes('a ___')) {
    const filled = [englishArticleFor(item), item.en].filter(Boolean).join(' ');
    return con.en.replace('a ___', filled);
  }
  // Liking something uncountable, or a kind of food / pastime → no "the":
  // "I like music", "I don't like math", "I love pizza" — but "I love the
  // cat", and "Where is the rain?" keeps its "the".
  if (
    con.en.includes('the ___') &&
    LIKING_CARRIERS.has(con.id) &&
    (NO_ARTICLE_IDS.has(item.id) || LIKED_AS_A_KIND.includes(item.id))
  ) {
    return con.en.replace('the ___', item.en);
  }
  return con.en.replace('___', item.en);
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
export type VerbTense = 'present' | 'past' | 'perfect' | 'conditional';
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
  { id: '2pl', fi: 'te', en: 'you all' },
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

const OWNER_EN: Record<string, string> = {
  mother: "Mom's",
  father: "Dad's",
  grandmother: "Grandma's",
  grandfather: "Grandpa's",
};

/** English for "isän pyörä": "Dad's bike", "the teacher's book". */
export function ownerGloss(owner: LexicalItem, thing: LexicalItem): string {
  return `${OWNER_EN[owner.id] ?? `the ${owner.en}'s`} ${thing.en}`;
}

/** "Don't…!" — the sourced negative command, e.g. "älä juokse". */
export function dontForm(verb: LexicalItem): string | undefined {
  return verb.inflections.imperative_active_negative_2sg;
}

/** "Let's…!" — the sourced present passive, e.g. "juostaan", which spoken
 *  Finnish uses for "let's". */
export function letsForm(verb: LexicalItem): string | undefined {
  return verb.inflections.present_passive_positive;
}

/** The sourced imperative form ("hyppää" / "hypätkää"), looked up by tag. */
export function imperativeForm(verb: LexicalItem, person: '2sg' | '2pl'): string | undefined {
  return verb.inflections[`imperative_active_positive_${person}`];
}

/**
 * A command as spoken/shown: the sourced imperative, capitalized, with an
 * exclamation mark — "Hyppää!". Capitalization + punctuation are presentation
 * (like a carrier's authored punctuation), never a generated form.
 */
export function commandFor(verb: LexicalItem, person: '2sg' | '2pl' = '2sg'): string | undefined {
  const form = imperativeForm(verb, person);
  if (!form) return undefined;
  return form.charAt(0).toUpperCase() + form.slice(1) + '!';
}

// --- Possessive suffixes ("kissani" = my cat, "talossasi" = in your house) ---
//
// Finnish marks the possessor with a SUFFIX stacked on the case ending, not a
// separate word: kissa+ni, talo+ssa+si. The forms are looked up from the
// vendored possessive paradigm (build attaches a focused subset under
// `poss_{possessor}_{case}_singular` keys) — never assembled in code.

/** The possessors the "Kenen?" game teaches. 3rd = his/her/its/their. */
export type PossessorId = '1sg' | '2sg' | '3rd';

export interface Possessor {
  id: PossessorId;
  /** The independent Finnish possessive pronoun, for the prompt ("minun"). */
  fi: string;
  /** English gloss word, gender-neutral for 3rd. */
  en: string;
}

export const POSSESSORS: Possessor[] = [
  { id: '1sg', fi: 'minun', en: 'my' },
  { id: '2sg', fi: 'sinun', en: 'your' },
  { id: '3rd', fi: 'hänen', en: 'his/her' },
];

/** The sourced possessive form for a possessor + case (singular), by tag. */
export function possessiveForm(
  item: LexicalItem,
  possessor: PossessorId,
  c: CaseId = 'nominative',
): string | undefined {
  return item.inflections[`poss_${possessor}_${c}_singular`];
}

// English glosses for the possessive game. Nominative is bare ("my cat"); the
// place cases get a leading preposition, since that's how English renders the
// Finnish locative meaning ("in my house", "on my table"). English meta-text,
// never Finnish.
const POSSESSIVE_CASE_PREP: Partial<Record<CaseId, string>> = {
  inessive: 'in',
  adessive: 'on',
};

/** "my cat" / "in your house" — the English side of a possessive prompt. */
export function possessiveGloss(
  item: LexicalItem,
  possessor: PossessorId,
  c: CaseId = 'nominative',
): string {
  const poss = POSSESSORS.find((p) => p.id === possessor)!;
  const prep = POSSESSIVE_CASE_PREP[c];
  return [prep, poss.en, item.en].filter(Boolean).join(' ');
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
