import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { feelingVerbs, themes, verbs } from './index';
import { YOU_QUESTION, questionFor } from './questions';
import { verbForm } from './types';
import { nounConstructions } from './constructions';
import { sentenceFor, englishSentenceFor, formFor, suitsSlot, type Construction } from './types';

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

describe('the feeling-verb slot (Minua pelottaa)', () => {
  const con = (id: string) => nounConstructions.find((c) => c.id === id)!;
  const feeling = (id: string) => feelingVerbs.items.find((v) => v.id === id)!;

  it('fills the slot with the sourced "it" form', () => {
    for (const f of feelingVerbs.items) {
      expect(sentenceFor(f, con('it-scares-me')), f.id).toBe(`Minua ${verbForm(f, 'present', 'positive', '3sg')}.`);
    }
    expect(sentenceFor(feeling('scared'), con('it-scares-me'))).toBe('Minua pelottaa.');
    expect(sentenceFor(feeling('nervous'), con('it-scares-me'))).toBe('Minua jännittää.');
    expect(englishSentenceFor(feeling('scared'), con('it-scares-me'))).toBe('I feel scared.');
  });

  it('takes only the feeling verbs, and they go in no other carrier', () => {
    const play = verbs.items.find((v) => v.id === 'play')!;
    expect(formFor(play, con('it-scares-me'))).toBeUndefined();
    for (const c of nounConstructions) {
      if (c.id === 'it-scares-me') continue;
      for (const f of feelingVerbs.items) expect(!!formFor(f, c) && suitsSlot(f, c), `${c.id}/${f.id}`).toBe(false);
    }
  });
});

describe('a slot that starts the sentence', () => {
  it('is capitalized, and only then', () => {
    const cat = themes.flatMap((t) => t.items).find((i) => i.id === 'cat')!;
    const first: Construction = { id: 'test-first', after: 'nukkuu', punct: '.', en: 'The ___ is sleeping.', tier: 1, case: 'nominative', number: 'singular' };
    expect(sentenceFor(cat, first)).toBe('Kissa nukkuu.');
    expect(sentenceFor(cat, { ...first, before: 'Tämä' })).toBe('Tämä kissa nukkuu.');
  });
});

describe("the captain's commands (Kosketa nenää!)", () => {
  const con = (id: string) => nounConstructions.find((c) => c.id === id)!;
  const imperative = (id: string) => verbs.items.find((v) => v.id === id)!.inflections.imperative_active_positive_2sg;

  it('start with the sourced "you" command of koskettaa, nostaa and pestä', () => {
    expect(con('touch-it').before).toBe(cap(imperative('touch')!));
    expect(con('lift-it').before).toBe(cap(imperative('lift')!));
    expect(con('wash-hands').before).toBe(cap(imperative('wash')!));
  });

  it('say what the lesson says', () => {
    const part = (id: string) => themes.flatMap((t) => t.items).find((i) => i.id === id)!;
    expect(sentenceFor(part('nose'), con('touch-it'))).toBe('Kosketa nenää!');
    expect(sentenceFor(part('hand'), con('lift-it'))).toBe('Nosta käsi ylös!');
    expect(englishSentenceFor(part('hand'), con('lift-it'))).toBe('Put your hand up!');
    expect(sentenceFor(part('hand'), con('wash-hands'))).toBe('Pese kädet!');
    expect(englishSentenceFor(part('foot'), con('wash-hands'))).toBe('Wash your feet!');
    // never an eye, a tooth or the tongue to touch
    for (const id of ['eye', 'tooth', 'tongue']) expect(suitsSlot(part(id), con('touch-it')), id).toBe(false);
  });
});
