import { describe, it, expect } from 'vitest';
import { buildSentenceRound, resolveSentenceWords, type SentencePools } from './round';
import type { LexicalItem, SentenceConstruction } from '../content/types';
import { sentenceConstructions } from '../content/sentences';

// The multi-slot sentence system is wired end-to-end but ships CONTENTLESS.
// These fixtures (fake words, isolated from the real data) prove the plumbing:
// every slot form is looked up, agreement is resolved by copying tags, and the
// result is a playable word-order round — so authoring a template later "just works".

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

describe('multi-slot sentences (plumbed, contentless)', () => {
  it('ships an empty registry, so no rounds are produced yet', () => {
    expect(sentenceConstructions).toHaveLength(0);
    expect(buildSentenceRound(sentenceConstructions, pools, 6)).toEqual([]);
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
