// The day's session (docs/LEARNING_RESEARCH.md): short practice, spaced and
// mixed, with a natural place to stop. A new day's first Continue opens the
// warm-up (game/warmup.ts): the words and grammar due back for review, else
// the weakest subject, with a story due for its "Muistatko?" first. Then the
// course — until the day's questions reach the player's session budget
// (learner.ts `sessionRounds`), where the game says so and offers home; going
// on is the child's choice, never the default.
//
// Budgets are counted in questions, not minutes (a clock means nothing to a
// six-year-old, and an idle tab isn't practice). Pure: everything takes the
// child and `now`.

import type { Child } from '../state/storage';
import { reviewItemById } from '../content';
import { nounConstructions } from '../content/constructions';
import { learnerKnobs } from './learner';
import { grammarSrsId, isDue, isGrammarId } from './srs';
import { statsOf } from './stats';
import { dayKey } from './streak';

/** A round, for the budget: a segment of about six questions. */
export const QUESTIONS_PER_ROUND = 6;
/** The warm-up reviews instead of drilling a subject once this many are due. */
export const WARMUP_REVIEW_MIN = 3;
/** …and asks at most this many of them. */
export const WARMUP_REVIEW_MAX = 10;

/** The day's questions for this player (about 8 minutes younger, 12 older). */
export function sessionBudget(child: Child | null | undefined): number {
  return learnerKnobs(child).sessionRounds * QUESTIONS_PER_ROUND;
}

/** Questions answered today, in every part of the app. */
export function questionsToday(child: Child | null | undefined, now: number): number {
  return child ? statsOf(child).days[dayKey(now)]?.n ?? 0 : 0;
}

/** Did these questions just carry the day past its budget? (Once a day: the crossing.) */
export function reachesBudget(before: number, added: number, budget: number): boolean {
  return before < budget && before + added >= budget;
}

const REVIEWABLE_GRAMMAR = new Set(nounConstructions.map((c) => grammarSrsId(c.id)));

/** The words and grammar due back for review now (ones Review can ask), most overdue first. */
export function dueReviewIds(child: Child | null | undefined, now: number): string[] {
  return Object.entries(child?.srs ?? {})
    .filter(([id, s]) => (isGrammarId(id) ? REVIEWABLE_GRAMMAR.has(id) : !!reviewItemById[id]) && isDue(s, now))
    .sort(([a, x], [b, y]) => x.due - y.due || (a < b ? -1 : a > b ? 1 : 0))
    .map(([id]) => id);
}

/** Enough due to make the warm-up a review (at most WARMUP_REVIEW_MAX of them). */
export function warmupReviewIds(child: Child | null | undefined, now: number): string[] {
  const due = dueReviewIds(child, now);
  return due.length >= WARMUP_REVIEW_MIN ? due.slice(0, WARMUP_REVIEW_MAX) : [];
}
