import { describe, it, expect } from 'vitest';
import { CAN_DO, canDoAchieved, canDoSummary } from './cando';
import { PATH } from './path';
import type { Child } from '../state/storage';

const prog = (level: number) => ({
  plays: 3,
  bestStars: 5,
  totalStars: 12,
  totalPossible: 15,
  lastPlayed: 1,
  level,
  recent: [0.9],
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

describe('can-do statements', () => {
  it('every requirement points at a REAL unit, or a real step within its own ladder', () => {
    for (const s of CAN_DO) {
      for (const r of s.requires) {
        if ('unitId' in r) {
          const unit = PATH.find((u) => u.id === r.unitId);
          expect(unit, `${s.id}: unit ${r.unitId}`).toBeTruthy();
          expect(unit!.checkpoint, `${s.id}: unit has a checkpoint`).not.toBe(false);
          continue;
        }
        const unit = PATH.find((c) => c.id === r.chapterId);
        expect(unit, `${s.id}: unit ${r.chapterId}`).toBeTruthy();
        const step = unit!.skills.find((sk) => sk.id === r.skillId);
        expect(step, `${s.id}: step ${r.skillId}`).toBeTruthy();
        expect(r.level).toBeLessThanOrEqual(step!.maxLevel ?? 4);
      }
    }
  });

  it('claims every unit that has a checkpoint', () => {
    for (const unit of PATH.filter((u) => u.checkpoint !== false)) {
      expect(
        CAN_DO.some((s) => s.requires.some((r) => 'unitId' in r && r.unitId === unit.id)),
        unit.id,
      ).toBe(true);
    }
  });

  it('a fresh child has achieved nothing — everything is up next', () => {
    const { achieved, upNext } = canDoSummary(child());
    expect(achieved).toHaveLength(0);
    expect(upNext).toHaveLength(CAN_DO.length);
  });

  it('a unit claim flips when its checkpoint is passed — an attempt alone is not enough', () => {
    const greet = CAN_DO.find((s) => s.id === 'hello')!;
    expect(
      canDoAchieved(child({ course: { checkpoints: { 'hello': { best: 0.5, attempts: 1 } } } }), greet),
    ).toBe(false);
    expect(
      canDoAchieved(
        child({ course: { checkpoints: { 'hello': { passedAt: 1, best: 0.9, attempts: 2 } } } }),
        greet,
      ),
    ).toBe(true);
  });

  it('an expert claim flips at its step level, not before', () => {
    const tenses = CAN_DO.find((s) => s.id === 'verb-tenses')!;
    expect(canDoAchieved(child({ progress: { 'mestari': { 'verbs-expert': prog(7) } } }), tenses)).toBe(false);
    expect(canDoAchieved(child({ progress: { 'mestari': { 'verbs-expert': prog(8) } } }), tenses)).toBe(true);
  });

  it('splits achieved / up next in authored order', () => {
    const c = child({
      course: { checkpoints: { 'people': { passedAt: 1, best: 1, attempts: 1 } } },
    });
    const { achieved, upNext } = canDoSummary(c);
    expect(achieved.map((s) => s.id)).toEqual(['people']);
    expect(upNext[0].id).toBe('hello');
  });
});
