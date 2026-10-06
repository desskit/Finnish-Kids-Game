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

function child(progress: Child['progress'] = {}): Child {
  return {
    id: 'k',
    name: 'K',
    avatar: '🦊',
    level: 1,
    stars: 0,
    createdAt: 1,
    progress,
    srs: {},
  } as Child;
}

describe('can-do statements (E-17)', () => {
  it('every requirement points at a REAL chapter + skill on the path', () => {
    for (const s of CAN_DO) {
      for (const r of s.requires) {
        const chapter = PATH.find((c) => c.id === r.chapterId);
        expect(chapter, `${s.id}: chapter ${r.chapterId}`).toBeTruthy();
        const skill = chapter!.skills.find((sk) => sk.id === r.skillId);
        expect(skill, `${s.id}: skill ${r.skillId}`).toBeTruthy();
        // A bar above the node's own ladder could never be reached.
        expect(
          r.level,
          `${s.id}: level ${r.level} exceeds ${r.skillId}'s max`,
        ).toBeLessThanOrEqual(skill!.maxLevel ?? 4);
      }
    }
  });

  it('a fresh child has achieved nothing — everything is up next', () => {
    const { achieved, upNext } = canDoSummary(child());
    expect(achieved).toHaveLength(0);
    expect(upNext).toHaveLength(CAN_DO.length);
  });

  it('a single-node statement flips when its level is reached, not before', () => {
    const greet = CAN_DO.find((s) => s.id === 'greet')!;
    expect(canDoAchieved(child({ conversations: { greetings: prog(2) } }), greet)).toBe(false);
    expect(canDoAchieved(child({ conversations: { greetings: prog(3) } }), greet)).toBe(true);
  });

  it("an 'all' statement needs every node, not just one", () => {
    const likes = CAN_DO.find((s) => s.id === 'likes')!;
    expect(canDoAchieved(child({ likes: { 'i-like': prog(3) } }), likes)).toBe(false);
    expect(
      canDoAchieved(child({ likes: { 'i-like': prog(3), 'i-see': prog(3) } }), likes),
    ).toBe(true);
  });

  it("an 'any' statement needs just one qualifying node", () => {
    const name = CAN_DO.find((s) => s.id === 'name-things')!;
    expect(canDoAchieved(child({ 'first-words': { 'listen-nature': prog(3) } }), name)).toBe(true);
    expect(canDoAchieved(child({ 'first-words': { 'listen-nature': prog(2) } }), name)).toBe(false);
  });

  it("a 'count' statement needs the stated number of themes", () => {
    const first = CAN_DO.find((s) => s.id === 'first-words')!;
    expect(canDoAchieved(child({ 'first-words': { 'listen-animals': prog(2) } }), first)).toBe(
      false,
    );
    expect(
      canDoAchieved(
        child({ 'first-words': { 'listen-animals': prog(2), 'listen-food': prog(2) } }),
        first,
      ),
    ).toBe(true);
  });

  it('counting claims track the adaptive engine: L3 → to 10, L8 → to 20', () => {
    const c10 = CAN_DO.find((s) => s.id === 'count-10')!;
    const c20 = CAN_DO.find((s) => s.id === 'count-20')!;
    const atL3 = child({ 'numbers-describe': { count: prog(3) } });
    expect(canDoAchieved(atL3, c10)).toBe(true);
    expect(canDoAchieved(atL3, c20)).toBe(false);
    const atL8 = child({ 'numbers-describe': { count: prog(8) } });
    expect(canDoAchieved(atL8, c20)).toBe(true);
  });

  it('summary preserves authored order within both halves', () => {
    const c = child({
      conversations: { greetings: prog(3) },
      'numbers-describe': { count: prog(3) },
    });
    const { achieved } = canDoSummary(c);
    expect(achieved.map((s) => s.id)).toEqual(['greet', 'count-10']);
  });
});
