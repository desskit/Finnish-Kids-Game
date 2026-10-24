import type { ActivityKind, Chapter, SkillNode } from './path';
import type { MathSet } from './math';
import type { ArtId } from '../art/generated/manifest';

// The math section — Lasketaan! (Let's count!) — an optional path beside the
// course: math done in Finnish, so a child can't just see the numbers and do
// it in English in their head. No digit is ever shown: numbers are Finnish
// words and Finnish speech, and the answer is always a Finnish word.
//
// Its STAGES are built like the course's units (`Chapter`): a lesson, a few
// games with levels, a math story, and a test that wins the stage's crown.
// The games play through the same /skill/:id route, so levels, stars,
// adaptive difficulty and the daily streak work as in the course — but math
// is kept apart from it: no stage is a unit, its crowns aren't checkpoints,
// and it never moves "units done", Continue or a course badge (every id here
// starts `math-`, which the course side leaves out).
//
// A stage opens once the stage before it has its crown (or the one it names,
// `afterStage`: the shop and the clock branch off after word problems) and the
// course has taught what it needs (`afterUnit`).

/** Every math id starts so: stages, games, lessons, stories. */
export const MATH_PREFIX = 'math-';
export const isMathId = (id: string): boolean => id.startsWith(MATH_PREFIX);

export interface MathStage extends Chapter {
  /** The course unit whose checkpoint the stage also waits for. */
  afterUnit?: string;
  /** The stage whose crown opens it (default: the one before it). */
  afterStage?: string;
  /** The crown its test wins (its picture). */
  crown: ArtId;
}

/** Typing the answer word: a bonus round now and then, from level 2. */
const TYPE_IT = { kind: 'math-type' as ActivityKind, fromLevel: 2, every: 4 };

/** A math game: its problems (`set`), its own game, a ladder of `maxLevel`. */
function game(id: string, titleFi: string, titleEn: string, icon: string, activity: ActivityKind, set: MathSet, maxLevel = 3): SkillNode {
  return {
    id: `${MATH_PREFIX}${id}`,
    titleFi,
    titleEn,
    icon,
    activity,
    maxLevel,
    content: { math: set },
    minor: TYPE_IT,
  };
}

/** A stage's math story, read once for meaning, like the course's. */
function story(id: string, storyId: string): SkillNode {
  return { id: `${MATH_PREFIX}${id}`, titleFi: 'Tarina', titleEn: 'A math story', icon: '📖', activity: 'story', content: { ids: [storyId] } };
}

const CHECK = { perStep: 3, passRatio: 0.8 };

export const MATH_STAGES: MathStage[] = [
  {
    id: 'math-plus-minus',
    titleFi: 'Plus ja miinus',
    titleEn: 'Plus and minus',
    blurbEn: 'Add and take away — all in Finnish.',
    accent: '#e11d48',
    icon: '🍎',
    crown: 'math-crown-red',
    lessonId: 'math-plus-minus',
    afterUnit: 'numbers',
    newWords: [],
    checkpoint: CHECK,
    skills: [
      game('apple-tree', 'Omenapuu', 'The apple tree', '🍎', 'math-tree', 'sums-10'),
      game('sums-10', 'Kuuntele ja laske', 'Listen and count', '👂', 'math-listen', 'sums-10', 4),
      story('plus-minus-story', 'math-buns'),
    ],
  },
  {
    id: 'math-more-less',
    titleFi: 'Enemmän vai vähemmän?',
    titleEn: 'More or less?',
    blurbEn: 'Which is more? What comes next? Count on the train.',
    accent: '#d97706',
    icon: '⚖️',
    crown: 'math-crown-orange',
    lessonId: 'math-more-less',
    newWords: [],
    checkpoint: CHECK,
    skills: [
      game('scale', 'Vaaka', 'The scale', '⚖️', 'math-scale', 'compare-12'),
      game('train-12', 'Juna', 'The train', '🚂', 'math-train', 'run-12'),
      game('neighbors-12', 'Ennen ja jälkeen', 'Before and after', '👂', 'math-listen', 'neighbors-12', 4),
      story('more-less-story', 'math-cars'),
    ],
  },
  {
    id: 'math-how-many',
    titleFi: 'Montako nyt?',
    titleEn: 'How many now?',
    blurbEn: 'Word problems: get more, eat some, give some away.',
    accent: '#16a34a',
    icon: '🧺',
    crown: 'math-crown-green',
    lessonId: 'math-how-many',
    afterUnit: 'doing',
    newWords: [],
    checkpoint: CHECK,
    skills: [
      game('word', 'Montako nyt?', 'How many now?', '🧺', 'math-word', 'word'),
      game('word-listen', 'Kuuntele tarina', 'Listen to the story', '👂', 'math-listen', 'word', 4),
      game('quick-10', 'Nopeasti!', 'Quick!', '⚡', 'math-quick', 'sums-10', 2),
      story('how-many-story', 'math-berries'),
    ],
  },
  {
    id: 'math-teens',
    titleFi: 'Yksitoista, kaksitoista…',
    titleEn: 'The -toista numbers',
    blurbEn: 'The numbers after kymmenen, and bigger sums.',
    accent: '#7c3aed',
    icon: '🚀',
    crown: 'math-crown-purple',
    lessonId: 'math-teens',
    newWords: [],
    checkpoint: CHECK,
    skills: [
      game('teens', 'Rakenna luku', 'Build the number', '🧱', 'math-build', 'teens'),
      game('train-20', 'Raketti ja juna', 'The rocket and the train', '🚀', 'math-train', 'run-20'),
      game('sums-20', 'Kuuntele ja laske', 'Listen and count', '👂', 'math-listen', 'sums-20', 4),
      story('teens-story', 'math-stones'),
    ],
  },
  {
    id: 'math-tens',
    titleFi: 'Kymmenen, kaksikymmentä…',
    titleEn: 'The -kymmentä numbers',
    blurbEn: 'Count in tens all the way to sata, and add and take away tens.',
    accent: '#0d9488',
    icon: '🧱',
    crown: 'math-crown-teal',
    lessonId: 'math-tens',
    newWords: [],
    checkpoint: CHECK,
    skills: [
      game('tens-build', 'Kymmenet', 'The tens', '🧱', 'math-build', 'tens-parts'),
      game('tens-train', 'Juna', 'Counting in tens', '🚂', 'math-train', 'run-tens'),
      game('tens-sums', 'Kuuntele ja laske', 'Listen and count', '👂', 'math-listen', 'tens-sums', 4),
      story('tens-story', 'math-baking'),
    ],
  },
  {
    id: 'math-times',
    titleFi: 'Kertaa ja puolet',
    titleEn: 'Times and halves',
    blurbEn: 'Times tables and halves, said the Finnish way.',
    accent: '#db2777',
    icon: '🍓',
    crown: 'math-crown-pink',
    lessonId: 'math-times',
    newWords: [],
    checkpoint: CHECK,
    skills: [
      game('times', 'Kertaa', 'Times', '🍪', 'math-listen', 'times', 4),
      game('halves', 'Puolet', 'Halves', '🍓', 'math-listen', 'halves', 4),
      game('quick-times', 'Nopeasti!', 'Quick!', '⚡', 'math-quick', 'times', 2),
      story('times-story', 'math-picnic'),
    ],
  },
  {
    id: 'math-shop',
    titleFi: 'Paljonko se maksaa?',
    titleEn: 'How much is it?',
    blurbEn: 'Prices in euros: add them up, and pay with coins.',
    accent: '#b45309',
    icon: '💶',
    crown: 'math-crown-amber',
    lessonId: 'math-shop',
    afterStage: 'math-how-many',
    afterUnit: 'shop',
    newWords: [],
    checkpoint: CHECK,
    skills: [
      game('prices', 'Yhteensä', 'In all', '💶', 'math-shop', 'shop-totals', 4),
      game('pay', 'Maksa!', 'Pay with coins', '🛒', 'math-pay', 'shop-pay'),
      story('shop-story', 'math-shopping'),
    ],
  },
  {
    id: 'math-clock',
    titleFi: 'Mitä kello on?',
    titleEn: 'What time is it?',
    blurbEn: 'An hour later, an hour earlier, and half past — on the clock.',
    accent: '#2563eb',
    icon: '⏰',
    crown: 'math-crown-blue',
    lessonId: 'math-clock',
    afterStage: 'math-how-many',
    afterUnit: 'my-day',
    newWords: [],
    checkpoint: CHECK,
    skills: [
      game('clock-hour', 'Tunnin päästä, tunti sitten', 'In an hour, an hour ago', '⏰', 'math-clock', 'clock-hour'),
      game('clock-half', 'Puolen tunnin päästä', 'In half an hour', '🕧', 'math-clock', 'clock-half'),
      story('clock-story', 'math-train-time'),
    ],
  },
];

export interface FoundMathSkill {
  chapter: MathStage;
  skill: SkillNode;
}

/** A math game (or story step) by id. */
export function findMathSkill(id: string): FoundMathSkill | undefined {
  if (!isMathId(id)) return undefined;
  for (const chapter of MATH_STAGES) {
    const skill = chapter.skills.find((s) => s.id === id);
    if (skill) return { chapter, skill };
  }
  return undefined;
}

export function findMathStage(id: string): MathStage | undefined {
  return MATH_STAGES.find((s) => s.id === id);
}

/** The stage a math lesson belongs to. */
export function stageForLesson(lessonId: string): MathStage | undefined {
  return MATH_STAGES.find((s) => s.lessonId === lessonId);
}

/** The games a stage's test plays (its story is read, not tested). */
export const testedSteps = (stage: MathStage): SkillNode[] => stage.skills.filter((s) => s.activity !== 'story');

export interface MathTestPart {
  step: SkillNode;
  activity: ActivityKind;
  questions: number;
  /** Played at the top of the game's ladder: what the child has proven. */
  level: number;
}

/** A stage's test: each of its games, a few questions at its top level. */
export function mathTestPlan(stage: MathStage): MathTestPart[] {
  const per = stage.checkpoint ? stage.checkpoint.perStep : 3;
  return testedSteps(stage).map((step) => ({ step, activity: step.activity, questions: per, level: step.maxLevel ?? 3 }));
}

export const mathPassRatio = (stage: MathStage): number => (stage.checkpoint ? stage.checkpoint.passRatio : 0.8);
