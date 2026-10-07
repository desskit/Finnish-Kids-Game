import { describe, expect, it } from 'vitest';
import { itemById } from './lookup';
import { ageSentence, dateFi, yearsWord } from './dates';
import { buildChooseRound, choosePoolsFor } from '../game/formChoice';
import { findSkill, PATH } from '../game/path';
import { ordinals } from '.';

const it_ = (id: string) => itemById(id)!;

describe('numbers, dates and birthdays', () => {
  it('has the sourced ordinals 1st–10th, in their own pool', () => {
    expect(ordinals.items.filter((o) => !o.tags?.includes('authored')).map((o) => o.fi)).toEqual([
      'ensimmäinen', 'toinen', 'kolmas', 'neljäs', 'viides', 'kuudes', 'seitsemäs', 'kahdeksas', 'yhdeksäs', 'kymmenes',
    ]);
  });

  it('builds a date from the sourced ordinal + the sourced month partitive', () => {
    expect(dateFi(it_('fifth'), it_('may'))).toBe('viides toukokuuta');
    expect(dateFi(it_('first'), it_('january'))).toBe('ensimmäinen tammikuuta');
    expect(yearsWord()).toBe('vuotta');
    expect(ageSentence(it_('eight'))).toBe('Olen kahdeksan vuotta vanha.');
  });

  it('plays full rounds in the number and birthday units, with right answers and per-pick tips', () => {
    for (const [id, mode] of [['three-or-third', 'ordinal'], ['dates', 'date'], ['how-old', 'age']] as const) {
      const step = findSkill(id)!.skill;
      const pools = choosePoolsFor(step.content.wordIds);
      for (let r = 0; r < 20; r++) {
        const round = buildChooseRound(mode, pools, 6, 3);
        expect(round.length, id).toBe(6);
        for (const q of round) {
          expect(new Set(q.options).size, id).toBe(q.options.length);
          for (const o of q.options.filter((x) => x !== q.answer)) expect(q.whyFor?.[o], `${id}: ${o}`).toBeTruthy();
        }
      }
    }
  });

  it('a date answer is always ordinal + month-with-ta, never the plain number', () => {
    const pools = choosePoolsFor(findSkill('dates')!.skill.content.wordIds);
    for (let r = 0; r < 20; r++) {
      for (const q of buildChooseRound('date', pools, 6, 3)) {
        // Any ordinal ends in -s, -nen or -toista; the month always in -kuuta.
        expect(q.answer).toMatch(/(s|nen|toista) [a-zäö]+kuuta\.?$/);
      }
    }
  });

  it('the number units come in order: 1–12 first, then big numbers, then birthdays', () => {
    const at = (id: string) => PATH.findIndex((u) => u.id === id);
    expect(at('numbers')).toBeLessThan(at('big-numbers'));
    expect(at('big-numbers')).toBeLessThan(at('birthdays'));
  });
});
