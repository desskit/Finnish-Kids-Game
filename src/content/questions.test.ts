import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { verbs } from './index';
import { YOU_QUESTION, questionFor } from './questions';
import { verbForm } from './types';
import { nounConstructions } from './constructions';
import { sentenceFor, englishSentenceFor, formFor, suitsSlot } from './types';

describe('authored "do you…?" question forms', () => {
  it('has one for every verb', () => {
    for (const v of verbs.items) expect(YOU_QUESTION[v.id], v.id).toBeTruthy();
  });

  it('is exactly the sourced "you" form + -ko / -kö by vowel harmony', () => {
    for (const v of verbs.items) {
      const you = verbForm(v, 'present', 'positive', '2sg')!;
      const ending = /[aou]/.test(you) ? 'ko' : 'kö';
      expect(YOU_QUESTION[v.id], v.id).toBe(you + ending);
    }
    expect(questionFor(verbs.items.find((v) => v.id === 'eat')!)).toBe('Syötkö?');
  });
});

describe('verb + verb carriers (Haluan leikkiä)', () => {
  const con = (id: string) => nounConstructions.find((c) => c.id === id)!;
  const verb = (id: string) => verbs.items.find((v) => v.id === id)!;

  it('fill the slot with the sourced basic form (the infinitive)', () => {
    expect(sentenceFor(verb('play'), con('i-want-to'))).toBe('Haluan leikkiä.');
    expect(sentenceFor(verb('swim'), con('i-can'))).toBe('Osaan uida.');
    expect(sentenceFor(verb('sleep'), con('i-dont-want-to'))).toBe('En halua nukkua.');
    expect(sentenceFor(verb('play'), con('may-i'))).toBe('Saanko leikkiä?');
    expect(englishSentenceFor(verb('play'), con('i-want-to'))).toBe('I want to play.');
  });

  it('use first verbs that match the sourced tables', () => {
    const raw = JSON.parse(
      readFileSync('data/finnish-inflection-drill/verbs.json', 'utf8'),
    ) as { words: { word: string; inflections: Record<string, string> }[] };
    const f = (w: string, k: string) => raw.words.find((x) => x.word === w)!.inflections[k];
    expect(con('i-want-to').before).toBe(cap(f('haluta', 'present_active_positive_1sg')));
    expect(con('i-dont-want-to').before).toBe(cap(f('haluta', 'present_active_negative_1sg')));
    expect(con('i-can').before).toBe(cap(f('osata', 'present_active_positive_1sg')));
    expect(con('may-i').before).toBe(cap(f('saada', 'present_active_positive_1sg')) + 'ko');
  });

  it('never put a verb in a noun carrier, or a noun in a verb carrier', () => {
    const noun = nounConstructions.find((c) => c.id === 'i-have')!;
    expect(suitsSlot(verb('play'), noun)).toBe(false);
    const ball = { ...verb('play'), id: 'ball', topic: 'freetime' };
    expect(formFor(ball, con('i-want-to'))).toBeUndefined();
  });
});

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
