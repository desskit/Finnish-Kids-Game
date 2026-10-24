// Two ways to say it: everyday spoken Finnish (puhekieli) beside the written
// forms the course teaches. Children hear "mä" and "sä" at home, at daycare,
// on Finnish TV — so they meet them here to RECOGNISE (docs/LEARNING_RESEARCH.md:
// the Suomi-koulu curriculum moves from everyday language on; textbooks show
// spoken forms from A1). They are never graded and never asked for: the games
// keep to the written forms.
//
// Every spoken form is one Wiktionary lists as colloquial (the evidence is in
// `evidence`, read through kaikki.org); each pair is in the Finnish check for
// the native reviewer. Lines spoken this way in stories and scenes are for the
// native author to write — none are made up here.

export interface SpokenPair {
  id: string;
  /** The written form the course teaches. */
  written: string;
  /** The everyday spoken form. */
  spoken: string;
  en: string;
  /** What Wiktionary says about the spoken form. */
  evidence: string;
}

export const SPOKEN_PAIRS: readonly SpokenPair[] = [
  { id: 'ma', written: 'minä', spoken: 'mä', en: 'I', evidence: 'mä: colloquial personal pronoun, "I"' },
  { id: 'sa', written: 'sinä', spoken: 'sä', en: 'you', evidence: 'sä: colloquial personal pronoun, "you"' },
  { id: 'oon', written: 'olen', spoken: 'oon', en: 'I am', evidence: 'oon: colloquial first-person singular present of olla' },
  { id: 'oot', written: 'olet', spoken: 'oot', en: 'you are', evidence: 'oot: colloquial second-person singular present of olla' },
  { id: 'mun', written: 'minun', spoken: 'mun', en: 'my', evidence: 'mun: colloquial genitive singular of mä' },
  { id: 'sun', written: 'sinun', spoken: 'sun', en: 'your', evidence: 'sun: colloquial genitive singular of sä' },
];

export const spokenPairById: Readonly<Record<string, SpokenPair>> = Object.fromEntries(
  SPOKEN_PAIRS.map((p) => [p.id, p]),
);

/** The lessons that show a "two ways to say it" card, and which pairs. */
export const SPOKEN_FOR_LESSON: Readonly<Record<string, readonly string[]>> = {
  'verb-persons': ['ma', 'sa', 'oon', 'oot'],
  possessive: ['mun', 'sun'],
  'me-you': ['ma', 'sa'],
};
