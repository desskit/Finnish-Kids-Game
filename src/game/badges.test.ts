import { describe, it, expect } from 'vitest';
import type { Child } from '../state/storage';
import type { ItemSchedule } from './srs';
import { BADGES, earnedBadgeIds } from './badges';
import { MAX_BOX } from './srs';

const ENV = {
  topicCount: 2,
  activityIds: ['listen', 'build'],
  // `listen`/`build` are depth-4 nodes; `locatives` is a deep depth-8 node.
  skillMaxLevels: { listen: 4, build: 4, locatives: 8 },
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

function schedule(seen: number, correct: number, box = 1): ItemSchedule {
  return { box, due: 0, seen, correct, lastSeenAt: 0 };
}

describe('badge catalog', () => {
  it('has unique ids', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
  });
});

describe('earnedBadgeIds', () => {
  it('awards nothing for a brand-new child', () => {
    expect(earnedBadgeIds(child(), ENV).size).toBe(0);
  });

  it('awards first-steps after any played round', () => {
    const c = child({
      progress: { animals: { listen: progress({ plays: 1 }) } },
    });
    expect(earnedBadgeIds(c, ENV).has('first-steps')).toBe(true);
  });

  it('awards star milestones at the thresholds', () => {
    expect(earnedBadgeIds(child({ stars: 24 }), ENV).has('stars-25')).toBe(false);
    expect(earnedBadgeIds(child({ stars: 25 }), ENV).has('stars-25')).toBe(true);
    expect(earnedBadgeIds(child({ stars: 100 }), ENV).has('stars-100')).toBe(true);
  });

  it('awards words-10 and mastered-10 from the SRS log', () => {
    const practiced: Record<string, ItemSchedule> = {};
    for (let i = 0; i < 10; i++) practiced['w' + i] = schedule(1, 1, 1);
    expect(earnedBadgeIds(child({ srs: practiced }), ENV).has('words-10')).toBe(true);
    expect(earnedBadgeIds(child({ srs: practiced }), ENV).has('mastered-10')).toBe(false);

    const mastered: Record<string, ItemSchedule> = {};
    for (let i = 0; i < 10; i++) mastered['w' + i] = schedule(5, 5, MAX_BOX);
    expect(earnedBadgeIds(child({ srs: mastered }), ENV).has('mastered-10')).toBe(true);
  });

  it('awards sharp only with enough volume and high accuracy', () => {
    const lowVolume: Record<string, ItemSchedule> = { a: schedule(5, 5) };
    expect(earnedBadgeIds(child({ srs: lowVolume }), ENV).has('sharp')).toBe(false);

    const sharp: Record<string, ItemSchedule> = {};
    for (let i = 0; i < 10; i++) sharp['w' + i] = schedule(3, 3); // 30 seen, 100%
    expect(earnedBadgeIds(child({ srs: sharp }), ENV).has('sharp')).toBe(true);
  });

  it("awards level-up when any node reaches its OWN ceiling", () => {
    const c = child({
      progress: { animals: { listen: progress({ plays: 3, level: 4 }) } },
    });
    expect(earnedBadgeIds(c, ENV).has('level-up')).toBe(true);
  });

  it('does not award level-up for a deep node still below its ceiling', () => {
    // locatives caps at 8; level 4 is mid-climb, not mastered.
    const c = child({
      progress: { where: { locatives: progress({ plays: 3, level: 4 }) } },
    });
    expect(earnedBadgeIds(c, ENV).has('level-up')).toBe(false);
  });

  it('awards explorer for playing every topic and all-games for every game', () => {
    const explorer = child({
      progress: {
        animals: { listen: progress({ plays: 1 }) },
        food: { listen: progress({ plays: 1 }) },
      },
    });
    expect(earnedBadgeIds(explorer, ENV).has('explorer')).toBe(true);
    expect(earnedBadgeIds(explorer, ENV).has('all-games')).toBe(false);

    const allGames = child({
      progress: {
        animals: { listen: progress({ plays: 1 }), build: progress({ plays: 1 }) },
      },
    });
    expect(earnedBadgeIds(allGames, ENV).has('all-games')).toBe(true);
  });
});

// Minimal ActivityProgress with sensible defaults for the fields a rule reads.
function progress(patch: Partial<import('../state/storage').ActivityProgress>) {
  return {
    plays: 0,
    bestStars: 0,
    totalStars: 0,
    totalPossible: 0,
    lastPlayed: 0,
    ...patch,
  };
}
