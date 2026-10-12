import { describe, it, expect } from 'vitest';
import type { Child } from '../state/storage';
import {
  REVISIT_AFTER_DAYS,
  dueStoryRevisit,
  isGoodRead,
  needsSupport,
  nextStoryId,
  recordStoryOnChild,
  storyReadWell,
  storyStepDone,
} from './storyLog';

const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date(2026, 9, 1, 12).getTime();

function child(): Child {
  return { id: 'k', name: 'K', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs: {} };
}

describe('the story log', () => {
  it('one good read — 3 of 4 right first time — finishes a story', () => {
    expect(isGoodRead(3, 4)).toBe(true);
    expect(isGoodRead(2, 4)).toBe(false);
    let c = recordStoryOnChild(child(), 'no-hat', 2, 4, ['c0', 't1', 'w0-1', 'order'], T0);
    expect(storyReadWell(c, 'no-hat')).toBe(false);
    // A weak read: the next one shows the English, and asks other questions.
    expect(needsSupport(c, 'no-hat')).toBe(true);
    expect(c.course?.stories?.['no-hat']?.asked).toEqual(['c0', 't1', 'w0-1', 'order']);
    c = recordStoryOnChild(c, 'no-hat', 4, 4, ['c1', 't0', 'w1-0', 'order'], T0 + 1);
    expect(storyReadWell(c, 'no-hat')).toBe(true);
    expect(needsSupport(c, 'no-hat')).toBe(false);
    const rec = c.course!.stories!['no-hat'];
    expect(rec).toMatchObject({ reads: 2, goodAt: T0 + 1, last: 1 });
    expect(rec.seen).toEqual(expect.arrayContaining(['c0', 'c1', 't0', 't1', 'order']));
    // A later weak read doesn't undo it.
    c = recordStoryOnChild(c, 'no-hat', 0, 4, [], T0 + 2);
    expect(c.course!.stories!['no-hat'].goodAt).toBe(T0 + 1);
  });

  it('a step is done once each of its stories is read well; the next story is the first unread', () => {
    let c = child();
    expect(nextStoryId(c, ['morning', 'at-the-shop'])).toBe('morning');
    c = recordStoryOnChild(c, 'morning', 4, 4, [], T0);
    expect(storyStepDone(c, ['morning', 'at-the-shop'])).toBe(false);
    expect(nextStoryId(c, ['morning', 'at-the-shop'])).toBe('at-the-shop');
    c = recordStoryOnChild(c, 'at-the-shop', 3, 4, [], T0);
    expect(storyStepDone(c, ['morning', 'at-the-shop'])).toBe(true);
    expect(storyStepDone(c, [])).toBe(false);
  });

  it('a finished story comes back once, a few days later, the longest-waiting first', () => {
    let c = recordStoryOnChild(child(), 'no-hat', 4, 4, [], T0);
    c = recordStoryOnChild(c, 'sick-day', 4, 4, [], T0 + DAY);
    c = recordStoryOnChild(c, 'evening', 1, 4, [], T0); // never read well: never back
    expect(dueStoryRevisit(c, T0 + (REVISIT_AFTER_DAYS - 1) * DAY)).toBeUndefined();
    expect(dueStoryRevisit(c, T0 + REVISIT_AFTER_DAYS * DAY)).toBe('no-hat');
    c = recordStoryOnChild(c, 'no-hat', 2, 2, ['t0', 'c2'], T0 + REVISIT_AFTER_DAYS * DAY, 'revisit');
    // A revisit is not a read: it doesn't count as one, and it happens only once.
    expect(c.course!.stories!['no-hat'].reads).toBe(1);
    expect(dueStoryRevisit(c, T0 + 30 * DAY)).toBe('sick-day');
    c = recordStoryOnChild(c, 'sick-day', 1, 2, [], T0 + 30 * DAY, 'revisit');
    expect(dueStoryRevisit(c, T0 + 60 * DAY)).toBeUndefined();
  });
});
