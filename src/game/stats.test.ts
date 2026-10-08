import { describe, it, expect } from 'vitest';
import {
  FORGETTING_CAP,
  MAX_APP_DAYS,
  MAX_SUBJECT_DAYS,
  MAX_WARMUPS,
  MIN_ANSWERS_TO_JUDGE,
  MS_PER_QUESTION_CAP,
  applyStatEvent,
  applyWarmup,
  emptyStats,
  lastDays,
  seedFromProgress,
  segmentMs,
  statsOf,
  strengthOf,
  sumDays,
  trendOf,
  warmupDoneOn,
  weaknessOf,
  type StatsState,
  type SubjectStats,
} from './stats';
import { dayKey } from './streak';

const DAY = 864e5;
const NOW = new Date(2026, 9, 8, 15, 0).getTime();
const today = dayKey(NOW);
const ago = (d: number) => dayKey(NOW - d * DAY);

describe('recording', () => {
  it('folds a segment into the subject, its day, its source and the app day', () => {
    let s = emptyStats();
    s = applyStatEvent(s, { subject: 'i-have', right: 5, total: 6, ms: 40_000, source: 'practice' }, NOW);
    s = applyStatEvent(s, { subject: 'i-have', right: 2, total: 2, source: 'checkpoint' }, NOW);
    const sub = s.subjects['i-have'];
    expect(sub).toMatchObject({ n: 8, right: 7, first: NOW, last: NOW });
    expect(sub.days[today]).toEqual({ n: 8, right: 7, ms: 40_000 });
    expect(sub.src?.practice).toEqual({ n: 6, right: 5, ms: 40_000 });
    expect(sub.src?.checkpoint).toEqual({ n: 2, right: 2 });
    expect(s.days[today]).toEqual({ n: 8, right: 7, ms: 40_000 });
  });

  it('counts Review and Alphabet answers in the day only (no subject)', () => {
    const s = applyStatEvent(emptyStats(), { right: 6, total: 8, source: 'review' }, NOW);
    expect(s.subjects).toEqual({});
    expect(s.days[today]).toEqual({ n: 8, right: 6 });
  });

  it('never lets an optional typing round make a subject look weak', () => {
    let s = applyStatEvent(emptyStats(), { subject: 'i-have', right: 6, total: 6, source: 'practice' }, NOW);
    s = applyStatEvent(s, { subject: 'i-have', right: 0, total: 6, source: 'bonus' }, NOW + 1);
    expect(s.subjects['i-have']).toMatchObject({ n: 6, right: 6, last: NOW });
    expect(s.subjects['i-have'].src?.bonus).toEqual({ n: 6, right: 0 });
    expect(s.days[today]).toEqual({ n: 12, right: 6 });
  });

  it('ignores empty segments and clamps nonsense', () => {
    const s0 = emptyStats();
    expect(applyStatEvent(s0, { subject: 'x', right: 0, total: 0, source: 'practice' }, NOW)).toBe(s0);
    const s = applyStatEvent(s0, { subject: 'x', right: 9, total: 3, source: 'practice' }, NOW);
    expect(s.subjects.x).toMatchObject({ n: 3, right: 3 });
  });

  it('stays bounded: old days roll off, lifetime totals keep them', () => {
    let s = emptyStats();
    const days = MAX_APP_DAYS + 20;
    for (let d = days; d >= 0; d--) {
      s = applyStatEvent(s, { subject: 'i-have', right: 1, total: 2, source: 'practice' }, NOW - d * DAY);
    }
    expect(Object.keys(s.days)).toHaveLength(MAX_APP_DAYS);
    expect(Object.keys(s.subjects['i-have'].days)).toHaveLength(MAX_SUBJECT_DAYS);
    expect(s.subjects['i-have'].n).toBe((days + 1) * 2);
    // The newest days are the ones kept.
    expect(s.subjects['i-have'].days[today]).toBeDefined();
    expect(s.days[today]).toBeDefined();
  });

  it('keeps a bounded warm-up log', () => {
    let s = emptyStats();
    for (let i = 0; i < MAX_WARMUPS + 5; i++) {
      s = applyWarmup(s, { day: ago(i), subject: 'a', right: 8, total: 10, at: i });
    }
    expect(s.warmups).toHaveLength(MAX_WARMUPS);
    expect(warmupDoneOn(s, ago(MAX_WARMUPS + 4))).toBe(true);
  });

  it('caps practice time per question — an idle screen is not practice', () => {
    expect(segmentMs(0, 30_000, 6)).toBe(30_000);
    expect(segmentMs(0, 3_600_000, 6)).toBe(6 * MS_PER_QUESTION_CAP);
    expect(segmentMs(10, 5, 6)).toBe(0);
  });
});

describe('seeding from older progress', () => {
  it('turns each step’s recorded rounds into lifetime totals', () => {
    const s = seedFromProgress({
      having: {
        'i-have': { plays: 3, bestStars: 6, totalStars: 16, totalPossible: 18, lastPlayed: 5, level: 2 },
        // Bonus stars can exceed questions; right is capped.
        typing: { plays: 1, bestStars: 1, totalStars: 9, totalPossible: 4, lastPlayed: 6 },
        empty: { plays: 0, bestStars: 0, totalStars: 0, totalPossible: 0, lastPlayed: 0 },
      },
    });
    expect(s.subjects['i-have']).toEqual({ n: 18, right: 16, days: {}, first: 5, last: 5 });
    expect(s.subjects.typing.right).toBe(4);
    expect(s.subjects.empty).toBeUndefined();
  });

  it('reads stored stats first, else the seed (no write needed)', () => {
    const stored: StatsState = { v: 1, subjects: {}, days: {} };
    expect(statsOf({ stats: stored, progress: {} })).toBe(stored);
    expect(statsOf(null)).toEqual(emptyStats());
  });
});

describe('weakness', () => {
  const subject = (days: Record<string, { n: number; right: number }>, last: number): SubjectStats => {
    const n = Object.values(days).reduce((a, b) => a + b.n, 0);
    const right = Object.values(days).reduce((a, b) => a + b.right, 0);
    return { n, right, days, first: last, last };
  };

  it('smooths small samples toward 75% instead of 0% or 100%', () => {
    const two = strengthOf(subject({ [today]: { n: 2, right: 2 } }, NOW), NOW);
    expect(two.accuracy).toBeCloseTo(5 / 6);
    const zero = strengthOf(subject({ [today]: { n: 2, right: 0 } }, NOW), NOW);
    expect(zero.accuracy).toBeCloseTo(3 / 6);
  });

  it('weighs recent answers more than old ones', () => {
    // Same totals; one learned it recently, the other got it right long ago.
    const improving = subject({ [ago(30)]: { n: 10, right: 2 }, [today]: { n: 10, right: 10 } }, NOW);
    const slipping = subject({ [ago(30)]: { n: 10, right: 10 }, [today]: { n: 10, right: 2 } }, NOW);
    expect(weaknessOf(improving, NOW)).toBeLessThan(weaknessOf(slipping, NOW));
  });

  it('adds a little for time away (forgetting), capped', () => {
    const fresh = subject({ [today]: { n: 20, right: 18 } }, NOW);
    const away = { ...fresh, days: {}, last: NOW - 60 * DAY };
    // Same answers, only the time since differs.
    const w0 = weaknessOf({ ...fresh, days: {} , last: NOW }, NOW);
    expect(weaknessOf(away, NOW) - w0).toBeLessThanOrEqual(FORGETTING_CAP + 0.2);
    expect(weaknessOf(away, NOW)).toBeGreaterThan(w0);
  });

  it('counts answers from before the day window (seeded totals) as faded', () => {
    const seeded: SubjectStats = { n: 40, right: 10, days: {}, first: NOW - 20 * DAY, last: NOW - 20 * DAY };
    const st = strengthOf(seeded, NOW);
    expect(st.n).toBe(40);
    expect(st.accuracy).toBeLessThan(0.5);
    expect(st.daysSince).toBe(20);
  });

  it('needs a few answers before judging', () => {
    expect(MIN_ANSWERS_TO_JUDGE).toBeGreaterThanOrEqual(5);
  });

  it('reads a trend only with enough answers on both sides', () => {
    const up = subject({ [ago(20)]: { n: 10, right: 4 }, [ago(1)]: { n: 10, right: 9 } }, NOW);
    expect(trendOf(up, NOW)).toBe('up');
    const down = subject({ [ago(20)]: { n: 10, right: 9 }, [ago(1)]: { n: 10, right: 4 } }, NOW);
    expect(trendOf(down, NOW)).toBe('down');
    expect(trendOf(subject({ [ago(1)]: { n: 10, right: 4 } }, NOW), NOW)).toBeUndefined();
  });
});

describe('days', () => {
  it('lists the last n days ending today, oldest first', () => {
    const d = lastDays(3, NOW);
    expect(d).toEqual([ago(2), ago(1), today]);
  });

  it('sums the buckets of chosen days', () => {
    expect(sumDays({ [today]: { n: 4, right: 3, ms: 10 }, [ago(1)]: { n: 2, right: 1 } }, [today, ago(1), ago(2)])).toEqual({
      n: 6,
      right: 4,
      ms: 10,
    });
  });
});
