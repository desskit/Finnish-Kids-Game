import { describe, it, expect } from 'vitest';
import {
  themes,
  animals,
  numbers,
  food,
  family,
  places,
  body,
  nature,
  clothes,
  adjectives,
  verbs,
} from '../content';
import { nounConstructions } from '../content/constructions';
import { formFor, verbForm, caseFormOf, englishSentenceFor, PERSONS } from '../content/types';

// Referential-integrity checks over the hand-authored content. Bad data (a
// duplicate id, a construction no item can fill, a number with no value) fails
// CI here rather than surfacing as a broken round on a child's tablet.
const allPools = [animals, numbers, food, family, places, body, nature, clothes, adjectives, verbs];
const nounTopics = [animals, food, family, places, body, nature, clothes];

describe('content integrity', () => {
  it('registers exactly the playable topics', () => {
    expect(themes.map((t) => t.id)).toEqual([
      'animals',
      'numbers',
      'food',
      'family',
      'places',
      'body',
      'nature',
      'clothes',
    ]);
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

  it('carries the expanded verb pool: 60+ verbs, most with an action emoji', () => {
    // The verbs expansion: enough vocabulary that the conjugation drill's
    // tricky foreign-verb distractors and the listen-verbs warm-up both have
    // real depth. Picturable verbs (with emoji) power the picture-card games.
    expect(verbs.items.length).toBeGreaterThanOrEqual(50);
    expect(verbs.items.filter((v) => v.emoji).length).toBeGreaterThanOrEqual(40);
  });

  it('tags every word with its theme (the semantic-gating hook)', () => {
    for (const pool of allPools) {
      for (const item of pool.items) {
        expect(item.topic, `${item.id} missing topic`).toBe(pool.id);
      }
    }
  });

  it('gives every place a valid locative shape tag (surface and/or container)', () => {
    // The locative carriers gate on these; a place with neither could never
    // appear in any "where" question. Only 'surface'/'container' are valid.
    for (const place of places.items) {
      const tags = place.tags ?? [];
      expect(tags.length, `${place.id} has no shape tag`).toBeGreaterThan(0);
      for (const t of tags) expect(['surface', 'container']).toContain(t);
    }
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

describe('englishSentenceFor (article cleanup on "a ___" templates)', () => {
  const thisIs = nounConstructions.find((c) => c.id === 'this-is')!;
  const find = (id: string) =>
    [...nature.items, ...body.items, ...food.items, ...animals.items].find((i) => i.id === id)!;

  it('uses "a"/"an" by default, picking "an" for a vowel-initial word', () => {
    expect(englishSentenceFor(find('dog'), thisIs)).toBe('This is a dog.');
    expect(englishSentenceFor(find('eye'), thisIs)).toBe('This is an eye.');
    expect(englishSentenceFor(find('ear'), thisIs)).toBe('This is an ear.');
    expect(englishSentenceFor(find('apple'), thisIs)).toBe('This is an apple.');
  });

  it('drops the article entirely for mass nouns', () => {
    expect(englishSentenceFor(find('rain'), thisIs)).toBe('This is rain.');
    expect(englishSentenceFor(find('snow'), thisIs)).toBe('This is snow.');
  });

  it('uses "the" for unique nature referents', () => {
    expect(englishSentenceFor(find('sun'), thisIs)).toBe('This is the sun.');
    expect(englishSentenceFor(find('moon'), thisIs)).toBe('This is the moon.');
    expect(englishSentenceFor(find('sky'), thisIs)).toBe('This is the sky.');
    expect(englishSentenceFor(find('sea'), thisIs)).toBe('This is the sea.');
  });

  it('leaves non-"a ___" templates (already using "the", or plural) untouched', () => {
    const whereIs = nounConstructions.find((c) => c.id === 'where-is')!;
    expect(englishSentenceFor(find('rain'), whereIs)).toBe('Where is the rain?');
  });
});
