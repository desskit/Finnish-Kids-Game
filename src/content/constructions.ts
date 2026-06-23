import type { Construction } from './types';

// Generic carrier phrases usable with any countable noun theme (animals, food,
// family, ...). These are human-authored; each slot's Finnish form is looked
// up from the word's sourced inflection table by the declared case + number
// (no rule-based inflection in code).
export const nounConstructions: Construction[] = [
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

  // --- Possession by other persons (Tier 2, nominative singular) — see
  // docs/FINNISH_GRAMMAR.md "Possession". Same case/number as i-have; only the
  // adessive possessor pronoun (fixed carrier text) varies. ---
  {
    id: 'you-have',
    before: 'Sinulla on',
    punct: '.',
    en: 'You have a ___.',
    tier: 2,
    case: 'nominative',
    number: 'singular',
  },
  {
    id: 'she-has',
    before: 'Hänellä on',
    punct: '.',
    en: 'She/He has a ___.',
    tier: 2,
    case: 'nominative',
    number: 'singular',
  },
  {
    id: 'we-have',
    before: 'Meillä on',
    punct: '.',
    en: 'We have a ___.',
    tier: 2,
    case: 'nominative',
    number: 'singular',
  },
  {
    id: 'they-have',
    before: 'Heillä on',
    punct: '.',
    en: 'They have a ___.',
    tier: 2,
    case: 'nominative',
    number: 'singular',
  },

  // --- Negated possession → partitive singular (Tier 3) — negation always
  // forces the partitive on the thing whose existence is denied. ---
  {
    id: 'i-havent',
    before: 'Minulla ei ole',
    punct: '.',
    en: "I don't have a ___.",
    tier: 3,
    case: 'partitive',
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
  {
    id: 'i-love', // rakastaa always governs the partitive: "Rakastan kissaa."
    before: 'Rakastan',
    punct: '.',
    en: 'I love the ___.',
    tier: 3,
    case: 'partitive',
    number: 'singular',
  },
  {
    id: 'i-watch', // katsoa always governs the partitive: "Katson kissaa."
    before: 'Katson',
    punct: '.',
    en: 'I watch the ___.',
    tier: 3,
    case: 'partitive',
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

  // --- Apex: indefinite quantity → partitive plural (Tier 4) — see
  // docs/FINNISH_GRAMMAR.md "Possession" + "partitive plural" rule. ---
  {
    id: 'i-have-some',
    before: 'Minulla on',
    punct: '.',
    en: 'I have some ___.',
    tier: 4,
    case: 'partitive',
    number: 'plural',
  },
  {
    id: 'i-havent-any',
    before: 'Minulla ei ole',
    punct: '.',
    en: "I don't have any ___.",
    tier: 4,
    case: 'partitive',
    number: 'plural',
  },
];
