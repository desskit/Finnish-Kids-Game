import { describe, it, expect } from 'vitest';
import {
  buildSentenceRound,
  resolveSentence,
  resolveSentenceWords,
  type SentencePools,
} from './round';
import type { LexicalItem, SentenceConstruction } from '../content/types';
import { sentenceConstructions } from '../content/sentences';
import {
  animals,
  food,
  family,
  places,
  body,
  nature,
  clothes,
  adjectives,
  verbs,
} from '../content';

// The multi-slot sentence system. These fixtures (fake words, isolated from the
// real data) prove the plumbing: every slot form is looked up, agreement is
// resolved by copying tags, and the result is a playable word-order round. A
// second block exercises the REAL authored templates against the sourced data.

function noun(id: string, forms: Record<string, string>): LexicalItem {
  return { id, fi: forms.nominative_singular ?? id, en: id, emoji: 'x', tier: 1, inflections: forms };
}

const koira = noun('koira', {
  nominative_singular: 'koira',
  genitive_singular: 'koiran',
  allative_singular: 'koiralle',
});
const luu = noun('luu', { nominative_singular: 'luu', genitive_singular: 'luun' });
const iso = noun('iso', { nominative_singular: 'iso', genitive_singular: 'ison' });
const antaa: LexicalItem = {
  id: 'antaa',
  fi: 'antaa',
  en: 'give',
  emoji: 'x',
  tier: 1,
  inflections: { present_active_positive_1sg: 'annan' },
};

const pools: SentencePools = { nouns: [koira, luu], verbs: [antaa], adjectives: [iso], numbers: [] };

const giveTemplate: SentenceConstruction = {
  id: 'give',
  en: 'I give the dog a bone.',
  tier: 4,
  punct: '.',
  tokens: [{ slot: 'subject' }, { slot: 'verb' }, { slot: 'recipient' }, { slot: 'object' }],
  slots: [
    { id: 'subject', role: 'pronoun', fixedId: '1sg' },
    { id: 'verb', role: 'verb', verbSlotForm: 'conjugated', tense: 'present', polarity: 'positive', agreesWith: 'subject', fixedId: 'antaa' },
    { id: 'recipient', role: 'noun', case: 'allative', number: 'singular', fixedId: 'koira' },
    { id: 'object', role: 'noun', case: 'genitive', number: 'singular', fixedId: 'luu' },
  ],
};

describe('multi-slot sentences (plumbed)', () => {
  it('produces no rounds from an empty template set', () => {
    expect(buildSentenceRound([], pools, 6)).toEqual([]);
  });

  it('resolves a recipient + object sentence from sourced forms', () => {
    expect(resolveSentenceWords(giveTemplate, pools)).toEqual(['minä', 'annan', 'koiralle', 'luun']);
  });

  it('makes an adjective agree with its noun (same case)', () => {
    const template: SentenceConstruction = {
      id: 'see-big',
      en: 'I see the big dog.',
      tier: 4,
      punct: '.',
      tokens: [{ fixed: 'Näen' }, { slot: 'adj' }, { slot: 'obj' }],
      slots: [
        { id: 'obj', role: 'noun', case: 'genitive', number: 'singular', fixedId: 'koira' },
        { id: 'adj', role: 'adjective', agreesWith: 'obj', pool: 'adjectives', fixedId: 'iso' },
      ],
    };
    expect(resolveSentenceWords(template, pools)).toEqual(['Näen', 'ison', 'koiran']);
  });

  it('builds a playable word-order round from a template', () => {
    const round = buildSentenceRound([giveTemplate], pools, 3);
    expect(round.length).toBeGreaterThan(0);
    const q = round[0];
    expect(q.sentence).toBe('minä annan koiralle luun.');
    expect(q.tokens.map((t) => t.text)).toEqual(['minä', 'annan', 'koiralle', 'luun.']);
    expect(q.shuffled).toHaveLength(4);
  });
});

// The real authored content, resolved against the real sourced data. Every swap
// candidate must produce a fully-resolvable, correctly-inflected sentence whose
// English hint tracks the picked noun — that's the whole human-vetted contract.
const realPools: SentencePools = {
  nouns: [
    ...animals.items,
    ...food.items,
    ...family.items,
    ...places.items,
    ...body.items,
    ...nature.items,
    ...clothes.items,
  ],
  verbs: verbs.items,
  adjectives: adjectives.items,
  numbers: [],
};

/** Re-pin a template's swap slot to one specific candidate id. */
function pin(template: SentenceConstruction, id: string): SentenceConstruction {
  const swap = template.slots.find((s) => s.pickFrom && s.pickFrom.length > 0)!;
  return {
    ...template,
    slots: template.slots.map((s) =>
      s.id === swap.id ? { ...s, pickFrom: undefined, fixedId: id } : s,
    ),
  };
}

describe('authored sentence templates (real sourced data)', () => {
  it('ships a non-empty, uniquely-id’d registry covering tiers 5–8', () => {
    expect(sentenceConstructions.length).toBeGreaterThan(0);
    const ids = sentenceConstructions.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of sentenceConstructions) {
      expect([5, 6, 7, 8]).toContain(t.tier);
    }
  });

  it('resolves EVERY swap candidate of EVERY template to a real sentence', () => {
    for (const t of sentenceConstructions) {
      const swap = t.slots.find((s) => s.pickFrom && s.pickFrom.length > 0);
      const candidates = swap?.pickFrom ?? [null];
      for (const id of candidates) {
        const resolved = resolveSentence(id ? pin(t, id) : t, realPools);
        expect(resolved, `${t.id} / ${id} failed to resolve`).not.toBeNull();
        // A real multi-word sentence, no leftover gloss placeholders.
        expect(resolved!.words.length).toBeGreaterThan(1);
        expect(resolved!.gloss).not.toMatch(/[{}]/);
      }
    }
  });

  it('makes the English hint track the swapped noun', () => {
    const seeBig = sentenceConstructions.find((t) => t.id === 'see-big-animal')!;
    expect(resolveSentence(pin(seeBig, 'bear'), realPools)!.gloss).toBe('I see the big bear.');
    expect(resolveSentence(pin(seeBig, 'fox'), realPools)!.gloss).toBe('I see the big fox.');
  });

  it('keeps the negation object in the partitive (en näe kissaa)', () => {
    const dontSee = sentenceConstructions.find((t) => t.id === 'dont-see-animal')!;
    expect(resolveSentence(pin(dontSee, 'cat'), realPools)!.words).toEqual([
      'minä',
      'en',
      'näe',
      'kissaa',
    ]);
  });

  it('tier-gates harder patterns out of a low-tier round', () => {
    // At maxTier 5 only the t5 templates are eligible; the t7 illative pattern
    // ("fox runs into the box") must never appear.
    for (let r = 0; r < 50; r++) {
      const round = buildSentenceRound(sentenceConstructions, realPools, 6, 5);
      for (const q of round) {
        expect(q.sentence).not.toMatch(/juoksee/);
      }
    }
  });
});
