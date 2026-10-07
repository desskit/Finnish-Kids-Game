// Guided-course rules — pure functions over the PATH (units) and a child's
// stored progress. No React, no storage writes: the home screen, the routes and
// the tests all ask the same questions here.
//
// The rules, in order:
//   - Unit 1 is open. Unit n opens once unit n−1's checkpoint is passed (a unit
//     with no checkpoint — Mestari — never blocks anything after it).
//   - Inside an open unit, the lesson comes first: practice steps open once the
//     lesson has been read to the end.
//   - A step is DONE when its adaptive level reaches `doneAtLevel` (default 2).
//   - The checkpoint opens when every step is done; passing it completes the unit.
//   - A grown-up's `unlockAll` setting opens every unit and step.

import type { Child } from '../state/storage';
import { PATH, activitiesUpTo, type ActivityKind, type Chapter, type SkillNode } from './path';

export type Unit = Chapter;
export type Status = 'locked' | 'open' | 'done';

export const DEFAULT_DONE_LEVEL = 2;
/** Checkpoint defaults: ~3 questions per step, at least 8 in all, 80% to pass. */
export const DEFAULT_CHECKPOINT = { perStep: 3, minQuestions: 8, passRatio: 0.8 };

export const UNITS: readonly Unit[] = PATH;

export function unitIndex(unitId: string): number {
  return UNITS.findIndex((u) => u.id === unitId);
}

export function findUnit(unitId: string): Unit | undefined {
  return UNITS.find((u) => u.id === unitId);
}

export function lessonSeen(child: Child | null | undefined, lessonId: string): boolean {
  return !!child?.course?.lessonsSeen?.[lessonId];
}

export function checkpointPassed(child: Child | null | undefined, unitId: string): boolean {
  return !!child?.course?.checkpoints?.[unitId]?.passedAt;
}

export function hasCheckpoint(unit: Unit): boolean {
  return unit.checkpoint !== false;
}

export function stepLevel(child: Child | null | undefined, unit: Unit, step: SkillNode): number {
  return child?.progress?.[unit.id]?.[step.id]?.level ?? 1;
}

export function stepDone(child: Child | null | undefined, unit: Unit, step: SkillNode): boolean {
  return stepLevel(child, unit, step) >= (step.doneAtLevel ?? DEFAULT_DONE_LEVEL);
}

export function allStepsDone(child: Child | null | undefined, unit: Unit): boolean {
  return unit.skills.every((s) => stepDone(child, unit, s));
}

/** Is the unit itself finished? (Mestari, with no checkpoint, never is.) */
export function unitComplete(child: Child | null | undefined, unit: Unit): boolean {
  return hasCheckpoint(unit) && checkpointPassed(child, unit.id);
}

export function unitStatus(
  child: Child | null | undefined,
  unit: Unit,
  unlockAll = false,
): Status {
  if (unitComplete(child, unit)) return 'done';
  if (unlockAll) return 'open';
  const i = unitIndex(unit.id);
  if (i <= 0) return 'open';
  const prev = UNITS[i - 1];
  // A checkpoint-less unit never gates the next one.
  return !hasCheckpoint(prev) || checkpointPassed(child, prev.id) ? 'open' : 'locked';
}

export function stepStatus(
  child: Child | null | undefined,
  unit: Unit,
  step: SkillNode,
  unlockAll = false,
): Status {
  if (stepDone(child, unit, step)) return 'done';
  if (unlockAll) return 'open';
  if (unitStatus(child, unit) === 'locked') return 'locked';
  return lessonSeen(child, unit.lessonId) ? 'open' : 'locked';
}

export function checkpointStatus(
  child: Child | null | undefined,
  unit: Unit,
  unlockAll = false,
): Status {
  if (checkpointPassed(child, unit.id)) return 'done';
  if (unlockAll) return 'open';
  if (unitStatus(child, unit) === 'locked') return 'locked';
  return allStepsDone(child, unit) ? 'open' : 'locked';
}

export type NextAction =
  | { kind: 'lesson'; unit: Unit }
  | { kind: 'step'; unit: Unit; step: SkillNode }
  | { kind: 'checkpoint'; unit: Unit };

/**
 * The one thing to do next — the home screen's "Continue" button. The first
 * unfinished unit's lesson, else its first unfinished step, else its
 * checkpoint. Once every checkpoint is passed it points into Mestari, at its
 * least-practised step.
 */
export function nextAction(child: Child | null | undefined): NextAction {
  for (const unit of UNITS) {
    if (unitComplete(child, unit)) continue;
    if (!lessonSeen(child, unit.lessonId)) return { kind: 'lesson', unit };
    const step = unit.skills.find((s) => !stepDone(child, unit, s));
    if (step) return { kind: 'step', unit, step };
    if (hasCheckpoint(unit)) return { kind: 'checkpoint', unit };
    // An open-ended unit with everything "done": keep climbing its lowest step.
    const lowest = [...unit.skills].sort(
      (a, b) => stepLevel(child, unit, a) - stepLevel(child, unit, b),
    )[0];
    return { kind: 'step', unit, step: lowest };
  }
  const last = UNITS[UNITS.length - 1];
  return { kind: 'step', unit: last, step: last.skills[0] };
}

/** Where a NextAction routes. */
export function actionHref(a: NextAction): string {
  switch (a.kind) {
    case 'lesson':
      return `/lesson/${a.unit.lessonId}`;
    case 'step':
      return `/skill/${a.step.id}`;
    case 'checkpoint':
      return `/checkpoint/${a.unit.id}`;
  }
}

/** Units completed so far (for progress copy). */
export function unitsCompleted(child: Child | null | undefined): number {
  return UNITS.filter((u) => unitComplete(child, u)).length;
}

// --- Checkpoints -------------------------------------------------------------

export interface CheckpointPart {
  step: SkillNode;
  /** The game to play for this part (the step's top game at its done level). */
  activity: ActivityKind;
  /** Questions to ask from this step. */
  questions: number;
  /** Level to play at (the step's done level — what the child has proven). */
  level: number;
}

/** The ordered parts of a unit's checkpoint (empty for Mestari). */
export function checkpointPlan(unit: Unit): CheckpointPart[] {
  if (!hasCheckpoint(unit) || unit.skills.length === 0) return [];
  const cfg = { ...DEFAULT_CHECKPOINT, ...(unit.checkpoint || {}) };
  const perStep = Math.max(cfg.perStep, Math.ceil(cfg.minQuestions / unit.skills.length));
  return unit.skills.map((step) => {
    const level = step.doneAtLevel ?? DEFAULT_DONE_LEVEL;
    const unlocked = activitiesUpTo(step, level);
    return { step, activity: unlocked[unlocked.length - 1], questions: perStep, level };
  });
}

export function checkpointPassRatio(unit: Unit): number {
  return (unit.checkpoint && unit.checkpoint.passRatio) || DEFAULT_CHECKPOINT.passRatio;
}

// --- Lessons ↔ units -----------------------------------------------------------

export function unitForLesson(lessonId: string): Unit | undefined {
  return UNITS.find((u) => u.lessonId === lessonId);
}

/** The first unit whose steps drill a construction — its lesson explains it. */
export function lessonForConstruction(constructionId: string): string | undefined {
  for (const unit of UNITS) {
    if (unit.skills.some((s) => s.content.constructionIds?.includes(constructionId))) {
      return unit.lessonId;
    }
  }
  return undefined;
}

/** Lessons the child can open in the Notebook (open or finished units). */
export function notebookLessonIds(child: Child | null | undefined, unlockAll = false): string[] {
  return UNITS.filter((u) => unitStatus(child, u, unlockAll) !== 'locked').map((u) => u.lessonId);
}
