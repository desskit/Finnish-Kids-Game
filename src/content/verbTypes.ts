// Verb types (verbityypit) and consonant gradation (KPT) — how the course
// groups verbs. NOTHING here builds a Finnish form: the TYPE comes from the
// sourced dictionary class (`kotusType`, Kotus/Wiktionary), and the KPT check
// only COMPARES two sourced forms — the infinitive and the "minä" form — to see
// whether a consonant changed between them (nukkua → nukun).

import type { LexicalItem } from './types';
import { verbForm } from './types';
import type { Segment } from './endings';

export type VerbType = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * The school verb type (1–6) from the sourced Kotus class:
 * 52–61 → 1 (two vowels: puhua, laulaa); 62–65, 68, 71 → 2 (-da/-dä: syödä,
 * uida, tehdä); 66, 67, 70 → 3 (-lla, -nna, -sta: tulla, mennä, pestä,
 * juosta); 73–75 → 4 (-ata, -ota, -uta: avata, siivota, haluta, kiivetä);
 * 69 → 5 (-ita: tarvita); 72 → 6 (-eta: vanheta).
 */
export function verbType(v: LexicalItem): VerbType | undefined {
  const k = v.kotusType;
  if (k === undefined) return undefined;
  if (k >= 52 && k <= 61) return 1;
  if ((k >= 62 && k <= 65) || k === 68 || k === 71) return 2;
  if (k === 66 || k === 67 || k === 70) return 3;
  if (k >= 73 && k <= 75) return 4;
  if (k === 69) return 5;
  if (k === 72) return 6;
  return undefined;
}

/** How each type's infinitive looks — what a child can SEE. */
export const TYPE_LOOKS: Record<VerbType, string> = {
  1: 'two vowels at the end: -aa, -ea, -ia, -ua…',
  2: '-da / -dä',
  3: '-lla, -nna, -rra, -sta (two consonants + a)',
  4: '-ata, -ota, -uta, -ätä…',
  5: '-ita / -itä',
  6: '-eta / -etä',
};

/** The short label on a "which type?" tile. */
export const TYPE_TILE: Record<VerbType, string> = {
  1: 'Tyyppi 1 · -aa, -ua, -iä…',
  2: 'Tyyppi 2 · -da, -dä',
  3: 'Tyyppi 3 · -lla, -nna, -sta',
  4: 'Tyyppi 4 · -ata, -ota, -uta',
  5: 'Tyyppi 5 · -ita, -itä',
  6: 'Tyyppi 6 · -eta, -etä',
};

/**
 * The infinitive's look, read off its spelling — used only to keep the
 * "which type?" game honest: a verb whose look and dictionary class disagree
 * (kiivetä looks like type 6 but is type 4) is never asked about there.
 */
export function typeByLook(fi: string): VerbType | undefined {
  if (/[dD][aä]$/.test(fi)) return 2;
  if (/(ll|nn|rr|st)[aä]$/.test(fi)) return 3;
  if (/[aeiouyäö][aä]$/.test(fi)) return 1;
  if (/it[aä]$/.test(fi)) return 5;
  if (/et[aä]$/.test(fi)) return 6;
  if (/[aouyäö]t[aä]$/.test(fi)) return 4;
  return undefined;
}

/** Verbs with a stem the type rules don't cover — learned one by one. */
const SPECIAL = new Set(['olla', 'tehdä', 'nähdä', 'juosta']);

export function isSpecialVerb(v: LexicalItem): boolean {
  return SPECIAL.has(v.fi);
}

/** What the "minä" stem WOULD be with no consonant change (for comparison only). */
function plainStem(fi: string, type: VerbType): string | undefined {
  switch (type) {
    case 1:
      return fi.slice(0, -1); // nukkua → nukku
    case 2:
      return fi.slice(0, -2); // syödä → syö
    case 3:
      return fi.slice(0, -2) + 'e'; // tulla → tule, kuunnella → kuunnele
    case 4:
      return fi.slice(0, -2) + fi.slice(-1); // avata → avaa, hypätä → hypää
    case 5:
      return fi.slice(0, -1) + 'se'; // tarvita → tarvitse
    case 6:
      return fi.slice(0, -2) + 'ne'; // vanheta → vanhene
  }
}

export interface Gradation {
  /** The consonants as they are in the infinitive ('' = none, as in paeta). */
  inInfinitive: string;
  /** …and as they are in the "minä" form. */
  inMina: string;
  /** Which form has the STRONG (longer/harder) consonant. Types 1: the
   *  infinitive (nukkua → nukun); types 3, 4, 6: the minä form (hypätä → hyppään). */
  strong: 'infinitive' | 'mina';
  /** Where the changing consonants start (same index in both forms). */
  at: number;
}

const VOWEL = /[aeiouyäö]/;

/**
 * Does this verb's consonant change between its infinitive and its "minä"
 * form (KPT)? Compares the SOURCED minä stem with the plain stem; the changed
 * consonant cluster is cut out for display ("kk → k"). Undefined = no change,
 * or a special verb.
 */
export function gradation(v: LexicalItem): Gradation | undefined {
  const type = verbType(v);
  const fi = v.fi;
  const mina = verbForm(v, 'present', 'positive', '1sg');
  if (!type || !mina || SPECIAL.has(fi)) return undefined;
  const plain = plainStem(fi, type);
  const real = mina.slice(0, -1); // drop the -n
  if (!plain || plain === real) return undefined;
  // Common start, backed off to the start of its consonant cluster…
  let i = 0;
  while (i < plain.length && i < real.length && plain[i] === real[i]) i++;
  while (i > 0 && !VOWEL.test(plain[i - 1])) i--;
  // …and common end (not overlapping), trimmed to start on a vowel.
  let j = 0;
  while (
    j < plain.length - i &&
    j < real.length - i &&
    plain[plain.length - 1 - j] === real[real.length - 1 - j]
  )
    j++;
  while (j > 0 && !VOWEL.test(plain[plain.length - j])) j--;
  const a = plain.slice(i, plain.length - j);
  const b = real.slice(i, real.length - j);
  return {
    inInfinitive: a,
    inMina: b,
    strong: type === 1 ? 'infinitive' : 'mina',
    at: i,
  };
}

export function hasKpt(v: LexicalItem): boolean {
  return gradation(v) !== undefined;
}

/** "kk → k", "∅ → k" — a gradation for display. */
export function gradationLabel(g: Gradation): string {
  return `${g.inInfinitive || '∅'} → ${g.inMina || '∅'}`;
}

/**
 * A sourced form of a KPT verb with its changing consonants MARKED (only
 * marked — the form itself is the looked-up one). Whichever grade the form has
 * at that spot is marked (longest first); a form with neither is left plain.
 */
export function markGradation(form: string, g: Gradation): Segment[] {
  for (const c of [g.inInfinitive, g.inMina].sort((x, y) => y.length - x.length)) {
    if (c && form.slice(g.at, g.at + c.length) === c) {
      return [
        { text: form.slice(0, g.at) },
        { text: c, mark: true },
        { text: form.slice(g.at + c.length) },
      ].filter((s) => s.text);
    }
  }
  return [{ text: form }];
}

/** How many letters of the infinitive show its type (-aa, -da, -lla, -ata…). */
const LOOK_LENGTH: Record<VerbType, number> = { 1: 2, 2: 2, 3: 3, 4: 3, 5: 3, 6: 3 };

/** The ending that gives a verb's type away ("aa" in laulaa). */
export function typeEnding(fi: string, t: VerbType): string {
  return fi.slice(-LOOK_LENGTH[t]);
}

/** The infinitive with the ending that gives its type away marked. */
export function typeSegments(fi: string, t: VerbType): Segment[] {
  const n = LOOK_LENGTH[t];
  return [{ text: fi.slice(0, -n) }, { text: fi.slice(-n), mark: true }];
}

/** Filter for a course step: these types, with/without a consonant change. */
export interface VerbFilter {
  types?: VerbType[];
  /** true = only KPT verbs, false = only verbs with no change, unset = both. */
  kpt?: boolean;
}

export function matchesVerbFilter(v: LexicalItem, f: VerbFilter): boolean {
  const t = verbType(v);
  if (f.types && (!t || !f.types.includes(t))) return false;
  if (f.kpt !== undefined && hasKpt(v) !== f.kpt) return false;
  return true;
}
