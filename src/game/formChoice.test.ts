import { describe, it, expect } from 'vitest';
import { buildChooseRound, choosePoolsFor, type ChooseMode } from './formChoice';
import { verbs, family, freetime } from '../content';
import { caseFormOf, commandFor, dontForm, letsForm, verbForm } from '../content/types';
import { questionFor } from '../content/questions';
import { nounConstructions } from '../content/constructions';
import { itemById } from '../content/lookup';
import { whyForVerbCasePick } from '../content/why';
import { themes } from '../content';

const RUNS = 40;
const pools = choosePoolsFor(undefined);

describe('choose-the-form rounds', () => {
  it.each<ChooseMode>(['answer', 'ask', 'mood', 'pronoun', 'owner'])(
    '%s: one right answer among distinct options',
    (mode) => {
      for (let r = 0; r < RUNS; r++) {
        const round = buildChooseRound(mode, pools, 6, 3);
        expect(round.length).toBeGreaterThan(0);
        for (const q of round) {
          expect(q.options).toContain(q.answer);
          expect(new Set(q.options).size).toBe(q.options.length);
          expect(q.options.length).toBeGreaterThanOrEqual(3);
          expect(q.cue.length).toBeGreaterThan(0);
          expect(q.why.text.length).toBeGreaterThan(0);
        }
      }
    },
  );

  it('answers a "you" question about YOURSELF, with sourced forms', () => {
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildChooseRound('answer', pools, 6, 4)) {
        const v = verbs.items.find((x) => questionFor(x) === q.said!.fi)!;
        const yes = verbForm(v, 'present', 'positive', '1sg')!;
        const no = verbForm(v, 'present', 'negative', '1sg')!;
        const want = q.cue === 'Answer YES' ? yes : no;
        expect(q.answer.toLowerCase()).toBe(want + '.');
      }
    }
  });

  it('asks with the authored question form', () => {
    for (const q of buildChooseRound('ask', pools, 6, 3)) expect(q.answer).toMatch(/k[oö]\?$/);
  });

  it("uses the sourced do / don't / let's forms", () => {
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildChooseRound('mood', pools, 6, 3)) {
        // The longest matching gloss wins ("run away" over "run").
        const v = verbs.items
          .filter((x) => q.cue.toLowerCase().includes(x.en))
          .sort((a, b) => b.en.length - a.en.length)[0];
        const forms = [commandFor(v), dontForm(v), letsForm(v)].map((f) => f!.replace(/!$/, '').toLowerCase());
        expect(forms).toContain(q.answer.replace(/!$/, '').toLowerCase());
      }
    }
  });

  it('gives the OWNER the genitive: "isän pyörä"', () => {
    const narrow = { verbs: [], owners: family.items.filter((i) => i.id === 'father'), things: freetime.items.filter((i) => i.id === 'bike') };
    const [q] = buildChooseRound('owner', narrow, 1, 3);
    expect(q.answer).toBe(`${caseFormOf(narrow.owners[0], 'genitive', 'singular')} pyörä`);
    expect(q.answer).toBe('isän pyörä');
    expect(q.cue).toBe("Dad's bike");
    expect(q.options).toContain('isä pyörä');
  });

  it('only draws words the child has met when scoped', () => {
    const scoped = choosePoolsFor(['mother', 'ball', 'eat']);
    expect(scoped.owners.map((o) => o.id)).toEqual(['mother']);
    expect(scoped.things.map((t) => t.id)).toEqual(['ball']);
    expect(scoped.verbs.map((v) => v.id)).toEqual(['eat']);
  });
});

describe('"Why?" explains the exact wrong pick', () => {
  it.each<ChooseMode>(['answer', 'ask', 'mood', 'pronoun', 'owner'])('%s: every wrong option has its own tip', (mode) => {
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildChooseRound(mode, pools, 6, 4)) {
        for (const o of q.options) {
          if (o === q.answer) continue;
          expect(q.whyFor?.[o]?.text, `${mode}: ${o}`).toBeTruthy();
        }
      }
    }
  });

  it('"Et juokse." to "Juoksetko?" (answer NO) says it means YOU don\'t run — answer with en', () => {
    const run = verbs.items.find((v) => v.id === 'run')!;
    for (let r = 0; r < RUNS; r++) {
      const q = buildChooseRound('answer', { ...pools, verbs: [run] }, 1, 4)[0];
      if (q.cue !== 'Answer NO') continue;
      const tip = q.whyFor!['Et juokse.'].text;
      expect(tip).toMatch(/YOU don't run/);
      expect(tip).toMatch(/\*\*en\*\* = "I don't"/);
      expect(q.answer).toBe('En juokse.');
      return;
    }
    throw new Error('no NO question drawn');
  });
});

describe('which verb, which ending?', () => {
  const cons = nounConstructions.filter((c) =>
    ['i-like-tykkaan', 'i-love', 'i-see', 'i-watch', 'i-wait-for'].includes(c.id),
  );
  const mixed = { ...pools, constructions: cons, items: themes.flatMap((t) => t.items) };

  it('mixes the verbs; one right sentence, the others the wrong endings', () => {
    const seen = new Set<string>();
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildChooseRound('verb-case', mixed, 6, 4)) {
        expect(q.options).toContain(q.answer);
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(q.options.length).toBeLessThanOrEqual(4);
        // Every option is the SAME verb — only the ending differs.
        const verb = q.answer.split(' ')[0];
        for (const o of q.options) expect(o.split(' ')[0]).toBe(verb);
        seen.add(verb);
        // Each wrong option says what it is.
        for (const o of q.options) if (o !== q.answer) expect(q.whyFor?.[o]?.text.length).toBeGreaterThan(0);
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });

  it('names the verb a wrong ending belongs to', () => {
    const love = cons.find((c) => c.id === 'i-love')!;
    const why = whyForVerbCasePick(love, itemById('dog')!, 'koirasta', cons);
    expect(why.text).toMatch(/^\*koirasta\* has \*\*-sta \/ -stä\*\* — that's the ending \*Tykkään\* takes\. \*Rakastan\*/);
  });
});
