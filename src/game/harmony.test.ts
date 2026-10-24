import { describe, it, expect } from 'vitest';
import { caseFormOptions, buildConjugationRound, buildPossessiveRound } from './round';
import { buildChooseRound, choosePoolsFor, type ChooseMode } from './formChoice';
import { nounConstructions } from '../content/constructions';
import { reviewItems, verbs } from '../content';

// Vowel harmony is never the question (docs/LEARNING_RESEARCH.md): a child
// asked to pick between "talossa" and "talossä" is being taught to choose a
// vowel the word itself decides. No game offers two choices that differ only
// in a harmony vowel (a/ä, o/ö, u/y).

const PAIR: Record<string, string> = { a: 'ä', ä: 'a', o: 'ö', ö: 'o', u: 'y', y: 'u' };

/** Do two forms differ only in harmony vowels? */
function harmonyTwins(a: string, b: string): boolean {
  if (a === b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i].toLowerCase();
    const y = b[i].toLowerCase();
    if (x !== y && PAIR[x] !== y) return false;
  }
  return true;
}

const twinsIn = (opts: readonly string[]) =>
  opts.flatMap((a, i) => opts.slice(i + 1).filter((b) => harmonyTwins(a, b)).map((b) => `${a} / ${b}`));

describe('vowel harmony is never the choice', () => {
  it('knows a harmony twin when it sees one', () => {
    expect(harmonyTwins('talossa', 'talossä')).toBe(true);
    expect(harmonyTwins('kissassa', 'kissalla')).toBe(false);
    expect(harmonyTwins('talo', 'talo')).toBe(false);
  });

  it('in the case-form tiles (ending rounds, expert tiles, grammar review)', () => {
    const bad: string[] = [];
    for (const con of nounConstructions) {
      for (const item of reviewItems) {
        for (let k = 0; k < 2; k++) {
          const opts = caseFormOptions(item, con, 4);
          if (opts) bad.push(...twinsIn(opts).map((t) => `${con.id}/${item.id}: ${t}`));
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('in the choose-a-form games, verb endings and possessive suffixes', () => {
    const bad: string[] = [];
    const modes: ChooseMode[] = ['answer', 'ask', 'mood', 'pronoun', 'owner', 'verb-type', 'degree', 'compare', 'superlative', 'ordinal', 'date', 'age', 'verb-case', 'play'];
    const pools = choosePoolsFor(undefined);
    for (const mode of modes) {
      for (let k = 0; k < 15; k++) {
        for (const q of buildChooseRound(mode, pools, 6, 4)) bad.push(...twinsIn(q.options).map((t) => `${mode}: ${t}`));
      }
    }
    for (let k = 0; k < 40; k++) {
      for (const q of buildConjugationRound(verbs.items, 6, 4)) bad.push(...twinsIn(q.options.map((o) => o.form)).map((t) => `verb: ${t}`));
      for (const q of buildPossessiveRound(reviewItems, 6, 4, true)) bad.push(...twinsIn(q.options).map((t) => `possessive: ${t}`));
    }
    expect([...new Set(bad)]).toEqual([]);
  });
});
