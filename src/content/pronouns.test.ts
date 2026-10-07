import { describe, it, expect } from 'vitest';
import { PRONOUNS, PRONOUN_FRAMES, pronounSentence } from './pronouns';
import { PERSONS } from './types';

describe('authored pronoun forms', () => {
  it('covers every person with every case the unit teaches', () => {
    for (const p of PERSONS) {
      const forms = PRONOUNS[p.id];
      expect(forms.nominative, p.id).toBe(p.fi);
      for (const c of ['partitive', 'accusative', 'allative', 'elative', 'adessive', 'genitive'] as const) {
        expect(forms[c], `${p.id} ${c}`).toMatch(/^[a-zäö]+$/);
      }
    }
  });

  it('keeps the forms a child must tell apart distinct', () => {
    for (const p of PERSONS) {
      const f = PRONOUNS[p.id];
      const set = [f.nominative, f.partitive, f.accusative, f.allative, f.elative, f.adessive];
      expect(new Set(set).size, p.id).toBe(set.length);
    }
  });

  it('fills frames, and never asks for an odd one ("Auta sinua!", "Pidän minusta")', () => {
    expect(pronounSentence(PRONOUN_FRAMES.find((f) => f.id === 'help')!, '1sg')).toBe('Auta minua!');
    expect(pronounSentence(PRONOUN_FRAMES.find((f) => f.id === 'see')!, '3sg')).toBe('Näen hänet.');
    expect(PRONOUN_FRAMES.find((f) => f.id === 'help')!.exclude).toContain('2sg');
    expect(PRONOUN_FRAMES.find((f) => f.id === 'like')!.exclude).toContain('1sg');
  });
});
