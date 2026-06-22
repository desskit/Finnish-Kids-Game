import { describe, it, expect } from 'vitest';
import type { Child } from '../state/storage';
import { activityLevel, recordRoundOnChild } from './progress';

function child(): Child {
  return {
    id: 'c',
    name: 'Test',
    avatar: '🦊',
    level: 1,
    stars: 0,
    createdAt: 0,
    progress: {},
    srs: {},
  };
}

describe('recordRoundOnChild', () => {
  it('accumulates plays / stars / possible and tracks the best round', () => {
    let c = child();
    c = recordRoundOnChild(c, 'animals', 'listen', 4, 6);
    c = recordRoundOnChild(c, 'animals', 'listen', 6, 6);

    const entry = c.progress.animals.listen;
    expect(entry).toMatchObject({
      plays: 2,
      bestStars: 6,
      totalStars: 10,
      totalPossible: 12,
    });
    expect(typeof entry.lastPlayed).toBe('number');
  });

  it('does not mutate the input child (pure)', () => {
    const c = child();
    const next = recordRoundOnChild(c, 'animals', 'listen', 6, 6);
    expect(c.progress).toEqual({});
    expect(next).not.toBe(c);
  });

  it('raises the adaptive level after consecutive strong rounds', () => {
    let c = child();
    expect(activityLevel(c, 'animals', 'listen')).toBe(1);
    c = recordRoundOnChild(c, 'animals', 'listen', 6, 6); // 1st strong round: holds
    expect(activityLevel(c, 'animals', 'listen')).toBe(1);
    c = recordRoundOnChild(c, 'animals', 'listen', 6, 6); // 2nd: window promotes
    expect(activityLevel(c, 'animals', 'listen')).toBe(2);
  });

  it('keeps activities and topics independent', () => {
    let c = child();
    c = recordRoundOnChild(c, 'animals', 'listen', 6, 6);
    c = recordRoundOnChild(c, 'animals', 'listen', 6, 6);
    expect(activityLevel(c, 'animals', 'listen')).toBe(2);
    expect(activityLevel(c, 'animals', 'build')).toBe(1);
    expect(activityLevel(c, 'food', 'listen')).toBe(1);
  });
});

describe('activityLevel', () => {
  it('defaults to 1 for unknown children / topics / activities', () => {
    expect(activityLevel(null, 'x', 'y')).toBe(1);
    expect(activityLevel(child(), 'x', 'y')).toBe(1);
  });
});
