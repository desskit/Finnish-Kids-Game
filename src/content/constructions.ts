import type { Construction } from "./types";
import { SURFACE_TAG, CONTAINER_TAG } from "./semantics";

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
  "sun",
  "moon",
  "star",
  "cloud",
  "rain",
  "snow",
  "sky",
  "sea",
  "lake",
  "mountain",
  "school",
  // Course vocabulary: things you go to / listen to, not things you own.
  "class",
  "music",
  "library",
  "shop",
  "bus",
  "train",
  "park",
  "hospital",
  "station",
  "museum",
  "restaurant",
  "cafe",
  "city",
  "market",
  "zoo",
  "field",
  "living-room",
  "bedroom",
  "bathroom",
  "yard",
  // School subjects are taken, not owned.
  "math",
  "gym",
  "english",
  "canteen",
];

// Things it makes sense to LIKE/LOVE — everything except body parts
// ("Rakastan polvea", I love the knee, is nobody's flashcard).
const LIKABLE_TOPICS = [
  "animals",
  "food",
  "family",
  "places",
  "nature",
  "clothes",
  "school",
  "freetime",
];

// Things one WATCHES — living beings and scenery, not food or socks; plus a
// movie, a game, a picture, a football match.
const WATCHABLE_TOPICS = [
  "animals",
  "family",
  "places",
  "nature",
  "school",
  "freetime",
];

// Things you can't SEE or WATCH as an object ("Näen musiikin" is wrong — you
// hear music; a hobby is an activity, not a thing in view).
const NOT_VISIBLE = ["music", "hobby", "math", "gym", "english", "task"];

// Nature words that make no concrete reference point for a postposition
// ("sateen edessä" reads as poetry, not a place).
const NO_LANDMARK = [
  "rain",
  "snow",
  "sky",
  "sea",
  "music",
  "hobby",
  "class",
  "homework",
  "city",
  "math",
  "gym",
  "english",
  "task",
  "test",
];

// The feelings the "Olen ___" carriers describe (all animate-only adjectives).
const FEELINGS = [
  "happy",
  "tired",
  "hungry",
  "sad",
  "angry",
  "thirsty",
  "sick",
  "calm",
  "proud",
];

// Weekdays (essive "maanantaina") vs. parts of the day + seasons (adessive
// "aamulla", "kesällä") — Finnish's two "when" endings.
const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const TIMES_OF = [
  "morning",
  "daytime",
  "evening",
  "night",
  "spring",
  "summer",
  "autumn",
  "winter",
];

// Where a person is ON/AT, with the English preposition each one takes.
const SCHOOL_GLOSS: Record<string, string> = { school: "school" };

const PERSON_ON_GLOSS: Record<string, string> = {
  station: "at the station",
  market: "at the market",
  field: "on the field",
  yard: "in the yard",
  sofa: "on the sofa",
  door: "at the door",
  window: "at the window",
};

// Verbs that read naturally after each "verb + verb" carrier.
const WANT_TO = [
  "play",
  "eat",
  "drink",
  "sleep",
  "swim",
  "run",
  "jump",
  "read",
  "draw",
  "sing",
  "dance",
  "paint",
  "cook",
  "build",
  "climb",
  "go",
  "come",
  "help",
  "walk",
];
const DONT_WANT_TO = [
  "sleep",
  "eat",
  "go",
  "wash",
  "clean",
  "wait",
  "read",
  "write",
  "wake-up",
  "walk",
];
const CAN_DO_VERBS = [
  "swim",
  "read",
  "write",
  "draw",
  "sing",
  "dance",
  "run",
  "jump",
  "climb",
  "cook",
  "paint",
  "build",
  "fix",
  "speak",
];
const MAY_I = [
  "play",
  "eat",
  "drink",
  "go",
  "come",
  "help",
  "read",
  "draw",
  "look",
  "sing",
  "swim",
];

export const nounConstructions: Construction[] = [
  // --- Nominative subject/complement (Tier 2) ---
  {
    id: "this-is",
    before: "Tämä on",
    punct: ".",
    en: "This is a ___.",
    tier: 2,
    case: "nominative",
    number: "singular",
  },
  {
    id: "where-is",
    before: "Missä on",
    punct: "?",
    en: "Where is the ___?",
    tier: 2,
    case: "nominative",
    number: "singular",
  },
  {
    // The -ko yes/no question form of this-is: "Onko tämä kissa?" — the child's
    // first interrogative. Drilled by the Onko tämä…? node (YesNoGame) and, like
    // every carrier, playable in the mixed comprehension/capstone games.
    // ⚠️ NEEDS NATIVE FINNISH VETTING (new authored carrier text).
    id: "is-this",
    before: "Onko tämä",
    punct: "?",
    en: "Is this a ___?",
    tier: 2,
    case: "nominative",
    number: "singular",
  },
  {
    id: "i-have",
    before: "Minulla on",
    punct: ".",
    en: "I have a ___.",
    tier: 2,
    case: "nominative",
    number: "singular",
    excludeIds: UNOWNABLE,
  },

  // --- Possession by other persons (Tier 2, nominative singular) — see
  // docs/FINNISH_GRAMMAR.md "Possession". Same case/number as i-have; only the
  // adessive possessor pronoun (fixed carrier text) varies. ---
  {
    id: "you-have",
    before: "Sinulla on",
    punct: ".",
    en: "You have a ___.",
    tier: 2,
    case: "nominative",
    number: "singular",
    excludeIds: UNOWNABLE,
  },
  {
    id: "she-has",
    before: "Hänellä on",
    punct: ".",
    en: "She/He has a ___.",
    tier: 2,
    case: "nominative",
    number: "singular",
    excludeIds: UNOWNABLE,
  },
  {
    id: "we-have",
    before: "Meillä on",
    punct: ".",
    en: "We have a ___.",
    tier: 2,
    case: "nominative",
    number: "singular",
    excludeIds: UNOWNABLE,
  },
  {
    id: "they-have",
    before: "Heillä on",
    punct: ".",
    en: "They have a ___.",
    tier: 2,
    case: "nominative",
    number: "singular",
    excludeIds: UNOWNABLE,
  },

  // --- Negated possession → partitive singular (Tier 3) — negation always
  // forces the partitive on the thing whose existence is denied. ---
  {
    id: "i-havent",
    before: "Minulla ei ole",
    punct: ".",
    en: "I don't have a ___.",
    tier: 3,
    case: "partitive",
    number: "singular",
    excludeIds: UNOWNABLE,
  },

  // --- Verb rection: real cases unlocked by the tagged data (Tier 3) ---
  {
    id: "i-like", // pitää + elative: "Pidän kissasta."
    before: "Pidän",
    punct: ".",
    en: "I like the ___.",
    tier: 3,
    case: "elative",
    number: "singular",
    topics: LIKABLE_TOPICS,
  },
  {
    id: "i-see", // total object = genitive (accusative) singular: "Näen kissan."
    before: "Näen",
    punct: ".",
    en: "I see the ___.",
    tier: 3,
    case: "genitive",
    number: "singular",
    excludeIds: NOT_VISIBLE,
  },
  {
    id: "i-love", // rakastaa always governs the partitive: "Rakastan kissaa."
    before: "Rakastan",
    punct: ".",
    en: "I love the ___.",
    tier: 3,
    case: "partitive",
    number: "singular",
    topics: LIKABLE_TOPICS,
  },
  {
    id: "i-watch", // katsoa always governs the partitive: "Katson kissaa."
    before: "Katson",
    punct: ".",
    en: "I watch the ___.",
    tier: 3,
    case: "partitive",
    number: "singular",
    topics: WATCHABLE_TOPICS,
    // Furniture/containers from `places` aren't things one watches; nor are
    // school supplies or invisible things.
    excludeIds: [
      "bag",
      "basket",
      "box",
      "chair",
      "table",
      "bed",
      "pencil",
      "paper",
      "backpack",
      "homework",
      "class",
      "sofa",
      "test",
      "eraser",
      ...NOT_VISIBLE,
    ],
  },

  // --- Locational postpositions, all governing the genitive (Tier 3) ---
  {
    id: "in-front-of",
    after: "edessä",
    en: "in front of the ___",
    tier: 3,
    case: "genitive",
    number: "singular",
    excludeIds: NO_LANDMARK,
  },
  {
    id: "behind",
    after: "takana",
    en: "behind the ___",
    tier: 3,
    case: "genitive",
    number: "singular",
    excludeIds: NO_LANDMARK,
  },
  {
    id: "next-to",
    after: "vieressä",
    en: "next to the ___",
    tier: 3,
    case: "genitive",
    number: "singular",
    excludeIds: NO_LANDMARK,
  },
  {
    id: "under",
    after: "alla",
    en: "under the ___",
    tier: 3,
    case: "genitive",
    number: "singular",
    excludeIds: NO_LANDMARK,
  },

  // --- The same postpositions over the GENITIVE PLURAL ("kissojen takana") —
  // tier 6, the postpositions node's own top rung. The postposition word is
  // identical to the vetted singular carrier; only the slot's sourced case
  // changes, so no new Finnish is authored here.
  {
    id: "in-front-of-them",
    after: "edessä",
    en: "in front of the ___s",
    tier: 6,
    case: "genitive",
    number: "plural",
    excludeIds: NO_LANDMARK,
  },
  {
    id: "behind-them",
    after: "takana",
    en: "behind the ___s",
    tier: 6,
    case: "genitive",
    number: "plural",
    excludeIds: NO_LANDMARK,
  },
  {
    id: "next-to-them",
    after: "vieressä",
    en: "next to the ___s",
    tier: 6,
    case: "genitive",
    number: "plural",
    excludeIds: NO_LANDMARK,
  },
  {
    id: "under-them",
    after: "alla",
    en: "under the ___s",
    tier: 6,
    case: "genitive",
    number: "plural",
    excludeIds: NO_LANDMARK,
  },

  // --- Postpositions in a whole sentence (the "Around things" unit): the same
  // genitive + position word, but inside the vetted "Kissa on …" frame the
  // locative carriers use, so it reads as a sentence, not a phrase. The cat
  // can't be in front of itself, so 'cat' is excluded.
  // ⚠️ NEEDS NATIVE FINNISH VETTING (fixed texts).
  {
    id: "is-under",
    before: "Kissa on",
    after: "alla",
    punct: ".",
    en: "The cat is under the ___.",
    tier: 3,
    case: "genitive",
    number: "singular",
    excludeIds: [...NO_LANDMARK, "cat"],
  },
  {
    id: "is-behind",
    before: "Kissa on",
    after: "takana",
    punct: ".",
    en: "The cat is behind the ___.",
    tier: 3,
    case: "genitive",
    number: "singular",
    excludeIds: [...NO_LANDMARK, "cat"],
  },
  {
    id: "is-in-front-of",
    before: "Kissa on",
    after: "edessä",
    punct: ".",
    en: "The cat is in front of the ___.",
    tier: 3,
    case: "genitive",
    number: "singular",
    excludeIds: [...NO_LANDMARK, "cat"],
  },
  {
    id: "is-next-to",
    before: "Kissa on",
    after: "vieressä",
    punct: ".",
    en: "The cat is next to the ___.",
    tier: 3,
    case: "genitive",
    number: "singular",
    excludeIds: [...NO_LANDMARK, "cat"],
  },

  // --- Possessive carriers (the "Whose?" unit): the slot takes the sourced
  // POSSESSIVE form — "Tämä on minun kirjani." Pronoun + suffix together is the
  // everyday pattern; the suffix is the part under test.
  // ⚠️ NEEDS NATIVE FINNISH VETTING (fixed texts).
  {
    id: "this-is-mine",
    before: "Tämä on minun",
    punct: ".",
    en: "This is my ___.",
    tier: 4,
    case: "nominative",
    number: "singular",
    possessor: "1sg",
    excludeIds: UNOWNABLE,
  },
  {
    id: "this-is-yours",
    before: "Tämä on sinun",
    punct: ".",
    en: "This is your ___.",
    tier: 4,
    case: "nominative",
    number: "singular",
    possessor: "2sg",
    excludeIds: UNOWNABLE,
  },
  {
    id: "this-is-theirs",
    before: "Tämä on hänen",
    punct: ".",
    en: "This is his/her ___.",
    tier: 4,
    case: "nominative",
    number: "singular",
    possessor: "3rd",
    excludeIds: UNOWNABLE,
  },
  {
    id: "where-is-yours",
    before: "Missä on sinun",
    punct: "?",
    en: "Where is your ___?",
    tier: 4,
    case: "nominative",
    number: "singular",
    possessor: "2sg",
    excludeIds: UNOWNABLE,
  },

  // --- Apex: indefinite quantity → partitive plural (Tier 4) — see
  // docs/FINNISH_GRAMMAR.md "Possession" + "partitive plural" rule. ---
  {
    id: "i-have-some",
    before: "Minulla on",
    punct: ".",
    en: "I have some ___s.",
    tier: 4,
    case: "partitive",
    number: "plural",
    excludeIds: UNOWNABLE,
  },
  {
    id: "i-havent-any",
    before: "Minulla ei ole",
    punct: ".",
    en: "I don't have any ___s.",
    // Tier 5: negative partitive-plural is the possession node's own top step,
    // one rung above the positive partitive-plural (i-have-some, tier 4).
    tier: 5,
    case: "partitive",
    number: "plural",
    excludeIds: UNOWNABLE,
  },

  // --- Plural predicatives (Tier 5) — the "many things" mirror of this-is/
  // where-is: an indefinite plural predicative takes the PARTITIVE plural
  // ("Nämä ovat kissoja"); a definite plural subject stays NOMINATIVE plural
  // ("Missä ovat kissat?"). Both stretch the capstones' top levels.
  {
    id: "these-are",
    before: "Nämä ovat",
    punct: ".",
    en: "These are ___s.",
    tier: 5,
    case: "partitive",
    number: "plural",
  },
  {
    id: "where-are",
    before: "Missä ovat",
    punct: "?",
    en: "Where are the ___s?",
    tier: 5,
    case: "nominative",
    number: "plural",
  },

  // --- More verb rection at the top (Tier 6) ---
  {
    id: "i-buy", // total object = genitive: "Ostan omenan."
    before: "Ostan",
    punct: ".",
    en: "I buy a ___.",
    tier: 6,
    case: "genitive",
    number: "singular",
    topics: ["animals", "food", "clothes", "school", "freetime"],
    // Mass nouns take the partitive when bought ("Ostan maitoa"), so keep them
    // out of this genitive total-object frame — they get their own carrier
    // below (i-buy-some), making the pair the Shopping node's real lesson.
    // People, homework, music and hobbies aren't bought.
    excludeIds: [
      "water",
      "milk",
      "juice",
      "chocolate",
      "teacher",
      "friend",
      "homework",
      "class",
      "music",
      "hobby",
      "math",
      "gym",
      "english",
      "pupil",
      "test",
      "task",
      "canteen",
    ],
  },
  {
    // The partitive half of the buying contrast: a mass/divisible thing bought
    // in some quantity takes the PARTITIVE ("Ostan maitoa" — I buy some milk),
    // where a whole countable thing takes the genitive (i-buy above). Same
    // already-vetted carrier text "Ostan"; only the case + the curated
    // mass-noun allow-list are new. See docs/FINNISH_GRAMMAR.md (partitive).
    id: "i-buy-some",
    before: "Ostan",
    punct: ".",
    en: "I buy some ___.",
    tier: 6,
    case: "partitive",
    number: "singular",
    topics: ["food"],
    // Divisible foods a child buys "some of" — a hand-curated allow-list, since
    // the sensible set is these specific words, not a whole topic.
    onlyIds: [
      "water",
      "milk",
      "juice",
      "chocolate",
      "bread",
      "cheese",
      "rice",
      "ice-cream",
      "candy",
      "butter",
    ],
  },
  {
    id: "i-wait-for", // odottaa always governs the partitive: "Odotan äitiä."
    before: "Odotan",
    punct: ".",
    en: "I wait for the ___.",
    tier: 6,
    case: "partitive",
    number: "singular",
    // People, pets and rides: "Odotan opettajaa / bussia". Every other place
    // and school thing is filtered out (nobody waits for a pencil).
    topics: ["animals", "family", "school", "places"],
    excludeIds: [
      "box",
      "table",
      "house",
      "room",
      "car",
      "bed",
      "chair",
      "school",
      "tree",
      "forest",
      "basket",
      "bag",
      "window",
      "door",
      "kitchen",
      "garden",
      "shop",
      "library",
      "book",
      "pencil",
      "backpack",
      "paper",
      "picture",
      "clock",
      "homework",
      "class",
      "park",
      "hospital",
      "station",
      "museum",
      "restaurant",
      "cafe",
      "city",
      "market",
      "zoo",
      "field",
      "living-room",
      "bedroom",
      "bathroom",
      "sofa",
      "yard",
      "math",
      "gym",
      "english",
      "eraser",
      "task",
      "canteen",
      "test",
    ],
  },

  // --- Locative cases: WHERE things are (the `places` pool, "where" chapter).
  // Six "where" cases form a graded ladder (one new case per tier, t2→t7),
  // ending in a plural apex (t8). Each carrier verb MATCHES the case so every
  // sentence is correct Finnish: olla "be" for static in/on; mennä "go" for
  // the goal cases (into/onto); tulla "come" for the source cases (out-of/off).
  // The place noun is the slot; its form is looked up from the sourced
  // locative paradigm — never generated. See docs/FINNISH_GRAMMAR.md.
  {
    id: "on-it", // adessive: on a surface — "Kissa on pöydällä."
    before: "Kissa on",
    punct: ".",
    en: "The cat is on the ___.",
    tier: 2,
    case: "adessive",
    number: "singular",
    topics: ["places"],
    // Surface case: only places tagged a surface you can sit ON (a table, a
    // car roof) — never "on the room".
    requiresTags: [SURFACE_TAG],
  },
  {
    id: "in-it", // inessive: inside — "Kissa on laatikossa."
    before: "Kissa on",
    punct: ".",
    en: "The cat is in the ___.",
    tier: 3,
    case: "inessive",
    number: "singular",
    topics: ["places"],
    // Container case: only places tagged something you can be IN — not a flat
    // table or chair.
    requiresTags: [CONTAINER_TAG],
  },
  {
    id: "into-it", // illative: motion into — "Kissa menee laatikkoon."
    before: "Kissa menee",
    punct: ".",
    en: "The cat goes into the ___.",
    tier: 4,
    case: "illative",
    number: "singular",
    topics: ["places"],
    requiresTags: [CONTAINER_TAG],
  },
  {
    id: "onto-it", // allative: motion onto — "Kissa menee pöydälle."
    before: "Kissa menee",
    punct: ".",
    en: "The cat goes onto the ___.",
    tier: 5,
    case: "allative",
    number: "singular",
    topics: ["places"],
    requiresTags: [SURFACE_TAG],
  },
  {
    id: "out-of-it", // elative: motion out of — "Kissa tulee laatikosta."
    before: "Kissa tulee",
    punct: ".",
    en: "The cat comes out of the ___.",
    tier: 6,
    case: "elative",
    number: "singular",
    topics: ["places"],
    requiresTags: [CONTAINER_TAG],
  },
  {
    id: "off-it", // ablative: motion off a surface — "Kissa tulee pöydältä."
    before: "Kissa tulee",
    punct: ".",
    en: "The cat comes off the ___.",
    tier: 7,
    case: "ablative",
    number: "singular",
    topics: ["places"],
    requiresTags: [SURFACE_TAG],
  },
  {
    id: "in-them", // inessive PLURAL apex — "Kissat ovat laatikoissa."
    before: "Kissat ovat",
    punct: ".",
    en: "The cats are in the ___s.",
    tier: 8,
    case: "inessive",
    number: "plural",
    topics: ["places"],
    requiresTags: [CONTAINER_TAG],
  },

  // --- Expert band (Tiers 9-10): the PLURAL locative system. The same
  // carrier pattern as the singular ladder above, with plural subjects and
  // sourced plural case forms ("pöydillä", "laatikoista"). Carrier verbs
  // (ovat / menevät / tulevat) are authored fixed text.
  // ⚠️ NEEDS NATIVE FINNISH VETTING (the carrier texts below).
  {
    id: "on-them", // adessive plural — "Kissat ovat pöydillä."
    before: "Kissat ovat",
    punct: ".",
    en: "The cats are on the ___s.",
    tier: 9,
    case: "adessive",
    number: "plural",
    topics: ["places"],
    requiresTags: [SURFACE_TAG],
  },
  {
    id: "onto-them", // allative plural — "Kissat menevät pöydille."
    before: "Kissat menevät",
    punct: ".",
    en: "The cats go onto the ___s.",
    tier: 9,
    case: "allative",
    number: "plural",
    topics: ["places"],
    requiresTags: [SURFACE_TAG],
  },
  {
    id: "out-of-them", // elative plural — "Kissat tulevat laatikoista."
    before: "Kissat tulevat",
    punct: ".",
    en: "The cats come out of the ___s.",
    tier: 10,
    case: "elative",
    number: "plural",
    topics: ["places"],
    requiresTags: [CONTAINER_TAG],
  },
  {
    id: "off-them", // ablative plural — "Kissat tulevat pöydiltä."
    before: "Kissat tulevat",
    punct: ".",
    en: "The cats come off the ___s.",
    tier: 10,
    case: "ablative",
    number: "plural",
    topics: ["places"],
    requiresTags: [SURFACE_TAG],
  },

  // =====================================================================
  // Course expansion carriers (Feelings / School day / Town & home / When?).
  // Fixed texts are short, everyday Finnish; every slot form is still looked
  // up. ⚠️ NEEDS NATIVE FINNISH VETTING (fixed texts below).
  // =====================================================================

  // --- Feelings: olla + a feeling (predicate adjective, nominative) ---
  {
    id: "i-am",
    before: "Olen",
    punct: ".",
    en: "I'm ___.",
    tier: 2,
    case: "nominative",
    number: "singular",
    onlyIds: FEELINGS,
  },
  {
    id: "she-is",
    before: "Hän on",
    punct: ".",
    en: "He/she is ___.",
    tier: 2,
    case: "nominative",
    number: "singular",
    onlyIds: FEELINGS,
  },
  {
    // A predicate adjective stays nominative under negation ("En ole
    // väsynyt") — unlike the partitive of "Minulla ei ole kissaa".
    id: "i-am-not",
    before: "En ole",
    punct: ".",
    en: "I'm not ___.",
    tier: 3,
    case: "nominative",
    number: "singular",
    onlyIds: FEELINGS,
  },
  {
    // "Minulla on nälkä" — literally "on me is hunger": how Finnish says I'm
    // hungry / thirsty / cold / hot. glossById keeps the English natural.
    id: "i-feel",
    before: "Minulla on",
    punct: ".",
    en: "I'm ___.",
    tier: 3,
    case: "nominative",
    number: "singular",
    onlyIds: ["hunger", "thirst", "cold", "hot"],
    glossById: {
      hunger: "hungry",
      thirst: "thirsty",
      cold: "cold",
      hot: "hot",
    },
  },

  // --- School day: the negative of pitää still takes the elative ---
  {
    id: "i-dont-like",
    before: "En pidä",
    punct: ".",
    en: "I don't like the ___.",
    tier: 3,
    case: "elative",
    number: "singular",
    topics: LIKABLE_TOPICS,
  },

  // --- Town & home: YOU are / go / come (person-subject locatives) ---
  {
    id: "i-am-in",
    before: "Olen",
    punct: ".",
    en: "I'm in the ___.",
    tier: 3,
    case: "inessive",
    number: "singular",
    topics: ["places"],
    requiresTags: ["person-in"],
  },
  {
    id: "i-am-on",
    before: "Olen",
    punct: ".",
    en: "I'm ___.",
    tier: 3,
    case: "adessive",
    number: "singular",
    topics: ["places"],
    requiresTags: ["person-on"],
    glossById: PERSON_ON_GLOSS,
  },
  {
    id: "i-go-into",
    before: "Menen",
    punct: ".",
    en: "I'm going to the ___.",
    tier: 4,
    case: "illative",
    number: "singular",
    topics: ["places"],
    requiresTags: ["person-in"],
    // English says "to school" / "from school", with no "the".
    glossById: SCHOOL_GLOSS,
  },
  {
    id: "i-go-onto",
    before: "Menen",
    punct: ".",
    en: "I'm going to the ___.",
    tier: 4,
    case: "allative",
    number: "singular",
    topics: ["places"],
    requiresTags: ["person-on"],
  },
  {
    id: "i-come-from-in",
    before: "Tulen",
    punct: ".",
    en: "I'm coming from the ___.",
    tier: 4,
    case: "elative",
    number: "singular",
    topics: ["places"],
    requiresTags: ["person-in"],
    // English says "to school" / "from school", with no "the".
    glossById: SCHOOL_GLOSS,
  },
  {
    id: "i-come-from-on",
    before: "Tulen",
    punct: ".",
    en: "I'm coming from the ___.",
    tier: 4,
    case: "ablative",
    number: "singular",
    topics: ["places"],
    requiresTags: ["person-on"],
  },

  // --- When? ---
  {
    id: "today-is",
    before: "Tänään on",
    punct: ".",
    en: "Today is ___.",
    tier: 2,
    case: "nominative",
    number: "singular",
    topics: ["time"],
    onlyIds: DAYS,
  },
  {
    // Days (and the weekend) take the ESSIVE: "maanantaina" = on Monday.
    id: "play-on-day",
    before: "Leikin",
    punct: ".",
    en: "I play on ___.",
    tier: 3,
    case: "essive",
    number: "singular",
    topics: ["time"],
    onlyIds: [...DAYS, "weekend"],
    glossById: { weekend: "the weekend" },
  },
  {
    // Parts of the day and seasons take the ADESSIVE: "aamulla", "kesällä".
    id: "play-at-time",
    before: "Leikin",
    punct: ".",
    en: "I play ___.",
    tier: 3,
    case: "adessive",
    number: "singular",
    topics: ["time"],
    onlyIds: TIMES_OF,
    glossById: {
      morning: "in the morning",
      daytime: "in the daytime",
      evening: "in the evening",
      night: "at night",
      spring: "in spring",
      summer: "in summer",
      autumn: "in autumn",
      winter: "in winter",
    },
  },
  {
    // Telling the time: the hour is just the number word, nominative.
    id: "clock-is",
    before: "Kello on",
    punct: ".",
    en: "It's ___ o'clock.",
    tier: 3,
    case: "nominative",
    number: "singular",
    topics: ["numbers"],
    onlyIds: [
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
    ],
  },

  // --- Verb + verb: "I want to / don't want to / can / may I…?" -------------
  // The slot is a VERB in its dictionary form (the sourced infinitive itself:
  // "leikkiä", "uida"); the first verb carries the person. "Haluan" (haluta),
  // "Osaan" (osata) and "En halua" are checked against the sourced tables in
  // content.test.ts; "Saanko" is saan + the question ending -ko (authored).
  // ⚠️ NEEDS NATIVE FINNISH VETTING (the four carriers below).
  {
    id: "i-want-to",
    before: "Haluan",
    punct: ".",
    en: "I want to ___.",
    tier: 3,
    case: "nominative",
    number: "singular",
    verb: "infinitive",
    topics: ["verbs"],
    onlyIds: WANT_TO,
  },
  {
    id: "i-dont-want-to",
    before: "En halua",
    punct: ".",
    en: "I don't want to ___.",
    tier: 3,
    case: "nominative",
    number: "singular",
    verb: "infinitive",
    topics: ["verbs"],
    onlyIds: DONT_WANT_TO,
  },
  {
    // osata = to know HOW to (a skill you have learned).
    id: "i-can",
    before: "Osaan",
    punct: ".",
    en: "I can ___.",
    tier: 3,
    case: "nominative",
    number: "singular",
    verb: "infinitive",
    topics: ["verbs"],
    onlyIds: CAN_DO_VERBS,
  },
  {
    id: "may-i",
    before: "Saanko",
    punct: "?",
    en: "May I ___?",
    tier: 3,
    case: "nominative",
    number: "singular",
    verb: "infinitive",
    topics: ["verbs"],
    onlyIds: MAY_I,
  },
];
