// A grown-up puts a player at an exact place in the course (Grown-ups →
// Players): to test, or to carry on after lost data or on a new device.
// Everything before the place is recorded as done the way play would record
// it — checkpoints passed, opening stories heard, lessons read, steps finished,
// bonus steps offered — and everything from the place on is cleared, so a
// player can be moved back as well as forward. Words, stars, badges and stats
// are left as they are. Pure.

import type { ActivityProgress, Child, CourseState } from '../state/storage';
import { lessonAt, nextAction, UNITS, type Unit } from './course';

/** Where in a unit: its very start (the opening story), a step, or its checkpoint. */
export type PlaceTarget = { kind: 'start' } | { kind: 'step'; stepId: string } | { kind: 'checkpoint' };

export interface CoursePlace {
  unitId: string;
  target: PlaceTarget;
}

/** A step finished at its top level, as play records it. */
const finished = (step: Unit['skills'][number], now: number): ActivityProgress => ({
  plays: 0,
  bestStars: 0,
  totalStars: 0,
  totalPossible: 0,
  lastPlayed: now,
  level: step.maxLevel ?? 4,
  recent: [],
  topProvenAt: now,
});

/** The unit's own lessons: its main one and its part-way ones. */
const lessonsOf = (unit: Unit) => [unit.lessonId, ...(unit.midLessons ?? []).map((m) => m.lessonId)];

const without = <T>(rec: Record<string, T> | undefined, keys: readonly string[]) => {
  const out = { ...(rec ?? {}) };
  for (const k of keys) delete out[k];
  return out;
};

/** The player put at `place`: everything before it done, everything after it fresh. */
export function placeChildAt(child: Child, place: CoursePlace, now = Date.now()): Child {
  const at = UNITS.findIndex((u) => u.id === place.unitId);
  if (at < 0) return child;
  const progress = { ...child.progress };
  const course: CourseState = { ...(child.course ?? {}) };
  let checkpoints = { ...(course.checkpoints ?? {}) };
  let lessonsSeen = { ...(course.lessonsSeen ?? {}) };
  let openersHeard = { ...(course.openersHeard ?? {}) };
  let extrasSeen = { ...(course.extrasSeen ?? {}) };

  UNITS.forEach((unit, i) => {
    const stepIds = unit.skills.map((s) => s.id);
    if (i < at) {
      // Before the place: the whole unit done.
      progress[unit.id] = Object.fromEntries(
        unit.skills.map((s) => [s.id, progress[unit.id]?.[s.id]?.topProvenAt ? progress[unit.id][s.id] : finished(s, now)]),
      );
      if (unit.checkpoint !== false) checkpoints[unit.id] = checkpoints[unit.id]?.passedAt ? checkpoints[unit.id] : { passedAt: now, best: 1, attempts: 1 };
      openersHeard[unit.id] = openersHeard[unit.id] ?? now;
      for (const l of lessonsOf(unit)) lessonsSeen[l] = lessonsSeen[l] ?? now;
      for (const s of unit.skills.filter((x) => x.optional)) extrasSeen[s.id] = extrasSeen[s.id] ?? now;
      return;
    }
    if (i > at) {
      // After the place: the whole unit fresh.
      delete progress[unit.id];
      checkpoints = without(checkpoints, [unit.id]);
      openersHeard = without(openersHeard, [unit.id]);
      lessonsSeen = without(lessonsSeen, lessonsOf(unit));
      extrasSeen = without(extrasSeen, stepIds);
      return;
    }
    // The unit itself: done up to the place, fresh from it.
    const t = place.target;
    const upTo = t.kind === 'start' ? 0 : t.kind === 'checkpoint' ? unit.skills.length : Math.max(0, stepIds.indexOf(t.stepId));
    const before = unit.skills.slice(0, upTo);
    const from = unit.skills.slice(upTo);
    progress[unit.id] = Object.fromEntries(before.map((s) => [s.id, finished(s, now)]));
    if (Object.keys(progress[unit.id]).length === 0) delete progress[unit.id];
    checkpoints = without(checkpoints, [unit.id]);
    if (t.kind === 'start') openersHeard = without(openersHeard, [unit.id]);
    else openersHeard[unit.id] = openersHeard[unit.id] ?? now;
    // A lesson placed at or before the place is read; one further on is not.
    const mainRead = t.kind !== 'start' && upTo >= lessonAt(unit);
    lessonsSeen = mainRead ? { ...lessonsSeen, [unit.lessonId]: lessonsSeen[unit.lessonId] ?? now } : without(lessonsSeen, [unit.lessonId]);
    for (const ml of unit.midLessons ?? []) {
      const pos = stepIds.indexOf(ml.before);
      lessonsSeen = mainRead && pos >= 0 && pos <= upTo ? { ...lessonsSeen, [ml.lessonId]: lessonsSeen[ml.lessonId] ?? now } : without(lessonsSeen, [ml.lessonId]);
    }
    for (const s of before.filter((x) => x.optional)) extrasSeen[s.id] = extrasSeen[s.id] ?? now;
    extrasSeen = without(extrasSeen, from.map((s) => s.id));
  });

  return { ...child, progress, course: { ...course, checkpoints, lessonsSeen, openersHeard, extrasSeen } };
}

/** Where the player is now, as a place (what Continue would open). */
export function currentPlace(child: Child | null | undefined): CoursePlace {
  const a = nextAction(child);
  if (a.kind === 'step') return { unitId: a.unit.id, target: { kind: 'step', stepId: a.step.id } };
  if (a.kind === 'checkpoint') return { unitId: a.unit.id, target: { kind: 'checkpoint' } };
  if (a.kind === 'opener') return { unitId: a.unit.id, target: { kind: 'start' } };
  // A lesson comes just before a step: the place is that step.
  const unit = a.unit;
  const ml = unit.midLessons?.find((m) => m.lessonId === a.lessonId);
  const stepId = ml?.before ?? unit.skills[lessonAt(unit)]?.id ?? unit.skills[0]?.id;
  return stepId ? { unitId: unit.id, target: { kind: 'step', stepId } } : { unitId: unit.id, target: { kind: 'start' } };
}

/** A place as one string (for a picker), and back. */
export const placeKey = (p: CoursePlace) =>
  `${p.unitId}|${p.target.kind === 'step' ? `step:${p.target.stepId}` : p.target.kind}`;
export function placeFromKey(key: string): CoursePlace | null {
  const [unitId, t] = key.split('|');
  if (!unitId || !t) return null;
  if (t === 'start' || t === 'checkpoint') return { unitId, target: { kind: t } };
  if (t.startsWith('step:')) return { unitId, target: { kind: 'step', stepId: t.slice(5) } };
  return null;
}
