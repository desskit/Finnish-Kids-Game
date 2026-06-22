import { describe, it, expect } from 'vitest';
import {
  buildListenRound,
  buildPhraseRound,
  buildSpellingRound,
  buildWordOrderRound,
  buildCountingRound,
  buildAgreementRound,
  buildConjugationRound,
  buildReviewRound,
} from './round';
import { animals, numbers, adjectives, verbs } from '../content';
import { formFor } from '../content/types';

// Round builders are random, so each invariant is checked over many runs. They
// use the real sourced content, so these double as an integration check that the
// builders + data agree.
const RUNS = 100;

describe('buildListenRound', () => {
  it('holds its invariants across many runs', () => {
    for (let r = 0; r < RUNS; r++) {
      const round = buildListenRound(animals.items, 6, 3);
      expect(round).toHaveLength(Math.min(6, animals.items.length));
      for (const q of round) {
        expect(q.options).toHaveLength(3);
        // the target appears exactly once...
        expect(q.options.filter((o) => o.id === q.target.id)).toHaveLength(1);
        // ...options are distinct...
        expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
        // ...and every option is a real item from the pool.
        q.options.forEach((o) => expect(animals.items).toContain(o));
      }
    }
  });

  it('never asks for more questions than there are items', () => {
    expect(buildListenRound(animals.items, 999, 3)).toHaveLength(animals.items.length);
  });
});

describe('buildPhraseRound', () => {
  it('keeps the answer present and never offers a blank tile', () => {
    for (let r = 0; r < RUNS; r++) {
      const round = buildPhraseRound(animals.items, animals.constructions, 6, 3);
      for (const q of round) {
        expect(q.options.some((o) => o.id === q.item.id)).toBe(true);
        expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
        expect(q.options.length).toBeGreaterThanOrEqual(1);
        expect(q.options.length).toBeLessThanOrEqual(3);
        // every tile must resolve a Finnish form for this construction
        q.options.forEach((o) => expect(formFor(o, q.construction)).toBeTruthy());
      }
    }
  });
});

describe('buildSpellingRound', () => {
  it('returns distinct items from the pool', () => {
    for (let r = 0; r < RUNS; r++) {
      const round = buildSpellingRound(animals.items, 6);
      expect(round).toHaveLength(Math.min(6, animals.items.length));
      expect(new Set(round.map((i) => i.id)).size).toBe(round.length);
      round.forEach((i) => expect(animals.items).toContain(i));
    }
  });
});

describe('buildWordOrderRound', () => {
  it('produces a real puzzle that reorders back to the sentence', () => {
    for (let r = 0; r < RUNS; r++) {
      const round = buildWordOrderRound(animals.items, animals.constructions, 6);
      for (const q of round) {
        // tokens in id order reconstruct the spoken sentence
        const ordered = [...q.tokens]
          .sort((a, b) => a.id - b.id)
          .map((t) => t.text)
          .join(' ');
        expect(ordered).toBe(q.sentence);
        // the shuffled set is a permutation of the same tokens
        expect([...q.shuffled].map((t) => t.id).sort((a, b) => a - b)).toEqual(
          [...q.tokens].map((t) => t.id).sort((a, b) => a - b),
        );
        // ...and it isn't already solved (when there's more than one token)
        if (q.tokens.length > 1) {
          expect(q.shuffled.every((t, i) => t.id === q.tokens[i].id)).toBe(false);
        }
      }
    }
  });
});

describe('buildCountingRound', () => {
  it('pairs an in-range count with a noun, each with distinct options', () => {
    for (let r = 0; r < RUNS; r++) {
      const round = buildCountingRound(numbers.items, animals.items, 6, 3, 5);
      expect(round).toHaveLength(6);
      for (const q of round) {
        expect(q.numberOptions).toHaveLength(3);
        expect(q.nounOptions).toHaveLength(3);
        expect(q.numberOptions.some((n) => n.id === q.number.id)).toBe(true);
        expect(q.nounOptions.some((n) => n.id === q.noun.id)).toBe(true);
        expect(new Set(q.numberOptions.map((n) => n.id)).size).toBe(3);
        expect(new Set(q.nounOptions.map((n) => n.id)).size).toBe(3);
        const v = q.number.value ?? 0;
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(5);
      }
    }
  });
});

describe('buildAgreementRound', () => {
  it('offers exactly one agreeing form per question', () => {
    let produced = 0;
    for (let r = 0; r < RUNS; r++) {
      const round = buildAgreementRound(adjectives.items, animals.items, 6, 3);
      expect(round.length).toBeLessThanOrEqual(6);
      for (const q of round) {
        produced++;
        expect(q.options).toHaveLength(3);
        const correct = q.options.filter((o) => o.correct);
        expect(correct).toHaveLength(1);
        expect(correct[0].form).toBe(q.answer);
        // each option is a distinct case form of the noun
        expect(new Set(q.options.map((o) => o.caseId)).size).toBe(3);
      }
    }
    expect(produced).toBeGreaterThan(0);
  });
});

describe('buildReviewRound', () => {
  it('keeps the caller-chosen targets and order, with valid distinct options', () => {
    const targets = [animals.items[0], animals.items[1], animals.items[2]];
    for (let r = 0; r < RUNS; r++) {
      const round = buildReviewRound(targets, animals.items, 3);
      // one question per target, in the same order (most-overdue-first preserved)
      expect(round.map((q) => q.target.id)).toEqual(targets.map((t) => t.id));
      for (const q of round) {
        expect(q.options).toHaveLength(3);
        expect(q.options.filter((o) => o.id === q.target.id)).toHaveLength(1);
        expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
        q.options.forEach((o) => expect(animals.items).toContain(o));
      }
    }
  });

  it('returns an empty round for no targets', () => {
    expect(buildReviewRound([], animals.items, 3)).toEqual([]);
  });
});

describe('buildConjugationRound', () => {
  it('offers one correct conjugation with a matching clause', () => {
    let produced = 0;
    for (let r = 0; r < RUNS; r++) {
      const round = buildConjugationRound(verbs.items, 6, 3);
      expect(round.length).toBeLessThanOrEqual(6);
      for (const q of round) {
        produced++;
        expect(q.options).toHaveLength(3);
        const correct = q.options.filter((o) => o.correct);
        expect(correct).toHaveLength(1);
        expect(correct[0].form).toBe(q.answer);
        expect(q.clause).toBe(`${q.pronoun} ${q.answer}`);
        expect(new Set(q.options.map((o) => o.person)).size).toBe(3);
      }
    }
    expect(produced).toBeGreaterThan(0);
  });
});
