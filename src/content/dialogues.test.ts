import { describe, it, expect } from 'vitest';
import { dialogues } from './dialogues';

describe('dialogue content integrity', () => {
  it('ships a non-empty registry with unique ids and valid tiers', () => {
    expect(dialogues.length).toBeGreaterThan(0);
    const ids = dialogues.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of dialogues) expect([1, 2, 3, 4].includes(d.tier)).toBe(true);
  });

  it('gives every line both Finnish and English, and real distractors', () => {
    for (const d of dialogues) {
      for (const line of [d.prompt, d.reply, ...d.distractors]) {
        expect(line.fi.trim()).toBeTruthy();
        expect(line.en.trim()).toBeTruthy();
      }
      expect(d.distractors.length).toBeGreaterThanOrEqual(2);
      // A distractor must never equal the correct reply (that'd be two answers).
      expect(d.distractors.some((x) => x.fi === d.reply.fi)).toBe(false);
    }
  });
});
