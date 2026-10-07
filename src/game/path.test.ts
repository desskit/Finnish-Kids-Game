import { describe, it, expect } from 'vitest';
import {
  PATH,
  allSkills,
  findSkill,
  knownWordsThrough,
  renderSkill,
  renderActivity,
  activitiesUpTo,
  activityForRound,
  isSpeakable,
  isMixable,
  mixStepFor,
  badgeEnv,
} from './path';
import { nounConstructions } from '../content/constructions';
import { dialogues } from '../content/dialogues';
import { conversations } from '../content/conversations';
import { stories } from '../content/stories';
import { lessonById } from '../content/lessons';
import { ITEM_BY_ID } from '../content/lookup';

const constructionIds = new Set(nounConstructions.map((c) => c.id));

describe('the course (units × steps)', () => {
  it('is twenty-four units in order, ending with the open-ended Mestari unit', () => {
    expect(PATH).toHaveLength(24);
    expect(PATH[0].id).toBe('hello');
    // Semantic ids (no unit numbers), so inserting a unit never renames one.
    for (const u of PATH) expect(u.id, u.id).not.toMatch(/^u\d+-/);
    const last = PATH[PATH.length - 1];
    expect(last.id).toBe('mestari');
    expect(last.checkpoint).toBe(false);
    // Every other unit has a checkpoint (default shape).
    for (const u of PATH.slice(0, -1)) expect(u.checkpoint, u.id).not.toBe(false);
  });

  it('has unique unit ids and unique step ids across the whole course', () => {
    const units = PATH.map((u) => u.id);
    expect(new Set(units).size).toBe(units.length);
    const steps = allSkills().map(({ skill }) => skill.id);
    expect(new Set(steps).size).toBe(steps.length);
  });

  it('gives every unit a real lesson (each lesson used once) and at least one step', () => {
    const lessonIds = PATH.map((u) => u.lessonId);
    expect(new Set(lessonIds).size).toBe(lessonIds.length);
    for (const u of PATH) {
      expect(lessonById[u.lessonId], `${u.id}: lesson ${u.lessonId}`).toBeTruthy();
      expect(u.skills.length, u.id).toBeGreaterThan(0);
      expect(u.blurbEn, u.id).toBeTruthy();
    }
  });

  it('introduces only real words, each in exactly one unit', () => {
    const seen = new Map<string, string>();
    for (const u of PATH) {
      for (const w of u.newWords) {
        expect(ITEM_BY_ID[w], `${u.id}: word ${w}`).toBeTruthy();
        expect(seen.has(w), `${w} introduced in ${seen.get(w)} AND ${u.id}`).toBe(false);
        seen.set(w, u.id);
      }
    }
  });

  it('starts with real-life words, not a wall of animals and body parts', () => {
    // The overhaul's point: the first nouns are people and things at school.
    const first = PATH.find((u) => u.newWords.length > 0)!;
    const topics = new Set(first.newWords.map((w) => ITEM_BY_ID[w].topic));
    expect(topics).toEqual(new Set(['family', 'school']));
    // No body-part vocabulary anywhere in the course units.
    for (const u of PATH) {
      for (const w of u.newWords) expect(ITEM_BY_ID[w].topic, w).not.toBe('body');
    }
  });

  it('accumulates known words unit by unit', () => {
    let prev = 0;
    PATH.forEach((u, i) => {
      const known = knownWordsThrough(i);
      expect(known.length).toBe(prev + u.newWords.length);
      for (const w of u.newWords) expect(known).toContain(w);
      prev = known.length;
    });
  });

  it("scopes each step's words: 'new' = its unit's words, default = everything met so far", () => {
    PATH.forEach((u, i) => {
      for (const s of u.skills) {
        const scope = s.content.words ?? 'known';
        if (scope === 'new') expect(s.content.wordIds, s.id).toEqual(u.newWords);
        else if (scope === 'known') expect(s.content.wordIds, s.id).toEqual(knownWordsThrough(i));
        else expect(s.content.wordIds, s.id).toBeUndefined();
      }
    });
  });

  it('only references real constructions and registry ids', () => {
    const registries: Record<string, Set<string>> = {
      dialogue: new Set(dialogues.map((d) => d.id)),
      conversation: new Set(conversations.map((c) => c.id)),
      story: new Set(stories.map((s) => s.id)),
    };
    for (const { skill } of allSkills()) {
      for (const c of skill.content.constructionIds ?? []) {
        expect(constructionIds.has(c), `${skill.id}: construction ${c}`).toBe(true);
      }
      for (const id of skill.content.ids ?? []) {
        expect(registries[skill.activity]?.has(id), `${skill.id}: ${skill.activity} ${id}`).toBe(true);
      }
    }
  });

  it("pins units 1–19 to every tier (their grammar is already scoped); leaves Mestari's ladders free", () => {
    for (const u of PATH) {
      for (const s of u.skills) {
        if (u.unpinned) expect(s.pin?.maxTier, s.id).toBeUndefined();
        else expect(s.pin?.maxTier, s.id).toBe(10);
      }
    }
  });

  it('pins each verb unit to the tense its lesson teaches', () => {
    expect(findSkill('verbs-present')!.skill.pin?.verbCombos).toEqual([
      { tense: 'present', polarity: 'positive' },
    ]);
    expect(findSkill('verbs-negative')!.skill.pin?.verbCombos).toEqual([
      { tense: 'present', polarity: 'negative' },
    ]);
    expect(findSkill('verbs-past')!.skill.pin?.verbCombos?.every((c) => c.tense === 'past')).toBe(true);
  });

  it('places a Kertaus (mixed review) step every few units, mixing ALL earlier grammar steps', () => {
    const mixes = allSkills().filter(({ skill }) => skill.content.mix);
    expect(mixes.map(({ chapter }) => chapter.id)).toEqual(['not-having', 'school-day', 'moving', 'many']);
    for (const { chapter, skill } of mixes) {
      const ui = PATH.indexOf(chapter);
      const mixOf = skill.content.mixOf!;
      expect(mixOf.length, skill.id).toBeGreaterThan(2);
      for (const id of mixOf) {
        const found = findSkill(id)!;
        // Only EARLIER units' grammar steps — never words / scenes / other mixes.
        expect(PATH.indexOf(found.chapter), `${skill.id}: ${id}`).toBeLessThan(ui);
        expect(isMixable(found.skill), `${skill.id}: ${id}`).toBe(true);
      }
    }
    // The last Kertaus reaches back to the very first grammar unit.
    expect(mixes[mixes.length - 1].skill.content.mixOf).toContain('this-is');
  });

  it('rotates a Kertaus step through different earlier steps, segment by segment', () => {
    const { skill } = findSkill('moving-mix')!;
    const seen = new Set([0, 1, 2, 3, 4, 5].map((n) => mixStepFor(skill, n)!.skill.id));
    expect(seen.size).toBe(6); // six segments, six different earlier steps
    expect(mixStepFor(findSkill('this-is')!.skill, 0)).toBeUndefined();
  });

  it('keeps the expert depth in Mestari (L8–10 ladders)', () => {
    expect(findSkill('verbs-expert')!.skill.maxLevel).toBe(8);
    expect(findSkill('cases-expert')!.skill.maxLevel).toBe(10);
    expect(findSkill('spell-expert')!.skill.maxLevel).toBe(10);
    expect(findSkill('count-expert')!.skill.maxLevel).toBe(10);
    expect(findSkill('find-error-expert')!.skill.maxLevel).toBe(8);
  });

  it('finds a step and the unit it belongs to', () => {
    expect(findSkill('this-is')?.chapter.id).toBe('people');
    expect(findSkill('nope')).toBeUndefined();
  });

  it('derives the badge env from the course', () => {
    expect(badgeEnv.checkpointUnitIds).toHaveLength(PATH.filter((u) => u.checkpoint !== false).length);
    expect(badgeEnv.phraseStepIds).toContain('this-is');
    expect(badgeEnv.conversationStepIds).toContain('hello-talk');
    expect(badgeEnv.skillKinds['this-is']).toEqual(['build', 'order', 'spell', 'spell']);
  });
});

describe('rendering course steps', () => {
  it('renders a game element for every step at every level of its ladder', () => {
    for (const { skill } of allSkills()) {
      for (let level = 1; level <= (skill.maxLevel ?? 4); level++) {
        for (const kind of activitiesUpTo(skill, level)) {
          expect(renderActivity(skill, kind, () => {}), `${skill.id} L${level} ${kind}`).not.toBeNull();
        }
      }
    }
  });

  it('hands every game referentially-stable content props across re-renders', () => {
    // The games memoize their round on these props; a fresh array per render
    // would rebuild the round mid-question.
    for (const { skill } of allSkills()) {
      for (const level of [1, 3, 8]) {
        const a = renderSkill(skill, level, () => {});
        const b = renderSkill(skill, level, () => {});
        const pa = a!.props as Record<string, unknown>;
        const pb = b!.props as Record<string, unknown>;
        for (const k of ['items', 'constructions', 'nouns', 'adjectives', 'verbs', 'ids']) {
          expect(pa[k], `${skill.id} ${k} unstable`).toBe(pb[k]);
        }
      }
    }
  });

  it("a 'new words' step only shows its own unit's words", () => {
    const { skill } = findSkill('people-words')!;
    const el = renderActivity(skill, 'listen', () => {});
    const items = (el!.props as { items: { id: string }[] }).items;
    expect(items.length).toBeGreaterThan(0);
    const unitWords = new Set(findSkill('people-words')!.chapter.newWords);
    for (const i of items) expect(unitWords.has(i.id), i.id).toBe(true);
  });

  it('meets EVERY new word in its unit — picture-less words included', () => {
    // The fix: a words step hands its games every new word, and the picture
    // games fall back to the English word on the card when there's no emoji.
    for (const unit of PATH) {
      const step = unit.skills.find((s) => s.content.words === 'new');
      if (!step) continue;
      for (const kind of ['listen', 'name'] as const) {
        const el = renderActivity(step, kind, () => {});
        const ids = new Set((el!.props as { items: { id: string }[] }).items.map((i) => i.id));
        for (const w of unit.newWords) expect(ids.has(w), `${unit.id} ${kind}: ${w}`).toBe(true);
      }
    }
  });

  it('a practice step never draws a word the child has not met yet', () => {
    const found = findSkill('i-like')!; // unit 8
    const known = new Set(found.skill.content.wordIds);
    const el = renderActivity(found.skill, 'build', () => {});
    const items = (el!.props as { items: { id: string }[] }).items;
    for (const i of items) expect(known.has(i.id), i.id).toBe(true);
    // …and nothing from a later unit (places arrive in unit 12).
    expect(items.some((i) => i.id === 'library')).toBe(false);
  });

  it('keeps emoji-less words out of the games that NEED a picture (count / match / yes-no)', () => {
    const { skill } = findSkill('this-is')!;
    for (const activity of ['count', 'match', 'yesno'] as const) {
      const el = renderActivity(skill, activity, () => {});
      const props = el!.props as { items?: { emoji?: string }[]; nouns?: { emoji?: string }[] };
      const items = props.items ?? props.nouns ?? [];
      expect(items.length).toBeGreaterThan(0);
      for (const i of items) expect(i.emoji).toBeTruthy();
    }
  });

  it('scopes dialogue / scene / story steps to their own registry ids', () => {
    const el = renderActivity(findSkill('greetings')!.skill, 'dialogue', () => {});
    expect((el!.props as { ids: string[] }).ids).toContain('how-are-you');
    const st = renderActivity(findSkill('past-stories')!.skill, 'story', () => {});
    expect((st!.props as { ids: string[] }).ids).toEqual(['lost-dog', 'birthday-surprise']);
  });

  it('gives every grammar unit its own conversation scene — never the same scene twice', () => {
    const scenes = PATH.filter((u) => !['chatting', 'sentences', 'mestari'].includes(u.id)).map((u) => {
      const talk = u.skills.filter((s) => s.activity === 'conversation');
      expect(talk, u.id).toHaveLength(1);
      expect(talk[0].content.ids, u.id).toHaveLength(1);
      return talk[0].content.ids![0];
    });
    expect(new Set(scenes).size).toBe(scenes.length);
  });
});

describe('possessive endings in the course', () => {
  it('teaches "my / your" right after having — before verbs — with plain forms only', () => {
    const ids = PATH.map((u) => u.id);
    expect(ids.indexOf('whose')).toBe(ids.indexOf('not-having') + 1);
    const { skill } = findSkill('possessives')!;
    expect(skill.content.possessiveCases).toBe('never');
    // Its sentences use only "Tämä on…" — "Missä on…?" waits for the Where? unit.
    expect(findSkill('mine-yours')!.skill.content.constructionIds).not.toContain('where-is-yours');
  });

  it('adds "in my house" once the place endings are known', () => {
    const found = findSkill('in-my')!;
    expect(found.chapter.id).toBe('where');
    expect(found.skill.content.possessiveCases).toBe('always');
    expect(findSkill('where-is')!.skill.content.constructionIds).toContain('where-is-yours');
  });
});

describe('in-session game rotation', () => {
  it('unlocks the ramp as a GROWING set of game types, not one type per level', () => {
    const { skill } = findSkill('this-is')!; // ramp: build, order, spell, spell
    expect(activitiesUpTo(skill, 1)).toEqual(['build']);
    expect(activitiesUpTo(skill, 2)).toEqual(['build', 'order']);
    expect(activitiesUpTo(skill, 3)).toEqual(['build', 'order', 'spell']);
    expect(activitiesUpTo(skill, 99)).toEqual(['build', 'order', 'spell']);
  });

  it('makes a phrase step BUILD, ORDER and TYPE sentences before it counts as done', () => {
    // Done = its top level proven, and every game type is unlocked by then.
    for (const id of ['this-is', 'i-like', 'in-on', 'where-i-am', 'today-is']) {
      const { skill } = findSkill(id)!;
      expect(activitiesUpTo(skill, skill.maxLevel!), id).toEqual(['build', 'order', 'spell']);
      expect(skill.checkpoint, id).toBe('order');
    }
  });

  it('unlocks every game of a step\'s ladder by its top level (none skipped before "done")', () => {
    for (const unit of PATH) {
      for (const s of unit.skills) {
        if (!s.activities) continue;
        expect(activitiesUpTo(s, s.maxLevel ?? 4), s.id).toEqual([...new Set(s.activities)]);
      }
    }
  });

  it('a single-activity step always serves that one game', () => {
    const order = findSkill('order-expert')!.skill;
    expect(activitiesUpTo(order, 8)).toEqual(['order']);
    for (const n of [0, 1, 2, 5]) expect(activityForRound(order, 8, n)).toBe('order');
  });

  it('serves a VARIED, deterministic mix across a session', () => {
    const { skill } = findSkill('where-is')!;
    expect([0, 1, 2, 3].map((n) => activityForRound(skill, 4, n))).toEqual([
      'build',
      'order',
      'spell',
      'build',
    ]);
  });

  it('folds `say` in from level 2 only when speech is available — never on level 1', () => {
    const words = findSkill('people-words')!.skill;
    expect([0, 1, 2, 3].map((n) => activityForRound(words, 3, n))).not.toContain('say');
    expect(new Set([0, 1, 2, 3].map((n) => activityForRound(words, 3, n, true))).has('say')).toBe(true);
    expect(activityForRound(words, 1, 0, true)).toBe('listen');
  });

  it('marks every course step speakable and renders its `say` game', () => {
    for (const { skill } of allSkills()) {
      expect(isSpeakable(skill), skill.id).toBe(true);
      expect(renderActivity(skill, 'say', () => {}), skill.id).not.toBeNull();
    }
  });
});
