import { describe, it, expect } from 'vitest';
import { YOUNGER_ORDER, pathFor, stepWordPool, type Chapter, type CourseOrder, type SkillNode } from './path';
import { nounConstructions } from '../content/constructions';
import { lessonById, lessons, type LessonRef } from '../content/lessons';
import { verbs } from '../content';
import { hasKpt, verbType } from '../content/verbTypes';
import { itemById } from '../content/lookup';
import { MOVED_STEPS, withMovedSteps } from '../state/storage';

// Younger and older readers meet the same units in different orders
// (path.tsx `YOUNGER_ORDER`), and a unit's content is the same in both. So a
// unit may only use what comes before it in BOTH orders: its words, the verb
// forms it asks, its endings, and what its lessons refer back to. These tests
// hold every unit to that, in both orders.

const ORDERS: readonly CourseOrder[] = ['older', 'younger'];
const conById = new Map(nounConstructions.map((c) => [c.id, c]));
const verbById = new Map(verbs.items.map((v) => [v.id, v]));

/** What a verb's forms need: its type, and its k/p/t change. */
function verbFeatures(id: string): string[] {
  const v = verbById.get(id);
  if (!v) return [];
  return [`verb type ${verbType(v)}`, ...(hasKpt(v) ? ['k/p/t change'] : [])];
}

/** A step that asks a verb's forms ("en syö", "syötkö?"), not just its picture. */
const conjugates = (s: SkillNode) =>
  [s.activity, ...(s.activities ?? [])].includes('conjugate') ||
  ['ask', 'answer', 'mood', 'verb-type'].includes(s.content.choose ?? '') ||
  s.content.hear === 'verbs';

const AGREEMENT_RAMP = ['nominative', 'genitive', 'partitive', 'inessive', 'illative', 'adessive', 'allative'];

/** The grammar a step asks for. */
function stepFeatures(s: SkillNode): string[] {
  const c = s.content;
  if (c.mixOf) return []; // a Kertaus replays earlier steps
  const f: string[] = [];
  const games = [s.activity, ...(s.activities ?? [])];
  for (const id of c.constructionIds ?? []) {
    const con = conById.get(id);
    f.push(`carrier ${id}`);
    if (con) f.push(`case ${con.case}${con.number === 'plural' ? ' plural' : ''}`, ...(con.possessor ? ['my/your ending'] : []));
  }
  if (games.includes('possessive')) f.push('my/your ending', ...(c.possessiveCases !== 'never' ? ['my/your after a place ending'] : []));
  // with no target cases, the agreement game asks every case on its ramp
  if (games.includes('match')) for (const k of c.agreementCases ?? AGREEMENT_RAMP) f.push(`case ${k}`);
  if (c.choose) f.push(`choose ${c.choose}`);
  for (const a of new Set(games)) f.push(`game ${a}`);
  for (const fr of c.frames ?? []) f.push(`frame ${fr}`);
  if (conjugates(s)) for (const id of stepWordPool(s)) f.push(...verbFeatures(id));
  return f;
}

/** The grammar a lesson example shows. */
function refFeatures(r: LessonRef): string[] {
  const x = r as Record<string, unknown>;
  const f: string[] = [];
  if ('word' in x && 'case' in x && !('agree' in x)) f.push(`case ${x.case}${x.number === 'plural' ? ' plural' : ''}`);
  if ('sentence' in x) {
    const con = conById.get(x.sentence as string);
    if (con) f.push(`case ${con.case}${con.number === 'plural' ? ' plural' : ''}`, ...(con.possessor ? ['my/your ending'] : []));
  }
  if ('verb' in x) f.push(...verbFeatures(x.verb as string), `tense ${x.tense}`);
  if ('possessive' in x) f.push('my/your ending', ...(x.case && x.case !== 'nominative' ? ['my/your after a place ending'] : []));
  if ('agree' in x) f.push(`case ${x.case}`);
  if ('ask' in x) f.push(...verbFeatures(x.ask as string));
  // "do" and "don't" are built from the I form; "let's" (-aan / -ään) is met whole
  if ('mood' in x && x.kind !== 'lets') f.push(...verbFeatures(x.mood as string));
  if ('owner' in x) f.push("owner's -n");
  if ('kpt' in x) f.push('k/p/t change', ...verbFeatures(x.kpt as string));
  if ('vtype' in x) f.push(...verbFeatures(x.vtype as string));
  return f;
}

const lessonsOf = (u: Chapter) => [u.lessonId, ...(u.midLessons ?? []).map((m) => m.lessonId)];

function lessonFeatures(id: string): string[] {
  const f: string[] = [];
  for (const c of lessonById[id]?.cards ?? []) {
    if (c.kind === 'examples') for (const r of c.rows) f.push(...refFeatures(r));
    if (c.kind === 'verbTable') f.push(...verbFeatures(c.verb), `tense ${c.tense}`);
    if (c.kind === 'check') {
      if (c.listen) f.push(...refFeatures(c.listen));
      for (const o of c.options) if (o.ref && o.correct) f.push(...refFeatures(o.ref));
    }
  }
  return f;
}

/** Everything a unit uses, with where (step or lesson). */
function unitFeatures(u: Chapter): Map<string, string[]> {
  const m = new Map<string, string[]>();
  const add = (f: string, where: string) => m.set(f, [...(m.get(f) ?? []), where]);
  for (const s of u.skills) for (const f of stepFeatures(s)) add(f, s.id);
  for (const l of lessonsOf(u)) for (const f of lessonFeatures(l)) add(f, `lesson ${l}`);
  return m;
}

// The unit that teaches each thing: where the original (older readers') order
// first uses it — or, where two units each teach it with their own lesson,
// either of them.
const ALSO_TAUGHT: Record<string, string[]> = {
  // -lla: "on" in Where?, "play with" in Play
  'case adessive': ['where'],
  // -a / -ä: after numbers, and after Rakastan
  'case partitive': ['numbers', 'likes'],
  // pick-the-ending: the Likes lesson ("every verb picks an ending")
  'game ending': ['likes'],
};
const TEACHER = new Map<string, string[]>();
for (const u of pathFor('older')) {
  for (const f of unitFeatures(u).keys()) if (!TEACHER.has(f)) TEACHER.set(f, [u.id, ...(ALSO_TAUGHT[f] ?? [])]);
}

describe('two course orders', () => {
  it('hold the same units, Mestari last, the younger one themes first', () => {
    const o = pathFor('older').map((u) => u.id);
    const y = pathFor('younger').map((u) => u.id);
    expect([...y].sort()).toEqual([...o].sort());
    expect(y).toEqual(YOUNGER_ORDER);
    expect(o.at(-1)).toBe('mestari');
    expect(y.at(-1)).toBe('mestari');
    // the themes a 6-year-old meets first
    for (const id of ['describing', 'likes', 'feelings', 'where', 'weather', 'body']) {
      expect(y.indexOf(id), id).toBeLessThan(11);
    }
    // my / your after in/on, weather and body
    for (const id of ['where', 'weather', 'body']) expect(y.indexOf('whose')).toBeGreaterThan(y.indexOf(id));
  });

  it('teach each hard part where it was taught before', () => {
    // pins the units the rule leans on, so a new use can't quietly become the "teacher"
    expect(TEACHER.get('my/your ending')?.[0]).toBe('whose');
    expect(TEACHER.get('my/your after a place ending')?.[0]).toBe('town');
    expect(TEACHER.get('case genitive')?.[0]).toBe('owners');
    expect(TEACHER.get('k/p/t change')?.[0]).toBe('doing-kpt');
    expect(TEACHER.get('verb type 4')?.[0]).toBe('verbs-4');
    expect(TEACHER.get('verb type 1')?.[0]).toBe('doing');
    expect(TEACHER.get('case inessive')?.[0]).toBe('where');
    expect(TEACHER.get('case illative')?.[0]).toBe('moving');
  });

  for (const order of ORDERS) {
    describe(`the ${order} readers' order`, () => {
      const units = pathFor(order);
      const at = (id: string) => units.findIndex((u) => u.id === id);

      it('uses no grammar before the unit that teaches it', () => {
        const early: string[] = [];
        units.forEach((u, i) => {
          for (const [f, where] of unitFeatures(u)) {
            const teachers = TEACHER.get(f)!;
            if (teachers.every((t) => at(t) > i)) early.push(`${u.id} (${i + 1}): ${f} — taught in ${teachers.join(' / ')} — ${[...new Set(where)].join(', ')}`);
          }
        });
        expect(early).toEqual([]);
      });

      it('asks a verb’s forms only once its family is taught', () => {
        const kpt = at('doing-kpt');
        const t4 = at('verbs-4');
        const t56 = at('verbs-5-6');
        const early: string[] = [];
        units.forEach((u, i) => {
          for (const s of u.skills.filter(conjugates)) {
            for (const id of stepWordPool(s)) {
              const v = verbById.get(id);
              if (!v) continue;
              const t = verbType(v) ?? 0;
              const needs = t >= 5 ? t56 : t === 4 ? t4 : hasKpt(v) ? kpt : -1;
              if (needs > i) early.push(`${u.id}/${s.id}: ${id}`);
            }
          }
        });
        expect(early).toEqual([]);
      });

      it('shows in its lessons only words met by then', () => {
        // The sounds lesson's words are about letters and their sounds, not
        // vocabulary; the dates lesson builds "21st" from two known words.
        const ALLOWED = new Set(['sounds', 'dates']);
        const known = new Set<string>();
        const early: string[] = [];
        units.forEach((u) => {
          for (const w of u.newWords) known.add(w);
          for (const l of lessonsOf(u)) {
            if (ALLOWED.has(l)) continue;
            for (const c of lessonById[l]?.cards ?? []) {
              const refs =
                c.kind === 'examples' ? c.rows : c.kind === 'check' ? [c.listen, ...c.options.map((o) => o.ref)] : [];
              for (const r of refs) {
                if (!r) continue;
                const x = r as Record<string, unknown>;
                for (const k of ['word', 'verb', 'possessive', 'agree', 'ask', 'mood', 'owner', 'thing', 'kpt', 'vtype', 'degree']) {
                  const id = x[k];
                  if (typeof id === 'string' && itemById(id) && !known.has(id)) early.push(`${u.id} / ${l}: ${id}`);
                }
              }
            }
          }
        });
        expect(early).toEqual([]);
      });

      it('meets every lesson after the lessons it refers back to', () => {
        // a lesson's place: its unit, then the unit's own lesson before its part-way ones
        const place = new Map<string, number>();
        units.forEach((u, i) => lessonsOf(u).forEach((l, k) => place.set(l, i * 100 + k)));
        const wrong: string[] = [];
        for (const l of lessons) {
          for (const r of l.requires ?? []) {
            expect(lessonById[r], `${l.id} requires ${r}`).toBeDefined();
            const a = place.get(l.id);
            const b = place.get(r);
            if (a === undefined) continue; // not in a course unit (math)
            if (b === undefined || b >= a) wrong.push(`${l.id} needs ${r}`);
          }
        }
        expect(wrong).toEqual([]);
      });
    });
  }

  it('marks the lessons that refer back to another', () => {
    for (const id of ['negation-object', 'in-my-house', 'into-out', 'feelings-on-me', 'owners', 'asking', 'body', 'kpt-4', 'by-with', 'town']) {
      expect(lessonById[id].requires?.length, id).toBeGreaterThan(0);
    }
  });
});

describe('steps that moved to another unit', () => {
  it('are in their new unit, in both orders', () => {
    for (const order of ORDERS) {
      for (const { step, from, to } of MOVED_STEPS) {
        const units = pathFor(order);
        expect(units.find((u) => u.id === to)!.skills.some((s) => s.id === step), `${order}: ${step} in ${to}`).toBe(true);
        expect(units.find((u) => u.id === from)!.skills.some((s) => s.id === step), `${order}: ${step} not in ${from}`).toBe(false);
      }
    }
  });

  it('carry a player’s progress with them, never overwriting', () => {
    const p = { plays: 2, bestStars: 3, totalStars: 6, totalPossible: 6, lastPlayed: 1, level: 3, recent: [], topProvenAt: 5 };
    const moved = withMovedSteps({ where: { 'in-on': p, 'in-my': p }, body: { 'my-nose': p } });
    expect(moved.where).toEqual({ 'in-on': p });
    expect(moved.town['in-my']).toEqual(p);
    expect(moved['school-daycare']['my-nose']).toEqual(p);
    const newer = { ...p, level: 1 };
    expect(withMovedSteps({ where: { 'in-my': p }, town: { 'in-my': newer } }).town['in-my']).toEqual(newer);
    // nothing to move: the same object back
    const none = { hello: { greetings: p } };
    expect(withMovedSteps(none)).toBe(none);
  });

  it('keeps Around town & home finished for a player who had finished it', () => {
    const p = { plays: 2, bestStars: 3, totalStars: 6, totalPossible: 6, lastPlayed: 1, level: 3, recent: [], topProvenAt: 5 };
    const done = withMovedSteps({ where: { 'where-is': p } }, { checkpoints: { town: { passedAt: 9, best: 1, attempts: 1 } } });
    expect(done.town['where-yours']).toEqual(p);
    // not yet there: "Where is your…?" waits to be played in town
    expect(withMovedSteps({ where: { 'where-is': p } }).town).toBeUndefined();
  });
});

describe('spiral review in both orders', () => {
  it('never goes more than five units without a Kertaus (mixed review)', () => {
    for (const order of ORDERS) {
      const units = pathFor(order);
      const at = units.map((u, i) => (u.skills.some((s) => s.content.mix) ? i : -1)).filter((i) => i >= 0);
      const stops = [0, ...at, units.length - 1];
      const gaps = stops.slice(1).map((x, i) => x - stops[i]);
      expect(Math.max(...gaps), `${order}: Kertaus at ${at.map((i) => i + 1).join(', ')}`).toBeLessThanOrEqual(5);
    }
  });

  it('mixes each Kertaus from the earlier units in the child’s own order', () => {
    for (const order of ORDERS) {
      const units = pathFor(order);
      units.forEach((u, i) => {
        const mix = u.skills.find((s) => s.content.mix);
        if (!mix) return;
        const earlier = new Set(units.slice(0, i).flatMap((x) => x.skills.map((s) => s.id)));
        for (const id of mix.content.mixOf ?? []) expect(earlier.has(id), `${order} ${u.id}: ${id}`).toBe(true);
      });
    }
  });
});
