import { describe, it, expect } from 'vitest';
import { itemIdsIn } from './heardWords';
import { reviewItemById } from '.';

describe('the course words in a line', () => {
  it('finds a word in its basic form and in a sourced case form, once each', () => {
    const cat = reviewItemById.cat;
    const ids = itemIdsIn(`Tämä on ${cat.fi}. ${cat.fi}!`);
    expect(ids).toEqual(['cat']);
    const partitive = cat.inflections.partitive_singular;
    if (partitive) expect(itemIdsIn(`Minä näen ${partitive}.`)).toContain('cat');
  });

  it('skips the words it doesn’t know', () => {
    expect(itemIdsIn('ja mutta nyt')).toEqual([]);
  });
});
