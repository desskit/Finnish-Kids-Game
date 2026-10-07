import { describe, it, expect } from 'vitest';
import { nounConstructions } from './constructions';
import { formFor, suitsSlot } from './types';
import { segmentsText } from './endings';
import { whyForAgreement, whyForConstruction, whyForCount, whyForPossessor, whyForVerb } from './why';
import { itemById } from './lookup';
import { animals, places, school } from './index';

const pool = [...animals.items, ...places.items, ...school.items];

describe('"Why?" tips', () => {
  it('explain every construction, with the CORRECT looked-up form as the example', () => {
    for (const con of nounConstructions) {
      const item = pool.find((i) => formFor(i, con) && suitsSlot(i, con));
      if (!item) continue;
      const why = whyForConstruction(con, item);
      expect(why.text, con.id).not.toMatch(/Look at the ending/); // a real rule, not the fallback
      expect(segmentsText(why.example!), con.id).toBe(formFor(item, con));
    }
  });

  it('explain counting: one stays basic, two+ takes -a', () => {
    const book = itemById('book')!;
    expect(whyForCount(1, 'yksi', book).text).toMatch(/basic/);
    const two = whyForCount(2, 'kaksi', book);
    expect(two.text).toMatch(/-a/);
    expect(segmentsText(two.example!)).toBe('kaksi kirjaa');
  });

  it('explain verbs by person, "not", and tense', () => {
    const eat = itemById('eat')!;
    expect(segmentsText(whyForVerb(eat, 'present', 'positive', '1pl').example!)).toBe('me syömme');
    expect(whyForVerb(eat, 'present', 'negative', '1sg').text).toMatch(/not/);
    expect(whyForVerb(eat, 'past', 'positive', '1sg').text).toMatch(/-i-/);
  });

  it('explain possessive suffixes and agreement', () => {
    const book = itemById('book')!;
    expect(whyForPossessor(book, '2sg').text).toMatch(/-si/);
    expect(segmentsText(whyForPossessor(book, '2sg').example!)).toBe('kirjasi');
    const why = whyForAgreement(itemById('big')!, itemById('house')!, 'inessive');
    expect(segmentsText(why.example!)).toBe('isossa talossa');
  });
});
