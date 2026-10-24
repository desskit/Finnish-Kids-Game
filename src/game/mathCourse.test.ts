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
  todayDone,
  todayGames,
  todayPlan,
  todayStreak,
  TODAY_PROBLEMS,
  waitingFor,
} from './mathCourse';
import { UNITS, nextAction, unitsCompleted } from './course';
import { recordRoundOnChild } from './progress';
import { badgeEnv } from './path';
import { badgeById, earnedBadgeIds } from './badges';
import { pickWarmupSubject } from './warmup';
import { applyStatEvent, statsOf } from './stats';

// The math section's rules (Lasketaan!): stages open in order, each also
// waiting for the course unit it needs; a lesson, the games, then the crown.
// And math stays apart: it never moves the course, its badges or its warm-up.

const [plusMinus, moreLess, howMany, teens, tens, times, shop, clock] = MATH_STAGES;
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

describe('the stages after the teens', () => {
  const upToTeens = crowns(plusMinus.id, moreLess.id, howMany.id);

  it('run on in a line: the tens after the teens, times after the tens', () => {
    const c = through('doing', { math: upToTeens });
    expect(stageStatus(c, teens)).toBe('open');
    expect(waitingFor(c, tens).stage).toBe(teens);
    expect(stageStatus(c, tens)).toBe('locked');
    const more = through('doing', { math: crowns(plusMinus.id, moreLess.id, howMany.id, teens.id) });
    expect(stageStatus(more, tens)).toBe('open');
    expect(waitingFor(more, times).stage).toBe(tens);
  });

  it('branch off after word problems for the shop and the clock, each waiting for its course unit', () => {
    const atShop = through('shop', { math: upToTeens });
    expect(stageStatus(atShop, shop)).toBe('open');
    // the clock needs the course's "My day" too
    expect(stageStatus(atShop, clock)).toBe('locked');
    expect(waitingFor(atShop, clock)).toEqual({ unit: 'my-day', stage: undefined });
    expect(stageStatus(through('my-day', { math: upToTeens }), clock)).toBe('open');
    // without the word problems' crown, neither opens
    const noCrown = through('my-day', { math: crowns(plusMinus.id, moreLess.id) });
    expect(waitingFor(noCrown, shop).stage).toBe(howMany);
    expect(stageStatus(noCrown, clock)).toBe('locked');
  });

  it('lead Continue past a shut stage to an open one further on', () => {
    // the line is all won as far as the times tables, which wait — the shop is open
    const c = through('shop', { math: crowns(plusMinus.id, moreLess.id, howMany.id, teens.id, tens.id, times.id) });
    expect(nextMathAction(c)).toEqual({ kind: 'lesson', stage: shop });
  });
});

describe('today’s sums', () => {
  const begun = (...ids: string[]) => ({ lessonsSeen: Object.fromEntries(ids.map((id) => [id, 1])) });

  it('wait until a stage is begun', () => {
    expect(todayGames(through('numbers'))).toEqual([]);
    expect(todayPlan(through('numbers'))).toEqual([]);
  });

  it('draw problems to listen to from the games of the stages begun or won — no train, builder or quick sums', () => {
    const c = through('doing', { course: { ...through('doing').course, ...begun(teens.lessonId) }, math: crowns(plusMinus.id) });
    const games = todayGames(c);
    const stages = new Set(games.map((g) => findMathSkill(g.id)?.chapter.id));
    expect([...stages].sort()).toEqual([plusMinus.id, teens.id].sort());
    for (const g of games) expect(['math-train', 'math-build', 'math-quick', 'story']).not.toContain(g.activity);
    const plan = todayPlan(c, false, () => 0.3);
    expect(plan).toHaveLength(TODAY_PROBLEMS);
    // all different while there are enough games
    expect(new Set(plan.map((p) => p.id)).size).toBe(Math.min(TODAY_PROBLEMS, games.length));
  });

  it('are done once a day, and their days in a row show until a day is missed', () => {
    const day = Date.parse('2026-10-24T12:00:00');
    const c = child({ math: { today: { lastDay: '2026-10-24', streak: 3, best: 3, days: 5 } } });
    expect(todayDone(c, day)).toBe(true);
    expect(todayDone(c, day + 86_400_000)).toBe(false);
    expect(todayStreak(c, day + 86_400_000)).toBe(3);
    expect(todayStreak(c, day + 2 * 86_400_000)).toBe(0);
    expect(todayDone(child(), day)).toBe(false);
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
    // only the math badges move (the first sum, the crowns), never a course one
    const courseBadges = (x: Child) => [...earnedBadgeIds(x, badgeEnv)].filter((id) => badgeById(id)?.category !== 'math');
    expect(courseBadges(c)).toEqual(courseBadges(start));
    expect([...earnedBadgeIds(c, badgeEnv)].filter((id) => !courseBadges(start).includes(id)).sort()).toEqual(['math-crowns-3', 'math-crowns-all', 'math-first']);
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
