import { describe, it, expect } from 'vitest';
import { conversations } from './conversations';

describe('conversation content integrity', () => {
  it('ships non-empty, uniquely-ided scenes with valid tiers and ≥2 turns each', () => {
    expect(conversations.length).toBeGreaterThan(0);
    const ids = conversations.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of conversations) {
      expect([1, 2, 3, 4, 5].includes(c.tier)).toBe(true);
      expect(c.turns.length).toBeGreaterThanOrEqual(2);
      expect(c.titleFi.trim()).toBeTruthy();
      expect(c.titleEn.trim()).toBeTruthy();
      expect(c.icon.trim()).toBeTruthy();
      expect(c.partnerIcon.trim()).toBeTruthy();
    }
  });

  it('gives every line both languages and real, non-duplicate options per turn', () => {
    for (const c of conversations) {
      for (const t of c.turns) {
        for (const line of [t.partner, t.reply, ...t.distractors]) {
          expect(line.fi.trim()).toBeTruthy();
          expect(line.en.trim()).toBeTruthy();
        }
        expect(t.distractors.length).toBeGreaterThanOrEqual(2);
        // A distractor must never equal the correct reply.
        const opts = [t.reply.fi, ...t.distractors.map((d) => d.fi)];
        expect(new Set(opts).size).toBe(opts.length);
      }
    }
  });

  it('keeps the case-sensitive reciprocal correct: kuulua → sinulle, olla → sinä', () => {
    const lines = conversations.flatMap((c) => c.turns.flatMap((t) => [t.partner.fi, t.reply.fi]));
    // "Mitä kuuluu?" must be answered with the allative echo, never "Entä sinä?".
    const kuuluuReply = lines.find((l) => /Entä sinulle\?/.test(l));
    expect(kuuluuReply).toBeTruthy();
    // The age question uses plain olla, so its echo is the nominative "Entä sinä?".
    // (Reviewer-corrected reply: "Olen kuusivuotias", not "kuusi vuotta".)
    const ageReply = lines.find((l) => /Olen \S+vuotias\. Entä sinä\?/.test(l));
    expect(ageReply).toBeTruthy();
  });
});
