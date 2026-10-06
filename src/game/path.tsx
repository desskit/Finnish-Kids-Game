import type { ReactElement } from 'react';
import type { Construction, LexicalItem } from '../content/types';
import {
  animals,
  food,
  family,
  numbers,
  places,
  body,
  nature,
  clothes,
  adjectives,
  verbs,
} from '../content';
import { nounConstructions } from '../content/constructions';
import { sentenceConstructions } from '../content/sentences';
import {
  buildCommandRound,
  buildSentenceRound,
  buildSentenceSpellingRound,
  type SentencePools,
} from './round';
import type { Child } from '../state/storage';
import ListenAndTap from '../components/ListenAndTap';
import NameIt from '../components/NameIt';
import ListenSentence from '../components/ListenSentence';
import SayIt from '../components/SayIt';
import BuildAPhrase from '../components/BuildAPhrase';
import CountAndSay from '../components/CountAndSay';
import MatchTheWord from '../components/MatchTheWord';
import ConjugateVerb from '../components/ConjugateVerb';
import WordOrder from '../components/WordOrder';
import SpellWord from '../components/SpellWord';
import DialogueGame from '../components/DialogueGame';
import ConversationScene from '../components/ConversationScene';
import YesNoGame from '../components/YesNoGame';
import StoryTime from '../components/StoryTime';
import PossessiveGame from '../components/PossessiveGame';
import FindError from '../components/FindError';
import { speakableTargetsFor } from './speakable';
import ReadAndListen from '../components/ReadAndListen';

// The learning PATH — the single source of truth for the journey-map home.
//
// We organize by *usable Finnish* (things you can say), not by vocabulary
// category. A few "first words" warm-ups teach vocab; the rest are communicative
// skills (carrier phrases, counting, conjugation, …) that pull words from a
// MIXED pool, so the focus is the pattern, not the noun set. Each skill reuses
// an existing game + round builder — this file only chooses the content scope.
//
// Designed to be ART-READY: every node/chapter carries optional `art`/`bannerArt`
// + `accent`, and nodes accept optional layout hints (`side`, or `pos` for exact
// coordinate placement on a future illustrated map). Emoji are the fallback.
// Progress is keyed by (chapter.id, skill.id) so the adaptive-difficulty / badge
// / dashboard engine works unchanged. Adding a skill or chapter is data-only.

export type ActivityKind =
  | 'listen'
  | 'name'
  | 'listen-sentence'
  | 'say'
  | 'build'
  | 'count'
  | 'match'
  | 'conjugate'
  | 'command'
  | 'yesno'
  | 'possessive'
  | 'error-fix'
  | 'order'
  | 'spell'
  | 'sentence'
  | 'sentence-type'
  | 'dialogue'
  | 'conversation'
  | 'reading'
  | 'story'
  | 'review';

/** Which vocabulary pool a skill draws from. */
export type Pool =
  | 'nouns'
  | 'animals'
  | 'food'
  | 'family'
  | 'numbers'
  | 'places'
  | 'body'
  | 'nature'
  | 'clothes'
  | 'verbs'
  | 'colors';

export interface SkillContent {
  /** Vocab pool (default 'nouns' = all noun topics mixed, incl. places). */
  pool?: Pool;
  /** For build/order: which carrier phrases to drill (default = all). */
  constructionIds?: string[];
  /**
   * For `spell`: type the sourced INFLECTED form (drawn from carrier phrases,
   * tier-gated by the adaptive level) instead of the bare nominative noun.
   * Lets the generic Spelling node become a production capstone over ALL
   * constructions; deep nodes that already pass `constructionIds` get this
   * behavior implicitly.
   */
  inflected?: boolean;
}

export interface SkillNode {
  /** Stable id used in the URL (/skill/:id) and as the progress key. */
  id: string;
  titleFi: string;
  titleEn: string;
  /** Emoji placeholder; replaced by `art` when present. */
  icon: string;
  /** The activity rendered when `activities` is unset, or past its last entry. */
  activity: ActivityKind;
  /**
   * Optional input-method ramp: the activity to render at level 1, 2, 3, ...
   * (index `level - 1`; the last entry holds for any level beyond the array).
   * Lets ONE skill (one progress key) move from multiple-choice recognition
   * toward assembling/typing as the child's measured level rises, instead of
   * splitting recognition vs. production into separate nodes. Most skills don't
   * set this — they keep a single fixed `activity` for their whole life.
   */
  activities?: ActivityKind[];
  content: SkillContent;
  /** Optional teaching example shown under the node, e.g. "Tämä on kissa." */
  exampleFi?: string;
  /**
   * This node's own mastery-ladder depth (default 4 = the original ceiling).
   * Depth is per-node, sized to how much real Finnish grammar the node's
   * subject supports — e.g. a single-case skill stays shallow, while the
   * locative-case node climbs to 8. The adaptive engine never promotes a
   * node past its own `maxLevel`, even though the shared level table goes
   * up to the engine's `MAX_LEVEL` (see `src/game/adapt.ts`).
   */
  maxLevel?: number;
  /**
   * From this measured level up, the node's picture-recognition games (Listen &
   * Tap, Name it) run a gentle per-question countdown (see `questionTimerMs`).
   * Set PER NODE so the clock engages where it makes sense — at the top of a
   * node's own (usually low) ladder, where tile count + tricky distractors have
   * already maxed out — instead of a blanket level threshold that most of these
   * starter nodes never reach. Unset = no timer.
   */
  timerFromLevel?: number;
  // --- art-ready (Phase 1) ---
  /** Node image path under BASE_URL; the emoji `icon` is the fallback. */
  art?: string;
  /** Optional layout hint for the serpentine. */
  side?: 'left' | 'right';
  /** Optional exact placement (percent) for an illustrated map background. */
  pos?: { x: number; y: number };
}

export interface Chapter {
  id: string;
  titleFi: string;
  titleEn: string;
  /** Accent color for the chapter band/nodes (swappable to match art). */
  accent: string;
  icon: string;
  skills: SkillNode[];
  /** A not-yet-filled chapter (advanced content authored later). */
  comingSoon?: boolean;
  // --- art-ready ---
  bannerArt?: string;
  bgArt?: string;
}

// --- Content resolution ---------------------------------------------------

// "All noun topics mixed" (the default pool). Includes places, so the generic
// capstones (Word Order / Spelling) and the mixed-pool drills draw on every
// noun the game teaches — every item carries the full sourced case paradigm,
// so any construction resolves for any of them.
const NOUNS: LexicalItem[] = [
  ...animals.items,
  ...food.items,
  ...family.items,
  ...places.items,
  ...body.items,
  ...nature.items,
  ...clothes.items,
];

// The verbs pool for PICTURE-CARD games (the listen-verbs warm-up): only verbs
// with an action emoji render as cards; abstract ones (olla, saada, muistaa…)
// live in the conjugation drill and sentences instead.
const PICTURED_VERBS: LexicalItem[] = verbs.items.filter((i) => i.emoji);

// The 7 color adjectives, each already sourced with a color-swatch emoji
// (🟥🟦🟨🟩⬛⬜🟫) — real vocabulary art with no illustration dependency. Kept
// separate from `adjectives.items` (which stays the full agreement-game set,
// including non-color adjectives with no picture) and out of `NOUNS`/`themes`,
// same as adjectives generally — colors are their own small warm-up, not a
// noun topic the capstones or cross-topic Review draw on.
const COLOR_IDS = ['red', 'blue', 'yellow', 'green', 'black', 'white', 'brown'];
const COLORS: LexicalItem[] = adjectives.items.filter((i) => COLOR_IDS.includes(i.id));

function itemsForPool(pool?: Pool): LexicalItem[] {
  switch (pool) {
    case 'animals':
      return animals.items;
    case 'food':
      return food.items;
    case 'family':
      return family.items;
    case 'numbers':
      return numbers.items;
    case 'places':
      return places.items;
    case 'body':
      return body.items;
    case 'nature':
      return nature.items;
    case 'clothes':
      return clothes.items;
    case 'verbs':
      return PICTURED_VERBS;
    case 'colors':
      return COLORS;
    default:
      return NOUNS;
  }
}

// Resolve a node's curated construction list. The result is CACHED by the
// (stable) `constructionIds` array so repeated calls return the SAME array
// reference. renderSkill runs on every ActivityRoute render (e.g. each time a
// tap updates the child's stars), and the activities memoize their round on the
// `constructions` prop — so handing back a fresh `.filter()` array every render
// would silently rebuild the round mid-question (a different word/emoji + its
// TTS would flash before reverting). A stable reference keeps the round put.
const constructionCache = new WeakMap<string[], Construction[]>();
function constructionsFor(ids?: string[]): Construction[] {
  if (!ids) return nounConstructions;
  let cached = constructionCache.get(ids);
  if (!cached) {
    cached = nounConstructions.filter((c) => ids.includes(c.id));
    constructionCache.set(ids, cached);
  }
  return cached;
}

const SENTENCE_POOLS: SentencePools = {
  nouns: NOUNS,
  verbs: verbs.items,
  adjectives: adjectives.items,
  numbers: numbers.items,
};

// --- The path -------------------------------------------------------------

const baseChapters: Chapter[] = [
  {
    id: 'first-words',
    titleFi: 'Ensisanat',
    titleEn: 'First words',
    accent: '#0ea5e9',
    icon: '🔊',
    // Warm-ups ramp through the whole retrieval spectrum on ONE vocab set:
    // hear→picture (recognition), see picture→pick the Finnish word
    // (production recall, the generation effect), hear a full sentence→picture
    // (sentence-level comprehension), then adjective agreement (`match`). New
    // game TYPES — not just more option tiles — are what earn the added depth.
    // Numbers skip `listen-sentence` ("Tämä on kolme" is an awkward carrier),
    // capping one rung shorter.
    skills: [
      { id: 'listen-animals', titleFi: 'Eläimet', titleEn: 'Animals', icon: '🐾', activity: 'listen', activities: ['listen', 'listen', 'name', 'listen-sentence', 'match'], maxLevel: 5, timerFromLevel: 4, content: { pool: 'animals' } },
      { id: 'listen-food', titleFi: 'Ruoka', titleEn: 'Food', icon: '🍎', activity: 'listen', activities: ['listen', 'listen', 'name', 'listen-sentence', 'match'], maxLevel: 5, timerFromLevel: 4, content: { pool: 'food' } },
      { id: 'listen-family', titleFi: 'Perhe', titleEn: 'Family', icon: '👪', activity: 'listen', activities: ['listen', 'listen', 'name', 'listen-sentence', 'match'], maxLevel: 5, timerFromLevel: 4, content: { pool: 'family' } },
      { id: 'listen-body', titleFi: 'Keho', titleEn: 'Body', icon: '🧍', activity: 'listen', activities: ['listen', 'listen', 'name', 'listen-sentence', 'match'], maxLevel: 5, timerFromLevel: 4, content: { pool: 'body' } },
      { id: 'listen-nature', titleFi: 'Luonto', titleEn: 'Nature', icon: '🌳', activity: 'listen', activities: ['listen', 'listen', 'name', 'listen-sentence', 'match'], maxLevel: 5, timerFromLevel: 4, content: { pool: 'nature' } },
      { id: 'listen-clothes', titleFi: 'Vaatteet', titleEn: 'Clothes', icon: '👕', activity: 'listen', activities: ['listen', 'listen', 'name', 'listen-sentence', 'match'], maxLevel: 5, timerFromLevel: 4, content: { pool: 'clothes' } },
      { id: 'listen-places', titleFi: 'Paikat', titleEn: 'Places', icon: '🏠', activity: 'listen', activities: ['listen', 'listen', 'name', 'listen-sentence', 'match'], maxLevel: 5, timerFromLevel: 4, content: { pool: 'places' } },
      { id: 'listen-numbers', titleFi: 'Numerot', titleEn: 'Numbers', icon: '🔢', activity: 'listen', activities: ['listen', 'listen', 'name', 'match'], maxLevel: 4, timerFromLevel: 4, content: { pool: 'numbers' } },
      // Colors: adjectives, not nouns, so no `match` (they don't pair with a
      // noun here — they'd have to BE the noun pool, which they aren't).
      // `listen-sentence` still works: "Tämä on punainen." ("This is red.")
      // is a natural Finnish predicate-adjective sentence, gated to just the
      // `this-is` carrier (no "Minulla on punainen" nonsense).
      { id: 'listen-colors', titleFi: 'Värit', titleEn: 'Colors', icon: '🌈', activity: 'listen', activities: ['listen', 'listen', 'name', 'listen-sentence'], maxLevel: 4, timerFromLevel: 4, content: { pool: 'colors', constructionIds: ['this-is'] } },
    ],
  },
  {
    id: 'naming',
    titleFi: 'Nimeä ja omista',
    titleEn: 'Naming & having',
    accent: '#6366f1',
    icon: '🧩',
    skills: [
      // One grammar tier (nominative); depth comes from the challenge ramp
      // recognize → assemble → type. The spell apex types the nominative (= the
      // bare noun), so it stays a fair single-word drill.
      {
        id: 'this-is',
        titleFi: 'Tämä on…',
        titleEn: 'This is a…',
        icon: '🧩',
        activity: 'build',
        activities: ['build', 'build', 'order', 'spell'],
        maxLevel: 4,
        content: { constructionIds: ['this-is'] },
        exampleFi: 'Tämä on kissa.',
      },
      {
        id: 'where-is',
        titleFi: 'Missä on…?',
        titleEn: 'Where is…?',
        icon: '❓',
        activity: 'build',
        activities: ['build', 'build', 'order', 'spell'],
        maxLevel: 4,
        content: { constructionIds: ['where-is'] },
        exampleFi: 'Missä on koira?',
      },
      {
        // The child's first INTERROGATIVE: the -ko yes/no question. A picture
        // is shown, "Onko tämä kissa?" is asked, and the child answers Kyllä
        // or Ei — comprehension of the ASKED word, since half the questions
        // genuinely don't match. Sits right after this-is/where-is (the same
        // nominative naming frame, now as a question). Depth 4: tricky (L4)
        // makes the asked word share the picture's topic (cat vs dog).
        id: 'is-this',
        titleFi: 'Onko tämä…?',
        titleEn: 'Is this…?',
        icon: '🤔',
        activity: 'yesno',
        maxLevel: 4,
        content: { pool: 'nouns', constructionIds: ['is-this'] },
        exampleFi: 'Onko tämä kissa?',
      },
      {
        id: 'i-have',
        titleFi: 'Minulla on… / Kenellä on…',
        titleEn: 'I have… / Who has…',
        icon: '🎒',
        activity: 'build',
        // A deeper node (depth 6): possession grows by person, then negation,
        // then plural quantity. The ramp recognizes (build) → assembles
        // (order — the activity that renders the tier-4/5 partitive-plural
        // phrases as chips) → types the inflected form (spell, e.g. "kissoja").
        // Grammar unlocks one rung per level via maxTier: nominative possession
        // (t2) → negative singular (t3) → partitive-plural positive (t4) →
        // partitive-plural negative (t5), its own top step.
        activities: ['build', 'build', 'build', 'order', 'order', 'spell'],
        maxLevel: 6,
        content: {
          constructionIds: [
            'i-have',
            'you-have',
            'she-has',
            'we-have',
            'they-have',
            'i-havent',
            'i-have-some',
            'i-havent-any',
          ],
        },
        exampleFi: 'Minulla on kala.',
      },
      {
        // The PLURAL mirror of This-is / Where-is, using the (already-vetted)
        // plural-predicative constructions: an indefinite plural takes the
        // partitive plural ("Nämä ovat kissoja"), a definite plural subject the
        // nominative plural ("Missä ovat kissat?"). Sits after I-have, which
        // introduces the partitive plural, so the form is already familiar.
        id: 'plurals',
        titleFi: 'Nämä ovat… / Missä ovat…',
        titleEn: 'These are… / Where are…',
        icon: '👐',
        activity: 'build',
        activities: ['build', 'build', 'order', 'spell'],
        maxLevel: 4,
        content: { constructionIds: ['these-are', 'where-are'] },
        exampleFi: 'Nämä ovat kissoja.',
      },
      {
        // Kenen? (Whose?) — Finnish possessive SUFFIXES ("kissani" = my cat), a
        // subsystem no other game touches. Pick the noun form carrying the right
        // suffix; the tiles are the same noun with the OTHER possessors'
        // endings, so the suffix is the whole question. Depth 5: L1-3 the bare
        // "my cat" nominative, L4-5 add the place-locative reach ("in my house",
        // "on my table"). All forms sourced from the vendored possessive tables.
        id: 'possessives',
        titleFi: 'Kenen?',
        titleEn: 'Whose?',
        icon: '🙋',
        activity: 'possessive',
        maxLevel: 5,
        content: { pool: 'nouns' },
        exampleFi: 'Tämä on kissani.',
      },
    ],
  },
  {
    id: 'where',
    titleFi: 'Missä se on',
    titleEn: 'Where things are',
    accent: '#0d9488',
    icon: '📍',
    skills: [
      // Depth 6: L5-6 unlock the GENITIVE-PLURAL mirrors ("kissojen takana",
      // tier 6) — the same postpositions over the sourced plural form.
      { id: 'postpositions', titleFi: 'Edessä, takana…', titleEn: 'In front, behind…', icon: '📍', activity: 'build', activities: ['build', 'build', 'order', 'spell', 'build', 'spell'], maxLevel: 6, content: { constructionIds: ['in-front-of', 'behind', 'next-to', 'under', 'in-front-of-them', 'behind-them', 'next-to-them', 'under-them'] }, exampleFi: 'kissan edessä' },
      {
        // The flagship deep node (depth 8): the Finnish locative case system.
        // One new case unlocks per level via maxTier — adessive (on) → inessive
        // (in) → illative (into) → allative (onto) → elative (out of) → ablative
        // (off) → inessive PLURAL (apex). The ramp shifts recognize (build) →
        // assemble (order) → type the inflected place form (spell, e.g.
        // "laatikoissa"). Place vocabulary carries the full sourced locative
        // paradigm, so every step resolves — no generated Finnish.
        id: 'locatives',
        titleFi: 'Missä, mihin, mistä',
        titleEn: 'In, on, into, out of…',
        icon: '🧭',
        activity: 'build',
        // The expert band (L9-10) completes the PLURAL locative system
        // (t9-10: pöydillä / pöydille / laatikoista / pöydiltä) — and the L9+
        // levers turn `build` into case-FORM tiles and `spell` into dictation,
        // so the top of this ladder is genuinely adult-hard.
        activities: ['build', 'build', 'build', 'order', 'order', 'order', 'spell', 'spell', 'build', 'spell'],
        maxLevel: 10,
        content: {
          pool: 'places',
          constructionIds: [
            'on-it',
            'in-it',
            'into-it',
            'onto-it',
            'out-of-it',
            'off-it',
            'in-them',
            'on-them',
            'onto-them',
            'out-of-them',
            'off-them',
          ],
        },
        exampleFi: 'Kissa on laatikossa.',
      },
    ],
  },
  {
    id: 'likes',
    titleFi: 'Tykkää ja näe',
    titleEn: 'Likes & seeing',
    accent: '#db2777',
    icon: '❤️',
    // Each verb governs a single case (the subject's natural cap = depth 4):
    // depth comes from the challenge ramp, and the spell apex types the inflected
    // object form (e.g. "kissasta", "koiran"). Demonstrates the "varying degrees"
    // — shallow nodes alongside the deep locative/possession ones.
    skills: [
      { id: 'i-like', titleFi: 'Pidän …sta', titleEn: 'I like…', icon: '❤️', activity: 'build', activities: ['build', 'build', 'order', 'spell'], maxLevel: 4, content: { constructionIds: ['i-like'] }, exampleFi: 'Pidän kissasta.' },
      { id: 'i-see', titleFi: 'Näen …n', titleEn: 'I see…', icon: '👀', activity: 'build', activities: ['build', 'build', 'order', 'spell'], maxLevel: 4, content: { constructionIds: ['i-see'] }, exampleFi: 'Näen koiran.' },
      { id: 'i-love', titleFi: 'Rakastan …a', titleEn: 'I love…', icon: '💕', activity: 'build', activities: ['build', 'build', 'order', 'spell'], maxLevel: 4, content: { constructionIds: ['i-love'] }, exampleFi: 'Rakastan kissaa.' },
      { id: 'i-watch', titleFi: 'Katson …a', titleEn: 'I watch…', icon: '🔭', activity: 'build', activities: ['build', 'build', 'order', 'spell'], maxLevel: 4, content: { constructionIds: ['i-watch'] }, exampleFi: 'Katson kissaa.' },
      // odottaa always governs the partitive object ("Odotan äitiä"), a
      // different rection from the genitive/partitive verbs above.
      { id: 'i-wait-for', titleFi: 'Odotan …a', titleEn: 'I wait for…', icon: '⏳', activity: 'build', activities: ['build', 'build', 'order', 'spell'], maxLevel: 4, content: { constructionIds: ['i-wait-for'] }, exampleFi: 'Odotan äitiä.' },
      {
        // Shopping — the object-case CONTRAST in one functional scene: a whole
        // countable thing takes the genitive ("Ostan omenan"), a mass/divisible
        // thing takes the partitive ("Ostan maitoa"). Both carriers share the
        // same verb, so the case difference IS the lesson. Food pool (the
        // contrast only exists there); clothes/animals still meet i-buy in the
        // mixed capstones.
        id: 'shopping',
        titleFi: 'Kaupassa',
        titleEn: 'Shopping',
        icon: '🛒',
        activity: 'build',
        activities: ['build', 'build', 'order', 'spell'],
        maxLevel: 4,
        content: { pool: 'food', constructionIds: ['i-buy', 'i-buy-some'] },
        exampleFi: 'Ostan omenan.',
      },
    ],
  },
  {
    id: 'numbers-describe',
    titleFi: 'Laske ja kuvaile',
    titleEn: 'Numbers & describing',
    accent: '#f59e0b',
    icon: '🔢',
    skills: [
      // Counting's own grammar subject is the number itself — the shared level
      // table keeps raising maxCount all the way to 20 (5 → 8 → 10 → 12 → 14 →
      // 16 → 18 → 20), so this node rides the FULL engine depth: bigger counts
      // (and the nominative/partitive split they force) is genuine headroom for
      // L1-5. Once the counts have grown, L6-8 shift into build/order/spell
      // over the same noun pool so the back half of the grind isn't just
      // "the same game with bigger numbers" forever.
      // L9-10 return to `count` with the expert draw: the round tens DOMINATE
      // (kuusikymmentä vs seitsemänkymmentä) with neighboring-tens distractors.
      { id: 'count', titleFi: 'Laske ja sano', titleEn: 'Count & say', icon: '🔢', activity: 'count', activities: ['count', 'count', 'count', 'count', 'count', 'build', 'order', 'spell', 'count', 'count'], maxLevel: 10, content: { pool: 'nouns' } },
      // Adjective-noun agreement rotates across 7 cases at every level (not
      // tier-gated), so there's no extra grammar to unlock past the default
      // ceiling — depth stays 4 until the cases themselves get tiered. L3-4
      // shift into build/order over the same noun pool for a second game.
      { id: 'match', titleFi: 'Yhdistä sanat', titleEn: 'Describe it', icon: '🎨', activity: 'match', activities: ['match', 'match', 'build', 'order'], maxLevel: 4, content: { pool: 'nouns' } },
    ],
  },
  {
    id: 'actions',
    titleFi: 'Tekeminen',
    titleEn: 'Actions',
    accent: '#16a34a',
    icon: '🏃',
    skills: [
      // The verbs warm-up: hear an action verb (the infinitive), tap its
      // picture — same format as the chapter-1 noun warm-ups, over the verbs
      // pool (only picturable verbs render; see itemsForPool). L3 swaps to a
      // conjugation taste, not `match` (verbs don't decline by case).
      { id: 'listen-verbs', titleFi: 'Verbit', titleEn: 'Action words', icon: '🎬', activity: 'listen', activities: ['listen', 'listen', 'conjugate'], maxLevel: 3, content: { pool: 'verbs' } },
      // TPR commands: hear a real imperative ("Hyppää!"), tap the action —
      // Total Physical Response, the classic listening format for this age.
      // Imperative 2sg forms are sourced (see VERB_INFLECTION_KEYS in the data
      // build); only curated kid-actable verbs play (COMMAND_VERB_IDS). Depth
      // 4: option count then sound-confusable distractors (same first letter).
      { id: 'commands', titleFi: 'Tee näin!', titleEn: 'Do this!', icon: '🤸', activity: 'command', maxLevel: 4, content: { pool: 'verbs' }, exampleFi: 'Hyppää!' },
      // Depth 8: one new sourced tense×polarity set unlocks per level through
      // L4 (present+ → present- → past+ → past-), each drilled across all six
      // persons; L4 also swaps in `match` as the "different game" step. L5–6
      // ride the `tricky` lever — a distractor tile is a DIFFERENT verb
      // conjugated for the same person, so the verb itself must be recognized
      // across the (now ~50-verb) pool, not just the ending. L7 unlocks the
      // sourced PERFECT ("minä olen syönyt") and L8 the CONDITIONAL ("minä
      // söisin") — the adult-learner rungs. (Imperative is 2nd-person-only and
      // doesn't fit the "pick the person's form" drill.)
      { id: 'conjugate', titleFi: 'Taivuta verbi', titleEn: 'Verbs (I / you / he)', icon: '🏃', activity: 'conjugate', activities: ['conjugate', 'conjugate', 'conjugate', 'match', 'conjugate', 'conjugate', 'conjugate', 'conjugate'], maxLevel: 8, content: {} },
    ],
  },
  {
    id: 'together',
    titleFi: 'Kokoa yhteen',
    titleEn: 'Put it together',
    accent: '#7c3aed',
    icon: '🔀',
    skills: [
      // The cross-cutting capstones (depth 8): they mix EVERY carrier phrase the
      // game teaches over the full noun pool, tier-gated by level — so they
      // self-ramp from nominative (L1) all the way to the inessive-plural apex
      // (L8) without an explicit `activities` array. `order` is the assembly
      // capstone (reorder the chips of a correct Finnish sentence); `spell` is
      // the production capstone (type the sourced inflected form). Together they
      // are "put everything you've learned together", and a genuine grind to top.
      // No second game type here on purpose: progression is already visible
      // every level via new grammar (maxTier), and no other round builder
      // consumes a generic noun pool the way order/spell already do.
      // Depth 10: the expert band adds the t9-10 plural-locative grammar and
      // the L9+ levers (gloss-free assembly / audio-only dictation).
      { id: 'order', titleFi: 'Järjestä sanat', titleEn: 'Word order', icon: '🔀', activity: 'order', maxLevel: 10, content: {} },
      // Same reasoning as `order` above — self-ramps via the inflected-form
      // grammar, no second game.
      { id: 'spell', titleFi: 'Kirjoita sana', titleEn: 'Spelling', icon: '⌨️', activity: 'spell', maxLevel: 10, content: { pool: 'nouns', inflected: true } },
      // Authentic reading: real sourced example sentences (kid-safety filtered),
      // read + heard, tap the picture they're about. Comprehensible input over
      // the mixed noun pool. Depth comes from the option count + tricky lever.
      { id: 'reading', titleFi: 'Lue lause', titleEn: 'Read a sentence', icon: '📖', activity: 'reading', maxLevel: 3, content: {} },
      // Löydä virhe — the grammatical-JUDGMENT game (a new mechanic): a whole
      // sentence is shown against its intended meaning, and half the time the
      // one inflected word carries the wrong (real, sourced) case. Tap the bad
      // word or "all correct". Depth 8: tier-gating brings in harder carriers
      // (locatives, where a swapped inessive→adessive is a subtle real-learner
      // error), and `tricky` makes the wrong form close in length to the right
      // one. Draws from the sentence-shaped carriers over the mixed noun pool.
      {
        id: 'find-error',
        titleFi: 'Löydä virhe',
        titleEn: 'Find the mistake',
        icon: '🔎',
        activity: 'error-fix',
        maxLevel: 8,
        content: {
          pool: 'nouns',
          constructionIds: [
            'this-is',
            'where-is',
            'i-have',
            'i-like',
            'i-see',
            'on-it',
            'in-it',
            'into-it',
            'onto-it',
            'out-of-it',
            'off-it',
          ],
        },
        exampleFi: 'Kissa on laatikossa.',
      },
      // Story time: a tiny illustrated story read page by page, then a couple
      // of comprehension taps — the app's CONNECTED input (following a little
      // narrative for meaning). Tier-gates which stories play; L5 is the
      // Finnish-only rung (the glosses drop away, see showsGloss); L6-7 climb
      // through the tier-5 stories — longer, past-tense narration with
      // sequence/motive questions.
      { id: 'stories', titleFi: 'Satuhetki', titleEn: 'Story time', icon: '📚', activity: 'story', maxLevel: 7, content: {} },
      { id: 'review', titleFi: 'Kertaus', titleEn: 'Review', icon: '🔁', activity: 'review', content: {} },
    ],
  },
];

// Advanced final chapter — ONE cross-cutting "build a whole sentence" node (like
// the chapter-7 capstones), not one node per template: every authored
// SentenceConstruction is a sample inside this single activity, tier-gated by the
// node's measured level so harder multi-slot patterns unlock as the child climbs.
// The registry (src/content/sentences.ts) drives whether the chapter is live: an
// empty registry keeps the friendly "coming soon" placeholder and no playable node.
// The top levels add a typing apex ('sentence-type') on top of tile assembly
// ('sentence') — see the node's `activities` ramp below.
const HAS_SENTENCES = sentenceConstructions.length > 0;

const sentenceSkills: SkillNode[] = HAS_SENTENCES
  ? [
      {
        id: 'full-sentences',
        titleFi: 'Rakenna lauseita',
        titleEn: 'Build sentences',
        icon: '📝',
        activity: 'sentence',
        // The top levels add a typing apex: once the child can assemble a
        // sentence from tiles, typing it out from the English gloss (no
        // Finnish shown, no TTS) is the harder production test. Sessions
        // round-robin the whole unlocked set, so 7-8 mix tile + typing
        // rounds rather than switching over entirely.
        // L9-10: the typing apex becomes DICTATION (the dictation lever speaks
        // the whole Finnish sentence; no gloss) — the app's hardest task.
        activities: [
          'sentence',
          'sentence',
          'sentence',
          'sentence',
          'sentence',
          'sentence',
          'sentence-type',
          'sentence-type',
          'sentence-type',
          'sentence-type',
        ],
        maxLevel: 10,
        content: {},
      },
    ]
  : [];

const sentencesChapter: Chapter = {
  id: 'sentences',
  titleFi: 'Kokonaiset lauseet',
  titleEn: 'Full sentences',
  accent: '#64748b',
  icon: '📝',
  comingSoon: !HAS_SENTENCES,
  skills: sentenceSkills,
};

// Conversations — everyday greetings/courtesies as a "choose the right reply"
// game. Communicative Finnish the drill formats can't teach; content is the
// hand-authored dialogue registry (src/content/dialogues.ts).
const conversationsChapter: Chapter = {
  id: 'conversations',
  titleFi: 'Keskustelut',
  titleEn: 'Conversations',
  accent: '#ec4899',
  icon: '💬',
  skills: [
    {
      id: 'greetings',
      titleFi: 'Tervehdykset',
      titleEn: 'Greetings',
      icon: '👋',
      activity: 'dialogue',
      // Seven rungs: L1 simple greetings (t1–2) → L4 the tier-4 exchanges
      // (favourites, turn-taking) → L5 Finnish-only (the English gloss drops
      // away — see showsGloss) → L6-7 the tier-5 expert register (directions,
      // phone talk, repair moves) with five reply tiles (the L6+ option count).
      maxLevel: 7,
      content: {},
    },
    {
      // The pieces strung together: hold a whole short scene, turn by turn.
      // Greetings (the adjacency pairs) → Small talk (connected discourse).
      id: 'small-talk',
      titleFi: 'Jutellaan',
      titleEn: 'Small talk',
      icon: '🗣️',
      activity: 'conversation',
      // L5 is the Finnish-only rung: the English glosses on the bubbles + reply
      // tiles drop away, so the child holds the whole scene in Finnish. L6-7
      // add the tier-5 scenes (planning a day; a mix-up + repair) — longer,
      // multi-clause turns — with five reply tiles.
      maxLevel: 7,
      content: {},
    },
  ],
};

// The learner journey, sequenced easy → hard and front-loading communication:
// vocab first, then greetings (the most immediately usable Finnish), then
// grammar climbing from the simplest cases (naming / having) up through the
// full 7-case locative system, and finally the sentence + typing capstones.
// Chapters are DEFINED above in author-groups; this list is the single source
// of their PLAY order (reordering here never touches progress, which is keyed
// by chapter+node id, not position).
const CHAPTER_ORDER = [
  'first-words', // noun vocab recognition
  'conversations', // greetings + small talk — early communicative win
  'naming', // this-is / these-are / where-is / I-have (simplest cases)
  'likes', // verb-object carriers (partitive / genitive objects)
  'numbers-describe', // counting + adjective agreement
  'actions', // verb vocab + conjugation
  'where', // the 7 locative cases (the hardest grammar) — belongs late
  'together', // word-order / spelling capstones, reading, review
  'sentences', // full multi-slot sentence assembly — the summit
] as const;

const allChapters = [...baseChapters, conversationsChapter, sentencesChapter];
export const PATH: Chapter[] = CHAPTER_ORDER.map(
  (id) => allChapters.find((c) => c.id === id)!,
);

// --- Lookups + progression helpers ---------------------------------------

export interface FoundSkill {
  chapter: Chapter;
  skill: SkillNode;
}

export function findSkill(id: string): FoundSkill | undefined {
  for (const chapter of PATH) {
    const skill = chapter.skills.find((s) => s.id === id);
    if (skill) return { chapter, skill };
  }
  return undefined;
}

/** Which activity a skill's ramp introduces AT a given level (its `activities`
 *  entry for that level). The "apex so far" — kept for tests/inspection; the
 *  live session uses the broader UNLOCKED set below, not just this one type. */
export function activityForLevel(skill: SkillNode, level: number): ActivityKind {
  if (!skill.activities || skill.activities.length === 0) return skill.activity;
  const index = Math.min(Math.max(1, level), skill.activities.length) - 1;
  return skill.activities[index];
}

/**
 * The distinct game types a node has UNLOCKED by a given measured level — the
 * prefix of its `activities` ramp up to `level`, de-duplicated in ramp order.
 *
 * This is the crux of in-session variety: a node's ramp is read as the ORDER in
 * which game types unlock, not as one fixed type per level. So level 1 plays the
 * first type only (gentle), each level can add a new type to the mix ("visible
 * early"), and a mastered node mixes its whole set — recognize, assemble, type —
 * rather than locking the child into the single hardest game forever. A node
 * with no ramp simply has its one `activity`.
 */
export function activitiesUpTo(skill: SkillNode, level: number): ActivityKind[] {
  if (!skill.activities || skill.activities.length === 0) return [skill.activity];
  const count = Math.min(Math.max(1, Math.round(level)), skill.activities.length);
  const unlocked: ActivityKind[] = [];
  for (const a of skill.activities.slice(0, count)) {
    if (!unlocked.includes(a)) unlocked.push(a);
  }
  return unlocked;
}

// Speaking is woven into EVERY content node automatically (see `activityForRound`
// + `speakableTargetsFor`): each node's own Finnish — a word, a carrier phrase, a
// counting/agreement/verb phrase, a read example, a dialogue reply — becomes
// something the child says. Only `review` is excluded (cross-topic, no single
// spoken target). Injected rather than hand-added to each ramp, so it never
// bloats the ramps.
const NON_SPEAKABLE: ReadonlySet<ActivityKind> = new Set(['review']);

/** Does this node have a spoken target the `say` game can drill? */
export function isSpeakable(skill: SkillNode): boolean {
  return !NON_SPEAKABLE.has(skill.activity);
}

/**
 * The game type to serve for round `roundNo` of a continuous session. Rounds
 * round-robin through the unlocked set so consecutive rounds VARY (a sitting
 * mixes game types) instead of repeating the single type the measured level maps
 * to. Deterministic — no randomness, so it stays unit-testable.
 *
 * When speech recognition is available, a `say` round is folded into the mix on
 * every speakable node from level 2 up (level 1 stays gentle). The flag defaults
 * false, so pure callers/tests see the base rotation unchanged.
 */
export function activityForRound(
  skill: SkillNode,
  level: number,
  roundNo: number,
  speechAvailable = false,
): ActivityKind {
  let unlocked = activitiesUpTo(skill, level);
  if (speechAvailable && level >= 2 && isSpeakable(skill) && !unlocked.includes('say')) {
    unlocked = [...unlocked, 'say'];
  }
  const i = ((Math.trunc(roundNo) % unlocked.length) + unlocked.length) % unlocked.length;
  return unlocked[i];
}

/** Every (chapter, skill) pair in path order. */
export function allSkills(): FoundSkill[] {
  return PATH.flatMap((chapter) => chapter.skills.map((skill) => ({ chapter, skill })));
}

/** The first not-yet-played skill (the highlighted "next" on the map). */
export function nextSkillId(child: Child | null | undefined): string | undefined {
  for (const { chapter, skill } of allSkills()) {
    if (skill.activity === 'review') continue; // review isn't a path step
    const plays = child?.progress?.[chapter.id]?.[skill.id]?.plays ?? 0;
    if (plays === 0) return skill.id;
  }
  return undefined;
}

/** Facts the badge rules measure against, derived from the path (not vocab). */
export const badgeEnv = {
  topicCount: PATH.filter((c) => c.skills.some((s) => s.activity !== 'review')).length,
  activityIds: allSkills()
    .filter(({ skill }) => skill.activity !== 'review')
    .map(({ skill }) => skill.id),
  // Each node's own ladder depth (default 4), so the "top level" badge can be
  // earned by reaching ANY node's own ceiling — depths vary per node.
  skillMaxLevels: Object.fromEntries(
    allSkills().map(({ skill }) => [skill.id, skill.maxLevel ?? 4]),
  ) as Record<string, number>,
};

// --- Rendering ------------------------------------------------------------

const SENTENCE_QUESTIONS = 6;

// A STABLE empty constructions array for the speaking game (which drives its own
// round via `buildRound`). A fresh `[]` literal each render would be a new
// identity in SayIt's round memo deps, regenerating a different random round on
// every parent re-render (e.g. after each answer updates stars/SRS) — a visible
// "flash of another challenge" before advancing.
const NO_CONSTRUCTIONS: Construction[] = [];

// Same referential-stability concern for the picture-safe item subset (see
// above): `itemsForPool` already returns a stable per-pool array reference, but
// a fresh `.filter()` on it every render would still be a NEW array identity —
// regenerating a different random round on every parent re-render. Cache by
// the (stable) source array so the same pool always yields the same filtered
// array reference.
const pictureItemsCache = new WeakMap<LexicalItem[], LexicalItem[]>();
function pictureSafe(items: LexicalItem[]): LexicalItem[] {
  let cached = pictureItemsCache.get(items);
  if (!cached) {
    cached = items.filter((i) => i.emoji);
    pictureItemsCache.set(items, cached);
  }
  return cached;
}

/** Render one specific activity for a skill, wired to the skill's content scope.
 *  The caller decides WHICH activity (per round, for in-session variety — see
 *  `activityForRound`); this just maps an activity kind to its game component.
 *  The caller (SkillRoute) supplies the ActivityContext that hands down adaptive
 *  difficulty + round recording. */
export function renderActivity(
  skill: SkillNode,
  activity: ActivityKind,
  onExit: () => void,
): ReactElement | null {
  const items = itemsForPool(skill.content.pool);
  // A pool may include a few emoji-less words (text-only depth for family/
  // places/clothes — see build-kids-data.mjs); safe for the games that render
  // without a picture (name/listen-sentence/reading/say already filter or
  // guard internally; order/spell render the emoji conditionally) but NOT for
  // the picture-card games below, which need every option to have one.
  const pictureItems = pictureSafe(items);
  switch (activity) {
    case 'listen':
      return (
        <ListenAndTap items={pictureItems} timerFromLevel={skill.timerFromLevel} onExit={onExit} />
      );
    case 'name':
      // Production recall: see the picture, pick the Finnish word (inverse of
      // Listen & Tap over the same pool).
      return <NameIt items={items} timerFromLevel={skill.timerFromLevel} onExit={onExit} />;
    case 'listen-sentence':
      // Sentence-level comprehension: hear a full carrier phrase, tap the
      // picture. Uses the node's constructions (default = all noun carriers),
      // tier-gated by the adaptive level.
      return (
        <ListenSentence
          items={items}
          constructions={constructionsFor(skill.content.constructionIds)}
          onExit={onExit}
        />
      );
    case 'say':
      // Speaking: say the SAME content the node teaches — routed per node by
      // `speakableTargetsFor` (words, carrier phrases, counting/agreement/verb
      // phrases, read examples, dialogue replies), tier-/length-capped for a
      // young child. Weigh (familiarity) is supplied by SayIt from the child's SRS.
      return (
        <SayIt
          items={items}
          constructions={NO_CONSTRUCTIONS}
          buildRound={(maxTier, level, weigh) => speakableTargetsFor(skill, items, maxTier, level, weigh)}
          onExit={onExit}
        />
      );
    case 'build':
      return (
        <BuildAPhrase
          items={pictureItems}
          constructions={constructionsFor(skill.content.constructionIds)}
          onExit={onExit}
        />
      );
    case 'count':
      return <CountAndSay nouns={pictureItems} numbers={numbers.items} onExit={onExit} />;
    case 'match':
      return <MatchTheWord adjectives={adjectives.items} nouns={pictureItems} onExit={onExit} />;
    case 'conjugate':
      return <ConjugateVerb verbs={verbs.items} onExit={onExit} />;
    case 'command':
      // TPR: hear an imperative, tap the action picture. Same utterance→picture
      // mechanic as sentence listening, so it reuses that game with a command
      // round (curated kid-actable verbs, sourced imperatives).
      return (
        <ListenSentence
          items={pictureItems}
          constructions={NO_CONSTRUCTIONS}
          buildRound={(questionCount, optionCount, tricky, weigh) =>
            buildCommandRound(pictureItems, questionCount, optionCount, tricky, weigh)
          }
          title="Tee näin! · Do this!"
          promptFi="Mitä pitää tehdä?"
          promptEn="Tap what the command says"
          onExit={onExit}
        />
      );
    case 'yesno':
      // Yes/no questions: see a picture, hear "Onko tämä ___?", answer Kyllä/Ei.
      return (
        <YesNoGame
          items={pictureItems}
          construction={constructionsFor(skill.content.constructionIds)[0]}
          onExit={onExit}
        />
      );
    case 'possessive':
      // Kenen? — pick the noun form with the right possessive suffix.
      return <PossessiveGame items={pictureItems} onExit={onExit} />;
    case 'error-fix':
      // Löydä virhe — is the sentence right? Tap the wrong word (a sourced form
      // in the wrong case) or "all correct".
      return (
        <FindError
          items={items}
          constructions={constructionsFor(skill.content.constructionIds)}
          onExit={onExit}
        />
      );
    case 'order':
      return (
        <WordOrder
          items={items}
          constructions={constructionsFor(skill.content.constructionIds)}
          onExit={onExit}
        />
      );
    case 'spell': {
      // The spelling apex types the sourced INFLECTED form (e.g. "laatikoissa")
      // instead of the bare noun when the node opts in — either with its own
      // curated `constructionIds` (a deep node's apex) or `inflected: true` (the
      // generic capstone, which then draws from ALL carrier phrases). Otherwise
      // it stays a bare-nominative vocabulary speller.
      const useConstructions = skill.content.inflected || !!skill.content.constructionIds;
      return (
        <SpellWord
          items={items}
          constructions={
            useConstructions ? constructionsFor(skill.content.constructionIds) : undefined
          }
          onExit={onExit}
        />
      );
    }
    case 'sentence':
      return (
        <WordOrder
          title="Lauseet · Sentences"
          buildRound={(maxTier) =>
            buildSentenceRound(sentenceConstructions, SENTENCE_POOLS, SENTENCE_QUESTIONS, maxTier)
          }
          // A couple of misses on the current word nudges the correct next
          // tile — sentences are harder than the single-slot Word Order
          // capstone, which stays hint-free.
          hintAfterMisses={2}
          onExit={onExit}
        />
      );
    case 'sentence-type':
      // The typing apex: same sourced sentences, no tiles — type the whole
      // thing from the English gloss. No TTS (speakTarget={false}) so this
      // stays a production test, not dictation.
      return (
        <SpellWord
          title="Kirjoita lause · Write the sentence"
          buildRound={(maxTier) =>
            buildSentenceSpellingRound(sentenceConstructions, SENTENCE_POOLS, SENTENCE_QUESTIONS, maxTier)
          }
          speakTarget={false}
          onExit={onExit}
        />
      );
    case 'dialogue':
      // Choose the right reply to a Finnish greeting/courtesy. Draws from the
      // hand-authored dialogue registry; tier-gated by the adaptive level.
      return <DialogueGame onExit={onExit} />;
    case 'conversation':
      // Hold a short multi-turn scene (the greetings pieces, strung together).
      // Draws from the hand-authored conversation registry; tier-gated.
      return <ConversationScene onExit={onExit} />;
    case 'reading':
      // Read/hear a real (kid-safe) example sentence, tap the picture it's about.
      return <ReadAndListen items={items} onExit={onExit} />;
    case 'story':
      // A tiny illustrated story, page by page, then comprehension taps.
      return <StoryTime onExit={onExit} />;
    case 'review':
      return null; // review has its own route (/review)
  }
}

/** Render a skill's game for round `roundNo` at the given measured level. Thin
 *  wrapper over `renderActivity` that picks the round's game type (so a session
 *  mixes games — see `activityForRound`). `roundNo` defaults to the first round. */
export function renderSkill(
  skill: SkillNode,
  level: number,
  onExit: () => void,
  roundNo = 0,
  speechAvailable = false,
): ReactElement | null {
  return renderActivity(skill, activityForRound(skill, level, roundNo, speechAvailable), onExit);
}
