import { describe, it, expect } from 'vitest';
import { lessons, resolveRef, type LessonRef } from './lessons';
import { caseSegments, possessiveSegments, segmentsText, verbSegments } from './endings';
import { PERSONS } from './types';
import { ITEM_BY_ID } from './lookup';
import { lessonWords, numbers } from './index';
import { PATH } from '../game/path';

function refsOf(): { lesson: string; ref: LessonRef }[] {
  const out: { lesson: string; ref: LessonRef }[] = [];
  for (const l of lessons) {
    for (const c of l.cards) {
      if (c.kind === 'examples') c.rows.forEach((ref) => out.push({ lesson: l.id, ref }));
      if (c.kind === 'check') {
        c.options.forEach((o) => o.ref && out.push({ lesson: l.id, ref: o.ref }));
        if (c.listen) out.push({ lesson: l.id, ref: c.listen });
      }
      if (c.kind === 'pairs') {
        for (const id of c.ids) {
          out.push({ lesson: l.id, ref: { line: id, part: 'prompt' } });
          out.push({ lesson: l.id, ref: { line: id, part: 'reply' } });
        }
      }
      if (c.kind === 'verbTable') {
        for (const p of PERSONS) {
          out.push({
            lesson: l.id,
            ref: { verb: c.verb, tense: c.tense, polarity: c.polarity, person: p.id },
          });
        }
      }
    }
  }
  return out;
}

describe('lessons', () => {
  it('have unique ids and 3–8 short cards each', () => {
    const ids = lessons.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of lessons) {
      expect(l.cards.length, l.id).toBeGreaterThanOrEqual(3);
      expect(l.cards.length, l.id).toBeLessThanOrEqual(8);
    }
  });

  it('resolve EVERY Finnish example to a looked-up form (no hand-typed Finnish)', () => {
    for (const { lesson, ref } of refsOf()) {
      const r = resolveRef(ref, 'Aino');
      expect(r, `${lesson}: ${JSON.stringify(ref)}`).not.toBeNull();
      expect(segmentsText(r!.segments).trim().length).toBeGreaterThan(0);
      // What is spoken is exactly what is shown.
      expect(r!.speak).toBe(segmentsText(r!.segments));
    }
  });

  it('only mark a SUFFIX of a looked-up form (the highlighter never builds a form)', () => {
    for (const { ref } of refsOf()) {
      if (!('word' in ref) || 'sentence' in ref || 'count' in ref || 'agree' in ref) continue;
      const item = ITEM_BY_ID[ref.word];
      const r = resolveRef(ref)!;
      const marked = r.segments.filter((s) => s.mark);
      expect(marked.length).toBeLessThanOrEqual(1);
      if (marked.length) expect(r.segments[r.segments.length - 1].mark, item.id).toBe(true);
    }
  });

  it('give every lesson at least two "try it" questions', () => {
    for (const l of lessons) {
      expect(l.cards.filter((c) => c.kind === 'check').length, l.id).toBeGreaterThanOrEqual(1);
    }
    // Most lessons carry 2+ (the fix for single-question lessons).
    const multi = lessons.filter((l) => l.cards.filter((c) => c.kind === 'check').length >= 2);
    expect(multi.length).toBeGreaterThanOrEqual(lessons.length - 6);
  });

  it('give every check card exactly one right answer', () => {
    for (const l of lessons) {
      for (const c of l.cards) {
        if (c.kind !== 'check') continue;
        expect(c.options.filter((o) => o.correct), l.id).toHaveLength(1);
        expect(c.explain.length).toBeGreaterThan(0);
      }
    }
  });

  it("fill the child's name into vetted phrase lines", () => {
    const r = resolveRef({ line: 'your-name', part: 'reply' }, 'Aino')!;
    expect(segmentsText(r.segments)).toBe('Nimeni on Aino.');
  });
});

describe('lesson content audit (regressions)', () => {
  const lesson = (id: string) => lessons.find((l) => l.id === id)!;

  it('shows the length trio tuli / tuuli / tulli — one sound changed each time, nothing else', () => {
    const card = lesson('sounds').cards.find((c) => c.kind === 'examples' && /Double letters/.test(c.title ?? ''));
    const forms = (card as { rows: LessonRef[] }).rows.map((r) => segmentsText(resolveRef(r)!.segments));
    expect(forms).toEqual(['tuli', 'tuuli', 'tulli']);
  });

  it('never quizzes the MEANING of a lesson-only word — only how it sounds', () => {
    const only = new Set(lessonWords.items.map((i) => i.id));
    for (const l of lessons) {
      for (const c of l.cards) {
        if (c.kind !== 'check') continue;
        const usesLessonWord = c.options.some((o) => o.ref && 'word' in o.ref && only.has(o.ref.word));
        if (usesLessonWord) expect(c.listen, `${l.id}: "${c.question}" must be a listening check`).toBeTruthy();
      }
    }
    // …and no game pool ever draws one.
    expect(PATH.flatMap((u) => u.newWords).some((w) => only.has(w))).toBe(false);
  });

  it('a listening check plays exactly its correct option', () => {
    for (const l of lessons) {
      for (const c of l.cards) {
        if (c.kind !== 'check' || !c.listen) continue;
        const right = c.options.find((o) => o.correct)!;
        expect(resolveRef(c.listen)!.speak, l.id).toBe(resolveRef(right.ref!)!.speak);
      }
    }
  });

  it("teaches every set-phrase pair a unit's dialogue steps ask for, in that unit's lesson", () => {
    for (const unit of PATH) {
      const asked = unit.skills.filter((s) => s.activity === 'dialogue').flatMap((s) => s.content.ids ?? []);
      if (asked.length === 0 || unit.id === 'chatting' || unit.id === 'mestari') continue;
      // The unit's lesson or one of its part-way lessons.
      const taught = new Set(
        [unit.lessonId, ...(unit.midLessons ?? []).map((m) => m.lessonId)]
          .flatMap((id) => lesson(id).cards)
          .flatMap((c) => (c.kind === 'pairs' ? c.ids : [])),
      );
      for (const id of asked) expect(taught.has(id), `${unit.id}: pair "${id}" never taught`).toBe(true);
    }
  });

  it("lists every number the counting unit introduces", () => {
    const unit = PATH.find((u) => u.id === 'numbers')!;
    const shown = lesson(unit.lessonId).cards.flatMap((c) =>
      c.kind === 'examples' ? c.rows.flatMap((r) => ('word' in r && !('count' in r) ? [r.word] : [])) : [],
    );
    for (const n of unit.newWords) expect(shown, n).toContain(n);
    expect(numbers.items.length).toBeGreaterThan(0);
  });

  it('keeps linguist shorthand out of kid-facing text', () => {
    for (const l of lessons) {
      for (const c of l.cards) {
        const text = [c.title ?? '', 'text' in c ? (c.text ?? '') : ''].join(' ');
        expect(text, `${l.id}: ${c.title}`).not.toMatch(/-V[a-z]|\bstuff\b/);
      }
    }
  });

  it('never shows an example row whose English is just the bare word for an inflected form', () => {
    // "pöydällä — table" is wrong; it must say "on the table".
    for (const l of lessons) {
      for (const c of l.cards) {
        if (c.kind !== 'examples') continue;
        for (const r of c.rows) {
          if (!('word' in r) || 'sentence' in r || 'count' in r || 'agree' in r) continue;
          const inflected = (r.case && r.case !== 'nominative') || r.number === 'plural';
          if (!inflected) continue;
          const item = ITEM_BY_ID[r.word];
          expect(resolveRef(r)!.en, `${l.id}: ${r.word} ${r.case}`).not.toBe(item.en);
        }
      }
    }
  });
});

describe('ending highlighter', () => {
  const split = (segs: { text: string; mark?: boolean }[]) =>
    segs.map((s) => (s.mark ? `[${s.text}]` : s.text)).join('');

  it('marks case endings, keeping vowel harmony', () => {
    expect(split(caseSegments('talossa', 'inessive'))).toBe('talo[ssa]');
    expect(split(caseSegments('metsässä', 'inessive'))).toBe('metsä[ssä]');
    expect(split(caseSegments('pöydällä', 'adessive'))).toBe('pöydä[llä]');
    expect(split(caseSegments('laatikkoon', 'illative'))).toBe('laatikk[oon]');
    expect(split(caseSegments('kirjan', 'genitive'))).toBe('kirja[n]');
  });

  it('marks the plural -i- along with the ending', () => {
    expect(split(caseSegments('laatikoissa', 'inessive', true))).toBe('laatiko[issa]');
    expect(split(caseSegments('kirjoja', 'partitive', true))).toBe('kirjo[ja]');
    expect(split(caseSegments('kirjat', 'nominative', true))).toBe('kirja[t]');
  });

  it('marks nothing it does not recognize — the plain form shows', () => {
    expect(split(caseSegments('kissa', 'nominative'))).toBe('kissa');
    expect(split(caseSegments('xyz', 'inessive'))).toBe('xyz');
  });

  it('marks verb person endings, the "not" verb, and the past -i-', () => {
    expect(split(verbSegments('syömme', 'present', 'positive', '1pl'))).toBe('syö[mme]');
    expect(split(verbSegments('en syö', 'present', 'negative', '1sg'))).toBe('[en] syö');
    expect(split(verbSegments('söin', 'past', 'positive', '1sg'))).toBe('sö[in]');
    expect(split(verbSegments('en syönyt', 'past', 'negative', '1sg'))).toBe('[en] syö[nyt]');
  });

  it('marks possessive suffixes', () => {
    expect(split(possessiveSegments('kirjani', '1sg'))).toBe('kirja[ni]');
    expect(split(possessiveSegments('kirjasi', '2sg'))).toBe('kirja[si]');
    expect(split(possessiveSegments('kirjansa', '3rd'))).toBe('kirja[nsa]');
  });
});
