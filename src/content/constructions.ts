import type { Construction } from './types';

// Generic carrier phrases usable with any countable noun theme (animals, food,
// family, ...). These are human-authored; each slot's Finnish form is looked
// up from the word's sourced inflection table by the declared case + number
// (no rule-based inflection in code).
//
// Semantic gates (`topics` / `excludeIds`, see suitsSlot) keep every generated
// pairing sensible as well as grammatical — the capstones mix ALL topics into
// ALL constructions, so without gates they'd serve lines like "Minulla on
// taivas" or "Kissa menee äitiin".

// Words nobody (least of all a child) can own or deny owning ("Minulla on
// taivas" is nonsense; flower and stone stay — those fit in a pocket).
const UNOWNABLE = [
  'sun',
  'moon',
  'star',
  'cloud',
  'rain',
  'snow',
  'sky',
  'sea',
  'lake',
  'mountain',
  'school',
];

// Things it makes sense to LIKE/LOVE — everything except body parts
// ("Rakastan polvea", I love the knee, is nobody's flashcard).
const LIKABLE_TOPICS = ['animals', 'food', 'family', 'places', 'nature', 'clothes'];

// Things one WATCHES — living beings and scenery, not food or socks.
const WATCHABLE_TOPICS = ['animals', 'family', 'places', 'nature'];

// Nature words that make no concrete reference point for a postposition
// ("sateen edessä" reads as poetry, not a place).
const NO_LANDMARK = ['rain', 'snow', 'sky', 'sea'];

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
    excludeIds: UNOWNABLE,
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
    excludeIds: UNOWNABLE,
  },
  {
    id: 'she-has',
    before: 'Hänellä on',
    punct: '.',
    en: 'She/He has a ___.',
    tier: 2,
    case: 'nominative',
    number: 'singular',
    excludeIds: UNOWNABLE,
  },
  {
    id: 'we-have',
    before: 'Meillä on',
    punct: '.',
    en: 'We have a ___.',
    tier: 2,
    case: 'nominative',
    number: 'singular',
    excludeIds: UNOWNABLE,
  },
  {
    id: 'they-have',
    before: 'Heillä on',
    punct: '.',
    en: 'They have a ___.',
    tier: 2,
    case: 'nominative',
    number: 'singular',
    excludeIds: UNOWNABLE,
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
    excludeIds: UNOWNABLE,
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
    topics: LIKABLE_TOPICS,
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
    topics: LIKABLE_TOPICS,
  },
  {
    id: 'i-watch', // katsoa always governs the partitive: "Katson kissaa."
    before: 'Katson',
    punct: '.',
    en: 'I watch the ___.',
    tier: 3,
    case: 'partitive',
    number: 'singular',
    topics: WATCHABLE_TOPICS,
    // Furniture/containers from `places` aren't things one watches.
    excludeIds: ['bag', 'basket', 'box', 'chair', 'table', 'bed'],
  },

  // --- Locational postpositions, all governing the genitive (Tier 3) ---
  {
    id: 'in-front-of',
    after: 'edessä',
    en: 'in front of the ___',
    tier: 3,
    case: 'genitive',
    number: 'singular',
    excludeIds: NO_LANDMARK,
  },
  {
    id: 'behind',
    after: 'takana',
    en: 'behind the ___',
    tier: 3,
    case: 'genitive',
    number: 'singular',
    excludeIds: NO_LANDMARK,
  },
  {
    id: 'next-to',
    after: 'vieressä',
    en: 'next to the ___',
    tier: 3,
    case: 'genitive',
    number: 'singular',
    excludeIds: NO_LANDMARK,
  },
  {
    id: 'under',
    after: 'alla',
    en: 'under the ___',
    tier: 3,
    case: 'genitive',
    number: 'singular',
    excludeIds: NO_LANDMARK,
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
    excludeIds: UNOWNABLE,
  },
  {
    id: 'i-havent-any',
    before: 'Minulla ei ole',
    punct: '.',
    en: "I don't have any ___.",
    // Tier 5: negative partitive-plural is the possession node's own top step,
    // one rung above the positive partitive-plural (i-have-some, tier 4).
    tier: 5,
    case: 'partitive',
    number: 'plural',
    excludeIds: UNOWNABLE,
  },

  // --- Plural predicatives (Tier 5) — the "many things" mirror of this-is/
  // where-is: an indefinite plural predicative takes the PARTITIVE plural
  // ("Nämä ovat kissoja"); a definite plural subject stays NOMINATIVE plural
  // ("Missä ovat kissat?"). Both stretch the capstones' top levels.
  {
    id: 'these-are',
    before: 'Nämä ovat',
    punct: '.',
    en: 'These are ___s.',
    tier: 5,
    case: 'partitive',
    number: 'plural',
  },
  {
    id: 'where-are',
    before: 'Missä ovat',
    punct: '?',
    en: 'Where are the ___s?',
    tier: 5,
    case: 'nominative',
    number: 'plural',
  },

  // --- More verb rection at the top (Tier 6) ---
  {
    id: 'i-buy', // total object = genitive: "Ostan omenan."
    before: 'Ostan',
    punct: '.',
    en: 'I buy the ___.',
    tier: 6,
    case: 'genitive',
    number: 'singular',
    topics: ['animals', 'food', 'clothes'],
    // Mass nouns take the partitive when bought ("Ostan maitoa"), so keep them
    // out of this genitive total-object frame.
    excludeIds: ['water', 'milk', 'juice', 'chocolate'],
  },
  {
    id: 'i-wait-for', // odottaa always governs the partitive: "Odotan äitiä."
    before: 'Odotan',
    punct: '.',
    en: 'I wait for the ___.',
    tier: 6,
    case: 'partitive',
    number: 'singular',
    topics: ['animals', 'family'],
  },

  // --- Locative cases: WHERE things are (the `places` pool, "where" chapter).
  // Six "where" cases form a graded ladder (one new case per tier, t2→t7),
  // ending in a plural apex (t8). Each carrier verb MATCHES the case so every
  // sentence is correct Finnish: olla "be" for static in/on; mennä "go" for
  // the goal cases (into/onto); tulla "come" for the source cases (out-of/off).
  // The place noun is the slot; its form is looked up from the sourced
  // locative paradigm — never generated. See docs/FINNISH_GRAMMAR.md.
  {
    id: 'on-it', // adessive: on a surface — "Kissa on pöydällä."
    before: 'Kissa on',
    punct: '.',
    en: 'The cat is on the ___.',
    tier: 2,
    case: 'adessive',
    number: 'singular',
    topics: ['places'],
  },
  {
    id: 'in-it', // inessive: inside — "Kissa on laatikossa."
    before: 'Kissa on',
    punct: '.',
    en: 'The cat is in the ___.',
    tier: 3,
    case: 'inessive',
    number: 'singular',
    topics: ['places'],
  },
  {
    id: 'into-it', // illative: motion into — "Kissa menee laatikkoon."
    before: 'Kissa menee',
    punct: '.',
    en: 'The cat goes into the ___.',
    tier: 4,
    case: 'illative',
    number: 'singular',
    topics: ['places'],
  },
  {
    id: 'onto-it', // allative: motion onto — "Kissa menee pöydälle."
    before: 'Kissa menee',
    punct: '.',
    en: 'The cat goes onto the ___.',
    tier: 5,
    case: 'allative',
    number: 'singular',
    topics: ['places'],
  },
  {
    id: 'out-of-it', // elative: motion out of — "Kissa tulee laatikosta."
    before: 'Kissa tulee',
    punct: '.',
    en: 'The cat comes out of the ___.',
    tier: 6,
    case: 'elative',
    number: 'singular',
    topics: ['places'],
  },
  {
    id: 'off-it', // ablative: motion off a surface — "Kissa tulee pöydältä."
    before: 'Kissa tulee',
    punct: '.',
    en: 'The cat comes off the ___.',
    tier: 7,
    case: 'ablative',
    number: 'singular',
    topics: ['places'],
  },
  {
    id: 'in-them', // inessive PLURAL apex — "Kissat ovat laatikoissa."
    before: 'Kissat ovat',
    punct: '.',
    en: 'The cats are in the ___.',
    tier: 8,
    case: 'inessive',
    number: 'plural',
    topics: ['places'],
  },
];
