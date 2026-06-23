import type { SentenceConstruction } from './types';

// Advanced multi-slot sentence templates — the content for the final "Full
// sentences" chapter. Each entry is ONE human-vetted sentence PATTERN: the verb,
// adjective, pronoun and every grammatical case are pinned, and a single noun
// slot swaps over a curated, semantically-sensible set (`pickFrom`). Whatever
// noun is picked, its form is looked up from the sourced inflection tables for
// the case the slot requires — so the Finnish is correct for the whole set and
// nothing is ever generated. The English hint uses `{slot}` placeholders so it
// tracks the swapped noun (see resolveSentence in src/game/round.ts).
//
// Tiers gate which patterns a child meets as they climb the "Build sentences"
// node: object cases (genitive/partitive) at t5, ditransitive + postpositions +
// negation at t6, directional illative at t7. See docs/CONTENT_GUIDE.md.

// Curated swap sets — every id is a real item carrying the needed case forms.
const ANIMALS = [
  'cat',
  'dog',
  'bear',
  'bunny',
  'bird',
  'fish',
  'horse',
  'cow',
  'pig',
  'fox',
  'duck',
  'frog',
];
// Animals other than the cat (so "the cat is behind the ___" never repeats it).
const ANIMALS_NOT_CAT = ANIMALS.filter((id) => id !== 'cat');
// Foods you EAT (no drinks) — keeps "I eat the big ___" sensible.
const EDIBLE = [
  'apple',
  'banana',
  'bread',
  'cake',
  'cookie',
  'potato',
  'strawberry',
  'carrot',
  'chocolate',
  'cheese',
  'ice-cream',
];
// Someone you could hand a fish to.
const RECIPIENTS = ['cat', 'dog', 'bear', 'bunny', 'fox', 'mother', 'father', 'brother', 'sister', 'baby'];
// Places you can run INTO.
const ENTERABLE = ['house', 'room', 'forest', 'school', 'car', 'box'];

export const sentenceConstructions: SentenceConstruction[] = [
  // t5 — adjective+noun object in the genitive (total object of a bounded verb).
  {
    id: 'see-big-animal',
    en: 'I see the big {obj}.',
    tier: 5,
    punct: '.',
    tokens: [{ slot: 'subj' }, { slot: 'verb' }, { slot: 'adj' }, { slot: 'obj' }],
    slots: [
      { id: 'subj', role: 'pronoun', fixedId: '1sg' },
      {
        id: 'verb',
        role: 'verb',
        verbSlotForm: 'conjugated',
        tense: 'present',
        polarity: 'positive',
        agreesWith: 'subj',
        fixedId: 'see',
      },
      { id: 'adj', role: 'adjective', pool: 'adjectives', agreesWith: 'obj', fixedId: 'big' },
      { id: 'obj', role: 'noun', case: 'genitive', number: 'singular', pickFrom: ANIMALS },
    ],
  },
  // t5 — same shape, food object.
  {
    id: 'eat-big-food',
    en: 'I eat the big {obj}.',
    tier: 5,
    punct: '.',
    tokens: [{ slot: 'subj' }, { slot: 'verb' }, { slot: 'adj' }, { slot: 'obj' }],
    slots: [
      { id: 'subj', role: 'pronoun', fixedId: '1sg' },
      {
        id: 'verb',
        role: 'verb',
        verbSlotForm: 'conjugated',
        tense: 'present',
        polarity: 'positive',
        agreesWith: 'subj',
        fixedId: 'eat',
      },
      { id: 'adj', role: 'adjective', pool: 'adjectives', agreesWith: 'obj', fixedId: 'big' },
      { id: 'obj', role: 'noun', case: 'genitive', number: 'singular', pickFrom: EDIBLE },
    ],
  },
  // t5 — partitive object: katsoa ("watch") is durative, always governs partitive.
  {
    id: 'watch-big-animal',
    en: "I'm watching the big {obj}.",
    tier: 5,
    punct: '.',
    tokens: [{ slot: 'subj' }, { slot: 'verb' }, { slot: 'adj' }, { slot: 'obj' }],
    slots: [
      { id: 'subj', role: 'pronoun', fixedId: '1sg' },
      {
        id: 'verb',
        role: 'verb',
        verbSlotForm: 'conjugated',
        tense: 'present',
        polarity: 'positive',
        agreesWith: 'subj',
        fixedId: 'look',
      },
      { id: 'adj', role: 'adjective', pool: 'adjectives', agreesWith: 'obj', fixedId: 'big' },
      { id: 'obj', role: 'noun', case: 'partitive', number: 'singular', pickFrom: ANIMALS },
    ],
  },
  // t6 — ditransitive: recipient in the allative, object in the genitive.
  {
    id: 'give-someone-fish',
    en: 'I give the {recipient} a fish.',
    tier: 6,
    punct: '.',
    tokens: [{ slot: 'subj' }, { slot: 'verb' }, { slot: 'recipient' }, { slot: 'obj' }],
    slots: [
      { id: 'subj', role: 'pronoun', fixedId: '1sg' },
      {
        id: 'verb',
        role: 'verb',
        verbSlotForm: 'conjugated',
        tense: 'present',
        polarity: 'positive',
        agreesWith: 'subj',
        fixedId: 'give',
      },
      { id: 'recipient', role: 'noun', case: 'allative', number: 'singular', pickFrom: RECIPIENTS },
      { id: 'obj', role: 'noun', case: 'genitive', number: 'singular', fixedId: 'fish' },
    ],
  },
  // t6 — postposition "takana" (behind) governing a genitive complement.
  {
    id: 'cat-behind-animal',
    en: 'The big cat is behind the small {obj}.',
    tier: 6,
    punct: '.',
    tokens: [
      { slot: 'subjAdj' },
      { slot: 'subj' },
      { slot: 'verb' },
      { slot: 'objAdj' },
      { slot: 'obj' },
      { fixed: 'takana' },
    ],
    slots: [
      { id: 'subjAdj', role: 'adjective', pool: 'adjectives', agreesWith: 'subj', fixedId: 'big' },
      { id: 'subj', role: 'noun', case: 'nominative', number: 'singular', fixedId: 'cat' },
      {
        id: 'verb',
        role: 'verb',
        verbSlotForm: 'conjugated',
        tense: 'present',
        polarity: 'positive',
        agreesWith: 'subj',
        fixedId: 'be',
      },
      { id: 'objAdj', role: 'adjective', pool: 'adjectives', agreesWith: 'obj', fixedId: 'small' },
      { id: 'obj', role: 'noun', case: 'genitive', number: 'singular', pickFrom: ANIMALS_NOT_CAT },
    ],
  },
  // t6 — postposition "vieressä" (next to) governing a genitive complement.
  {
    id: 'baby-next-to-animal',
    en: 'The baby sleeps next to the big {obj}.',
    tier: 6,
    punct: '.',
    tokens: [
      { slot: 'subj' },
      { slot: 'verb' },
      { slot: 'objAdj' },
      { slot: 'obj' },
      { fixed: 'vieressä' },
    ],
    slots: [
      { id: 'subj', role: 'noun', case: 'nominative', number: 'singular', fixedId: 'baby' },
      {
        id: 'verb',
        role: 'verb',
        verbSlotForm: 'conjugated',
        tense: 'present',
        polarity: 'positive',
        agreesWith: 'subj',
        fixedId: 'sleep',
      },
      { id: 'objAdj', role: 'adjective', pool: 'adjectives', agreesWith: 'obj', fixedId: 'big' },
      { id: 'obj', role: 'noun', case: 'genitive', number: 'singular', pickFrom: ANIMALS },
    ],
  },
  // t6 — negation forces the object into the partitive ("en näe kissaa").
  {
    id: 'dont-see-animal',
    en: "I don't see the {obj}.",
    tier: 6,
    punct: '.',
    tokens: [{ slot: 'subj' }, { slot: 'verb' }, { slot: 'obj' }],
    slots: [
      { id: 'subj', role: 'pronoun', fixedId: '1sg' },
      {
        id: 'verb',
        role: 'verb',
        verbSlotForm: 'conjugated',
        tense: 'present',
        polarity: 'negative',
        agreesWith: 'subj',
        fixedId: 'see',
      },
      { id: 'obj', role: 'noun', case: 'partitive', number: 'singular', pickFrom: ANIMALS },
    ],
  },
  // t7 — directional motion into a place: the illative ("metsään").
  {
    id: 'fox-runs-into-place',
    en: 'The fox runs into the {obj}.',
    tier: 7,
    punct: '.',
    tokens: [{ slot: 'subj' }, { slot: 'verb' }, { slot: 'obj' }],
    slots: [
      { id: 'subj', role: 'noun', case: 'nominative', number: 'singular', fixedId: 'fox' },
      {
        id: 'verb',
        role: 'verb',
        verbSlotForm: 'conjugated',
        tense: 'present',
        polarity: 'positive',
        agreesWith: 'subj',
        fixedId: 'run',
      },
      { id: 'obj', role: 'noun', case: 'illative', number: 'singular', pickFrom: ENTERABLE },
    ],
  },
];
