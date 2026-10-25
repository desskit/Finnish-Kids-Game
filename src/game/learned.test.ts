import { describe, it, expect } from 'vitest';
import type { Child } from '../state/storage';
import { newWordsOn, surpriseStory, wordsPracticedOn, SURPRISE_AFTER_DAYS } from './learned';
import { review } from './srs';
import { courseStories } from '../content/stories';
import { reviewItems } from '../content';

const DAY = 86_400_000;
const NOW = new Date(2026, 9, 20, 12).getTime();
const words = reviewItems.filter((i) => i.emoji).slice(0, 4).map((i) => i.id);

function child(over: Partial<Child> = {}): Child {
  return { id: 'k', name: 'K', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs: {}, ...over } as Child;
}

describe('what was learned today', () => {
  it('a word is new on the day it was first answered, and keeps that day', () => {
    const first = review(undefined, true, NOW - DAY);
    const again = review(first, true, NOW);
    expect(again.firstSeenAt).toBe(NOW - DAY);
    const c = child({ srs: { [words[0]]: again, [words[1]]: review(undefined, false, NOW) } });
    expect(newWordsOn(c, NOW).map((w) => w.id)).toEqual([words[1]]);
    expect(wordsPracticedOn(c, NOW).map((w) => w.id).sort()).toEqual([words[0], words[1]].sort());
  });

  it('an older save (no first-seen day) is never "new today", and grammar keys are not words', () => {
    const old = { box: 2, due: NOW, seen: 3, correct: 3, lastSeenAt: NOW };
    const c = child({ srs: { [words[0]]: old, 'con:this-is': review(undefined, true, NOW) } });
    expect(newWordsOn(c, NOW)).toEqual([]);
    expect(wordsPracticedOn(c, NOW).map((w) => w.id)).toEqual([words[0]]);
  });
});

describe('the occasional surprise', () => {
  const finished = courseStories.slice(0, 3).map((s) => s.id);
  const reader = child({
    course: { stories: Object.fromEntries(finished.map((id) => [id, { reads: 1, goodAt: NOW - 30 * DAY }])) },
  });

  it('comes on about one day in three, the same answer all day, always a story read well a while ago', () => {
    let days = 0;
    for (let d = 0; d < 365; d++) {
      const s = surpriseStory(reader, NOW + d * DAY);
      expect(surpriseStory(reader, NOW + d * DAY + 1000)?.id).toBe(s?.id);
      if (s) {
        days++;
        expect(finished).toContain(s.id);
      }
    }
    expect(days).toBeGreaterThan(365 * 0.2);
    expect(days).toBeLessThan(365 * 0.47);
  });

  it('never offers a story finished just now, or one never finished', () => {
    const fresh = child({ course: { stories: { [finished[0]]: { reads: 1, goodAt: NOW - (SURPRISE_AFTER_DAYS - 1) * DAY } } } });
    const weak = child({ course: { stories: { [finished[0]]: { reads: 2, last: 0.25 } } } });
    for (let d = 0; d < 30; d++) {
      expect(surpriseStory(fresh, NOW + d * DAY - d * DAY)).toBeUndefined();
      expect(surpriseStory(weak, NOW + d * DAY)).toBeUndefined();
    }
  });
});
