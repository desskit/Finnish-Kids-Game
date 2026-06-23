import { describe, it, expect } from 'vitest';
import {
  PATH,
  allSkills,
  findSkill,
  nextSkillId,
  renderSkill,
  activityForLevel,
  badgeEnv,
} from './path';

describe('learning path', () => {
  it('has unique skill ids across every chapter', () => {
    const ids = allSkills().map(({ skill }) => skill.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('finds a skill and the chapter it belongs to', () => {
    expect(findSkill('this-is')?.chapter.id).toBe('naming');
    expect(findSkill('nope')).toBeUndefined();
  });

  it('suggests the first warm-up as the next step for a new child', () => {
    expect(nextSkillId(null)).toBe('listen-animals');
  });

  it('renders a game element for every non-review skill at every level', () => {
    for (const { skill } of allSkills()) {
      for (const level of [1, 2, 3, 4]) {
        const el = renderSkill(skill, level, () => {});
        if (skill.activity === 'review') expect(el).toBeNull();
        else expect(el).not.toBeNull();
      }
    }
  });

  it('ramps the possession skill through input methods as the level rises', () => {
    const { skill } = findSkill('i-have')!;
    expect(activityForLevel(skill, 1)).toBe('build');
    expect(activityForLevel(skill, 2)).toBe('build');
    expect(activityForLevel(skill, 3)).toBe('order');
    expect(activityForLevel(skill, 4)).toBe('spell');
    expect(activityForLevel(skill, 99)).toBe('spell'); // holds at the last entry
  });

  it('falls back to the single fixed activity when a skill has no ramp', () => {
    const { skill } = findSkill('this-is')!;
    expect(activityForLevel(skill, 1)).toBe('build');
    expect(activityForLevel(skill, 4)).toBe('build');
  });

  it('derives the badge env from the path, excluding review', () => {
    expect(badgeEnv.topicCount).toBeGreaterThan(0);
    expect(badgeEnv.activityIds).toContain('this-is');
    expect(badgeEnv.activityIds).not.toContain('review');
  });

  it('ends with an empty, "coming soon" sentences chapter (plumbed, contentless)', () => {
    const last = PATH[PATH.length - 1];
    expect(last.id).toBe('sentences');
    expect(last.comingSoon).toBe(true);
    expect(last.skills).toHaveLength(0);
  });
});
