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
  reviewItems,
} from '../content';
import { nounConstructions } from '../content/constructions';
import {
  formFor,
  verbForm,
  caseFormOf,
  englishSentenceFor,
  imperativeForm,
  possessiveForm,
  suitsSlot,
  PERSONS,
  POSSESSORS,
} from '../content/types';

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

  it('gives number words the values 1..20 plus the round tens to 100', () => {
    const values = numbers.items.map((n) => n.value);
    values.forEach((v) => expect(typeof v).toBe('number'));
    expect([...(values as number[])].sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      30, 40, 50, 60, 70, 80, 90, 100,
    ]);
  });

  // The sourced-English guarantee: English glosses are looked up (from AGID via
  // the build), never rule-generated — the English mirror of the Finnish rule.
  // A future word added without its forms fails HERE, before it ships.
  it('sources English plurals for every noun', () => {
    for (const topic of nounTopics) {
      for (const it of topic.items) {
        expect(it.english?.plural, `${topic.id}:${it.en}`).toBeTruthy();
      }
    }
  });

  it('sources all four English verb forms for every verb', () => {
    for (const v of verbs.items) {
      const e = v.english;
      expect(e?.thirdSg, v.en).toBeTruthy();
      expect(e?.past, v.en).toBeTruthy();
      expect(e?.pastParticiple, v.en).toBeTruthy();
      expect(e?.gerund, v.en).toBeTruthy();
    }
  });

  it('sources English comparative + superlative for every adjective', () => {
    for (const a of adjectives.items) {
      expect(a.english?.comparative, a.en).toBeTruthy();
      expect(a.english?.superlative, a.en).toBeTruthy();
    }
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

  it('deepens the emoji-capped themes with text-only (emoji-less) words', () => {
    // family/places/clothes are capped for the PICTURE games (too few distinct
    // glyphs) but can still grow for build/order/spell — see build-kids-data.mjs.
    for (const theme of [family, places, clothes]) {
      const textOnly = theme.items.filter((i) => !i.emoji);
      expect(textOnly.length, `${theme.id} has no emoji-less depth words`).toBeGreaterThan(0);
      // Still fully sourced, real Finnish nouns — same guarantees as every word.
      for (const i of textOnly) {
        expect(i.inflections.nominative_singular, i.id).toBeTruthy();
        expect(i.english?.plural, i.id).toBeTruthy();
      }
    }
  });

  it('keeps emoji-less words out of the Review picture-card pool', () => {
    // Review's box 1-4 formats are all picture-based; an emoji-less item would
    // render a blank card, so it must never be a reviewable id.
    for (const item of reviewItems) {
      expect(item.emoji, `${item.id} has no emoji but is in reviewItems`).toBeTruthy();
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

  it('splits buying into genitive (whole thing) vs partitive (mass) carriers', () => {
    // The Shopping node's whole lesson: "Ostan omenan" (genitive total object)
    // vs "Ostan maitoa" (partitive mass) — each word fits exactly one frame.
    const iBuy = nounConstructions.find((c) => c.id === 'i-buy')!;
    const iBuySome = nounConstructions.find((c) => c.id === 'i-buy-some')!;
    const milk = food.items.find((i) => i.id === 'milk')!;
    const apple = food.items.find((i) => i.id === 'apple')!;
    expect(suitsSlot(milk, iBuy)).toBe(false);
    expect(suitsSlot(milk, iBuySome)).toBe(true);
    expect(suitsSlot(apple, iBuy)).toBe(true);
    expect(suitsSlot(apple, iBuySome)).toBe(false);
    // Every allow-listed mass noun is a real food item with the partitive form.
    for (const id of iBuySome.onlyIds!) {
      const item = food.items.find((i) => i.id === id);
      expect(item, `${id} not in food`).toBeTruthy();
      expect(formFor(item!, iBuySome), id).toBeTruthy();
    }
  });

  it('adds the -ko question carrier (is-this: nominative, tier 2, "?" punctuation)', () => {
    const isThis = nounConstructions.find((c) => c.id === 'is-this')!;
    expect(isThis.case).toBe('nominative');
    expect(isThis.tier).toBe(2);
    expect(isThis.punct).toBe('?');
    // The English side gets the article treatment: "Is this an apple?".
    const apple = food.items.find((i) => i.id === 'apple')!;
    expect(englishSentenceFor(apple, isThis)).toBe('Is this an apple?');
  });

  it('sources the imperative for every kid-actable command verb', () => {
    // The TPR game's guarantee: a curated command verb always has its sourced
    // imperative 2sg (the build keeps those keys — see VERB_INFLECTION_KEYS).
    for (const v of verbs.items) {
      expect(imperativeForm(v, '2sg'), v.id).toBeTruthy();
    }
  });

  it('sources perfect and conditional forms for every verb (the L7-8 sets)', () => {
    // The expert conjugation rungs' guarantee: every curated verb carries the
    // full sourced perfect + conditional paradigms across all six persons,
    // both polarities — so the builder never comes up short at the top levels.
    for (const v of verbs.items) {
      for (const p of PERSONS) {
        for (const tense of ['perfect', 'conditional'] as const) {
          expect(verbForm(v, tense, 'positive', p.id), `${v.id} ${tense}+ ${p.id}`).toBeTruthy();
          expect(verbForm(v, tense, 'negative', p.id), `${v.id} ${tense}- ${p.id}`).toBeTruthy();
        }
      }
    }
  });

  it('sources possessive-suffix forms for every noun (the Kenen? game)', () => {
    // The possessive game's guarantee: every noun carries the nominative
    // possessive across all three possessors ("kissani/kissasi/kissansa"), and
    // every PLACE additionally carries the inessive/adessive possessive
    // ("talossani", "pöydälläni") for the higher-level "in my house" reach.
    const nouns = [animals, food, family, places, body, nature, clothes];
    for (const theme of nouns) {
      for (const item of theme.items) {
        for (const p of POSSESSORS) {
          expect(possessiveForm(item, p.id, 'nominative'), `${item.id} ${p.id} nom`).toBeTruthy();
          if (item.topic === 'places') {
            expect(possessiveForm(item, p.id, 'inessive'), `${item.id} ${p.id} iness`).toBeTruthy();
            expect(possessiveForm(item, p.id, 'adessive'), `${item.id} ${p.id} adess`).toBeTruthy();
          }
        }
      }
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
    expect(englishSentenceFor(find('water'), thisIs)).toBe('This is water.');
    expect(englishSentenceFor(find('milk'), thisIs)).toBe('This is milk.');
    expect(englishSentenceFor(find('bread'), thisIs)).toBe('This is bread.');
    expect(englishSentenceFor(find('cheese'), thisIs)).toBe('This is cheese.');
    expect(englishSentenceFor(find('juice'), thisIs)).toBe('This is juice.');
    expect(englishSentenceFor(find('hair'), thisIs)).toBe('This is hair.');
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

  it('fills plural predicatives with the SOURCED plural (fish/feet, not fishs/foots)', () => {
    const theseAre = nounConstructions.find((c) => c.id === 'these-are')!;
    const whereAre = nounConstructions.find((c) => c.id === 'where-are')!;
    expect(englishSentenceFor(find('fish'), theseAre)).toBe('These are fish.');
    expect(englishSentenceFor(find('foot'), theseAre)).toBe('These are feet.');
    expect(englishSentenceFor(find('cat'), whereAre)).toBe('Where are the cats?');
  });
});
