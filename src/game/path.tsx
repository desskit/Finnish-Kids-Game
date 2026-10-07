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
  school,
  freetime,
  time,
  states,
  adjectives,
  verbs,
} from '../content';
import type { Difficulty, VerbCombo } from './adapt';
import { byIds } from '../util/byIds';
import { nounConstructions } from '../content/constructions';
import { sentenceConstructions } from '../content/sentences';
import {
  buildCommandRound,
  buildSentenceRound,
  buildSentenceSpellingRound,
  type SentencePools,
} from './round';
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

// The learning PATH — the single source of truth for the guided course.
//
// The course is a fixed sequence of UNITS (each a `Chapter`): a short lesson,
// a few practice STEPS (each a `SkillNode` reusing an existing game, scoped to
// the unit's grammar and the words met so far), and a checkpoint that unlocks
// the next unit. Unlock/completion rules live in `src/game/course.ts`; lessons
// in `src/content/lessons.ts`. Progress is keyed by (unit.id, step.id) so the
// adaptive-difficulty / badge / SRS engine works unchanged.

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
  | 'school'
  | 'freetime'
  | 'verbs'
  | 'colors'
  | 'adjectives'
  | 'feelings'
  | 'time';

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
  /**
   * Which words a course step draws on (resolved below into `wordIds`):
   * 'new' = only its unit's new words, 'known' (default) = every word met so
   * far, 'all' = unscoped.
   */
  words?: 'new' | 'known' | 'all';
  /** Resolved word scope (item ids) — set by the course builder, not by hand. */
  wordIds?: string[];
  /** Registry scope for dialogue/conversation/story steps (exchange/scene/story ids). */
  ids?: string[];
  /**
   * A "Kertaus" (mixed review) step: each segment replays a different earlier
   * grammar step. Set `mix: true`; the course builder fills `mixOf`.
   */
  mix?: boolean;
  /** Resolved step ids a mix step rotates through — set by the course builder. */
  mixOf?: string[];
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
  /**
   * The game this step contributes to its unit's checkpoint (default: the top
   * game unlocked at its done level). Phrase steps ask an assembly ('order')
   * question; new-words steps a 'name' question.
   */
  checkpoint?: ActivityKind;
  /**
   * The level at which this step counts as DONE for unit progress (default 2).
   * The step keeps climbing past it if the child keeps playing.
   */
  doneAtLevel?: number;
  /**
   * Difficulty knobs pinned for this step, merged over the level's own
   * (`difficultyFor`). Course steps pin `maxTier` (their constructions are
   * already scoped) and conjugation steps pin `verbCombos` to their lesson's tense.
   */
  pin?: Partial<Difficulty>;
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
  /** One-line "what you'll learn" shown on the unit card. */
  blurbEn: string;
  /** The unit's lesson (src/content/lessons.ts). */
  lessonId: string;
  /** Item ids this unit introduces (they join the cumulative known words). */
  newWords: string[];
  /** Checkpoint shape; `false` = no checkpoint (the open-ended Mestari unit). */
  checkpoint?: { perStep: number; passRatio: number } | false;
  /** Leave the steps' difficulty unpinned (their own tier ladders apply). */
  unpinned?: boolean;
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
  ...school.items,
  ...freetime.items,
];


// The 7 color adjectives, each already sourced with a color-swatch emoji
// (🟥🟦🟨🟩⬛⬜🟫) — real vocabulary art with no illustration dependency. Kept
// separate from `adjectives.items` (which stays the full agreement-game set,
// including non-color adjectives with no picture) and out of `NOUNS`/`themes`,
// same as adjectives generally — colors are their own small warm-up, not a
// noun topic the capstones or cross-topic Review draw on.
const COLOR_IDS = ['red', 'blue', 'yellow', 'green', 'black', 'white', 'brown'];
const COLORS: LexicalItem[] = adjectives.items.filter((i) => COLOR_IDS.includes(i.id));

// The Feelings unit's words: the feeling adjectives ("iloinen") plus the
// "Minulla on nälkä" states — hunger/thirst nouns and cold/hot adjectives.
const FEELING_IDS = ['happy', 'sad', 'angry', 'tired', 'hungry', 'thirsty', 'sick', 'calm', 'proud', 'cold', 'hot'];
const FEELINGS: LexicalItem[] = [
  ...adjectives.items.filter((i) => FEELING_IDS.includes(i.id)),
  ...states.items,
];

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
    case 'school':
      return school.items;
    case 'freetime':
      return freetime.items;
    case 'verbs':
      // Every verb — the abstract ones (go, come…) show their English on the
      // cards (see ListenAndTap / NameIt), so a words step meets them too.
      return verbs.items;
    case 'colors':
      return COLORS;
    case 'adjectives':
      return adjectives.items;
    case 'feelings':
      return FEELINGS;
    case 'time':
      return time.items;
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

// Whether any multi-slot sentence templates are authored (src/content/sentences.ts);
// the sentence steps only appear when they are.
const HAS_SENTENCES = sentenceConstructions.length > 0;

// --- The course -------------------------------------------------------------
//
// Twenty UNITS in a fixed order — each one a single idea a beginner can hold:
// a short lesson (src/content/lessons.ts) → 1–3 practice steps (the existing
// games, scoped) → a checkpoint that unlocks the next unit (src/game/course.ts).
// Vocabulary is introduced INSIDE the unit that needs it (`newWords`), and every
// practice step draws only from words met so far (cumulative "known" words), so
// a sentence never springs a stranger on the child. Themes are an 8-year-old's
// real life — school, friends, hobbies, food, going places — rather than farm
// animals and body parts.
//
// Units 1–19 PIN their difficulty's grammar tier to the top (`pin.maxTier`): a
// step's constructions are already scoped to exactly what its lesson taught, so
// the level ladder only adds tiles/trickiness/production — it must not hide the
// step's own grammar. Unit 20 (Mestari) is unpinned: there the original deep
// ladders climb through tiers to the L9–10 expert band.

const EVERY_TIER: Partial<Difficulty> = { maxTier: 10 };

const PRESENT_POS: VerbCombo = { tense: 'present', polarity: 'positive' };
const PRESENT_NEG: VerbCombo = { tense: 'present', polarity: 'negative' };
const PAST_POS: VerbCombo = { tense: 'past', polarity: 'positive' };
const PAST_NEG: VerbCombo = { tense: 'past', polarity: 'negative' };

// The grammar every unit before Mestari has actually taught — the capstone
// "Sentences" unit mixes exactly these (no untaught plural apexes).
const TAUGHT_CONSTRUCTIONS = [
  'this-is',
  'where-is',
  'is-this',
  'i-have',
  'you-have',
  'she-has',
  'we-have',
  'they-have',
  'i-havent',
  'i-am',
  'she-is',
  'i-am-not',
  'i-feel',
  'i-like',
  'i-love',
  'i-dont-like',
  'i-see',
  'i-watch',
  'i-wait-for',
  'i-buy',
  'i-buy-some',
  'on-it',
  'in-it',
  'into-it',
  'onto-it',
  'out-of-it',
  'off-it',
  'i-am-in',
  'i-am-on',
  'i-go-into',
  'i-go-onto',
  'i-come-from-in',
  'i-come-from-on',
  'today-is',
  'play-on-day',
  'play-at-time',
  'clock-is',
  'is-under',
  'is-behind',
  'is-in-front-of',
  'is-next-to',
  'this-is-mine',
  'this-is-yours',
  'this-is-theirs',
  'where-is-yours',
  'these-are',
  'where-are',
  'i-have-some',
  'i-havent-any',
  'in-them',
];

/** A unit's "new words" warm-up: meet each word (WordIntro), then hear→tap and
 *  see→name it. Draws ONLY the unit's own new words; words with no single
 *  picture show their English instead. Its checkpoint question is "name it". */
function wordsStep(unitId: string, pool: Pool, titleEn = 'New words'): SkillNode {
  return {
    id: `${unitId}-words`,
    titleFi: 'Uudet sanat',
    titleEn,
    icon: '🆕',
    activity: 'listen',
    activities: ['listen', 'name', 'name'],
    maxLevel: 3,
    checkpoint: 'name',
    content: { pool, words: 'new' },
  };
}

/** A carrier-phrase practice step. L1 recognizes (build); L2 mixes in
 *  ASSEMBLING the sentence (order) — and the step only counts as done after
 *  L2 is proven (doneAtLevel 3), so every child builds sentences before
 *  moving on. Typing (spell) is the next rung up. The checkpoint asks for an
 *  assembly question. */
function phraseStep(
  id: string,
  titleFi: string,
  titleEn: string,
  icon: string,
  constructionIds: string[],
  exampleFi?: string,
  pool?: Pool,
): SkillNode {
  return {
    id,
    titleFi,
    titleEn,
    icon,
    activity: 'build',
    activities: ['build', 'order', 'spell', 'spell'],
    maxLevel: 4,
    doneAtLevel: 3,
    checkpoint: 'order',
    content: { constructionIds, pool },
    exampleFi,
  };
}

/** A "Kertaus" (mixed review) step: every segment replays a DIFFERENT earlier
 *  grammar step (its own game, words and pins), so old units keep coming back.
 *  `mixOf` is filled in below from the steps of all earlier units. */
function reviewStep(unitId: string): SkillNode {
  return {
    id: `${unitId}-mix`,
    titleFi: 'Kertaus',
    titleEn: 'Mixed review',
    icon: '🔁',
    activity: 'build',
    maxLevel: 4,
    content: { mix: true },
  };
}

/** A unit's "use it" conversation — a short scene built on its grammar. */
function sceneStep(id: string, sceneId: string, titleFi: string, titleEn: string): SkillNode {
  return {
    id,
    titleFi,
    titleEn,
    icon: '💬',
    activity: 'conversation',
    maxLevel: 3,
    content: { ids: [sceneId] },
  };
}

const UNITS: Chapter[] = [
  {
    id: 'hello',
    titleFi: 'Hei!',
    titleEn: 'Hello!',
    blurbEn: 'Greet people, say goodbye, and say who you are.',
    accent: '#ec4899',
    icon: '👋',
    lessonId: 'sounds',
    newWords: [],
    skills: [
      {
        id: 'greetings',
        titleFi: 'Tervehdykset',
        titleEn: 'Greetings',
        icon: '👋',
        activity: 'dialogue',
        maxLevel: 3,
        content: {
          ids: ['how-are-you', 'thanks', 'good-morning', 'goodbye', 'good-night', 'here-you-go', 'sorry'],
        },
      },
      {
        id: 'introduce',
        titleFi: 'Kuka sinä olet?',
        titleEn: 'Introduce yourself',
        icon: '🙋',
        activity: 'dialogue',
        maxLevel: 3,
        content: { ids: ['your-name', 'how-old', 'nice-to-meet', 'how-are-you', 'thanks-food'] },
      },
      sceneStep('hello-talk', 'playground', 'Leikkipuistossa', 'At the playground'),
    ],
  },
  {
    id: 'people',
    titleFi: 'Kuka? Mikä?',
    titleEn: 'People & things',
    blurbEn: 'Name the people and things around you at home and school.',
    accent: '#2563eb',
    icon: '🧑‍🏫',
    lessonId: 'no-articles',
    newWords: [
      'mother',
      'father',
      'brother',
      'sister',
      'grandmother',
      'grandfather',
      'baby',
      'child',
      'teacher',
      'friend',
      'book',
      'pencil',
      'backpack',
      'paper',
      'picture',
      'clock',
      'homework',
      'class',
    ],
    skills: [
      wordsStep('people', 'nouns'),
      phraseStep('this-is', 'Tämä on…', 'This is…', '👉', ['this-is'], 'Tämä on opettaja.'),
      {
        id: 'is-this',
        titleFi: 'Onko tämä…?',
        titleEn: 'Is this…?',
        icon: '❓',
        activity: 'yesno',
        maxLevel: 3,
        content: { constructionIds: ['is-this'] },
        exampleFi: 'Onko tämä kirja?',
      },
      sceneStep('people-talk', 'at-school', 'Koulussa', 'At school'),
    ],
  },
  {
    id: 'numbers',
    titleFi: 'Numerot',
    titleEn: 'Numbers',
    blurbEn: 'Count to twelve — and learn why "kaksi kirjaa" ends in -a.',
    accent: '#0891b2',
    icon: '🔢',
    lessonId: 'counting',
    newWords: [
      'one',
      'two',
      'three',
      'four',
      'five',
      'six',
      'seven',
      'eight',
      'nine',
      'ten',
      'eleven',
      'twelve',
    ],
    skills: [
      wordsStep('numbers', 'numbers', 'Numbers 1–12'),
      {
        id: 'how-many',
        titleFi: 'Montako?',
        titleEn: 'How many?',
        icon: '🧮',
        activity: 'count',
        // L1 counts to 5, L2 to 8, L3 to 10, L4 to 12 — the numbers met.
        maxLevel: 4,
        content: {},
        exampleFi: 'kolme kirjaa',
      },
      sceneStep('numbers-talk', 'new-friend', 'Uusi kaveri', 'A new friend'),
    ],
  },
  {
    id: 'having',
    titleFi: 'Minulla on',
    titleEn: 'I have',
    blurbEn: 'Say what you and others have — Finnish has no verb "to have"!',
    accent: '#7c3aed',
    icon: '🎒',
    lessonId: 'having',
    newWords: ['ball', 'football', 'bike', 'game', 'guitar', 'piano', 'phone', 'computer', 'cat', 'dog', 'bunny'],
    skills: [
      wordsStep('having', 'nouns'),
      phraseStep('i-have', 'Minulla on…', 'I have…', '🙋', ['i-have', 'you-have'], 'Minulla on pyörä.'),
      phraseStep(
        'who-has',
        'Kenellä on…?',
        'Who has what',
        '👥',
        ['i-have', 'you-have', 'she-has', 'we-have', 'they-have'],
        'Hänellä on kitara.',
      ),
      sceneStep('having-talk', 'what-you-have', 'Mitä sinulla on?', 'What have you got?'),
    ],
  },
  {
    id: 'not-having',
    titleFi: 'Ei ole',
    titleEn: 'Not having',
    blurbEn: "Say what you don't have — and watch the word change.",
    accent: '#db2777',
    icon: '🚫',
    lessonId: 'negation-object',
    newWords: ['shirt', 'coat', 'shoe', 'sock', 'hat', 'cap', 'boot', 'dress'],
    skills: [
      wordsStep('not-having', 'nouns', 'Clothes'),
      phraseStep('i-havent', 'Minulla ei ole…', "I don't have…", '🚫', ['i-havent'], 'Minulla ei ole hattua.'),
      phraseStep('have-or-not', 'On vai ei?', 'Have or not', '⚖️', ['i-have', 'i-havent', 'you-have']),
      sceneStep('not-having-talk', 'going-out', 'Mennään ulos', 'Going outside'),
      reviewStep('not-having'),
    ],
  },
  {
    id: 'doing',
    titleFi: 'Mitä teet?',
    titleEn: 'Doing things',
    blurbEn: 'Action words — the ending tells you WHO is doing it.',
    accent: '#ea580c',
    icon: '🏃',
    lessonId: 'verb-persons',
    newWords: ['eat', 'drink', 'sleep', 'play', 'run', 'swim', 'read', 'write', 'draw', 'sing', 'listen', 'speak'],
    skills: [
      wordsStep('doing', 'verbs', 'Action words'),
      {
        id: 'verbs-present',
        titleFi: 'Minä, sinä, hän…',
        titleEn: 'Who is doing it?',
        icon: '🏃',
        activity: 'conjugate',
        maxLevel: 4,
        pin: { verbCombos: [PRESENT_POS] },
        content: {},
        exampleFi: 'minä syön, sinä syöt',
      },
      sceneStep('doing-talk', 'playdate', 'Leikitään!', 'Playing together'),
    ],
  },
  {
    id: 'not-doing',
    titleFi: 'En tee',
    titleEn: 'Saying no',
    blurbEn: 'In Finnish, "not" is a verb that changes too: en, et, ei…',
    accent: '#b91c1c',
    icon: '✋',
    lessonId: 'negative-verb',
    newWords: [],
    skills: [
      {
        id: 'verbs-negative',
        titleFi: 'En syö',
        titleEn: "I don't…",
        icon: '✋',
        activity: 'conjugate',
        maxLevel: 4,
        pin: { verbCombos: [PRESENT_NEG] },
        content: {},
        exampleFi: 'minä en syö',
      },
      {
        id: 'verbs-yes-no',
        titleFi: 'Syön vai en syö?',
        titleEn: 'Yes or no',
        icon: '🔀',
        activity: 'conjugate',
        maxLevel: 4,
        pin: { verbCombos: [PRESENT_POS, PRESENT_NEG] },
        content: {},
      },
      sceneStep('not-doing-talk', 'bedtime', 'Nukutko jo?', 'Are you asleep?'),
    ],
  },
  {
    id: 'feelings',
    titleFi: 'Miltä tuntuu?',
    titleEn: 'Feelings',
    blurbEn: 'Say how you feel — happy, tired, hungry, cold…',
    accent: '#f59e0b',
    icon: '😄',
    lessonId: 'feelings',
    newWords: [
      'happy',
      'sad',
      'angry',
      'tired',
      'hungry',
      'thirsty',
      'sick',
      'calm',
      'proud',
      'hunger',
      'thirst',
      'cold',
      'hot',
    ],
    skills: [
      wordsStep('feelings', 'feelings', 'Feelings'),
      phraseStep('i-am', 'Olen…', "I'm…", '🙂', ['i-am', 'she-is'], 'Olen iloinen.', 'feelings'),
      phraseStep('i-am-not', 'En ole…', "I'm not…", '🙅', ['i-am-not', 'i-am'], 'En ole väsynyt.', 'feelings'),
      phraseStep('i-feel', 'Minulla on nälkä', 'Hungry, thirsty, cold', '🥶', ['i-feel'], 'Minulla on nälkä.', 'feelings'),
      sceneStep('feelings-talk', 'how-feel', 'Miltä tuntuu?', 'How do you feel?'),
    ],
  },
  {
    id: 'likes',
    titleFi: 'Tykkään',
    titleEn: 'Likes',
    blurbEn: 'Say what you like and love — each verb picks its own ending.',
    accent: '#e11d48',
    icon: '❤️',
    lessonId: 'likes',
    newWords: [
      'pizza',
      'ice-cream',
      'chocolate',
      'apple',
      'banana',
      'bread',
      'cheese',
      'milk',
      'juice',
      'water',
      'cake',
      'cookie',
      'strawberry',
      'candy',
      'music',
      'movie',
      'hobby',
    ],
    skills: [
      wordsStep('likes', 'nouns', 'Food & fun'),
      phraseStep('i-like', 'Pidän…sta', 'I like…', '👍', ['i-like'], 'Pidän jalkapallosta.'),
      phraseStep('i-love', 'Rakastan…a', 'I love…', '💕', ['i-love', 'i-like'], 'Rakastan pitsaa.'),
      sceneStep('likes-talk', 'evening-home', 'Illalla kotona', 'Evening at home'),
    ],
  },
  {
    id: 'school-day',
    titleFi: 'Koulupäivä',
    titleEn: 'School day',
    blurbEn: "School subjects — and saying what you don't like.",
    accent: '#0369a1',
    icon: '🏫',
    lessonId: 'school-day',
    newWords: ['math', 'gym', 'english', 'pupil', 'test', 'eraser', 'task', 'canteen'],
    skills: [
      wordsStep('school-day', 'nouns', 'At school'),
      phraseStep(
        'like-or-not',
        'Pidän / En pidä',
        'Like it or not',
        '👍',
        ['i-like', 'i-dont-like'],
        'En pidä matematiikasta.',
      ),
      sceneStep('school-day-talk', 'school-day', 'Koulupäivä', 'A school day'),
      reviewStep('school-day'),
    ],
  },
  {
    id: 'seeing',
    titleFi: 'Näen ja odotan',
    titleEn: 'Seeing & waiting',
    blurbEn: 'See the whole thing (-n) or keep watching it (-a).',
    accent: '#0d9488',
    icon: '👀',
    lessonId: 'total-object',
    newWords: ['bus', 'train', 'car'],
    skills: [
      wordsStep('seeing', 'nouns', 'Getting around'),
      phraseStep('i-see', 'Näen…n', 'I see…', '👀', ['i-see'], 'Näen bussin.'),
      phraseStep('watch-wait', 'Katson, odotan', 'Watching & waiting', '⏳', ['i-watch', 'i-wait-for'], 'Odotan bussia.'),
      sceneStep('seeing-talk', 'bus-stop', 'Bussipysäkillä', 'At the bus stop'),
    ],
  },
  {
    id: 'shop',
    titleFi: 'Kaupassa',
    titleEn: 'At the shop',
    blurbEn: 'Buy one whole thing, or some of a thing.',
    accent: '#16a34a',
    icon: '🛒',
    lessonId: 'buying',
    newWords: ['shop', 'potato', 'carrot', 'egg', 'rice', 'soup', 'sausage', 'tomato', 'butter'],
    skills: [
      wordsStep('shop', 'nouns', 'Shopping list'),
      phraseStep('buying', 'Ostan…', 'Buying', '🛒', ['i-buy', 'i-buy-some'], 'Ostan omenan. Ostan maitoa.'),
      sceneStep('shop-scene', 'shop', 'Kaupassa', 'At the till'),
    ],
  },
  {
    id: 'describing',
    titleFi: 'Millainen?',
    titleEn: 'Describing',
    blurbEn: "Colors and describing words copy the noun's ending.",
    accent: '#ca8a04',
    icon: '🎨',
    lessonId: 'agreement',
    newWords: [
      'red',
      'blue',
      'yellow',
      'green',
      'black',
      'white',
      'brown',
      'big',
      'small',
      'fast',
      'slow',
      'old',
      'cute',
      'kind',
    ],
    skills: [
      wordsStep('describing', 'adjectives', 'Colors & describing words'),
      {
        id: 'describe',
        titleFi: 'Iso koira',
        titleEn: 'Describe it',
        icon: '🎨',
        activity: 'match',
        maxLevel: 4,
        content: {},
        exampleFi: 'iso koira',
      },
      sceneStep('describing-talk', 'what-like', 'Millainen?', 'What is it like?'),
    ],
  },
  {
    id: 'where',
    titleFi: 'Missä?',
    titleEn: 'Where is it?',
    blurbEn: 'No words for "in" or "on" — Finnish uses endings instead.',
    accent: '#0284c7',
    icon: '📍',
    lessonId: 'in-on',
    newWords: [
      'house',
      'school',
      'room',
      'kitchen',
      'garden',
      'library',
      'forest',
      'tree',
      'box',
      'table',
      'chair',
      'bed',
      'basket',
      'bag',
      'window',
      'door',
    ],
    skills: [
      wordsStep('where', 'places', 'Places'),
      phraseStep('where-is', 'Missä on…?', 'Where is…?', '🔍', ['where-is'], 'Missä on reppu?'),
      phraseStep('in-on', 'Missä se on?', 'In or on', '📦', ['in-it', 'on-it'], 'Kirja on laatikossa.', 'places'),
      sceneStep('where-talk', 'tidy-up', 'Missä se on?', 'Where is it?'),
    ],
  },
  {
    id: 'moving',
    titleFi: 'Mihin? Mistä?',
    titleEn: 'Going & coming',
    blurbEn: 'Into, onto, out of, off — three questions, six endings.',
    accent: '#4f46e5',
    icon: '🚶',
    lessonId: 'into-out',
    newWords: [],
    skills: [
      phraseStep('into-onto', 'Mihin?', 'Into & onto', '➡️', ['into-it', 'onto-it'], 'Kissa menee laatikkoon.', 'places'),
      phraseStep('out-off', 'Mistä?', 'Out of & off', '⬅️', ['out-of-it', 'off-it'], 'Kissa tulee laatikosta.', 'places'),
      phraseStep(
        'six-cases',
        'Missä, mihin, mistä',
        'All six together',
        '🧭',
        ['on-it', 'in-it', 'into-it', 'onto-it', 'out-of-it', 'off-it'],
        undefined,
        'places',
      ),
      sceneStep('moving-talk', 'cat-moves', 'Mihin kissa menee?', "Where's the cat going?"),
      reviewStep('moving'),
    ],
  },
  {
    id: 'town',
    titleFi: 'Kaupungilla ja kotona',
    titleEn: 'Around town & home',
    blurbEn: 'Where YOU are, where you go, and where you come from.',
    accent: '#059669',
    icon: '🏙️',
    lessonId: 'town',
    newWords: [
      'park',
      'hospital',
      'station',
      'museum',
      'restaurant',
      'cafe',
      'city',
      'market',
      'zoo',
      'field',
      'living-room',
      'bedroom',
      'bathroom',
      'sofa',
      'yard',
    ],
    skills: [
      wordsStep('town', 'places', 'Town & home'),
      phraseStep('where-i-am', 'Olen…', 'Where I am', '📍', ['i-am-in', 'i-am-on'], 'Olen puistossa.', 'places'),
      phraseStep(
        'going-coming',
        'Menen, tulen',
        'Where I go & come from',
        '🚶',
        ['i-go-into', 'i-go-onto', 'i-come-from-in', 'i-come-from-on'],
        'Menen kirjastoon.',
        'places',
      ),
      sceneStep('town-talk', 'in-town', 'Kaupungilla', 'Out in town'),
    ],
  },
  {
    id: 'when',
    titleFi: 'Milloin?',
    titleEn: 'When?',
    blurbEn: 'Days of the week, mornings and seasons — and telling the time.',
    accent: '#7c2d12',
    icon: '📅',
    lessonId: 'when',
    newWords: [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
      'weekend',
      'morning',
      'daytime',
      'evening',
      'night',
      'spring',
      'summer',
      'autumn',
      'winter',
    ],
    skills: [
      wordsStep('when', 'time', 'Days & times'),
      phraseStep('today-is', 'Tänään on…', 'Today is…', '📅', ['today-is'], 'Tänään on maanantai.', 'time'),
      phraseStep(
        'when-play',
        'Leikin…',
        'When I play',
        '🕑',
        ['play-on-day', 'play-at-time'],
        'Leikin lauantaina.',
        'time',
      ),
      phraseStep('clock', 'Kello on…', 'What time is it?', '⏰', ['clock-is'], 'Kello on kolme.', 'numbers'),
      sceneStep('when-talk', 'when-play', 'Milloin leikitään?', 'When shall we play?'),
    ],
  },
  {
    id: 'around',
    titleFi: 'Edessä, takana',
    titleEn: 'Around things',
    blurbEn: 'In front of, behind, next to, under.',
    accent: '#0f766e',
    icon: '🧭',
    lessonId: 'postpositions',
    newWords: [],
    skills: [
      phraseStep(
        'around',
        'Edessä, takana…',
        'In front, behind…',
        '📍',
        ['in-front-of', 'behind', 'next-to', 'under'],
        'tuolin alla',
      ),
      phraseStep(
        'around-sentences',
        'Kissa on tuolin alla',
        'Where the cat is',
        '🐱',
        ['is-under', 'is-behind', 'is-in-front-of', 'is-next-to'],
        'Kissa on tuolin alla.',
      ),
      sceneStep('around-talk', 'hiding', 'Piilossa', 'Hiding'),
    ],
  },
  {
    id: 'whose',
    titleFi: 'Kenen?',
    titleEn: 'Whose?',
    blurbEn: '"My", "your" and "their" are endings too: kirjani, kirjasi.',
    accent: '#9333ea',
    icon: '🙋',
    lessonId: 'possessive',
    newWords: [],
    skills: [
      {
        id: 'possessives',
        titleFi: 'Kenen?',
        titleEn: 'Whose is it?',
        icon: '🙋',
        activity: 'possessive',
        maxLevel: 5,
        content: { pool: 'nouns' },
        exampleFi: 'kirjani, kirjasi',
      },
      phraseStep(
        'mine-yours',
        'Tämä on minun…',
        'My, your, their',
        '🫵',
        ['this-is-mine', 'this-is-yours', 'this-is-theirs', 'where-is-yours'],
        'Tämä on minun kirjani.',
      ),
      sceneStep('whose-talk', 'whose-is-it', 'Kenen tämä on?', 'Whose is this?'),
    ],
  },
  {
    id: 'many',
    titleFi: 'Monta',
    titleEn: 'Many',
    blurbEn: 'More than one: kirjat, kirjoja — and "some".',
    accent: '#c026d3',
    icon: '👐',
    lessonId: 'plurals',
    newWords: [],
    skills: [
      phraseStep('these-are', 'Nämä ovat…', 'These are…', '👐', ['these-are', 'where-are'], 'Nämä ovat kirjoja.'),
      phraseStep('some-any', 'Minulla on…ja', 'Some & any', '🧺', ['i-have-some', 'i-havent-any'], 'Minulla on palloja.'),
      phraseStep('in-them', '…issa', 'In the boxes', '📦', ['in-them'], 'Kissat ovat laatikoissa.', 'places'),
      sceneStep('many-talk', 'lots-of-things', 'Paljon tavaraa', 'Lots of things'),
      reviewStep('many'),
    ],
  },
  {
    id: 'yesterday',
    titleFi: 'Eilen',
    titleEn: 'Yesterday',
    blurbEn: 'Talk about what already happened.',
    accent: '#a16207',
    icon: '⏮️',
    lessonId: 'past',
    newWords: ['walk', 'jump', 'dance', 'help', 'cook', 'clean', 'go', 'come', 'see', 'give', 'make'],
    skills: [
      wordsStep('yesterday', 'verbs', 'More action words'),
      {
        id: 'verbs-past',
        titleFi: 'Söin, en syönyt',
        titleEn: 'What happened',
        icon: '⏮️',
        activity: 'conjugate',
        maxLevel: 4,
        pin: { verbCombos: [PAST_POS, PAST_NEG] },
        content: {},
        exampleFi: 'minä söin, minä en syönyt',
      },
      {
        id: 'past-stories',
        titleFi: 'Tarinat',
        titleEn: 'Stories',
        icon: '📚',
        activity: 'story',
        maxLevel: 4,
        content: { ids: ['lost-dog', 'birthday-surprise'] },
      },
      sceneStep('yesterday-talk', 'yesterday', 'Mitä teit eilen?', 'What did you do yesterday?'),
    ],
  },
  {
    id: 'chatting',
    titleFi: 'Jutellaan',
    titleEn: 'Real conversations',
    blurbEn: 'Hold a whole conversation and follow a story.',
    accent: '#be185d',
    icon: '🗣️',
    lessonId: 'conversation',
    newWords: [],
    skills: [
      {
        id: 'everyday-talk',
        titleFi: 'Arkipuhetta',
        titleEn: 'Everyday talk',
        icon: '💬',
        activity: 'dialogue',
        maxLevel: 4,
        content: {
          ids: [
            'where-going',
            'what-is-this',
            'good-day',
            'see-tomorrow',
            'where-live',
            'welcome',
            'fav-color',
            'whose-turn',
            'happy-birthday',
            'who-wants',
            'enjoy-meal',
            'feeling',
            'weather',
            'favorite-food',
            'may-i-have',
            'can-you-help',
            'how-much',
          ],
        },
      },
      {
        id: 'scenes',
        titleFi: 'Jutellaan',
        titleEn: 'Conversations',
        icon: '🗣️',
        activity: 'conversation',
        maxLevel: 4,
        content: { ids: ['helping', 'plan-day', 'mixup'] },
      },
      {
        id: 'everyday-stories',
        titleFi: 'Tarinat',
        titleEn: 'Stories',
        icon: '📖',
        activity: 'story',
        maxLevel: 4,
        content: { ids: ['morning', 'at-the-shop'] },
      },
    ],
  },
  {
    id: 'sentences',
    titleFi: 'Lauseet',
    titleEn: 'Sentences',
    blurbEn: 'Put whole sentences together, and spot mistakes.',
    accent: '#475569',
    icon: '📝',
    lessonId: 'word-order',
    newWords: [],
    skills: [
      {
        id: 'word-order',
        titleFi: 'Järjestä sanat',
        titleEn: 'Word order',
        icon: '🔀',
        activity: 'order',
        activities: ['order', 'order', 'spell'],
        maxLevel: 4,
        content: { constructionIds: TAUGHT_CONSTRUCTIONS },
      },
      ...(HAS_SENTENCES
        ? [
            {
              id: 'build-sentences',
              titleFi: 'Rakenna lauseita',
              titleEn: 'Build sentences',
              icon: '📝',
              activity: 'sentence' as ActivityKind,
              activities: ['sentence', 'sentence', 'sentence-type'] as ActivityKind[],
              maxLevel: 4,
              content: {},
            },
          ]
        : []),
      {
        id: 'find-error',
        titleFi: 'Löydä virhe',
        titleEn: 'Find the mistake',
        icon: '🔎',
        activity: 'error-fix',
        maxLevel: 4,
        content: {
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
            'i-am-in',
            'i-go-into',
            'play-on-day',
            'play-at-time',
          ],
        },
        exampleFi: 'Kirja on laatikossa.',
      },
    ],
  },
  {
    // The expert band — the original deep ladders, unpinned, so they climb
    // through tiers to L9–10 (case-form tiles, gloss-free drills, dictation,
    // perfect + conditional, the full plural locative system). No checkpoint:
    // this is where a finished course keeps getting harder.
    id: 'mestari',
    titleFi: 'Mestari',
    titleEn: 'Expert',
    blurbEn: 'Everything, harder and harder — for when the course is done.',
    accent: '#1e293b',
    icon: '🏆',
    lessonId: 'expert',
    newWords: [],
    checkpoint: false,
    unpinned: true,
    skills: [
      {
        id: 'verbs-expert',
        titleFi: 'Kaikki aikamuodot',
        titleEn: 'Every tense',
        icon: '🏃',
        activity: 'conjugate',
        activities: ['conjugate', 'conjugate', 'conjugate', 'match', 'conjugate', 'conjugate', 'conjugate', 'conjugate'],
        maxLevel: 8,
        content: {},
      },
      {
        id: 'cases-expert',
        titleFi: 'Missä, mihin, mistä',
        titleEn: 'Every place case',
        icon: '🧭',
        activity: 'build',
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
      },
      {
        id: 'around-expert',
        titleFi: 'Edessä, takana…',
        titleEn: 'Around many things',
        icon: '📍',
        activity: 'build',
        activities: ['build', 'build', 'order', 'spell', 'build', 'spell'],
        maxLevel: 6,
        content: {
          constructionIds: [
            'in-front-of',
            'behind',
            'next-to',
            'under',
            'in-front-of-them',
            'behind-them',
            'next-to-them',
            'under-them',
          ],
        },
      },
      {
        id: 'count-expert',
        titleFi: 'Laske sataan',
        titleEn: 'Count to 100',
        icon: '💯',
        activity: 'count',
        activities: ['count', 'count', 'count', 'count', 'count', 'build', 'order', 'spell', 'count', 'count'],
        maxLevel: 10,
        content: { words: 'all' },
      },
      {
        id: 'order-expert',
        titleFi: 'Järjestä sanat',
        titleEn: 'Word order',
        icon: '🔀',
        activity: 'order',
        maxLevel: 10,
        content: {},
      },
      {
        id: 'spell-expert',
        titleFi: 'Kirjoita sana',
        titleEn: 'Spelling & dictation',
        icon: '⌨️',
        activity: 'spell',
        maxLevel: 10,
        content: { pool: 'nouns', inflected: true },
      },
      ...(HAS_SENTENCES
        ? [
            {
              id: 'sentences-expert',
              titleFi: 'Rakenna lauseita',
              titleEn: 'Sentences',
              icon: '📝',
              activity: 'sentence' as ActivityKind,
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
              ] as ActivityKind[],
              maxLevel: 10,
              content: {},
            },
          ]
        : []),
      {
        id: 'find-error-expert',
        titleFi: 'Löydä virhe',
        titleEn: 'Find the mistake',
        icon: '🔎',
        activity: 'error-fix',
        maxLevel: 8,
        content: {
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
      },
      { id: 'talk-expert', titleFi: 'Keskustelut', titleEn: 'Hard conversations', icon: '💬', activity: 'dialogue', maxLevel: 7, content: {} },
      { id: 'scenes-expert', titleFi: 'Jutellaan', titleEn: 'Long scenes', icon: '🗣️', activity: 'conversation', maxLevel: 7, content: {} },
      { id: 'stories-expert', titleFi: 'Satuhetki', titleEn: 'All stories', icon: '📚', activity: 'story', maxLevel: 7, content: {} },
      { id: 'reading', titleFi: 'Lue lause', titleEn: 'Real sentences', icon: '📖', activity: 'reading', maxLevel: 3, content: {} },
    ],
  },
];

// --- Resolve each step's word scope, default pins, and review mixes ------
//
// A unit's `newWords` accumulate into the "known" set; each step gets a STABLE
// `content.wordIds` array (resolved once here, so renderActivity's caches key
// on it) — 'new' = just this unit's words, 'known' (default) = every word met up
// to and including this unit, 'all' = unscoped. A Kertaus step's `mixOf` is
// every GRAMMAR step of the earlier units (not words / dialogue / scene / story
// steps, not other mixes).
const knownByUnit: string[][] = [];
{
  const acc: string[] = [];
  for (const unit of UNITS) {
    for (const w of unit.newWords ?? []) if (!acc.includes(w)) acc.push(w);
    knownByUnit.push([...acc]);
  }
}

const NOT_MIXABLE: ReadonlySet<ActivityKind> = new Set([
  'dialogue',
  'conversation',
  'story',
  'reading',
  'review',
]);

/** Is this a grammar step a Kertaus may replay? */
export function isMixable(step: SkillNode): boolean {
  return !step.content.mix && step.content.words !== 'new' && !NOT_MIXABLE.has(step.activity);
}

UNITS.forEach((unit, ui) => {
  for (const step of unit.skills) {
    const scope = step.content.words ?? 'known';
    if (scope === 'new') step.content.wordIds = unit.newWords ?? [];
    else if (scope === 'known') step.content.wordIds = knownByUnit[ui];
    if (!unit.unpinned) step.pin = { ...EVERY_TIER, ...step.pin };
    if (step.content.mix) {
      step.content.mixOf = UNITS.slice(0, ui)
        .flatMap((u) => u.skills)
        .filter(isMixable)
        .map((s) => s.id);
    }
  }
});

/** Every word id introduced up to and including unit `index` (0-based). */
export function knownWordsThrough(index: number): readonly string[] {
  return knownByUnit[Math.max(0, Math.min(index, knownByUnit.length - 1))] ?? [];
}

export const PATH: Chapter[] = UNITS;

// --- Lookups + progression helpers ---------------------------------------

export interface FoundSkill {
  chapter: Chapter;
  skill: SkillNode;
}

/** A stride that visits every one of `n` slots before repeating. */
function strideFor(n: number): number {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  return [7, 5, 3, 1].find((k) => gcd(k, n) === 1) ?? 1;
}

/**
 * The earlier step a Kertaus (mixed review) step plays on segment `roundNo`.
 * Segment 0 starts at the NEWEST earlier step (the grammar most worth
 * refreshing, and a different opener for each Kertaus), then strides backwards
 * through `mixOf` so consecutive segments jump between units rather than
 * marching through them in order. Undefined for a non-mix step.
 */
export function mixStepFor(skill: SkillNode, roundNo: number): FoundSkill | undefined {
  const ids = skill.content.mixOf;
  if (!ids || ids.length === 0) return undefined;
  const n = ids.length;
  const back = (((Math.trunc(roundNo) * strideFor(n)) % n) + n) % n;
  return findSkill(ids[n - 1 - back]);
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

/**
 * A pool narrowed to a step's word scope — a STABLE array per (pool, ids) (see
 * `byIds`) so the games' round memos never see a fresh identity. Falls back to
 * the whole pool when the scope leaves fewer than `min` items (a game that
 * needs distractors from this pool would otherwise have nothing to offer).
 */
function scoped(all: LexicalItem[], ids: string[] | undefined, min: number): LexicalItem[] {
  if (!ids) return all;
  const hit = byIds(all, ids) as LexicalItem[];
  return hit.length >= min ? hit : all;
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
  // A Kertaus step plays one of its earlier steps (SkillRoute picks which per
  // segment via `mixStepFor`); called directly, it plays the first.
  if (skill.content.mixOf) {
    const sub = mixStepFor(skill, 0);
    return sub ? renderActivity(sub.skill, activitiesUpTo(sub.skill, 1)[0], onExit) : null;
  }
  // Course steps draw only from their scoped words (see `content.wordIds`).
  const wordIds = skill.content.wordIds;
  const items = scoped(itemsForPool(skill.content.pool), wordIds, 1);
  // A pool may include a few emoji-less words (text-only depth for family/
  // places/clothes — see build-kids-data.mjs); safe for the games that render
  // without a picture (name/listen-sentence/reading/say already filter or
  // guard internally; order/spell render the emoji conditionally) but NOT for
  // the picture-card games below, which need every option to have one.
  const pictureItems = pictureSafe(items);
  switch (activity) {
    case 'listen':
      return (
        // Picture-less words (weekdays, "kind", "hobby") show their English on
        // the card, so every scoped word can be met here.
        <ListenAndTap items={items} timerFromLevel={skill.timerFromLevel} onExit={onExit} />
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
          items={items}
          constructions={constructionsFor(skill.content.constructionIds)}
          onExit={onExit}
        />
      );
    case 'count':
      return <CountAndSay nouns={pictureItems} numbers={numbers.items} onExit={onExit} />;
    case 'match':
      return (
        <MatchTheWord
          adjectives={scoped(adjectives.items, wordIds, 4)}
          nouns={pictureItems}
          onExit={onExit}
        />
      );
    case 'conjugate':
      return <ConjugateVerb verbs={scoped(verbs.items, wordIds, 4)} onExit={onExit} />;
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
      return <PossessiveGame items={items} onExit={onExit} />;
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
      return <DialogueGame ids={skill.content.ids} onExit={onExit} />;
    case 'conversation':
      // Hold a short multi-turn scene (the greetings pieces, strung together).
      // Draws from the hand-authored conversation registry; tier-gated.
      return <ConversationScene ids={skill.content.ids} onExit={onExit} />;
    case 'reading':
      // Read/hear a real (kid-safe) example sentence, tap the picture it's about.
      return <ReadAndListen items={items} onExit={onExit} />;
    case 'story':
      // A tiny illustrated story, page by page, then comprehension taps.
      return <StoryTime ids={skill.content.ids} onExit={onExit} />;
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
