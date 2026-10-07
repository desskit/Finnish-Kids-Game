import { describe, expect, it } from 'vitest';
import type { Child } from '../state/storage';
import type { LexicalItem } from '../content/types';
import {
  UNITS,
  actionHref,
  checkpointPlan,
  lessonForConstruction,
  lessonForStep,
  midLessonStatus,
  nextAction,
  stepAfterLesson,
  stepStatus,
} from './course';
import { findSkill, renderActivity } from './path';
import { buildChooseRound } from './formChoice';
import { hasKpt, verbType } from '../content/verbTypes';
import { lessonById } from '../content/lessons';
import { verbTypeNote } from '../content/why';
import { verbs } from '../content';
import { nounConstructions } from '../content/constructions';
import { englishSentenceFor, sentenceFor } from '../content/types';
import { itemById } from '../content/lookup';

// The verbs units: types 1–3 (unit 8), type 4, types 5 & 6 — each with its
// consonant-change (KPT) verbs held back until a part-way lesson.

function child(over: Partial<Child> = {}): Child {
  return { id: 'k', name: 'K', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs: {}, ...over } as Child;
}
const doing = UNITS.find((u) => u.id === 'doing')!;
const prior = UNITS.slice(0, UNITS.indexOf(doing));
const passedAll = Object.fromEntries(prior.map((u) => [u.id, { passedAt: 1, best: 1, attempts: 1 }]));
const done = (ids: string[]) => ({
  doing: Object.fromEntries(ids.map((id) => [id, { plays: 3, level: 3, topProvenAt: 1, recent: [] }])),
});
const midAt = doing.skills.findIndex((s) => s.id === doing.midLessons![0].before);
const before = doing.skills.slice(0, midAt).map((s) => s.id);

const verbsOf = (stepId: string): LexicalItem[] => {
  const el = renderActivity(findSkill(stepId)!.skill, 'conjugate', () => {})!;
  return (el.props as { verbs: LexicalItem[] }).verbs;
};

describe('the verbs units', () => {
  it('unit 8 introduces types 1–3; type 4 and types 5–6 come later, each a unit of its own', () => {
    expect(UNITS.indexOf(doing)).toBe(7);
    const v4 = UNITS.findIndex((u) => u.id === 'verbs-4');
    const v56 = UNITS.findIndex((u) => u.id === 'verbs-5-6');
    expect(v4).toBeGreaterThan(7);
    expect(v56).toBeGreaterThan(v4);
    const typesIn = (unitId: string) =>
      new Set(UNITS.find((u) => u.id === unitId)!.newWords.map((w) => verbType(verbs.items.find((v) => v.id === w)!)));
    expect([...typesIn('doing')].sort()).toEqual([1, 2, 3]);
    expect([...typesIn('verbs-4')]).toEqual([4]);
    expect([...typesIn('verbs-5-6')].sort()).toEqual([5, 6]);
  });

  it('each type step drills only its own type, with no consonant change', () => {
    for (const [id, t] of [['verbs-type1', 1], ['verbs-type2', 2], ['verbs-type3', 3], ['verbs-type4', 4], ['verbs-type5', 5]] as const) {
      const vs = verbsOf(id);
      expect(vs.length, id).toBeGreaterThan(0);
      for (const v of vs) {
        expect(verbType(v), `${id}: ${v.fi}`).toBe(t);
        expect(hasKpt(v), `${id}: ${v.fi}`).toBe(false);
      }
    }
  });

  it('the KPT steps drill only verbs whose k / p / t changes', () => {
    for (const id of ['verbs-kpt-1-3', 'verbs-kpt-4', 'verbs-kpt-mix', 'verbs-kpt-6', 'verbs-kpt-all']) {
      const vs = verbsOf(id);
      expect(vs.length, id).toBeGreaterThan(1);
      for (const v of vs) expect(hasKpt(v), `${id}: ${v.fi}`).toBe(true);
    }
    expect(verbsOf('verbs-kpt-1-3').map((v) => v.fi)).toEqual(
      expect.arrayContaining(['nukkua', 'leikkiä', 'kirjoittaa', 'kuunnella']),
    );
  });

  it('no step before a part-way lesson meets a KPT verb', () => {
    for (const unit of UNITS.filter((u) => u.midLessons)) {
      const at = unit.skills.findIndex((s) => s.id === unit.midLessons![0].before);
      for (const step of unit.skills.slice(0, at)) {
        const ids = new Set(step.content.wordIds);
        for (const w of unit.skills.slice(at).flatMap((s) => s.content.only ?? [])) {
          expect(ids.has(w), `${unit.id}/${step.id}: ${w}`).toBe(false);
        }
      }
    }
  });

  it('"which type?" asks about real types and offers only the types taught so far', () => {
    const el = renderActivity(findSkill('which-type-1-3')!.skill, 'choose', () => {})!;
    const pools = el.props as Parameters<typeof buildChooseRound>[1];
    for (let r = 0; r < 20; r++) {
      for (const q of buildChooseRound('verb-type', pools, 6, 3)) {
        const v = verbs.items.find((x) => x.fi === q.said!.fi)!;
        expect(q.answer).toMatch(new RegExp(`^Tyyppi ${verbType(v)} ·`));
        for (const o of q.options) expect(o).toMatch(/^Tyyppi [123] ·/);
        for (const o of q.options.filter((x) => x !== q.answer)) expect(q.whyFor![o]).toBeTruthy();
        expect(q.spoken).toBe(v.fi);
      }
    }
  });

  it('every verb unit lesson and part-way lesson exists', () => {
    for (const unit of UNITS) {
      for (const m of unit.midLessons ?? []) {
        expect(lessonById[m.lessonId], m.lessonId).toBeTruthy();
        expect(unit.skills.some((s) => s.id === m.before), m.before).toBe(true);
      }
    }
  });
});

describe('a lesson part-way through a unit', () => {
  const kptLesson = doing.midLessons![0];

  it('stays locked until every step before it is done — and locks the steps after it', () => {
    const fresh = child({ course: { checkpoints: passedAll, lessonsSeen: { 'verb-persons': 1 } } });
    expect(midLessonStatus(fresh, doing, kptLesson)).toBe('locked');
    expect(stepStatus(fresh, doing, doing.skills[0])).toBe('open');
    expect(stepStatus(fresh, doing, doing.skills[midAt])).toBe('locked');

    const halfway = child({ progress: done(before), course: { checkpoints: passedAll, lessonsSeen: { 'verb-persons': 1 } } });
    expect(midLessonStatus(halfway, doing, kptLesson)).toBe('open');
    expect(stepStatus(halfway, doing, doing.skills[midAt])).toBe('locked');
    // Continue points at the lesson…
    const next = nextAction(halfway);
    expect(next.kind).toBe('lesson');
    expect(actionHref(next)).toBe(`/lesson/${kptLesson.lessonId}`);

    // …and once read, the steps after it open.
    const read = child({
      progress: done(before),
      course: { checkpoints: passedAll, lessonsSeen: { 'verb-persons': 1, [kptLesson.lessonId]: 1 } },
    });
    expect(midLessonStatus(read, doing, kptLesson)).toBe('done');
    expect(stepStatus(read, doing, doing.skills[midAt])).toBe('open');
    expect(actionHref(nextAction(read))).toBe(`/skill/${doing.skills[midAt].id}`);
  });

  it('leads into the step after it, and explains the steps after it', () => {
    expect(stepAfterLesson(kptLesson.lessonId)?.id).toBe(kptLesson.before);
    expect(stepAfterLesson(doing.lessonId)?.id).toBe(doing.skills[0].id);
    expect(lessonForStep(doing, doing.skills[0])).toBe(doing.lessonId);
    expect(lessonForStep(doing, doing.skills[midAt + 1])).toBe(kptLesson.lessonId);
  });
});

describe('the "Why?" note for verbs', () => {
  const v = (fi: string) => verbs.items.find((x) => x.fi === fi)!;
  it('names the type and shows the sourced forms', () => {
    expect(verbTypeNote(v('laulaa'))).toBe('Type 1: *laulaa* → *minä laulan*, *hän laulaa*.');
  });
  it('says which persons are weak / strong for a KPT verb', () => {
    expect(verbTypeNote(v('nukkua'))).toMatch(/kk → k.*minä nukun.*hän nukkuu/);
    expect(verbTypeNote(v('hypätä'))).toMatch(/STRONGER.*p → pp.*minä hyppään/);
  });
  it('calls the special verbs special', () => {
    expect(verbTypeNote(v('juosta'))).toMatch(/special.*juoksen/);
  });
});

describe('the unit audit: part-way lessons and checkpoint sizes', () => {
  it('uses every lesson once across the course — unit lessons and part-way lessons', () => {
    const ids = UNITS.flatMap((u) => [u.lessonId, ...(u.midLessons ?? []).map((m) => m.lessonId)]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(lessonById[id], id).toBeTruthy();
  });

  it('keeps every checkpoint between 8 and 18 questions', () => {
    for (const u of UNITS.filter((x) => x.checkpoint !== false)) {
      const n = checkpointPlan(u).reduce((sum, p) => sum + p.questions, 0);
      expect(n, u.id).toBeGreaterThanOrEqual(8);
      expect(n, u.id).toBeLessThanOrEqual(18);
    }
  });

  it('links a sentence pattern to the lesson that explains it', () => {
    expect(lessonForConstruction('i-like')).toBe('likes');
    expect(lessonForConstruction('i-love')).toBe('loving');
    expect(lessonForConstruction('i-wait-for')).toBe('watching-waiting');
    expect(lessonForConstruction('with-someone')).toBe('with-someone');
  });

  it('teaches the owner sentence with a natural English gloss', () => {
    const con = nounConstructions.find((c) => c.id === 'owner-thing')!;
    expect(englishSentenceFor(itemById('father')!, con)).toBe("This is Dad's bike.");
    expect(sentenceFor(itemById('father')!, con)).toBe('Tämä on isän pyörä.');
  });

  it('glosses "Tämä on punainen" as "This is red" (no article before a describing word)', () => {
    const thisIs = nounConstructions.find((c) => c.id === 'this-is')!;
    expect(englishSentenceFor(itemById('red')!, thisIs)).toBe('This is red.');
    expect(englishSentenceFor(itemById('old')!, thisIs)).toBe('This is old.');
    expect(englishSentenceFor(itemById('cat')!, thisIs)).toBe('This is a cat.');
  });
});
