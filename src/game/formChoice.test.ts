import { describe, it, expect } from 'vitest';
import { buildChooseRound, choosePoolsFor, type ChooseMode } from './formChoice';
import { verbs, family, freetime } from '../content';
import { caseFormOf, commandFor, dontForm, letsForm, verbForm } from '../content/types';
import { questionFor } from '../content/questions';

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
        const v = verbs.items.find((x) => q.cue.toLowerCase().includes(x.en))!;
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
