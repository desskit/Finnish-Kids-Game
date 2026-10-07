// Achievements (badges) — kid-facing milestones, derived PURELY from what a
// child already accumulates (stars, the SRS log, per-step progress, the course
// record, the streak). Nothing here mutates state: every badge is a MEASURE
// (`have` / `need`), so the UI can show exactly what's left ("7 / 10 words"),
// diff "before vs after a round" to celebrate a new one, and the parent view
// can show which milestones were hit and why.
//
// Balance (after the course grew to 24 units and "done" became "top level
// proven"): early badges come in the first sessions to show how it works; the
// course badges track real progress (a checkpoint, halfway, the end); the skill
// badges reward exactly the hard parts — typing whole sentences, mixed review,
// conversations — so nobody is tempted to skip them.

import type { Child } from '../state/storage';
import { isMastered, wordSchedules } from './srs';

export type BadgeCategory = 'start' | 'course' | 'words' | 'skills' | 'habits';

export const BADGE_CATEGORIES: { id: BadgeCategory; titleFi: string; titleEn: string }[] = [
  { id: 'start', titleFi: 'Alku', titleEn: 'Getting started' },
  { id: 'course', titleFi: 'Kurssi', titleEn: 'The course' },
  { id: 'skills', titleFi: 'Taidot', titleEn: 'Skills' },
  { id: 'words', titleFi: 'Sanat', titleEn: 'Words' },
  { id: 'habits', titleFi: 'Tavat', titleEn: 'Habits' },
];

/** How far along a badge is. Earned when `have >= need`. */
export interface BadgeProgress {
  have: number;
  need: number;
  /** What the numbers count, for the progress line ("words", "days in a row"). */
  unit: string;
}

/** Facts about the content the badge rules measure against (kept out of `Child`). */
export interface BadgeEnv {
  /** Units that end in a checkpoint (every unit but Mestari). */
  checkpointUnitIds: string[];
  /** Sentence (phrase) steps — the ones whose top level includes typing. */
  phraseStepIds: string[];
  /** Kertaus (mixed review) steps. */
  kertausStepIds: string[];
  /** Conversation (scene) steps. */
  conversationStepIds: string[];
  /** skillId → the kinds of game its ladder plays, by level (index 0 = level 1). */
  skillKinds: Record<string, string[]>;
  /** Every kind of game in the course (speech excluded — it needs a microphone). */
  allKinds: string[];
}

export interface Badge {
  id: string;
  emoji: string;
  titleFi: string;
  titleEn: string;
  category: BadgeCategory;
  /** Exactly what earns it, in kid words. */
  hintEn: string;
  measure: (child: Child, env: BadgeEnv) => BadgeProgress;
}

// --- Measures -----------------------------------------------------------------

const entries = (child: Child) =>
  Object.values(child.progress ?? {}).flatMap((topic) => Object.entries(topic ?? {}));

const passedCheckpoints = (child: Child) =>
  Object.values(child.course?.checkpoints ?? {}).filter((c) => c.passedAt);

/** Steps (of a set) whose top level is proven. */
const provenAmong = (child: Child, ids: string[] | null) =>
  entries(child).filter(([id, p]) => p?.topProvenAt && (!ids || ids.includes(id))).length;

const playsOf = (child: Child, ids: string[]) =>
  entries(child)
    .filter(([id]) => ids.includes(id))
    .reduce((n, [, p]) => n + (p?.plays ?? 0), 0);

/** Kinds of game a child has actually been served: each played step's ladder up to its level. */
export function kindsPlayed(child: Child, env: BadgeEnv): Set<string> {
  const out = new Set<string>();
  for (const [id, p] of entries(child)) {
    if (!p || (p.plays ?? 0) === 0) continue;
    const ladder = env.skillKinds[id];
    if (!ladder) continue;
    for (const k of ladder.slice(0, Math.max(1, p.level ?? 1))) out.add(k);
  }
  return out;
}

const count = (have: number, need: number, unit: string): BadgeProgress => ({
  have: Math.min(have, need),
  need,
  unit,
});

// --- The catalog ----------------------------------------------------------------

export const BADGES: Badge[] = [
  // Getting started
  {
    id: 'first-steps',
    emoji: '🌱',
    titleFi: 'Ensiaskeleet',
    titleEn: 'First steps',
    category: 'start',
    hintEn: 'Finish your first practice round.',
    measure: (c) => count(entries(c).some(([, p]) => (p?.plays ?? 0) > 0) ? 1 : 0, 1, 'round'),
  },
  {
    id: 'bookworm',
    emoji: '📓',
    titleFi: 'Lukutoukka',
    titleEn: 'Bookworm',
    category: 'start',
    hintEn: 'Read 10 lessons all the way to the end.',
    measure: (c) => count(Object.keys(c.course?.lessonsSeen ?? {}).length, 10, 'lessons'),
  },
  {
    id: 'stars-100',
    emoji: '⭐',
    titleFi: 'Tähtien keräilijä',
    titleEn: 'Star collector',
    category: 'start',
    hintEn: 'Earn 100 stars (one for every right answer).',
    measure: (c) => count(c.stars, 100, 'stars'),
  },

  // The course
  {
    id: 'level-up',
    emoji: '🚀',
    titleFi: 'Huipulla',
    titleEn: 'Top of the ladder',
    category: 'course',
    hintEn: 'Pass the TOP level of any practice step (that finishes the step).',
    measure: (c) => count(provenAmong(c, null), 1, 'step'),
  },
  {
    id: 'first-checkpoint',
    emoji: '🏁',
    titleFi: 'Ensimmäinen välitesti',
    titleEn: 'First checkpoint',
    category: 'course',
    hintEn: 'Pass your first unit checkpoint.',
    measure: (c) => count(passedCheckpoints(c).length, 1, 'checkpoint'),
  },
  {
    id: 'flawless',
    emoji: '✨',
    titleFi: 'Virheetön',
    titleEn: 'Flawless',
    category: 'course',
    hintEn: 'Pass a checkpoint with EVERY question right on the first try.',
    measure: (c) =>
      count(Object.values(c.course?.checkpoints ?? {}).some((r) => r.best >= 1) ? 1 : 0, 1, 'checkpoint'),
  },
  {
    id: 'halfway',
    emoji: '🗺️',
    titleFi: 'Puolivälissä',
    titleEn: 'Halfway there',
    category: 'course',
    hintEn: 'Pass half of the unit checkpoints.',
    measure: (c, env) =>
      count(passedCheckpoints(c).length, Math.ceil(env.checkpointUnitIds.length / 2), 'checkpoints'),
  },
  {
    id: 'course-done',
    emoji: '🎓',
    titleFi: 'Kurssi valmis',
    titleEn: 'Course complete',
    category: 'course',
    hintEn: 'Pass EVERY unit checkpoint — the whole course.',
    measure: (c, env) => count(passedCheckpoints(c).length, env.checkpointUnitIds.length, 'checkpoints'),
  },

  // Skills — the hard parts, rewarded so they're never skipped
  {
    id: 'writer',
    emoji: '⌨️',
    titleFi: 'Kirjoittaja',
    titleEn: 'Writer',
    category: 'skills',
    hintEn: 'Finish 10 sentence steps — their top level has you TYPE the sentence.',
    measure: (c, env) => count(provenAmong(c, env.phraseStepIds), 10, 'sentence steps'),
  },
  {
    id: 'memory',
    emoji: '🔁',
    titleFi: 'Muistaja',
    titleEn: 'Memory keeper',
    category: 'skills',
    hintEn: 'Finish every Kertaus (mixed review) step.',
    measure: (c, env) => count(provenAmong(c, env.kertausStepIds), env.kertausStepIds.length, 'reviews'),
  },
  {
    id: 'chatter',
    emoji: '💬',
    titleFi: 'Juttelija',
    titleEn: 'Chatterbox',
    category: 'skills',
    hintEn: 'Hold 15 whole conversations in Finnish.',
    measure: (c, env) => count(playsOf(c, env.conversationStepIds), 15, 'conversations'),
  },
  {
    id: 'sharp',
    emoji: '🎯',
    titleFi: 'Tarkka',
    titleEn: 'Sharpshooter',
    category: 'skills',
    hintEn: 'Answer at least 100 word questions, 90% of them right on the first try.',
    measure: (c) => {
      const s = wordSchedules(c.srs);
      const seen = s.reduce((n, x) => n + x.seen, 0);
      if (seen < 100) return count(seen, 100, 'answers');
      const pct = Math.floor((100 * s.reduce((n, x) => n + x.correct, 0)) / seen);
      return count(pct, 90, '% right');
    },
  },
  {
    id: 'all-games',
    emoji: '🎮',
    titleFi: 'Pelimestari',
    titleEn: 'Game master',
    category: 'skills',
    hintEn: 'Play every kind of game in the course.',
    measure: (c, env) => count(kindsPlayed(c, env).size, env.allKinds.length, 'kinds of game'),
  },
  {
    id: 'stars-500',
    emoji: '🌟',
    titleFi: 'Tähtimestari',
    titleEn: 'Star champion',
    category: 'skills',
    hintEn: 'Earn 500 stars.',
    measure: (c) => count(c.stars, 500, 'stars'),
  },

  // Words
  {
    id: 'words-25',
    emoji: '📚',
    titleFi: 'Sanojen oppija',
    titleEn: 'Word learner',
    category: 'words',
    hintEn: 'Practice 25 different words.',
    measure: (c) => count(wordSchedules(c.srs).filter((s) => s.seen > 0).length, 25, 'words'),
  },
  {
    id: 'words-100',
    emoji: '📖',
    titleFi: 'Kävelevä sanakirja',
    titleEn: 'Walking dictionary',
    category: 'words',
    hintEn: 'Practice 100 different words.',
    measure: (c) => count(wordSchedules(c.srs).filter((s) => s.seen > 0).length, 100, 'words'),
  },
  {
    id: 'mastered-10',
    emoji: '🏆',
    titleFi: 'Sanamestari',
    titleEn: 'Word master',
    category: 'words',
    hintEn: 'Master 10 words — right again and again, days apart, until Review stops asking.',
    measure: (c) => count(wordSchedules(c.srs).filter(isMastered).length, 10, 'words mastered'),
  },
  {
    id: 'mastered-50',
    emoji: '👑',
    titleFi: 'Sanakuningas',
    titleEn: 'Word royalty',
    category: 'words',
    hintEn: 'Master 50 words.',
    measure: (c) => count(wordSchedules(c.srs).filter(isMastered).length, 50, 'words mastered'),
  },

  // Habits
  {
    id: 'streak-3',
    emoji: '🔥',
    titleFi: 'Vauhdissa',
    titleEn: 'On a roll',
    category: 'habits',
    hintEn: 'Practice 3 days in a row.',
    measure: (c) => count(bestStreak(c), 3, 'days in a row'),
  },
  {
    id: 'streak-7',
    emoji: '📅',
    titleFi: 'Viikko putkeen',
    titleEn: 'A whole week',
    category: 'habits',
    hintEn: 'Practice 7 days in a row.',
    measure: (c) => count(bestStreak(c), 7, 'days in a row'),
  },
];

/** The longest streak ever reached (so a missed day never takes a badge away). */
function bestStreak(c: Child): number {
  return Math.max(c.bestStreakDays ?? 0, c.streakDays ?? 0);
}

export function badgeById(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}

export function badgeProgress(child: Child, env: BadgeEnv, badge: Badge): BadgeProgress {
  return badge.measure(child, env);
}

/** The set of badge ids a child has earned, given the content env. Pure. */
export function earnedBadgeIds(child: Child, env: BadgeEnv): Set<string> {
  const earned = new Set<string>();
  for (const b of BADGES) {
    const p = b.measure(child, env);
    if (p.need > 0 && p.have >= p.need) earned.add(b.id);
  }
  return earned;
}

/** The earned badges as full descriptors, in catalog order. */
export function earnedBadges(child: Child, env: BadgeEnv): Badge[] {
  const ids = earnedBadgeIds(child, env);
  return BADGES.filter((b) => ids.has(b.id));
}
