import { describe, expect, it } from 'vitest';
import { nounConstructions } from './constructions';
import { caseFormOf, possessiveForm, verbForm } from './types';
import { itemById } from './lookup';
import {
  formMeaning,
  whyForAgreementPick,
  whyForCountPick,
  whyForErrorPick,
  whyForPhrasePick,
  whyForPossessorPick,
  whyForVerbPick,
} from './why';

// A wrong pick must say what THAT pick means — not only the general rule.
const con = (id: string) => nounConstructions.find((c) => c.id === id)!;
const it_ = (id: string) => itemById(id)!;

describe('"Why?" for a wrong pick', () => {
  it('names the form that was picked', () => {
    const box = it_('box');
    expect(formMeaning(box, 'laatikkoon')).toMatch(/INTO/);
    expect(formMeaning(box, 'laatikolla')).toMatch(/ON/);
    expect(formMeaning(box, 'laatikot')).toBe('the plural with **-t** ("the boxes")');
    expect(formMeaning(box, 'laatikoissa')).toMatch(/IN form.*MANY things/);
  });

  it('carrier phrase: a wrong FORM says what it is, then the rule', () => {
    const w = whyForPhrasePick(con('in-it'), it_('box'), { form: 'laatikkoon' });
    expect(w.text).toMatch(/^\*laatikkoon\* is the INTO form\. IN something/);
  });

  it('carrier phrase: a wrong WORD says it is the wrong word — not a grammar rule', () => {
    const w = whyForPhrasePick(con('go-by'), it_('train'), { item: it_('ship') });
    expect(w.text).toBe('*laivalla* is "ship" — the right form, but the wrong word. You need "train": *junalla*.');
  });

  it('conjugation: says what the picked person means, and who the prompt is', () => {
    const v = it_('sleep');
    const w = whyForVerbPick(v, 'present', 'positive', '1sg', { person: '2sg', form: verbForm(v, 'present', 'positive', '2sg')! });
    expect(w.text).toMatch(/^\*sinä nukut\* means "you sleep"\. The prompt is \*minä\* — "I sleep"\./);
    expect(w.text).toMatch(/kk → k/);
    const eat = it_('eat');
    const drink = it_('drink');
    expect(
      whyForVerbPick(eat, 'present', 'positive', '1sg', { person: '1sg', form: 'juon', verb: drink }).text,
    ).toBe('*juon* is a different verb: "I drink". You need *syödä* — "I eat".');
  });

  it('agreement: the picked case vs the describing word\'s case', () => {
    const house = it_('house');
    const w = whyForAgreementPick(it_('big'), house, 'inessive', 'singular', {
      caseId: 'adessive',
      num: 'singular',
      form: caseFormOf(house, 'adessive', 'singular')!,
    });
    expect(w.text).toBe('*talolla* is the ON / AT / WITH form (**-lla / -llä**). But *isossa* is the IN form (**-ssa / -ssä**) — the thing must copy it.');
  });

  it('possessive: whose the picked ending is', () => {
    const book = it_('book');
    expect(whyForPossessorPick(book, '1sg', 'nominative', possessiveForm(book, '2sg', 'nominative')!).text).toBe(
      '*kirjasi* means YOUR book. You need MY: "My" is the ending **-ni**.',
    );
  });

  it('counting: a wrong number is a miscount, a wrong thing is a wrong word', () => {
    expect(whyForCountPick(3, 'kolme', it_('cat'), it_('four')).text).toMatch(/neljä\* is 4\. Count/);
    expect(whyForCountPick(3, 'kolme', it_('cat'), it_('dog')).text).toMatch(/^That's "dog"/);
  });

  it('find the mistake: explains each kind of slip', () => {
    const c = con('in-it');
    const box = it_('box');
    expect(whyForErrorPick(c, box, 'laatikolla.', false, { ok: true }).text).toMatch(/^Look again at \*laatikolla\* — it's the ON/);
    expect(whyForErrorPick(c, box, 'laatikolla.', false, { word: 'Kissa', isSlot: false }).text).toMatch(/^\*Kissa\* is fine/);
    expect(whyForErrorPick(c, box, 'laatikossa.', true, { word: 'Kissa', isSlot: false }).text).toMatch(/^This one was already right!/);
  });
});
