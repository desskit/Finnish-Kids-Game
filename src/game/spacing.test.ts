import { describe, it, expect } from 'vitest';
import { buildListenRound, spaceNewWords } from './round';
import { rivals } from '../content/apart';
import { reviewItemById } from '../content';

// New words arrive spaced: never two NEW look-alikes (apart.ts) in one round.

const ids = (xs: { id: string }[]) => xs.map((x) => x.id);

describe('new words, spaced', () => {
  it('swaps the second new look-alike for a known word', () => {
    const pool = [{ id: 'brother' }, { id: 'son' }, { id: 'cat' }, { id: 'dog' }];
    const isNew = (id: string) => id !== 'cat';
    const out = spaceNewWords([{ id: 'brother' }, { id: 'son' }, { id: 'dog' }], pool, isNew);
    expect(ids(out)).toEqual(['brother', 'cat', 'dog']);
  });

  it('leaves a round alone when the look-alikes are known, or nothing else fits', () => {
    const known = () => false;
    expect(ids(spaceNewWords([{ id: 'brother' }, { id: 'son' }], [{ id: 'brother' }, { id: 'son' }], known))).toEqual([
      'brother',
      'son',
    ]);
    const all = () => true;
    expect(ids(spaceNewWords([{ id: 'brother' }, { id: 'son' }], [{ id: 'brother' }, { id: 'son' }], all))).toEqual([
      'brother',
      'son',
    ]);
  });

  it('a whole listening round over new family words and known animals never holds two new rivals', () => {
    const family = ['brother', 'son', 'child', 'baby', 'sister', 'grandfather', 'uncle', 'cat', 'dog', 'horse', 'cow', 'pig', 'fox']
      .map((id) => reviewItemById[id])
      .filter(Boolean);
    const seen = new Set(['cat', 'dog', 'horse', 'cow', 'pig', 'fox']);
    const isNew = (id: string) => !seen.has(id);
    for (let run = 0; run < 40; run++) {
      const round = buildListenRound(family, 6, 3, false, undefined, isNew);
      const fresh = round.map((q) => q.target.id).filter(isNew);
      for (const a of fresh) for (const b of fresh) if (a !== b) expect(rivals(a, b), `${a} + ${b}`).toBe(false);
    }
  });
});
