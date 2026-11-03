import { describe, it, expect } from 'vitest';
import type { Child } from '../state/storage';
import { advanceAfter } from './autoAdvance';
import { findUnit } from './course';

const kid = (over: Partial<Child> = {}): Child => ({
  id: 'k',
  name: 'K',
  avatar: '🦊',
  level: 1,
  stars: 0,
  createdAt: 1,
  progress: {},
  srs: {},
  course: { lessonsSeen: {}, checkpoints: {}, openersHeard: { hello: 1 } },
  ...over,
});

const done = { plays: 6, bestStars: 6, totalStars: 36, totalPossible: 36, lastPlayed: 1, level: 3, recent: [], topProvenAt: 5 };
const playing = { ...done, topProvenAt: undefined };

describe('going on when a step is finished', () => {
  it('goes from the first step to the lesson it opens', () => {
    const before = kid({ progress: { hello: { greetings: playing } } });
    const after = kid({ progress: { hello: { greetings: done } } });
    expect(advanceAfter(before, after, 'hello', 'greetings')).toMatchObject({ href: '/lesson/sounds' });
  });

  it('goes from a step to the next one once the lesson is read', () => {
    const lessonsSeen = { sounds: 1 };
    const before = kid({ progress: { hello: { greetings: playing } }, course: { lessonsSeen, checkpoints: {}, openersHeard: { hello: 1 } } });
    const after = kid({ progress: { hello: { greetings: done } }, course: { lessonsSeen, checkpoints: {}, openersHeard: { hello: 1 } } });
    const next = advanceAfter(before, after, 'hello', 'greetings');
    expect(next?.href).toBe('/skill/introduce');
    expect(next?.titleEn).toBe('Introduce yourself');
  });

  it('goes to the checkpoint after the last step', () => {
    const unit = findUnit('hello')!;
    const all = Object.fromEntries(unit.skills.map((s) => [s.id, done]));
    const last = unit.skills.filter((s) => !s.optional).at(-1)!;
    const course = { lessonsSeen: { sounds: 1 }, checkpoints: {}, openersHeard: { hello: 1 } };
    const before = kid({ progress: { hello: { ...all, [last.id]: playing } }, course });
    const after = kid({ progress: { hello: all }, course });
    expect(advanceAfter(before, after, 'hello', last.id)).toMatchObject({ href: '/checkpoint/hello', titleFi: 'Välitesti' });
  });

  it('stays put while the step is still being climbed, or when a finished step is replayed', () => {
    const climbing = kid({ progress: { hello: { greetings: playing } } });
    expect(advanceAfter(climbing, climbing, 'hello', 'greetings')).toBeNull();
    const finished = kid({ progress: { hello: { greetings: done } } });
    expect(advanceAfter(finished, finished, 'hello', 'greetings')).toBeNull();
  });
});

describe('sleeping on a step', () => {
  const DAY = 86_400_000;
  const T = new Date(2026, 10, 3, 17).getTime();
  const lessonsSeen = { sounds: 1 };
  const course = { lessonsSeen, checkpoints: {}, openersHeard: { hello: 1 } };

  it('a step proven today goes on to the next one, saying it finishes tomorrow', () => {
    const before = kid({ progress: { hello: { greetings: { ...playing, firstPlayedAt: T, lastPlayed: T } } }, course });
    const after = kid({ progress: { hello: { greetings: { ...done, firstPlayedAt: T, lastPlayed: T, topProvenAt: T } } }, course });
    const next = advanceAfter(before, after, 'hello', 'greetings');
    expect(next).toMatchObject({ href: '/skill/introduce', tomorrow: true });
  });

  it('its round the next day finishes it, and play goes on', () => {
    const waiting = { ...done, firstPlayedAt: T, lastPlayed: T, topProvenAt: T };
    const before = kid({ progress: { hello: { greetings: waiting } }, course });
    const after = kid({ progress: { hello: { greetings: { ...waiting, lastPlayed: T + DAY } } }, course });
    const next = advanceAfter(before, after, 'hello', 'greetings');
    expect(next?.href).toBe('/skill/introduce');
    expect(next?.tomorrow).toBeUndefined();
  });
});
