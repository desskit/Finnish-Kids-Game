// Guided-course rules — pure functions over the PATH (units) and a child's
// stored progress. No React, no storage writes: the home screen, the routes and
// the tests all ask the same questions here.
//
// A unit runs "hear it, use it, notice it" (docs/LEARNING_RESEARCH.md):
//   1. Kuuntele ensin — the opener: the unit's story, listened to page by page
//      with its pictures, no questions and no score.
//   2. The first practice step — the new phrases modelled, then used.
//   3. The lesson (the "notice" card) — the pattern pointed out, AFTER the
//      child has met it. A younger reader sees its short notice cards.
//   4. The remaining steps (part-way lessons as before), the story again with
//      its questions, then the checkpoint.
//
// The rules, in order:
//   - Unit 1 is open. Unit n opens once unit n−1's checkpoint is passed (a unit
//     with no checkpoint — Mestari — never blocks anything after it). A unit
//     the child has started (opener heard, lesson read, or a step played) stays
//     open, so a unit added to the course before it never locks a child out of
//     the one they're in.
//   - Inside an open unit, the opener comes first: the steps open once it has
//     been heard. A unit with no story has no opener. Starting a unit any other
//     way (an older save that read the lesson first) counts as heard, so no
//     child is ever sent backwards.
//   - The steps after the first wait for the lesson (readable any time once
//     the opener is heard); a part-way lesson gates the steps from it on.
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
/** A checkpoint never asks more than this (its own steps + the "Muistatko?" part). */
export const MAX_CHECKPOINT_QUESTIONS = 18;

/** Steps a checkpoint skips: a story is read at story pace, not tested. */
export function inCheckpoint(step: SkillNode): boolean {
  return step.activity !== 'story';
}

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

// --- The opener and the notice --------------------------------------------------

/** The steps a unit plays before its lesson: just the first. */
export const STEPS_BEFORE_LESSON = 1;

/** The unit's own story step (the one its opener plays): its `<unit>-story`,
 *  else its story step with stories of its own. Mestari's "all stories" has none. */
export function storyStepOf(unit: Unit): SkillNode | undefined {
  const story = unit.skills.filter((s) => s.activity === 'story' && !!s.content.ids?.length);
  return story.find((s) => s.id === `${unit.id}-story`) ?? (hasCheckpoint(unit) ? story[0] : undefined);
}

/** The story a unit opens with ("Kuuntele ensin"), or undefined (no opener). */
export function openerStoryId(unit: Unit): string | undefined {
  return storyStepOf(unit)?.content.ids?.[0];
}

/** Has the child begun this unit in any way — opener, lesson or a step played? */
export function unitStarted(child: Child | null | undefined, unit: Unit): boolean {
  return (
    !!child?.course?.openersHeard?.[unit.id] ||
    lessonSeen(child, unit.lessonId) ||
    Object.keys(child?.progress?.[unit.id] ?? {}).length > 0
  );
}

/** Has the opener been heard? (No opener, or a unit begun another way, counts.) */
export function openerHeard(child: Child | null | undefined, unit: Unit): boolean {
  return !openerStoryId(unit) || unitStarted(child, unit);
}

/** Where the unit's lesson sits: before this step index (after the first step). */
export function lessonAt(unit: Unit): number {
  return Math.min(STEPS_BEFORE_LESSON, unit.skills.length);
}

export function unitStatus(
  child: Child | null | undefined,
  unit: Unit,
  unlockAll = false,
): Status {
  if (unitComplete(child, unit)) return 'done';
  if (unlockAll) return 'open';
  const i = unitIndex(unit.id);
  if (i <= 0 || unitStarted(child, unit)) return 'open';
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
  if (!openerHeard(child, unit)) return 'locked';
  if (unit.skills.indexOf(step) >= lessonAt(unit) && !lessonSeen(child, unit.lessonId)) return 'locked';
  const ml = midLessonBefore(unit, step);
  return ml && !lessonSeen(child, ml.lessonId) ? 'locked' : 'open';
}

/** The opener: open with its unit, done once heard. */
export function openerStatus(
  child: Child | null | undefined,
  unit: Unit,
  unlockAll = false,
): Status {
  if (!openerStoryId(unit)) return 'done';
  if (openerHeard(child, unit)) return 'done';
  return unlockAll || unitStatus(child, unit) !== 'locked' ? 'open' : 'locked';
}

/** The unit's lesson: open once the opener has been heard (Continue offers it after the first step). */
export function lessonStatus(
  child: Child | null | undefined,
  unit: Unit,
  unlockAll = false,
): Status {
  if (lessonSeen(child, unit.lessonId)) return 'done';
  if (unlockAll || unitComplete(child, unit)) return 'open';
  if (unitStatus(child, unit) === 'locked' || !openerHeard(child, unit)) return 'locked';
  return 'open';
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
  | { kind: 'opener'; unit: Unit; storyId: string }
  | { kind: 'lesson'; unit: Unit; lessonId: string }
  | { kind: 'step'; unit: Unit; step: SkillNode }
  | { kind: 'checkpoint'; unit: Unit };

/**
 * The one thing to do next — the home screen's "Continue" button. In the first
 * unfinished unit: its opener, else its first unfinished step (with the lesson
 * read once the first step is done, and a part-way lesson when reached), else
 * its checkpoint. Once every checkpoint is passed it points into Mestari, at
 * its least-practised step.
 */
export function nextAction(child: Child | null | undefined): NextAction {
  for (const unit of UNITS) {
    if (unitComplete(child, unit)) continue;
    const storyId = openerStoryId(unit);
    if (storyId && !openerHeard(child, unit)) return { kind: 'opener', unit, storyId };
    const step = unit.skills.find((s) => !stepDone(child, unit, s));
    if (step) {
      // Past the first step: notice the pattern before going on.
      if (unit.skills.indexOf(step) >= lessonAt(unit) && !lessonSeen(child, unit.lessonId)) {
        return { kind: 'lesson', unit, lessonId: unit.lessonId };
      }
      // Reached a part-way lesson not yet read? Read it first.
      const ml = midLessonBefore(unit, step);
      if (ml && !lessonSeen(child, ml.lessonId)) return { kind: 'lesson', unit, lessonId: ml.lessonId };
      return { kind: 'step', unit, step };
    }
    if (!lessonSeen(child, unit.lessonId)) return { kind: 'lesson', unit, lessonId: unit.lessonId };
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
    case 'opener':
      return `/opener/${a.unit.id}`;
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
  const tested = unit.skills.filter(inCheckpoint);
  if (!hasCheckpoint(unit) || tested.length === 0) return [];
  const cfg = { ...DEFAULT_CHECKPOINT, ...(unit.checkpoint || {}) };
  const ui = unitIndex(unit.id);
  const remembers = ui >= 2;
  // A long unit asks fewer questions per step (so its checkpoint stays about
  // as long as a short unit's), and its new-words, listening and scene steps
  // ask just one each.
  const steps = tested.length;
  const long = steps >= 5;
  const perStep = Math.max(
    long ? Math.min(cfg.perStep, 2) : cfg.perStep,
    Math.ceil(cfg.minQuestions / steps),
  );
  const light = (step: SkillNode) =>
    long && (step.content.words === 'new' || step.activity === 'conversation' || step.activity === 'hear');
  const counts = tested.map((step) => (light(step) ? 1 : perStep));
  const total = () => counts.reduce((a, b) => a + b, 0);
  // Never below the minimum: top up the grammar steps, one at a time.
  const grammar = tested.map((s, i) => (light(s) ? -1 : i)).filter((i) => i >= 0);
  for (let k = 0; total() < cfg.minQuestions && grammar.length > 0; k++) {
    counts[grammar[k % grammar.length]] += 1;
  }
  // Never past the maximum: trim the grammar steps (latest first), never below one.
  const cap = MAX_CHECKPOINT_QUESTIONS - (remembers ? REMEMBER_QUESTIONS : 0);
  for (let k = 0; total() > cap && k < 200; k++) {
    const i = [...grammar].reverse().find((g) => counts[g] === Math.max(...grammar.map((x) => counts[x])));
    if (i === undefined || counts[i] <= 1) break;
    counts[i] -= 1;
  }
  const parts = tested.map((step, i) => {
    const sub = mixStepFor(step, attempt);
    return sub
      ? partFor(sub.skill, lessonForStep(sub.chapter, sub.skill), counts[i], 'step')
      : partFor(step, lessonForStep(unit, step), counts[i], 'step');
  });
  if (remembers) {
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

/** The step a lesson leads into: for a part-way lesson the step it sits
 *  before; for the unit's lesson the child's first unfinished step (the one
 *  after the first, for a child who hasn't played yet: the lesson sits there). */
export function stepAfterLesson(lessonId: string, child?: Child | null): SkillNode | undefined {
  const unit = unitForLesson(lessonId);
  if (!unit) return undefined;
  const ml = unit.midLessons?.find((m) => m.lessonId === lessonId);
  if (ml) return unit.skills.find((s) => s.id === ml.before);
  return unit.skills.find((s) => !stepDone(child, unit, s)) ?? unit.skills[lessonAt(unit)] ?? unit.skills[0];
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
