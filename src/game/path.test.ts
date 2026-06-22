import { describe, it, expect } from 'vitest';
import { PATH, allSkills, findSkill, nextSkillId, renderSkill, badgeEnv } from './path';

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

  it('renders a game element for every non-review skill', () => {
    for (const { skill } of allSkills()) {
      const el = renderSkill(skill, () => {});
      if (skill.activity === 'review') expect(el).toBeNull();
      else expect(el).not.toBeNull();
    }
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
