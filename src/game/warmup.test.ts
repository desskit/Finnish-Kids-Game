import { describe, it, expect } from 'vitest';
import type { Child } from '../state/storage';
import type { StatsState, SubjectStats } from './stats';
import { dayKey } from './streak';
import {
  WARMUP_QUESTIONS,
  allSubjects,
  pickWarmupSubject,
  rankSubjects,
  warmupActivity,
  warmupDue,
  warmupLevel,
} from './warmup';
import { findSkill } from './path';

const DAY = 864e5;
const NOW = new Date(2026, 9, 8, 15, 0).getTime();
const ago = (d: number) => dayKey(NOW - d * DAY);

const sub = (n: number, right: number, daysAgo = 1): SubjectStats => ({
  n,
  right,
  days: { [ago(daysAgo)]: { n, right } },
  first: NOW - daysAgo * DAY,
  last: NOW - daysAgo * DAY,
});

const proven = { plays: 3, bestStars: 6, totalStars: 18, totalPossible: 18, lastPlayed: 1, level: 3, topProvenAt: 1 };

/** A child who has passed Hello and is part-way through People. */
function child(stats: Partial<StatsState>, extra: Partial<Child> = {}): Child {
  return {
    id: 'k',
    name: 'Lilli',
    avatar: '🦊',
    level: 1,
    adaptive: true,
    stars: 0,
    createdAt: 0,
    srs: {},
    progress: {
      hello: { greetings: proven, introduce: proven, 'hello-talk': { ...proven, level: 2 } },
      people: { 'people-words': proven },
    },
    course: {
      lessonsSeen: { sounds: 1, 'no-articles': 1 },
      checkpoints: { hello: { passedAt: 1, best: 0.9, attempts: 1 } },
    },
    stats: { v: 1, subjects: {}, days: {}, ...stats },
    ...extra,
  };
}

describe('subjects', () => {
  it('are the drill and word steps — never scenes, stories or Kertaus mixes', () => {
    const kinds = new Set(allSubjects().map((r) => r.step.activity));
    expect(kinds.has('conversation')).toBe(false);
    expect(kinds.has('story')).toBe(false);
    expect(allSubjects().some((r) => r.step.content.mix)).toBe(false);
    expect(allSubjects().length).toBeGreaterThan(60);
  });

  it('rank weakest first, only with enough answers to judge', () => {
    const ranked = rankSubjects(
      {
        v: 1,
        days: {},
        subjects: { greetings: sub(20, 19), introduce: sub(20, 8), 'people-words': sub(3, 0), 'hello-talk': sub(20, 2) },
      },
      NOW,
    );
    // people-words has too few answers; hello-talk is a scene, never a subject.
    expect(ranked.map((r) => r.step.id)).toEqual(['introduce', 'greetings']);
  });
});

describe('picking the warm-up subject', () => {
  it('takes the weakest subject', () => {
    const c = child({ subjects: { greetings: sub(20, 19), 'people-words': sub(20, 9) } });
    expect(pickWarmupSubject(c, NOW)?.step.id).toBe('people-words');
  });

  it('skips the step Continue is about to open', () => {
    const c = child({ subjects: { 'this-is': sub(20, 3), greetings: sub(20, 17) } });
    expect(pickWarmupSubject(c, NOW)?.step.id).toBe('greetings');
  });

  it('skips yesterday’s subject when that warm-up went well', () => {
    const subjects = { 'people-words': sub(20, 9), greetings: sub(20, 15) };
    const went = (right: number) =>
      child({ subjects, warmups: [{ day: ago(1), subject: 'people-words', right, total: 10, at: 1 }] });
    expect(pickWarmupSubject(went(9), NOW)?.step.id).toBe('greetings');
    // Still shaky yesterday → it stays the warm-up today.
    expect(pickWarmupSubject(went(5), NOW)?.step.id).toBe('people-words');
  });

  it('rotates after three warm-ups in a row on the same subject', () => {
    const subjects = { 'people-words': sub(20, 9), greetings: sub(20, 15) };
    const warmups = [3, 2, 1].map((d) => ({ day: ago(d), subject: 'people-words', right: 4, total: 10, at: d }));
    expect(pickWarmupSubject(child({ subjects, warmups }), NOW)?.step.id).toBe('greetings');
  });

  it('is due on a new day, and not again once done today', () => {
    const subjects = { 'people-words': sub(20, 9) };
    expect(warmupDue(child({ subjects }), NOW)).toBe(true);
    const done = child({ subjects, warmups: [{ day: dayKey(NOW), subject: 'people-words', right: 7, total: 10, at: NOW }] });
    expect(warmupDue(done, NOW)).toBe(false);
  });

  it('is never due for a player with nothing to judge', () => {
    expect(warmupDue(child({}), NOW)).toBe(false);
    expect(warmupDue(null, NOW)).toBe(false);
  });

  it('works for a player who played before stats existed (seeded from progress)', () => {
    const c = child({});
    delete c.stats;
    // Hello's dialogues were proven at 100%: judged, but strong. Still a subject.
    expect(pickWarmupSubject(c, NOW)).toBeDefined();
  });
});

describe('playing the warm-up', () => {
  it('asks at least ten questions', () => {
    expect(WARMUP_QUESTIONS).toBeGreaterThanOrEqual(10);
  });

  it('plays at the child’s level for that step (or the manual pin)', () => {
    const ref = { ...findSkill('people-words')!, unitNo: 2 };
    const c = child({});
    expect(warmupLevel(c, { unit: ref.chapter, step: ref.skill, unitNo: 2 })).toBe(3);
    expect(warmupLevel({ ...c, adaptive: false, level: 1 }, { unit: ref.chapter, step: ref.skill, unitNo: 2 })).toBe(1);
  });

  it('rotates the step’s own games, never speaking or typing', () => {
    const words = findSkill('people-words')!.skill;
    expect([0, 1, 2, 3].map((n) => warmupActivity(words, 3, n))).toEqual(['listen', 'name', 'listen', 'name']);
    const spellRamp = findSkill('word-order')!.skill;
    expect([0, 1, 2].map((n) => warmupActivity(spellRamp, 4, n))).not.toContain('spell');
  });
});
