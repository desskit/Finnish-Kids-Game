// When a step is finished mid-game, play goes straight on to whatever the
// course offers next — the next step, the lesson it opens, the checkpoint —
// instead of repeating the finished step until the child goes home and taps
// Continue. Pure: the step player (SkillRoute) asks after each segment.

import type { Child } from '../state/storage';
import { unlockAllFor } from '../state/storage';
import { actionHref, nextAction, type NextAction } from './course';
import { mathActionHref, nextMathAction, type MathAction } from './mathCourse';
import { lessonById } from '../content/lessons';
import { storyById } from '../content/stories';

/** Where to go next, and what to call it on the way ("Seuraavaksi…"). */
export interface Advance {
  href: string;
  titleFi: string;
  titleEn: string;
}

const proven = (child: Child | null | undefined, unitId: string, stepId: string) =>
  !!child?.progress?.[unitId]?.[stepId]?.topProvenAt;

function courseTitle(a: NextAction): { titleFi: string; titleEn: string } {
  switch (a.kind) {
    case 'opener': {
      const s = storyById[a.storyId];
      return { titleFi: s?.titleFi ?? a.unit.titleFi, titleEn: s?.titleEn ?? a.unit.titleEn };
    }
    case 'lesson': {
      const l = lessonById[a.lessonId];
      return { titleFi: l?.titleFi ?? a.unit.titleFi, titleEn: l?.titleEn ?? a.unit.titleEn };
    }
    case 'step':
      return { titleFi: a.step.titleFi, titleEn: a.step.titleEn };
    case 'checkpoint':
      return { titleFi: 'Välitesti', titleEn: `Checkpoint · ${a.unit.titleEn}` };
  }
}

function mathTitle(a: MathAction): { titleFi: string; titleEn: string } {
  switch (a.kind) {
    case 'lesson': {
      const l = lessonById[a.stage.lessonId];
      return { titleFi: l?.titleFi ?? a.stage.titleFi, titleEn: l?.titleEn ?? a.stage.titleEn };
    }
    case 'step':
      return { titleFi: a.step.titleFi, titleEn: a.step.titleEn };
    case 'test':
      return { titleFi: 'Välitesti', titleEn: `Win the crown · ${a.stage.titleEn}` };
  }
}

/**
 * Did this segment finish the step — and if so, where does play go on to?
 * Only a step finished just now moves on (replaying a finished step from the
 * map stays put), and never to the step itself.
 */
export function advanceAfter(
  before: Child | null | undefined,
  after: Child | null | undefined,
  unitId: string,
  stepId: string,
  math = false,
): Advance | null {
  if (!after || proven(before, unitId, stepId) || !proven(after, unitId, stepId)) return null;
  const here = `/skill/${stepId}`;
  if (math) {
    const a = nextMathAction(after, unlockAllFor(after));
    if (!a || mathActionHref(a) === here) return null;
    return { href: mathActionHref(a), ...mathTitle(a) };
  }
  const a = nextAction(after);
  const href = actionHref(a);
  if (href === here) return null;
  return { href, ...courseTitle(a) };
}
