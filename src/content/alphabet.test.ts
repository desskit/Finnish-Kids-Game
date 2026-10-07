import { describe, it, expect } from 'vitest';
import { ALPHABET, SOUND_GUIDES } from './alphabet';
import { itemByFi } from './lookup';

describe('the Finnish alphabet', () => {
  it('has all 29 letters, in order, once each', () => {
    expect(ALPHABET.map((l) => l.ch).join('')).toBe('abcdefghijklmnopqrstuvwxyzåäö');
  });

  it('marks exactly the borrowed letters, and the eight vowels', () => {
    expect(ALPHABET.filter((l) => l.borrowed).map((l) => l.ch).join('')).toBe('bcfgqwxzå');
    expect(ALPHABET.filter((l) => l.vowel).map((l) => l.ch).join('')).toBe('aeiouyäö');
  });

  it('gives every Finnish letter real example words that contain it', () => {
    for (const l of ALPHABET) {
      if (!l.borrowed) expect(l.examples.length, l.ch).toBeGreaterThan(0);
      for (const w of l.examples) {
        expect(itemByFi(w), `${l.ch}: "${w}" is not in the sourced words`).toBeTruthy();
        expect(w, l.ch).toContain(l.ch);
      }
      expect(l.tip.length).toBeGreaterThan(10);
      expect(l.nameFi.length).toBeGreaterThan(0);
    }
  });

  it('only uses real words in the sound guides', () => {
    for (const g of SOUND_GUIDES) {
      for (const w of g.examples) expect(itemByFi(w), `${g.id}: ${w}`).toBeTruthy();
    }
  });
});
