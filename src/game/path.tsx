import type { ReactElement } from 'react';
import type { Construction, LexicalItem } from '../content/types';
import { animals, food, family, numbers, adjectives, verbs } from '../content';
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
export type Pool = 'nouns' | 'animals' | 'food' | 'family' | 'numbers';

export interface SkillContent {
  /** Vocab pool (default 'nouns' = all noun topics mixed). */
  pool?: Pool;
  /** For build/order: which carrier phrases to drill (default = all). */
  constructionIds?: string[];
}

export interface SkillNode {
  /** Stable id used in the URL (/skill/:id) and as the progress key. */
  id: string;
  titleFi: string;
  titleEn: string;
  /** Emoji placeholder; replaced by `art` when present. */
  icon: string;
  activity: ActivityKind;
  content: SkillContent;
  /** Optional teaching example shown under the node, e.g. "Tämä on kissa." */
  exampleFi?: string;
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

const NOUNS: LexicalItem[] = [...animals.items, ...food.items, ...family.items];

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
    default:
      return NOUNS;
  }
}

function constructionsFor(ids?: string[]): Construction[] {
  if (!ids) return nounConstructions;
  return nounConstructions.filter((c) => ids.includes(c.id));
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
    skills: [
      { id: 'listen-animals', titleFi: 'Eläimet', titleEn: 'Animals', icon: '🐾', activity: 'listen', content: { pool: 'animals' } },
      { id: 'listen-food', titleFi: 'Ruoka', titleEn: 'Food', icon: '🍎', activity: 'listen', content: { pool: 'food' } },
      { id: 'listen-family', titleFi: 'Perhe', titleEn: 'Family', icon: '👪', activity: 'listen', content: { pool: 'family' } },
      { id: 'listen-numbers', titleFi: 'Numerot', titleEn: 'Numbers', icon: '🔢', activity: 'listen', content: { pool: 'numbers' } },
    ],
  },
  {
    id: 'naming',
    titleFi: 'Nimeä ja omista',
    titleEn: 'Naming & having',
    accent: '#6366f1',
    icon: '🧩',
    skills: [
      { id: 'this-is', titleFi: 'Tämä on…', titleEn: 'This is a…', icon: '🧩', activity: 'build', content: { constructionIds: ['this-is'] }, exampleFi: 'Tämä on kissa.' },
      { id: 'where-is', titleFi: 'Missä on…?', titleEn: 'Where is…?', icon: '❓', activity: 'build', content: { constructionIds: ['where-is'] }, exampleFi: 'Missä on koira?' },
      { id: 'i-have', titleFi: 'Minulla on…', titleEn: 'I have a…', icon: '🎒', activity: 'build', content: { constructionIds: ['i-have'] }, exampleFi: 'Minulla on kala.' },
    ],
  },
  {
    id: 'where',
    titleFi: 'Missä se on',
    titleEn: 'Where things are',
    accent: '#0d9488',
    icon: '📍',
    skills: [
      { id: 'postpositions', titleFi: 'Edessä, takana…', titleEn: 'In front, behind…', icon: '📍', activity: 'build', content: { constructionIds: ['in-front-of', 'behind', 'next-to', 'under'] }, exampleFi: 'kissan edessä' },
    ],
  },
  {
    id: 'likes',
    titleFi: 'Tykkää ja näe',
    titleEn: 'Likes & seeing',
    accent: '#db2777',
    icon: '❤️',
    skills: [
      { id: 'i-like', titleFi: 'Pidän …sta', titleEn: 'I like…', icon: '❤️', activity: 'build', content: { constructionIds: ['i-like'] }, exampleFi: 'Pidän kissasta.' },
      { id: 'i-see', titleFi: 'Näen …n', titleEn: 'I see…', icon: '👀', activity: 'build', content: { constructionIds: ['i-see'] }, exampleFi: 'Näen koiran.' },
    ],
  },
  {
    id: 'numbers-describe',
    titleFi: 'Laske ja kuvaile',
    titleEn: 'Numbers & describing',
    accent: '#f59e0b',
    icon: '🔢',
    skills: [
      { id: 'count', titleFi: 'Laske ja sano', titleEn: 'Count & say', icon: '🔢', activity: 'count', content: { pool: 'nouns' } },
      { id: 'match', titleFi: 'Yhdistä sanat', titleEn: 'Describe it', icon: '🎨', activity: 'match', content: { pool: 'nouns' } },
    ],
  },
  {
    id: 'actions',
    titleFi: 'Tekeminen',
    titleEn: 'Actions',
    accent: '#16a34a',
    icon: '🏃',
    skills: [
      { id: 'conjugate', titleFi: 'Taivuta verbi', titleEn: 'Verbs (I / you / he)', icon: '🏃', activity: 'conjugate', content: {} },
    ],
  },
  {
    id: 'together',
    titleFi: 'Kokoa yhteen',
    titleEn: 'Put it together',
    accent: '#7c3aed',
    icon: '🔀',
    skills: [
      { id: 'order', titleFi: 'Järjestä sanat', titleEn: 'Word order', icon: '🔀', activity: 'order', content: {} },
      { id: 'spell', titleFi: 'Kirjoita sana', titleEn: 'Spelling', icon: '⌨️', activity: 'spell', content: { pool: 'nouns' } },
      { id: 'review', titleFi: 'Kertaus', titleEn: 'Review', icon: '🔁', activity: 'review', content: {} },
    ],
  },
];

// Advanced final chapter — its nodes are GENERATED from the sentence registry,
// which ships empty (see src/content/sentences.ts). Authoring a template there
// makes a playable node appear here automatically; until then it shows a
// friendly "coming soon" placeholder on the map.
const sentenceSkills: SkillNode[] = sentenceConstructions.map((t) => ({
  id: `sentence-${t.id}`,
  titleFi: t.en,
  titleEn: t.en,
  icon: '📝',
  activity: 'sentence',
  content: {},
}));

const sentencesChapter: Chapter = {
  id: 'sentences',
  titleFi: 'Kokonaiset lauseet',
  titleEn: 'Full sentences',
  accent: '#64748b',
  icon: '📝',
  comingSoon: true,
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
};

// --- Rendering ------------------------------------------------------------

const SENTENCE_QUESTIONS = 6;

/** Render a skill's game wired to its content scope. (ActivityRoute supplies the
 *  ActivityContext that hands down adaptive difficulty + round recording.) */
export function renderSkill(skill: SkillNode, onExit: () => void): ReactElement | null {
  const items = itemsForPool(skill.content.pool);
  switch (skill.activity) {
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
    case 'spell':
      return <SpellWord items={items} onExit={onExit} />;
    case 'sentence':
      return (
        <WordOrder
          title="Lauseet · Sentences"
          buildRound={() =>
            buildSentenceRound(sentenceConstructions, SENTENCE_POOLS, SENTENCE_QUESTIONS)
          }
          onExit={onExit}
        />
      );
    case 'review':
      return null; // review has its own route (/review)
  }
}
