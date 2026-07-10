import { describe, it, expect } from 'vitest';
import { kidSafeExamples, itemsWithExamples } from './examples';
import type { LexicalItem, Example } from './types';
import { animals } from './index';

function item(fi: string, examples: Example[]): LexicalItem {
  return { id: fi, fi, en: fi, emoji: '🐾', tier: 1, inflections: { nominative_singular: fi }, examples };
}

describe('kidSafeExamples', () => {
  it('keeps a short, clean sentence that features the word', () => {
    const it0 = item('kissa', [{ fi: 'Pidän kissoista.', en: 'I like cats.' }]);
    expect(kidSafeExamples(it0)).toEqual([{ fi: 'Pidän kissoista.', en: 'I like cats.' }]);
  });

  it('rejects garbled/archaic Finnish (stray non-modern letters, off-topic)', () => {
    const it0 = item('koira', [{ fi: 'Cauattacat teitenne Coirilda', en: 'Beware of dogs' }]);
    expect(kidSafeExamples(it0)).toEqual([]); // no ending punctuation + does not contain "koir"
  });

  it("rejects sentences that don't feature the word", () => {
    const it0 = item('kala', [{ fi: 'Tämä on hyvä.', en: 'This is good.' }]);
    expect(kidSafeExamples(it0)).toEqual([]);
  });

  it('rejects long sentences', () => {
    const it0 = item('omena', [
      { fi: 'Minä söin yhden ison punaisen makean omenan tänään.', en: 'I ate one big red sweet apple today.' },
    ]);
    expect(kidSafeExamples(it0)).toEqual([]);
  });

  it('rejects grown-up / scary / unkind themes (Finnish or English side)', () => {
    expect(kidSafeExamples(item('karhu', [{ fi: 'Karhu kuoli.', en: 'The bear died.' }]))).toEqual([]);
    expect(kidSafeExamples(item('kettu', [{ fi: 'He metsästivät kettua.', en: 'They hunted the fox.' }]))).toEqual([]);
    expect(kidSafeExamples(item('pupu', [{ fi: 'Se oli pupu.', en: 'It was an evil bunny.' }]))).toEqual([]);
  });

  it('dedupes identical Finnish sentences', () => {
    const it0 = item('karhu', [
      { fi: 'Pidän karhuista.', en: 'I like bears.' },
      { fi: 'Pidän karhuista.', en: 'I love bears.' },
    ]);
    expect(kidSafeExamples(it0)).toHaveLength(1);
  });

  it('finds a healthy set of safe examples across the real animals data', () => {
    const withEx = itemsWithExamples(animals.items);
    expect(withEx.length).toBeGreaterThan(4);
    // Every surfaced sentence must itself pass the gate.
    for (const i of withEx) {
      for (const e of kidSafeExamples(i)) {
        expect(e.fi).toMatch(/[.?!]$/);
        expect(e.fi.split(/\s+/).length).toBeLessThanOrEqual(6);
      }
    }
  });
});
