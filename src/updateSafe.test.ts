import { describe, it, expect } from 'vitest';
import { calmToUpdate, FRESH_MS } from './updateSafe';

describe('switching to a new version of the app', () => {
  it('happens on a menu screen', () => {
    for (const h of ['', '#/', '#/profiles', '#/notebook', '#/achievements', '#/math', '#/grown-up', '#/grown-up/settings']) {
      expect(calmToUpdate(h), h).toBe(true);
    }
  });

  it('never in the middle of a game, a story, a lesson or a checkpoint', () => {
    for (const h of ['#/skill/greetings', '#/story/little-cat', '#/lesson/sounds', '#/checkpoint/hello', '#/warmup', '#/review', '#/opener/hello', '#/math/test/math-plus-minus', '#/sounds/length']) {
      expect(calmToUpdate(h), h).toBe(false);
      expect(calmToUpdate(h, FRESH_MS + 1), h).toBe(false);
    }
  });

  it('also just as a new screen opens, before anything on it is answered', () => {
    // Play runs on from step to lesson to step without a menu in between.
    for (const h of ['#/skill/greetings', '#/lesson/sounds', '#/story/little-cat', '#/checkpoint/hello']) {
      expect(calmToUpdate(h, 0), h).toBe(true);
      expect(calmToUpdate(h, FRESH_MS - 1), h).toBe(true);
    }
  });
});
