import type { ReactElement } from 'react';
import type { Construction, LexicalItem } from '../content/types';
import { animals, food, family, numbers, places, adjectives, verbs } from '../content';
import { nounConstructions } from '../content/constructions';
import { sentenceConstructions } from '../content/sentences';
import { buildSentenceRound, type SentencePools } from './round';
import type { Child } from '../state/storage';
import ListenAndTap from '../components/ListenAndTap';
import BuildAPhrase from '../components/BuildAPhrase';
import CountAndSay from '../components/CountAndSay';
import MatchTheWord from '../components/MatchTheWord';
import ConjugateVerb from '../components/ConjugateVerb';
import WordOrder from '../components/WordOrder';
import SpellWord from '../components/SpellWord';

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
  | 'build'
  | 'count'
  | 'match'
  | 'conjugate'
  | 'order'
  | 'spell'
  | 'sentence'
  | 'review';

/** Which vocabulary pool a skill draws from. */
export type Pool = 'nouns' | 'animals' | 'food' | 'family' | 'numbers' | 'places';

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
    // Warm-ups: depth comes from the option-tile count, which the shared
    // level table already flattens out by L3 (optionCount 3, 4, 4, ...), so
    // a short depth-3 ladder is the honest cap. L3 swaps to `match` (the same
    // vocab, judged by adjective agreement instead of listening) so the climb
    // ends in a different game rather than a 3rd identical listening round.
    skills: [
      { id: 'listen-animals', titleFi: 'Eläimet', titleEn: 'Animals', icon: '🐾', activity: 'listen', activities: ['listen', 'listen', 'match'], maxLevel: 3, content: { pool: 'animals' } },
      { id: 'listen-food', titleFi: 'Ruoka', titleEn: 'Food', icon: '🍎', activity: 'listen', activities: ['listen', 'listen', 'match'], maxLevel: 3, content: { pool: 'food' } },
      { id: 'listen-family', titleFi: 'Perhe', titleEn: 'Family', icon: '👪', activity: 'listen', activities: ['listen', 'listen', 'match'], maxLevel: 3, content: { pool: 'family' } },
      { id: 'listen-numbers', titleFi: 'Numerot', titleEn: 'Numbers', icon: '🔢', activity: 'listen', activities: ['listen', 'listen', 'match'], maxLevel: 3, content: { pool: 'numbers' } },
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
    ],
  },
  {
    id: 'where',
    titleFi: 'Missä se on',
    titleEn: 'Where things are',
    accent: '#0d9488',
    icon: '📍',
    skills: [
      { id: 'postpositions', titleFi: 'Edessä, takana…', titleEn: 'In front, behind…', icon: '📍', activity: 'build', activities: ['build', 'build', 'order', 'spell'], maxLevel: 4, content: { constructionIds: ['in-front-of', 'behind', 'next-to', 'under'] }, exampleFi: 'kissan edessä' },
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
        activities: ['build', 'build', 'build', 'order', 'order', 'order', 'spell', 'spell'],
        maxLevel: 8,
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
      { id: 'count', titleFi: 'Laske ja sano', titleEn: 'Count & say', icon: '🔢', activity: 'count', activities: ['count', 'count', 'count', 'count', 'count', 'build', 'order', 'spell'], maxLevel: 8, content: { pool: 'nouns' } },
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
      // Depth 4 = the verb's real grammar ceiling: one new sourced tense×polarity
      // set unlocks per level (present+ L1 → present- L2 → past+ L3), each
      // drilled across all six persons. Those combos are the whole of what the
      // data carries (imperative is 2nd-person-only and doesn't fit the "pick
      // the person's form" drill), so the climb comes from the steepening
      // promotion needing a sustained streak. L4 swaps to `match` (the global
      // mixed-noun pool, not a verb drill) as this node's "different game" step.
      { id: 'conjugate', titleFi: 'Taivuta verbi', titleEn: 'Verbs (I / you / he)', icon: '🏃', activity: 'conjugate', activities: ['conjugate', 'conjugate', 'conjugate', 'match'], maxLevel: 4, content: {} },
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
      { id: 'order', titleFi: 'Järjestä sanat', titleEn: 'Word order', icon: '🔀', activity: 'order', maxLevel: 8, content: {} },
      // Same reasoning as `order` above — self-ramps via the inflected-form
      // grammar, no second game.
      { id: 'spell', titleFi: 'Kirjoita sana', titleEn: 'Spelling', icon: '⌨️', activity: 'spell', maxLevel: 8, content: { pool: 'nouns', inflected: true } },
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
// No second game type: no other round builder consumes `SentenceConstruction[]`,
// so this node stays single-activity (progression is the tier-gated templates).
const HAS_SENTENCES = sentenceConstructions.length > 0;

const sentenceSkills: SkillNode[] = HAS_SENTENCES
  ? [
      {
        id: 'full-sentences',
        titleFi: 'Rakenna lauseita',
        titleEn: 'Build sentences',
        icon: '📝',
        activity: 'sentence',
        maxLevel: 8,
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

export const PATH: Chapter[] = [...baseChapters, sentencesChapter];

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

/** Which activity a skill renders at a given measured level (see `activities`). */
export function activityForLevel(skill: SkillNode, level: number): ActivityKind {
  if (!skill.activities || skill.activities.length === 0) return skill.activity;
  const index = Math.min(Math.max(1, level), skill.activities.length) - 1;
  return skill.activities[index];
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

/** Render a skill's game wired to its content scope at the given measured level
 *  (which may pick a different activity — see `SkillNode.activities`). The caller
 *  (ActivityRoute) supplies the ActivityContext that hands down adaptive
 *  difficulty + round recording. */
export function renderSkill(
  skill: SkillNode,
  level: number,
  onExit: () => void,
): ReactElement | null {
  const items = itemsForPool(skill.content.pool);
  switch (activityForLevel(skill, level)) {
    case 'listen':
      return <ListenAndTap items={items} onExit={onExit} />;
    case 'build':
      return (
        <BuildAPhrase
          items={items}
          constructions={constructionsFor(skill.content.constructionIds)}
          onExit={onExit}
        />
      );
    case 'count':
      return <CountAndSay nouns={items} numbers={numbers.items} onExit={onExit} />;
    case 'match':
      return <MatchTheWord adjectives={adjectives.items} nouns={items} onExit={onExit} />;
    case 'conjugate':
      return <ConjugateVerb verbs={verbs.items} onExit={onExit} />;
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
          onExit={onExit}
        />
      );
    case 'review':
      return null; // review has its own route (/review)
  }
}
