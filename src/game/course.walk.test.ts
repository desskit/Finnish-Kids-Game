import { describe, it, expect } from 'vitest';
import type { Child } from '../state/storage';
import { nextAction, UNITS } from './course';
import { recordRoundOnChild } from './progress';

// Walk a simulated child through the WHOLE course the way Continue leads them —
// read each lesson, play each step until it's done, pass each checkpoint — and
// fail if anything is a dead end: a step that can't be finished, a lesson or a
// checkpoint that doesn't open the way on, or Continue going round in circles.

function newChild(): Child {
  return {
    id: 'k',
    name: 'K',
    avatar: '🦊',
    level: 1,
    stars: 0,
    createdAt: 1,
    progress: {},
    srs: {},
    course: { lessonsSeen: {}, checkpoints: {} },
  } as Child;
}

/** Follow Continue until the open-ended Mestari unit; `score(n)` = right answers (of 6) in round n of a step. */
function walk(score: (round: number) => number) {
  let child = newChild();
  const rounds = new Map<string, number>();
  let actions = 0;
  for (;;) {
    if (++actions > 20000) throw new Error('Continue never reached the end');
    const a = nextAction(child);
    if (a.unit.id === 'mestari') break;
    if (a.kind === 'lesson') {
      expect(child.course?.lessonsSeen?.[a.lessonId], `lesson ${a.lessonId} offered twice`).toBeUndefined();
      child = { ...child, course: { ...child.course, lessonsSeen: { ...child.course?.lessonsSeen, [a.lessonId]: 1 } } };
      continue;
    }
    if (a.kind === 'checkpoint') {
      expect(child.course?.checkpoints?.[a.unit.id], `checkpoint ${a.unit.id} offered twice`).toBeUndefined();
      child = {
        ...child,
        course: { ...child.course, checkpoints: { ...child.course?.checkpoints, [a.unit.id]: { passedAt: 1, best: 1, attempts: 1 } } },
      };
      continue;
    }
    const key = `${a.unit.id}/${a.step.id}`;
    const n = (rounds.get(key) ?? 0) + 1;
    rounds.set(key, n);
    if (n > 40) throw new Error(`stuck on ${key}`);
    child = recordRoundOnChild(child, a.unit.id, a.step.id, score(n), 6, a.step.maxLevel ?? 4);
  }
  return { child, rounds };
}

describe('the whole course can be finished (no dead ends)', () => {
  it('a careful child (every answer right) reaches the last unit, every step in a few rounds', () => {
    const { rounds } = walk(() => 6);
    const courseSteps = UNITS.filter((u) => u.id !== 'mestari').flatMap((u) => u.skills.map((s) => `${u.id}/${s.id}`));
    for (const s of courseSteps) expect(rounds.get(s), s).toBeGreaterThan(0);
    // The longest climb at full marks: 2 + 2 + 3 + 3 rounds for a four-level step.
    expect(Math.max(...rounds.values())).toBeLessThanOrEqual(10);
  });

  it('a child who slips now and then (one miss every few rounds) still finishes everything', () => {
    // 6, 6, 5, 6, 6, 5…: about 94% — a realistic good day.
    const { rounds } = walk((n) => (n % 3 === 0 ? 5 : 6));
    expect(Math.max(...rounds.values())).toBeLessThanOrEqual(20);
  });
});
