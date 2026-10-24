import { describe, it, expect } from 'vitest';
import type { Child } from '../state/storage';
import {
  QUESTIONS_PER_ROUND,
  WARMUP_REVIEW_MAX,
  WARMUP_REVIEW_MIN,
  dueReviewIds,
  questionsToday,
  reachesBudget,
  sessionBudget,
  warmupReviewIds,
} from './session';
import { grammarSrsId, review } from './srs';
import { warmupDue } from './warmup';
import { dayKey } from './streak';
import { reviewItems } from '../content';
import { nounConstructions } from '../content/constructions';

const DAY = 86_400_000;
const NOW = new Date(2026, 9, 20, 12).getTime();

function child(over: Partial<Child> = {}): Child {
  return { id: 'k', name: 'K', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs: {}, ...over } as Child;
}

describe('the day’s session', () => {
  it('is about four rounds for a younger reader and six for an older one, counted in questions', () => {
    expect(sessionBudget(child())).toBe(4 * QUESTIONS_PER_ROUND);
    expect(sessionBudget(child({ readerBand: 'older' }))).toBe(6 * QUESTIONS_PER_ROUND);
  });

  it('counts today’s questions, and stops once — where the day crosses its budget', () => {
    const c = child({ stats: { v: 1, subjects: {}, days: { [dayKey(NOW)]: { n: 20, right: 18 } } } });
    expect(questionsToday(c, NOW)).toBe(20);
    expect(questionsToday(c, NOW + DAY)).toBe(0);
    expect(reachesBudget(20, 6, 24)).toBe(true);
    expect(reachesBudget(24, 6, 24)).toBe(false);
    expect(reachesBudget(10, 6, 24)).toBe(false);
  });
});

describe('the warm-up reviews what is due back', () => {
  const words = reviewItems.slice(0, 12).map((i) => i.id);
  // Answered right yesterday: box 2, due today.
  const dueYesterday = (ids: string[]) =>
    Object.fromEntries(ids.map((id) => [id, review(undefined, true, NOW - DAY)]));

  it('needs a few due, asks at most ten, and leaves out what isn’t due', () => {
    expect(warmupReviewIds(child({ srs: dueYesterday(words.slice(0, WARMUP_REVIEW_MIN - 1)) }), NOW)).toEqual([]);
    const some = warmupReviewIds(child({ srs: dueYesterday(words.slice(0, WARMUP_REVIEW_MIN)) }), NOW);
    expect(some).toHaveLength(WARMUP_REVIEW_MIN);
    expect(warmupReviewIds(child({ srs: dueYesterday(words) }), NOW)).toHaveLength(WARMUP_REVIEW_MAX);
    const fresh = { [words[0]]: review(undefined, true, NOW) };
    expect(dueReviewIds(child({ srs: fresh }), NOW)).toEqual([]);
  });

  it('includes grammar Review can ask, never a key it can’t', () => {
    const con = grammarSrsId(nounConstructions[0].id);
    const srs = { ...dueYesterday([con, 'con:not-a-thing', 'not-a-word']) };
    expect(dueReviewIds(child({ srs }), NOW)).toEqual([con]);
  });

  it('makes the warm-up due on a new day, even with no subject to judge', () => {
    const c = child({ srs: dueYesterday(words.slice(0, WARMUP_REVIEW_MIN)) });
    expect(warmupDue(c, NOW)).toBe(true);
  });
});
