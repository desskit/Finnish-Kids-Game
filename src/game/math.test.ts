import { describe, it, expect } from 'vitest';
import {
  MATH_VALUES,
  buildMathRound,
  countdown,
  framesFor,
  isSayable,
  numberForm,
  numberWord,
  optionsFor,
  problemFor,
  valueOfWord,
  valuesIn,
  type MathSet,
} from './math';
import { WORD_FRAMES } from '../content/mathProblems';

const SETS: MathSet[] = ['sums-10', 'compare-12', 'neighbors-12', 'run-12', 'word', 'teens', 'sums-20', 'run-20'];
const ALL_VERBS = new Set(['eat', 'get', 'give']);
const RUNS = 300;

describe('the numbers the math section says', () => {
  it('are the sourced words: nolla to kaksikymmentä, the round tens and sata', () => {
    for (let v = 0; v <= 20; v++) expect(isSayable(v), String(v)).toBe(true);
    for (const v of [30, 40, 50, 60, 70, 80, 90, 100]) expect(isSayable(v)).toBe(true);
    // compounds are never put together by rule
    for (const v of [21, 34, 99]) expect(isSayable(v)).toBe(false);
    expect(MATH_VALUES.length).toBe(29);
    expect(numberWord(0)).toBe('nolla');
    expect(numberWord(13)).toBe('kolmetoista');
  });

  it('take their other forms from the tables (viiden jälkeen, ennen viittä)', () => {
    expect(numberForm(5, 'genitive')).toBe('viiden');
    expect(numberForm(5, 'partitive')).toBe('viittä');
    expect(numberForm(1, 'partitive')).toBe('yhtä');
    expect(valueOfWord('Viiden')).toBe(5);
    expect(valueOfWord('kissa')).toBeUndefined();
  });

  it('offers near misses as choices, the answer always among them', () => {
    for (let r = 0; r < RUNS; r++) {
      const o = optionsFor(3, 4, 0, 10);
      expect(o).toContain(3);
      expect(new Set(o).size).toBe(o.length);
      expect(o.length).toBe(4);
      for (const v of o) expect(v >= 0 && v <= 10).toBe(true);
    }
    // at the edge there are fewer near misses, never one out of range
    expect(optionsFor(0, 4, 0, 10).every((v) => v >= 0)).toBe(true);
  });
});

describe('every problem set', () => {
  it('stays inside the sourced numbers, with the answer among unique choices', () => {
    for (const set of SETS) {
      for (let r = 0; r < RUNS; r++) {
        const p = problemFor(set, { optionCount: 4, knownVerbs: ALL_VERBS });
        for (const v of valuesIn(p)) expect(isSayable(v), `${set}: ${v}`).toBe(true);
        expect(p.options).toContain(p.answer);
        expect(new Set(p.options).size).toBe(p.options.length);
        expect(p.ask.length).toBeGreaterThan(0);
        // the Finnish carries no digit — numbers are words
        for (const s of [...p.ask, p.tell]) expect(s.fi, `${set}: ${s.fi}`).not.toMatch(/\d/);
      }
    }
  });

  it('keeps sums and differences within their stage, never below nolla', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = problemFor('sums-10', { optionCount: 3 });
      expect(p.answer >= 0 && p.answer <= 10).toBe(true);
      if (p.show.kind === 'plus') expect(p.show.a + p.show.b).toBe(p.answer);
      if (p.show.kind === 'minus') expect(p.show.a - p.show.b).toBe(p.answer);
      const q = problemFor('sums-20', { optionCount: 3 });
      expect(q.answer >= 0 && q.answer <= 20).toBe(true);
    }
  });

  it('asks which is more or less of two different amounts', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = problemFor('compare-12', { optionCount: 4 });
      expect(p.options).toHaveLength(2);
      const [a, b] = p.options;
      expect(a).not.toBe(b);
      expect(p.ask[0].fi).toMatch(/^Kumpi on (enemmän|vähemmän): /);
      expect(p.answer).toBe(p.ask[0].fi.includes('enemmän') ? Math.max(a, b) : Math.min(a, b));
    }
  });

  it('says what comes after with the genitive and before with the partitive', () => {
    const seen = new Set<string>();
    for (let r = 0; r < RUNS; r++) {
      const p = problemFor('neighbors-12', { optionCount: 3 });
      seen.add(p.ask[0].fi.includes('jälkeen') ? 'after' : 'before');
      if (p.key === 'after:4') expect(p.ask[0].fi).toBe('Mikä luku tulee neljän jälkeen?');
      if (p.key === 'before:4') expect(p.ask[0].fi).toBe('Mikä luku tulee ennen neljää?');
    }
    expect(seen).toEqual(new Set(['after', 'before']));
  });

  it('counts down to nolla in the rocket, missing one in the middle', () => {
    for (let r = 0; r < 50; r++) {
      const p = countdown(3);
      if (p.show.kind !== 'run') throw new Error('a countdown is a run');
      expect(p.show.values[0]).toBe(10);
      expect(p.show.values.at(-1)).toBe(0);
      expect(p.show.values.indexOf(p.answer)).toBeGreaterThan(0);
      expect(p.show.values.indexOf(p.answer)).toBeLessThan(10);
    }
  });

  it('builds a round of different problems', () => {
    const round = buildMathRound('sums-10', 6, { optionCount: 3 });
    expect(round).toHaveLength(6);
    expect(new Set(round.map((p) => p.key)).size).toBe(6);
  });
});

describe('word problems', () => {
  it('only use verbs the course has taught', () => {
    expect(framesFor(new Set()).map((f) => f.id)).toEqual(['have-have']);
    expect(framesFor(new Set(['eat', 'get'])).map((f) => f.id)).toEqual(['have-have', 'have-get', 'have-eat']);
    for (let r = 0; r < RUNS; r++) {
      const p = problemFor('word', { optionCount: 3, knownVerbs: new Set(['eat']) });
      expect(['have-have', 'have-eat']).toContain(p.frame);
    }
  });

  it('never put yksi in an object slot (it would be "yhden")', () => {
    for (const f of WORD_FRAMES) if (f.verb) expect(f.bMin, f.id).toBeGreaterThanOrEqual(2);
    for (let r = 0; r < RUNS; r++) {
      const p = problemFor('word', { optionCount: 3, knownVerbs: ALL_VERBS });
      if (p.frame === 'have-have') continue;
      // the second sentence holds the eaten / got / given amount
      expect(p.ask[1].fi, p.ask[1].fi).not.toMatch(/\byksi\b|\byhden\b/);
    }
  });

  it('count the noun in the sourced form (yksi omena, kaksi omenaa)', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = problemFor('word', { optionCount: 3, knownVerbs: ALL_VERBS });
      const noun = p.noun!;
      const first = p.ask[0].fi;
      if (first.includes(' yksi ')) expect(first).toContain(` yksi ${noun.fi}.`);
      else expect(first).toContain(` ${noun.inflections.partitive_singular}.`);
      expect(p.ask[2].fi).toContain(`Montako ${noun.inflections.partitive_singular} `);
      // something is always left after eating or giving
      expect(p.answer).toBeGreaterThan(0);
    }
  });

  it('add when you get more and take away when you eat or give', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = problemFor('word', { optionCount: 3, knownVerbs: ALL_VERBS });
      if (p.show.kind !== 'plus' && p.show.kind !== 'minus') throw new Error('a sum');
      const plus = p.frame === 'have-have' || p.frame === 'have-get';
      expect(p.show.kind).toBe(plus ? 'plus' : 'minus');
      expect(p.answer).toBe(plus ? p.show.a + p.show.b : p.show.a - p.show.b);
    }
  });
});
