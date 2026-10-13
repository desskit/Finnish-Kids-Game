import { describe, expect, it } from 'vitest';
import { apartFrom, NEVER_TOGETHER, rivals } from './apart';
import { animals } from '.';
import { buildListenRound, buildReviewRound } from '../game/round';

// The wild duck (sorsa) arrives with the Wiktionary supplement; until then a
// stand-in with its id shows the rule holding.
const duck = animals.items.find((i) => i.id === 'duck')!;
const wildDuck = { ...duck, id: 'wild-duck', word: 'sorsa', en: 'wild duck' };
const pool = [...animals.items.filter((i) => i.id !== 'wild-duck'), wildDuck];
const both = (ids: string[]) => ids.includes('duck') && ids.includes('wild-duck');

describe('words never offered together', () => {
  it('pairs ankka with sorsa, both ways, and nothing else', () => {
    expect(NEVER_TOGETHER).toContainEqual(['duck', 'wild-duck']);
    expect(rivals('duck', 'wild-duck')).toBe(true);
    expect(rivals('wild-duck', 'duck')).toBe(true);
    expect(rivals('duck', 'cat')).toBe(false);
    expect(apartFrom('duck', pool).map((i) => i.id)).not.toContain('wild-duck');
    expect(apartFrom('cat', pool)).toHaveLength(pool.length);
  });

  it('keeps them out of the same listening question, as answer or as wrong answers', () => {
    for (let run = 0; run < 200; run++) {
      for (const q of buildListenRound(pool, pool.length, 4, run % 2 === 0)) {
        expect(both(q.options.map((o) => o.id))).toBe(false);
        expect(q.options).toHaveLength(4);
      }
    }
  });

  it('keeps them out of the same review question', () => {
    for (let run = 0; run < 200; run++) {
      for (const q of buildReviewRound([duck, wildDuck, pool[0]], pool, 4)) {
        expect(both(q.options.map((o) => o.id))).toBe(false);
        expect(q.options).toHaveLength(4);
      }
    }
  });
});
