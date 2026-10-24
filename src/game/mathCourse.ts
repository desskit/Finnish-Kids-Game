// The math section's rules — pure functions over its stages (mathPath.tsx) and
// a child's record, like course.ts for the course:
//   - The first stage opens once the course's Numbers unit is done; every
//     other stage once the stage before (or the one it names, `afterStage`)
//     has its crown, and the course has taught what it needs (`afterUnit`).
//     A stage the child has started (its lesson read) stays open.
//   - In an open stage the lesson comes first; then the games.
//   - A game is done when its top level is proven, as in the course.
//   - The test opens when every game is done; passing it wins the crown.
//   - A grown-up's `unlockAll` opens everything here too.
// Nothing here touches the course's own record: crowns live in `child.math`.

import type { Child } from '../state/storage';
import { UNITS, findUnit, lessonSeen, stepDone, unitComplete, type Status } from './course';
import type { SkillNode } from './path';
import { MATH_STAGES, testedSteps, type MathStage } from './mathPath';

export const crownWon = (child: Child | null | undefined, stage: MathStage): boolean =>
  !!child?.math?.crowns?.[stage.id]?.passedAt;

/** What a locked stage is waiting for. */
export function waitingFor(child: Child | null | undefined, stage: MathStage): { unit?: string; stage?: MathStage } {
  const i = MATH_STAGES.indexOf(stage);
  const prev = stage.afterStage ? MATH_STAGES.find((s) => s.id === stage.afterStage) : i > 0 ? MATH_STAGES[i - 1] : undefined;
  const unit = stage.afterUnit ? findUnit(stage.afterUnit) : undefined;
  return {
    unit: unit && !unitComplete(child, unit) ? unit.id : undefined,
    stage: prev && !crownWon(child, prev) ? prev : undefined,
  };
}

export function stageStatus(child: Child | null | undefined, stage: MathStage, unlockAll = false): Status {
  if (crownWon(child, stage)) return 'done';
  if (unlockAll || lessonSeen(child, stage.lessonId)) return 'open';
  const w = waitingFor(child, stage);
  return w.unit || w.stage ? 'locked' : 'open';
}

export function mathStepStatus(child: Child | null | undefined, stage: MathStage, step: SkillNode, unlockAll = false): Status {
  if (stepDone(child, stage, step)) return 'done';
  if (unlockAll) return 'open';
  if (stageStatus(child, stage) === 'locked') return 'locked';
  return lessonSeen(child, stage.lessonId) ? 'open' : 'locked';
}

export function mathTestStatus(child: Child | null | undefined, stage: MathStage, unlockAll = false): Status {
  if (crownWon(child, stage)) return 'done';
  if (unlockAll) return 'open';
  if (stageStatus(child, stage) === 'locked') return 'locked';
  return stage.skills.every((s) => stepDone(child, stage, s)) ? 'open' : 'locked';
}

export type MathAction =
  | { kind: 'lesson'; stage: MathStage }
  | { kind: 'step'; stage: MathStage; step: SkillNode }
  | { kind: 'test'; stage: MathStage };

/** The next thing to do in math: the first open, crownless stage's lesson, game or test. */
export function nextMathAction(child: Child | null | undefined, unlockAll = false): MathAction | undefined {
  for (const stage of MATH_STAGES) {
    if (crownWon(child, stage)) continue;
    // stages branch (the shop, the clock), so a shut one may have open ones after it
    if (stageStatus(child, stage, unlockAll) === 'locked') continue;
    if (!lessonSeen(child, stage.lessonId)) return { kind: 'lesson', stage };
    const step = stage.skills.find((s) => !stepDone(child, stage, s));
    if (step) return { kind: 'step', stage, step };
    return { kind: 'test', stage };
  }
  return undefined;
}

export function mathActionHref(a: MathAction): string {
  switch (a.kind) {
    case 'lesson':
      return `/lesson/${a.stage.lessonId}`;
    case 'step':
      return `/skill/${a.step.id}`;
    case 'test':
      return `/math/test/${a.stage.id}`;
  }
}

/** Open stages the child hasn't seen yet — the home card says "Uusi!" for them. */
export function newStages(child: Child | null | undefined, unlockAll = false): MathStage[] {
  return MATH_STAGES.filter(
    (s) => stageStatus(child, s, unlockAll) === 'open' && !child?.math?.seen?.[s.id] && !lessonSeen(child, s.lessonId),
  );
}

export const crownsWon = (child: Child | null | undefined): number => MATH_STAGES.filter((s) => crownWon(child, s)).length;

/** The step a math lesson leads into: its stage's first game. */
export function mathStepAfterLesson(lessonId: string): SkillNode | undefined {
  return MATH_STAGES.find((s) => s.lessonId === lessonId)?.skills[0];
}

/**
 * The verbs the course has taught (for word problems: "Syön…" waits for the
 * unit that teaches syödä). Every unit's new words once it's done; all of
 * them for a grown-up who opened everything.
 */
export function taughtWords(child: Child | null | undefined, unlockAll = false): Set<string> {
  return new Set(UNITS.filter((u) => unlockAll || unitComplete(child, u)).flatMap((u) => u.newWords));
}

/** The games a stage's test plays. */
export { testedSteps };
