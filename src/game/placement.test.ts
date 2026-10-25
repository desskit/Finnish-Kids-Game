import { describe, it, expect } from 'vitest';
import type { Child } from '../state/storage';
import { UNITS, nextAction, unitStatus, stepStatus, openerStoryId } from './course';
import { placeChildAt, currentPlace, placeKey, placeFromKey, type CoursePlace } from './placement';

const fresh = (): Child => ({
  id: 'k',
  name: 'K',
  avatar: '🦊',
  level: 1,
  stars: 7,
  createdAt: 1,
  progress: {},
  srs: { cat: { box: 3, due: 0, seen: 4, correct: 3 } },
  course: { lessonsSeen: {}, checkpoints: {} },
});

/** Every place a grown-up can pick, in course order. */
const everyPlace: CoursePlace[] = UNITS.flatMap((u) => [
  ...(openerStoryId(u) ? [{ unitId: u.id, target: { kind: 'start' as const } }] : []),
  ...u.skills.map((s) => ({ unitId: u.id, target: { kind: 'step' as const, stepId: s.id } })),
  ...(u.checkpoint !== false ? [{ unitId: u.id, target: { kind: 'checkpoint' as const } }] : []),
]);

describe('putting a player at an exact place in the course', () => {
  it('makes Continue open exactly that place — for every place in the course', () => {
    const wrong = everyPlace.filter((p) => placeKey(currentPlace(placeChildAt(fresh(), p))) !== placeKey(p)).map(placeKey);
    expect(wrong).toEqual([]);
  });

  it('opens that unit and step, and keeps the next unit shut until its checkpoint', () => {
    const unit = UNITS[4];
    const step = unit.skills[2];
    const kid = placeChildAt(fresh(), { unitId: unit.id, target: { kind: 'step', stepId: step.id } });
    expect(unitStatus(kid, unit)).toBe('open');
    expect(stepStatus(kid, unit, step)).toBe('open');
    expect(stepStatus(kid, unit, unit.skills[1])).toBe('done');
    expect(unitStatus(kid, UNITS[5])).toBe('locked');
    for (const u of UNITS.slice(0, 4)) expect(kid.course?.checkpoints?.[u.id]?.passedAt, u.id).toBeDefined();
  });

  it('moves a player back, clearing what came after, and keeps their words and stars', () => {
    const far = placeChildAt(fresh(), { unitId: UNITS[10].id, target: { kind: 'checkpoint' } });
    const back = placeChildAt(far, { unitId: UNITS[2].id, target: { kind: 'start' } });
    expect(nextAction(back)).toMatchObject({ kind: 'opener', unit: { id: UNITS[2].id } });
    for (const u of UNITS.slice(2, 11)) {
      expect(back.course?.checkpoints?.[u.id], u.id).toBeUndefined();
      expect(back.progress[u.id], u.id).toBeUndefined();
    }
    expect(back.stars).toBe(7);
    expect(back.srs.cat?.box).toBe(3);
  });

  it('turns a place into a picker value and back', () => {
    for (const p of everyPlace.slice(0, 12)) expect(placeFromKey(placeKey(p))).toEqual(p);
    expect(placeFromKey('nonsense')).toBeNull();
  });
});
