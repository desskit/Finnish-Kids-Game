import { describe, expect, it } from 'vitest';
import { apartFrom, NEVER_TOGETHER, rivals } from './apart';
import { animals, numbers, reviewItems, themes, verbs } from '.';
import { itemById } from './lookup';
import { nounConstructions } from './constructions';
import {
  buildCommandRound,
  buildComprehensionRound,
  buildCountingRound,
  buildListenRound,
  buildReadingRound,
  buildReviewRound,
  buildYesNoRound,
  reviewOptions,
} from '../game/round';
import { buildCarrierHearRound } from '../game/hear';

// The wild duck (sorsa) arrives with the Wiktionary supplement; until then a
// stand-in with its id shows the rule holding.
const duck = animals.items.find((i) => i.id === 'duck')!;
const wildDuck = { ...duck, id: 'wild-duck', word: 'sorsa', en: 'wild duck' };
const pool = [...animals.items.filter((i) => i.id !== 'wild-duck'), wildDuck];
const both = (ids: string[]) => ids.includes('duck') && ids.includes('wild-duck');

/** The first two words in `ids` that mustn't share a question, if any. */
function clash(ids: readonly string[]): string | undefined {
  for (const a of ids) for (const b of ids) if (a < b && rivals(a, b)) return `${a} + ${b}`;
  return undefined;
}

describe('words never offered together', () => {
  it('pairs ankka with sorsa, both ways', () => {
    expect(NEVER_TOGETHER).toContainEqual(['duck', 'wild-duck']);
    expect(rivals('duck', 'wild-duck')).toBe(true);
    expect(rivals('wild-duck', 'duck')).toBe(true);
    expect(rivals('duck', 'cat')).toBe(false);
    expect(apartFrom('duck', pool).map((i) => i.id)).not.toContain('wild-duck');
    expect(apartFrom('cat', pool)).toHaveLength(pool.length);
  });

  it('names only real words (sorsa is still to come)', () => {
    const missing = NEVER_TOGETHER.flat().filter((id) => id !== 'wild-duck' && !itemById(id));
    expect(missing).toEqual([]);
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

// Every game that offers pictures to tap, over the real word pools, many times.
describe('no picture question offers two words a child could not tell apart', () => {
  const nouns = themes.flatMap((t) => t.items).filter((i) => i.topic !== 'numbers');
  const pictured = nouns.filter((i) => i.emoji);
  const RUNS = 60;

  it('listen & tap and name it', () => {
    for (let run = 0; run < RUNS; run++) {
      for (const items of [pictured, verbs.items.filter((v) => v.emoji)]) {
        for (const q of buildListenRound(items, 30, 4, run % 2 === 0)) {
          expect(clash(q.options.map((o) => o.id))).toBeUndefined();
        }
      }
    }
  });

  it('review: its own kind of word, each on a picture of its own', () => {
    for (let run = 0; run < RUNS; run++) {
      for (const target of reviewItems) {
        const options = reviewOptions(target, reviewItems, 4);
        expect(clash(options.map((o) => o.id))).toBeUndefined();
        expect(new Set(options.map((o) => o.emoji)).size).toBe(options.length);
        // The kid in a verb's picture is a child too: actions only with actions.
        expect(options.every((o) => (o.topic === 'verbs') === (target.topic === 'verbs'))).toBe(true);
      }
    }
    const child = itemById('child')!;
    expect(reviewOptions(child, reviewItems, 4)).toHaveLength(4);
  });

  it('read & listen, sentence listening and commands', () => {
    for (let run = 0; run < RUNS; run++) {
      const tricky = run % 2 === 0;
      for (const q of buildReadingRound(pictured, 30, 4, tricky)) {
        expect(clash(q.options.map((o) => o.id))).toBeUndefined();
      }
      for (const q of buildComprehensionRound(pictured, nounConstructions, 30, 4, 4, tricky)) {
        expect(clash(q.options.map((o) => o.id))).toBeUndefined();
      }
      for (const q of buildCommandRound(verbs.items, 30, 4, tricky)) {
        expect(clash(q.options.map((o) => o.id))).toBeUndefined();
      }
    }
  });

  it('yes or no: never asks about a word the picture could also be', () => {
    const isThis = nounConstructions.find((c) => c.id === 'is-this')!;
    for (let run = 0; run < RUNS; run++) {
      for (const q of buildYesNoRound(pictured, isThis, 30, run % 2 === 0)) {
        if (!q.isMatch) expect(clash([q.shown.id, q.asked.id])).toBeUndefined();
      }
    }
    // The brother picture is a child: "Onko tämä lapsi?" can't be asked of it.
    const kids = ['brother', 'sister', 'child', 'baby', 'son'].map((id) => itemById(id)!);
    for (let run = 0; run < RUNS; run++) {
      for (const q of buildYesNoRound(kids, isThis, 10, true)) {
        if (!q.isMatch) expect(clash([q.shown.id, q.asked.id])).toBeUndefined();
      }
    }
  });

  it('counting: the things to pick from', () => {
    for (let run = 0; run < RUNS; run++) {
      for (const q of buildCountingRound(numbers.items, pictured, 30, 4, 10, run % 2 === 0)) {
        expect(clash(q.nounOptions.map((o) => o.id))).toBeUndefined();
      }
    }
  });

  it('hear it: the other words filling the tiles', () => {
    for (let run = 0; run < RUNS; run++) {
      for (const q of buildCarrierHearRound(pictured, nounConstructions.slice(0, 1), 20, 4)) {
        const ids = q.options.map((o) => (o.id.startsWith('w:') ? o.id.slice(2) : q.attemptId!));
        expect(clash(ids)).toBeUndefined();
      }
    }
  });
});
