import { describe, it, expect } from 'vitest';
import { UNITS } from './course';
import { activitiesUpTo, renderActivity, type SkillNode } from './path';
import { difficultyFor } from './adapt';
import { buildChooseRound } from './formChoice';
import {
  buildConjugationRound,
  buildCountingRound,
  buildErrorRound,
  buildListenRound,
  buildPhraseRound,
  buildPossessiveRound,
} from './round';
import { formFor, possessiveForm, verbForm } from '../content/types';

// Every course step, at every level it climbs to, built the way its own games
// build it — the props renderActivity hands the game, the level's knobs plus
// the step's pins — and checked question by question: one right answer, no
// tile twice, nothing blank, the right answer the sourced form, verbs and
// tenses within the step and the level. (The builders' own tests cover each
// game in depth on chosen content; this covers every step's real content.)

const RUNS = 2;

type Props = Record<string, any>;

function eachRound(visit: (step: SkillNode, level: number, activity: string, props: Props) => void) {
  for (const unit of UNITS) {
    for (const step of unit.skills) {
      if (step.content.mixOf) continue;
      for (let level = 1; level <= (step.maxLevel ?? 4); level++) {
        for (const activity of new Set(activitiesUpTo(step, level))) {
          const el = renderActivity(step, activity, () => {});
          if (el) visit(step, level, activity, el.props as Props);
        }
      }
    }
  }
}

const unique = (xs: readonly (string | undefined)[]) => new Set(xs).size === xs.length;

describe('every course step, at every level', () => {
  it('builds only well-formed questions with one right answer', () => {
    const bad: string[] = [];
    let asked = 0;
    eachRound((step, level, activity, p) => {
      const d = { ...difficultyFor(level), ...step.pin };
      const at = `${step.id} L${level} ${activity}`;
      for (let run = 0; run < RUNS; run++) {
        if (activity === 'choose') {
          const { mode, onExit: _onExit, ...pools } = p;
          const qs = buildChooseRound(mode, pools as never, 10, Math.max(3, d.optionCount));
          if (qs.length === 0) bad.push(`${at}: no question`);
          for (const q of qs) {
            asked++;
            if (q.options.filter((o) => o === q.answer).length !== 1) bad.push(`${at}: answer ${q.answer} not once`);
            if (!unique(q.options) || q.options.some((o) => !o?.trim())) bad.push(`${at}: tiles [${q.options.join(' | ')}]`);
          }
        } else if (activity === 'conjugate') {
          const qs = buildConjugationRound(p.verbs, 10, d.optionCount, d.verbCombos, d.tricky);
          if (qs.length === 0) bad.push(`${at}: no question`);
          const allowed = new Set((p.verbs as { id: string }[]).map((v) => v.id));
          for (const q of qs) {
            asked++;
            const right = q.options.filter((o) => o.correct);
            if (right.length !== 1 || right[0].form !== verbForm(q.verb, q.tense, q.polarity, q.person)) bad.push(`${at}: right answer`);
            if (!unique(q.options.map((o) => o.form))) bad.push(`${at}: a form twice`);
            if (!allowed.has(q.verb.id)) bad.push(`${at}: verb ${q.verb.id} outside the step`);
            if (!d.verbCombos.some((c) => c.tense === q.tense && c.polarity === q.polarity)) bad.push(`${at}: ${q.tense} ${q.polarity} past the level`);
          }
        } else if (activity === 'build' || activity === 'ending' || activity === 'order') {
          const qs = buildPhraseRound(p.items, p.constructions, 10, d.optionCount, d.maxTier, d.tricky, undefined, d.formDistractors, activity === 'ending');
          if (qs.length === 0) bad.push(`${at}: no question`);
          for (const q of qs) {
            asked++;
            const right = formFor(q.item, q.construction);
            const tiles = q.formOptions ?? q.options.map((o) => formFor(o, q.construction));
            if (tiles.filter((t) => t === right).length !== 1) bad.push(`${at}: ${right} not once in [${tiles.join(' | ')}]`);
            if (!unique(tiles) || tiles.some((t) => !t)) bad.push(`${at}: tiles [${tiles.join(' | ')}]`);
          }
        } else if (activity === 'listen' || activity === 'name') {
          for (const q of buildListenRound(p.items, 6, d.optionCount, d.tricky)) {
            asked++;
            if (q.options.filter((o) => o.id === q.target.id).length !== 1) bad.push(`${at}: target not once`);
            if (!unique(q.options.map((o) => o.fi.toLowerCase()))) bad.push(`${at}: two tiles say ${q.options.map((o) => o.fi).join(' | ')}`);
          }
        } else if (activity === 'possessive') {
          for (const q of buildPossessiveRound(p.items, 6, d.optionCount, p.cases !== 'never')) {
            asked++;
            if (q.answer !== possessiveForm(q.item, q.possessor, q.caseId) || q.options.filter((o) => o === q.answer).length !== 1 || !unique(q.options)) {
              bad.push(`${at}: ${q.answer} in [${q.options.join(' | ')}]`);
            }
          }
        } else if (activity === 'error-fix') {
          for (const q of buildErrorRound(p.items, p.constructions, 6, d.maxTier, d.tricky)) {
            asked++;
            const slot = q.words[q.slotIndex]?.text?.replace(/[.?!,]$/, '').toLowerCase();
            if (q.correctForm !== formFor(q.item, q.construction)) bad.push(`${at}: right form`);
            if ((slot === q.correctForm.toLowerCase()) !== q.isCorrect) bad.push(`${at}: "${slot}" marked ${q.isCorrect ? 'right' : 'wrong'}`);
          }
        } else if (activity === 'count') {
          for (const q of buildCountingRound(p.numbers, p.nouns, 6, d.optionCount, d.maxCount, d.tricky)) {
            asked++;
            if (q.numberOptions.filter((o) => o.id === q.number.id).length !== 1 || !unique(q.numberOptions.map((o) => o.fi))) bad.push(`${at}: number tiles`);
          }
        }
      }
    });
    expect(bad).toEqual([]);
    expect(asked).toBeGreaterThan(5000);
  });
});
