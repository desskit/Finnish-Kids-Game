import { describe, it, expect } from 'vitest';
import {
  newSchedule,
  review,
  isDue,
  accuracy,
  isMastered,
  selectReviewItems,
  BOX_INTERVALS_MS,
  MAX_BOX,
  type ItemSchedule,
} from './srs';

const T0 = 1_000_000_000_000; // a fixed "now" so every test is deterministic
const DAY = 86_400_000;

describe('newSchedule', () => {
  it('is a box-1 item due immediately, never seen', () => {
    const s = newSchedule(T0);
    expect(s).toEqual({ box: 1, due: T0, seen: 0, correct: 0, lastSeenAt: 0 });
  });
});

describe('review', () => {
  it('creates a fresh schedule when there is no prior one', () => {
    const s = review(null, true, T0);
    expect(s.seen).toBe(1);
    expect(s.correct).toBe(1);
    expect(s.box).toBe(2);
    expect(s.lastSeenAt).toBe(T0);
  });

  it('promotes one box and pushes the due date out on a correct answer', () => {
    const s = review({ box: 2, due: T0, seen: 3, correct: 2, lastSeenAt: T0 }, true, T0);
    expect(s.box).toBe(3);
    expect(s.due).toBe(T0 + BOX_INTERVALS_MS[3]);
    expect(s.seen).toBe(4);
    expect(s.correct).toBe(3);
  });

  it('caps promotion at the top box', () => {
    let s: ItemSchedule = { box: MAX_BOX, due: T0, seen: 9, correct: 9, lastSeenAt: T0 };
    s = review(s, true, T0);
    expect(s.box).toBe(MAX_BOX);
    expect(s.due).toBe(T0 + BOX_INTERVALS_MS[MAX_BOX]);
  });

  it('drops back to box 1 (due now) on a wrong answer', () => {
    const s = review({ box: 4, due: T0 + 5 * DAY, seen: 6, correct: 5, lastSeenAt: T0 }, false, T0);
    expect(s.box).toBe(1);
    expect(s.due).toBe(T0); // BOX_INTERVALS_MS[1] === 0
    expect(s.seen).toBe(7);
    expect(s.correct).toBe(5);
  });
});

describe('isDue / accuracy / isMastered', () => {
  it('isDue compares the due date against now', () => {
    expect(isDue({ box: 1, due: T0, seen: 1, correct: 0, lastSeenAt: T0 }, T0)).toBe(true);
    expect(isDue({ box: 3, due: T0 + DAY, seen: 1, correct: 1, lastSeenAt: T0 }, T0)).toBe(false);
  });

  it('accuracy is correct/seen, 0 when never seen', () => {
    expect(accuracy({ box: 1, due: T0, seen: 0, correct: 0, lastSeenAt: 0 })).toBe(0);
    expect(accuracy({ box: 2, due: T0, seen: 4, correct: 3, lastSeenAt: T0 })).toBe(0.75);
  });

  it('isMastered is true only at the top box', () => {
    expect(isMastered({ box: MAX_BOX, due: T0, seen: 9, correct: 9, lastSeenAt: T0 })).toBe(true);
    expect(isMastered({ box: MAX_BOX - 1, due: T0, seen: 9, correct: 9, lastSeenAt: T0 })).toBe(false);
  });

  it('a streak of correct answers eventually masters an item', () => {
    let s = review(null, true, T0);
    while (!isMastered(s)) s = review(s, true, s.due);
    expect(s.box).toBe(MAX_BOX);
  });
});

describe('selectReviewItems', () => {
  const ids = ['a', 'b', 'c', 'd', 'e'];

  it('returns new items first when nothing has been seen', () => {
    const picked = selectReviewItems({ schedules: {}, allIds: ids, now: T0, count: 3 });
    expect(picked).toEqual(['a', 'b', 'c']);
  });

  it('prioritizes due items, most overdue first, then backfills with new ones', () => {
    const schedules: Record<string, ItemSchedule> = {
      a: { box: 2, due: T0 - 1 * DAY, seen: 2, correct: 1, lastSeenAt: T0 - 1 * DAY },
      b: { box: 2, due: T0 - 5 * DAY, seen: 2, correct: 1, lastSeenAt: T0 - 5 * DAY },
      c: { box: 5, due: T0 + 10 * DAY, seen: 9, correct: 9, lastSeenAt: T0 }, // not due
    };
    const picked = selectReviewItems({ schedules, allIds: ids, now: T0, count: 4 });
    // b (most overdue), a (overdue), then new items d, e — c is not due, excluded.
    expect(picked).toEqual(['b', 'a', 'd', 'e']);
  });

  it('falls back to not-yet-due items (soonest first) only when still short', () => {
    const schedules: Record<string, ItemSchedule> = {
      a: { box: 3, due: T0 + 3 * DAY, seen: 3, correct: 3, lastSeenAt: T0 },
      b: { box: 2, due: T0 + 1 * DAY, seen: 2, correct: 2, lastSeenAt: T0 },
      c: { box: 4, due: T0 + 7 * DAY, seen: 5, correct: 5, lastSeenAt: T0 },
      d: { box: 5, due: T0 + 16 * DAY, seen: 9, correct: 9, lastSeenAt: T0 },
      e: { box: 5, due: T0 + 16 * DAY, seen: 9, correct: 9, lastSeenAt: T0 },
    };
    // Nothing due, no new items → soonest-due seen items, in due order.
    const picked = selectReviewItems({ schedules, allIds: ids, now: T0, count: 3 });
    expect(picked).toEqual(['b', 'a', 'c']);
  });

  it('is deterministic for equal overdueness (tie-break by lastSeenAt then id)', () => {
    const schedules: Record<string, ItemSchedule> = {
      a: { box: 2, due: T0 - DAY, seen: 1, correct: 0, lastSeenAt: T0 - 2 * DAY },
      b: { box: 2, due: T0 - DAY, seen: 1, correct: 0, lastSeenAt: T0 - 3 * DAY },
    };
    const picked = selectReviewItems({
      schedules,
      allIds: ['a', 'b'],
      now: T0,
      count: 2,
    });
    expect(picked).toEqual(['b', 'a']); // b was seen longer ago → reviewed first
  });

  it('never returns more than count', () => {
    expect(selectReviewItems({ schedules: {}, allIds: ids, now: T0, count: 2 })).toHaveLength(2);
    expect(selectReviewItems({ schedules: {}, allIds: ids, now: T0, count: 0 })).toHaveLength(0);
  });
});
