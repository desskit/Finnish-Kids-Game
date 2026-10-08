import { describe, it, expect } from 'vitest';
import { buildCarrierHearRound, buildCountHearRound, buildVerbHearRound, spokenClause } from './hear';
import { nounConstructions } from '../content/constructions';
import { itemById } from '../content/lookup';
import { themes, verbs, numbers } from '../content';
import { englishSentenceFor, sentenceFor } from '../content/types';
import { segmentsText } from '../content/endings';

const cons = (...ids: string[]) => nounConstructions.filter((c) => ids.includes(c.id));
const all = themes.flatMap((t) => t.items);
const RUNS = 30;

describe('hear it, pick the meaning — carriers', () => {
  it('contrasts the step’s patterns on the SAME word, one right meaning', () => {
    const set = cons('into-it', 'in-it', 'out-of-it', 'onto-it', 'on-it', 'off-it');
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildCarrierHearRound(all, set, 6, 4)) {
        expect(q.options.filter((o) => o.id === q.answerId)).toHaveLength(1);
        expect(new Set(q.options.map((o) => o.en)).size).toBe(q.options.length);
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        // What is said is a real carrier sentence; the marked text is the same sentence.
        expect(segmentsText(q.segments)).toBe(q.fi);
        // Every wrong meaning explains itself (with no doubled stop after a quote).
        for (const o of q.options) {
          if (o.id === q.answerId) continue;
          expect(q.whyFor[o.id]?.text).toMatch(/^You heard \*/);
          expect(q.whyFor[o.id]?.text).not.toMatch(/[.!?]\*\./);
        }
      }
    }
  });

  it('answers with the sentence’s own English', () => {
    const box = itemById('box')!;
    const into = cons('into-it')[0];
    const q = buildCarrierHearRound([box], cons('into-it', 'in-it', 'out-of-it'), 1, 3)[0];
    const right = q.options.find((o) => o.id === q.answerId)!;
    const con = nounConstructions.find((c) => c.id === q.answerId)!;
    expect(right.en).toBe(englishSentenceFor(box, con));
    expect(q.fi).toBe(sentenceFor(box, con));
    expect(englishSentenceFor(box, into)).toBe('The cat goes into the box.');
  });

  it('fills with other words when a step has a single pattern', () => {
    const qs = buildCarrierHearRound(all, cons('owner-thing'), 6, 4);
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) expect(q.options.length).toBeGreaterThanOrEqual(3);
  });
});

describe('hear it — verbs', () => {
  it('drops I / you / we (the ending says it) but keeps hän and he', () => {
    const eat = verbs.items.find((v) => v.id === 'eat')!;
    expect(spokenClause(eat, 'present', 'positive', '1sg')).toBe('Syön.');
    expect(spokenClause(eat, 'present', 'positive', '3sg')).toBe('Hän syö.');
    expect(spokenClause(eat, 'present', 'negative', '1sg')).toBe('En syö.');
    expect(spokenClause(eat, 'past', 'positive', '3pl')).toBe('He söivät.');
  });

  it('contrasts persons, yes / no and tenses with distinct meanings', () => {
    const combos = [
      { tense: 'present' as const, polarity: 'positive' as const },
      { tense: 'past' as const, polarity: 'positive' as const },
    ];
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildVerbHearRound(verbs.items.filter((v) => v.emoji), combos, 6, 4)) {
        expect(q.options.filter((o) => o.id === q.answerId)).toHaveLength(1);
        expect(new Set(q.options.map((o) => o.en)).size).toBe(q.options.length);
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        for (const o of q.options) if (o.id !== q.answerId) expect(q.whyFor[o.id]?.text).not.toMatch(/[.!?]\*\./);
      }
    }
  });
});

describe('hear it — counting', () => {
  it('says a number + thing; the options are the neighbouring counts', () => {
    const things = all.filter((i) => i.topic === 'school');
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildCountHearRound(numbers.items, things, 6, 4, 12)) {
        const n = numbers.items.find((x) => x.id === q.answerId)!;
        expect(q.fi.toLowerCase().startsWith(n.fi)).toBe(true);
        expect(q.options.filter((o) => o.id === q.answerId)).toHaveLength(1);
        expect(n.value).toBeLessThanOrEqual(12);
      }
    }
  });

  it('never counts number words or one-of-a-kind people', () => {
    const qs = buildCountHearRound(numbers.items, [...numbers.items, itemById('mother')!, itemById('grandfather')!], 6, 4, 12);
    expect(qs).toEqual([]);
  });
});
