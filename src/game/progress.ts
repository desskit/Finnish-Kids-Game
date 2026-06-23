// Pure progress reducer: fold a finished round into a child's per-topic,
// per-activity progress, including the adaptive-difficulty update. Kept separate
// and pure so the SAME function powers both persistence (the profile context's
// `recordRound`) and the look-ahead the UI uses to celebrate a level-up / a new
// badge at RoundComplete (compute "after" from "before", diff, show the delta).

import type { ActivityProgress, Child } from '../state/storage';
import { applyRound, MAX_LEVEL } from './adapt';

/** The adaptive level recorded for an activity (defaults to 1 before any play). */
export function activityLevel(
  child: Child | null | undefined,
  topicId: string,
  activityId: string,
): number {
  return child?.progress?.[topicId]?.[activityId]?.level ?? 1;
}

/**
 * Return a new Child with one finished round folded into its progress. Pure.
 * `maxLevel` is the skill node's own ladder depth (default = the engine's
 * ceiling, i.e. unbounded) — see `SkillNode.maxLevel`.
 */
export function recordRoundOnChild(
  child: Child,
  topicId: string,
  activityId: string,
  stars: number,
  total: number,
  maxLevel: number = MAX_LEVEL,
): Child {
  const topic = child.progress[topicId] ?? {};
  const prev = topic[activityId];
  const accuracy = total > 0 ? stars / total : 0;
  const adapt = applyRound(prev?.level ?? 1, prev?.recent ?? [], accuracy, maxLevel);

  const entry: ActivityProgress = {
    plays: (prev?.plays ?? 0) + 1,
    bestStars: Math.max(prev?.bestStars ?? 0, stars),
    totalStars: (prev?.totalStars ?? 0) + stars,
    totalPossible: (prev?.totalPossible ?? 0) + total,
    lastPlayed: Date.now(),
    level: adapt.level,
    recent: adapt.recent,
  };

  return {
    ...child,
    progress: { ...child.progress, [topicId]: { ...topic, [activityId]: entry } },
  };
}
