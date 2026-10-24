import { describe, it, expect } from 'vitest';
import type { Child } from '../state/storage';
import { MATH_STAGES, findMathSkill, isMathId, mathTestPlan } from './mathPath';
import {
  crownWon,
  mathActionHref,
  mathStepStatus,
  mathTestStatus,
  newStages,
  nextMathAction,
  stageStatus,
  taughtWords,
  waitingFor,
} from './mathCourse';
import { UNITS, nextAction, unitsCompleted } from './course';
import { recordRoundOnChild } from './progress';
import { badgeEnv } from './path';
import { earnedBadgeIds } from './badges';
import { pickWarmupSubject } from './warmup';
import { applyStatEvent, statsOf } from './stats';

// The math section's rules (Lasketaan!): stages open in order, each also
// waiting for the course unit it needs; a lesson, the games, then the crown.
// And math stays apart: it never moves the course, its badges or its warm-up.

const [plusMinus, moreLess, howMany, teens] = MATH_STAGES;
const proven = { plays: 3, bestStars: 6, totalStars: 18, totalPossible: 18, lastPlayed: 1, level: 3, recent: [], topProvenAt: 1 };
const passed = { passedAt: 1, best: 1, attempts: 1 };

function child(over: Partial<Child> = {}): Child {
  return { id: 'k', name: 'Aino', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs: {}, ...over } as Child;
}

/** A child who has passed the course's checkpoints up to (and including) a unit. */
function through(unitId: string, extra: Partial<Child> = {}): Child {
  const upTo = UNITS.slice(0, UNITS.findIndex((u) => u.id === unitId) + 1);
  return child({ course: { checkpoints: Object.fromEntries(upTo.map((u) => [u.id, passed])) }, ...extra });
}

const crowns = (...ids: string[]) => ({ crowns: Object.fromEntries(ids.map((id) => [id, passed])) });

describe('the math stages', () => {
  it('are all math ids, with their games findable and a test of every game', () => {
    for (const stage of MATH_STAGES) {
      expect(isMathId(stage.id)).toBe(true);
      expect(stage.lessonId).toBe(stage.id);
      for (const step of stage.skills) {
        expect(isMathId(step.id), step.id).toBe(true);
        expect(findMathSkill(step.id)?.chapter).toBe(stage);
      }
      const plan = mathTestPlan(stage);
      expect(plan.map((p) => p.step.id)).toEqual(stage.skills.filter((s) => s.activity !== 'story').map((s) => s.id));
    }
  });

  it('stay shut until the course has taught the numbers', () => {
    const c = child();
    expect(stageStatus(c, plusMinus)).toBe('locked');
    expect(waitingFor(c, plusMinus).unit).toBe('numbers');
    expect(nextMathAction(c)).toBeUndefined();
    expect(newStages(c)).toEqual([]);
  });

  it('open the first stage after the Numbers unit: its lesson first, then its games', () => {
    const c = through('numbers');
    expect(stageStatus(c, plusMinus)).toBe('open');
    expect(newStages(c)).toEqual([plusMinus]);
    const first = nextMathAction(c)!;
    expect(first.kind).toBe('lesson');
    expect(mathActionHref(first)).toBe('/lesson/math-plus-minus');
    expect(mathStepStatus(c, plusMinus, plusMinus.skills[0])).toBe('locked');

    const read = through('numbers', { course: { ...c.course, lessonsSeen: { 'math-plus-minus': 1 } } });
    expect(mathStepStatus(read, plusMinus, plusMinus.skills[0])).toBe('open');
    expect(nextMathAction(read)).toMatchObject({ kind: 'step', step: plusMinus.skills[0] });
    // seen once read: no more "Uusi!"
    expect(newStages(read)).toEqual([]);
    // the test waits for every game
    expect(mathTestStatus(read, plusMinus)).toBe('locked');
  });

  it('open the test once every game is done, and the next stage once the crown is won', () => {
    const done = Object.fromEntries(plusMinus.skills.map((s) => [s.id, proven]));
    const c = through('numbers', { course: { checkpoints: through('numbers').course!.checkpoints, lessonsSeen: { 'math-plus-minus': 1 } }, progress: { [plusMinus.id]: done } });
    expect(mathTestStatus(c, plusMinus)).toBe('open');
    expect(nextMathAction(c)).toMatchObject({ kind: 'test' });
    expect(mathActionHref(nextMathAction(c)!)).toBe('/math/test/math-plus-minus');
    expect(stageStatus(c, moreLess)).toBe('locked');
    expect(waitingFor(c, moreLess).stage).toBe(plusMinus);

    const crowned = { ...c, math: crowns(plusMinus.id) };
    expect(crownWon(crowned, plusMinus)).toBe(true);
    expect(stageStatus(crowned, plusMinus)).toBe('done');
    expect(stageStatus(crowned, moreLess)).toBe('open');
    expect(nextMathAction(crowned)).toMatchObject({ kind: 'lesson', stage: moreLess });
  });

  it('wait for the course where a stage needs it (word problems need the verbs unit)', () => {
    const early = through('numbers', { math: crowns(plusMinus.id, moreLess.id) });
    expect(stageStatus(early, howMany)).toBe('locked');
    expect(waitingFor(early, howMany).unit).toBe('doing');
    const later = through('doing', { math: crowns(plusMinus.id, moreLess.id) });
    expect(stageStatus(later, howMany)).toBe('open');
    expect(stageStatus(later, teens)).toBe('locked');
  });

  it('all open for a grown-up who unlocked everything', () => {
    for (const stage of MATH_STAGES) {
      expect(stageStatus(child(), stage, true)).toBe('open');
      expect(mathTestStatus(child(), stage, true)).toBe('open');
    }
  });

  it('give word problems only the verbs the course has taught', () => {
    expect([...taughtWords(child())]).toEqual([]);
    const words = taughtWords(through('doing'));
    expect(words.has('eat')).toBe(true);
    expect(words.has('give')).toBe(false);
  });
});

describe('math stays apart from the course', () => {
  const start = through('numbers', { course: { checkpoints: through('numbers').course!.checkpoints, lessonsSeen: { 'math-plus-minus': 1 } } });

  it('never moves the course: units done, Continue, or the course badges', () => {
    let c = start;
    for (const stage of MATH_STAGES) {
      for (const step of stage.skills) c = recordRoundOnChild(c, stage.id, step.id, 6, 6, step.maxLevel ?? 4, false, true);
    }
    c = { ...c, math: crowns(...MATH_STAGES.map((s) => s.id)) };
    expect(unitsCompleted(c)).toBe(unitsCompleted(start));
    expect(nextAction(c)).toEqual(nextAction(start));
    expect(earnedBadgeIds(c, badgeEnv)).toEqual(earnedBadgeIds(start, badgeEnv));
    // its crowns are its own, never the course's checkpoints
    expect(Object.keys(c.course?.checkpoints ?? {}).some(isMathId)).toBe(false);
  });

  it('never sends the course warm-up to a math game', () => {
    // plenty of shaky math answers on earlier days
    let stats = statsOf(start);
    for (let day = 1; day <= 3; day++) {
      stats = applyStatEvent(stats, { subject: 'math-sums-10', right: 1, total: 10, ms: 30000, source: 'practice' }, Date.UTC(2026, 0, day, 12));
    }
    const c = { ...start, stats };
    expect(statsOf(c).subjects['math-sums-10']).toBeTruthy();
    expect(pickWarmupSubject(c, Date.UTC(2026, 0, 9, 12))?.step.id).not.toBe('math-sums-10');
  });
});
