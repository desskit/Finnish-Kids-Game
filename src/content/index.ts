import animalsData from './data/animals.sourced.json';
import numbersData from './data/numbers.sourced.json';
import adjectivesData from './data/adjectives.sourced.json';
import { animalConstructions } from './constructions';
import type { Construction, Example, LexicalItem, Theme, Tier } from './types';

export type {
  LexicalItem,
  Theme,
  Construction,
  CaseId,
  GrammaticalNumber,
  Tier,
  Example,
} from './types';
export {
  formFor,
  sentenceFor,
  inflectionKey,
  countingNounForm,
  countingPhrase,
  caseFormOf,
  agreementForms,
  agreementPhrase,
} from './types';

interface SourcedWord {
  id: string;
  word: string;
  en: string;
  emoji: string;
  inflections: Record<string, string>;
  kotusType?: number;
  group?: string;
  frequencyRank?: number;
  value?: number;
  examples?: Example[];
}

interface SourcedFile {
  _source: string;
  _license: string;
  theme: { id: string; fi: string; en: string; emoji: string };
  words: SourcedWord[];
}

function toItem(w: SourcedWord, tier: Tier): LexicalItem {
  return {
    id: w.id,
    fi: w.inflections.nominative_singular ?? w.word,
    en: w.en,
    emoji: w.emoji,
    tier,
    inflections: w.inflections,
    kotusType: w.kotusType,
    group: w.group,
    frequencyRank: w.frequencyRank,
    value: w.value,
    examples: w.examples,
  };
}

function toTheme(
  file: SourcedFile,
  constructions: Construction[],
  extra?: Partial<Pick<Theme, 'countable'>>,
): Theme {
  return {
    id: file.theme.id,
    fi: file.theme.fi,
    en: file.theme.en,
    emoji: file.theme.emoji,
    items: file.words.map((w) => toItem(w, 1)),
    constructions,
    ...extra,
  };
}

export const animals = toTheme(animalsData as unknown as SourcedFile, animalConstructions, {
  countable: true,
});
export const numbers = toTheme(numbersData as unknown as SourcedFile, []);

// Adjectives are content for the (later) adjective+noun agreement exercises.
// Exported for use by the round builder, but intentionally NOT added to
// `themes` — it is not a standalone play topic in the home UI.
export const adjectives = toTheme(adjectivesData as unknown as SourcedFile, []);

export const themes: Theme[] = [animals, numbers];

// Attribution for the Wiktionary/Tatoeba-derived word data (CC BY-SA 4.0).
export const DATA_ATTRIBUTION = (animalsData as unknown as SourcedFile)._source;
export const DATA_LICENSE = (animalsData as unknown as SourcedFile)._license;
