import { describe, it, expect } from 'vitest';
import type { ActivityProgress, Child } from '../state/storage';
import type { ItemSchedule } from './srs';
import { BADGES, BADGE_CATEGORIES, badgeProgress, earnedBadgeIds, kindsPlayed, type BadgeEnv } from './badges';
import { MAX_BOX } from './srs';
import { PATH, badgeEnv } from './path';

const ENV: BadgeEnv = {
  checkpointUnitIds: ['u1', 'u2', 'u3', 'u4'],
  minorKinds: { p1: 'spell' },
  kertausStepIds: ['k1', 'k2'],
  conversationStepIds: ['c1'],
  skillKinds: { p1: ['build', 'order', 'order'], w1: ['listen', 'name', 'name'] },
  allKinds: ['build', 'order', 'spell', 'listen', 'name'],
};

function child(patch: Partial<Child> = {}): Child {
  return {
    id: 'c',
    name: 'Test',
    avatar: '🦊',
    level: 1,
    stars: 0,
    createdAt: 0,
    progress: {},
    srs: {},
    ...patch,
  };
}

function progress(patch: Partial<ActivityProgress>): ActivityProgress {
  return { plays: 1, bestStars: 6, totalStars: 6, totalPossible: 6, lastPlayed: 1, level: 1, ...patch };
}

function schedule(seen: number, correct: number, box = 1): ItemSchedule {
  return { box, due: 0, seen, correct, lastSeenAt: 0 };
}

const has = (c: Child, id: string, env = ENV) => earnedBadgeIds(c, env).has(id);

describe('achievement catalog', () => {
  it('has unique ids, a real category and a clear requirement for every badge', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
    const cats = new Set(BADGE_CATEGORIES.map((c) => c.id));
    for (const b of BADGES) {
      expect(cats.has(b.category), b.id).toBe(true);
      expect(b.hintEn.length, b.id).toBeGreaterThan(10);
    }
  });

  it('gives a brand-new child nothing — and a progress line for every badge', () => {
    expect(earnedBadgeIds(child(), ENV).size).toBe(0);
    for (const b of BADGES) {
      const p = badgeProgress(child(), ENV, b);
      expect(p.need, b.id).toBeGreaterThan(0);
      expect(p.have, b.id).toBe(0);
      expect(p.unit, b.id).toBeTruthy();
    }
  });

  it('measures against the real course (a checkpoint per unit but Mestari, 4 Kertaus steps, many sentence steps)', () => {
    expect(badgeEnv.checkpointUnitIds.length).toBe(PATH.length - 1);
    expect(badgeEnv.kertausStepIds).toHaveLength(4);
    expect(Object.keys(badgeEnv.minorKinds).length).toBeGreaterThanOrEqual(10);
    expect(badgeEnv.allKinds).not.toContain('say'); // needs a microphone — never required
    expect(badgeEnv.allKinds).toEqual(expect.arrayContaining(['spell', 'conversation', 'possessive']));
  });
});

describe('earning achievements', () => {
  it('first steps after any played round', () => {
    expect(has(child({ progress: { u: { s: progress({ plays: 1 }) } } }), 'first-steps')).toBe(true);
  });

  it('star milestones at 100 and 500', () => {
    expect(has(child({ stars: 99 }), 'stars-100')).toBe(false);
    expect(has(child({ stars: 100 }), 'stars-100')).toBe(true);
    expect(has(child({ stars: 500 }), 'stars-500')).toBe(true);
  });

  it('"Top of the ladder" needs a PROVEN top level — reaching it is not enough', () => {
    expect(has(child({ progress: { u: { s: progress({ level: 4 }) } } }), 'level-up')).toBe(false);
    expect(has(child({ progress: { u: { s: progress({ level: 4, topProvenAt: 1 }) } } }), 'level-up')).toBe(true);
  });

  it('course badges follow passed checkpoints (an attempt is not a pass)', () => {
    const cp = (n: number, best = 0.9) =>
      Object.fromEntries(Array.from({ length: n }, (_, i) => [`u${i + 1}`, { passedAt: 1, best, attempts: 1 }]));
    expect(has(child({ course: { checkpoints: { u1: { best: 0.5, attempts: 1 } } } }), 'first-checkpoint')).toBe(false);
    expect(has(child({ course: { checkpoints: cp(1) } }), 'first-checkpoint')).toBe(true);
    expect(has(child({ course: { checkpoints: cp(1) } }), 'flawless')).toBe(false);
    expect(has(child({ course: { checkpoints: cp(1, 1) } }), 'flawless')).toBe(true);
    expect(has(child({ course: { checkpoints: cp(2) } }), 'halfway')).toBe(true);
    expect(has(child({ course: { checkpoints: cp(3) } }), 'course-done')).toBe(false);
    expect(has(child({ course: { checkpoints: cp(4) } }), 'course-done')).toBe(true);
  });

  it('skill badges reward the hard parts: typed sentences, every Kertaus, conversations', () => {
    const proven = progress({ level: 3, topProvenAt: 1 });
    // Writer counts sentences TYPED right in the minor typing rounds.
    const typed = (right: number) => progress({ bonus: { plays: 5, right, total: 30 } });
    expect(has(child({ progress: { u: { p1: typed(24) } } }), 'writer')).toBe(false);
    expect(has(child({ progress: { u: { p1: typed(20) }, v: { p2: typed(5) } } }), 'writer')).toBe(true);
    expect(has(child({ progress: { a: { k1: proven } } }), 'memory')).toBe(false);
    expect(has(child({ progress: { a: { k1: proven }, b: { k2: proven } } }), 'memory')).toBe(true);
    expect(has(child({ progress: { u: { c1: progress({ plays: 14 }) } } }), 'chatter')).toBe(false);
    expect(has(child({ progress: { u: { c1: progress({ plays: 15 }) } } }), 'chatter')).toBe(true);
  });

  it('Game master counts the KINDS of game actually served (ladder up to the level reached)', () => {
    const c = child({ progress: { u: { p1: progress({ level: 2 }), w1: progress({ level: 3 }) } } });
    expect([...kindsPlayed(c, ENV)].sort()).toEqual(['build', 'listen', 'name', 'order']);
    expect(has(c, 'all-games')).toBe(false);
    const noTyping = child({ progress: { u: { p1: progress({ level: 3 }), w1: progress({ level: 2 }) } } });
    expect(has(noTyping, 'all-games')).toBe(false); // typing (the minor round) not played yet
    const all = child({
      progress: { u: { p1: progress({ level: 3, bonus: { plays: 1, right: 3, total: 6 } }), w1: progress({ level: 2 }) } },
    });
    expect(has(all, 'all-games')).toBe(true);
  });

  it('word badges come from the SRS log — grammar schedules never count', () => {
    const srs: Record<string, ItemSchedule> = {};
    for (let i = 0; i < 25; i++) srs['w' + i] = schedule(1, 1, 1);
    for (let i = 0; i < 30; i++) srs['con:x' + i] = schedule(5, 5, MAX_BOX);
    expect(has(child({ srs }), 'words-25')).toBe(true);
    expect(has(child({ srs }), 'words-100')).toBe(false);
    expect(has(child({ srs }), 'mastered-10')).toBe(false);
    for (let i = 0; i < 10; i++) srs['w' + i] = schedule(4, 4, MAX_BOX);
    expect(has(child({ srs }), 'mastered-10')).toBe(true);
  });

  it('Sharpshooter needs 100 answers AND 90% first-try', () => {
    const few = { a: schedule(50, 50) };
    expect(has(child({ srs: few }), 'sharp')).toBe(false);
    expect(badgeProgress(child({ srs: few }), ENV, BADGES.find((b) => b.id === 'sharp')!)).toMatchObject({
      have: 50,
      need: 100,
      unit: 'answers',
    });
    expect(has(child({ srs: { a: schedule(100, 85) } }), 'sharp')).toBe(false);
    expect(has(child({ srs: { a: schedule(100, 92) } }), 'sharp')).toBe(true);
  });

  it('streak badges use the BEST streak, so a missed day never takes one away', () => {
    expect(has(child({ streakDays: 2 }), 'streak-3')).toBe(false);
    expect(has(child({ streakDays: 3 }), 'streak-3')).toBe(true);
    expect(has(child({ streakDays: 1, bestStreakDays: 7 }), 'streak-7')).toBe(true);
  });

  it('Sound explorer: all four Alphabet-corner games played', () => {
    const r = { plays: 1, right: 6, total: 8, best: 0.75 };
    expect(has(child({ course: { sounds: { 'first-letter': r, length: r, vowel: r } } }), 'sounds')).toBe(false);
    expect(has(child({ course: { sounds: { names: r, 'first-letter': r, length: r, vowel: r } } }), 'sounds')).toBe(true);
  });

  it('Bookworm counts lessons read to the end', () => {
    const seen = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`l${i}`, 1]));
    expect(has(child({ course: { lessonsSeen: seen } }), 'bookworm')).toBe(true);
  });
});
