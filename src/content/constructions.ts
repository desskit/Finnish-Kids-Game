import type { Construction } from './types';

// Carrier phrases for the Animals theme. These are human-authored; each slot's
// Finnish form is looked up from the word's sourced inflection table by the
// declared case + number (no rule-based inflection in code).
export const animalConstructions: Construction[] = [
  // --- Nominative subject/complement (Tier 2) ---
  {
    id: 'this-is',
    before: 'Tämä on',
    punct: '.',
    en: 'This is a ___.',
    tier: 2,
    case: 'nominative',
    number: 'singular',
  },
  {
    id: 'where-is',
    before: 'Missä on',
    punct: '?',
    en: 'Where is the ___?',
    tier: 2,
    case: 'nominative',
    number: 'singular',
  },
  {
    id: 'i-have',
    before: 'Minulla on',
    punct: '.',
    en: 'I have a ___.',
    tier: 2,
    case: 'nominative',
    number: 'singular',
  },

  // --- Verb rection: real cases unlocked by the tagged data (Tier 3) ---
  {
    id: 'i-like', // pitää + elative: "Pidän kissasta."
    before: 'Pidän',
    punct: '.',
    en: 'I like the ___.',
    tier: 3,
    case: 'elative',
    number: 'singular',
  },
  {
    id: 'i-see', // total object = genitive (accusative) singular: "Näen kissan."
    before: 'Näen',
    punct: '.',
    en: 'I see the ___.',
    tier: 3,
    case: 'genitive',
    number: 'singular',
  },

  // --- Locational postpositions, all governing the genitive (Tier 3) ---
  {
    id: 'in-front-of',
    after: 'edessä',
    en: 'in front of the ___',
    tier: 3,
    case: 'genitive',
    number: 'singular',
  },
  {
    id: 'behind',
    after: 'takana',
    en: 'behind the ___',
    tier: 3,
    case: 'genitive',
    number: 'singular',
  },
  {
    id: 'next-to',
    after: 'vieressä',
    en: 'next to the ___',
    tier: 3,
    case: 'genitive',
    number: 'singular',
  },
  {
    id: 'under',
    after: 'alla',
    en: 'under the ___',
    tier: 3,
    case: 'genitive',
    number: 'singular',
  },
];
