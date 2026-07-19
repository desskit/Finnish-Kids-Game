import { describe, it, expect } from 'vitest';
import { dialogues } from './dialogues';

describe('dialogue content integrity', () => {
  it('ships a non-empty registry with unique ids and valid tiers', () => {
    expect(dialogues.length).toBeGreaterThan(0);
    const ids = dialogues.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of dialogues) expect([1, 2, 3, 4, 5].includes(d.tier)).toBe(true);
  });

  it('spans the full tier ramp (t1 greetings up to the t5 expert register)', () => {
    const tiers = new Set(dialogues.map((d) => d.tier));
    for (const t of [1, 2, 3, 4, 5]) expect(tiers.has(t)).toBe(true);
  });

  it('never lets a distractor duplicate the correct reply within its own exchange', () => {
    for (const d of dialogues) {
      const opts = [d.reply.fi, ...d.distractors.map((x) => x.fi)];
      expect(new Set(opts).size).toBe(opts.length);
    }
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
