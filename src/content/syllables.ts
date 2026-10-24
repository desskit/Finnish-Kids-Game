// How a word splits into syllables ("kis-sa"), for a younger reader meeting
// it for the first time: Finnish is read syllable by syllable at first, and
// the split helps a new reader decode it (docs/LEARNING_RESEARCH.md: KÄTS,
// tavutus). The splits are Wiktionary's own (data/wiktionary/hyphenation.json,
// fetched by scripts/fetch-hyphenation.mjs) — the app never splits a word
// itself, and a word Wiktionary gives no split for is shown whole.

import data from '../../data/wiktionary/hyphenation.json';

const SPLITS: Readonly<Record<string, readonly string[]>> = (data as { words: Record<string, string[]> }).words;

/** The word's syllables, or undefined (one syllable, or no split known). */
export function syllablesOf(word: string): readonly string[] | undefined {
  const parts = SPLITS[word];
  return parts && parts.length > 1 ? parts : undefined;
}

/** Every split, for the tests. */
export const ALL_SPLITS = SPLITS;
