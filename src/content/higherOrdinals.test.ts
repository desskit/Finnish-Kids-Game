import { describe, expect, it } from 'vitest';
import { HIGHER_ORDINALS, JOINED_ORDINAL_IDS, ordinalSuffix } from './higherOrdinals';
import { ordinals } from '.';
import { dateEnglish, dateFi } from './dates';
import { itemById } from './lookup';
import { buildChooseRound, choosePoolsFor } from '../game/formChoice';
import { findSkill } from '../game/path';

// The authored ordinals must follow the patterns of the SOURCED ones exactly.
const sourced = (v: number) => ordinals.items.find((o) => o.value === v && !o.tags?.includes('authored'))!.fi;

describe('ordinals 11th–31st (authored, for dates)', () => {
  it('11th–19th = the sourced ordinal\'s stem (-s → -s) + "toista"', () => {
    // yhdes- / kahdes- for 1st / 2nd (the "toinen / ensimmäinen" are special),
    // otherwise the sourced ordinal itself: kolmas + toista.
    const stem = (v: number) => (v === 1 ? 'yhdes' : v === 2 ? 'kahdes' : sourced(v));
    for (let v = 11; v <= 19; v++) {
      expect(HIGHER_ORDINALS.find((o) => o.value === v)!.fi).toBe(`${stem(v - 10)}toista`);
    }
  });

  it('20th / 30th = kahdes / kolmas + kymmenes; 21st–29th and 31st = the ten + the sourced ordinal', () => {
    expect(HIGHER_ORDINALS.find((o) => o.value === 20)!.fi).toBe('kahdes' + sourced(10));
    expect(HIGHER_ORDINALS.find((o) => o.value === 30)!.fi).toBe(sourced(3) + sourced(10));
    for (let v = 21; v <= 29; v++) {
      expect(HIGHER_ORDINALS.find((o) => o.value === v)!.fi).toBe('kahdeskymmenes' + sourced(v - 20));
    }
    expect(HIGHER_ORDINALS.find((o) => o.value === 31)!.fi).toBe('kolmaskymmenes' + sourced(1));
    expect(JOINED_ORDINAL_IDS).toHaveLength(10);
  });

  it('every day of a month has an ordinal', () => {
    for (let v = 1; v <= 31; v++) expect(ordinals.items.some((o) => o.value === v), String(v)).toBe(true);
  });

  it('writes English dates with the right suffix', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 31].map((n) => n + ordinalSuffix(n))).toEqual([
      '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '31st',
    ]);
    expect(dateEnglish(itemById('twenty-first')!, itemById('may')!)).toBe('May 21st');
    expect(dateFi(itemById('twenty-first')!, itemById('may')!)).toBe('kahdeskymmenesensimmäinen toukokuuta');
  });

  it('the dates game reaches past the 10th, up to the 31st', () => {
    const pools = choosePoolsFor(findSkill('dates')!.skill.content.wordIds);
    const seen = new Set<number>();
    for (let r = 0; r < 120; r++) {
      for (const q of buildChooseRound('date', pools, 6, 3)) {
        const m = q.cue.match(/(\d+)(st|nd|rd|th)/);
        if (m) seen.add(Number(m[1]));
        expect(q.options).toHaveLength(3);
      }
    }
    expect(Math.max(...seen)).toBeGreaterThan(20);
    expect([...seen].some((v) => v > 10 && v < 20)).toBe(true);
  });
});
