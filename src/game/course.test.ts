import { describe, it, expect } from 'vitest';
import type { Child } from '../state/storage';
import {
  UNITS,
  actionHref,
  checkpointPlan,
  inCheckpoint,
  MAX_CHECKPOINT_QUESTIONS,
  checkpointStatus,
  lessonAt,
  lessonForConstruction,
  lessonStatus,
  nextAction,
  notebookLessonIds,
  openerStatus,
  openerStoryId,
  stepAfterLesson,
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

  it('keeps a started unit open when a new unit is added before it', () => {
    // A child mid-way through unit 3 when a new unit 2 arrives: unit 3's
    // lesson is read, the new unit 2's checkpoint isn't passed.
    const c = child({ course: { checkpoints: passed(u1.id), lessonsSeen: { [u3.lessonId]: 1 } } });
    expect(unitStatus(c, u2)).toBe('open');
    expect(unitStatus(c, u3)).toBe('open');
    expect(stepStatus(c, u3, u3.skills[0])).toBe('open');
    // Continue leads to the new unit first: it's the first one not done.
    expect(nextAction(c)).toMatchObject({ kind: 'opener', unit: u2 });
    // A unit not started yet still waits for the checkpoint before it.
    expect(unitStatus(c, UNITS[3])).toBe('locked');
  });
});

describe('steps and checkpoints inside a unit', () => {
  it('hear it, use it, notice it: the opener opens the first step; the lesson, the rest', () => {
    const [first, second] = u1.skills;
    const fresh = child();
    expect(openerStatus(fresh, u1)).toBe('open');
    expect(stepStatus(fresh, u1, first)).toBe('locked');
    expect(lessonStatus(fresh, u1)).toBe('locked');
    const heard = child({ course: { openersHeard: { [u1.id]: 1 } } });
    expect(openerStatus(heard, u1)).toBe('done');
    expect(stepStatus(heard, u1, first)).toBe('open');
    // The lesson may be read any time now; the steps after the first wait for it.
    expect(lessonStatus(heard, u1)).toBe('open');
    expect(stepStatus(heard, u1, second)).toBe('locked');
    const read = child({ course: { openersHeard: { [u1.id]: 1 }, lessonsSeen: { [u1.lessonId]: 1 } } });
    expect(lessonStatus(read, u1)).toBe('done');
    expect(stepStatus(read, u1, second)).toBe('open');
  });

  it('every unit but the last two opens with a story, and the first step never needs the lesson', () => {
    for (const u of UNITS) {
      // Sentences has no story; Mestari is open-ended.
      if (u.id === 'mestari' || u.id === 'sentences') {
        expect(openerStoryId(u), u.id).toBeUndefined();
        continue;
      }
      expect(openerStoryId(u), u.id).toBeDefined();
      expect(lessonAt(u), u.id).toBe(1);
      const heard = child({ course: { openersHeard: { [u.id]: 1 } } });
      expect(stepStatus(heard, u, u.skills[0], false), u.id).not.toBe('locked');
    }
  });

  it('an older save that read the lesson first is never sent back to the opener', () => {
    const old = child({ course: { lessonsSeen: { [u1.lessonId]: 1 } } });
    expect(openerStatus(old, u1)).toBe('done');
    expect(nextAction(old)).toMatchObject({ kind: 'step', step: u1.skills[0] });
    for (const s of u1.skills) expect(stepStatus(old, u1, s)).toBe('open');
    // …nor is a child who has played a step (say, with "unlock all" on).
    const played = child({ progress: { [u2.id]: { [u2.skills[0].id]: prog(2) } }, course: { checkpoints: passed(u1.id) } });
    expect(openerStatus(played, u2)).toBe('done');
    expect(nextAction(played)).toMatchObject({ kind: 'step', step: u2.skills[0] });
  });

  it('after the lesson, practice picks up at the first unfinished step', () => {
    const fresh = child({ course: { openersHeard: { [u2.id]: 1 } } });
    expect(stepAfterLesson(u2.lessonId, fresh)?.id).toBe(u2.skills[0].id);
    const firstDone = child({
      course: { openersHeard: { [u2.id]: 1 } },
      progress: { [u2.id]: { [u2.skills[0].id]: { ...prog(4), topProvenAt: 1 } } },
    });
    expect(stepAfterLesson(u2.lessonId, firstDone)?.id).toBe(u2.skills[1].id);
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
      // Every step but a story (read at story pace, not tested).
      const tested = u.skills.filter(inCheckpoint);
      expect(tested.every((s) => s.activity !== 'story')).toBe(true);
      expect(own).toHaveLength(tested.length);
      own.forEach((p, i) => {
        const step = tested[i];
        // A Kertaus step contributes one of its EARLIER steps instead.
        if (step.content.mixOf) expect(step.content.mixOf).toContain(p.step.id);
        else expect(p.step.id).toBe(step.id);
      });
      expect(plan.reduce((n, p) => n + p.questions, 0)).toBeGreaterThanOrEqual(8);
      expect(plan.reduce((n, p) => n + p.questions, 0)).toBeLessThanOrEqual(MAX_CHECKPOINT_QUESTIONS);
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
  it("starts a new child on unit 1's story, heard before any practice", () => {
    const a = nextAction(child());
    expect(a.kind).toBe('opener');
    expect(a.unit.id).toBe(u1.id);
    expect(actionHref(a)).toBe(`/opener/${u1.id}`);
  });

  it('moves opener → first step → lesson → next unfinished step → checkpoint → next unit', () => {
    const heard = child({ course: { openersHeard: { [u1.id]: 1 } } });
    const a = nextAction(heard);
    expect(a.kind === 'step' && a.step.id).toBe(u1.skills[0].id);

    const firstDone = child({
      course: { openersHeard: { [u1.id]: 1 } },
      progress: { [u1.id]: { [u1.skills[0].id]: { ...prog(3), topProvenAt: 1 } } },
    });
    expect(nextAction(firstDone)).toMatchObject({ kind: 'lesson', lessonId: u1.lessonId });
    const read = child({ ...firstDone, course: { ...firstDone.course, lessonsSeen: { [u1.lessonId]: 1 } } });
    expect(nextAction(read)).toMatchObject({ kind: 'step', step: u1.skills[1] });

    const stepsDone = child({ course: { lessonsSeen: { [u1.lessonId]: 1 } }, progress: allDone(u1) });
    expect(nextAction(stepsDone).kind).toBe('checkpoint');
    expect(actionHref(nextAction(stepsDone))).toBe(`/checkpoint/${u1.id}`);

    const unitDone = child({
      course: { lessonsSeen: { [u1.lessonId]: 1 }, checkpoints: passed(u1.id) },
      progress: allDone(u1),
    });
    const n = nextAction(unitDone);
    expect(n.kind).toBe('opener');
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
