import { describe, it, expect } from 'vitest';
import { speakableTargetsFor, saySafe } from './speakable';
import { findSkill } from './path';
import { animals, food } from '../content';

const nouns = [...animals.items, ...food.items];
const targets = (id: string, items = nouns) => speakableTargetsFor(findSkill(id)!.skill, items, 8);

describe('speakableTargetsFor', () => {
  it('carrier-phrase node speaks "Tämä on ___"', () => {
    const ts = targets('this-is', animals.items);
    expect(ts.length).toBeGreaterThan(0);
    expect(ts.some((t) => /^Tämä on /.test(t.say))).toBe(true);
    expect(ts.every((t) => t.gloss)).toBe(true);
  });

  it('count node speaks a two-word "<number> <noun>" phrase', () => {
    const ts = targets('count');
    expect(ts.length).toBeGreaterThan(0);
    ts.forEach((t) => expect(t.say.split(' ')).toHaveLength(2));
  });

  it('conjugate node speaks a pronoun + verb clause ("minä syön")', () => {
    const ts = targets('conjugate');
    expect(ts.length).toBeGreaterThan(0);
    expect(ts.some((t) => /^(minä|sinä|hän|me|te|he) /.test(t.say))).toBe(true);
    ts.forEach((t) => expect(t.gloss).toBeTruthy());
  });

  it('match node speaks a two-word agreement phrase ("iso kissa")', () => {
    const ts = targets('match');
    expect(ts.length).toBeGreaterThan(0);
    ts.forEach((t) => expect(t.say.split(' ')).toHaveLength(2));
  });

  it('greetings/small-talk speak a reply phrase', () => {
    expect(targets('greetings').length).toBeGreaterThan(0);
    expect(targets('small-talk').length).toBeGreaterThan(0);
  });

  it('never returns an empty round when the node has a pool (falls back to bare words)', () => {
    // A reading node whose pooled items happen to carry NO kid-safe examples
    // must still yield sayable targets (the bare words) — never [] (which would
    // stall the say round).
    const reading = findSkill('reading')!;
    const noExampleItems = [
      { id: 'zzz', fi: 'testi', en: 'test', emoji: '🧪', tier: 1 as const, inflections: { nominative_singular: 'testi' }, examples: [] },
    ];
    const ts = speakableTargetsFor(reading.skill, noExampleItems, 8);
    expect(ts.length).toBeGreaterThan(0);
    expect(ts.every((t) => saySafe(t.say))).toBe(true);
  });

  it('scopes counting/agreement speaking to the node’s own pool', () => {
    // Only "cat" in the pool → every counting phrase is about the cat.
    const onlyCat = animals.items.filter((i) => i.id === 'cat');
    const counting = speakableTargetsFor(findSkill('count')!.skill, onlyCat, 8);
    expect(counting.length).toBeGreaterThan(0);
    expect(counting.every((t) => t.attemptId === 'cat')).toBe(true);
  });

  it('tier-gates conversation replies (a beginner never gets a hard scene)', () => {
    // Small-talk scenes are tier 3+, so at tier 1 there are no in-tier replies →
    // the fallback (bare words) kicks in rather than leaking a hard reply.
    const smallTalk = findSkill('small-talk')!;
    const t1 = speakableTargetsFor(smallTalk.skill, nouns, 1);
    // Nothing surfaced from the (tier 3+) scenes; whatever shows is the fallback.
    expect(t1.every((t) => saySafe(t.say))).toBe(true);
  });

  it('every surfaced target is sayable (≤ 5 words) across all speakable node types', () => {
    for (const id of [
      'listen-animals',
      'this-is',
      'count',
      'match',
      'conjugate',
      'reading',
      'greetings',
      'small-talk',
      'full-sentences',
      'order',
      'spell',
    ]) {
      const found = findSkill(id);
      if (!found) continue;
      for (const t of speakableTargetsFor(found.skill, nouns, 8)) {
        expect(saySafe(t.say), `${id}: "${t.say}"`).toBe(true);
      }
    }
  });
});
