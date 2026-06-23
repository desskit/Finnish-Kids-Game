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
      // Cover the engine's full depth so deep nodes (up to maxLevel 8) render too.
      for (const level of [1, 2, 3, 4, 5, 6, 7, 8]) {
        const el = renderSkill(skill, level, () => {});
        if (skill.activity === 'review') expect(el).toBeNull();
        else expect(el).not.toBeNull();
      }
    }
  });

  it('hands every game referentially-stable content props across re-renders', () => {
    // renderSkill runs on EVERY ActivityRoute render (e.g. each star-earning
    // tap). The activities memoize their round on the `items`/`constructions`
    // props, so a fresh array each render would silently rebuild the round
    // mid-question — a different word/emoji + its TTS flashing before reverting.
    // Two calls for the same (skill, level) must return identical references.
    for (const { skill } of allSkills()) {
      if (skill.activity === 'review') continue;
      for (const level of [1, 4, 8]) {
        const a = renderSkill(skill, level, () => {});
        const b = renderSkill(skill, level, () => {});
        const pa = a!.props as { items?: unknown; constructions?: unknown };
        const pb = b!.props as { items?: unknown; constructions?: unknown };
        expect(pa.items, `${skill.id} items unstable`).toBe(pb.items);
        expect(pa.constructions, `${skill.id} constructions unstable`).toBe(pb.constructions);
      }
    }
  });

  it('ramps the possession skill through input methods across its depth-6 ladder', () => {
    const { skill } = findSkill('i-have')!;
    expect(skill.maxLevel).toBe(6);
    // recognize (build) → assemble the partitive-plural phrases (order) → type
    // the inflected form (spell). The apex grammar reaches the player via order.
    expect(activityForLevel(skill, 1)).toBe('build');
    expect(activityForLevel(skill, 2)).toBe('build');
    expect(activityForLevel(skill, 3)).toBe('build');
    expect(activityForLevel(skill, 4)).toBe('order');
    expect(activityForLevel(skill, 5)).toBe('order');
    expect(activityForLevel(skill, 6)).toBe('spell');
    expect(activityForLevel(skill, 99)).toBe('spell'); // holds at the last entry
  });

  it('gives the locative node a depth-8 ramp ending in typing the inflected form', () => {
    const { skill } = findSkill('locatives')!;
    expect(skill.maxLevel).toBe(8);
    expect(skill.content.pool).toBe('places');
    expect(activityForLevel(skill, 1)).toBe('build');
    expect(activityForLevel(skill, 4)).toBe('order');
    expect(activityForLevel(skill, 7)).toBe('spell');
    expect(activityForLevel(skill, 8)).toBe('spell');
  });

  it('ramps the shallow single-case nodes recognize → assemble → type at depth 4', () => {
    const { skill } = findSkill('this-is')!;
    expect(skill.maxLevel).toBe(4);
    expect(activityForLevel(skill, 1)).toBe('build');
    expect(activityForLevel(skill, 3)).toBe('order');
    expect(activityForLevel(skill, 4)).toBe('spell');
    expect(activityForLevel(skill, 99)).toBe('spell');
  });

  it('caps the conjugation node at depth 4, swapping into a second game at the apex', () => {
    const { skill } = findSkill('conjugate')!;
    expect(skill.maxLevel).toBe(4);
    // The kid keyboard has no space key, so multi-word negatives ("en syö")
    // can't be a typing apex — verb conjugation stays recognition through
    // L1-3, then L4 swaps to `match` as this node's "different game" step.
    expect(activityForLevel(skill, 1)).toBe('conjugate');
    expect(activityForLevel(skill, 3)).toBe('conjugate');
    expect(activityForLevel(skill, 4)).toBe('match');
    expect(activityForLevel(skill, 8)).toBe('match');
  });

  it('gives every listening warm-up a third-level swap into Describe it', () => {
    for (const id of ['listen-animals', 'listen-food', 'listen-family', 'listen-numbers']) {
      const { skill } = findSkill(id)!;
      expect(activityForLevel(skill, 1)).toBe('listen');
      expect(activityForLevel(skill, 2)).toBe('listen');
      expect(activityForLevel(skill, 3)).toBe('match');
    }
  });

  it('ramps postpositions recognize → assemble → type, same as the other shallow nodes', () => {
    const { skill } = findSkill('postpositions')!;
    expect(skill.maxLevel).toBe(4);
    expect(activityForLevel(skill, 1)).toBe('build');
    expect(activityForLevel(skill, 3)).toBe('order');
    expect(activityForLevel(skill, 4)).toBe('spell');
  });

  it('lets Count & Say diversify into build/order/spell once the counts have grown', () => {
    const { skill } = findSkill('count')!;
    expect(skill.maxLevel).toBe(8);
    expect(activityForLevel(skill, 1)).toBe('count');
    expect(activityForLevel(skill, 5)).toBe('count');
    expect(activityForLevel(skill, 6)).toBe('build');
    expect(activityForLevel(skill, 7)).toBe('order');
    expect(activityForLevel(skill, 8)).toBe('spell');
  });

  it('lets Describe it diversify into build/order at the top of its depth-4 ladder', () => {
    const { skill } = findSkill('match')!;
    expect(skill.maxLevel).toBe(4);
    expect(activityForLevel(skill, 1)).toBe('match');
    expect(activityForLevel(skill, 2)).toBe('match');
    expect(activityForLevel(skill, 3)).toBe('build');
    expect(activityForLevel(skill, 4)).toBe('order');
  });

  it('makes the "put it together" nodes full-depth cross-cutting capstones', () => {
    const order = findSkill('order')!.skill;
    const spell = findSkill('spell')!.skill;
    // Both ride the full engine depth, tier-gated within one activity (no ramp).
    expect(order.maxLevel).toBe(8);
    expect(activityForLevel(order, 1)).toBe('order');
    expect(activityForLevel(order, 8)).toBe('order');
    // Spelling is the production capstone: it types sourced inflected forms.
    expect(spell.maxLevel).toBe(8);
    expect(spell.content.inflected).toBe(true);
    expect(activityForLevel(spell, 1)).toBe('spell');
    expect(activityForLevel(spell, 8)).toBe('spell');
  });

  it('derives the badge env from the path, excluding review', () => {
    expect(badgeEnv.topicCount).toBeGreaterThan(0);
    expect(badgeEnv.activityIds).toContain('this-is');
    expect(badgeEnv.activityIds).not.toContain('review');
  });

  it('caps the listening warm-ups at depth 3 (the option-tile curve flattens by then)', () => {
    for (const id of ['listen-animals', 'listen-food', 'listen-family', 'listen-numbers']) {
      expect(findSkill(id)?.skill.maxLevel).toBe(3);
    }
  });

  it('lets Count & Say ride the full engine depth (bigger counts all the way to 20)', () => {
    expect(findSkill('count')?.skill.maxLevel).toBe(8);
  });

  it('caps Describe it and Conjugate the Verb at the default depth (no further sourced grammar)', () => {
    expect(findSkill('match')?.skill.maxLevel).toBe(4);
    expect(findSkill('conjugate')?.skill.maxLevel).toBe(4);
  });

  it('ends with a live "Full sentences" chapter — one depth-8 capstone node', () => {
    const last = PATH[PATH.length - 1];
    expect(last.id).toBe('sentences');
    // Now that templates are authored, the chapter is live (not "coming soon")
    // and collapses to a SINGLE cross-cutting node, not one node per template.
    expect(last.comingSoon).toBeFalsy();
    expect(last.skills).toHaveLength(1);
    const node = last.skills[0];
    expect(node.id).toBe('full-sentences');
    expect(node.activity).toBe('sentence');
    expect(node.maxLevel).toBe(8);
  });
});
