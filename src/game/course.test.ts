import { describe, it, expect } from 'vitest';
import type { Child } from '../state/storage';
import {
  UNITS,
  actionHref,
  checkpointPlan,
  checkpointStatus,
  lessonForConstruction,
  nextAction,
  notebookLessonIds,
  stepStatus,
  unitStatus,
  unitsCompleted,
} from './course';

const prog = (level: number) => ({
  plays: 3,
  bestStars: 6,
  totalStars: 18,
  totalPossible: 18,
  lastPlayed: 1,
  level,
  recent: [],
});

function child(over: Partial<Child> = {}): Child {
  return {
    id: 'k',
    name: 'K',
    avatar: '🦊',
    level: 1,
    stars: 0,
    createdAt: 1,
    progress: {},
    srs: {},
    ...over,
  } as Child;
}

const [u1, u2, u3] = UNITS;
const passed = (...ids: string[]) =>
  Object.fromEntries(ids.map((id) => [id, { passedAt: 1, best: 1, attempts: 1 }]));
/** Every step of a unit with its top level proven. */
const allDone = (unit: (typeof UNITS)[number]) => ({
  [unit.id]: Object.fromEntries(
    unit.skills.map((s) => [s.id, { ...prog(s.maxLevel ?? 4), topProvenAt: 1 }]),
  ),
});

describe('unit unlocking', () => {
  it('opens unit 1 for a brand-new child and locks the rest', () => {
    const c = child();
    expect(unitStatus(c, u1)).toBe('open');
    expect(unitStatus(c, u2)).toBe('locked');
    expect(unitStatus(c, UNITS[UNITS.length - 1])).toBe('locked');
  });

  it("opens the next unit only once the previous unit's checkpoint is passed", () => {
    const attempted = child({ course: { checkpoints: { [u1.id]: { best: 0.5, attempts: 1 } } } });
    expect(unitStatus(attempted, u2)).toBe('locked');
    const c = child({ course: { checkpoints: passed(u1.id) } });
    expect(unitStatus(c, u1)).toBe('done');
    expect(unitStatus(c, u2)).toBe('open');
    expect(unitStatus(c, u3)).toBe('locked');
  });

  it('opens everything for a grown-up "unlock all"', () => {
    for (const u of UNITS) expect(unitStatus(child(), u, true)).not.toBe('locked');
  });
});

describe('steps and checkpoints inside a unit', () => {
  it('keeps practice locked until the lesson has been read', () => {
    const s = u1.skills[0];
    expect(stepStatus(child(), u1, s)).toBe('locked');
    const read = child({ course: { lessonsSeen: { [u1.lessonId]: 1 } } });
    expect(stepStatus(read, u1, s)).toBe('open');
  });

  it('marks a step done only once its TOP level is proven — reaching it is not enough', () => {
    const s = u1.skills[0];
    const read = { lessonsSeen: { [u1.lessonId]: 1 } };
    const top = s.maxLevel ?? 4;
    const atTop = child({ course: read, progress: { [u1.id]: { [s.id]: prog(top) } } });
    expect(stepStatus(atTop, u1, s)).toBe('open');
    const provenTop = child({
      course: read,
      progress: { [u1.id]: { [s.id]: { ...prog(top), topProvenAt: 1 } } },
    });
    expect(stepStatus(provenTop, u1, s)).toBe('done');
  });

  it('opens the checkpoint only when every step is done', () => {
    const some = child({
      course: { lessonsSeen: { [u1.lessonId]: 1 } },
      progress: { [u1.id]: { [u1.skills[0].id]: { ...prog(3), topProvenAt: 1 } } },
    });
    expect(checkpointStatus(some, u1)).toBe('locked');
    const all = child({ course: { lessonsSeen: { [u1.lessonId]: 1 } }, progress: allDone(u1) });
    expect(checkpointStatus(all, u1)).toBe('open');
  });

  it('plans a checkpoint of ≥ 8 questions: every step, then (from unit 3) a "Muistatko?" part', () => {
    UNITS.forEach((u, ui) => {
      if (u.checkpoint === false) return;
      const plan = checkpointPlan(u);
      const own = plan.filter((p) => p.kind === 'step');
      expect(own).toHaveLength(u.skills.length);
      own.forEach((p, i) => {
        const step = u.skills[i];
        // A Kertaus step contributes one of its EARLIER steps instead.
        if (step.content.mixOf) expect(step.content.mixOf).toContain(p.step.id);
        else expect(p.step.id).toBe(step.id);
      });
      expect(plan.reduce((n, p) => n + p.questions, 0)).toBeGreaterThanOrEqual(8);
      // Asked at each step's TOP level — what the child proved.
      for (const p of plan) expect(p.level).toBe(p.step.maxLevel ?? 4);
      const remember = plan.filter((p) => p.kind === 'remember');
      expect(remember.length).toBe(ui >= 2 ? 1 : 0);
      for (const r of remember) {
        // From an EARLIER unit.
        const from = UNITS.findIndex((x) => x.skills.some((s) => s.id === r.step.id));
        expect(from).toBeLessThan(ui);
      }
    });
    expect(checkpointPlan(UNITS[UNITS.length - 1])).toEqual([]);
  });

  it('asks phrase steps for an ASSEMBLY question in the checkpoint', () => {
    const people = UNITS.find((u) => u.id === 'people')!;
    const part = checkpointPlan(people).find((p) => p.step.id === 'this-is')!;
    expect(part.activity).toBe('order');
    const words = checkpointPlan(people).find((p) => p.step.id === 'people-words')!;
    expect(words.activity).toBe('name');
  });

  it('varies the review parts by attempt, deterministically', () => {
    const many = UNITS.find((u) => u.id === 'many')!;
    const ids = (attempt: number) => checkpointPlan(many, attempt).map((p) => p.step.id).join(',');
    expect(ids(0)).toBe(ids(0));
    expect(new Set([0, 1, 2, 3].map(ids)).size).toBeGreaterThan(1);
  });
});

describe('Continue (nextAction)', () => {
  it('starts a new child on the first lesson', () => {
    const a = nextAction(child());
    expect(a.kind).toBe('lesson');
    expect(a.unit.id).toBe(u1.id);
    expect(actionHref(a)).toBe(`/lesson/${u1.lessonId}`);
  });

  it('moves lesson → first unfinished step → checkpoint → next unit', () => {
    const read = child({ course: { lessonsSeen: { [u1.lessonId]: 1 } } });
    const a = nextAction(read);
    expect(a.kind === 'step' && a.step.id).toBe(u1.skills[0].id);

    const stepsDone = child({ course: { lessonsSeen: { [u1.lessonId]: 1 } }, progress: allDone(u1) });
    expect(nextAction(stepsDone).kind).toBe('checkpoint');
    expect(actionHref(nextAction(stepsDone))).toBe(`/checkpoint/${u1.id}`);

    const unitDone = child({
      course: { lessonsSeen: { [u1.lessonId]: 1 }, checkpoints: passed(u1.id) },
      progress: allDone(u1),
    });
    const n = nextAction(unitDone);
    expect(n.kind).toBe('lesson');
    expect(n.unit.id).toBe(u2.id);
    expect(unitsCompleted(unitDone)).toBe(1);
  });

  it('points into Mestari once every checkpoint is passed', () => {
    const ids = UNITS.filter((u) => u.checkpoint !== false).map((u) => u.id);
    const last = UNITS[UNITS.length - 1];
    const c = child({
      course: {
        checkpoints: passed(...ids),
        lessonsSeen: Object.fromEntries(UNITS.map((u) => [u.lessonId, 1])),
      },
    });
    const a = nextAction(c);
    expect(a.unit.id).toBe(last.id);
    expect(a.kind).toBe('step');
  });
});

describe('lessons ↔ units', () => {
  it('maps a construction to the first unit that drills it', () => {
    expect(lessonForConstruction('this-is')).toBe('no-articles');
    expect(lessonForConstruction('in-it')).toBe('in-on');
    expect(lessonForConstruction('into-it')).toBe('into-out');
  });

  it("shows only open units' lessons in the Notebook", () => {
    expect(notebookLessonIds(child())).toEqual([u1.lessonId]);
    expect(notebookLessonIds(child({ course: { checkpoints: passed(u1.id) } }))).toEqual([
      u1.lessonId,
      u2.lessonId,
    ]);
    const midLessons = UNITS.reduce((n, u) => n + (u.midLessons?.length ?? 0), 0);
    expect(notebookLessonIds(child(), true)).toHaveLength(UNITS.length + midLessons);
  });
});
