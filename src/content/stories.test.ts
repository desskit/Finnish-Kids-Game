import { describe, it, expect } from 'vitest';
import { stories } from './stories';

describe('story content integrity', () => {
  it('ships a non-empty registry with unique ids and valid tiers', () => {
    expect(stories.length).toBeGreaterThan(0);
    const ids = stories.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of stories) expect([1, 2, 3, 4, 5].includes(s.tier)).toBe(true);
  });

  it('keeps every story a small, fully-illustrated read (4-8 short pages)', () => {
    for (const s of stories) {
      expect(s.pages.length).toBeGreaterThanOrEqual(4);
      expect(s.pages.length).toBeLessThanOrEqual(8);
      for (const p of s.pages) {
        expect(p.fi.trim()).toBeTruthy();
        expect(p.en.trim()).toBeTruthy();
        expect(p.emoji).toBeTruthy();
        // Short sentences only — this is a beginner's connected input.
        expect(p.fi.split(/\s+/).length).toBeLessThanOrEqual(5);
      }
    }
  });

  it('gives every story comprehension questions with exactly ONE correct option', () => {
    for (const s of stories) {
      expect(s.questions.length).toBeGreaterThanOrEqual(1);
      for (const q of s.questions) {
        expect(q.promptFi.trim()).toBeTruthy();
        expect(q.promptEn.trim()).toBeTruthy();
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.options.filter((o) => o.correct)).toHaveLength(1);
        // Options are distinct, fully labeled, picturable.
        expect(new Set(q.options.map((o) => o.fi)).size).toBe(q.options.length);
        for (const o of q.options) {
          expect(o.fi.trim()).toBeTruthy();
          expect(o.en.trim()).toBeTruthy();
          expect(o.emoji).toBeTruthy();
        }
      }
    }
  });

  it('spans more than one tier so the story pool ramps with the child', () => {
    expect(new Set(stories.map((s) => s.tier)).size).toBeGreaterThan(1);
  });
});
