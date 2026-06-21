// Content schema.
//
// IMPORTANT: every Finnish string in the data files is HUMAN-AUTHORED and
// native/expert-checked — including the inflected slot forms in constructions.
// The app never generates or inflects Finnish by rule; runtime logic only
// selects, shuffles, and sequences from this hand-written pool.

export type Tier = 1 | 2 | 3 | 4;

export type ThemeId = 'animals';

/** A single vocabulary word (stored in its dictionary / nominative form). */
export interface LexicalItem {
  /** Stable id used to link constructions to vocabulary. */
  id: string;
  /** Finnish word, hand-written. */
  fi: string;
  /** English gloss. */
  en: string;
  /** Placeholder art — swapped for real artwork in a later session. */
  emoji: string;
  tier: Tier;
  /** Optional recorded-audio path (future). Falls back to TTS when absent. */
  audio?: string;
}

export interface Theme {
  id: ThemeId;
  fi: string;
  en: string;
  emoji: string;
  items: LexicalItem[];
}

/**
 * One allowed fill for a construction's slot.
 * `form` is the CORRECT, hand-written inflected Finnish for THIS construction —
 * e.g. nominative "kissa" after "Tämä on", but it would be partitive/accusative
 * in a different construction. Forms are authored, never computed.
 */
export interface PhraseFill {
  /** Links to a LexicalItem.id. */
  itemId: string;
  /** Hand-written, correctly inflected form for this slot. */
  form: string;
}

/**
 * A high-frequency carrier phrase: fixed words + one swappable slot.
 * Full sentence is assembled as `${prefix} ${fill.form}${suffix}` using only
 * authored forms.
 */
export interface Construction {
  id: string;
  /** Fixed words before the slot, e.g. "Tämä on". */
  prefix: string;
  /** Fixed text after the slot, e.g. "." or "?". */
  suffix: string;
  /** English template with the slot marked as ___ , e.g. "This is ___." */
  en: string;
  tier: Tier;
  /** Human-authored correct forms, one per usable vocabulary item. */
  fills: PhraseFill[];
}
