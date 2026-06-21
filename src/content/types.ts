// Content schema.
//
// Finnish word forms come from human-generated, tagged data (Wiktionary via
// kaikki.org, CC BY-SA 4.0) under src/content/data/*.sourced.json. The app
// looks up the correct inflected form BY TAG (case + number) — it never
// generates or inflects Finnish by rule. Carrier phrases below are
// human-authored; only the slot form is filled from the tagged data.

export type Tier = 1 | 2 | 3 | 4;

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
  /** Placeholder art — swapped for real artwork in a later session. */
  emoji: string;
  tier: Tier;
  /** Sourced inflection table, keyed `${case}_${number}` (e.g. "genitive_singular"). */
  inflections: Record<string, string>;
  kotusType?: number;
  group?: string;
  frequencyRank?: number;
  /** Sourced examples (not yet surfaced in the kids UI; pending kid-safety review). */
  examples?: Example[];
  /** Optional recorded-audio path (future). Falls back to TTS when absent. */
  audio?: string;
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
}

export interface Theme {
  id: string;
  fi: string;
  en: string;
  emoji: string;
  items: LexicalItem[];
  /** Carrier phrases usable with this theme's vocabulary (may be empty). */
  constructions: Construction[];
}

export function inflectionKey(c: CaseId, n: GrammaticalNumber): string {
  return `${c}_${n}`;
}

/** The correct sourced form for an item in a construction's slot, if available. */
export function formFor(item: LexicalItem, con: Construction): string | undefined {
  return item.inflections[inflectionKey(con.case, con.number)];
}

/** Assemble the full human-authored sentence using only the sourced slot form. */
export function sentenceFor(item: LexicalItem, con: Construction): string {
  const form = formFor(item, con) ?? item.fi;
  const parts = [con.before, form, con.after].filter(
    (p): p is string => typeof p === 'string' && p.length > 0,
  );
  return parts.join(' ') + (con.punct ?? '');
}
