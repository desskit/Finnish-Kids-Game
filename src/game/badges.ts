// Achievement badges — kid-facing progression, derived PURELY from the measured
// stats a child already accumulates (stars, the SRS attempt log, and per-activity
// progress). Nothing here mutates state: `earnedBadgeIds` is a snapshot function,
// so the UI can diff "before vs after a round" to celebrate a newly-earned badge,
// and the parent dashboard can show exactly which milestones were hit and why.

import type { Child } from '../state/storage';
import { isMastered } from './srs';
import { MAX_LEVEL } from './adapt';

export interface Badge {
  id: string;
  emoji: string;
  titleFi: string;
  titleEn: string;
  /** One-line explanation of how it's earned (shown in the parent view). */
  hintEn: string;
}

/** Facts about the content the badge rules measure against (kept out of `Child`). */
export interface BadgeEnv {
  /** Number of topics on the map (for the "played every topic" badge). */
  topicCount: number;
  /** Every activity id in the registry (for the "played every game" badge). */
  activityIds: string[];
}

export const BADGES: Badge[] = [
  {
    id: 'first-steps',
    emoji: '🌱',
    titleFi: 'Ensiaskeleet',
    titleEn: 'First steps',
    hintEn: 'Finish your first round.',
  },
  {
    id: 'stars-25',
    emoji: '⭐',
    titleFi: '25 tähteä',
    titleEn: 'Star collector',
    hintEn: 'Earn 25 stars.',
  },
  {
    id: 'stars-100',
    emoji: '🌟',
    titleFi: '100 tähteä',
    titleEn: 'Star champion',
    hintEn: 'Earn 100 stars.',
  },
  {
    id: 'words-10',
    emoji: '📚',
    titleFi: '10 sanaa',
    titleEn: 'Word learner',
    hintEn: 'Practice 10 different words.',
  },
  {
    id: 'mastered-10',
    emoji: '🏆',
    titleFi: '10 hallittua',
    titleEn: 'Word master',
    hintEn: 'Master 10 words (top review box).',
  },
  {
    id: 'sharp',
    emoji: '🎯',
    titleFi: 'Tarkka',
    titleEn: 'Sharpshooter',
    hintEn: '90%+ first-try accuracy over 20+ words.',
  },
  {
    id: 'level-up',
    emoji: '🚀',
    titleFi: 'Huipputaso',
    titleEn: 'Top level',
    hintEn: 'Reach the hardest level in any game.',
  },
  {
    id: 'explorer',
    emoji: '🗺️',
    titleFi: 'Tutkija',
    titleEn: 'Explorer',
    hintEn: 'Play a round in every topic.',
  },
  {
    id: 'all-games',
    emoji: '🎮',
    titleFi: 'Kaikki pelit',
    titleEn: 'Game master',
    hintEn: 'Try every kind of game.',
  },
];

export function badgeById(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}

/** The set of badge ids a child has earned, given the content env. Pure. */
export function earnedBadgeIds(child: Child, env: BadgeEnv): Set<string> {
  const earned = new Set<string>();

  const progressEntries = Object.values(child.progress ?? {}).flatMap((topic) =>
    Object.values(topic),
  );
  const anyPlay = progressEntries.some((p) => (p?.plays ?? 0) > 0);
  if (anyPlay) earned.add('first-steps');

  if (child.stars >= 25) earned.add('stars-25');
  if (child.stars >= 100) earned.add('stars-100');

  const schedules = Object.values(child.srs ?? {});
  const practiced = schedules.filter((s) => s.seen > 0).length;
  if (practiced >= 10) earned.add('words-10');

  const mastered = schedules.filter(isMastered).length;
  if (mastered >= 10) earned.add('mastered-10');

  const totalSeen = schedules.reduce((n, s) => n + s.seen, 0);
  const totalCorrect = schedules.reduce((n, s) => n + s.correct, 0);
  if (totalSeen >= 20 && totalCorrect / totalSeen >= 0.9) earned.add('sharp');

  if (progressEntries.some((p) => (p?.level ?? 1) >= MAX_LEVEL)) earned.add('level-up');

  const playedTopics = Object.values(child.progress ?? {}).filter((topic) =>
    Object.values(topic).some((p) => (p?.plays ?? 0) > 0),
  ).length;
  if (env.topicCount > 0 && playedTopics >= env.topicCount) earned.add('explorer');

  const playedActivityIds = new Set(
    Object.values(child.progress ?? {}).flatMap((topic) =>
      Object.entries(topic)
        .filter(([, p]) => (p?.plays ?? 0) > 0)
        .map(([id]) => id),
    ),
  );
  if (
    env.activityIds.length > 0 &&
    env.activityIds.every((id) => playedActivityIds.has(id))
  ) {
    earned.add('all-games');
  }

  return earned;
}

/** The earned badges as full descriptors, in catalog order. */
export function earnedBadges(child: Child, env: BadgeEnv): Badge[] {
  const ids = earnedBadgeIds(child, env);
  return BADGES.filter((b) => ids.has(b.id));
}
