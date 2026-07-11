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
