import { describe, it, expect } from 'vitest';
import {
  buildListenRound,
  buildPhraseRound,
  buildSpellingRound,
  buildSpellingPhraseRound,
  buildWordOrderRound,
  buildCountingRound,
  buildAgreementRound,
  buildConjugationRound,
  buildReviewRound,
} from './round';
import {
  animals,
  numbers,
  adjectives,
  verbs,
  food,
  family,
  places,
  body,
  nature,
  clothes,
} from '../content';
import { nounConstructions } from '../content/constructions';
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

  it('builds past-negative rounds now that the form is sourced (the L4 rung)', () => {
    const combo = [{ tense: 'past', polarity: 'negative' }] as const;
    let produced = 0;
    for (let r = 0; r < RUNS; r++) {
      const round = buildConjugationRound(verbs.items, 6, 3, [...combo]);
      for (const q of round) {
        produced++;
        expect(q.tense).toBe('past');
        expect(q.polarity).toBe('negative');
        // Negative forms are multi-word ("en syönyt") — confirm a real clause.
        expect(q.clause).toBe(`${q.pronoun} ${q.answer}`);
        expect(q.answer).toContain(' ');
      }
    }
    // The whole point of the chapter-6 build: this rung is no longer empty.
    expect(produced).toBeGreaterThan(0);
  });
});

describe('tier gating never empties a curated construction set', () => {
  it('still plays a single higher-tier construction below its tier', () => {
    const iLike = animals.constructions.filter((c) => c.id === 'i-like');
    expect(iLike[0].tier).toBe(3);
    // maxTier 2 would filter out the only (tier-3) construction — the builder
    // must fall back to it rather than return an empty (blank-screen) round.
    const round = buildPhraseRound(animals.items, iLike, 6, 3, 2);
    expect(round.length).toBeGreaterThan(0);
    for (const q of round) expect(q.construction.id).toBe('i-like');
  });
});

describe('semantic gating (suitsSlot) in the pairing builders', () => {
  // The capstones mix ALL topics into ALL constructions — the gate is what
  // stops "Kissa menee äitiin" (the cat goes into mom). Locative carriers are
  // topics:['places']; possession excludes the unownables (sky, sea, …).
  const LOCATIVES = ['on-it', 'in-it', 'into-it', 'onto-it', 'out-of-it', 'off-it', 'in-them'];
  const MIXED = [
    ...animals.items,
    ...food.items,
    ...family.items,
    ...places.items,
    ...body.items,
    ...nature.items,
    ...clothes.items,
  ];

  it('never pairs a locative carrier with a non-place word (order + build + spell)', () => {
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildWordOrderRound(MIXED, nounConstructions, 6, 8)) {
        if (LOCATIVES.includes(q.construction.id)) expect(q.item.topic).toBe('places');
      }
      for (const q of buildPhraseRound(MIXED, nounConstructions, 6, 4, 8)) {
        if (LOCATIVES.includes(q.construction.id)) {
          expect(q.item.topic).toBe('places');
          for (const o of q.options) expect(o.topic).toBe('places');
        }
      }
      for (const q of buildSpellingPhraseRound(MIXED, nounConstructions, 6, 8)) {
        if (LOCATIVES.includes(q.construction.id)) expect(q.item.topic).toBe('places');
      }
    }
  });

  it('never claims to own the sky (possession excludes unownables)', () => {
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildPhraseRound(MIXED, nounConstructions, 6, 4, 8)) {
        if (q.construction.id.includes('have')) {
          expect(['sky', 'sea', 'rain', 'sun', 'moon']).not.toContain(q.item.id);
        }
      }
    }
  });
});

describe('tricky distractors (the L4+ near-miss lever)', () => {
  it('clusters counting distractors within ±2 of the true count', () => {
    for (let r = 0; r < RUNS; r++) {
      // maxCount 10 keeps plenty of counts available on both sides.
      for (const q of buildCountingRound(numbers.items, animals.items, 6, 3, 10, true)) {
        for (const opt of q.numberOptions) {
          if (opt.id === q.number.id) continue;
          expect(
            Math.abs((opt.value ?? 0) - (q.number.value ?? 0)),
            `count ${opt.value} too far from ${q.number.value}`,
          ).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it('slips a DIFFERENT verb of the same person into conjugation rounds', () => {
    let foreignSeen = 0;
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildConjugationRound(verbs.items, 6, 4, undefined, true)) {
        // Exactly one correct answer, all forms distinct.
        expect(q.options.filter((o) => o.correct)).toHaveLength(1);
        expect(new Set(q.options.map((o) => o.form)).size).toBe(q.options.length);
        // The foreign tile shares the target's person but not its form.
        const foreign = q.options.filter((o) => o.person === q.person && !o.correct);
        foreignSeen += foreign.length;
        expect(foreign.length).toBeLessThanOrEqual(1);
      }
    }
    expect(foreignSeen).toBeGreaterThan(0);
  });

  it('mixes a wrong-NUMBER form of the target case into agreement rounds', () => {
    let wrongNumberSeen = 0;
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildAgreementRound(adjectives.items, animals.items, 6, 4, 'singular', 7, true)) {
        expect(q.options.filter((o) => o.correct)).toHaveLength(1);
        expect(new Set(q.options.map((o) => o.form)).size).toBe(q.options.length);
        wrongNumberSeen += q.options.filter((o) => o.num === 'plural').length;
      }
    }
    expect(wrongNumberSeen).toBeGreaterThan(0);
  });
});

describe('the MatchTheWord case ramp (maxCases)', () => {
  it('confines low-level questions to the first cases of the ordered list', () => {
    // maxCases 3 (floored at optionCount 3) = nominative/genitive/partitive.
    const EARLY = ['nominative', 'genitive', 'partitive'];
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildAgreementRound(adjectives.items, animals.items, 6, 3, 'singular', 3)) {
        expect(EARLY).toContain(q.case);
        for (const o of q.options) expect(EARLY).toContain(o.caseId);
      }
    }
  });
});

describe('familiarity weighting (weigh) in target selection', () => {
  it('biases listen targets toward seen words without excluding unseen ones', () => {
    // Weigh one specific animal very heavily: it should appear as a target in
    // nearly every round, while other words still show up too.
    const heavy = animals.items[0].id;
    const weigh = (i: { id: string }) => (i.id === heavy ? 1000 : 1);
    let heavyRounds = 0;
    const others = new Set<string>();
    for (let r = 0; r < RUNS; r++) {
      const round = buildListenRound(animals.items, 3, 3, false, weigh);
      if (round.some((q) => q.target.id === heavy)) heavyRounds++;
      for (const q of round) if (q.target.id !== heavy) others.add(q.target.id);
    }
    expect(heavyRounds).toBeGreaterThan(RUNS * 0.9); // ~always drawn
    expect(others.size).toBeGreaterThan(0); // nothing is ever excluded
  });
});
