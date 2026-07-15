import { describe, it, expect } from 'vitest';
import { buildAdventure, ADVENTURE_MAX_STOPS } from './adventure';
import { findSkill } from './path';
import { reviewItems } from '../content';
import type { Child } from '../state/storage';

const T0 = 1_000_000_000_000;

function mkChild(overrides: Partial<Child> = {}): Child {
  return {
    id: 'k',
    name: 'Kid',
    avatar: '🦊',
    level: 1,
    stars: 0,
    createdAt: 1,
    progress: {},
    srs: {},
    ...overrides,
  };
}

describe('buildAdventure', () => {
  it('gives a brand-new child just the "next" stop', () => {
    const stops = buildAdventure(mkChild(), T0);
    expect(stops).toHaveLength(1);
    expect(stops[0].kind).toBe('skill');
    expect(stops[0].skillId).toBe('listen-animals'); // the path's first warm-up
  });

  it('adds a review stop when something is due', () => {
    const dueId = reviewItems[0].id;
    const child = mkChild({
      srs: { [dueId]: { box: 2, due: T0 - 1000, seen: 1, correct: 1, lastSeenAt: T0 - 2000 } },
    });
    const stops = buildAdventure(child, T0);
    expect(stops[0]).toMatchObject({ kind: 'review', titleFi: 'Kertaus' });
  });

  it('never adds a review stop when nothing is due yet', () => {
    const seenId = reviewItems[0].id;
    const child = mkChild({
      // Due in the FUTURE — seen, but not due.
      srs: { [seenId]: { box: 2, due: T0 + 100000, seen: 1, correct: 1, lastSeenAt: T0 } },
    });
    const stops = buildAdventure(child, T0);
    expect(stops.some((s) => s.kind === 'review')).toBe(false);
  });

  it('suggests the weakest recently-played node (below the practice-more bar)', () => {
    const { chapter, skill } = findSkill('this-is')!;
    const child = mkChild({
      progress: {
        [chapter.id]: {
          [skill.id]: {
            plays: 3,
            bestStars: 2,
            totalStars: 4,
            totalPossible: 12,
            lastPlayed: T0,
            level: 2,
            recent: [0.5, 0.4, 0.3], // well under the 0.85 bar
          },
        },
      },
    });
    const stops = buildAdventure(child, T0);
    expect(stops.some((s) => s.kind === 'skill' && s.skillId === 'this-is')).toBe(true);
  });

  it('does not suggest a node the child is already doing well on', () => {
    const { chapter, skill } = findSkill('this-is')!;
    const child = mkChild({
      progress: {
        [chapter.id]: {
          [skill.id]: {
            plays: 3,
            bestStars: 6,
            totalStars: 17,
            totalPossible: 18,
            lastPlayed: T0,
            level: 3,
            recent: [1, 0.9, 1], // well above the 0.85 bar
          },
        },
      },
    });
    const stops = buildAdventure(child, T0);
    // "this-is" isn't the weakest, but "next" could still coincidentally be
    // some other unplayed node — just assert this-is itself never shows up.
    expect(stops.some((s) => s.kind === 'skill' && s.skillId === 'this-is')).toBe(false);
  });

  it('skips a node whose recent window is empty (e.g. right after a level-up)', () => {
    const { chapter, skill } = findSkill('this-is')!;
    const child = mkChild({
      progress: {
        [chapter.id]: {
          [skill.id]: {
            plays: 3,
            bestStars: 6,
            totalStars: 17,
            totalPossible: 18,
            lastPlayed: T0,
            level: 3,
            recent: [], // just leveled up — no evidence yet, must NOT read as "worst"
          },
        },
      },
    });
    const stops = buildAdventure(child, T0);
    expect(stops.some((s) => s.kind === 'skill' && s.skillId === 'this-is')).toBe(false);
  });

  it('never exceeds the max stop count', () => {
    const { chapter, skill } = findSkill('this-is')!;
    const dueId = reviewItems[0].id;
    const child = mkChild({
      srs: { [dueId]: { box: 2, due: T0 - 1000, seen: 1, correct: 1, lastSeenAt: T0 } },
      progress: {
        [chapter.id]: {
          [skill.id]: {
            plays: 3,
            bestStars: 2,
            totalStars: 4,
            totalPossible: 12,
            lastPlayed: T0,
            level: 2,
            recent: [0.2, 0.3],
          },
        },
      },
    });
    const stops = buildAdventure(child, T0);
    expect(stops.length).toBeLessThanOrEqual(ADVENTURE_MAX_STOPS);
  });
});
