// Spaced-repetition scheduler (Leitner-lite) — the substrate for the Review
// activity and the parent dashboard's mastery view.
//
// One schedule is kept per (child, item). It is intentionally PURE and
// deterministic: every function takes the current time as an argument rather
// than reading the clock, so the whole thing is trivially unit-testable and the
// selection order never depends on hidden randomness. Callers (the activities)
// own persistence; callers (the Review screen) own any presentational shuffle.

export interface ItemSchedule {
  /** Leitner box, 1..MAX_BOX. Higher = better known = longer interval. */
  box: number;
  /** Epoch ms when this item next becomes due for review. */
  due: number;
  /** Total times the child has answered this item. */
  seen: number;
  /** Of those, how many were correct on the first try. */
  correct: number;
  /** Epoch ms of the most recent answer. */
  lastSeenAt: number;
}

const DAY = 86_400_000;

/**
 * Days until an item in each box is due again. Index by box (1..MAX_BOX); box 0
 * is unused. Box 1 is due immediately (0) so freshly-learned or just-missed
 * items keep coming back within the same session.
 */
export const BOX_INTERVALS_MS: readonly number[] = [
  0, // box 0 — unused placeholder
  0, // box 1 — review again now (this session)
  1 * DAY, // box 2 — tomorrow
  3 * DAY, // box 3
  7 * DAY, // box 4
  16 * DAY, // box 5
];

export const MAX_BOX = 5;

/** A brand-new schedule for an item answered for the very first time. */
export function newSchedule(now: number): ItemSchedule {
  return { box: 1, due: now, seen: 0, correct: 0, lastSeenAt: 0 };
}

/**
 * Apply one answer to a schedule and return the next schedule. A correct answer
 * promotes the item one box (capped at MAX_BOX) and pushes its due date out; a
 * wrong answer drops it back to box 1 so it resurfaces immediately. Pass the
 * previous schedule, or null/undefined for an item seen for the first time.
 */
export function review(
  prev: ItemSchedule | null | undefined,
  correct: boolean,
  now: number,
): ItemSchedule {
  const base = prev ?? newSchedule(now);
  const box = correct ? Math.min(base.box + 1, MAX_BOX) : 1;
  return {
    box,
    due: now + BOX_INTERVALS_MS[box],
    seen: base.seen + 1,
    correct: base.correct + (correct ? 1 : 0),
    lastSeenAt: now,
  };
}

/** Is this item due for review at `now`? */
export function isDue(s: ItemSchedule, now: number): boolean {
  return s.due <= now;
}

/** First-try accuracy as a 0..1 fraction (0 if never seen). */
export function accuracy(s: ItemSchedule): number {
  return s.seen > 0 ? s.correct / s.seen : 0;
}

/** An item is "mastered" once it reaches the top box. */
export function isMastered(s: ItemSchedule): boolean {
  return s.box >= MAX_BOX;
}

export interface ReviewSelection {
  /** Schedules keyed by item id (the active child's `srs` map). */
  schedules: Readonly<Record<string, ItemSchedule>>;
  /** Every reviewable item id, in a stable order (for new-item backfill). */
  allIds: readonly string[];
  /** Current time. */
  now: number;
  /** How many items the review round should contain. */
  count: number;
}

/**
 * Pick the items for a review round, most valuable first:
 *   1. due items (seen before, due now), most overdue first;
 *   2. new items (never seen) to backfill when few are due;
 *   3. not-yet-due seen items (soonest due first) only if still short.
 * Deterministic: ties break by lastSeenAt then id, so the same inputs always
 * yield the same ordering. Returns up to `count` item ids.
 */
export function selectReviewItems({
  schedules,
  allIds,
  now,
  count,
}: ReviewSelection): string[] {
  const seen = allIds.filter((id) => schedules[id]);
  const fresh = allIds.filter((id) => !schedules[id]);

  const due = seen
    .filter((id) => isDue(schedules[id], now))
    .sort((a, b) => {
      const overA = now - schedules[a].due;
      const overB = now - schedules[b].due;
      if (overA !== overB) return overB - overA; // most overdue first
      if (schedules[a].lastSeenAt !== schedules[b].lastSeenAt) {
        return schedules[a].lastSeenAt - schedules[b].lastSeenAt; // oldest first
      }
      return a < b ? -1 : a > b ? 1 : 0;
    });

  const notDue = seen
    .filter((id) => !isDue(schedules[id], now))
    .sort((a, b) => schedules[a].due - schedules[b].due); // soonest due first

  const ordered = [...due, ...fresh, ...notDue];
  return ordered.slice(0, Math.max(0, count));
}
