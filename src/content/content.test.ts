import { describe, it, expect } from 'vitest';
import { themes, animals, numbers, food, family, places, adjectives, verbs } from '../content';
import { nounConstructions } from '../content/constructions';
import { formFor, verbForm, caseFormOf, PERSONS } from '../content/types';

// Referential-integrity checks over the hand-authored content. Bad data (a
// duplicate id, a construction no item can fill, a number with no value) fails
// CI here rather than surfacing as a broken round on a child's tablet.
const allPools = [animals, numbers, food, family, places, adjectives, verbs];
const nounTopics = [animals, food, family, places];

describe('content integrity', () => {
  it('registers exactly the playable topics', () => {
    expect(themes.map((t) => t.id)).toEqual(['animals', 'numbers', 'food', 'family', 'places']);
  });

  it('gives every theme an id, names and an emoji', () => {
    for (const theme of themes) {
      expect(theme.id).toBeTruthy();
      expect(theme.fi).toBeTruthy();
      expect(theme.en).toBeTruthy();
      expect(theme.emoji).toBeTruthy();
    }
  });

  it('every pool has unique item ids and the required fields', () => {
    for (const pool of allPools) {
      expect(pool.items.length).toBeGreaterThan(0);
      const ids = pool.items.map((i) => i.id);
      expect(new Set(ids).size, `${pool.id} has duplicate ids`).toBe(ids.length);
      for (const item of pool.items) {
        expect(item.id).toBeTruthy();
        expect(item.fi, `${item.id} missing fi`).toBeTruthy();
        expect(item.en, `${item.id} missing en`).toBeTruthy();
        expect([1, 2, 3, 4, 5, 6, 7, 8]).toContain(item.tier);
        expect(item.inflections).toBeTypeOf('object');
      }
    }
  });

  it('uses globally unique ids across every pool', () => {
    const ids = allPools.flatMap((p) => p.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('lets every noun construction be filled by at least one item in each topic', () => {
    for (const theme of nounTopics) {
      for (const con of theme.constructions) {
        const usable = theme.items.some((item) => formFor(item, con));
        expect(usable, `${theme.id} / ${con.id} has no usable item`).toBe(true);
      }
    }
  });

  it('resolves every shared noun construction for every animal', () => {
    for (const con of nounConstructions) {
      for (const item of animals.items) {
        expect(formFor(item, con), `${item.id} lacks ${con.case}`).toBeTruthy();
      }
    }
  });

  it('gives number words the values 1..10', () => {
    const values = numbers.items.map((n) => n.value);
    values.forEach((v) => expect(typeof v).toBe('number'));
    expect([...(values as number[])].sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it('conjugates every verb for enough persons to build a round', () => {
    for (const verb of verbs.items) {
      const persons = PERSONS.filter((p) => verbForm(verb, 'present', 'positive', p.id));
      expect(persons.length, `${verb.id} has too few persons`).toBeGreaterThanOrEqual(3);
    }
  });

  it('sources all four tense×polarity sets for every verb (incl. past negative)', () => {
    // The Conjugate node climbs one rung per level through these four; the L4
    // past-negative rung is only real because the form is sourced for every verb.
    const combos = [
      ['present', 'positive'],
      ['present', 'negative'],
      ['past', 'positive'],
      ['past', 'negative'],
    ] as const;
    for (const verb of verbs.items) {
      for (const [tense, polarity] of combos) {
        const persons = PERSONS.filter((p) => verbForm(verb, tense, polarity, p.id));
        expect(
          persons.length,
          `${verb.id} lacks ${tense} ${polarity} forms`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('gives every adjective a nominative singular form for agreement', () => {
    for (const adj of adjectives.items) {
      expect(caseFormOf(adj, 'nominative', 'singular'), adj.id).toBeTruthy();
    }
  });
});
