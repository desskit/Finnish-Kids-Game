// Guided-course rules — pure functions over the PATH (units) and a child's
// stored progress. No React, no storage writes: the home screen, the routes and
// the tests all ask the same questions here.
//
// The rules, in order:
//   - Unit 1 is open. Unit n opens once unit n−1's checkpoint is passed (a unit
//     with no checkpoint — Mestari — never blocks anything after it).
//   - Inside an open unit, the lesson comes first: practice steps open once the
//     lesson has been read to the end.
//   - A step is DONE when the child has PROVED its top level: reached its
//     `maxLevel` and cleared the promotion bar there (see `provesTop`), so every
//     challenge type on the step's ladder has been passed — none skipped.
//   - The checkpoint opens when every step is done; passing it completes the unit.
//   - A grown-up's `unlockAll` setting opens every unit and step.

import type { Child } from '../state/storage';
import {
  PATH,
  activitiesUpTo,
  isMixable,
  mixStepFor,
  type ActivityKind,
  type Chapter,
  type SkillNode,
} from './path';

export type Unit = Chapter;
export type Status = 'locked' | 'open' | 'done';

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

/** The level a step must be proven at — the top of its own ladder. */
export function topLevel(step: SkillNode): number {
  return step.maxLevel ?? 4;
}

export function stepDone(child: Child | null | undefined, unit: Unit, step: SkillNode): boolean {
  return !!child?.progress?.[unit.id]?.[step.id]?.topProvenAt;
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

export type MidLesson = NonNullable<Unit['midLessons']>[number];

/** The part-way lesson a step sits behind (the latest one placed at or before it). */
export function midLessonBefore(unit: Unit, step: SkillNode): MidLesson | undefined {
  const at = unit.skills.indexOf(step);
  let found: MidLesson | undefined;
  for (const ml of unit.midLessons ?? []) {
    const i = unit.skills.findIndex((s) => s.id === ml.before);
    if (i >= 0 && i <= at && (!found || i >= unit.skills.findIndex((s) => s.id === found!.before))) {
      found = ml;
    }
  }
  return found;
}

/** The lesson that explains a step: its part-way lesson, else the unit's. */
export function lessonForStep(unit: Unit, step: SkillNode): string {
  return midLessonBefore(unit, step)?.lessonId ?? unit.lessonId;
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
  if (!lessonSeen(child, unit.lessonId)) return 'locked';
  const ml = midLessonBefore(unit, step);
  return ml && !lessonSeen(child, ml.lessonId) ? 'locked' : 'open';
}

/** A part-way lesson: open once every step before it is done. */
export function midLessonStatus(
  child: Child | null | undefined,
  unit: Unit,
  ml: MidLesson,
  unlockAll = false,
): Status {
  if (lessonSeen(child, ml.lessonId)) return 'done';
  // A finished unit's lessons are always there to re-read.
  if (unlockAll || unitComplete(child, unit)) return 'open';
  if (unitStatus(child, unit) === 'locked' || !lessonSeen(child, unit.lessonId)) return 'locked';
  const at = unit.skills.findIndex((s) => s.id === ml.before);
  return unit.skills.slice(0, at).every((s) => stepDone(child, unit, s)) ? 'open' : 'locked';
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
  | { kind: 'lesson'; unit: Unit; lessonId: string }
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
    if (!lessonSeen(child, unit.lessonId)) return { kind: 'lesson', unit, lessonId: unit.lessonId };
    const step = unit.skills.find((s) => !stepDone(child, unit, s));
    if (step) {
      // Reached a part-way lesson not yet read? Read it first.
      const ml = midLessonBefore(unit, step);
      if (ml && !lessonSeen(child, ml.lessonId)) return { kind: 'lesson', unit, lessonId: ml.lessonId };
      return { kind: 'step', unit, step };
    }
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
      return `/lesson/${a.lessonId}`;
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
  /** The step whose game is played (for a Kertaus or "Muistatko?" part, the
   *  earlier step being revisited). */
  step: SkillNode;
  /** The game to play for this part. */
  activity: ActivityKind;
  /** Questions to ask from this step. */
  questions: number;
  /** Level to play at (the step's top level — what the child has proven). */
  level: number;
  /** The lesson that explains this part (for the "Why?" tip). */
  lessonId: string;
  /** 'remember' = the "Muistatko?" question from an earlier unit. */
  kind: 'step' | 'remember';
}

/** Questions in a checkpoint's "Muistatko?" (remember?) part. */
export const REMEMBER_QUESTIONS = 2;

/** The game a step contributes to a checkpoint. */
export function checkpointActivity(step: SkillNode): ActivityKind {
  if (step.checkpoint) return step.checkpoint;
  const unlocked = activitiesUpTo(step, topLevel(step));
  return unlocked[unlocked.length - 1];
}

function partFor(
  step: SkillNode,
  lessonId: string,
  questions: number,
  kind: CheckpointPart['kind'],
): CheckpointPart {
  return {
    step,
    activity: checkpointActivity(step),
    questions,
    level: topLevel(step),
    lessonId,
    kind,
  };
}

/**
 * The ordered parts of a unit's checkpoint (empty for Mestari): every step of
 * the unit — a Kertaus step contributes one of its earlier steps — then, from
 * unit 3 on, a short "Muistatko?" part from an earlier unit so old grammar
 * keeps coming back. `attempt` (the number of earlier tries) varies WHICH
 * earlier steps appear, deterministically, so a retry isn't a replay.
 */
export function checkpointPlan(unit: Unit, attempt = 0): CheckpointPart[] {
  if (!hasCheckpoint(unit) || unit.skills.length === 0) return [];
  const cfg = { ...DEFAULT_CHECKPOINT, ...(unit.checkpoint || {}) };
  // A long unit asks fewer questions per step (so its checkpoint stays about
  // as long as a short unit's), and its new-words steps ask just one each.
  const steps = unit.skills.length;
  const long = steps >= 5;
  const perStep = Math.max(
    long ? Math.min(cfg.perStep, 2) : cfg.perStep,
    Math.ceil(cfg.minQuestions / steps),
  );
  const parts = unit.skills.map((step) => {
    const sub = mixStepFor(step, attempt);
    const n = long && step.content.words === 'new' ? 1 : perStep;
    return sub
      ? partFor(sub.skill, lessonForStep(sub.chapter, sub.skill), n, 'step')
      : partFor(step, lessonForStep(unit, step), n, 'step');
  });
  const ui = unitIndex(unit.id);
  if (ui >= 2) {
    const earlier = UNITS.slice(0, ui).flatMap((u) =>
      u.skills.filter(isMixable).map((s) => ({ s, lessonId: lessonForStep(u, s) })),
    );
    if (earlier.length > 0) {
      const pick = earlier[(attempt * 7 + ui * 3) % earlier.length];
      parts.push(partFor(pick.s, pick.lessonId, REMEMBER_QUESTIONS, 'remember'));
    }
  }
  return parts;
}

export function checkpointPassRatio(unit: Unit): number {
  return (unit.checkpoint && unit.checkpoint.passRatio) || DEFAULT_CHECKPOINT.passRatio;
}

// --- Lessons ↔ units -----------------------------------------------------------

export function unitForLesson(lessonId: string): Unit | undefined {
  return UNITS.find(
    (u) => u.lessonId === lessonId || u.midLessons?.some((m) => m.lessonId === lessonId),
  );
}

/** The step a lesson leads into: a unit's first step, or (for a part-way
 *  lesson) the step it sits before. */
export function stepAfterLesson(lessonId: string): SkillNode | undefined {
  const unit = unitForLesson(lessonId);
  if (!unit) return undefined;
  const ml = unit.midLessons?.find((m) => m.lessonId === lessonId);
  return ml ? unit.skills.find((s) => s.id === ml.before) : unit.skills[0];
}

/** The first unit whose steps drill a construction — its lesson explains it. */
export function lessonForConstruction(constructionId: string): string | undefined {
  for (const unit of UNITS) {
    const step = unit.skills.find((s) => s.content.constructionIds?.includes(constructionId));
    // The lesson that explains that step — a part-way lesson where there is one.
    if (step) return lessonForStep(unit, step);
  }
  return undefined;
}

/** Lessons the child can open in the Notebook (open or finished units). */
export function notebookLessonIds(child: Child | null | undefined, unlockAll = false): string[] {
  return UNITS.filter((u) => unitStatus(child, u, unlockAll) !== 'locked').flatMap((u) => [
    u.lessonId,
    ...(u.midLessons ?? [])
      .filter((m) => midLessonStatus(child, u, m, unlockAll) !== 'locked')
      .map((m) => m.lessonId),
  ]);
}
