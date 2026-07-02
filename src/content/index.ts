import animalsData from './data/animals.sourced.json';
import numbersData from './data/numbers.sourced.json';
import adjectivesData from './data/adjectives.sourced.json';
import verbsData from './data/verbs.sourced.json';
import foodData from './data/food.sourced.json';
import familyData from './data/family.sourced.json';
import placesData from './data/places.sourced.json';
import bodyData from './data/body.sourced.json';
import natureData from './data/nature.sourced.json';
import clothesData from './data/clothes.sourced.json';
import { nounConstructions } from './constructions';
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
  suitsSlot,
  sentenceFor,
  inflectionKey,
  countingNounForm,
  countingPhrase,
  caseFormOf,
  agreementForms,
  agreementPhrase,
  verbForm,
  conjugatedClause,
  PERSONS,
} from './types';
export type { PersonId, VerbTense, Polarity, Person } from './types';

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

function toItem(w: SourcedWord, tier: Tier, topic: string): LexicalItem {
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
    topic,
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
    items: file.words.map((w) => toItem(w, 1, file.theme.id)),
    constructions,
    ...extra,
  };
}

export const animals = toTheme(animalsData as unknown as SourcedFile, nounConstructions, {
  countable: true,
});
export const numbers = toTheme(numbersData as unknown as SourcedFile, []);
export const food = toTheme(foodData as unknown as SourcedFile, nounConstructions, {
  countable: true,
});
export const family = toTheme(familyData as unknown as SourcedFile, nounConstructions, {
  countable: true,
});
// Place nouns power the locative-case node ("where things are"). They carry the
// full sourced locative paradigm, so the in/on/into/out-of/onto/off/plural
// constructions all resolve. Included in `themes` so the words a child meets in
// that node are reviewable in the cross-topic SRS, like every other noun topic.
export const places = toTheme(placesData as unknown as SourcedFile, nounConstructions, {
  countable: true,
});
// Body / nature / clothes — three more everyday noun themes. Each item carries
// the full sourced case paradigm, so they slot into the same carrier phrases as
// the other noun topics and join the mixed noun pool + the cross-topic Review.
export const body = toTheme(bodyData as unknown as SourcedFile, nounConstructions, {
  countable: true,
});
export const nature = toTheme(natureData as unknown as SourcedFile, nounConstructions, {
  countable: true,
});
export const clothes = toTheme(clothesData as unknown as SourcedFile, nounConstructions, {
  countable: true,
});

// Adjectives are content for the (later) adjective+noun agreement exercises.
// Exported for use by the round builder, but intentionally NOT added to
// `themes` — it is not a standalone play topic in the home UI.
export const adjectives = toTheme(adjectivesData as unknown as SourcedFile, []);

// Verbs power the conjugation exercises (Conjugate the Verb game). Also kept
// out of `themes` — it isn't a noun vocabulary topic, it has its own game.
export const verbs = toTheme(verbsData as unknown as SourcedFile, []);

export const themes: Theme[] = [animals, numbers, food, family, places, body, nature, clothes];

// Every vocabulary item the Review activity can quiz, across all topics. These
// are exactly the items the picture-tap activities record SRS attempts against,
// each with an emoji so it renders as a card. Ids are globally unique (enforced
// by the content-integrity test), so an item id alone keys a schedule.
// Verbs join the rotation too — but only the picturable ones (with an action
// emoji); abstract verbs still earn SRS credit in the conjugation drill, they
// just can't be shown as a picture card here.
export const reviewItems: LexicalItem[] = [
  ...themes.flatMap((t) => t.items),
  ...verbs.items.filter((i) => i.emoji),
];

/** Look up any reviewable item by its (globally unique) id. */
export const reviewItemById: Record<string, LexicalItem> = Object.fromEntries(
  reviewItems.map((i) => [i.id, i]),
);

// Attribution for the Wiktionary/Tatoeba-derived word data (CC BY-SA 4.0).
export const DATA_ATTRIBUTION = (animalsData as unknown as SourcedFile)._source;
export const DATA_LICENSE = (animalsData as unknown as SourcedFile)._license;
